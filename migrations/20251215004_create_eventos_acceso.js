/**
 * Migración: Crear tabla EVENTOS_ACCESO
 * Registra todos los intentos de acceso (válidos, rechazados, manuales)
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const has = await knex.schema.hasTable('eventos_acceso');
  if (!has) {
    await knex.schema.createTable('eventos_acceso', (t) => {
      t.increments('id_evento').primary();

      // Sensor que generó el evento (puede ser NULL si es apertura manual desde app)
      t.integer('id_sensor').unsigned().nullable();
      t.foreign('id_sensor')
        .references('id_sensor')
        .inTable('sensores')
        .onDelete('SET NULL')
        .onUpdate('CASCADE');

      // Usuario asociado (puede ser NULL si sensor no registrado)
      t.integer('id_usuario').unsigned().nullable();
      t.foreign('id_usuario')
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .onUpdate('CASCADE');

      // Departamento (denormalizado para consultas rápidas)
      t.integer('id_departamento').unsigned().nullable();
      t.foreign('id_departamento')
        .references('id_departamento')
        .inTable('departamentos')
        .onDelete('SET NULL')
        .onUpdate('CASCADE');

      // Tipo de evento
      t.enum('tipo_evento', [
        'ACCESO_VALIDO',
        'ACCESO_RECHAZADO',
        'APERTURA_MANUAL',
        'CIERRE_MANUAL',
        'SENSOR_BLOQUEADO',
        'SENSOR_PERDIDO'
      ]).notNullable();

      // Resultado del evento
      t.enum('resultado', ['PERMITIDO', 'DENEGADO']).notNullable();

      // MAC del sensor (denormalizado para tener historial incluso si se elimina sensor)
      t.string('mac_sensor', 50).nullable();

      // Datos adicionales (IP del NodeMCU, mensaje, etc.)
      t.text('detalles').nullable();

      // Timestamp del evento
      t.timestamp('fecha_hora').defaultTo(knex.fn.now()).notNullable();
    });

    // Índices para optimizar búsquedas de historial
    await knex.schema.raw(`
      CREATE INDEX idx_eventos_fecha ON eventos_acceso(fecha_hora DESC);
      CREATE INDEX idx_eventos_departamento ON eventos_acceso(id_departamento, fecha_hora DESC);
      CREATE INDEX idx_eventos_tipo ON eventos_acceso(tipo_evento);
      CREATE INDEX idx_eventos_sensor ON eventos_acceso(id_sensor);
    `);

    console.log('✅ Tabla "eventos_acceso" creada exitosamente con índices');
  }
}

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('eventos_acceso');
  console.log('❌ Tabla "eventos_acceso" eliminada');
}
