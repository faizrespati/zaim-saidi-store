// server/routes/bookRoutes.js

import express from 'express';
import { getAllBooks } from '../controllers/bookController.js';

const router = express.Router();

// Jika ada yang mengakses GET / (yang nanti digabung jadi /api/books)
router.get('/', getAllBooks);

export default router;