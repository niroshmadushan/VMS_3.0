-- =====================================================
-- TEST: Verify Participant Counts
-- =====================================================

-- Based on your actual database data:

-- Count participants for each booking
SELECT 
    b.id,
    b.title,
    b.booking_date,
    (SELECT COUNT(*) FROM booking_participants WHERE booking_id = b.id) as internal_count,
    (SELECT COUNT(*) FROM external_participants WHERE booking_id = b.id) as external_count,
    (SELECT COUNT(*) FROM booking_participants WHERE booking_id = b.id) + 
    (SELECT COUNT(*) FROM external_participants WHERE booking_id = b.id) as total_count
FROM bookings b
WHERE is_deleted = 0
ORDER BY b.booking_date DESC;

-- Expected results based on your screenshots:
-- test (81ee5bc0...):  internal: 1, external: 1, total: 2
-- qwert (d25a7ab8...): internal: 1, external: 1, total: 2
-- tesr (fd91df4c...):  internal: 1, external: 1, total: 2


-- =====================================================
-- Verify booking_id matching for TEST booking
-- =====================================================

-- Test booking ID: 81ee5bc0-aa6c-47d6-ac80-715302d48061

SELECT 'TEST BOOKING - Internal Participants' as info;
SELECT * FROM booking_participants 
WHERE booking_id = '81ee5bc0-aa6c-47d6-ac80-715302d48061';
-- Should return: 1 record (employee_id: 12)

SELECT 'TEST BOOKING - External Participants' as info;
SELECT * FROM external_participants 
WHERE booking_id = '81ee5bc0-aa6c-47d6-ac80-715302d48061';
-- Should return: 1 record (Nirosh Madushan)


-- =====================================================
-- Verify booking_id matching for QWERT booking
-- =====================================================

-- Qwert booking ID: d25a7ab8-e47b-4070-821f-7607a8b2df76

SELECT 'QWERT BOOKING - Internal Participants' as info;
SELECT * FROM booking_participants 
WHERE booking_id = 'd25a7ab8-e47b-4070-821f-7607a8b2df76';
-- Should return: 1 record (employee_id: 13)

SELECT 'QWERT BOOKING - External Participants' as info;
SELECT * FROM external_participants 
WHERE booking_id = 'd25a7ab8-e47b-4070-821f-7607a8b2df76';
-- Should return: 1 record (Nirosh Madushan)


-- =====================================================
-- Verify booking_id matching for TESR booking
-- =====================================================

-- Tesr booking ID: fd91df4c-d3e5-46ca-9a5a-514b38434194

SELECT 'TESR BOOKING - Internal Participants' as info;
SELECT * FROM booking_participants 
WHERE booking_id = 'fd91df4c-d3e5-46ca-9a5a-514b38434194';
-- Should return: 1 record (employee_id: 11)

SELECT 'TESR BOOKING - External Participants' as info;
SELECT * FROM external_participants 
WHERE booking_id = 'fd91df4c-d3e5-46ca-9a5a-514b38434194';
-- Should return: 1 record (Nirosh Madushan)


-- =====================================================
-- SUMMARY: Expected Counts
-- =====================================================
/*
Based on your database screenshots:

BOOKING 1 (test - Oct 1, 2025):
  - ID: 81ee5bc0-aa6c-47d6-ac80-715302d48061
  - Internal: 1 (employee_id: 12)
  - External: 1 (Nirosh Madushan)
  - TOTAL: 2 participants ✅

BOOKING 2 (qwert - Oct 2, 2025):
  - ID: d25a7ab8-e47b-4070-821f-7607a8b2df76
  - Internal: 1 (employee_id: 13)
  - External: 1 (Nirosh Madushan)
  - TOTAL: 2 participants ✅

BOOKING 3 (tesr - Sep 30, 2025):
  - ID: fd91df4c-d3e5-46ca-9a5a-514b38434194
  - Internal: 1 (employee_id: 11)
  - External: 1 (Nirosh Madushan)
  - TOTAL: 2 participants ✅

If the webpage shows "6 participants" for all bookings:
- The API is returning ALL 6 participants (3+3) for every query
- The filter by booking_id is not working in the API
- OR the API is not applying the filters parameter correctly
*/


