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
import { Webinar } from './webinar.entity';
import { User } from '../../users/entities/user.entity';

export enum ParticipantRole {
  HOST = 'host',
  CO_HOST = 'co_host',
  PANELIST = 'panelist',
  ATTENDEE = 'attendee',
}

export enum AttendanceStatus {
  REGISTERED = 'registered',
  JOINED = 'joined',
  LEFT = 'left',
  NO_SHOW = 'no_show',
}

@Entity('webinar_participants')
export class WebinarParticipant {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Webinar)
  @JoinColumn({ name: 'webinar_id' })
  webinar: Webinar;

  @Column({ name: 'webinar_id' })
  @Index()
  webinarId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', nullable: true })
  @Index()
  userId: number;

  // Guest info (if not a registered user)
  @Column({ name: 'guest_name', nullable: true })
  guestName: string;

  @Column({ name: 'guest_email', nullable: true })
  guestEmail: string;

  @Column({
    type: 'enum',
    enum: ParticipantRole,
    default: ParticipantRole.ATTENDEE,
  })
  role: ParticipantRole;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.REGISTERED,
  })
  @Index()
  status: AttendanceStatus;

  // Attendance tracking
  @Column({ name: 'joined_at', nullable: true })
  joinedAt: Date;

  @Column({ name: 'left_at', nullable: true })
  leftAt: Date;

  @Column({ name: 'duration_minutes', default: 0 })
  durationMinutes: number;

  @Column({ name: 'is_present', default: false })
  isPresent: boolean;

  // Interaction metrics
  @Column({ name: 'questions_asked', default: 0 })
  questionsAsked: number;

  @Column({ name: 'polls_answered', default: 0 })
  pollsAnswered: number;

  @Column({ name: 'hand_raised_count', default: 0 })
  handRaisedCount: number;

  @Column({ name: 'chat_messages', default: 0 })
  chatMessages: number;

  // Settings
  @Column({ name: 'audio_muted', default: true })
  audioMuted: boolean;

  @Column({ name: 'video_enabled', default: false })
  videoEnabled: boolean;

  // Provider-specific data
  @Column({ name: 'participant_id', nullable: true })
  participantId: string; // Provider's participant ID

  @Column({ type: 'json', nullable: true })
  providerData: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Index(['webinarId', 'userId'], { unique: true, where: 'user_id IS NOT NULL' })
}
