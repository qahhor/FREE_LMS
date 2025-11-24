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
import { ForumTopic } from './forum-topic.entity';

@Entity('forum_posts')
export class ForumPost {
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

  @ManyToOne(() => ForumTopic, (topic) => topic.posts)
  @JoinColumn({ name: 'topic_id' })
  topic: ForumTopic;

  @Column({ name: 'topic_id' })
  @Index()
  topicId: number;

  @ManyToOne(() => ForumPost, { nullable: true })
  @JoinColumn({ name: 'reply_to_id' })
  replyTo: ForumPost;

  @Column({ name: 'reply_to_id', nullable: true })
  @Index()
  replyToId: number;

  @Column({ name: 'likes_count', default: 0 })
  likesCount: number;

  @Column({ name: 'is_edited', default: false })
  isEdited: boolean;

  @Column({ name: 'is_best_answer', default: false })
  isBestAnswer: boolean;

  @Column({ name: 'edited_at', nullable: true })
  editedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
