import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  ForumCategory,
  ForumTopic,
  ForumPost,
  Tag,
  Like,
  LikeableType,
} from '../entities';
import {
  CreateForumCategoryDto,
  CreateForumTopicDto,
  CreateForumPostDto,
  UpdateForumTopicDto,
  UpdateContentDto,
} from '../dto';

@Injectable()
export class ForumService {
  constructor(
    @InjectRepository(ForumCategory)
    private forumCategoryRepository: Repository<ForumCategory>,
    @InjectRepository(ForumTopic)
    private forumTopicRepository: Repository<ForumTopic>,
    @InjectRepository(ForumPost)
    private forumPostRepository: Repository<ForumPost>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    @InjectRepository(Like)
    private likeRepository: Repository<Like>,
  ) {}

  // ===== CATEGORIES =====

  async createCategory(dto: CreateForumCategoryDto): Promise<ForumCategory> {
    const category = this.forumCategoryRepository.create(dto);
    return await this.forumCategoryRepository.save(category);
  }

  async getAllCategories(): Promise<ForumCategory[]> {
    return await this.forumCategoryRepository.find({
      where: { isActive: true },
      order: { orderIndex: 'ASC' },
    });
  }

  async getCategoryBySlug(slug: string): Promise<ForumCategory> {
    const category = await this.forumCategoryRepository.findOne({
      where: { slug, isActive: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  // ===== TOPICS =====

  async createTopic(userId: number, dto: CreateForumTopicDto): Promise<ForumTopic> {
    // Verify category exists
    const category = await this.forumCategoryRepository.findOne({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Generate slug from title
    const slug = await this.generateUniqueSlug(dto.title);

    // Handle tags
    let tags: Tag[] = [];
    if (dto.tags && dto.tags.length > 0) {
      tags = await this.findOrCreateTags(dto.tags);
    }

    // Create topic
    const topic = this.forumTopicRepository.create({
      title: dto.title,
      content: dto.content,
      slug,
      authorId: userId,
      categoryId: dto.categoryId,
      tags,
    });

    const savedTopic = await this.forumTopicRepository.save(topic);

    // Update category counters
    await this.forumCategoryRepository.increment(
      { id: dto.categoryId },
      'topicsCount',
      1,
    );

    return savedTopic;
  }

  async getTopicsByCategory(
    categoryId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: ForumTopic[]; total: number }> {
    const [data, total] = await this.forumTopicRepository.findAndCount({
      where: { categoryId },
      relations: ['author', 'tags', 'lastPostAuthor'],
      order: {
        isPinned: 'DESC',
        lastPostAt: 'DESC',
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async getTopicBySlug(slug: string): Promise<ForumTopic> {
    const topic = await this.forumTopicRepository.findOne({
      where: { slug },
      relations: ['author', 'tags', 'category'],
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    // Increment views
    await this.forumTopicRepository.increment({ id: topic.id }, 'viewsCount', 1);

    return topic;
  }

  async updateTopic(
    userId: number,
    topicId: number,
    dto: UpdateForumTopicDto,
  ): Promise<ForumTopic> {
    const topic = await this.forumTopicRepository.findOne({
      where: { id: topicId },
      relations: ['author', 'tags'],
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    if (topic.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own topics');
    }

    if (topic.isLocked) {
      throw new BadRequestException('This topic is locked');
    }

    // Update fields
    if (dto.title) {
      topic.title = dto.title;
      topic.slug = await this.generateUniqueSlug(dto.title, topicId);
    }

    if (dto.content) {
      topic.content = dto.content;
    }

    // Update tags
    if (dto.tags) {
      topic.tags = await this.findOrCreateTags(dto.tags);
    }

    return await this.forumTopicRepository.save(topic);
  }

  async deleteTopic(userId: number, topicId: number): Promise<void> {
    const topic = await this.forumTopicRepository.findOne({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    if (topic.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own topics');
    }

    // Delete all posts in the topic
    await this.forumPostRepository.delete({ topicId });

    // Delete the topic
    await this.forumTopicRepository.delete({ id: topicId });

    // Update category counters
    await this.forumCategoryRepository.decrement(
      { id: topic.categoryId },
      'topicsCount',
      1,
    );
  }

  async pinTopic(topicId: number, isPinned: boolean): Promise<ForumTopic> {
    const topic = await this.forumTopicRepository.findOne({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    topic.isPinned = isPinned;
    return await this.forumTopicRepository.save(topic);
  }

  async lockTopic(topicId: number, isLocked: boolean): Promise<ForumTopic> {
    const topic = await this.forumTopicRepository.findOne({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    topic.isLocked = isLocked;
    return await this.forumTopicRepository.save(topic);
  }

  // ===== POSTS =====

  async createPost(userId: number, dto: CreateForumPostDto): Promise<ForumPost> {
    const topic = await this.forumTopicRepository.findOne({
      where: { id: dto.topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    if (topic.isLocked) {
      throw new BadRequestException('This topic is locked');
    }

    // If replying to a post, verify it exists
    if (dto.replyToId) {
      const replyToPost = await this.forumPostRepository.findOne({
        where: { id: dto.replyToId },
      });

      if (!replyToPost) {
        throw new NotFoundException('Post to reply to not found');
      }
    }

    // Create post
    const post = this.forumPostRepository.create({
      content: dto.content,
      authorId: userId,
      topicId: dto.topicId,
      replyToId: dto.replyToId,
    });

    const savedPost = await this.forumPostRepository.save(post);

    // Update topic counters and last post info
    await this.forumTopicRepository.update(
      { id: dto.topicId },
      {
        repliesCount: () => 'replies_count + 1',
        lastPostAt: new Date(),
        lastPostAuthorId: userId,
      },
    );

    // Update category posts count
    await this.forumCategoryRepository.increment(
      { id: topic.categoryId },
      'postsCount',
      1,
    );

    return savedPost;
  }

  async getPostsByTopic(
    topicId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: ForumPost[]; total: number }> {
    const [data, total] = await this.forumPostRepository.findAndCount({
      where: { topicId },
      relations: ['author', 'replyTo'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async updatePost(
    userId: number,
    postId: number,
    dto: UpdateContentDto,
  ): Promise<ForumPost> {
    const post = await this.forumPostRepository.findOne({
      where: { id: postId },
      relations: ['topic'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    if (post.topic.isLocked) {
      throw new BadRequestException('This topic is locked');
    }

    post.content = dto.content;
    post.isEdited = true;
    post.editedAt = new Date();

    return await this.forumPostRepository.save(post);
  }

  async deletePost(userId: number, postId: number): Promise<void> {
    const post = await this.forumPostRepository.findOne({
      where: { id: postId },
      relations: ['topic'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.forumPostRepository.delete({ id: postId });

    // Update topic counters
    await this.forumTopicRepository.decrement(
      { id: post.topicId },
      'repliesCount',
      1,
    );

    // Update category posts count
    await this.forumCategoryRepository.decrement(
      { id: post.topic.categoryId },
      'postsCount',
      1,
    );
  }

  async markBestAnswer(postId: number, userId: number): Promise<ForumPost> {
    const post = await this.forumPostRepository.findOne({
      where: { id: postId },
      relations: ['topic'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Only topic author can mark best answer
    if (post.topic.authorId !== userId) {
      throw new ForbiddenException('Only the topic author can mark best answer');
    }

    // Unmark any previous best answer
    await this.forumPostRepository.update(
      { topicId: post.topicId, isBestAnswer: true },
      { isBestAnswer: false },
    );

    // Mark this post as best answer
    post.isBestAnswer = true;
    return await this.forumPostRepository.save(post);
  }

  // ===== LIKES =====

  async toggleLike(
    userId: number,
    likeableType: LikeableType,
    likeableId: number,
  ): Promise<{ liked: boolean; likesCount: number }> {
    // Check if already liked
    const existingLike = await this.likeRepository.findOne({
      where: { userId, likeableType, likeableId },
    });

    let liked: boolean;
    let repository: Repository<any>;
    let entityId: number;

    // Determine which repository to use
    if (likeableType === LikeableType.TOPIC) {
      repository = this.forumTopicRepository;
      entityId = likeableId;
    } else if (likeableType === LikeableType.POST) {
      repository = this.forumPostRepository;
      entityId = likeableId;
    }

    if (existingLike) {
      // Unlike
      await this.likeRepository.delete({ id: existingLike.id });
      await repository.decrement({ id: entityId }, 'likesCount', 1);
      liked = false;
    } else {
      // Like
      const like = this.likeRepository.create({
        userId,
        likeableType,
        likeableId,
      });
      await this.likeRepository.save(like);
      await repository.increment({ id: entityId }, 'likesCount', 1);
      liked = true;
    }

    // Get updated likes count
    const entity = await repository.findOne({ where: { id: entityId } });
    const likesCount = entity?.likesCount || 0;

    return { liked, likesCount };
  }

  async getUserLikes(
    userId: number,
    likeableType: LikeableType,
    likeableIds: number[],
  ): Promise<number[]> {
    const likes = await this.likeRepository.find({
      where: {
        userId,
        likeableType,
        likeableId: In(likeableIds),
      },
    });

    return likes.map((like) => like.likeableId);
  }

  // ===== HELPER METHODS =====

  private async generateUniqueSlug(
    title: string,
    excludeId?: number,
  ): Promise<string> {
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug exists
    let counter = 0;
    let uniqueSlug = slug;

    while (true) {
      const query: any = { slug: uniqueSlug };
      if (excludeId) {
        query.id = { $ne: excludeId };
      }

      const existing = await this.forumTopicRepository.findOne({
        where: query,
      });

      if (!existing) {
        break;
      }

      counter++;
      uniqueSlug = `${slug}-${counter}`;
    }

    return uniqueSlug;
  }

  private async findOrCreateTags(tagNames: string[]): Promise<Tag[]> {
    const tags: Tag[] = [];

    for (const name of tagNames) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      let tag = await this.tagRepository.findOne({ where: { slug } });

      if (!tag) {
        tag = this.tagRepository.create({ name, slug });
        tag = await this.tagRepository.save(tag);
      } else {
        // Increment usage count
        await this.tagRepository.increment({ id: tag.id }, 'usageCount', 1);
      }

      tags.push(tag);
    }

    return tags;
  }

  // ===== SEARCH & DISCOVERY =====

  async searchTopics(
    query: string,
    categoryId?: number,
    tags?: string[],
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: ForumTopic[]; total: number }> {
    const queryBuilder = this.forumTopicRepository
      .createQueryBuilder('topic')
      .leftJoinAndSelect('topic.author', 'author')
      .leftJoinAndSelect('topic.category', 'category')
      .leftJoinAndSelect('topic.tags', 'tags');

    if (query) {
      queryBuilder.andWhere(
        '(LOWER(topic.title) LIKE LOWER(:query) OR LOWER(topic.content) LIKE LOWER(:query))',
        { query: `%${query}%` },
      );
    }

    if (categoryId) {
      queryBuilder.andWhere('topic.categoryId = :categoryId', { categoryId });
    }

    if (tags && tags.length > 0) {
      queryBuilder.andWhere('tags.slug IN (:...tags)', { tags });
    }

    queryBuilder
      .orderBy('topic.isPinned', 'DESC')
      .addOrderBy('topic.lastPostAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  async getPopularTags(limit: number = 20): Promise<Tag[]> {
    return await this.tagRepository.find({
      order: { usageCount: 'DESC' },
      take: limit,
    });
  }
}
