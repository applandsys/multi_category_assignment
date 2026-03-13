import { GraphQLError } from 'graphql';
import { categoryService } from '../services/categoryService.js';
import { presentCategory, presentCategoryList } from '../utils/categoryPresenters.js';

const toGraphqlError = (error: unknown): never => {
    if (error instanceof Error) {
        throw new GraphQLError(error.message);
    }

    throw new GraphQLError('Unexpected error');
};

export const resolvers = {
    Query: {
        categories: async (_parent: unknown, args: { includeInactive?: boolean }) => {
            try {
                const categories = await categoryService.listCategories({
                    includeInactive: args.includeInactive,
                });
                return presentCategoryList(categories);
            } catch (error) {
                return toGraphqlError(error);
            }
        },
        category: async (_parent: unknown, args: { id: string }) => {
            try {
                const category = await categoryService.getCategoryById(args.id);
                return presentCategory(category);
            } catch (error) {
                return toGraphqlError(error);
            }
        },
        searchCategories: async (
            _parent: unknown,
            args: { query: string; includeInactive?: boolean },
        ) => {
            try {
                const categories = await categoryService.searchCategories(args.query, {
                    includeInactive: args.includeInactive,
                });
                return presentCategoryList(categories);
            } catch (error) {
                return toGraphqlError(error);
            }
        },
    },
    Mutation: {
        createCategory: async (_parent: unknown, args: { input: any }) => {
            try {
                const category = await categoryService.createCategory(args.input);
                return presentCategory(category);
            } catch (error) {
                return toGraphqlError(error);
            }
        },
        updateCategory: async (_parent: unknown, args: { id: string; input: any }) => {
            try {
                const category = await categoryService.updateCategory(args.id, args.input);
                return presentCategory(category);
            } catch (error) {
                return toGraphqlError(error);
            }
        },
        deactivateCategory: async (_parent: unknown, args: { id: string }) => {
            try {
                const category = await categoryService.deactivateCategory(args.id);
                return presentCategory(category);
            } catch (error) {
                return toGraphqlError(error);
            }
        },
        activateCategory: async (_parent: unknown, args: { id: string }) => {
            try {
                const category = await categoryService.activateCategory(args.id);
                return presentCategory(category);
            } catch (error) {
                return toGraphqlError(error);
            }
        },
        deleteCategory: async (_parent: unknown, args: { id: string }) => {
            try {
                return categoryService.deleteCategory(args.id);
            } catch (error) {
                return toGraphqlError(error);
            }
        },
    },
};
