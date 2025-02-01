"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const knexfile_1 = __importDefault(require("../../knexfile"));
require('dotenv').config();
const dbInstance = {};
const stage = process.env.DB_CONNECTION || 'development';
let DB = require('knex')(knexfile_1.default[stage]);
DB.connection = (connectionStage = stage) => {
    if (dbInstance[connectionStage]) {
        return dbInstance[connectionStage];
    }
    dbInstance[connectionStage] = require('knex')(knexfile_1.default[connectionStage]);
    return dbInstance[connectionStage];
};
exports.default = DB;
