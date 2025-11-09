const { sendEmail } = require('../services/emailService');
const { executeQuery } = require('../config/database');

// Helper function to generate ICS (iCalendar) file content for calendar attachments
const generateICSFile = (meetingName, date, startTime, endTime, place, description, customMessage) => {
    try {
        // Parse date and time to create proper datetime objects
        const dateStr = date; // Format: YYYY-MM-DD
        const startTimeStr = startTime; // Format: HH:MM:SS or HH:MM
        const endTimeStr = endTime; // Format: HH:MM:SS or HH:MM
        
        // Parse date
        const [year, month, day] = dateStr.split('-').map(Number);
        
        // Parse start time (handle both HH:MM:SS and HH:MM formats)
        const startParts = startTimeStr.split(':');
        const startHour = parseInt(startParts[0], 10);
        const startMinute = parseInt(startParts[1], 10);
        const startSecond = startParts[2] ? parseInt(startParts[2], 10) : 0;
        
        // Parse end time
        const endParts = endTimeStr.split(':');
        const endHour = parseInt(endParts[0], 10);
        const endMinute = parseInt(endParts[1], 10);
        const endSecond = endParts[2] ? parseInt(endParts[2], 10) : 0;
        
        // Create Date objects in local timezone (the date/time provided is in local time)
        // The calendar client will convert to the user's timezone
        const startDateTime = new Date(year, month - 1, day, startHour, startMinute, startSecond);
        const endDateTime = new Date(year, month - 1, day, endHour, endMinute, endSecond);
        
        // Validate dates
        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
            console.error('❌ Invalid date/time values for ICS generation');
            return null;
        }
        
        // Format to UTC for iCalendar (YYYYMMDDTHHMMSSZ)
        // JavaScript Date stores time internally as UTC, so we use UTC methods
        // The local time provided will be converted to UTC correctly
        const formatICSDate = (date) => {
            // Use toISOString() which gives us UTC time in ISO format, then convert to ICS format
            const isoString = date.toISOString(); // Format: YYYY-MM-DDTHH:mm:ss.sssZ
            // Extract and reformat: YYYYMMDDTHHMMSSZ
            const icsDate = isoString.replace(/[-:]/g, '').split('.')[0] + 'Z';
            return icsDate;
        };
        
        const dtStart = formatICSDate(startDateTime);
        const dtEnd = formatICSDate(endDateTime);
        
        console.log('📅 ICS Generation Details:');
        console.log(`   Local Start: ${startDateTime.toLocaleString()}`);
        console.log(`   UTC Start: ${dtStart}`);
        console.log(`   Local End: ${endDateTime.toLocaleString()}`);
        console.log(`   UTC End: ${dtEnd}`);
        
        // Generate unique ID for the event
        const uid = `booking-${Date.now()}-${Math.random().toString(36).substring(7)}@${process.env.SMTP_FROM || 'bookingsystem'}`;
        
        // Create timestamp for the calendar entry (now)
        const dtStamp = formatICSDate(new Date());
        
        // Escape special characters for ICS format
        const escapeICS = (text) => {
            if (!text) return '';
            return text
                .replace(/\\/g, '\\\\')
                .replace(/;/g, '\\;')
                .replace(/,/g, '\\,')
                .replace(/\n/g, '\\n');
        };
        
        // Build description with all details
        let fullDescription = description || '';
        if (customMessage) {
            fullDescription += (fullDescription ? '\\n\\n' : '') + `Additional Message: ${customMessage}`;
        }
        if (place) {
            fullDescription += (fullDescription ? '\\n\\n' : '') + `Location: ${place}`;
        }
        
        // Generate ICS content
        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Booking System//Booking Management//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:REQUEST',
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${dtStamp}`,
            `DTSTART:${dtStart}`,
            `DTEND:${dtEnd}`,
            `SUMMARY:${escapeICS(meetingName)}`,
            `DESCRIPTION:${escapeICS(fullDescription)}`,
            place ? `LOCATION:${escapeICS(place)}` : '',
            'STATUS:CONFIRMED',
            'SEQUENCE:0',
            'BEGIN:VALARM',
            'TRIGGER:-PT15M',
            'ACTION:DISPLAY',
            `DESCRIPTION:Reminder: ${escapeICS(meetingName)}`,
            'END:VALARM',
            'END:VEVENT',
            'END:VCALENDAR'
        ].filter(line => line !== '').join('\r\n');
        
        return icsContent;
    } catch (error) {
        console.error('❌ Error generating ICS file:', error);
        return null;
    }
};

const getBookingParticipants = async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        console.log('📧 ==========================================');
        console.log('📧 getBookingParticipants called');
        console.log('📧 Booking ID:', bookingId);
        console.log('📧 ==========================================');
        
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
        
        // Get external participants - NO member_type field
        const externalQuery = `
            SELECT 
                ep.id,
                ep.full_name,
                ep.email,
                ep.phone,
                ep.company_name
            FROM external_participants ep
            WHERE ep.booking_id = ? AND ep.is_deleted = 0 AND ep.email IS NOT NULL
        `;
        
        console.log('📧 External Query:', externalQuery);
        console.log('📧 Query Parameters:', [bookingId]);
        
        // Execute queries - handle both array and wrapped array responses
        const internalResult = await executeQuery(internalQuery, [bookingId]);
        const externalResult = await executeQuery(externalQuery, [bookingId]);
        
        console.log('📧 Internal Result Type:', Array.isArray(internalResult));
        console.log('📧 External Result Type:', Array.isArray(externalResult));
        
        // Handle different return formats from executeQuery
        // If it returns [rows, fields], use rows; if it returns rows directly, use that
        const internalParticipants = Array.isArray(internalResult) && internalResult.length > 0 && Array.isArray(internalResult[0])
            ? internalResult[0] 
            : Array.isArray(internalResult) 
                ? internalResult 
                : [];
        
        const externalParticipants = Array.isArray(externalResult) && externalResult.length > 0 && Array.isArray(externalResult[0])
            ? externalResult[0] 
            : Array.isArray(externalResult) 
                ? externalResult 
                : [];
        
        console.log('📧 Internal participants count:', internalParticipants.length);
        console.log('📧 External participants count:', externalParticipants.length);
        console.log('📧 Internal participants:', JSON.stringify(internalParticipants, null, 2));
        console.log('📧 External participants:', JSON.stringify(externalParticipants, null, 2));
        
        // Combine participants - ensure both are arrays before mapping
        // For external participants, explicitly exclude member_type if it exists
        const participants = [
            ...(Array.isArray(internalParticipants) ? internalParticipants.map(p => ({ ...p, id: `internal-${p.id}` })) : []),
            ...(Array.isArray(externalParticipants) ? externalParticipants.map(p => {
                // Explicitly select only the fields we want - NO member_type
                const { member_type, ...cleanParticipant } = p; // Remove member_type if it exists
                return { 
                    ...cleanParticipant, 
                    id: `external-${p.id}` 
                };
            }) : [])
        ];
        
        console.log('📧 Total combined participants:', participants.length);
        
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
        console.error('❌ ==========================================');
        console.error('❌ Error getting booking participants');
        console.error('❌ ==========================================');
        console.error('❌ Error Type:', error.constructor.name);
        console.error('❌ Error Message:', error.message);
        console.error('❌ Error Stack:', error.stack);
        console.error('❌ Full Error:', error);
        res.status(500).json({
            success: false,
            message: 'Database error while fetching participants',
            error: error.message
        });
    }
};

const sendBookingDetailsEmail = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { participantIds, emailType, customMessage } = req.body;
        const userId = req.user.id;
        
        console.log('📧 ==========================================');
        console.log('📧 BACKEND: sendBookingDetailsEmail CALLED');
        console.log('📧 ==========================================');
        console.log('📧 Booking ID:', bookingId);
        console.log('📧 Participant IDs (optional):', participantIds);
        console.log('📧 Participant IDs count:', participantIds ? participantIds.length : 0);
        console.log('📧 Email Type (required):', emailType);
        console.log('📧 Custom Message (optional):', customMessage || '(none)');
        console.log('📧 User ID:', userId);
        
        // Validate required fields
        if (!emailType) {
            console.error('❌ emailType is required but missing');
            return res.status(400).json({
                success: false,
                message: 'emailType is required'
            });
        }
        
        // Get booking details - fix collation issue in JOIN
        // Explicitly select booking_date, start_time, end_time to ensure they're available
        const bookingQuery = `
            SELECT 
                b.*, 
                p.name as place_name, 
                p.address, 
                p.phone as place_phone,
                b.booking_date,
                b.start_time,
                b.end_time
            FROM bookings b
            LEFT JOIN places p ON b.place_id COLLATE utf8mb4_unicode_ci = p.id COLLATE utf8mb4_unicode_ci
            WHERE b.id = ? AND b.is_deleted = 0
        `;
        const bookingResultRaw = await executeQuery(bookingQuery, [bookingId]);
        
        // Handle different return formats from executeQuery
        const bookingResult = Array.isArray(bookingResultRaw) && bookingResultRaw.length > 0 && Array.isArray(bookingResultRaw[0])
            ? bookingResultRaw[0] 
            : Array.isArray(bookingResultRaw) 
                ? bookingResultRaw 
                : [];
        
        if (bookingResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        const booking = bookingResult[0];
        
        console.log('📧 ==========================================');
        console.log('📧 BOOKING DATA RETRIEVED');
        console.log('📧 ==========================================');
        console.log('📧 Booking ID:', booking.id);
        console.log('📧 Booking Title:', booking.title);
        console.log('📧 Booking Date (booking_date):', booking.booking_date);
        console.log('📧 Booking Date (date):', booking.date);
        console.log('📧 Start Time:', booking.start_time);
        console.log('📧 End Time:', booking.end_time);
        console.log('📧 Booking created_by:', booking.created_by);
        console.log('📧 Booking responsible_person_id:', booking.responsible_person_id);
        console.log('📧 Booking responsiblePersonId:', booking.responsiblePersonId);
        console.log('📧 Full booking object keys:', Object.keys(booking));
        console.log('📧 ==========================================');
        
        // Get participants based on selection
        // participantIds is optional - if not provided or empty, send to all participants
        let participants = [];
        
        console.log('📧 ==========================================');
        console.log('📧 PARTICIPANT SELECTION LOGIC');
        console.log('📧 ==========================================');
        console.log('📧 Participant IDs provided:', participantIds);
        console.log('📧 Participant IDs is array:', Array.isArray(participantIds));
        console.log('📧 Participant IDs length:', participantIds ? participantIds.length : 0);
        
        if (participantIds && participantIds.length > 0) {
            console.log('📧 Processing specific participants...');
            // Get specific participants
            for (const participantId of participantIds) {
                console.log('📧 Processing participant ID:', participantId);
                
                // Format: internal-{bookingId}-{userId} or internal-{bookingId}-{email}
                if (participantId.startsWith('internal-')) {
                    // Extract the part after "internal-"
                    const afterPrefix = participantId.replace('internal-', '');
                    
                    // We know the bookingId from the route parameter, so we can extract the identifier
                    // Format: {bookingId}-{identifier}
                    // Remove the bookingId prefix to get the identifier
                    let identifier = '';
                    
                    if (afterPrefix.startsWith(bookingId + '-')) {
                        // Extract identifier after bookingId-
                        identifier = afterPrefix.substring(bookingId.length + 1);
                    } else {
                        // Fallback: try to find identifier by looking for email or numeric value
                        // Split by dash and check each segment
                        const parts = afterPrefix.split('-');
                        
                        // Check if any part contains @ (email)
                        const emailPart = parts.find(part => part.includes('@'));
                        if (emailPart) {
                            // Reconstruct email (might have been split by dashes)
                            const emailIndex = parts.findIndex(part => part.includes('@'));
                            identifier = parts.slice(emailIndex).join('-');
                        } else {
                            // Check if last part is numeric (userId)
                            const lastPart = parts[parts.length - 1];
                            if (!isNaN(lastPart) && lastPart.trim() !== '') {
                                identifier = lastPart;
                            } else {
                                // Use the last part as fallback
                                identifier = lastPart || afterPrefix;
                            }
                        }
                    }
                    
                    console.log('📧 Extracted identifier from internal participant ID:', identifier);
                    console.log('📧 Full participant ID:', participantId);
                    console.log('📧 After prefix:', afterPrefix);
                    console.log('📧 Booking ID:', bookingId);
                    console.log('📧 Is email format:', identifier.includes('@'));
                    console.log('📧 Is numeric:', !isNaN(identifier) && identifier.trim() !== '');
                    
                    let query = '';
                    let queryParams = [];
                    
                    // Determine if identifier is email or user ID
                    if (identifier.includes('@')) {
                        // Lookup by email
                        console.log('📧 Looking up internal participant by email:', identifier);
                        query = `
                            SELECT 
                                bp.id,
                                bp.employee_id,
                                bp.employee_name as full_name,
                                bp.employee_email as email,
                                bp.employee_phone as phone,
                                '' as company_name,
                                'employee' as member_type
                            FROM booking_participants bp
                            WHERE bp.employee_email = ? AND bp.booking_id = ? AND bp.is_deleted = 0 AND bp.employee_email IS NOT NULL
                        `;
                        queryParams = [identifier, bookingId];
                    } else {
                        // Lookup by user ID (employee_id)
                        console.log('📧 Looking up internal participant by user ID:', identifier);
                        query = `
                            SELECT 
                                bp.id,
                                bp.employee_id,
                                bp.employee_name as full_name,
                                bp.employee_email as email,
                                bp.employee_phone as phone,
                                '' as company_name,
                                'employee' as member_type
                            FROM booking_participants bp
                            WHERE bp.employee_id = ? AND bp.booking_id = ? AND bp.is_deleted = 0 AND bp.employee_email IS NOT NULL
                        `;
                        queryParams = [identifier, bookingId];
                    }
                    
                    const resultRaw = await executeQuery(query, queryParams);
                    
                    // Handle different return formats
                    const result = Array.isArray(resultRaw) && resultRaw.length > 0 && Array.isArray(resultRaw[0])
                        ? resultRaw[0] 
                        : Array.isArray(resultRaw) 
                            ? resultRaw 
                            : [];
                    
                    console.log('📧 Internal participant query result:', result.length, 'records');
                    if (result.length > 0) {
                        console.log('✅ Found internal participant:', result[0]);
                        participants.push({ ...result[0], id: participantId });
                    } else {
                        console.error('❌ Internal participant not found with identifier:', identifier);
                        console.error('❌ Query:', query);
                        console.error('❌ Query params:', queryParams);
                    }
                } else if (participantId.startsWith('external-')) {
                    // Format: external-{uuid}
                    const uuid = participantId.replace('external-', '');
                    console.log('📧 Looking up external participant with UUID:', uuid);
                    const query = `
                        SELECT 
                            ep.id,
                            ep.full_name,
                            ep.email,
                            ep.phone,
                            ep.company_name
                        FROM external_participants ep
                        WHERE ep.id = ? AND ep.booking_id = ? AND ep.is_deleted = 0 AND ep.email IS NOT NULL
                    `;
                    const resultRaw = await executeQuery(query, [uuid, bookingId]);
                    
                    // Handle different return formats from executeQuery
                    const result = Array.isArray(resultRaw) && resultRaw.length > 0 && Array.isArray(resultRaw[0])
                        ? resultRaw[0] 
                        : Array.isArray(resultRaw) 
                            ? resultRaw 
                            : [];
                    
                    console.log('📧 External participant query result:', result.length, 'records');
                    if (result.length > 0) {
                        // Remove member_type from external participant if it exists
                        const { member_type, ...cleanParticipant } = result[0];
                        console.log('✅ Found external participant:', cleanParticipant);
                        participants.push({ ...cleanParticipant, id: participantId });
                    } else {
                        console.error('❌ External participant not found with UUID:', uuid);
                    }
                } else if (participantId.startsWith('responsible-')) {
                    console.log('📧 ==========================================');
                    console.log('📧 PROCESSING RESPONSIBLE PERSON');
                    console.log('📧 ==========================================');
                    
                    // Get responsible person from booking
                    // Try responsible_person_id first, then created_by as fallback
                    const responsiblePersonId = booking.responsible_person_id || booking.responsiblePersonId || booking.created_by;
                    
                    console.log('📧 Booking object:', JSON.stringify(booking, null, 2));
                    console.log('📧 Looking for responsible person:', {
                        responsiblePersonId,
                        bookingCreatedBy: booking.created_by,
                        bookingResponsiblePersonId: booking.responsible_person_id,
                        bookingResponsiblePersonIdAlt: booking.responsiblePersonId,
                        allBookingKeys: Object.keys(booking)
                    });
                    
                    if (!responsiblePersonId) {
                        console.error('❌ ==========================================');
                        console.error('❌ NO RESPONSIBLE PERSON ID FOUND');
                        console.error('❌ ==========================================');
                        console.error('❌ Booking created_by:', booking.created_by);
                        console.error('❌ Booking responsible_person_id:', booking.responsible_person_id);
                        console.error('❌ Booking responsiblePersonId:', booking.responsiblePersonId);
                        console.error('❌ All booking fields:', Object.keys(booking));
                        continue; // Skip this participant
                    }
                    
                    console.log('📧 Using responsible person ID:', responsiblePersonId);
                    
                    // Try userprofile table first (common in this system)
                    console.log('📧 Querying userprofile table for ID:', responsiblePersonId);
                    let responsiblePersonQuery = `
                        SELECT 
                            id,
                            full_name,
                            email,
                            phone,
                            '' as company_name,
                            'employee' as member_type
                        FROM userprofile
                        WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
                    `;
                    
                    console.log('📧 Query:', responsiblePersonQuery);
                    console.log('📧 Query params:', [responsiblePersonId]);
                    
                    let resultRaw = await executeQuery(responsiblePersonQuery, [responsiblePersonId]);
                    
                    console.log('📧 userprofile query result type:', typeof resultRaw);
                    console.log('📧 userprofile query result is array:', Array.isArray(resultRaw));
                    if (Array.isArray(resultRaw)) {
                        console.log('📧 userprofile query result length:', resultRaw.length);
                        if (resultRaw.length > 0) {
                            console.log('📧 userprofile query result[0] type:', typeof resultRaw[0]);
                            console.log('📧 userprofile query result[0] is array:', Array.isArray(resultRaw[0]));
                        }
                    }
                    
                    // Handle different return formats from executeQuery
                    let result = Array.isArray(resultRaw) && resultRaw.length > 0 && Array.isArray(resultRaw[0])
                        ? resultRaw[0] 
                        : Array.isArray(resultRaw) 
                            ? resultRaw 
                            : [];
                    
                    console.log('📧 Processed result length:', result.length);
                    if (result.length > 0) {
                        console.log('📧 Processed result[0]:', result[0]);
                    }
                    
                    // If not found in userprofile, try users table
                    if (result.length === 0) {
                        console.log('📧 ==========================================');
                        console.log('📧 NOT FOUND IN userprofile, TRYING users TABLE');
                        console.log('📧 ==========================================');
                        responsiblePersonQuery = `
                            SELECT 
                                id,
                                full_name,
                                email,
                                phone,
                                '' as company_name,
                                'employee' as member_type
                            FROM users
                            WHERE id = ?
                        `;
                        console.log('📧 Query:', responsiblePersonQuery);
                        resultRaw = await executeQuery(responsiblePersonQuery, [responsiblePersonId]);
                        
                        console.log('📧 users query result type:', typeof resultRaw);
                        console.log('📧 users query result is array:', Array.isArray(resultRaw));
                        
                        result = Array.isArray(resultRaw) && resultRaw.length > 0 && Array.isArray(resultRaw[0])
                            ? resultRaw[0] 
                            : Array.isArray(resultRaw) 
                                ? resultRaw 
                                : [];
                        
                        console.log('📧 Processed users result length:', result.length);
                    }
                    
                    if (result.length > 0) {
                        console.log('✅ ==========================================');
                        console.log('✅ FOUND RESPONSIBLE PERSON');
                        console.log('✅ ==========================================');
                        console.log('✅ Responsible person data:', JSON.stringify(result[0], null, 2));
                        participants.push({ ...result[0], id: participantId });
                        console.log('✅ Added to participants array. Total participants now:', participants.length);
                    } else {
                        console.error('❌ ==========================================');
                        console.error('❌ RESPONSIBLE PERSON NOT FOUND');
                        console.error('❌ ==========================================');
                        console.error('❌ Searched ID:', responsiblePersonId);
                        console.error('❌ Checked tables: userprofile, users');
                        console.error('❌ No matching record found');
                    }
                }
            }
        } else {
            console.log('📧 ==========================================');
            console.log('📧 NO PARTICIPANT IDS PROVIDED - GETTING ALL PARTICIPANTS');
            console.log('📧 ==========================================');
            // Get all participants if none specified - use the same query logic as getBookingParticipants
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
            
            const externalQuery = `
                SELECT 
                    ep.id,
                    ep.full_name,
                    ep.email,
                    ep.phone,
                    ep.company_name
                FROM external_participants ep
                WHERE ep.booking_id = ? AND ep.is_deleted = 0 AND ep.email IS NOT NULL
            `;
            
            const internalResult = await executeQuery(internalQuery, [bookingId]);
            const externalResult = await executeQuery(externalQuery, [bookingId]);
            
            // Handle different return formats from executeQuery
            const internalParticipants = Array.isArray(internalResult) && internalResult.length > 0 && Array.isArray(internalResult[0])
                ? internalResult[0] 
                : Array.isArray(internalResult) 
                    ? internalResult 
                    : [];
            
            const externalParticipants = Array.isArray(externalResult) && externalResult.length > 0 && Array.isArray(externalResult[0])
                ? externalResult[0] 
                : Array.isArray(externalResult) 
                    ? externalResult 
                    : [];
            
            // For external participants, explicitly remove member_type if it exists
            participants = [
                ...internalParticipants.map(p => ({ ...p, id: `internal-${p.id}` })),
                ...externalParticipants.map(p => {
                    const { member_type, ...cleanParticipant } = p; // Remove member_type if it exists
                    return { ...cleanParticipant, id: `external-${p.id}` };
                })
            ];
        }
        
        console.log('📧 ==========================================');
        console.log('📧 PARTICIPANT SUMMARY');
        console.log('📧 ==========================================');
        console.log('📧 Total participants found:', participants.length);
        console.log('📧 Participants details:');
        participants.forEach((p, index) => {
            console.log(`📧   ${index + 1}. ID: "${p.id}"`);
            console.log(`📧      Name: "${p.full_name || 'Unknown'}"`);
            console.log(`📧      Email: "${p.email || 'NO EMAIL ❌'}"`);
            console.log(`📧      Has Email: ${p.email && p.email.trim() !== '' ? '✅' : '❌'}`);
        });
        
        if (participants.length === 0) {
            console.error('❌ ==========================================');
            console.error('❌ NO PARTICIPANTS FOUND FOR THIS BOOKING');
            console.error('❌ ==========================================');
            return res.status(400).json({
                success: false,
                message: 'No participants found for this booking'
            });
        }
        
        // Filter participants with valid email addresses
        const participantsWithEmail = participants.filter(p => p.email && p.email.trim() !== '');
        console.log('📧 ==========================================');
        console.log('📧 PARTICIPANTS WITH EMAIL');
        console.log('📧 ==========================================');
        console.log('📧 Count:', participantsWithEmail.length);
        participantsWithEmail.forEach((p, index) => {
            console.log(`📧   ${index + 1}. "${p.full_name}" - ${p.email}`);
        });
        
        if (participantsWithEmail.length === 0) {
            console.error('❌ ==========================================');
            console.error('❌ NO PARTICIPANTS WITH VALID EMAIL ADDRESSES');
            console.error('❌ ==========================================');
            return res.status(400).json({
                success: false,
                message: 'No participants found with valid email addresses'
            });
        }
        
        // Send emails - use participants with valid email addresses
        const results = [];
        let emailsSent = 0;
        let emailsFailed = 0;
        
        for (const participant of participantsWithEmail) {
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
                participantsWithEmail: participantsWithEmail.length,
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
        
        // Get booking details - fix collation issue in JOIN
        const bookingQuery = `
            SELECT b.*, p.name as place_name, p.address, p.phone as place_phone
            FROM bookings b
            LEFT JOIN places p ON b.place_id COLLATE utf8mb4_unicode_ci = p.id COLLATE utf8mb4_unicode_ci
            WHERE b.id = ? AND b.is_deleted = 0
        `;
        const bookingResultRaw = await executeQuery(bookingQuery, [bookingId]);
        
        // Handle different return formats from executeQuery
        const bookingResult = Array.isArray(bookingResultRaw) && bookingResultRaw.length > 0 && Array.isArray(bookingResultRaw[0])
            ? bookingResultRaw[0] 
            : Array.isArray(bookingResultRaw) 
                ? bookingResultRaw 
                : [];
        
        if (bookingResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        const booking = bookingResult[0];
        
        // Get all participants - use the same query logic as getBookingParticipants
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
        
        const externalQuery = `
            SELECT 
                ep.id,
                ep.full_name,
                ep.email,
                ep.phone,
                ep.company_name
            FROM external_participants ep
            WHERE ep.booking_id = ? AND ep.is_deleted = 0 AND ep.email IS NOT NULL
        `;
        
        const internalResult = await executeQuery(internalQuery, [bookingId]);
        const externalResult = await executeQuery(externalQuery, [bookingId]);
        
        // Handle different return formats from executeQuery
        const internalParticipants = Array.isArray(internalResult) && internalResult.length > 0 && Array.isArray(internalResult[0])
            ? internalResult[0] 
            : Array.isArray(internalResult) 
                ? internalResult 
                : [];
        
        const externalParticipants = Array.isArray(externalResult) && externalResult.length > 0 && Array.isArray(externalResult[0])
            ? externalResult[0] 
            : Array.isArray(externalResult) 
                ? externalResult 
                : [];
        
        // For external participants, explicitly remove member_type if it exists
        const cleanExternalParticipants = externalParticipants.map(p => {
            const { member_type, ...cleanParticipant } = p; // Remove member_type if it exists
            return cleanParticipant;
        });
        
        const allParticipants = [
            ...internalParticipants,
            ...cleanExternalParticipants
        ];
        
        console.log('📧 Total participants for reminder:', allParticipants.length);
        console.log('📧 Participants with email:', allParticipants.filter(p => p.email).length);
        
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
    
    // Format date and time properly
    // booking_date is DATE field (YYYY-MM-DD)
    // start_time and end_time are TIME fields (HH:MM:SS)
    // Combine them to create proper datetime objects
    const formatDate = (dateString) => {
        if (!dateString) return 'Not specified';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                // If invalid, return as-is
                return dateString;
            }
            return date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        } catch (e) {
            return dateString;
        }
    };
    
    const formatTime = (timeString) => {
        if (!timeString) return 'Not specified';
        // Remove seconds if present (HH:MM:SS -> HH:MM)
        if (timeString.length >= 5) {
            return timeString.substring(0, 5);
        }
        return timeString;
    };
    
    // Get booking date and times
    const bookingDate = booking.booking_date || booking.date || '';
    const startTime = booking.start_time || '';
    const endTime = booking.end_time || '';
    
    // Format date
    const formattedDate = formatDate(bookingDate);
    
    // Format times (remove seconds)
    const formattedStartTime = formatTime(startTime);
    const formattedEndTime = formatTime(endTime);
    
    console.log('📧 ==========================================');
    console.log('📧 EMAIL DATE/TIME FORMATTING');
    console.log('📧 ==========================================');
    console.log('📧 Booking Date (raw):', bookingDate);
    console.log('📧 Start Time (raw):', startTime);
    console.log('📧 End Time (raw):', endTime);
    console.log('📧 Formatted Date:', formattedDate);
    console.log('📧 Formatted Start Time:', formattedStartTime);
    console.log('📧 Formatted End Time:', formattedEndTime);
    console.log('📧 ==========================================');
    
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #2c3e50; margin-top: 0;">📅 Booking Details</h2>
            </div>
            
            <p>Dear ${participant.full_name},</p>
            <p>Here are the details for your upcoming booking:</p>
            
            <div style="background-color: #ffffff; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #495057; margin-top: 0;">${booking.title}</h3>
                <p><strong>📅 Date:</strong> ${formattedDate}</p>
                <p><strong>🕐 Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
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
        Date: ${formattedDate}
        Time: ${formattedStartTime} - ${formattedEndTime}
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
    
    // Format date and time properly (same as generateBookingEmail)
    const formatDate = (dateString) => {
        if (!dateString) return 'Not specified';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString;
            }
            return date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        } catch (e) {
            return dateString;
        }
    };
    
    const formatTime = (timeString) => {
        if (!timeString) return 'Not specified';
        if (timeString.length >= 5) {
            return timeString.substring(0, 5);
        }
        return timeString;
    };
    
    const bookingDate = booking.booking_date || booking.date || '';
    const startTime = booking.start_time || '';
    const endTime = booking.end_time || '';
    
    const formattedDate = formatDate(bookingDate);
    const formattedStartTime = formatTime(startTime);
    const formattedEndTime = formatTime(endTime);
    
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
                <h2 style="color: #856404; margin-top: 0;">⏰ Booking Reminder</h2>
            </div>
            
            <p>Dear ${participant.full_name},</p>
            <p>This is a friendly reminder about your upcoming booking:</p>
            
            <div style="background-color: #ffffff; border: 1px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #856404; margin-top: 0;">${booking.title}</h3>
                <p><strong>📅 Date:</strong> ${formattedDate}</p>
                <p><strong>🕐 Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
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
        Date: ${formattedDate}
        Time: ${formattedStartTime} - ${formattedEndTime}
        Location: ${booking.place_name || 'Not specified'}
        ${booking.address ? `Address: ${booking.address}` : ''}
        
        ${customMessage ? `Reminder Note: ${customMessage}` : ''}
        
        Don't forget: Please bring any required documents or ID.
        
        This is an automated reminder from the booking system.
    `;
    
    return { subject, html, text };
};

// Send booking email from frontend data (no database queries)
const sendBookingEmailFromFrontend = async (req, res) => {
    try {
        const {
            meetingName,
            date,
            startTime,
            endTime,
            place,
            description,
            participantEmails,
            emailType = 'booking_details',
            customMessage = ''
        } = req.body;

        // Get request details
        const requestMethod = req.method;
        const requestUrl = req.originalUrl || req.url;
        const requestHeaders = req.headers;
        const requestBodyRaw = req.body;
        
        console.log('📧 ==========================================');
        console.log('📧 ==========================================');
        console.log('📧 FULL API REQUEST - BACKEND CONTROLLER');
        console.log('📧 ==========================================');
        console.log('📧 ==========================================');
        console.log('');
        console.log('📧 REQUEST METHOD:');
        console.log('📧   ', requestMethod);
        console.log('');
        console.log('📧 REQUEST URL:');
        console.log('📧   ', requestUrl);
        console.log('');
        console.log('📧 REQUEST HEADERS:');
        console.log('📧   ', JSON.stringify({
          'content-type': requestHeaders['content-type'],
          'authorization': requestHeaders['authorization'] ? '✅ Set (Bearer ***)' : '❌ Missing',
          'x-app-id': requestHeaders['x-app-id'] || 'N/A',
          'x-service-key': requestHeaders['x-service-key'] ? '✅ Set' : '❌ Missing',
          'user-agent': requestHeaders['user-agent'] || 'N/A'
        }, null, 2));
        console.log('');
        console.log('📧 REQUEST BODY (Raw/Object Received):');
        console.log('📧   ', JSON.stringify(requestBodyRaw, null, 2));
        console.log('');
        console.log('📧 REQUEST BODY TYPE:');
        console.log('📧   ', typeof requestBodyRaw);
        console.log('📧   Is Array:', Array.isArray(requestBodyRaw));
        console.log('📧   Is Object:', typeof requestBodyRaw === 'object' && requestBodyRaw !== null);
        console.log('');
        console.log('📧 ==========================================');
        console.log('📧 EXTRACTED DATA FROM REQUEST:');
        console.log('📧 ==========================================');
        console.log('');
        console.log('📧 Meeting Name:');
        console.log('📧   Value:', meetingName);
        console.log('📧   Type:', typeof meetingName);
        console.log('📧   Length:', meetingName ? meetingName.length : 0);
        console.log('');
        console.log('📧 Date:');
        console.log('📧   Value:', date);
        console.log('📧   Type:', typeof date);
        console.log('📧   Format:', date ? (date.match(/^\d{4}-\d{2}-\d{2}$/) ? '✅ YYYY-MM-DD' : '❌ Invalid format') : '❌ Missing');
        console.log('');
        console.log('📧 Start Time:');
        console.log('📧   Value:', startTime);
        console.log('📧   Type:', typeof startTime);
        console.log('📧   Format:', startTime ? (startTime.match(/^\d{2}:\d{2}(:\d{2})?$/) ? '✅ HH:MM:SS or HH:MM' : '❌ Invalid format') : '❌ Missing');
        console.log('');
        console.log('📧 End Time:');
        console.log('📧   Value:', endTime);
        console.log('📧   Type:', typeof endTime);
        console.log('📧   Format:', endTime ? (endTime.match(/^\d{2}:\d{2}(:\d{2})?$/) ? '✅ HH:MM:SS or HH:MM' : '❌ Invalid format') : '❌ Missing');
        console.log('');
        console.log('📧 Place:');
        console.log('📧   Value:', place || '(not provided)');
        console.log('📧   Type:', typeof place);
        console.log('');
        console.log('📧 Description:');
        console.log('📧   Value:', description || '(not provided)');
        console.log('📧   Type:', typeof description);
        console.log('');
        console.log('📧 Participant Emails:');
        console.log('📧   Value:', participantEmails);
        console.log('📧   Type:', typeof participantEmails);
        console.log('📧   Is Array:', Array.isArray(participantEmails));
        console.log('📧   Length:', participantEmails ? participantEmails.length : 0);
        if (participantEmails && Array.isArray(participantEmails)) {
          console.log('📧   Emails List:');
          participantEmails.forEach((email, index) => {
            console.log(`📧     ${index + 1}. ${email} (${typeof email})`);
          });
        }
        console.log('');
        console.log('📧 Email Type:');
        console.log('📧   Value:', emailType);
        console.log('📧   Type:', typeof emailType);
        console.log('📧   Default:', emailType === 'booking_details' ? '✅ Using default' : 'Using provided');
        console.log('');
        console.log('📧 Custom Message:');
        console.log('📧   Value:', customMessage || '(not provided)');
        console.log('📧   Type:', typeof customMessage);
        console.log('📧   Length:', customMessage ? customMessage.length : 0);
        console.log('');
        console.log('📧 ==========================================');
        console.log('📧 VALIDATING REQUEST DATA...');
        console.log('📧 ==========================================');
        console.log('');

        // Validate required fields
        console.log('📧 Validation Check 1: Meeting Name');
        console.log('📧   meetingName exists:', !!meetingName);
        console.log('📧   meetingName value:', meetingName);
        if (!meetingName) {
            console.error('❌ Validation Failed: Meeting name is required');
            return res.status(400).json({
                success: false,
                message: 'Meeting name is required'
            });
        }
        console.log('✅ Validation Passed: Meeting Name');

        console.log('');
        console.log('📧 Validation Check 2: Date');
        console.log('📧   date exists:', !!date);
        console.log('📧   date value:', date);
        if (!date) {
            console.error('❌ Validation Failed: Date is required');
            return res.status(400).json({
                success: false,
                message: 'Date is required'
            });
        }
        console.log('✅ Validation Passed: Date');

        console.log('');
        console.log('📧 Validation Check 3: Start Time & End Time');
        console.log('📧   startTime exists:', !!startTime);
        console.log('📧   startTime value:', startTime);
        console.log('📧   endTime exists:', !!endTime);
        console.log('📧   endTime value:', endTime);
        if (!startTime || !endTime) {
            console.error('❌ Validation Failed: Start time and end time are required');
            return res.status(400).json({
                success: false,
                message: 'Start time and end time are required'
            });
        }
        console.log('✅ Validation Passed: Start Time & End Time');

        console.log('');
        console.log('📧 Validation Check 4: Participant Emails');
        console.log('📧   participantEmails exists:', !!participantEmails);
        console.log('📧   participantEmails is array:', Array.isArray(participantEmails));
        console.log('📧   participantEmails length:', participantEmails ? participantEmails.length : 0);
        if (!participantEmails || !Array.isArray(participantEmails) || participantEmails.length === 0) {
            console.error('❌ Validation Failed: At least one participant email is required');
            return res.status(400).json({
                success: false,
                message: 'At least one participant email is required'
            });
        }
        console.log('✅ Validation Passed: Participant Emails');
        console.log('');
        console.log('📧 ==========================================');
        console.log('📧 ALL VALIDATIONS PASSED ✅');
        console.log('📧 ==========================================');
        console.log('');

        // Format date and time
        const formatDate = (dateString) => {
            if (!dateString) return 'Not specified';
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) {
                    return dateString;
                }
                return date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            } catch (e) {
                return dateString;
            }
        };

        const formatTime = (timeString) => {
            if (!timeString) return 'Not specified';
            // Remove seconds if present (HH:MM:SS -> HH:MM)
            if (timeString.length >= 5) {
                return timeString.substring(0, 5);
            }
            return timeString;
        };

        const formattedDate = formatDate(date);
        const formattedStartTime = formatTime(startTime);
        const formattedEndTime = formatTime(endTime);

        // Generate email content
        const subject = `Booking Details - ${meetingName}`;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #2c3e50; margin-top: 0;">📅 Booking Details</h2>
                </div>
                
                <p>Dear Participant,</p>
                <p>Here are the details for your upcoming booking:</p>
                
                <div style="background-color: #ffffff; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #495057; margin-top: 0;">${meetingName}</h3>
                    <p><strong>📅 Date:</strong> ${formattedDate}</p>
                    <p><strong>🕐 Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
                    ${place ? `<p><strong>📍 Location:</strong> ${place}</p>` : ''}
                    ${description ? `<p><strong>📝 Description:</strong> ${description}</p>` : ''}
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
                <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                    <p style="margin: 0; color: #2e7d32; font-weight: bold;">📅 Calendar Invitation Attached</p>
                    <p style="margin: 10px 0 0 0; color: #388e3c; font-size: 14px;">
                        A calendar file (meeting.ics) is attached to this email.<br>
                        Click on it to automatically add this meeting to your calendar (Google Calendar, Outlook, Apple Calendar, etc.)
                    </p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
                <p style="color: #6c757d; font-size: 12px; text-align: center;">
                    This is an automated message from the booking system.<br>
                    If you have any questions, please contact the organizer.
                </p>
            </div>
        `;

        const text = `
            Booking Details - ${meetingName}
            
            Dear Participant,
            
            Here are the details for your upcoming booking:
            
            ${meetingName}
            Date: ${formattedDate}
            Time: ${formattedStartTime} - ${formattedEndTime}
            ${place ? `Location: ${place}` : ''}
            ${description ? `Description: ${description}` : ''}
            
            ${customMessage ? `Additional Message: ${customMessage}` : ''}
            
            Important: Please arrive 10 minutes early for check-in.
            
            📅 Calendar Invitation: A calendar file (meeting.ics) is attached to this email.
            Click on it to automatically add this meeting to your calendar.
            
            This is an automated message from the booking system.
            If you have any questions, please contact the organizer.
        `;

        // Send emails to all participants
        const results = [];
        let emailsSent = 0;
        let emailsFailed = 0;

        console.log('📧 ==========================================');
        console.log('📧 STARTING EMAIL SENDING PROCESS');
        console.log('📧 ==========================================');
        console.log('📧 Total Participant Emails:', participantEmails.length);
        console.log('📧 Participant Emails List:', participantEmails);
        console.log('📧 Email Subject:', subject);
        console.log('📧 Formatted Date:', formattedDate);
        console.log('📧 Formatted Time:', `${formattedStartTime} - ${formattedEndTime}`);
        console.log('📧 ==========================================');

        for (let i = 0; i < participantEmails.length; i++) {
            const email = participantEmails[i];
            const emailIndex = i + 1;
            
            console.log('📧 ==========================================');
            console.log(`📧 SENDING EMAIL ${emailIndex}/${participantEmails.length}`);
            console.log('📧 ==========================================');
            console.log(`📧 Recipient Email: ${email}`);
            console.log(`📧 Email Subject: ${subject}`);
            console.log(`📧 Email Type: ${emailType}`);
            
            try {
                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    console.error(`❌ ==========================================`);
                    console.error(`❌ INVALID EMAIL FORMAT`);
                    console.error(`❌ ==========================================`);
                    console.error(`❌ Email: ${email}`);
                    console.error(`❌ Email Index: ${emailIndex}/${participantEmails.length}`);
                    emailsFailed++;
                    results.push({
                        participantEmail: email,
                        success: false,
                        message: 'Invalid email format'
                    });
                    continue;
                }

                console.log(`📧 Email format valid ✅`);
                console.log(`📧 Trimming email: "${email}" -> "${email.trim()}"`);
                
                // Generate ICS calendar file for attachment
                console.log(`📅 ==========================================`);
                console.log(`📅 GENERATING ICS CALENDAR FILE`);
                console.log(`📅 ==========================================`);
                console.log(`📅 Meeting: ${meetingName}`);
                console.log(`📅 Date: ${date}`);
                console.log(`📅 Start Time: ${startTime}`);
                console.log(`📅 End Time: ${endTime}`);
                console.log(`📅 Location: ${place || '(not specified)'}`);
                console.log(`📅 ==========================================`);
                
                const icsContent = generateICSFile(meetingName, date, startTime, endTime, place, description, customMessage);
                
                // Prepare attachments array
                const attachments = [];
                if (icsContent) {
                    attachments.push({
                        filename: `${meetingName.replace(/[^a-z0-9]/gi, '_')}_meeting.ics`,
                        content: icsContent,
                        contentType: 'text/calendar; charset=utf-8; method=REQUEST'
                    });
                    console.log(`✅ ICS file generated successfully`);
                    console.log(`📅 ICS file size: ${icsContent.length} bytes`);
                    console.log(`📅 ICS filename: ${attachments[0].filename}`);
                    console.log(`📅 ICS content preview (first 200 chars): ${icsContent.substring(0, 200)}...`);
                } else {
                    console.error(`❌ Failed to generate ICS file`);
                    console.error(`❌ Email will be sent without calendar attachment`);
                }
                console.log(`📅 ==========================================`);
                
                const requestStartTime = Date.now();
                console.log(`📧 Calling sendEmail service with ${attachments.length} attachment(s)...`);
                
                const emailResult = await sendEmail({
                    to: email.trim(),
                    subject: subject,
                    html: html,
                    text: text,
                    attachments: attachments
                });

                const requestDuration = Date.now() - requestStartTime;
                console.log(`📧 Email service response received (${requestDuration}ms)`);
                console.log(`📧 Email Result:`, JSON.stringify(emailResult, null, 2));

                if (emailResult.success) {
                    emailsSent++;
                    results.push({
                        participantEmail: email,
                        success: true,
                        message: 'Email sent successfully'
                    });
                    console.log(`✅ ==========================================`);
                    console.log(`✅ EMAIL SENT SUCCESSFULLY`);
                    console.log(`✅ ==========================================`);
                    console.log(`✅ Recipient: ${email}`);
                    console.log(`✅ Duration: ${requestDuration}ms`);
                    console.log(`✅ Email Index: ${emailIndex}/${participantEmails.length}`);
                } else {
                    emailsFailed++;
                    results.push({
                        participantEmail: email,
                        success: false,
                        message: emailResult.message || 'Failed to send email'
                    });
                    console.error(`❌ ==========================================`);
                    console.error(`❌ EMAIL SEND FAILED`);
                    console.error(`❌ ==========================================`);
                    console.error(`❌ Recipient: ${email}`);
                    console.error(`❌ Error: ${emailResult.message || 'Unknown error'}`);
                    console.error(`❌ Full Result:`, emailResult);
                    console.error(`❌ Email Index: ${emailIndex}/${participantEmails.length}`);
                }
            } catch (error) {
                emailsFailed++;
                results.push({
                    participantEmail: email,
                    success: false,
                    message: error.message || 'Error sending email'
                });
                console.error(`❌ ==========================================`);
                console.error(`❌ EMAIL SEND EXCEPTION`);
                console.error(`❌ ==========================================`);
                console.error(`❌ Recipient: ${email}`);
                console.error(`❌ Error Type: ${error.constructor.name}`);
                console.error(`❌ Error Message: ${error.message}`);
                console.error(`❌ Error Stack:`, error.stack);
                console.error(`❌ Full Error:`, error);
                console.error(`❌ Email Index: ${emailIndex}/${participantEmails.length}`);
            }
        }

        console.log('📧 ==========================================');
        console.log('📧 EMAIL SENDING COMPLETE - SUMMARY');
        console.log('📧 ==========================================');
        console.log('📧 Meeting Name:', meetingName);
        console.log('📧 Date:', formattedDate);
        console.log('📧 Time:', `${formattedStartTime} - ${formattedEndTime}`);
        console.log('📧 Place:', place || 'Not specified');
        console.log('📧 Total Participants:', participantEmails.length);
        console.log('📧 Emails Sent (Success):', emailsSent);
        console.log('📧 Emails Failed:', emailsFailed);
        console.log('📧 Success Rate:', participantEmails.length > 0 ? `${((emailsSent / participantEmails.length) * 100).toFixed(1)}%` : 'N/A');
        console.log('📧 ==========================================');
        console.log('📧 DETAILED RESULTS:');
        console.log('📧 ==========================================');
        results.forEach((result, index) => {
            if (result.success) {
                console.log(`✅ ${index + 1}. ${result.participantEmail} - ${result.message}`);
            } else {
                console.error(`❌ ${index + 1}. ${result.participantEmail} - ${result.message}`);
            }
        });
        console.log('📧 ==========================================');

        return res.status(200).json({
            success: true,
            message: `Email sending completed. ${emailsSent} successful, ${emailsFailed} failed.`,
            data: {
                meetingName,
                totalParticipants: participantEmails.length,
                emailsSent,
                emailsFailed,
                results
            }
        });

    } catch (error) {
        console.error('❌ Error in sendBookingEmailFromFrontend:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
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
    getBookingEmailHistory,
    sendBookingEmailFromFrontend
};

