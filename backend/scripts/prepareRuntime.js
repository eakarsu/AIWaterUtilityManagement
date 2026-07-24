'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  if (!['true', '1'].includes(process.env.ALLOW_SCHEMA_MIGRATION || '')) throw new Error('ALLOW_SCHEMA_MIGRATION=true is required');
  const email = (process.env.PROVISION_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.PROVISION_ADMIN_PASSWORD || '';
  const name = (process.env.PROVISION_ADMIN_NAME || '').trim();
  if (!email || !name || password.length < 12) throw new Error('runtime administrator configuration is incomplete');
  await pool.query(fs.readFileSync(path.resolve(__dirname, '../db/schema.sql'), 'utf8'));
  await pool.query(fs.readFileSync(path.resolve(__dirname, '../migrations/001_governed_workflows.sql'), 'utf8'));
  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO users(email,password,name,role) VALUES($1,$2,$3,'admin')
     ON CONFLICT(email) DO UPDATE SET password=EXCLUDED.password,name=EXCLUDED.name,role='admin'`,
    [email, hash, name]
  );
  console.log('Runtime schema and administrator are ready.');
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
