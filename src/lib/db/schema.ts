
import { pgTable, serial, text, timestamp, jsonb, pgSchema, unique, boolean } from 'drizzle-orm/pg-core';

export const cecSchema = pgSchema('cecschema');

export const cecForms = cecSchema.table('cec_forms', {
  id: serial('id').primaryKey(),
  patientInfo: jsonb('patient_info'),
  teamInfo: jsonb('team_info'),
  preOpBilan: jsonb('pre_op_bilan'),
  materiel: jsonb('materiel'),
  deroulement: jsonb('deroulement'),
  bloodGas: jsonb('blood_gas'),
  timeline: jsonb('timeline'),
  cardioplegia: jsonb('cardioplegia'),
  hemodynamicMonitoring: jsonb('hemodynamic_monitoring'),
  bloodProducts: jsonb('blood_products'),
  balanceIO: jsonb('balance_io'),
  examensComplementaires: jsonb('examens_complementaires'),
  observations: text('observations'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const sessions = cecSchema.table('sessions', {
  id: serial('id').primaryKey(),
  token: text('token').unique(),
  username: text('username'),
  expires: timestamp('expires'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const users = cecSchema.table('users', {
  id: serial('id').primaryKey(),
  username: text('username').unique(),
  password: text('password'), // In a real app, this should be a strong hash
  twoFactorSecret: text('two_factor_secret'),
  isTwoFactorEnabled: boolean('is_two_factor_enabled').default(false),
});

export const utilities = cecSchema.table('utilities', {
  id: serial('id').primaryKey(),
  category: text('category').notNull(),
  item: text('item').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    unq: unique().on(table.category, table.item),
  };
});

