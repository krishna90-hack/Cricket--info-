/**
 * Tournament Routes (Public)
 * /api/tournaments/*
 */

const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');
const { mongoIdParam } = require('../middleware/validate');

// Named routes before /:id
router.get('/active',      tournamentController.getActiveTournaments);
router.get('/slug/:slug',  tournamentController.getTournamentBySlug);

// List & single
router.get('/',    tournamentController.getAllTournaments);
router.get('/:id', mongoIdParam('id'), tournamentController.getTournamentById);

module.exports = router;
