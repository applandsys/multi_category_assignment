export interface CreateCategoryInput {
    name: string;
    parentId?: string | null;
    isActive?: boolean;
}

export interface UpdateCategoryInput {
    name?: string;
    parentId?: string | null;
    isActive?: boolean;
}

export interface CategoryQueryOptions {
    includeInactive?: boolean;
}
