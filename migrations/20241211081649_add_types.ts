import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('calculations', (table) => {
        table.string('types').nullable();
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('calculations', (table) => {
        table.dropColumn('types');
    });
}

