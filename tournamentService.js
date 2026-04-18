/**
 * Tournament Service
 * Business logic for tournament management
 */

const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const { AppError } = require('../middleware/errorHandler');
const { getIO } = require('../config/socket');

/**
 * Get all tournaments with filtering and pagination
 */
const getAllTournaments = async (queryParams) => {
  const {
    page = 1,
    limit = 20,
    status,
    type,
    format,
    search,
    sort = '-startDate',
  } = queryParams;

  const filter = { isPublished: true };
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (format) filter.format = format;
  if (search) filter.$text = { $search: search };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [tournaments, total] = await Promise.all([
    Tournament.find(filter)
      .populate('createdBy', 'name email')
      .select('-matches') // Exclude full matches array for listing
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Tournament.countDocuments(filter),
  ]);

  return {
    tournaments,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
};

/**
 * Get tournament by ID with full details
 */
const getTournamentById = async (tournamentId) => {
  const tournament = await Tournament.findById(tournamentId)
    .populate({
      path: 'matches',
      select: 'title matchType status scheduledDate teamA teamB venue result innings',
      options: { sort: { scheduledDate: 1 } },
    })
    .populate('createdBy', 'name');

  if (!tournament) throw new AppError('Tournament not found.', 404);
  return tournament;
};

/**
 * Get tournament by slug
 */
const getTournamentBySlug = async (slug) => {
  const tournament = await Tournament.findOne({ slug })
    .populate({
      path: 'matches',
      select: 'title matchType status scheduledDate teamA teamB venue result innings',
    })
    .populate('createdBy', 'name');

  if (!tournament) throw new AppError('Tournament not found.', 404);
  return tournament;
};

/**
 * Create a new tournament
 */
const createTournament = async (tournamentData, adminId) => {
  const tournament = await Tournament.create({ ...tournamentData, createdBy: adminId });
  return tournament;
};

/**
 * Update tournament details
 */
const updateTournament = async (tournamentId, updates) => {
  const tournament = await Tournament.findByIdAndUpdate(tournamentId, updates, {
    new: true,
    runValidators: true,
  });
  if (!tournament) throw new AppError('Tournament not found.', 404);
  return tournament;
};

/**
 * Delete a tournament
 */
const deleteTournament = async (tournamentId) => {
  const tournament = await Tournament.findByIdAndDelete(tournamentId);
  if (!tournament) throw new AppError('Tournament not found.', 404);
  return tournament;
};

/**
 * Add a match to a tournament
 */
const addMatchToTournament = async (tournamentId, matchId) => {
  const [tournament, match] = await Promise.all([
    Tournament.findById(tournamentId),
    Match.findById(matchId),
  ]);

  if (!tournament) throw new AppError('Tournament not found.', 404);
  if (!match) throw new AppError('Match not found.', 404);

  if (tournament.matches.includes(matchId)) {
    throw new AppError('This match is already in the tournament.', 409);
  }

  tournament.matches.push(matchId);
  await tournament.save();

  // Link match back to tournament
  match.tournament = tournamentId;
  await match.save();

  return tournament;
};

/**
 * Remove a match from a tournament
 */
const removeMatchFromTournament = async (tournamentId, matchId) => {
  const tournament = await Tournament.findByIdAndUpdate(
    tournamentId,
    { $pull: { matches: matchId } },
    { new: true }
  );
  if (!tournament) throw new AppError('Tournament not found.', 404);

  // Unlink match
  await Match.findByIdAndUpdate(matchId, { tournament: null });
  return tournament;
};

/**
 * Update points table
 */
const updatePointsTable = async (tournamentId, pointsTable) => {
  const tournament = await Tournament.findByIdAndUpdate(
    tournamentId,
    { pointsTable },
    { new: true, runValidators: true }
  );
  if (!tournament) throw new AppError('Tournament not found.', 404);

  // Broadcast points table update
  try {
    const io = getIO();
    io.to(`tournament_${tournamentId}`).emit('points_table_update', {
      tournamentId,
      pointsTable: tournament.pointsTable,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Points table socket broadcast failed:', err.message);
  }

  return tournament;
};

/**
 * Get active/ongoing tournaments
 */
const getActiveTournaments = async () => {
  return Tournament.find({ status: 'active', isPublished: true })
    .select('-matches')
    .sort('-startDate')
    .lean();
};

module.exports = {
  getAllTournaments,
  getTournamentById,
  getTournamentBySlug,
  createTournament,
  updateTournament,
  deleteTournament,
  addMatchToTournament,
  removeMatchFromTournament,
  updatePointsTable,
  getActiveTournaments,
};
