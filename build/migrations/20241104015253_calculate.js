"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
function up(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        return knex.schema.createTable('calculations', (table) => {
            table.increments('id').primary();
            table.string('ticket_number');
            table.string('vehicle_number');
            table.string('driver_name');
            table.string('owner_name');
            table.decimal('entry_weight', 10, 2);
            table.decimal('exit_weight', 10, 2);
            table.decimal('price_per_kg', 10, 2);
            table.decimal('net_weight', 10, 2);
            table.decimal('rounded_weight', 10, 2);
            table.decimal('rounding_off', 10, 2);
            table.decimal('total_price', 12, 2);
            table.bigInteger('entry_datetime');
            table.bigInteger('exit_datetime');
            table.integer('user_id').unsigned();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.foreign('user_id').references('id').inTable('users');
        });
    });
}
function down(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        return knex.schema.dropTable('calculations');
    });
}
