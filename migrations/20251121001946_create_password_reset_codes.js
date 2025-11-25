/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
    const has = await knex.schema.hasTable('password_reset_codes');

    if (!has) {
        await knex.schema.createTable('password_reset_codes', (t) => {
            t.increments('id').primary();

            // Relación con la tabla users
            t.integer('user_id')
                .unsigned()
                .notNullable()
                .references('id')
                .inTable('users')
                .onDelete('CASCADE');

            // Código de 5 dígitos (ej: "04237")
            t.string('code', 5).notNullable();

            // Marcar si ya fue usado
            t.boolean('used').notNullable().defaultTo(false);

            // Cuándo se generó
            t.timestamp('created_at').defaultTo(knex.fn.now());
        });
    }
}

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
    await knex.schema.dropTableIfExists('password_reset_codes');
}
