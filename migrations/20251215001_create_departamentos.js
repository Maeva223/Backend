/**
 * Migración: Crear tabla DEPARTAMENTOS
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const has = await knex.schema.hasTable('departamentos');
  if (!has) {
    await knex.schema.createTable('departamentos', (t) => {
      t.increments('id_departamento').primary();
      t.string('numero', 10).notNullable();  // Ej: "101", "A-23"
      t.string('torre', 50).nullable();       // Ej: "Torre A", "Edificio Norte"
      t.string('condominio', 100).notNullable().defaultTo('Condominio Principal');
      t.integer('piso').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());

      // Índice único para evitar departamentos duplicados
      t.unique(['numero', 'torre', 'condominio']);
    });

    console.log('✅ Tabla "departamentos" creada exitosamente');
  }
}

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('departamentos');
  console.log('❌ Tabla "departamentos" eliminada');
}
