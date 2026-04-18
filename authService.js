/**
 * Auth Service
 * Business logic for authentication operations
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

/**
 * Generate a signed JWT token
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Format user data for response (strips sensitive fields)
 */
const formatUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  profilePicture: user.profilePicture,
  favoriteTeams: user.favoriteTeams,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
});

/**
 * Register a new user
 */
const register = async ({ name, email, password, role = 'user' }) => {
  // Prevent self-assigning admin role via public API
  const safeRole = role === 'admin' ? 'user' : role;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const user = await User.create({ name, email, password, role: safeRole });
  const token = generateToken(user._id, user.role);

  return { user: formatUserResponse(user), token };
};

/**
 * Login user with email and password
 */
const login = async ({ email, password }) => {
  // Fetch user with password field explicitly
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Contact support.', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  // Update last login timestamp
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id, user.role);
  return { user: formatUserResponse(user), token };
};

/**
 * Get full user profile by ID
 */
const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);
  return formatUserResponse(user);
};

/**
 * Update user profile
 */
const updateProfile = async (userId, updates) => {
  // Disallow role/password changes via this method
  const { name, profilePicture, favoriteTeams } = updates;
  const allowed = {};
  if (name) allowed.name = name;
  if (profilePicture !== undefined) allowed.profilePicture = profilePicture;
  if (favoriteTeams) allowed.favoriteTeams = favoriteTeams;

  const user = await User.findByIdAndUpdate(userId, allowed, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new AppError('User not found.', 404);
  return formatUserResponse(user);
};

/**
 * Change user password
 */
const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new AppError('User not found.', 404);

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect.', 401);

  user.password = newPassword;
  await user.save();

  const token = generateToken(user._id, user.role);
  return { user: formatUserResponse(user), token };
};

module.exports = { register, login, getProfile, updateProfile, changePassword, generateToken };
