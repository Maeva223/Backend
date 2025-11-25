/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
    const hasTable = await knex.schema.hasTable('users');

    if (hasTable) {
        await knex.schema.alterTable('users', (t) => {
            t.string('last_name', 120)
                .notNullable()
                .defaultTo(''); // <-- Valor por defecto para SQLite
        });
    }
}

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */


export async function down(knex) {
    const hasTable = await knex.schema.hasTable('users');

    if (hasTable) {
        await knex.schema.alterTable('users', (t) => {
            t.dropColumn('last_name');
        });
    }
}