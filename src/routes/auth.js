import { Router } from 'express';
import db from '../db/knex.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
// Cantidad de rondas para bcrypt
const SALT_ROUNDS = 10;

// Generar código numérico de 5 dígitos
function generateCode() {
	// Genera un número entre 0 y 99999 y lo rellena con 0 a la izquierda
	const num = Math.floor(Math.random() * 100000);
	return num.toString().padStart(5, '0');
}

// Verificar si un Date está dentro de 1 minuto de diferencia
function isCodeValid(createdAt) {
	const now = new Date();
	const diffMs = now - createdAt; // milisegundos
	const diffSeconds = diffMs / 1000;
	return diffSeconds <= 60;
}


/**
 * POST /api/auth/register
 * Body: { name, last_name, email, password }
 */
router.post('/register', async (req, res) => {
	try {
		const { name, last_name, email, password } = req.body;

		if (!name || !last_name || !email || !password) {
			return res.status(400).json({ error: 'Faltan datos obligatorios' });
		}

		// Verificar si el email ya existe
		const existingUser = await db('users').where({ email }).first();
		if (existingUser) {
			return res.status(409).json({ error: 'El correo ya está registrado' });
		}

		// Hashear contraseña
		const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

		// Insertar usuario
		const [id] = await db('users').insert({
			name,
			last_name,
			email,
			password_hash,
		});

		return res.status(201).json({
			message: 'Usuario registrado correctamente',
			user: { id, name, last_name, email },
		});
	} catch (error) {
		console.error('Error en /register:', error);
		return res.status(500).json({ error: 'Error interno del servidor' });
	}
});


/**
 * POST /api/auth/forgot-password
 * Body: { email }
 *
 * Flujo:
 * 1. Buscar usuario por email.
 * 2. Generar código de 5 dígitos.
 * 3. Guardarlo en password_reset_codes (used = false).
 * 4. (Opcional) Enviar por correo -> aquí lo simulamos.
 */
router.post('/forgot-password', async (req, res) => {
	try {
		const { email } = req.body;

		if (!email) {
			return res.status(400).json({ error: 'Debe enviar el email' });
		}

		const user = await db('users').where({ email }).first();
		if (!user) {
			// Por seguridad, podemos devolver mensaje genérico
			return res.status(200).json({
				message: 'Si el correo existe, se ha enviado un código de recuperación',
			});
		}

		const code = generateCode();

		await db('password_reset_codes').insert({
			user_id: user.id,
			code,
			used: false,
		});

		// Aquí se podría enviar un correo real.
		// Por ahora, lo devolvemos sólo para pruebas en clase.
		return res.status(200).json({
			message: 'Código de recuperación generado (simulado)',
			code, // <-- Quitar en producción, dejar sólo para pruebas.
		});
	} catch (error) {
		console.error('Error en /forgot-password:', error);
		return res.status(500).json({ error: 'Error interno del servidor' });
	}
});

/**
 * POST /api/auth/reset-password
 * Body: { email, code, new_password }
 *
 * Flujo:
 * 1. Buscar usuario por email.
 * 2. Buscar el último código NO usado de ese usuario que coincida con "code".
 * 3. Validar vigencia (1 minuto) y que used = false.
 * 4. Actualizar password del usuario.
 * 5. Marcar el código como usado.
 */
router.post('/reset-password', async (req, res) => {
	try {
		const { email, code, new_password } = req.body;

		if (!email || !code || !new_password) {
			return res.status(400).json({ error: 'Faltan datos obligatorios' });
		}

		const user = await db('users').where({ email }).first();
		if (!user) {
			return res.status(400).json({ error: 'Usuario no encontrado' });
		}

		// Buscar el último código que coincida y no esté usado
		const resetCode = await db('password_reset_codes')
			.where({ user_id: user.id, code, used: false })
			.orderBy('created_at', 'desc')
			.first();

		if (!resetCode) {
			return res.status(400).json({ error: 'Código inválido o ya utilizado' });
		}

		// Validar vigencia (1 minuto)
		const createdAt = new Date(resetCode.created_at);
		if (!isCodeValid(createdAt)) {
			return res.status(400).json({ error: 'Código expirado (más de 1 minuto)' });
		}

		// Hashear nueva contraseña
		const password_hash = await bcrypt.hash(new_password, SALT_ROUNDS);

		// Actualizar contraseña del usuario
		await db('users')
			.where({ id: user.id })
			.update({ password_hash });

		// Marcar código como usado
		await db('password_reset_codes')
			.where({ id: resetCode.id })
			.update({ used: true });

		return res.status(200).json({ message: 'Contraseña actualizada correctamente' });
	} catch (error) {
		console.error('Error en /reset-password:', error);
		return res.status(500).json({ error: 'Error interno del servidor' });
	}
});


// POST /auth/login
router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			return res.status(400).json({ success: false, message: 'Missing email or password' });
		}

		const user = await db('users').where({ email }).first();
		if (!user) {
			return res.status(401).json({ success: false, message: 'Invalid credentials' });
		}

		const ok = await bcrypt.compare(password, user.password_hash);
		if (!ok) {
			return res.status(401).json({ success: false, message: 'Invalid credentials' });
		}

		const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
		return res.json({
			success: true,
			token,
			user: { id: user.id, name: user.name, email: user.email }
		});
	} catch (e) {
		console.error(e);
		return res.status(500).json({ success: false, message: 'Login error' });
	}
});

export default router;
