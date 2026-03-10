import { Schema, model, type HydratedDocument, type InferSchemaType, Types } from 'mongoose';

const categorySchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            index: true,
        },
        parentId: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            default: null,
            index: true,
        },
        ancestors: {
            type: [Schema.Types.ObjectId],
            ref: 'Category',
            default: [],
            index: true,
        },
        depth: {
            type: Number,
            required: true,
            min: 1,
            index: true,
        },
        fullPath: {
            type: String,
            required: true,
            index: true,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

categorySchema.index({ fullPath: 1 });
categorySchema.index({ ancestors: 1 });

export type Category = InferSchemaType<typeof categorySchema> & {
    _id: Types.ObjectId;
};

export type CategoryDocument = HydratedDocument<Category>;

export const CategoryModel = model<Category>('Category', categorySchema);
