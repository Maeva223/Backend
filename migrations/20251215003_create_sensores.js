/**
 * Migración: Crear tabla SENSORES (Tarjetas y Llaveros RFID)
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const has = await knex.schema.hasTable('sensores');
  if (!has) {
    await knex.schema.createTable('sensores', (t) => {
      t.increments('id_sensor').primary();

      // MAC/UID del dispositivo RFID (formato: "A1:B2:C3:D4" o "A1B2C3D4")
      t.string('codigo_sensor', 50).notNullable().unique();

      // Estado del sensor
      t.enum('estado', ['ACTIVO', 'INACTIVO', 'PERDIDO', 'BLOQUEADO'])
        .defaultTo('ACTIVO')
        .notNullable();

      // Tipo de sensor
      t.enum('tipo', ['Llavero', 'Tarjeta']).defaultTo('Tarjeta').notNullable();

      // Relación con departamento
      t.integer('id_departamento').unsigned().notNullable();
      t.foreign('id_departamento')
        .references('id_departamento')
        .inTable('departamentos')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');

      // Relación con usuario que registró (opcional, para auditoría)
      t.integer('id_usuario_registro').unsigned().nullable();
      t.foreign('id_usuario_registro')
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .onUpdate('CASCADE');

      // Alias/descripción del sensor (ej: "Tarjeta de Juan", "Llavero Principal")
      t.string('alias', 100).nullable();

      // Fechas de control
      t.timestamp('fecha_alta').defaultTo(knex.fn.now());
      t.timestamp('fecha_baja').nullable();
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    // Índices para optimizar búsquedas
    await knex.schema.raw(`
      CREATE INDEX idx_sensores_codigo ON sensores(codigo_sensor);
      CREATE INDEX idx_sensores_departamento ON sensores(id_departamento);
      CREATE INDEX idx_sensores_estado ON sensores(estado);
    `);

    console.log('✅ Tabla "sensores" creada exitosamente con índices');
  }
}

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('sensores');
  console.log('❌ Tabla "sensores" eliminada');
}
