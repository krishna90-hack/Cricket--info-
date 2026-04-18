/**
 * Seed Service
 * Creates the initial admin user if none exists
 */

const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) return; // Already seeded

    const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.warn('⚠️  ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed.');
      return;
    }

    await User.create({
      name:     ADMIN_NAME || 'Super Admin',
      email:    ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role:     'admin',
    });

    console.log(`✅ Admin user seeded: ${ADMIN_EMAIL}`);
  } catch (err) {
    console.error('❌ Admin seed failed:', err.message);
  }
};

module.exports = { seedAdmin };
