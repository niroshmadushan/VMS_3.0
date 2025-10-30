# ✅ Smart Update Logic - COMPLETE

## 🎯 Problem Solved

### **OLD LOGIC (WRONG):** ❌
```
Update Booking:
1. Delete ALL participants (internal + external)
2. Delete ALL refreshments
3. Re-insert EVERYTHING

Result: Duplicates! Database grows unnecessarily.
```

### **NEW LOGIC (CORRECT):** ✅
```
Update Booking:
1. Compare old vs new participants
2. Soft delete ONLY removed ones
3. Insert ONLY new ones
4. Keep unchanged ones as-is

Result: Efficient! No duplicates!
```

---

## 📊 Detailed Flow

### **Internal Participants (Employees)**

```typescript
// 1. Fetch existing
const oldParticipants = await getTableData('booking_participants', {
  is_deleted: 'false'
}).filter(p => p.booking_id === bookingId)

// 2. Find removed (in old, not in new)
const currentIds = formData.selectedEmployees.map(e => e.id)
const removed = oldParticipants.filter(p => 
  !currentIds.includes(p.employee_id)
)

// 3. Soft delete removed
for (const p of removed) {
  await softDeleteRecord('booking_participants', p.id)
}

// 4. Find new (in new, not in old)
const oldIds = oldParticipants.map(p => p.employee_id)
const newOnes = formData.selectedEmployees.filter(e => 
  !oldIds.includes(e.id)
)

// 5. Insert only new
for (const employee of newOnes) {
  await insertRecord('booking_participants', {...})
}
```

### **External Participants**

```typescript
// 1. Fetch existing
const oldExternals = await getTableData('external_participants', {
  is_deleted: 'false'
}).filter(p => p.booking_id === bookingId)

// 2. Find removed (by email comparison)
const currentEmails = formData.externalParticipants.map(p => p.email)
const removed = oldExternals.filter(p => 
  !currentEmails.includes(p.email)
)

// 3. Soft delete removed
for (const p of removed) {
  await softDeleteRecord('external_participants', p.id)
}

// 4. Find new (by email comparison)
const oldEmails = oldExternals.map(p => p.email)
const newOnes = formData.externalParticipants.filter(p => 
  !oldEmails.includes(p.email)
)

// 5. For each new external participant:
for (const participant of newOnes) {
  // Check if member exists in external_members
  const existingMember = await find(m => 
    m.email === participant.email || 
    m.phone === participant.phone
  )
  
  if (existingMember) {
    // Use existing member + increment visit count
    memberId = existingMember.id
    await updateRecord('external_members', { id: memberId }, {
      visit_count: existingMember.visit_count + 1,
      last_visit_date: now
    })
  } else {
    // Create new member
    memberId = generateUUID()
    await insertRecord('external_members', {...})
  }
  
  // Link to booking
  await insertRecord('external_participants', {
    booking_id: bookingId,
    member_id: memberId,
    ...
  })
}
```

### **Refreshments**

```typescript
// 1. Fetch existing
const oldRefreshments = await getTableData('booking_refreshments', {
  is_deleted: 'false'
}).filter(r => r.booking_id === bookingId)

if (formData.refreshments.required) {
  if (oldRefreshments.length > 0) {
    // ✏️ UPDATE existing record
    await updateRecord('booking_refreshments', 
      { id: oldRefreshments[0].id }, 
      refreshmentData
    )
  } else {
    // ➕ INSERT new record
    await insertRecord('booking_refreshments', {...})
  }
} else {
  // 🗑️ DELETE if not required
  for (const r of oldRefreshments) {
    await softDeleteRecord('booking_refreshments', r.id)
  }
}
```

---

## 🎯 Example Scenarios

### **Scenario 1: Add 1 Internal, Keep 2**
```
Database before:
  booking_participants: [A, B] (is_deleted=false)

User updates:
  selectedEmployees: [A, B, C]

Actions:
  ✅ Keep A (no change)
  ✅ Keep B (no change)
  ➕ Insert C (new)

Database after:
  booking_participants: [A, B, C] (is_deleted=false)
```

### **Scenario 2: Remove 1 External, Add 1 New**
```
Database before:
  external_participants: [john@a.com, jane@b.com] (is_deleted=false)

User updates:
  externalParticipants: [john@a.com, mike@c.com]

Actions:
  ✅ Keep john@a.com (no change)
  🗑️ Soft delete jane@b.com (is_deleted=true)
  ➕ Insert mike@c.com (new)

Database after:
  external_participants: 
    - john@a.com (is_deleted=false)
    - jane@b.com (is_deleted=true) ← preserved
    - mike@c.com (is_deleted=false)
```

### **Scenario 3: Update Refreshments**
```
Database before:
  booking_refreshments: [record-1] (beverages)

User updates:
  refreshments.type: 'lunch'

Actions:
  ✏️ Update record-1 (type = 'lunch')

Database after:
  booking_refreshments: [record-1] (lunch) ← UPDATED, not duplicated
```

---

## 🛡️ WHERE Conditions Fixed

All update calls now use proper format:

```typescript
// ❌ WRONG:
updateRecord('table', id, data)

// ✅ CORRECT:
updateRecord('table', { id: id }, data)
```

**Fixed in:**
- ✅ Bookings update (line 885, 1039)
- ✅ External members visit count (line 949, 994)
- ✅ Refreshments update (line 1072)

---

## 📋 Database State

**Clean Database:** Only active records, soft-deleted ones preserved for history

```
booking_participants:
  - id: 1, booking_id: A, employee_id: E1, is_deleted: false  ✅ Active
  - id: 2, booking_id: A, employee_id: E2, is_deleted: false  ✅ Active
  - id: 3, booking_id: A, employee_id: E3, is_deleted: true   📜 History

external_participants:
  - id: 1, booking_id: A, email: john@a.com, is_deleted: false  ✅ Active
  - id: 2, booking_id: A, email: jane@b.com, is_deleted: true   📜 History
```

---

**Now the update logic is smart, efficient, and prevents duplicates!** 🚀✨



