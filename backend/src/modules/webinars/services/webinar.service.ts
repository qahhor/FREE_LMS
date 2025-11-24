import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webinar, WebinarProvider, WebinarStatus } from '../entities/webinar.entity';
import { WebinarParticipant, ParticipantRole, AttendanceStatus } from '../entities/webinar-participant.entity';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';

interface CreateWebinarDto {
  title: string;
  description?: string;
  provider: WebinarProvider;
  hostId: number;
  courseId?: number;
  scheduledAt: Date;
  durationMinutes: number;
  timezone?: string;
  settings?: {
    waitingRoom?: boolean;
    requirePassword?: boolean;
    allowRecording?: boolean;
    autoRecording?: boolean;
    muteOnEntry?: boolean;
    maxParticipants?: number;
  };
}

@Injectable()
export class WebinarService {
  private zoomApiUrl = 'https://api.zoom.us/v2';

  constructor(
    @InjectRepository(Webinar)
    private webinarRepository: Repository<Webinar>,
    @InjectRepository(WebinarParticipant)
    private participantRepository: Repository<WebinarParticipant>,
  ) {}

  /**
   * Create webinar
   */
  async createWebinar(dto: CreateWebinarDto): Promise<Webinar> {
    let providerData: any;
    let joinUrl: string;
    let startUrl: string;
    let meetingId: string;
    let meetingPassword: string;

    // Create meeting based on provider
    switch (dto.provider) {
      case WebinarProvider.ZOOM:
        providerData = await this.createZoomMeeting(dto);
        joinUrl = providerData.join_url;
        startUrl = providerData.start_url;
        meetingId = providerData.id.toString();
        meetingPassword = providerData.password;
        break;

      case WebinarProvider.JITSI:
        providerData = this.createJitsiMeeting(dto);
        joinUrl = providerData.join_url;
        startUrl = providerData.join_url; // Same for Jitsi
        meetingId = providerData.room_name;
        meetingPassword = null; // Jitsi doesn't require password by default
        break;

      default:
        throw new BadRequestException('Unsupported webinar provider');
    }

    // Create webinar record
    const webinar = this.webinarRepository.create({
      title: dto.title,
      description: dto.description,
      provider: dto.provider,
      hostId: dto.hostId,
      courseId: dto.courseId,
      scheduledAt: dto.scheduledAt,
      durationMinutes: dto.durationMinutes,
      timezone: dto.timezone || 'UTC',
      meetingId,
      meetingPassword,
      joinUrl,
      startUrl,
      waitingRoom: dto.settings?.waitingRoom ?? false,
      requirePassword: dto.settings?.requirePassword ?? true,
      allowRecording: dto.settings?.allowRecording ?? true,
      autoRecording: dto.settings?.autoRecording ?? false,
      muteOnEntry: dto.settings?.muteOnEntry ?? false,
      maxParticipants: dto.settings?.maxParticipants,
      status: WebinarStatus.SCHEDULED,
      providerData,
    });

    await this.webinarRepository.save(webinar);

    // Add host as participant
    await this.addParticipant(webinar.id, dto.hostId, ParticipantRole.HOST);

    return webinar;
  }

  /**
   * Create Zoom meeting
   */
  private async createZoomMeeting(dto: CreateWebinarDto): Promise<any> {
    const token = this.generateZoomToken();

    const response = await axios.post(
      `${this.zoomApiUrl}/users/me/meetings`,
      {
        topic: dto.title,
        type: 2, // Scheduled meeting
        start_time: dto.scheduledAt.toISOString(),
        duration: dto.durationMinutes,
        timezone: dto.timezone || 'UTC',
        agenda: dto.description,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: dto.settings?.muteOnEntry ?? false,
          watermark: false,
          use_pmi: false,
          approval_type: 0, // Automatically approve
          audio: 'both',
          auto_recording: dto.settings?.autoRecording ? 'cloud' : 'none',
          waiting_room: dto.settings?.waitingRoom ?? false,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  }

  /**
   * Create Jitsi meeting
   */
  private createJitsiMeeting(dto: CreateWebinarDto): any {
    const roomName = this.generateJitsiRoomName(dto.title);
    const jitsiDomain = process.env.JITSI_DOMAIN || 'meet.jit.si';

    return {
      room_name: roomName,
      join_url: `https://${jitsiDomain}/${roomName}`,
      domain: jitsiDomain,
    };
  }

  /**
   * Get webinar by ID
   */
  async getWebinar(id: number): Promise<Webinar> {
    const webinar = await this.webinarRepository.findOne({
      where: { id },
      relations: ['host', 'course'],
    });

    if (!webinar) {
      throw new NotFoundException('Webinar not found');
    }

    return webinar;
  }

  /**
   * Update webinar
   */
  async updateWebinar(id: number, updates: Partial<Webinar>): Promise<Webinar> {
    const webinar = await this.getWebinar(id);

    // Update provider if needed
    if (updates.scheduledAt || updates.durationMinutes || updates.title) {
      if (webinar.provider === WebinarProvider.ZOOM) {
        await this.updateZoomMeeting(webinar.meetingId, {
          topic: updates.title || webinar.title,
          start_time: updates.scheduledAt || webinar.scheduledAt,
          duration: updates.durationMinutes || webinar.durationMinutes,
        });
      }
    }

    Object.assign(webinar, updates);
    return this.webinarRepository.save(webinar);
  }

  /**
   * Update Zoom meeting
   */
  private async updateZoomMeeting(meetingId: string, updates: any): Promise<void> {
    const token = this.generateZoomToken();

    await axios.patch(`${this.zoomApiUrl}/meetings/${meetingId}`, updates, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Cancel webinar
   */
  async cancelWebinar(id: number): Promise<Webinar> {
    const webinar = await this.getWebinar(id);

    // Cancel on provider
    if (webinar.provider === WebinarProvider.ZOOM) {
      await this.cancelZoomMeeting(webinar.meetingId);
    }

    webinar.status = WebinarStatus.CANCELLED;
    return this.webinarRepository.save(webinar);
  }

  /**
   * Cancel Zoom meeting
   */
  private async cancelZoomMeeting(meetingId: string): Promise<void> {
    const token = this.generateZoomToken();

    await axios.delete(`${this.zoomApiUrl}/meetings/${meetingId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * Start webinar
   */
  async startWebinar(id: number): Promise<Webinar> {
    const webinar = await this.getWebinar(id);

    webinar.status = WebinarStatus.LIVE;
    webinar.startedAt = new Date();

    return this.webinarRepository.save(webinar);
  }

  /**
   * End webinar
   */
  async endWebinar(id: number): Promise<Webinar> {
    const webinar = await this.getWebinar(id);

    // End on provider
    if (webinar.provider === WebinarProvider.ZOOM) {
      await this.endZoomMeeting(webinar.meetingId);
    }

    webinar.status = WebinarStatus.ENDED;
    webinar.endedAt = new Date();

    // Update all present participants
    await this.participantRepository.update(
      {
        webinarId: id,
        isPresent: true,
      },
      {
        status: AttendanceStatus.LEFT,
        leftAt: new Date(),
        isPresent: false,
      },
    );

    return this.webinarRepository.save(webinar);
  }

  /**
   * End Zoom meeting
   */
  private async endZoomMeeting(meetingId: string): Promise<void> {
    const token = this.generateZoomToken();

    await axios.put(
      `${this.zoomApiUrl}/meetings/${meetingId}/status`,
      { action: 'end' },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );
  }

  /**
   * Add participant
   */
  async addParticipant(
    webinarId: number,
    userId: number,
    role: ParticipantRole = ParticipantRole.ATTENDEE,
  ): Promise<WebinarParticipant> {
    // Check if already registered
    const existing = await this.participantRepository.findOne({
      where: { webinarId, userId },
    });

    if (existing) {
      return existing;
    }

    const participant = this.participantRepository.create({
      webinarId,
      userId,
      role,
      status: AttendanceStatus.REGISTERED,
    });

    return this.participantRepository.save(participant);
  }

  /**
   * Remove participant
   */
  async removeParticipant(webinarId: number, userId: number): Promise<void> {
    await this.participantRepository.delete({ webinarId, userId });
  }

  /**
   * Join webinar
   */
  async joinWebinar(webinarId: number, userId: number): Promise<WebinarParticipant> {
    let participant = await this.participantRepository.findOne({
      where: { webinarId, userId },
    });

    if (!participant) {
      participant = await this.addParticipant(webinarId, userId);
    }

    participant.status = AttendanceStatus.JOINED;
    participant.joinedAt = new Date();
    participant.isPresent = true;

    await this.participantRepository.save(participant);

    // Update webinar statistics
    await this.updateWebinarStatistics(webinarId);

    return participant;
  }

  /**
   * Leave webinar
   */
  async leaveWebinar(webinarId: number, userId: number): Promise<WebinarParticipant> {
    const participant = await this.participantRepository.findOne({
      where: { webinarId, userId },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    participant.status = AttendanceStatus.LEFT;
    participant.leftAt = new Date();
    participant.isPresent = false;

    // Calculate duration
    if (participant.joinedAt) {
      const duration = Math.floor((participant.leftAt.getTime() - participant.joinedAt.getTime()) / 60000);
      participant.durationMinutes = duration;
    }

    return this.participantRepository.save(participant);
  }

  /**
   * Get webinar participants
   */
  async getParticipants(webinarId: number): Promise<WebinarParticipant[]> {
    return this.participantRepository.find({
      where: { webinarId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get user's webinars
   */
  async getUserWebinars(userId: number): Promise<Webinar[]> {
    const participations = await this.participantRepository.find({
      where: { userId },
      relations: ['webinar'],
    });

    return participations.map((p) => p.webinar);
  }

  /**
   * Update webinar statistics
   */
  private async updateWebinarStatistics(webinarId: number): Promise<void> {
    const participants = await this.participantRepository.find({
      where: { webinarId },
    });

    const totalParticipants = participants.length;
    const presentParticipants = participants.filter((p) => p.isPresent).length;

    const webinar = await this.getWebinar(webinarId);

    webinar.totalParticipants = totalParticipants;
    webinar.peakParticipants = Math.max(webinar.peakParticipants, presentParticipants);

    await this.webinarRepository.save(webinar);
  }

  /**
   * Get webinar recording
   */
  async getRecording(id: number): Promise<{ url: string; password?: string }> {
    const webinar = await this.getWebinar(id);

    if (webinar.provider === WebinarProvider.ZOOM) {
      const recordings = await this.getZoomRecordings(webinar.meetingId);

      if (recordings.length > 0) {
        webinar.recordingUrl = recordings[0].download_url;
        webinar.recordingPassword = recordings[0].password;
        await this.webinarRepository.save(webinar);

        return {
          url: recordings[0].download_url,
          password: recordings[0].password,
        };
      }
    }

    return {
      url: webinar.recordingUrl,
      password: webinar.recordingPassword,
    };
  }

  /**
   * Get Zoom recordings
   */
  private async getZoomRecordings(meetingId: string): Promise<any[]> {
    const token = this.generateZoomToken();

    const response = await axios.get(`${this.zoomApiUrl}/meetings/${meetingId}/recordings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.recording_files || [];
  }

  /**
   * Generate Zoom JWT token
   */
  private generateZoomToken(): string {
    const payload = {
      iss: process.env.ZOOM_API_KEY,
      exp: Date.now() + 3600000, // 1 hour
    };

    return jwt.sign(payload, process.env.ZOOM_API_SECRET);
  }

  /**
   * Generate Jitsi room name
   */
  private generateJitsiRoomName(title: string): string {
    const sanitized = title.replace(/[^a-zA-Z0-9]/g, '');
    const random = Math.random().toString(36).substring(2, 8);
    return `${sanitized}_${random}`;
  }
}
