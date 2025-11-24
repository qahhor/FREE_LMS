import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ForumTopic } from './forum-topic.entity';

@Entity('forum_categories')
export class ForumCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ unique: true })
  @Index()
  slug: string;

  @Column({ nullable: true })
  icon: string; // icon class or emoji

  @Column({ nullable: true })
  color: string; // hex color for UI

  @Column({ default: 0 })
  @Index()
  orderIndex: number;

  @OneToMany(() => ForumTopic, (topic) => topic.category)
  topics: ForumTopic[];

  @Column({ name: 'topics_count', default: 0 })
  topicsCount: number;

  @Column({ name: 'posts_count', default: 0 })
  postsCount: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
