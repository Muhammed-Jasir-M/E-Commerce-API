import env from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import {
  countAdmins,
  findUserByEmail,
  updateUserById,
  createUser,
} from '../modules/users/user.repository.js';
import { hashPassword } from './password.js';
import { logger } from './logger.js';

export async function seedInitialAdmin() {
  const existingAdminCount = await countAdmins();
  if (existingAdminCount > 0) return;

  const email = (env.ADMIN_EMAIL || 'admin@ecommerce.example.com').toLowerCase().trim();
  const rawPassword = env.ADMIN_PASSWORD || 'AdminPassword123!';

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    if (existingUser.role !== 'admin') {
      await updateUserById(existingUser._id, { role: 'admin', isActive: true });
      logger.info({ email }, 'Promoted existing account to admin');
    }
    return;
  }

  const hashedPassword = await hashPassword(rawPassword);

  const admin = await createUser({
    name: 'System Administrator',
    email,
    password: hashedPassword,
    role: 'admin',
    isActive: true,
  });

  logger.info({ adminId: admin._id, email: admin.email }, 'Seeded initial admin account');
}

if (process.argv[1] && process.argv[1].endsWith('seedAdmin.js')) {
  (async () => {
    try {
      await connectDatabase();
      await seedInitialAdmin();
      await disconnectDatabase();
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Admin seed failed');
      process.exit(1);
    }
  })();
}

export default seedInitialAdmin;
