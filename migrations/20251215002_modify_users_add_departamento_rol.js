/**
 * Migración: Agregar campos rol, estado e id_departamento a tabla USERS
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasRol = await knex.schema.hasColumn('users', 'rol');
  const hasEstado = await knex.schema.hasColumn('users', 'estado');
  const hasDepartamento = await knex.schema.hasColumn('users', 'id_departamento');

  await knex.schema.alterTable('users', (t) => {
    if (!hasRol) {
      t.enum('rol', ['ADMIN', 'OPERADOR']).defaultTo('OPERADOR').notNullable();
      console.log('✅ Columna "rol" agregada');
    }

    if (!hasEstado) {
      t.enum('estado', ['ACTIVO', 'INACTIVO', 'BLOQUEADO']).defaultTo('ACTIVO').notNullable();
      console.log('✅ Columna "estado" agregada');
    }

    if (!hasDepartamento) {
      t.integer('id_departamento').unsigned().nullable();
      t.foreign('id_departamento')
        .references('id_departamento')
        .inTable('departamentos')
        .onDelete('SET NULL')
        .onUpdate('CASCADE');
      console.log('✅ Columna "id_departamento" agregada con FK');
    }
  });

  console.log('✅ Tabla "users" modificada exitosamente');
}

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable('users', (t) => {
    t.dropForeign('id_departamento');
    t.dropColumn('id_departamento');
    t.dropColumn('rol');
    t.dropColumn('estado');
  });

  console.log('❌ Columnas "rol", "estado", "id_departamento" eliminadas de "users"');
}
