// routes/iot.js
import express from 'express';

const router = express.Router();

/**
 * GET /api/iot/data
 *
 * Devuelve datos de ejemplo:
 * {
 *   temperature: 23.5,
 *   humidity: 56.7,
 *   timestamp: "2025-11-20T12:34:56.789Z"
 * }
 */
router.get('/data', (req, res) => {
    // Temperatura entre 18 y 30 grados
    const temperature = (18 + Math.random() * 12).toFixed(1);

    // Humedad entre 30% y 80%
    const humidity = (30 + Math.random() * 50).toFixed(1);

    const payload = {
        temperature: Number(temperature),
        humidity: Number(humidity),
        timestamp: new Date().toLocaleString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        })
    };

    return res.json(payload);
});

export default router;
