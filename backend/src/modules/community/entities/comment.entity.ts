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
import { User } from '../../users/entities/user.entity';

export enum CommentableType {
  COURSE = 'course',
  LESSON = 'lesson',
}

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ name: 'author_id' })
  @Index()
  authorId: number;

  // Polymorphic relation
  @Column({
    type: 'enum',
    enum: CommentableType,
    name: 'commentable_type',
  })
  @Index()
  commentableType: CommentableType;

  @Column({ name: 'commentable_id' })
  @Index()
  commentableId: number;

  @ManyToOne(() => Comment, { nullable: true })
  @JoinColumn({ name: 'parent_comment_id' })
  parentComment: Comment;

  @Column({ name: 'parent_comment_id', nullable: true })
  @Index()
  parentCommentId: number;

  @Column({ name: 'likes_count', default: 0 })
  likesCount: number;

  @Column({ name: 'replies_count', default: 0 })
  repliesCount: number;

  @Column({ name: 'is_edited', default: false })
  isEdited: boolean;

  @Column({ name: 'is_instructor_reply', default: false })
  isInstructorReply: boolean;

  @Column({ name: 'edited_at', nullable: true })
  editedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
