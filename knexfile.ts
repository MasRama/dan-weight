require('dotenv').config()

import type { Knex } from "knex";

const stage = process.env.DB_CONNECTION || 'development';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "better-sqlite3",
    connection: {
      filename: "./database/devdb.sqlite3"
    },
    useNullAsDefault: true
  },

  testing: {
    client: "better-sqlite3",
    connection: {
      filename: "./database/testing.sqlite3"
    },
    useNullAsDefault: true
  },

  production: {
    client: "better-sqlite3",
    connection: {
      filename: "./database/production.sqlite3"
    },
    useNullAsDefault: true
  }
};

console.log(`Using ${stage} database configuration`);
export default config;
