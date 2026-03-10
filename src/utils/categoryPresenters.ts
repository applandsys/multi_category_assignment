export const presentCategory = (category: any) => ({
    id: category._id?.toString() ?? category.id,
    name: category.name,
    depth: category.depth,
    fullPath: category.fullPath,
    isActive: category.isActive,
    parent: category.parentId
        ? {
            id: category.parentId._id?.toString() ?? category.parentId.id,
            name: category.parentId.name,
            depth: category.parentId.depth,
            fullPath: category.parentId.fullPath,
            isActive: category.parentId.isActive,
        }
        : null,
    ancestors: (category.ancestors ?? []).map((ancestor: any) => ({
        id: ancestor._id?.toString() ?? ancestor.id,
        name: ancestor.name,
        depth: ancestor.depth,
        fullPath: ancestor.fullPath,
        isActive: ancestor.isActive,
    })),
    createdAt: new Date(category.createdAt).toISOString(),
    updatedAt: new Date(category.updatedAt).toISOString(),
});

export const presentCategoryList = (categories: any[]) => categories.map(presentCategory);
