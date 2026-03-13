import mongoose from 'mongoose';
import { connectMongo } from '../src/config/db.js';
import { closeRedis } from '../src/config/redis.js';
import { CategoryModel } from '../src/models/category.model.js';
import { categoryService } from '../src/services/categoryService';

const run = async (): Promise<void> => {
    await connectMongo();
    await CategoryModel.deleteMany({});

    const electronics = await categoryService.createCategory({ name: 'Electronics' });
    const television = await categoryService.createCategory({
        name: 'Television',
        parentId: electronics?._id?.toString(),
    });

    await categoryService.createCategory({
        name: 'TV Accessories',
        parentId: television?._id?.toString(),
    });

    const appliances = await categoryService.createCategory({
        name: 'Appliances',
        parentId: electronics?._id?.toString(),
    });

    const homeAppliances = await categoryService.createCategory({
        name: 'Home Appliances',
        parentId: appliances?._id?.toString(),
    });

    await categoryService.createCategory({
        name: 'Refrigerator',
        parentId: homeAppliances?._id?.toString(),
    });

    console.log('✅ Seed data inserted');
};

run()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await closeRedis();
        await mongoose.disconnect();
    });
