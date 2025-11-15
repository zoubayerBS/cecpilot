"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
var node_postgres_1 = require("drizzle-orm/node-postgres");
var pg_1 = require("pg");
var schema = require("./db/schema");
var connectionString = process.env.POSTGRES_URL;
var pool = new pg_1.Pool({
    connectionString: connectionString,
});
pool.on('connect', function (client) {
    client.query('SET search_path TO cecschema, public');
});
exports.db = (0, node_postgres_1.drizzle)(pool, { schema: schema });
