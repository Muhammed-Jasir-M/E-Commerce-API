import * as userRepo from './user.repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { formatPaginationResponse } from '../../utils/pagination.js';

export async function getUserProfile(userId) {
  const user = await userRepo.findUserById(userId);
  if (!user) throw ApiError.notFound('User not found');
  return user.toJSON();
}

export async function updateUserProfile(userId, { name }) {
  const updatedUser = await userRepo.updateUserById(userId, { name: name.trim() });
  if (!updatedUser) throw ApiError.notFound('User not found');
  return updatedUser.toJSON();
}

export async function changeUserPassword(userId, currentPassword, newPassword) {
  const user = await userRepo.findUserById(userId, true);
  if (!user) throw ApiError.notFound('User not found');

  const isMatch = await comparePassword(currentPassword, user.password);
  if (!isMatch) throw ApiError.badRequest('Current password is incorrect');

  const hashedPassword = await hashPassword(newPassword);
  await userRepo.updateUserById(userId, { password: hashedPassword });

  return { message: 'Password updated successfully' };
}

export async function listUsersForAdmin({ page, limit, skip, role, isActive }) {
  const filter = {};
  if (role) filter.role = role;
  if (typeof isActive === 'boolean') filter.isActive = isActive;

  const [users, total] = await Promise.all([
    userRepo.findUsersWithPagination(filter, { skip, limit, sort: { createdAt: -1 } }),
    userRepo.countUsers(filter),
  ]);

  return formatPaginationResponse(
    users.map((u) => u.toJSON()),
    total,
    page,
    limit
  );
}

export async function getUserByIdForAdmin(userId) {
  const user = await userRepo.findUserById(userId);
  if (!user) throw ApiError.notFound('User not found');
  return user.toJSON();
}

export async function updateUserStatus(targetUserId, isActive, currentAdminId) {
  const targetUser = await userRepo.findUserById(targetUserId);
  if (!targetUser) throw ApiError.notFound('User not found');

  if (targetUser._id.toString() === currentAdminId && isActive === false) {
    throw ApiError.badRequest('Cannot deactivate your own administrator account');
  }

  if (targetUser.role === 'admin' && isActive === false) {
    const activeAdminCount = await userRepo.countAdmins();
    if (activeAdminCount <= 1) {
      throw ApiError.badRequest('Cannot deactivate the last active administrator');
    }
  }

  const updatedUser = await userRepo.updateUserById(targetUserId, { isActive });
  return updatedUser.toJSON();
}

export const userService = {
  getProfile: getUserProfile,
  updateProfile: updateUserProfile,
  changePassword: changeUserPassword,
  listUsersForAdmin,
  getUserByIdForAdmin,
  updateUserStatus,
};

export default userService;
