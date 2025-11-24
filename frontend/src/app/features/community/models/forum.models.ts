export interface Tag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  usageCount: number;
  createdAt: string;
}

export interface ForumCategory {
  id: number;
  name: string;
  description: string;
  slug: string;
  icon?: string;
  color?: string;
  orderIndex: number;
  topicsCount: number;
  postsCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ForumTopic {
  id: number;
  title: string;
  content: string;
  slug: string;
  author: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
  authorId: number;
  category: ForumCategory;
  categoryId: number;
  tags: Tag[];
  isPinned: boolean;
  isLocked: boolean;
  viewsCount: number;
  repliesCount: number;
  likesCount: number;
  lastPostAt?: string;
  lastPostAuthor?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  lastPostAuthorId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ForumPost {
  id: number;
  content: string;
  author: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
  authorId: number;
  topicId: number;
  replyTo?: ForumPost;
  replyToId?: number;
  likesCount: number;
  isEdited: boolean;
  isBestAnswer: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTopicDto {
  title: string;
  content: string;
  categoryId: number;
  tags?: string[];
}

export interface UpdateTopicDto {
  title?: string;
  content?: string;
  tags?: string[];
}

export interface CreatePostDto {
  content: string;
  topicId: number;
  replyToId?: number;
}

export interface UpdateContentDto {
  content: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export interface LikeResponse {
  liked: boolean;
  likesCount: number;
}

export enum LikeableType {
  TOPIC = 'topic',
  POST = 'post',
  COMMENT = 'comment',
}
