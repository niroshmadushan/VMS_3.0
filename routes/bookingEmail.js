const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    getBookingParticipants,
    sendBookingDetailsEmail,
    sendBookingReminderEmail,
    getBookingEmailHistory,
    sendBookingEmailFromFrontend
} = require('../controllers/bookingEmailController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route POST /api/booking-email/send-from-frontend
 * @desc Send booking email with all details from frontend (no database queries)
 * @access Private
 * @note This route must be defined BEFORE parameterized routes to avoid route matching conflicts
 */
router.post('/send-from-frontend', sendBookingEmailFromFrontend);

/**
 * @route GET /api/booking-email/:bookingId/participants
 * @desc Get participants for a booking
 * @access Private
 */
router.get('/:bookingId/participants', getBookingParticipants);

/**
 * @route POST /api/booking-email/:bookingId/send-details
 * @desc Send booking details email to participants
 * @access Private
 */
router.post('/:bookingId/send-details', sendBookingDetailsEmail);

/**
 * @route POST /api/booking-email/:bookingId/send-reminder
 * @desc Send reminder email to participants
 * @access Private
 */
router.post('/:bookingId/send-reminder', sendBookingReminderEmail);

/**
 * @route GET /api/booking-email/:bookingId/history
 * @desc Get email history for a booking
 * @access Private
 */
router.get('/:bookingId/history', getBookingEmailHistory);

module.exports = router;

