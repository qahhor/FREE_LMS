import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Course } from '../../courses/entities/course.entity';
import { User } from '../../users/entities/user.entity';

export enum WebinarProvider {
  ZOOM = 'zoom',
  JITSI = 'jitsi',
  GOOGLE_MEET = 'google_meet',
  MS_TEAMS = 'ms_teams',
}

export enum WebinarStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

@Entity('webinars')
export class Webinar {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: WebinarProvider,
    default: WebinarProvider.ZOOM,
  })
  provider: WebinarProvider;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'host_id' })
  host: User;

  @Column({ name: 'host_id' })
  @Index()
  hostId: number;

  @ManyToOne(() => Course, { nullable: true })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'course_id', nullable: true })
  courseId: number;

  // Scheduled time
  @Column({ name: 'scheduled_at' })
  @Index()
  scheduledAt: Date;

  @Column({ name: 'duration_minutes' })
  durationMinutes: number;

  @Column({ nullable: true })
  timezone: string;

  // Provider-specific data
  @Column({ name: 'meeting_id', nullable: true, unique: true })
  @Index()
  meetingId: string; // Zoom meeting ID, Jitsi room name, etc.

  @Column({ name: 'meeting_password', nullable: true })
  meetingPassword: string;

  @Column({ name: 'join_url', nullable: true })
  joinUrl: string;

  @Column({ name: 'start_url', nullable: true })
  startUrl: string; // Host URL

  // Settings
  @Column({ name: 'waiting_room', default: false })
  waitingRoom: boolean;

  @Column({ name: 'require_password', default: true })
  requirePassword: boolean;

  @Column({ name: 'allow_recording', default: true })
  allowRecording: boolean;

  @Column({ name: 'auto_recording', default: false })
  autoRecording: boolean;

  @Column({ name: 'mute_on_entry', default: false })
  muteOnEntry: boolean;

  @Column({ name: 'max_participants', nullable: true })
  maxParticipants: number;

  // Participant management
  @Column({ name: 'allow_guests', default: false })
  allowGuests: boolean;

  @Column({ type: 'json', nullable: true })
  allowedEmails: string[]; // Whitelist

  // Recording
  @Column({ name: 'recording_url', nullable: true })
  recordingUrl: string;

  @Column({ name: 'recording_password', nullable: true })
  recordingPassword: string;

  @Column({ name: 'recording_duration', nullable: true })
  recordingDuration: number; // minutes

  // Statistics
  @Column({ name: 'total_participants', default: 0 })
  totalParticipants: number;

  @Column({ name: 'peak_participants', default: 0 })
  peakParticipants: number;

  @Column({ name: 'average_duration', nullable: true })
  averageDuration: number; // minutes

  // Status
  @Column({
    type: 'enum',
    enum: WebinarStatus,
    default: WebinarStatus.SCHEDULED,
  })
  @Index()
  status: WebinarStatus;

  @Column({ name: 'started_at', nullable: true })
  startedAt: Date;

  @Column({ name: 'ended_at', nullable: true })
  endedAt: Date;

  // Provider response data
  @Column({ type: 'json', nullable: true })
  providerData: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
