/**
 * Rutas de Gestión de Sensores RFID
 * CRUD de sensores (tarjetas y llaveros)
 * Solo usuarios ADMIN de departamento pueden gestionar sus sensores
 */

import express from 'express';
import db from '../db/knex.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/sensors/department/:departmentId
 * Obtiene todos los sensores de un departamento
 * Requiere autenticación
 */
router.get('/department/:departmentId', authenticateToken, async (req, res) => {
  try {
    const { departmentId } = req.params;

    // Verificar que el usuario pertenece al departamento
    const user = await db('users')
      .where({ id: req.userId })
      .first();

    if (user.id_departamento != departmentId) {
      return res.status(403).json({ error: 'No tienes permiso para ver estos sensores' });
    }

    const sensores = await db('sensores')
      .select('*')
      .where({ id_departamento: departmentId })
      .orderBy('fecha_alta', 'desc');

    return res.status(200).json({ sensores });

  } catch (error) {
    console.error('Error obteniendo sensores:', error);
    return res.status(500).json({ error: 'Error al obtener sensores' });
  }
});

/**
 * POST /api/sensors/register
 * Registra un nuevo sensor RFID
 * Solo para usuarios ADMIN
 */
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const { codigo_sensor, tipo, alias } = req.body;

    if (!codigo_sensor || !tipo) {
      return res.status(400).json({ error: 'Código del sensor y tipo son requeridos' });
    }

    // Verificar que el usuario es ADMIN
    const user = await db('users')
      .where({ id: req.userId })
      .first();

    if (user.rol !== 'ADMIN') {
      return res.status(403).json({ error: 'Solo administradores pueden registrar sensores' });
    }

    if (!user.id_departamento) {
      return res.status(400).json({ error: 'Usuario no está asociado a un departamento' });
    }

    // Normalizar MAC
    const macNormalizada = codigo_sensor.trim().toUpperCase();

    // Verificar si ya existe
    const existe = await db('sensores')
      .where({ codigo_sensor: macNormalizada })
      .first();

    if (existe) {
      return res.status(409).json({ error: 'Este sensor ya está registrado' });
    }

    // Insertar sensor
    const [sensorId] = await db('sensores').insert({
      codigo_sensor: macNormalizada,
      tipo: tipo,
      alias: alias || null,
      estado: 'ACTIVO',
      id_departamento: user.id_departamento,
      id_usuario_registro: req.userId,
      fecha_alta: db.fn.now()
    }).returning('id_sensor');

    console.log(`[SENSOR] Registrado: ${macNormalizada} - Tipo: ${tipo} - Depto: ${user.id_departamento}`);

    return res.status(201).json({
      success: true,
      mensaje: 'Sensor registrado exitosamente',
      sensor_id: sensorId
    });

  } catch (error) {
    console.error('Error registrando sensor:', error);
    return res.status(500).json({ error: 'Error al registrar sensor' });
  }
});

/**
 * PUT /api/sensors/:sensorId/activate
 * Activa un sensor (cambia estado a ACTIVO)
 * Solo para usuarios ADMIN del mismo departamento
 */
router.put('/:sensorId/activate', authenticateToken, async (req, res) => {
  try {
    const { sensorId } = req.params;

    // Verificar que el usuario es ADMIN
    const user = await db('users')
      .where({ id: req.userId })
      .first();

    if (user.rol !== 'ADMIN') {
      return res.status(403).json({ error: 'Solo administradores pueden activar sensores' });
    }

    // Verificar que el sensor pertenece al mismo departamento
    const sensor = await db('sensores')
      .where({ id_sensor: sensorId })
      .first();

    if (!sensor) {
      return res.status(404).json({ error: 'Sensor no encontrado' });
    }

    if (sensor.id_departamento !== user.id_departamento) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este sensor' });
    }

    // Actualizar estado
    await db('sensores')
      .where({ id_sensor: sensorId })
      .update({
        estado: 'ACTIVO',
        fecha_baja: null,
        updated_at: db.fn.now()
      });

    console.log(`[SENSOR] Activado: ID ${sensorId} - ${sensor.codigo_sensor}`);

    return res.status(200).json({
      success: true,
      mensaje: 'Sensor activado exitosamente'
    });

  } catch (error) {
    console.error('Error activando sensor:', error);
    return res.status(500).json({ error: 'Error al activar sensor' });
  }
});

/**
 * PUT /api/sensors/:sensorId/deactivate
 * Desactiva un sensor (cambia estado a INACTIVO)
 * Solo para usuarios ADMIN
 */
router.put('/:sensorId/deactivate', authenticateToken, async (req, res) => {
  try {
    const { sensorId } = req.params;

    const user = await db('users')
      .where({ id: req.userId })
      .first();

    if (user.rol !== 'ADMIN') {
      return res.status(403).json({ error: 'Solo administradores pueden desactivar sensores' });
    }

    const sensor = await db('sensores')
      .where({ id_sensor: sensorId })
      .first();

    if (!sensor) {
      return res.status(404).json({ error: 'Sensor no encontrado' });
    }

    if (sensor.id_departamento !== user.id_departamento) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este sensor' });
    }

    await db('sensores')
      .where({ id_sensor: sensorId })
      .update({
        estado: 'INACTIVO',
        updated_at: db.fn.now()
      });

    console.log(`[SENSOR] Desactivado: ID ${sensorId} - ${sensor.codigo_sensor}`);

    return res.status(200).json({
      success: true,
      mensaje: 'Sensor desactivado exitosamente'
    });

  } catch (error) {
    console.error('Error desactivando sensor:', error);
    return res.status(500).json({ error: 'Error al desactivar sensor' });
  }
});

/**
 * PUT /api/sensors/:sensorId/block
 * Bloquea un sensor (cambia estado a BLOQUEADO)
 * Solo para usuarios ADMIN
 */
router.put('/:sensorId/block', authenticateToken, async (req, res) => {
  try {
    const { sensorId } = req.params;

    const user = await db('users')
      .where({ id: req.userId })
      .first();

    if (user.rol !== 'ADMIN') {
      return res.status(403).json({ error: 'Solo administradores pueden bloquear sensores' });
    }

    const sensor = await db('sensores')
      .where({ id_sensor: sensorId })
      .first();

    if (!sensor) {
      return res.status(404).json({ error: 'Sensor no encontrado' });
    }

    if (sensor.id_departamento !== user.id_departamento) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este sensor' });
    }

    await db('sensores')
      .where({ id_sensor: sensorId })
      .update({
        estado: 'BLOQUEADO',
        fecha_baja: db.fn.now(),
        updated_at: db.fn.now()
      });

    console.log(`[SENSOR] Bloqueado: ID ${sensorId} - ${sensor.codigo_sensor}`);

    return res.status(200).json({
      success: true,
      mensaje: 'Sensor bloqueado exitosamente'
    });

  } catch (error) {
    console.error('Error bloqueando sensor:', error);
    return res.status(500).json({ error: 'Error al bloquear sensor' });
  }
});

/**
 * PUT /api/sensors/:sensorId/mark-lost
 * Marca un sensor como PERDIDO
 * Solo para usuarios ADMIN
 */
router.put('/:sensorId/mark-lost', authenticateToken, async (req, res) => {
  try {
    const { sensorId } = req.params;

    const user = await db('users')
      .where({ id: req.userId })
      .first();

    if (user.rol !== 'ADMIN') {
      return res.status(403).json({ error: 'Solo administradores pueden marcar sensores como perdidos' });
    }

    const sensor = await db('sensores')
      .where({ id_sensor: sensorId })
      .first();

    if (!sensor) {
      return res.status(404).json({ error: 'Sensor no encontrado' });
    }

    if (sensor.id_departamento !== user.id_departamento) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este sensor' });
    }

    await db('sensores')
      .where({ id_sensor: sensorId })
      .update({
        estado: 'PERDIDO',
        fecha_baja: db.fn.now(),
        updated_at: db.fn.now()
      });

    console.log(`[SENSOR] Marcado como PERDIDO: ID ${sensorId} - ${sensor.codigo_sensor}`);

    return res.status(200).json({
      success: true,
      mensaje: 'Sensor marcado como perdido exitosamente'
    });

  } catch (error) {
    console.error('Error marcando sensor como perdido:', error);
    return res.status(500).json({ error: 'Error al marcar sensor como perdido' });
  }
});

/**
 * DELETE /api/sensors/:sensorId
 * Elimina un sensor (solo si no tiene eventos asociados)
 * Solo para usuarios ADMIN
 */
router.delete('/:sensorId', authenticateToken, async (req, res) => {
  try {
    const { sensorId } = req.params;

    const user = await db('users')
      .where({ id: req.userId })
      .first();

    if (user.rol !== 'ADMIN') {
      return res.status(403).json({ error: 'Solo administradores pueden eliminar sensores' });
    }

    const sensor = await db('sensores')
      .where({ id_sensor: sensorId })
      .first();

    if (!sensor) {
      return res.status(404).json({ error: 'Sensor no encontrado' });
    }

    if (sensor.id_departamento !== user.id_departamento) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este sensor' });
    }

    // Verificar si tiene eventos (mejor no eliminar si tiene historial)
    const eventos = await db('eventos_acceso')
      .where({ id_sensor: sensorId })
      .count('id_evento as count')
      .first();

    if (eventos.count > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar un sensor con historial de eventos. Considere bloquearlo en su lugar.'
      });
    }

    await db('sensores')
      .where({ id_sensor: sensorId })
      .delete();

    console.log(`[SENSOR] Eliminado: ID ${sensorId} - ${sensor.codigo_sensor}`);

    return res.status(200).json({
      success: true,
      mensaje: 'Sensor eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando sensor:', error);
    return res.status(500).json({ error: 'Error al eliminar sensor' });
  }
});

export default router;
