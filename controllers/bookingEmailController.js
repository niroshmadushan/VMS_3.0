const { sendEmail } = require('../services/emailService');
const { executeQuery } = require('../config/database');

const getBookingParticipants = async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        // Get internal participants (employees)
        const internalQuery = `
            SELECT 
                bp.id,
                bp.employee_name as full_name,
                bp.employee_email as email,
                bp.employee_phone as phone,
                '' as company_name,
                'employee' as member_type
            FROM booking_participants bp
            WHERE bp.booking_id = ? AND bp.is_deleted = 0 AND bp.employee_email IS NOT NULL
        `;
        
        // Get external participants
        const externalQuery = `
            SELECT 
                ep.id,
                ep.full_name,
                ep.email,
                ep.phone,
                ep.company_name,
                'visitor' as member_type
            FROM external_participants ep
            WHERE ep.booking_id = ? AND ep.is_deleted = 0 AND ep.email IS NOT NULL
        `;
        
        const [internalParticipants] = await executeQuery(internalQuery, [bookingId]);
        const [externalParticipants] = await executeQuery(externalQuery, [bookingId]);
        
        // Combine participants
        const participants = [
            ...internalParticipants.map(p => ({ ...p, id: `internal-${p.id}` })),
            ...externalParticipants.map(p => ({ ...p, id: `external-${p.id}` }))
        ];
        
        res.json({
            success: true,
            message: 'Participants retrieved successfully',
            data: { 
                participants,
                totalParticipants: participants.length,
                participantsWithEmail: participants.filter(p => p.email).length
            }
        });
    } catch (error) {
        console.error('Error getting booking participants:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve participants',
            error: error.message
        });
    }
};

const sendBookingDetailsEmail = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { participantIds, emailType, customMessage } = req.body;
        const userId = req.user.id;
        
        console.log('📧 Sending booking details email:', { bookingId, participantIds, emailType, customMessage });
        
        // Get booking details
        const bookingQuery = `
            SELECT b.*, p.name as place_name, p.address, p.phone as place_phone
            FROM bookings b
            LEFT JOIN places p ON b.place_id = p.id
            WHERE b.id = ?
        `;
        const [bookingResult] = await executeQuery(bookingQuery, [bookingId]);
        
        if (bookingResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        const booking = bookingResult[0];
        
        // Get participants based on selection
        let participants = [];
        
        if (participantIds && participantIds.length > 0) {
            // Get specific participants
            for (const participantId of participantIds) {
                if (participantId.startsWith('internal-')) {
                    const id = participantId.replace('internal-', '');
                    const query = `
                        SELECT 
                            bp.id,
                            bp.employee_name as full_name,
                            bp.employee_email as email,
                            bp.employee_phone as phone,
                            '' as company_name,
                            'employee' as member_type
                        FROM booking_participants bp
                        WHERE bp.id = ? AND bp.booking_id = ? AND bp.is_deleted = 0 AND bp.employee_email IS NOT NULL
                    `;
                    const [result] = await executeQuery(query, [id, bookingId]);
                    if (result.length > 0) {
                        participants.push({ ...result[0], id: participantId });
                    }
                } else if (participantId.startsWith('external-')) {
                    const id = participantId.replace('external-', '');
                    const query = `
                        SELECT 
                            ep.id,
                            ep.full_name,
                            ep.email,
                            ep.phone,
                            ep.company_name,
                            'visitor' as member_type
                        FROM external_participants ep
                        WHERE ep.id = ? AND ep.booking_id = ? AND ep.is_deleted = 0 AND ep.email IS NOT NULL
                    `;
                    const [result] = await executeQuery(query, [id, bookingId]);
                    if (result.length > 0) {
                        participants.push({ ...result[0], id: participantId });
                    }
                } else if (participantId.startsWith('responsible-')) {
                    // Get responsible person from booking
                    const responsiblePersonQuery = `
                        SELECT 
                            u.id,
                            u.full_name,
                            u.email,
                            u.phone,
                            '' as company_name,
                            'employee' as member_type
                        FROM users u
                        WHERE u.id = ?
                    `;
                    const [result] = await executeQuery(responsiblePersonQuery, [booking.created_by]);
                    if (result.length > 0) {
                        participants.push({ ...result[0], id: participantId });
                    }
                }
            }
        } else {
            // Get all participants if none specified
            const allParticipants = await getBookingParticipants(req, res);
            participants = allParticipants.data.participants;
        }
        
        if (participants.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No participants found with valid email addresses'
            });
        }
        
        // Send emails
        const results = [];
        let emailsSent = 0;
        let emailsFailed = 0;
        
        for (const participant of participants) {
            try {
                const emailContent = generateBookingEmail(booking, participant, emailType, customMessage);
                
                const emailResult = await sendEmail({
                    to: participant.email,
                    subject: emailContent.subject,
                    html: emailContent.html,
                    text: emailContent.text
                });
                
                if (emailResult.success) {
                    emailsSent++;
                    results.push({
                        participantId: participant.id,
                        participantName: participant.full_name,
                        participantEmail: participant.email,
                        success: true,
                        message: 'Email sent successfully'
                    });
                    
                    // Log email
                    await logEmail(bookingId, participant.id, participant.email, emailType, emailContent, userId, 'sent');
                } else {
                    emailsFailed++;
                    results.push({
                        participantId: participant.id,
                        participantName: participant.full_name,
                        participantEmail: participant.email,
                        success: false,
                        message: emailResult.error
                    });
                    
                    // Log failed email
                    await logEmail(bookingId, participant.id, participant.email, emailType, emailContent, userId, 'failed', emailResult.error);
                }
            } catch (error) {
                emailsFailed++;
                results.push({
                    participantId: participant.id,
                    participantName: participant.full_name,
                    participantEmail: participant.email,
                    success: false,
                    message: error.message
                });
            }
        }
        
        res.json({
            success: true,
            message: `Email sending completed. ${emailsSent} successful, ${emailsFailed} failed.`,
            data: {
                bookingId,
                bookingTitle: booking.title,
                totalParticipants: participants.length,
                emailsSent,
                emailsFailed,
                results
            }
        });
        
    } catch (error) {
        console.error('Error sending booking details email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send booking details email',
            error: error.message
        });
    }
};

const sendBookingReminderEmail = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { reminderType, customMessage } = req.body;
        const userId = req.user.id;
        
        console.log('📧 Sending reminder email:', { bookingId, reminderType, customMessage });
        
        // Get booking details
        const bookingQuery = `
            SELECT b.*, p.name as place_name, p.address, p.phone as place_phone
            FROM bookings b
            LEFT JOIN places p ON b.place_id = p.id
            WHERE b.id = ?
        `;
        const [bookingResult] = await executeQuery(bookingQuery, [bookingId]);
        
        if (bookingResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        const booking = bookingResult[0];
        
        // Get all participants
        const participants = await getBookingParticipants(req, res);
        const allParticipants = participants.data.participants;
        
        if (allParticipants.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No participants found with valid email addresses'
            });
        }
        
        // Send reminder emails
        let emailsSent = 0;
        let emailsFailed = 0;
        
        for (const participant of allParticipants) {
            try {
                const emailContent = generateReminderEmail(booking, participant, reminderType, customMessage);
                
                const emailResult = await sendEmail({
                    to: participant.email,
                    subject: emailContent.subject,
                    html: emailContent.html,
                    text: emailContent.text
                });
                
                if (emailResult.success) {
                    emailsSent++;
                    await logEmail(bookingId, participant.id, participant.email, `booking_reminder_${reminderType}`, emailContent, userId, 'sent');
                } else {
                    emailsFailed++;
                    await logEmail(bookingId, participant.id, participant.email, `booking_reminder_${reminderType}`, emailContent, userId, 'failed', emailResult.error);
                }
            } catch (error) {
                emailsFailed++;
            }
        }
        
        res.json({
            success: true,
            message: 'Reminder emails sent successfully',
            data: {
                bookingId,
                bookingTitle: booking.title,
                reminderType,
                emailsSent,
                emailsFailed
            }
        });
        
    } catch (error) {
        console.error('Error sending reminder emails:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send reminder emails',
            error: error.message
        });
    }
};

const getBookingEmailHistory = async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        const query = `
            SELECT 
                bel.id,
                bel.recipient_email,
                bel.email_type,
                bel.subject,
                bel.sent_at,
                bel.status,
                bel.error_message,
                u.full_name as sent_by_name,
                u.email as sent_by_email
            FROM booking_email_logs bel
            LEFT JOIN users u ON bel.sent_by = u.id
            WHERE bel.booking_id = ?
            ORDER BY bel.sent_at DESC
        `;
        
        const [emailHistory] = await executeQuery(query, [bookingId]);
        
        res.json({
            success: true,
            message: 'Email history retrieved successfully',
            data: { 
                emailHistory,
                totalEmailsSent: emailHistory.length
            }
        });
        
    } catch (error) {
        console.error('Error getting email history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve email history',
            error: error.message
        });
    }
};

// Helper functions
const generateBookingEmail = (booking, participant, emailType, customMessage) => {
    const subject = `Booking Details - ${booking.title}`;
    
    const startDate = new Date(booking.start_time);
    const endDate = new Date(booking.end_time);
    
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #2c3e50; margin-top: 0;">📅 Booking Details</h2>
            </div>
            
            <p>Dear ${participant.full_name},</p>
            <p>Here are the details for your upcoming booking:</p>
            
            <div style="background-color: #ffffff; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #495057; margin-top: 0;">${booking.title}</h3>
                <p><strong>📅 Date:</strong> ${startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>🕐 Time:</strong> ${startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                <p><strong>📍 Location:</strong> ${booking.place_name || 'Not specified'}</p>
                ${booking.address ? `<p><strong>🏢 Address:</strong> ${booking.address}</p>` : ''}
                ${booking.place_phone ? `<p><strong>📞 Phone:</strong> ${booking.place_phone}</p>` : ''}
                ${booking.description ? `<p><strong>📝 Description:</strong> ${booking.description}</p>` : ''}
            </div>
            
            ${customMessage ? `
                <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>💬 Additional Message:</strong></p>
                    <p>${customMessage}</p>
                </div>
            ` : ''}
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>⚠️ Important:</strong> Please arrive 10 minutes early for check-in.</p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            <p style="color: #6c757d; font-size: 12px; text-align: center;">
                This is an automated message from the booking system.<br>
                If you have any questions, please contact the organizer.
            </p>
        </div>
    `;
    
    const text = `
        Booking Details - ${booking.title}
        
        Dear ${participant.full_name},
        
        Here are the details for your upcoming booking:
        
        ${booking.title}
        Date: ${startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        Time: ${startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        Location: ${booking.place_name || 'Not specified'}
        ${booking.address ? `Address: ${booking.address}` : ''}
        ${booking.place_phone ? `Phone: ${booking.place_phone}` : ''}
        ${booking.description ? `Description: ${booking.description}` : ''}
        
        ${customMessage ? `Additional Message: ${customMessage}` : ''}
        
        Important: Please arrive 10 minutes early for check-in.
        
        This is an automated message from the booking system.
        If you have any questions, please contact the organizer.
    `;
    
    return { subject, html, text };
};

const generateReminderEmail = (booking, participant, reminderType, customMessage) => {
    const subject = `Reminder: ${booking.title} - ${reminderType === '24_hours' ? 'Tomorrow' : 'In 1 Hour'}`;
    
    const startDate = new Date(booking.start_time);
    const endDate = new Date(booking.end_time);
    
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
                <h2 style="color: #856404; margin-top: 0;">⏰ Booking Reminder</h2>
            </div>
            
            <p>Dear ${participant.full_name},</p>
            <p>This is a friendly reminder about your upcoming booking:</p>
            
            <div style="background-color: #ffffff; border: 1px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #856404; margin-top: 0;">${booking.title}</h3>
                <p><strong>📅 Date:</strong> ${startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>🕐 Time:</strong> ${startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                <p><strong>📍 Location:</strong> ${booking.place_name || 'Not specified'}</p>
                ${booking.address ? `<p><strong>🏢 Address:</strong> ${booking.address}</p>` : ''}
            </div>
            
            ${customMessage ? `
                <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>💬 Reminder Note:</strong></p>
                    <p>${customMessage}</p>
                </div>
            ` : ''}
            
            <div style="background-color: #f8d7da; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>⚠️ Don't forget:</strong> Please bring any required documents or ID.</p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            <p style="color: #6c757d; font-size: 12px; text-align: center;">
                This is an automated reminder from the booking system.
            </p>
        </div>
    `;
    
    const text = `
        Reminder: ${booking.title} - ${reminderType === '24_hours' ? 'Tomorrow' : 'In 1 Hour'}
        
        Dear ${participant.full_name},
        
        This is a friendly reminder about your upcoming booking:
        
        ${booking.title}
        Date: ${startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        Time: ${startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        Location: ${booking.place_name || 'Not specified'}
        ${booking.address ? `Address: ${booking.address}` : ''}
        
        ${customMessage ? `Reminder Note: ${customMessage}` : ''}
        
        Don't forget: Please bring any required documents or ID.
        
        This is an automated reminder from the booking system.
    `;
    
    return { subject, html, text };
};

const logEmail = async (bookingId, participantId, recipientEmail, emailType, emailContent, sentBy, status, errorMessage = null) => {
    try {
        const query = `
            INSERT INTO booking_email_logs 
            (booking_id, participant_id, recipient_email, email_type, subject, body_html, body_text, sent_by, status, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await executeQuery(query, [
            bookingId,
            participantId,
            recipientEmail,
            emailType,
            emailContent.subject,
            emailContent.html,
            emailContent.text,
            sentBy,
            status,
            errorMessage
        ]);
        
        console.log('📧 Email logged:', { bookingId, recipientEmail, emailType, status });
    } catch (error) {
        console.error('Failed to log email:', error);
    }
};

module.exports = {
    getBookingParticipants,
    sendBookingDetailsEmail,
    sendBookingReminderEmail,
    getBookingEmailHistory
};
