import { Router } from 'express';
import { z } from 'zod';
import { categoryService } from '../services/categoryService';
import { presentCategory, presentCategoryList } from '../utils/categoryPresenters';

const router = Router();

const createSchema = z.object({
    name: z.string().trim().min(1),
    parentId: z.string().trim().optional().nullable(),
    isActive: z.boolean().optional(),
});

const updateSchema = z.object({
    name: z.string().trim().min(1).optional(),
    parentId: z.string().trim().optional().nullable(),
    isActive: z.boolean().optional(),
});

router.get('/', async (req, res, next) => {
    try {
        const includeInactive = req.query.includeInactive === 'true';
        const data = await categoryService.listCategories({ includeInactive });
        res.json({ success: true, data: presentCategoryList(data) });
    } catch (error) {
        next(error);
    }
});

router.get('/search', async (req, res, next) => {
    try {
        const q = String(req.query.q ?? '');
        const includeInactive = req.query.includeInactive === 'true';
        const data = await categoryService.searchCategories(q, { includeInactive });
        res.json({ success: true, data: presentCategoryList(data) });
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const data = await categoryService.getCategoryById(req.params.id);
        res.json({ success: true, data: presentCategory(data) });
    } catch (error) {
        next(error);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const input = createSchema.parse(req.body);
        const data = await categoryService.createCategory(input);
        res.status(201).json({ success: true, data: presentCategory(data) });
    } catch (error) {
        next(error);
    }
});

router.patch('/:id', async (req, res, next) => {
    try {
        const input = updateSchema.parse(req.body);
        const data = await categoryService.updateCategory(req.params.id, input);
        res.json({ success: true, data: presentCategory(data) });
    } catch (error) {
        next(error);
    }
});

router.post('/:id/deactivate', async (req, res, next) => {
    try {
        const data = await categoryService.deactivateCategory(req.params.id);
        res.json({ success: true, data: presentCategory(data) });
    } catch (error) {
        next(error);
    }
});

router.post('/:id/activate', async (req, res, next) => {
    try {
        const data = await categoryService.activateCategory(req.params.id);
        res.json({ success: true, data: presentCategory(data) });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const data = await categoryService.deleteCategory(req.params.id);
        res.json(data);
    } catch (error) {
        next(error);
    }
});

export default router;
