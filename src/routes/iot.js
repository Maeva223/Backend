// routes/iot.js
import express from 'express';

const router = express.Router();

// Caché para evitar exceder límites de la API gratuita
let cachedData = null;
let cacheTimestamp = null;

/**
 * Genera datos simulados como fallback
 */
function getSimulatedData() {
    const temperature = (18 + Math.random() * 12).toFixed(1);
    const humidity = (30 + Math.random() * 50).toFixed(1);

    return {
        temperature: Number(temperature),
        humidity: Number(humidity),
        timestamp: new Date().toLocaleString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }),
        source: 'simulated'
    };
}

/**
 * Obtiene datos reales de OpenWeatherMap API
 */
async function getWeatherData() {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const city = process.env.OPENWEATHER_CITY || 'La Serena,CL';

    if (!apiKey || apiKey === 'your_api_key_here') {
        console.log('⚠️  OpenWeatherMap API key no configurada, usando datos simulados');
        return getSimulatedData();
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        const data = await response.json();

        return {
            temperature: Number(data.main.temp.toFixed(1)),
            humidity: Number(data.main.humidity),
            city: data.name,
            timestamp: new Date().toLocaleString('es-CL', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }),
            source: 'openweathermap'
        };
    } catch (error) {
        console.error('❌ Error fetching weather data:', error.message);
        return getSimulatedData();
    }
}

/**
 * GET /iot/data
 *
 * Devuelve datos de sensores (temperatura y humedad)
 * - Intenta obtener datos reales de OpenWeatherMap
 * - Usa caché para no exceder límites de API
 * - Fallback a datos simulados si falla
 */
router.get('/data', async (req, res) => {
    const cacheMinutes = Number(process.env.OPENWEATHER_CACHE_MINUTES) || 10;
    const cacheExpiration = cacheMinutes * 60 * 1000; // Convertir a milisegundos
    const now = Date.now();

    // Verificar si hay datos en caché válidos
    if (cachedData && cacheTimestamp && (now - cacheTimestamp < cacheExpiration)) {
        console.log('✅ Usando datos del caché');
        return res.json(cachedData);
    }

    // Obtener datos frescos (reales o simulados)
    console.log('🔄 Obteniendo datos frescos...');
    const data = await getWeatherData();

    // Actualizar caché
    cachedData = data;
    cacheTimestamp = now;

    return res.json(data);
});

export default router;
