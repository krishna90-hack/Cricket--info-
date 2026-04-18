/**
 * Input Validation Middleware
 * Uses express-validator for request validation
 */

const { validationResult, body, param, query } = require('express-validator');

/**
 * Runs validation results and returns errors if any
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed. Please check your input.',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  next();
};

// ─── Auth Validators ───────────────────────────────────────────────────────────

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and a number'),
  validate,
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validate,
];

// ─── Player Validators ─────────────────────────────────────────────────────────

const playerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Player name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('dateOfBirth')
    .notEmpty().withMessage('Date of birth is required')
    .isISO8601().withMessage('Date of birth must be a valid date (YYYY-MM-DD)')
    .custom((val) => {
      const dob = new Date(val);
      const minAge = new Date();
      minAge.setFullYear(minAge.getFullYear() - 14);
      if (dob > minAge) throw new Error('Player must be at least 14 years old');
      return true;
    }),
  body('nationality')
    .trim()
    .notEmpty().withMessage('Nationality is required'),
  body('role')
    .notEmpty().withMessage('Player role is required')
    .isIn(['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper', 'Wicket-Keeper Batsman'])
    .withMessage('Invalid player role'),
  body('battingStyle')
    .optional()
    .isIn(['Right-handed', 'Left-handed'])
    .withMessage('Invalid batting style'),
  body('jerseyNumber')
    .optional()
    .isInt({ min: 1, max: 999 }).withMessage('Jersey number must be between 1 and 999'),
  validate,
];

// ─── Match Validators ──────────────────────────────────────────────────────────

const matchValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Match title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('matchType')
    .notEmpty().withMessage('Match type is required')
    .isIn(['Test', 'ODI', 'T20', 'T10', 'The Hundred', 'First-class', 'List-A'])
    .withMessage('Invalid match type'),
  body('teamA.name')
    .trim()
    .notEmpty().withMessage('Team A name is required'),
  body('teamB.name')
    .trim()
    .notEmpty().withMessage('Team B name is required'),
  body('venue.name')
    .trim()
    .notEmpty().withMessage('Venue name is required'),
  body('scheduledDate')
    .notEmpty().withMessage('Scheduled date is required')
    .isISO8601().withMessage('Scheduled date must be a valid ISO 8601 date'),
  validate,
];

const scoreUpdateValidation = [
  body('inningsIndex')
    .isInt({ min: 0, max: 3 }).withMessage('Innings index must be between 0 and 3'),
  body('totalRuns')
    .isInt({ min: 0 }).withMessage('Total runs must be a non-negative integer'),
  body('totalWickets')
    .isInt({ min: 0, max: 10 }).withMessage('Wickets must be between 0 and 10'),
  body('currentOver')
    .isFloat({ min: 0 }).withMessage('Current over must be a non-negative number'),
  validate,
];

// ─── Tournament Validators ─────────────────────────────────────────────────────

const tournamentValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Tournament name is required')
    .isLength({ max: 200 }).withMessage('Name cannot exceed 200 characters'),
  body('type')
    .notEmpty().withMessage('Tournament type is required')
    .isIn(['World Cup', 'IPL', 'Champions Trophy', 'Bilateral Series', 'Domestic', 'League', 'Knockout', 'Other'])
    .withMessage('Invalid tournament type'),
  body('format')
    .notEmpty().withMessage('Match format is required')
    .isIn(['Test', 'ODI', 'T20', 'T10', 'The Hundred', 'Mixed'])
    .withMessage('Invalid format'),
  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
  body('endDate')
    .notEmpty().withMessage('End date is required')
    .isISO8601().withMessage('End date must be a valid ISO 8601 date')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  validate,
];

// ─── Param Validators ──────────────────────────────────────────────────────────

const mongoIdParam = (paramName = 'id') => [
  param(paramName)
    .isMongoId().withMessage(`Invalid ${paramName} format`),
  validate,
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  playerValidation,
  matchValidation,
  scoreUpdateValidation,
  tournamentValidation,
  mongoIdParam,
};
