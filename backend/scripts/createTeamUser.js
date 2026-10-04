require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../src/config/db');

(async () => {
  const [name, email, password, role = 'sub_admin'] = process.argv.slice(2);
  if (!name || !email || !password) {
    console.log('Usage: node scripts/createTeamUser.js "Name" email password [super_admin|sub_admin]');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  await db.query(
    'INSERT INTO team_users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email.toLowerCase(), hash, role]
  );
  console.log(`Created ${role}: ${email}`);
  process.exit(0);
})();