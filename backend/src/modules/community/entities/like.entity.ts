import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum LikeableType {
  TOPIC = 'topic',
  POST = 'post',
  COMMENT = 'comment',
}

@Entity('likes')
@Index(['userId', 'likeableType', 'likeableId'], { unique: true })
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  @Column({
    type: 'enum',
    enum: LikeableType,
    name: 'likeable_type',
  })
  @Index()
  likeableType: LikeableType;

  @Column({ name: 'likeable_id' })
  @Index()
  likeableId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
