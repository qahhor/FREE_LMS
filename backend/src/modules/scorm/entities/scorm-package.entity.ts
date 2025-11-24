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
import { Lesson } from '../../courses/entities/lesson.entity';

export enum ScormVersion {
  SCORM_1_2 = 'scorm_1_2',
  SCORM_2004 = 'scorm_2004',
  AICC = 'aicc',
  XAPI = 'xapi',
}

@Entity('scorm_packages')
export class ScormPackage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Index()
  identifier: string; // Unique identifier from manifest

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ScormVersion,
    default: ScormVersion.SCORM_1_2,
  })
  version: ScormVersion;

  @ManyToOne(() => Course, { nullable: true })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'course_id', nullable: true })
  courseId: number;

  @ManyToOne(() => Lesson, { nullable: true })
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lesson;

  @Column({ name: 'lesson_id', nullable: true })
  lessonId: number;

  // File storage
  @Column({ name: 'package_url' })
  packageUrl: string; // S3/storage URL for zip file

  @Column({ name: 'extracted_path' })
  extractedPath: string; // Path to extracted SCORM content

  @Column({ name: 'launch_url' })
  launchUrl: string; // Entry point URL

  // Manifest data
  @Column({ type: 'json', nullable: true })
  manifest: {
    identifier?: string;
    version?: string;
    metadata?: any;
    organizations?: any[];
    resources?: any[];
    sequencing?: any;
  };

  // SCO (Sharable Content Object) information
  @Column({ type: 'json', nullable: true })
  scos: Array<{
    identifier: string;
    title: string;
    href: string;
    prerequisites?: string;
    maxtimeallowed?: string;
    timelimitaction?: string;
    datafromlms?: string;
    masteryscore?: number;
  }>;

  // Settings
  @Column({ name: 'mastery_score', nullable: true })
  masteryScore: number;

  @Column({ name: 'max_time_allowed', nullable: true })
  maxTimeAllowed: number; // in seconds

  @Column({ name: 'time_limit_action', nullable: true })
  timeLimitAction: string; // exit,message, continue,message, etc.

  @Column({ name: 'completion_threshold', nullable: true })
  completionThreshold: number; // 0-100

  // Statistics
  @Column({ name: 'total_attempts', default: 0 })
  totalAttempts: number;

  @Column({ name: 'average_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  averageScore: number;

  @Column({ name: 'completion_rate', type: 'decimal', precision: 5, scale: 2, nullable: true })
  completionRate: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
