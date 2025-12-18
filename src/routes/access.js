/**
 * Rutas de Control de Acceso RFID
 * Endpoints para validación de sensores, registro de eventos y control de barrera
 */

import express from 'express';
import db from '../db/knex.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ==================== ESTADO SIMULADO DE LA BARRERA ====================
// Simula el estado del NodeMCU (ya que no hay hardware físico)
let barrierState = {
  estado: 'CERRADA',           // 'ABIERTA' | 'CERRADA'
  ultimaActualizacion: new Date(),
  ultimoEvento: null,
  departamento: null,
  usuario: null,
  tiempoApertura: null         // Timestamp cuando se abrió
};

// Función para actualizar estado de la barrera
function actualizarBarrera(estado, evento = null, departamento = null, usuario = null) {
  barrierState.estado = estado;
  barrierState.ultimaActualizacion = new Date();
  barrierState.ultimoEvento = evento;
  barrierState.departamento = departamento;
  barrierState.usuario = usuario;

  if (estado === 'ABIERTA') {
    barrierState.tiempoApertura = Date.now();

    // Auto-cerrar después de 10 segundos
    setTimeout(() => {
      if (barrierState.estado === 'ABIERTA') {
        barrierState.estado = 'CERRADA';
        barrierState.ultimaActualizacion = new Date();
        barrierState.ultimoEvento = 'AUTO_CIERRE';
        console.log('[BARRERA] Cerrada automáticamente (10 segundos)');
      }
    }, 10000);
  } else {
    barrierState.tiempoApertura = null;
  }

  console.log(`[BARRERA] Estado: ${estado} - Evento: ${evento || 'N/A'}`);
}

/**
 * GET /api/access/barrier-status
 * Obtiene el estado actual de la barrera (simulada)
 * Usado por la app móvil para mostrar el estado en tiempo real
 */
router.get('/barrier-status', (req, res) => {
  try {
    return res.status(200).json({
      estado: barrierState.estado,
      ultimaActualizacion: barrierState.ultimaActualizacion,
      ultimoEvento: barrierState.ultimoEvento,
      departamento: barrierState.departamento,
      usuario: barrierState.usuario,
      tiempoAbierta: barrierState.tiempoApertura
        ? Math.floor((Date.now() - barrierState.tiempoApertura) / 1000)
        : null
    });
  } catch (error) {
    console.error('Error obteniendo estado de barrera:', error);
    return res.status(500).json({ error: 'Error al obtener estado de barrera' });
  }
});

/**
 * POST /api/access/validate
 * Valida si una MAC de sensor RFID tiene acceso permitido
 * Usado por Postman para simular lectura de tarjeta RFID (sin NodeMCU físico)
 */
router.post('/validate', async (req, res) => {
  try {
    const { mac_sensor } = req.body;

    if (!mac_sensor) {
      return res.status(400).json({
        acceso_permitido: false,
        mensaje: 'MAC del sensor es requerida'
      });
    }

    // Normalizar MAC (mayúsculas, sin espacios)
    const macNormalizada = mac_sensor.trim().toUpperCase();

    // Buscar el sensor en la BD
    const sensor = await db('sensores')
      .select(
        'sensores.*',
        'departamentos.numero as depto_numero',
        'departamentos.torre as depto_torre'
      )
      .leftJoin('departamentos', 'sensores.id_departamento', 'departamentos.id_departamento')
      .where('sensores.codigo_sensor', macNormalizada)
      .first();

    let tipoEvento = 'ACCESO_RECHAZADO';
    let resultado = 'DENEGADO';
    let accesoPermitido = false;
    let mensaje = '';

    if (!sensor) {
      // Sensor no registrado
      mensaje = 'Sensor no registrado en el sistema';
      tipoEvento = 'ACCESO_RECHAZADO';
    } else if (sensor.estado === 'BLOQUEADO') {
      mensaje = `Sensor BLOQUEADO - ${sensor.alias || sensor.codigo_sensor}`;
      tipoEvento = 'SENSOR_BLOQUEADO';
    } else if (sensor.estado === 'PERDIDO') {
      mensaje = `Sensor reportado como PERDIDO - ${sensor.alias || sensor.codigo_sensor}`;
      tipoEvento = 'SENSOR_PERDIDO';
    } else if (sensor.estado === 'INACTIVO') {
      mensaje = `Sensor INACTIVO - ${sensor.alias || sensor.codigo_sensor}`;
      tipoEvento = 'ACCESO_RECHAZADO';
    } else if (sensor.estado === 'ACTIVO') {
      // Acceso permitido
      accesoPermitido = true;
      resultado = 'PERMITIDO';
      tipoEvento = 'ACCESO_VALIDO';
      mensaje = `Acceso permitido - Depto ${sensor.depto_numero}${sensor.depto_torre ? ' ' + sensor.depto_torre : ''}`;
    }

    // Registrar evento en la BD
    await db('eventos_acceso').insert({
      id_sensor: sensor ? sensor.id_sensor : null,
      id_usuario: sensor ? sensor.id_usuario_registro : null,
      id_departamento: sensor ? sensor.id_departamento : null,
      tipo_evento: tipoEvento,
      resultado: resultado,
      mac_sensor: macNormalizada,
      detalles: mensaje,
      fecha_hora: db.fn.now()
    });

    console.log(`[RFID] ${tipoEvento}: ${macNormalizada} - ${mensaje}`);

    // SIMULACIÓN: Actualizar estado de la barrera (simula el NodeMCU)
    if (accesoPermitido) {
      actualizarBarrera(
        'ABIERTA',
        tipoEvento,
        sensor.id_departamento,
        sensor.id_usuario_registro
      );
    }
    // Si el acceso es denegado, la barrera se mantiene cerrada (no hacemos nada)

    // Respuesta (simulando lo que respondería el NodeMCU)
    return res.status(200).json({
      acceso_permitido: accesoPermitido,
      mensaje: mensaje,
      sensor: sensor ? {
        id: sensor.id_sensor,
        tipo: sensor.tipo,
        alias: sensor.alias,
        departamento: `${sensor.depto_numero}${sensor.depto_torre ? ' - ' + sensor.depto_torre : ''}`
      } : null
    });

  } catch (error) {
    console.error('Error en validación de acceso:', error);
    return res.status(500).json({
      acceso_permitido: false,
      mensaje: 'Error interno del servidor',
      error: error.message
    });
  }
});

/**
 * POST /api/access/manual-open
 * Abre la barrera manualmente desde la app móvil
 * Requiere autenticación
 */
router.post('/manual-open', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    // Obtener información del usuario
    const user = await db('users')
      .select('id', 'name', 'id_departamento', 'rol', 'estado')
      .where({ id: userId })
      .first();

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.estado !== 'ACTIVO') {
      return res.status(403).json({ error: 'Usuario no está activo' });
    }

    if (!user.id_departamento) {
      return res.status(400).json({ error: 'Usuario no está asociado a un departamento' });
    }

    // Crear comando remoto para el NodeMCU
    await db('comandos_remotos').insert({
      comando: 'ABRIR',
      id_usuario: userId,
      id_departamento: user.id_departamento,
      estado: 'PENDIENTE',
      fecha_creacion: db.fn.now()
    });

    // Registrar evento de apertura manual
    await db('eventos_acceso').insert({
      id_usuario: userId,
      id_departamento: user.id_departamento,
      tipo_evento: 'APERTURA_MANUAL',
      resultado: 'PERMITIDO',
      detalles: `Apertura manual desde app - Usuario: ${user.name}`,
      fecha_hora: db.fn.now()
    });

    // SIMULACIÓN: Actualizar estado de la barrera inmediatamente
    actualizarBarrera('ABIERTA', 'APERTURA_MANUAL', user.id_departamento, userId);

    console.log(`[APP] Apertura manual - Usuario: ${user.name} - Depto: ${user.id_departamento}`);

    return res.status(200).json({
      success: true,
      mensaje: 'Comando de apertura enviado',
      usuario: user.name
    });

  } catch (error) {
    console.error('Error en apertura manual:', error);
    return res.status(500).json({ error: 'Error al procesar apertura manual' });
  }
});

/**
 * POST /api/access/manual-close
 * Cierra la barrera manualmente desde la app móvil
 * Requiere autenticación
 */
router.post('/manual-close', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const user = await db('users')
      .select('id', 'name', 'id_departamento', 'rol', 'estado')
      .where({ id: userId })
      .first();

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.estado !== 'ACTIVO') {
      return res.status(403).json({ error: 'Usuario no está activo' });
    }

    if (!user.id_departamento) {
      return res.status(400).json({ error: 'Usuario no está asociado a un departamento' });
    }

    // Crear comando remoto
    await db('comandos_remotos').insert({
      comando: 'CERRAR',
      id_usuario: userId,
      id_departamento: user.id_departamento,
      estado: 'PENDIENTE',
      fecha_creacion: db.fn.now()
    });

    // Registrar evento
    await db('eventos_acceso').insert({
      id_usuario: userId,
      id_departamento: user.id_departamento,
      tipo_evento: 'CIERRE_MANUAL',
      resultado: 'PERMITIDO',
      detalles: `Cierre manual desde app - Usuario: ${user.name}`,
      fecha_hora: db.fn.now()
    });

    // SIMULACIÓN: Actualizar estado de la barrera inmediatamente
    actualizarBarrera('CERRADA', 'CIERRE_MANUAL', user.id_departamento, userId);

    console.log(`[APP] Cierre manual - Usuario: ${user.name} - Depto: ${user.id_departamento}`);

    return res.status(200).json({
      success: true,
      mensaje: 'Comando de cierre enviado',
      usuario: user.name
    });

  } catch (error) {
    console.error('Error en cierre manual:', error);
    return res.status(500).json({ error: 'Error al procesar cierre manual' });
  }
});

/**
 * GET /api/access/get-command
 * El NodeMCU consulta si hay comandos pendientes
 * No requiere autenticación (el NodeMCU no tiene token JWT)
 */
router.get('/get-command', async (req, res) => {
  try {
    // Buscar el comando pendiente más reciente
    const comando = await db('comandos_remotos')
      .where({ estado: 'PENDIENTE' })
      .orderBy('fecha_creacion', 'desc')
      .first();

    if (!comando) {
      return res.status(200).json({ comando: null });
    }

    // Verificar si el comando expiró (más de 30 segundos)
    const ahora = new Date();
    const fechaCreacion = new Date(comando.fecha_creacion);
    const segundosTranscurridos = (ahora - fechaCreacion) / 1000;

    if (segundosTranscurridos > comando.ttl_segundos) {
      // Marcar como expirado
      await db('comandos_remotos')
        .where({ id_comando: comando.id_comando })
        .update({ estado: 'EXPIRADO' });

      return res.status(200).json({ comando: null });
    }

    // Marcar como ejecutado
    await db('comandos_remotos')
      .where({ id_comando: comando.id_comando })
      .update({
        estado: 'EJECUTADO',
        fecha_ejecucion: db.fn.now()
      });

    console.log(`[NodeMCU] Comando ejecutado: ${comando.comando}`);

    return res.status(200).json({
      comando: comando.comando // 'ABRIR' o 'CERRAR'
    });

  } catch (error) {
    console.error('Error obteniendo comando:', error);
    return res.status(500).json({ error: 'Error al obtener comandos' });
  }
});

/**
 * GET /api/access/history/:departmentId
 * Obtiene el historial de accesos de un departamento
 * Requiere autenticación
 */
router.get('/history/:departmentId', authenticateToken, async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Verificar que el usuario pertenece al departamento
    const user = await db('users')
      .where({ id: req.userId })
      .first();

    if (user.id_departamento != departmentId && user.rol !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes permiso para ver este historial' });
    }

    // Obtener eventos
    const eventos = await db('eventos_acceso')
      .select(
        'eventos_acceso.*',
        'users.name as usuario_nombre',
        'sensores.alias as sensor_alias',
        'sensores.tipo as sensor_tipo'
      )
      .leftJoin('users', 'eventos_acceso.id_usuario', 'users.id')
      .leftJoin('sensores', 'eventos_acceso.id_sensor', 'sensores.id_sensor')
      .where('eventos_acceso.id_departamento', departmentId)
      .orderBy('eventos_acceso.fecha_hora', 'desc')
      .limit(limit)
      .offset(offset);

    return res.status(200).json({
      eventos,
      total: eventos.length
    });

  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return res.status(500).json({ error: 'Error al obtener historial' });
  }
});

export default router;
