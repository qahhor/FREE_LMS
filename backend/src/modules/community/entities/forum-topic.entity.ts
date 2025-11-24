import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ForumCategory } from './forum-category.entity';
import { ForumPost } from './forum-post.entity';
import { Tag } from './tag.entity';

@Entity('forum_topics')
export class ForumTopic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ unique: true })
  @Index()
  slug: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ name: 'author_id' })
  @Index()
  authorId: number;

  @ManyToOne(() => ForumCategory, (category) => category.topics)
  @JoinColumn({ name: 'category_id' })
  category: ForumCategory;

  @Column({ name: 'category_id' })
  @Index()
  categoryId: number;

  @OneToMany(() => ForumPost, (post) => post.topic)
  posts: ForumPost[];

  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'forum_topic_tags',
    joinColumn: { name: 'topic_id' },
    inverseJoinColumn: { name: 'tag_id' },
  })
  tags: Tag[];

  @Column({ name: 'is_pinned', default: false })
  @Index()
  isPinned: boolean;

  @Column({ name: 'is_locked', default: false })
  isLocked: boolean;

  @Column({ name: 'views_count', default: 0 })
  viewsCount: number;

  @Column({ name: 'replies_count', default: 0 })
  repliesCount: number;

  @Column({ name: 'likes_count', default: 0 })
  likesCount: number;

  @Column({ name: 'last_post_at', nullable: true })
  @Index()
  lastPostAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'last_post_author_id' })
  lastPostAuthor: User;

  @Column({ name: 'last_post_author_id', nullable: true })
  lastPostAuthorId: number;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
