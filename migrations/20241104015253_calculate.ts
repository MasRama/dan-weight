import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('calculations', (table) => {
        table.increments('id').primary();
        table.string('ticket_number')
        table.string('vehicle_number')
        table.string('driver_name')
        table.string('owner_name')
        table.decimal('entry_weight', 10, 2)
        table.decimal('exit_weight', 10, 2)
        table.decimal('price_per_kg', 10, 2)
        table.decimal('net_weight', 10, 2)
        table.decimal('rounded_weight', 10, 2)
        table.decimal('rounding_off', 10, 2)
        table.decimal('total_price', 12, 2)
        table.bigInteger('entry_datetime')
        table.bigInteger('exit_datetime')
        table.integer('user_id').unsigned()
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.foreign('user_id').references('id').inTable('users');
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('calculations');
}
