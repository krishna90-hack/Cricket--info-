/**
 * Match Routes (Public)
 * /api/matches/*
 */

const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { mongoIdParam } = require('../middleware/validate');

// Specific named routes before /:id
router.get('/live',     matchController.getLiveMatches);
router.get('/upcoming', matchController.getUpcomingMatches);

// List & single
router.get('/',    matchController.getAllMatches);
router.get('/:id', mongoIdParam('id'), matchController.getMatchById);

module.exports = router;
