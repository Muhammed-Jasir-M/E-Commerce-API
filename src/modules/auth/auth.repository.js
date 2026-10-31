import * as userRepo from '../users/user.repository.js';

export async function createUser(userData, session = null) {
  return userRepo.createUser(userData, session);
}

export async function findByEmail(email, includePassword = false, session = null) {
  return userRepo.findUserByEmail(email, includePassword, session);
}

export async function findById(id, includePassword = false, session = null) {
  return userRepo.findUserById(id, includePassword, session);
}

export const authRepository = {
  createUser,
  findByEmail,
  findById,
};

export default authRepository;
