import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { WebinarService } from '../services/webinar.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { WebinarProvider } from '../entities/webinar.entity';
import { ParticipantRole } from '../entities/webinar-participant.entity';

@Controller('webinars')
export class WebinarController {
  constructor(private readonly webinarService: WebinarService) {}

  /**
   * Create webinar
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createWebinar(
    @CurrentUser() user: User,
    @Body()
    body: {
      title: string;
      description?: string;
      provider: WebinarProvider;
      courseId?: number;
      scheduledAt: string;
      durationMinutes: number;
      timezone?: string;
      settings?: any;
    },
  ) {
    const webinar = await this.webinarService.createWebinar({
      title: body.title,
      description: body.description,
      provider: body.provider,
      hostId: user.id,
      courseId: body.courseId,
      scheduledAt: new Date(body.scheduledAt),
      durationMinutes: body.durationMinutes,
      timezone: body.timezone,
      settings: body.settings,
    });

    return {
      success: true,
      webinar: {
        id: webinar.id,
        title: webinar.title,
        provider: webinar.provider,
        scheduledAt: webinar.scheduledAt,
        durationMinutes: webinar.durationMinutes,
        joinUrl: webinar.joinUrl,
        startUrl: webinar.startUrl,
        meetingId: webinar.meetingId,
        meetingPassword: webinar.meetingPassword,
        status: webinar.status,
      },
    };
  }

  /**
   * Get webinar
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getWebinar(@Param('id') id: number) {
    const webinar = await this.webinarService.getWebinar(id);

    return {
      id: webinar.id,
      title: webinar.title,
      description: webinar.description,
      provider: webinar.provider,
      host: {
        id: webinar.host.id,
        firstName: webinar.host.firstName,
        lastName: webinar.host.lastName,
        email: webinar.host.email,
      },
      scheduledAt: webinar.scheduledAt,
      durationMinutes: webinar.durationMinutes,
      timezone: webinar.timezone,
      joinUrl: webinar.joinUrl,
      startUrl: webinar.startUrl,
      meetingId: webinar.meetingId,
      status: webinar.status,
      statistics: {
        totalParticipants: webinar.totalParticipants,
        peakParticipants: webinar.peakParticipants,
      },
      recordingUrl: webinar.recordingUrl,
      startedAt: webinar.startedAt,
      endedAt: webinar.endedAt,
      createdAt: webinar.createdAt,
    };
  }

  /**
   * Update webinar
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateWebinar(
    @CurrentUser() user: User,
    @Param('id') id: number,
    @Body() body: Partial<any>,
  ) {
    // Parse scheduledAt if provided
    if (body.scheduledAt) {
      body.scheduledAt = new Date(body.scheduledAt);
    }

    const webinar = await this.webinarService.updateWebinar(id, body);

    return {
      success: true,
      webinar: {
        id: webinar.id,
        title: webinar.title,
        scheduledAt: webinar.scheduledAt,
        durationMinutes: webinar.durationMinutes,
      },
    };
  }

  /**
   * Cancel webinar
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async cancelWebinar(@CurrentUser() user: User, @Param('id') id: number) {
    const webinar = await this.webinarService.cancelWebinar(id);

    return {
      success: true,
      message: 'Webinar cancelled',
      webinar: {
        id: webinar.id,
        status: webinar.status,
      },
    };
  }

  /**
   * Start webinar
   */
  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  async startWebinar(@CurrentUser() user: User, @Param('id') id: number) {
    const webinar = await this.webinarService.startWebinar(id);

    return {
      success: true,
      message: 'Webinar started',
      webinar: {
        id: webinar.id,
        status: webinar.status,
        startedAt: webinar.startedAt,
      },
    };
  }

  /**
   * End webinar
   */
  @Post(':id/end')
  @UseGuards(JwtAuthGuard)
  async endWebinar(@CurrentUser() user: User, @Param('id') id: number) {
    const webinar = await this.webinarService.endWebinar(id);

    return {
      success: true,
      message: 'Webinar ended',
      webinar: {
        id: webinar.id,
        status: webinar.status,
        endedAt: webinar.endedAt,
      },
    };
  }

  /**
   * Register for webinar
   */
  @Post(':id/register')
  @UseGuards(JwtAuthGuard)
  async registerForWebinar(@CurrentUser() user: User, @Param('id') id: number) {
    const participant = await this.webinarService.addParticipant(id, user.id);

    return {
      success: true,
      message: 'Registered for webinar',
      participant: {
        id: participant.id,
        status: participant.status,
        role: participant.role,
      },
    };
  }

  /**
   * Join webinar
   */
  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async joinWebinar(@CurrentUser() user: User, @Param('id') id: number) {
    const participant = await this.webinarService.joinWebinar(id, user.id);
    const webinar = await this.webinarService.getWebinar(id);

    return {
      success: true,
      message: 'Joined webinar',
      joinUrl: webinar.joinUrl,
      participant: {
        id: participant.id,
        status: participant.status,
        joinedAt: participant.joinedAt,
      },
    };
  }

  /**
   * Leave webinar
   */
  @Post(':id/leave')
  @UseGuards(JwtAuthGuard)
  async leaveWebinar(@CurrentUser() user: User, @Param('id') id: number) {
    const participant = await this.webinarService.leaveWebinar(id, user.id);

    return {
      success: true,
      message: 'Left webinar',
      participant: {
        id: participant.id,
        status: participant.status,
        durationMinutes: participant.durationMinutes,
      },
    };
  }

  /**
   * Get webinar participants
   */
  @Get(':id/participants')
  @UseGuards(JwtAuthGuard)
  async getParticipants(@Param('id') id: number) {
    const participants = await this.webinarService.getParticipants(id);

    return {
      participants: participants.map((p) => ({
        id: p.id,
        user: p.user
          ? {
              id: p.user.id,
              firstName: p.user.firstName,
              lastName: p.user.lastName,
              email: p.user.email,
            }
          : {
              name: p.guestName,
              email: p.guestEmail,
            },
        role: p.role,
        status: p.status,
        joinedAt: p.joinedAt,
        leftAt: p.leftAt,
        durationMinutes: p.durationMinutes,
        isPresent: p.isPresent,
      })),
    };
  }

  /**
   * Get user's webinars
   */
  @Get('user/me')
  @UseGuards(JwtAuthGuard)
  async getUserWebinars(@CurrentUser() user: User) {
    const webinars = await this.webinarService.getUserWebinars(user.id);

    return {
      webinars: webinars.map((w) => ({
        id: w.id,
        title: w.title,
        provider: w.provider,
        scheduledAt: w.scheduledAt,
        durationMinutes: w.durationMinutes,
        status: w.status,
        joinUrl: w.joinUrl,
      })),
    };
  }

  /**
   * Get webinar recording
   */
  @Get(':id/recording')
  @UseGuards(JwtAuthGuard)
  async getRecording(@Param('id') id: number) {
    const recording = await this.webinarService.getRecording(id);

    return {
      url: recording.url,
      password: recording.password,
    };
  }
}
