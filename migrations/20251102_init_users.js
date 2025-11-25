/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const has = await knex.schema.hasTable('users');
  if (!has) {
    await knex.schema.createTable('users', (t) => {
      t.increments('id').primary();
      t.string('name', 120).notNullable();
      t.string('email', 190).notNullable().unique();
      t.string('password_hash', 255).notNullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
}

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('users');
}
