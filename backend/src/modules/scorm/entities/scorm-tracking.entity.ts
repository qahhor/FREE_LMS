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
import { ScormPackage } from './scorm-package.entity';
import { User } from '../../users/entities/user.entity';

export enum ScormStatus {
  NOT_ATTEMPTED = 'not_attempted',
  INCOMPLETE = 'incomplete',
  COMPLETED = 'completed',
  PASSED = 'passed',
  FAILED = 'failed',
  BROWSED = 'browsed',
}

@Entity('scorm_tracking')
export class ScormTracking {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ScormPackage)
  @JoinColumn({ name: 'package_id' })
  package: ScormPackage;

  @Column({ name: 'package_id' })
  @Index()
  packageId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  @Column({ name: 'sco_id' })
  scoId: string; // SCO identifier from manifest

  @Column({ name: 'attempt_number', default: 1 })
  attemptNumber: number;

  // SCORM Data Model (SCORM 1.2 / 2004)
  @Column({
    type: 'enum',
    enum: ScormStatus,
    default: ScormStatus.NOT_ATTEMPTED,
  })
  @Index()
  status: ScormStatus;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number; // 0-100

  @Column({ name: 'score_raw', type: 'decimal', precision: 10, scale: 2, nullable: true })
  scoreRaw: number;

  @Column({ name: 'score_min', type: 'decimal', precision: 10, scale: 2, nullable: true })
  scoreMin: number;

  @Column({ name: 'score_max', type: 'decimal', precision: 10, scale: 2, nullable: true })
  scoreMax: number;

  @Column({ name: 'total_time', default: 0 })
  totalTime: number; // Total time in seconds

  @Column({ name: 'session_time', default: 0 })
  sessionTime: number; // Current session time in seconds

  @Column({ name: 'lesson_location', nullable: true })
  lessonLocation: string; // Bookmark/location within SCO

  @Column({ type: 'text', nullable: true })
  suspendData: string; // SCO's suspend data

  @Column({ name: 'launch_data', type: 'text', nullable: true })
  launchData: string; // Data from LMS to SCO

  @Column({ name: 'credit_mode', default: 'credit' })
  creditMode: string; // credit, no-credit

  @Column({ name: 'lesson_mode', default: 'normal' })
  lessonMode: string; // browse, normal, review

  @Column({ default: 'unknown' })
  exit: string; // time-out, suspend, logout, normal

  @Column({ name: 'entry_mode', default: 'ab-initio' })
  entryMode: string; // ab-initio, resume

  // Interactions (for tracking questions/responses)
  @Column({ type: 'json', nullable: true })
  interactions: Array<{
    id: string;
    type: string;
    objectives?: string[];
    timestamp?: string;
    correctResponses?: any[];
    weighting?: number;
    learnerResponse?: string;
    result?: string;
    latency?: string;
    description?: string;
  }>;

  // Objectives
  @Column({ type: 'json', nullable: true })
  objectives: Array<{
    id: string;
    status?: string;
    score?: {
      raw?: number;
      min?: number;
      max?: number;
    };
    description?: string;
  }>;

  // Comments from learner
  @Column({ type: 'json', nullable: true })
  comments: Array<{
    comment: string;
    location?: string;
    timestamp?: string;
  }>;

  // Progress
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progress: number; // 0-100

  @Column({ name: 'completion_status', default: 'incomplete' })
  completionStatus: string; // completed, incomplete, not_attempted, unknown

  @Column({ name: 'success_status', default: 'unknown' })
  successStatus: string; // passed, failed, unknown

  @Column({ name: 'is_passed', default: false })
  isPassed: boolean;

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;

  // Timestamps
  @Column({ name: 'started_at', nullable: true })
  startedAt: Date;

  @Column({ name: 'last_accessed_at', nullable: true })
  lastAccessedAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Index(['packageId', 'userId', 'attemptNumber'])
}
