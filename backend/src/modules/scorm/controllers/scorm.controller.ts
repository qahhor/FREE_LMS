import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ScormService } from '../services/scorm.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { Response } from 'express';
import * as path from 'path';

@Controller('scorm')
export class ScormController {
  constructor(private readonly scormService: ScormService) {}

  /**
   * Upload SCORM package
   */
  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPackage(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Body('courseId') courseId?: number,
    @Body('lessonId') lessonId?: number,
  ) {
    const pkg = await this.scormService.uploadScormPackage(file, courseId, lessonId);

    return {
      success: true,
      package: {
        id: pkg.id,
        identifier: pkg.identifier,
        title: pkg.title,
        description: pkg.description,
        version: pkg.version,
        launchUrl: pkg.launchUrl,
        scos: pkg.scos,
      },
    };
  }

  /**
   * Get SCORM package
   */
  @Get('packages/:id')
  @UseGuards(JwtAuthGuard)
  async getPackage(@Param('id') id: number) {
    const pkg = await this.scormService.getPackage(id);

    return {
      id: pkg.id,
      identifier: pkg.identifier,
      title: pkg.title,
      description: pkg.description,
      version: pkg.version,
      launchUrl: pkg.launchUrl,
      scos: pkg.scos,
      masteryScore: pkg.masteryScore,
      statistics: {
        totalAttempts: pkg.totalAttempts,
        averageScore: pkg.averageScore,
        completionRate: pkg.completionRate,
      },
    };
  }

  /**
   * Launch SCORM package
   */
  @Post('packages/:id/launch')
  @UseGuards(JwtAuthGuard)
  async launchPackage(
    @CurrentUser() user: User,
    @Param('id') id: number,
    @Body('scoId') scoId?: string,
  ) {
    const tracking = await this.scormService.initializeSession(id, user.id, scoId);

    return {
      success: true,
      trackingId: tracking.id,
      launchUrl: `/scorm/player/${tracking.id}`,
      attemptNumber: tracking.attemptNumber,
      entryMode: tracking.entryMode,
    };
  }

  /**
   * SCORM API - Initialize
   */
  @Post('api/:trackingId/initialize')
  async scormInitialize(@Param('trackingId') trackingId: number) {
    return {
      result: 'true',
      errorCode: '0',
    };
  }

  /**
   * SCORM API - Get Value
   */
  @Get('api/:trackingId/get')
  async scormGetValue(
    @Param('trackingId') trackingId: number,
    @Query('element') element: string,
  ) {
    try {
      const value = await this.scormService.getCmiValue(trackingId, element);

      return {
        result: value.toString(),
        errorCode: '0',
      };
    } catch (error) {
      return {
        result: '',
        errorCode: '201', // General error
      };
    }
  }

  /**
   * SCORM API - Set Value
   */
  @Post('api/:trackingId/set')
  async scormSetValue(
    @Param('trackingId') trackingId: number,
    @Body('element') element: string,
    @Body('value') value: any,
  ) {
    try {
      await this.scormService.setCmiValue(trackingId, element, value);

      return {
        result: 'true',
        errorCode: '0',
      };
    } catch (error) {
      return {
        result: 'false',
        errorCode: '201', // General error
      };
    }
  }

  /**
   * SCORM API - Commit
   */
  @Post('api/:trackingId/commit')
  async scormCommit(@Param('trackingId') trackingId: number) {
    return {
      result: 'true',
      errorCode: '0',
    };
  }

  /**
   * SCORM API - Terminate
   */
  @Post('api/:trackingId/terminate')
  async scormTerminate(@Param('trackingId') trackingId: number) {
    try {
      await this.scormService.terminateSession(trackingId);

      return {
        result: 'true',
        errorCode: '0',
      };
    } catch (error) {
      return {
        result: 'false',
        errorCode: '201',
      };
    }
  }

  /**
   * Get user progress
   */
  @Get('packages/:id/progress')
  @UseGuards(JwtAuthGuard)
  async getUserProgress(@CurrentUser() user: User, @Param('id') id: number) {
    const progress = await this.scormService.getUserProgress(id, user.id);

    return {
      attempts: progress.map((p) => ({
        attemptNumber: p.attemptNumber,
        status: p.status,
        score: p.score,
        progress: p.progress,
        totalTime: p.totalTime,
        startedAt: p.startedAt,
        lastAccessedAt: p.lastAccessedAt,
        completedAt: p.completedAt,
        isCompleted: p.isCompleted,
        isPassed: p.isPassed,
      })),
    };
  }

  /**
   * Serve SCORM content
   */
  @Get('content/:trackingId/*')
  async serveScormContent(
    @Param('trackingId') trackingId: number,
    @Param('0') filePath: string,
    @Res() res: Response,
  ) {
    // Get tracking to find package
    const tracking = await this.scormService['scormTrackingRepository'].findOne({
      where: { id: trackingId },
      relations: ['package'],
    });

    if (!tracking) {
      return res.status(404).send('Content not found');
    }

    const fullPath = path.join(tracking.package.extractedPath, filePath);

    return res.sendFile(fullPath);
  }
}
