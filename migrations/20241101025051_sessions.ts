import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('sessions', (table) => {
        table.string('id').primary();
        table.integer('user_id').unsigned().notNullable();
        table.string('token').notNullable();
        table.timestamp('expires_at').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.foreign('user_id').references('id').inTable('users');
        table.index(['user_id', 'token']);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('sessions');
}
