/**
 * Tournament Controller
 * HTTP handlers for tournament management endpoints
 */

const tournamentService = require('../services/tournamentService');

/**
 * GET /api/tournaments
 * Public: Get all tournaments
 */
const getAllTournaments = async (req, res, next) => {
  try {
    const result = await tournamentService.getAllTournaments(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tournaments/active
 * Public: Get active tournaments
 */
const getActiveTournaments = async (req, res, next) => {
  try {
    const tournaments = await tournamentService.getActiveTournaments();
    res.status(200).json({ success: true, data: { tournaments, count: tournaments.length } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tournaments/:id
 * Public: Get tournament by ID
 */
const getTournamentById = async (req, res, next) => {
  try {
    const tournament = await tournamentService.getTournamentById(req.params.id);
    res.status(200).json({ success: true, data: { tournament } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tournaments/slug/:slug
 * Public: Get tournament by slug
 */
const getTournamentBySlug = async (req, res, next) => {
  try {
    const tournament = await tournamentService.getTournamentBySlug(req.params.slug);
    res.status(200).json({ success: true, data: { tournament } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/tournaments
 * Admin: Create tournament
 */
const createTournament = async (req, res, next) => {
  try {
    const tournament = await tournamentService.createTournament(req.body, req.user._id);
    res.status(201).json({
      success: true,
      message: 'Tournament created successfully.',
      data: { tournament },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/tournaments/:id
 * Admin: Update tournament
 */
const updateTournament = async (req, res, next) => {
  try {
    const tournament = await tournamentService.updateTournament(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Tournament updated successfully.',
      data: { tournament },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/tournaments/:id
 * Admin: Delete tournament
 */
const deleteTournament = async (req, res, next) => {
  try {
    await tournamentService.deleteTournament(req.params.id);
    res.status(200).json({ success: true, message: 'Tournament deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/tournaments/:id/matches
 * Admin: Add match to tournament
 */
const addMatch = async (req, res, next) => {
  try {
    const { matchId } = req.body;
    if (!matchId) return res.status(400).json({ success: false, message: 'matchId is required.' });
    const tournament = await tournamentService.addMatchToTournament(req.params.id, matchId);
    res.status(200).json({ success: true, message: 'Match added to tournament.', data: { tournament } });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/tournaments/:id/matches/:matchId
 * Admin: Remove match from tournament
 */
const removeMatch = async (req, res, next) => {
  try {
    const tournament = await tournamentService.removeMatchFromTournament(req.params.id, req.params.matchId);
    res.status(200).json({ success: true, message: 'Match removed from tournament.', data: { tournament } });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/tournaments/:id/points-table
 * Admin: Update points table (also broadcasts via Socket.IO)
 */
const updatePointsTable = async (req, res, next) => {
  try {
    const { pointsTable } = req.body;
    if (!Array.isArray(pointsTable)) {
      return res.status(400).json({ success: false, message: 'pointsTable must be an array.' });
    }
    const tournament = await tournamentService.updatePointsTable(req.params.id, pointsTable);
    res.status(200).json({
      success: true,
      message: 'Points table updated and broadcast successfully.',
      data: { pointsTable: tournament.pointsTable },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTournaments,
  getActiveTournaments,
  getTournamentById,
  getTournamentBySlug,
  createTournament,
  updateTournament,
  deleteTournament,
  addMatch,
  removeMatch,
  updatePointsTable,
};
