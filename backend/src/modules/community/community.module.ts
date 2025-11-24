import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Tag,
  ForumCategory,
  ForumTopic,
  ForumPost,
  Comment,
  Like,
} from './entities';
import { ForumService, CommentService } from './services';
import { ForumController, CommentController } from './controllers';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tag,
      ForumCategory,
      ForumTopic,
      ForumPost,
      Comment,
      Like,
    ]),
  ],
  providers: [ForumService, CommentService],
  controllers: [ForumController, CommentController],
  exports: [ForumService, CommentService],
})
export class CommunityModule {}
