export enum CommentableType {
  COURSE = 'course',
  LESSON = 'lesson',
}

export interface Comment {
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
  commentableType: CommentableType;
  commentableId: number;
  parentCommentId?: number;
  likesCount: number;
  repliesCount: number;
  isEdited: boolean;
  isInstructorReply: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentDto {
  content: string;
  commentableType: CommentableType;
  commentableId: number;
  parentCommentId?: number;
}

export interface UpdateCommentDto {
  content: string;
}
