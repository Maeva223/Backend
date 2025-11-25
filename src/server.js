import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import iotRoutes from './routes/iot.js';
import auth from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
	res.json({ ok: true, status: 'Node auth sample running' });
});

app.use('/auth', authRoutes);
app.use('/', profileRoutes);
app.use('/iot', iotRoutes);

// Example protected route
app.get('/protected-ping', auth, (req, res) => {
	res.json({ ok: true, userId: req.userId, ts: Date.now() });
});

app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
