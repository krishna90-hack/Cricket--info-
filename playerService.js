/**
 * Player Service
 * Business logic for player management operations
 */

const Player = require('../models/Player');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get all players with filtering, searching, and pagination
 */
const getAllPlayers = async (queryParams) => {
  const {
    page = 1,
    limit = 20,
    search,
    role,
    nationality,
    team,
    isActive,
    sort = 'name',
  } = queryParams;

  const filter = {};

  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (role) filter.role = role;
  if (nationality) filter.nationality = new RegExp(nationality, 'i');
  if (team) filter.team = new RegExp(team, 'i');

  if (search) {
    filter.$text = { $search: search };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [players, total] = await Promise.all([
    Player.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Player.countDocuments(filter),
  ]);

  return {
    players,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
};

/**
 * Get player by ID
 */
const getPlayerById = async (playerId) => {
  const player = await Player.findById(playerId);
  if (!player) throw new AppError('Player not found.', 404);
  return player;
};

/**
 * Get player by slug
 */
const getPlayerBySlug = async (slug) => {
  const player = await Player.findOne({ slug });
  if (!player) throw new AppError('Player not found.', 404);
  return player;
};

/**
 * Create a new player
 */
const createPlayer = async (playerData) => {
  const player = await Player.create(playerData);
  return player;
};

/**
 * Update player details
 */
const updatePlayer = async (playerId, updates) => {
  const player = await Player.findByIdAndUpdate(playerId, updates, {
    new: true,
    runValidators: true,
  });
  if (!player) throw new AppError('Player not found.', 404);
  return player;
};

/**
 * Update player statistics
 */
const updatePlayerStats = async (playerId, format, statType, stats) => {
  const validFormats = ['test', 'odi', 't20'];
  const validStatTypes = ['batting', 'bowling'];

  if (!validFormats.includes(format)) {
    throw new AppError(`Invalid format. Must be one of: ${validFormats.join(', ')}`, 400);
  }
  if (!validStatTypes.includes(statType)) {
    throw new AppError(`Invalid stat type. Must be one of: ${validStatTypes.join(', ')}`, 400);
  }

  const updatePath = `stats.${format}.${statType}`;
  const player = await Player.findByIdAndUpdate(
    playerId,
    { $set: { [updatePath]: stats } },
    { new: true, runValidators: true }
  );

  if (!player) throw new AppError('Player not found.', 404);
  return player;
};

/**
 * Delete a player (soft delete by default)
 */
const deletePlayer = async (playerId, hard = false) => {
  if (hard) {
    const player = await Player.findByIdAndDelete(playerId);
    if (!player) throw new AppError('Player not found.', 404);
    return player;
  }

  const player = await Player.findByIdAndUpdate(
    playerId,
    { isActive: false },
    { new: true }
  );
  if (!player) throw new AppError('Player not found.', 404);
  return player;
};

/**
 * Get top batsmen by runs in a format
 */
const getTopBatsmen = async (format = 'odi', limit = 10) => {
  const validFormats = ['test', 'odi', 't20'];
  if (!validFormats.includes(format)) {
    throw new AppError('Invalid format.', 400);
  }

  return Player.find({ isActive: true })
    .select(`name nationality team role stats.${format}.batting profilePicture`)
    .sort({ [`stats.${format}.batting.runs`]: -1 })
    .limit(parseInt(limit))
    .lean();
};

/**
 * Get top bowlers by wickets in a format
 */
const getTopBowlers = async (format = 'odi', limit = 10) => {
  const validFormats = ['test', 'odi', 't20'];
  if (!validFormats.includes(format)) {
    throw new AppError('Invalid format.', 400);
  }

  return Player.find({ isActive: true, role: { $in: ['Bowler', 'All-Rounder'] } })
    .select(`name nationality team role stats.${format}.bowling profilePicture`)
    .sort({ [`stats.${format}.bowling.wickets`]: -1 })
    .limit(parseInt(limit))
    .lean();
};

module.exports = {
  getAllPlayers,
  getPlayerById,
  getPlayerBySlug,
  createPlayer,
  updatePlayer,
  updatePlayerStats,
  deletePlayer,
  getTopBatsmen,
  getTopBowlers,
};
