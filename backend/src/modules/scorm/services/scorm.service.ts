import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScormPackage, ScormVersion } from '../entities/scorm-package.entity';
import { ScormTracking, ScormStatus } from '../entities/scorm-tracking.entity';
import * as AdmZip from 'adm-zip';
import * as xml2js from 'xml2js';
import * as path from 'path';
import * as fs from 'fs-extra';

interface ScormCmiData {
  [key: string]: any;
}

@Injectable()
export class ScormService {
  constructor(
    @InjectRepository(ScormPackage)
    private scormPackageRepository: Repository<ScormPackage>,
    @InjectRepository(ScormTracking)
    private scormTrackingRepository: Repository<ScormTracking>,
  ) {}

  /**
   * Upload and process SCORM package
   */
  async uploadScormPackage(
    file: Express.Multer.File,
    courseId?: number,
    lessonId?: number,
  ): Promise<ScormPackage> {
    // Extract zip file
    const extractPath = path.join(process.env.SCORM_STORAGE_PATH || '/tmp/scorm', Date.now().toString());
    await fs.ensureDir(extractPath);

    try {
      const zip = new AdmZip(file.buffer);
      zip.extractAllTo(extractPath, true);

      // Find and parse imsmanifest.xml
      const manifestPath = path.join(extractPath, 'imsmanifest.xml');

      if (!await fs.pathExists(manifestPath)) {
        throw new BadRequestException('Invalid SCORM package: imsmanifest.xml not found');
      }

      const manifestXml = await fs.readFile(manifestPath, 'utf-8');
      const parser = new xml2js.Parser({ explicitArray: false });
      const manifest = await parser.parseStringPromise(manifestXml);

      // Extract package information
      const metadata = manifest.manifest.metadata || {};
      const organizations = manifest.manifest.organizations?.organization || [];
      const resources = manifest.manifest.resources?.resource || [];

      // Detect SCORM version
      const version = this.detectScormVersion(manifest);

      // Find default organization
      const defaultOrg = Array.isArray(organizations) ? organizations[0] : organizations;

      // Extract SCOs
      const scos = this.extractScos(defaultOrg, resources);

      // Find launch URL
      const launchUrl = this.findLaunchUrl(scos[0], extractPath);

      // Create package record
      const scormPackage = this.scormPackageRepository.create({
        identifier: manifest.manifest.$.identifier,
        title: metadata.title || defaultOrg.title || 'Untitled SCORM Package',
        description: metadata.description || '',
        version,
        courseId,
        lessonId,
        packageUrl: file.path || `/uploads/scorm/${Date.now()}.zip`,
        extractedPath: extractPath,
        launchUrl,
        manifest: {
          identifier: manifest.manifest.$.identifier,
          version: manifest.manifest.$.version,
          metadata,
          organizations: Array.isArray(organizations) ? organizations : [organizations],
          resources: Array.isArray(resources) ? resources : [resources],
        },
        scos,
        masteryScore: this.extractMasteryScore(scos[0]),
        isActive: true,
      });

      await this.scormPackageRepository.save(scormPackage);

      return scormPackage;
    } catch (error) {
      // Clean up on error
      await fs.remove(extractPath);
      throw error;
    }
  }

  /**
   * Get SCORM package
   */
  async getPackage(packageId: number): Promise<ScormPackage> {
    const pkg = await this.scormPackageRepository.findOne({
      where: { id: packageId },
    });

    if (!pkg) {
      throw new NotFoundException('SCORM package not found');
    }

    return pkg;
  }

  /**
   * Initialize SCORM session
   */
  async initializeSession(packageId: number, userId: number, scoId?: string): Promise<ScormTracking> {
    const pkg = await this.getPackage(packageId);

    // Get or create tracking record
    const sco = scoId || pkg.scos[0]?.identifier;

    let tracking = await this.scormTrackingRepository.findOne({
      where: {
        packageId,
        userId,
        scoId: sco,
      },
      order: { attemptNumber: 'DESC' },
    });

    if (!tracking || tracking.status === ScormStatus.COMPLETED || tracking.status === ScormStatus.PASSED) {
      // Create new attempt
      const attemptNumber = tracking ? tracking.attemptNumber + 1 : 1;

      tracking = this.scormTrackingRepository.create({
        packageId,
        userId,
        scoId: sco,
        attemptNumber,
        status: ScormStatus.INCOMPLETE,
        entryMode: 'ab-initio',
        lessonMode: 'normal',
        creditMode: 'credit',
        startedAt: new Date(),
        lastAccessedAt: new Date(),
      });
    } else {
      // Resume existing attempt
      tracking.entryMode = 'resume';
      tracking.lastAccessedAt = new Date();
    }

    await this.scormTrackingRepository.save(tracking);

    return tracking;
  }

  /**
   * Set SCORM value (CMI data)
   */
  async setCmiValue(trackingId: number, element: string, value: any): Promise<void> {
    const tracking = await this.scormTrackingRepository.findOne({
      where: { id: trackingId },
    });

    if (!tracking) {
      throw new NotFoundException('Tracking session not found');
    }

    // Map CMI element to tracking field
    switch (element) {
      case 'cmi.core.lesson_status':
      case 'cmi.completion_status':
        tracking.status = this.mapStatus(value);
        tracking.completionStatus = value;
        if (value === 'completed') {
          tracking.isCompleted = true;
          tracking.completedAt = new Date();
        }
        break;

      case 'cmi.core.score.raw':
      case 'cmi.score.raw':
        tracking.scoreRaw = parseFloat(value);
        tracking.score = tracking.scoreMax
          ? (tracking.scoreRaw / tracking.scoreMax) * 100
          : tracking.scoreRaw;
        break;

      case 'cmi.core.score.min':
      case 'cmi.score.min':
        tracking.scoreMin = parseFloat(value);
        break;

      case 'cmi.core.score.max':
      case 'cmi.score.max':
        tracking.scoreMax = parseFloat(value);
        break;

      case 'cmi.success_status':
        tracking.successStatus = value;
        tracking.isPassed = value === 'passed';
        break;

      case 'cmi.core.lesson_location':
      case 'cmi.location':
        tracking.lessonLocation = value;
        break;

      case 'cmi.suspend_data':
        tracking.suspendData = value;
        break;

      case 'cmi.core.session_time':
      case 'cmi.session_time':
        tracking.sessionTime = this.parseScormTime(value);
        tracking.totalTime += tracking.sessionTime;
        break;

      case 'cmi.core.exit':
      case 'cmi.exit':
        tracking.exit = value;
        break;

      case 'cmi.progress_measure':
        tracking.progress = parseFloat(value) * 100;
        break;

      default:
        // Handle interactions, objectives, comments
        if (element.startsWith('cmi.interactions')) {
          this.handleInteraction(tracking, element, value);
        } else if (element.startsWith('cmi.objectives')) {
          this.handleObjective(tracking, element, value);
        } else if (element.startsWith('cmi.comments')) {
          this.handleComment(tracking, element, value);
        }
        break;
    }

    tracking.lastAccessedAt = new Date();
    await this.scormTrackingRepository.save(tracking);
  }

  /**
   * Get SCORM value (CMI data)
   */
  async getCmiValue(trackingId: number, element: string): Promise<any> {
    const tracking = await this.scormTrackingRepository.findOne({
      where: { id: trackingId },
      relations: ['package'],
    });

    if (!tracking) {
      throw new NotFoundException('Tracking session not found');
    }

    // Map tracking field to CMI element
    switch (element) {
      case 'cmi.core.lesson_status':
      case 'cmi.completion_status':
        return tracking.completionStatus || 'incomplete';

      case 'cmi.core.score.raw':
      case 'cmi.score.raw':
        return tracking.scoreRaw || 0;

      case 'cmi.core.score.min':
      case 'cmi.score.min':
        return tracking.scoreMin || 0;

      case 'cmi.core.score.max':
      case 'cmi.score.max':
        return tracking.scoreMax || 100;

      case 'cmi.success_status':
        return tracking.successStatus || 'unknown';

      case 'cmi.core.lesson_location':
      case 'cmi.location':
        return tracking.lessonLocation || '';

      case 'cmi.suspend_data':
        return tracking.suspendData || '';

      case 'cmi.core.total_time':
      case 'cmi.total_time':
        return this.formatScormTime(tracking.totalTime);

      case 'cmi.core.entry':
      case 'cmi.entry':
        return tracking.entryMode;

      case 'cmi.core.lesson_mode':
      case 'cmi.mode':
        return tracking.lessonMode;

      case 'cmi.core.credit':
      case 'cmi.credit':
        return tracking.creditMode;

      case 'cmi.launch_data':
        return tracking.launchData || '';

      case 'cmi.learner_id':
        return tracking.userId.toString();

      case 'cmi.learner_name':
        return `${tracking.user?.firstName || ''} ${tracking.user?.lastName || ''}`.trim();

      case 'cmi.progress_measure':
        return tracking.progress / 100;

      default:
        return '';
    }
  }

  /**
   * Terminate SCORM session
   */
  async terminateSession(trackingId: number): Promise<void> {
    const tracking = await this.scormTrackingRepository.findOne({
      where: { id: trackingId },
    });

    if (!tracking) {
      throw new NotFoundException('Tracking session not found');
    }

    tracking.lastAccessedAt = new Date();

    // Update package statistics
    await this.updatePackageStatistics(tracking.packageId);

    await this.scormTrackingRepository.save(tracking);
  }

  /**
   * Get user progress
   */
  async getUserProgress(packageId: number, userId: number): Promise<ScormTracking[]> {
    return this.scormTrackingRepository.find({
      where: { packageId, userId },
      order: { attemptNumber: 'DESC' },
    });
  }

  /**
   * Detect SCORM version from manifest
   */
  private detectScormVersion(manifest: any): ScormVersion {
    const schemaVersion = manifest.manifest.metadata?.schemaversion;

    if (schemaVersion) {
      if (schemaVersion.includes('1.2')) return ScormVersion.SCORM_1_2;
      if (schemaVersion.includes('2004') || schemaVersion.includes('1.3')) return ScormVersion.SCORM_2004;
    }

    // Check namespace
    const xmlns = manifest.manifest.$?.xmlns;
    if (xmlns?.includes('2004')) return ScormVersion.SCORM_2004;

    return ScormVersion.SCORM_1_2; // Default
  }

  /**
   * Extract SCOs from organization
   */
  private extractScos(organization: any, resources: any[]): any[] {
    const scos: any[] = [];

    const extractItems = (items: any[]) => {
      if (!items) return;

      const itemArray = Array.isArray(items) ? items : [items];

      for (const item of itemArray) {
        if (item.$ && item.$.identifierref) {
          const resource = (Array.isArray(resources) ? resources : [resources]).find(
            (r) => r.$.identifier === item.$.identifierref,
          );

          if (resource) {
            scos.push({
              identifier: item.$.identifier,
              title: item.title || 'Untitled SCO',
              href: resource.$.href,
              prerequisites: item.prerequisites,
              maxtimeallowed: item.maxtimeallowed,
              timelimitaction: item.timelimitaction,
              datafromlms: item.datafromlms,
              masteryscore: item.masteryscore,
            });
          }
        }

        if (item.item) {
          extractItems(Array.isArray(item.item) ? item.item : [item.item]);
        }
      }
    };

    if (organization?.item) {
      extractItems(Array.isArray(organization.item) ? organization.item : [organization.item]);
    }

    return scos;
  }

  /**
   * Find launch URL
   */
  private findLaunchUrl(sco: any, extractPath: string): string {
    return `${extractPath}/${sco.href}`;
  }

  /**
   * Extract mastery score
   */
  private extractMasteryScore(sco: any): number | null {
    return sco?.masteryscore ? parseFloat(sco.masteryscore) : null;
  }

  /**
   * Map SCORM status to internal status
   */
  private mapStatus(scormStatus: string): ScormStatus {
    const statusMap = {
      'not attempted': ScormStatus.NOT_ATTEMPTED,
      'incomplete': ScormStatus.INCOMPLETE,
      'completed': ScormStatus.COMPLETED,
      'passed': ScormStatus.PASSED,
      'failed': ScormStatus.FAILED,
      'browsed': ScormStatus.BROWSED,
    };

    return statusMap[scormStatus.toLowerCase()] || ScormStatus.INCOMPLETE;
  }

  /**
   * Parse SCORM time format (HH:MM:SS or PTxHxMxS)
   */
  private parseScormTime(time: string): number {
    if (time.startsWith('PT')) {
      // ISO 8601 duration
      const hours = parseInt(time.match(/(\d+)H/)?.[1] || '0');
      const minutes = parseInt(time.match(/(\d+)M/)?.[1] || '0');
      const seconds = parseInt(time.match(/(\d+)S/)?.[1] || '0');
      return hours * 3600 + minutes * 60 + seconds;
    } else {
      // HH:MM:SS format
      const parts = time.split(':').map(Number);
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
  }

  /**
   * Format time to SCORM format
   */
  private formatScormTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Handle interaction data
   */
  private handleInteraction(tracking: ScormTracking, element: string, value: any): void {
    // Parse interaction index and field
    const match = element.match(/cmi\.interactions\.(\d+)\.(.+)/);
    if (!match) return;

    const index = parseInt(match[1]);
    const field = match[2];

    if (!tracking.interactions) {
      tracking.interactions = [];
    }

    if (!tracking.interactions[index]) {
      tracking.interactions[index] = { id: '', type: '' };
    }

    tracking.interactions[index][field] = value;
  }

  /**
   * Handle objective data
   */
  private handleObjective(tracking: ScormTracking, element: string, value: any): void {
    const match = element.match(/cmi\.objectives\.(\d+)\.(.+)/);
    if (!match) return;

    const index = parseInt(match[1]);
    const field = match[2];

    if (!tracking.objectives) {
      tracking.objectives = [];
    }

    if (!tracking.objectives[index]) {
      tracking.objectives[index] = { id: '' };
    }

    tracking.objectives[index][field] = value;
  }

  /**
   * Handle comment data
   */
  private handleComment(tracking: ScormTracking, element: string, value: any): void {
    const match = element.match(/cmi\.comments(?:_from_learner)?\.(\d+)\.(.+)/);
    if (!match) return;

    const index = parseInt(match[1]);
    const field = match[2];

    if (!tracking.comments) {
      tracking.comments = [];
    }

    if (!tracking.comments[index]) {
      tracking.comments[index] = { comment: '' };
    }

    tracking.comments[index][field] = value;
  }

  /**
   * Update package statistics
   */
  private async updatePackageStatistics(packageId: number): Promise<void> {
    const trackings = await this.scormTrackingRepository.find({
      where: { packageId },
    });

    const totalAttempts = trackings.length;
    const completedAttempts = trackings.filter((t) => t.isCompleted).length;
    const scoresWithValues = trackings.filter((t) => t.score !== null).map((t) => t.score);

    const pkg = await this.scormPackageRepository.findOne({
      where: { id: packageId },
    });

    if (pkg) {
      pkg.totalAttempts = totalAttempts;
      pkg.completionRate = totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0;
      pkg.averageScore = scoresWithValues.length > 0
        ? scoresWithValues.reduce((a, b) => a + b, 0) / scoresWithValues.length
        : null;

      await this.scormPackageRepository.save(pkg);
    }
  }
}
