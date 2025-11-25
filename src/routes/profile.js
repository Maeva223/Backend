import { Router } from 'express';
import db from '../db/knex.js';
import auth from '../middleware/auth.js';

const router = Router();

// GET /profile (protected)
router.get('/profile', auth, async (req, res) => {
	const user = await db('users').where({ id: req.userId }).first().select('id', 'name', 'email');

	if (!user) return res.status(404).json({ success: false, message: 'User not found' });

	res.json(user);
});

export default router;
