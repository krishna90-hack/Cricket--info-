/**
 * Match Service
 * Business logic for match management and live score updates
 */

const Match = require('../models/Match');
const { AppError } = require('../middleware/errorHandler');
const { getIO } = require('../config/socket');

/**
 * Get all matches with pagination and filtering
 */
const getAllMatches = async (queryParams) => {
  const {
    page = 1,
    limit = 20,
    status,
    matchType,
    tournament,
    team,
    sort = '-scheduledDate',
  } = queryParams;

  const filter = { isPublished: true };
  if (status) filter.status = status;
  if (matchType) filter.matchType = matchType;
  if (tournament) filter.tournament = tournament;
  if (team) {
    filter.$or = [
      { 'teamA.name': new RegExp(team, 'i') },
      { 'teamB.name': new RegExp(team, 'i') },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [matches, total] = await Promise.all([
    Match.find(filter)
      .populate('tournament', 'name shortName type')
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Match.countDocuments(filter),
  ]);

  return {
    matches,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
};

/**
 * Get single match by ID
 */
const getMatchById = async (matchId) => {
  const match = await Match.findById(matchId)
    .populate('tournament', 'name shortName type format')
    .populate('teamA.players', 'name role battingStyle bowlingStyle')
    .populate('teamB.players', 'name role battingStyle bowlingStyle')
    .populate('manOfTheMatch.player', 'name role nationality')
    .populate('createdBy', 'name');

  if (!match) throw new AppError('Match not found.', 404);
  return match;
};

/**
 * Create a new match
 */
const createMatch = async (matchData, adminId) => {
  const match = await Match.create({ ...matchData, createdBy: adminId });
  return match;
};

/**
 * Update match details
 */
const updateMatch = async (matchId, updates) => {
  const match = await Match.findByIdAndUpdate(matchId, updates, {
    new: true,
    runValidators: true,
  }).populate('tournament', 'name shortName');

  if (!match) throw new AppError('Match not found.', 404);
  return match;
};

/**
 * Delete a match
 */
const deleteMatch = async (matchId) => {
  const match = await Match.findByIdAndDelete(matchId);
  if (!match) throw new AppError('Match not found.', 404);
  return match;
};

/**
 * Update live match scores - broadcasts to Socket.IO room
 */
const updateLiveScore = async (matchId, scoreData) => {
  const match = await Match.findById(matchId);
  if (!match) throw new AppError('Match not found.', 404);

  if (!['live', 'toss', 'innings_break'].includes(match.status)) {
    throw new AppError('Score updates are only allowed for live matches.', 400);
  }

  const {
    inningsIndex,
    totalRuns,
    totalWickets,
    currentOver,
    currentBall,
    extras,
    batting,
    bowling,
    fallOfWickets,
    status, // Optional: update match status
  } = scoreData;

  // Ensure innings array has enough entries
  while (match.innings.length <= inningsIndex) {
    match.innings.push({
      teamName:
        inningsIndex % 2 === 0 ? match.teamA.name : match.teamB.name,
      inningsNumber: match.innings.length + 1,
    });
  }

  const innings = match.innings[inningsIndex];
  innings.totalRuns = totalRuns ?? innings.totalRuns;
  innings.totalWickets = totalWickets ?? innings.totalWickets;
  innings.currentOver = currentOver ?? innings.currentOver;
  innings.currentBall = currentBall ?? innings.currentBall;

  // Calculate run rate
  const totalOversDecimal = innings.currentOver + innings.currentBall / 6;
  innings.runRate = totalOversDecimal > 0
    ? parseFloat((innings.totalRuns / totalOversDecimal).toFixed(2))
    : 0;

  if (extras) Object.assign(innings.extras, extras);
  if (batting) innings.batting = batting;
  if (bowling) innings.bowling = bowling;
  if (fallOfWickets) innings.fallOfWickets = fallOfWickets;
  if (status) match.status = status;

  match.currentInnings = inningsIndex;
  await match.save();

  // Broadcast live score update via Socket.IO
  try {
    const io = getIO();
    const scorePayload = {
      matchId: match._id,
      matchTitle: match.title,
      status: match.status,
      updatedAt: new Date().toISOString(),
      innings: match.innings.map((inn) => ({
        teamName: inn.teamName,
        inningsNumber: inn.inningsNumber,
        totalRuns: inn.totalRuns,
        totalWickets: inn.totalWickets,
        currentOver: `${inn.currentOver}.${inn.currentBall}`,
        runRate: inn.runRate,
        isCompleted: inn.isCompleted,
      })),
      currentInnings: inningsIndex,
    };

    io.to(`match_${matchId}`).emit('score_update', scorePayload);
    console.log(`📡 Score broadcast → match_${matchId}:`, scorePayload.innings);
  } catch (socketError) {
    // Don't fail the request if socket broadcast fails
    console.warn('Socket broadcast failed (non-critical):', socketError.message);
  }

  return match;
};

/**
 * Update match result and mark as completed
 */
const completeMatch = async (matchId, resultData) => {
  const { winner, margin, description, isDraw, isTie, manOfTheMatch } = resultData;

  const updates = {
    status: 'completed',
    endDate: new Date(),
    result: { winner, margin, description, isDraw, isTie },
  };

  if (manOfTheMatch) {
    updates.manOfTheMatch = manOfTheMatch;
  }

  const match = await Match.findByIdAndUpdate(matchId, updates, {
    new: true,
    runValidators: true,
  });

  if (!match) throw new AppError('Match not found.', 404);

  // Broadcast match completion
  try {
    const io = getIO();
    io.to(`match_${matchId}`).emit('match_completed', {
      matchId: match._id,
      result: match.result,
      status: match.status,
    });
  } catch (err) {
    console.warn('Socket completion broadcast failed:', err.message);
  }

  return match;
};

/**
 * Get live matches only
 */
const getLiveMatches = async () => {
  return Match.find({ status: 'live', isPublished: true })
    .populate('tournament', 'name shortName')
    .sort('-updatedAt')
    .lean();
};

/**
 * Get upcoming matches
 */
const getUpcomingMatches = async (limit = 10) => {
  return Match.find({
    status: 'scheduled',
    scheduledDate: { $gte: new Date() },
    isPublished: true,
  })
    .populate('tournament', 'name shortName')
    .sort('scheduledDate')
    .limit(parseInt(limit))
    .lean();
};

module.exports = {
  getAllMatches,
  getMatchById,
  createMatch,
  updateMatch,
  deleteMatch,
  updateLiveScore,
  completeMatch,
  getLiveMatches,
  getUpcomingMatches,
};
