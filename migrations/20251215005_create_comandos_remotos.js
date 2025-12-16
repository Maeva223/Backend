/**
 * Migración: Crear tabla COMANDOS_REMOTOS
 * Maneja comandos de apertura/cierre manual desde la app móvil
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const has = await knex.schema.hasTable('comandos_remotos');
  if (!has) {
    await knex.schema.createTable('comandos_remotos', (t) => {
      t.increments('id_comando').primary();

      // Tipo de comando
      t.enum('comando', ['ABRIR', 'CERRAR']).notNullable();

      // Usuario que ejecutó el comando
      t.integer('id_usuario').unsigned().notNullable();
      t.foreign('id_usuario')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');

      // Departamento asociado
      t.integer('id_departamento').unsigned().notNullable();
      t.foreign('id_departamento')
        .references('id_departamento')
        .inTable('departamentos')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');

      // Estado del comando
      t.enum('estado', ['PENDIENTE', 'EJECUTADO', 'EXPIRADO']).defaultTo('PENDIENTE').notNullable();

      // Timestamps
      t.timestamp('fecha_creacion').defaultTo(knex.fn.now()).notNullable();
      t.timestamp('fecha_ejecucion').nullable();

      // TTL: comandos pendientes por más de 30 segundos se marcan como expirados
      t.integer('ttl_segundos').defaultTo(30).notNullable();
    });

    // Índice para que NodeMCU consulte comandos pendientes rápidamente
    await knex.schema.raw(`
      CREATE INDEX idx_comandos_estado ON comandos_remotos(estado, fecha_creacion DESC);
    `);

    console.log('✅ Tabla "comandos_remotos" creada exitosamente');
  }
}

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('comandos_remotos');
  console.log('❌ Tabla "comandos_remotos" eliminada');
}
