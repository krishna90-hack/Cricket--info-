/**
 * Player Routes (Public)
 * /api/players/*
 */

const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');
const { mongoIdParam } = require('../middleware/validate');

// Rankings / stats aggregations (must come BEFORE /:id to avoid param conflicts)
router.get('/top-batsmen', playerController.getTopBatsmen);
router.get('/top-bowlers', playerController.getTopBowlers);

// Slug-based lookup
router.get('/slug/:slug', playerController.getPlayerBySlug);

// List & single
router.get('/',    playerController.getAllPlayers);
router.get('/:id', mongoIdParam('id'), playerController.getPlayerById);

module.exports = router;
