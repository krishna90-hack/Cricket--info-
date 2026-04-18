/**
 * Player Controller
 * HTTP handlers for player management endpoints
 */

const playerService = require('../services/playerService');

/**
 * GET /api/players
 * Public: Get all players with filters and pagination
 */
const getAllPlayers = async (req, res, next) => {
  try {
    const result = await playerService.getAllPlayers(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/players/top-batsmen
 * Public: Get top batsmen by format
 */
const getTopBatsmen = async (req, res, next) => {
  try {
    const { format = 'odi', limit = 10 } = req.query;
    const players = await playerService.getTopBatsmen(format, limit);
    res.status(200).json({ success: true, data: { players, format } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/players/top-bowlers
 * Public: Get top bowlers by format
 */
const getTopBowlers = async (req, res, next) => {
  try {
    const { format = 'odi', limit = 10 } = req.query;
    const players = await playerService.getTopBowlers(format, limit);
    res.status(200).json({ success: true, data: { players, format } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/players/:id
 * Public: Get single player by ID
 */
const getPlayerById = async (req, res, next) => {
  try {
    const player = await playerService.getPlayerById(req.params.id);
    res.status(200).json({ success: true, data: { player } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/players/slug/:slug
 * Public: Get player by slug
 */
const getPlayerBySlug = async (req, res, next) => {
  try {
    const player = await playerService.getPlayerBySlug(req.params.slug);
    res.status(200).json({ success: true, data: { player } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/players
 * Admin: Create a new player
 */
const createPlayer = async (req, res, next) => {
  try {
    const player = await playerService.createPlayer(req.body);
    res.status(201).json({
      success: true,
      message: 'Player created successfully.',
      data: { player },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/players/:id
 * Admin: Update player details
 */
const updatePlayer = async (req, res, next) => {
  try {
    const player = await playerService.updatePlayer(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Player updated successfully.',
      data: { player },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/players/:id/stats
 * Admin: Update player statistics for a specific format
 */
const updatePlayerStats = async (req, res, next) => {
  try {
    const { format, type } = req.params; // format: test/odi/t20, type: batting/bowling
    const player = await playerService.updatePlayerStats(req.params.id, format, type, req.body);
    res.status(200).json({
      success: true,
      message: `Player ${type} stats (${format}) updated successfully.`,
      data: { player },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/players/:id
 * Admin: Soft-delete or hard-delete a player
 */
const deletePlayer = async (req, res, next) => {
  try {
    const hard = req.query.hard === 'true';
    const player = await playerService.deletePlayer(req.params.id, hard);
    res.status(200).json({
      success: true,
      message: hard ? 'Player permanently deleted.' : 'Player deactivated successfully.',
      data: { player },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPlayers,
  getTopBatsmen,
  getTopBowlers,
  getPlayerById,
  getPlayerBySlug,
  createPlayer,
  updatePlayer,
  updatePlayerStats,
  deletePlayer,
};
