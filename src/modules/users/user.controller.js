import * as userService from './user.service.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { getPaginationParams } from '../../utils/pagination.js';

export const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getUserProfile(req.user._id);

  res.status(200).json({
    success: true,
    message: 'Profile retrieved successfully',
    data: { user },
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateUserProfile(req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user },
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await userService.changeUserPassword(req.user._id, currentPassword, newPassword);

  res.status(200).json({
    success: true,
    message: result.message,
    data: {},
  });
});

export const getAdminUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { role, isActive } = req.query;

  const result = await userService.listUsersForAdmin({
    page,
    limit,
    skip,
    role,
    isActive,
  });

  res.status(200).json({
    success: true,
    message: 'Users retrieved successfully',
    data: result,
  });
});

export const getAdminUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserByIdForAdmin(req.params.id);

  res.status(200).json({
    success: true,
    message: 'User retrieved successfully',
    data: { user },
  });
});

export const updateAdminUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;
  const currentAdminId = req.user._id.toString();

  const user = await userService.updateUserStatus(id, isActive, currentAdminId);

  res.status(200).json({
    success: true,
    message: `User account has been ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: { user },
  });
});

export const userController = {
  getProfile,
  updateProfile,
  changePassword,
  getAdminUsers,
  getAdminUserById,
  updateAdminUserStatus,
};

export default userController;
