/**
 * Admin Routes
 * /api/admin/*
 * All routes here require: protect + restrictTo('admin')
 */

const express = require('express');
const router = express.Router();

const adminController      = require('../controllers/adminController');
const playerController     = require('../controllers/playerController');
const matchController      = require('../controllers/matchController');
const tournamentController = require('../controllers/tournamentController');

const { protect, restrictTo } = require('../middleware/auth');
const { adminLimiter, scoreLimiter } = require('../middleware/rateLimiter');
const {
  playerValidation,
  matchValidation,
  tournamentValidation,
  scoreUpdateValidation,
  mongoIdParam,
} = require('../middleware/validate');

// Apply auth to every admin route
router.use(protect, restrictTo('admin'), adminLimiter);

// ── Dashboard ───────────────────────────────────────────────────
router.get('/dashboard', adminController.getDashboard);

// ── User Management ─────────────────────────────────────────────
router.get('/users',        adminController.getAllUsers);
router.post('/users',       adminController.createUser);
router.get('/users/:id',    mongoIdParam('id'), adminController.getUserById);
router.patch('/users/:id',  mongoIdParam('id'), adminController.updateUser);
router.delete('/users/:id', mongoIdParam('id'), adminController.deleteUser);

// ── Player Management ────────────────────────────────────────────
router.post('/players',                               playerValidation, playerController.createPlayer);
router.patch('/players/:id',                          mongoIdParam('id'), playerController.updatePlayer);
router.patch('/players/:id/stats/:format/:type',      mongoIdParam('id'), playerController.updatePlayerStats);
router.delete('/players/:id',                         mongoIdParam('id'), playerController.deletePlayer);

// ── Match Management ─────────────────────────────────────────────
router.post('/matches',               matchValidation,               matchController.createMatch);
router.patch('/matches/:id',          mongoIdParam('id'),            matchController.updateMatch);
router.patch('/matches/:id/score',    mongoIdParam('id'), scoreLimiter, scoreUpdateValidation, matchController.updateLiveScore);
router.patch('/matches/:id/complete', mongoIdParam('id'),            matchController.completeMatch);
router.delete('/matches/:id',         mongoIdParam('id'),            matchController.deleteMatch);

// ── Tournament Management ─────────────────────────────────────────
router.post('/tournaments',                           tournamentValidation,  tournamentController.createTournament);
router.patch('/tournaments/:id',                      mongoIdParam('id'),    tournamentController.updateTournament);
router.delete('/tournaments/:id',                     mongoIdParam('id'),    tournamentController.deleteTournament);
router.post('/tournaments/:id/matches',               mongoIdParam('id'),    tournamentController.addMatch);
router.delete('/tournaments/:id/matches/:matchId',    mongoIdParam('id'),    tournamentController.removeMatch);
router.patch('/tournaments/:id/points-table',         mongoIdParam('id'),    tournamentController.updatePointsTable);

module.exports = router;
