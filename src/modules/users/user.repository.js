import User from './user.model.js';

export async function createUser(userData, session = null) {
  const options = session ? { session } : {};
  const [user] = await User.create([userData], options);
  return user;
}

export async function findUserById(id, includePassword = false, session = null) {
  const query = User.findById(id);
  if (includePassword) query.select('+password');
  if (session) query.session(session);
  return query.exec();
}

export async function findUserByEmail(email, includePassword = false, session = null) {
  const query = User.findOne({ email: email.toLowerCase().trim() });
  if (includePassword) query.select('+password');
  if (session) query.session(session);
  return query.exec();
}

export async function updateUserById(id, updateData, session = null) {
  const options = { returnDocument: 'after', runValidators: true };
  if (session) options.session = session;
  return User.findByIdAndUpdate(id, updateData, options).exec();
}

export async function findUsersWithPagination(filter = {}, { skip = 0, limit = 10, sort = { createdAt: -1 } } = {}) {
  return User.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .exec();
}

export async function countUsers(filter = {}) {
  return User.countDocuments(filter).exec();
}

export async function countAdmins() {
  return User.countDocuments({ role: 'admin', isActive: true }).exec();
}

export const userRepository = {
  create: createUser,
  findById: findUserById,
  findByEmail: findUserByEmail,
  updateById: updateUserById,
  findWithPagination: findUsersWithPagination,
  count: countUsers,
  countAdmins,
};

export default userRepository;
