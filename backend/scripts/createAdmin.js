'use strict';

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function main() {
  if (process.env.BOOTSTRAP_ACKNOWLEDGEMENT !== 'create-initial-admin') {
    throw new Error('BOOTSTRAP_ACKNOWLEDGEMENT=create-initial-admin is required');
  }
  const email = process.env.PROVISION_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
  const password = process.env.PROVISION_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  const name = process.env.PROVISION_ADMIN_NAME || 'Water Utility Administrator';
  if (!process.env.DATABASE_URL || !email || !password) {
    throw new Error('DATABASE_URL, PROVISION_ADMIN_EMAIL, and PROVISION_ADMIN_PASSWORD are required');
  }
  if (password.length < 12) throw new Error('PROVISION_ADMIN_PASSWORD must contain at least 12 characters');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await pool.query(
      `INSERT INTO users (email, password, name, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO UPDATE SET password=EXCLUDED.password, name=EXCLUDED.name, role='admin'`,
      [email.toLowerCase(), passwordHash, name]
    );
    console.log(`Administrator provisioned for ${email.toLowerCase()}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`Administrator provisioning failed: ${error.message}`);
  process.exit(1);
});
