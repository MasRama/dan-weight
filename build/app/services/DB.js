"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const knexfile_1 = __importDefault(require("../../knexfile"));
require('dotenv').config();
const dbInstance = {};
let DB = require('knex')(knexfile_1.default[process.env.DB_CONNECTION]);
DB.connection = (stage) => {
    if (dbInstance[stage]) {
        return dbInstance[stage];
    }
    else {
        dbInstance[stage] = DB = require('knex')(knexfile_1.default[stage]);
        return dbInstance[stage];
    }
};
exports.default = DB;
