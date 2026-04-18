/**
 * Match Controller
 * HTTP handlers for match management and live score endpoints
 */

const matchService = require('../services/matchService');

/**
 * GET /api/matches
 * Public: Get all matches with filters
 */
const getAllMatches = async (req, res, next) => {
  try {
    const result = await matchService.getAllMatches(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/matches/live
 * Public: Get all currently live matches
 */
const getLiveMatches = async (req, res, next) => {
  try {
    const matches = await matchService.getLiveMatches();
    res.status(200).json({ success: true, data: { matches, count: matches.length } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/matches/upcoming
 * Public: Get upcoming matches
 */
const getUpcomingMatches = async (req, res, next) => {
  try {
    const matches = await matchService.getUpcomingMatches(req.query.limit);
    res.status(200).json({ success: true, data: { matches, count: matches.length } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/matches/:id
 * Public: Get single match by ID (full details)
 */
const getMatchById = async (req, res, next) => {
  try {
    const match = await matchService.getMatchById(req.params.id);
    res.status(200).json({ success: true, data: { match } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/matches
 * Admin: Create a new match
 */
const createMatch = async (req, res, next) => {
  try {
    const match = await matchService.createMatch(req.body, req.user._id);
    res.status(201).json({
      success: true,
      message: 'Match created successfully.',
      data: { match },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/matches/:id
 * Admin: Update match details
 */
const updateMatch = async (req, res, next) => {
  try {
    const match = await matchService.updateMatch(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Match updated successfully.',
      data: { match },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/matches/:id/score
 * Admin: Update live match score (triggers Socket.IO broadcast)
 */
const updateLiveScore = async (req, res, next) => {
  try {
    const match = await matchService.updateLiveScore(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Live score updated and broadcast successfully.',
      data: {
        matchId: match._id,
        status: match.status,
        innings: match.innings,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/matches/:id/complete
 * Admin: Mark match as completed with result
 */
const completeMatch = async (req, res, next) => {
  try {
    const match = await matchService.completeMatch(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Match completed successfully.',
      data: { match },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/matches/:id
 * Admin: Delete a match
 */
const deleteMatch = async (req, res, next) => {
  try {
    await matchService.deleteMatch(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Match deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMatches,
  getLiveMatches,
  getUpcomingMatches,
  getMatchById,
  createMatch,
  updateMatch,
  updateLiveScore,
  completeMatch,
  deleteMatch,
};
