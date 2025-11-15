"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.utilities = exports.users = exports.sessions = exports.cecForms = exports.cecSchema = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
exports.cecSchema = (0, pg_core_1.pgSchema)('cecschema');
exports.cecForms = exports.cecSchema.table('cec_forms', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    patientInfo: (0, pg_core_1.jsonb)('patient_info'),
    teamInfo: (0, pg_core_1.jsonb)('team_info'),
    preOpBilan: (0, pg_core_1.jsonb)('pre_op_bilan'),
    materiel: (0, pg_core_1.jsonb)('materiel'),
    deroulement: (0, pg_core_1.jsonb)('deroulement'),
    bloodGas: (0, pg_core_1.jsonb)('blood_gas'),
    timeline: (0, pg_core_1.jsonb)('timeline'),
    cardioplegia: (0, pg_core_1.jsonb)('cardioplegia'),
    hemodynamicMonitoring: (0, pg_core_1.jsonb)('hemodynamic_monitoring'),
    bloodProducts: (0, pg_core_1.jsonb)('blood_products'),
    balanceIO: (0, pg_core_1.jsonb)('balance_io'),
    examensComplementaires: (0, pg_core_1.jsonb)('examens_complementaires'),
    observations: (0, pg_core_1.text)('observations'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
exports.sessions = exports.cecSchema.table('sessions', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    token: (0, pg_core_1.text)('token').unique(),
    username: (0, pg_core_1.text)('username'),
    expires: (0, pg_core_1.timestamp)('expires'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
exports.users = exports.cecSchema.table('users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    username: (0, pg_core_1.text)('username').unique(),
    password: (0, pg_core_1.text)('password'), // In a real app, this should be a strong hash
});
exports.utilities = exports.cecSchema.table('utilities', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    category: (0, pg_core_1.text)('category').notNull(),
    item: (0, pg_core_1.text)('item').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, function (table) {
    return {
        unq: (0, pg_core_1.unique)().on(table.category, table.item),
    };
});
