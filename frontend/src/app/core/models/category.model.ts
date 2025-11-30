export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  color?: string;
  parentId?: number;
  parentName?: string;
  coursesCount: number;
  subcategories?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentId?: number;
  iconUrl?: string;
  color?: string;
}
