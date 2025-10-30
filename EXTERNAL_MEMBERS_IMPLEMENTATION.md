# External Members Management Implementation

## ✅ COMPLETED

### 1. SQL Script Created
**File:** `external-members-schema.sql`

**Features:**
- ✅ `external_members` table with unique constraints on email, phone, and company+email
- ✅ `external_member_history` table for audit trail
- ✅ Updated `bookings` table with `has_external_participants` column
- ✅ Updated `external_participants` table with `member_id` reference
- ✅ Views for active members, blacklisted members, and statistics
- ✅ Stored procedures for duplicate checking
- ✅ Triggers for automatic audit trail
- ✅ Sample data

**Key Constraints:**
```sql
UNIQUE KEY `unique_email` (`email`)
UNIQUE KEY `unique_phone` (`phone`)
UNIQUE KEY `unique_company_email` (`company_name`, `email`)
```

### 2. External Members Page Created
**Location:** `app/admin/external-members/page.tsx`

**Features:**
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Real-time duplicate checking (email, phone, company+email)
- ✅ Search by name, email, phone, company
- ✅ Filter by status (Active, Blacklisted, Inactive)
- ✅ Blacklist/Unblacklist with reason
- ✅ Statistics dashboard (Total, Active, Blacklisted, Visits)
- ✅ Responsive design

---

## 🎯 NEXT STEPS - Booking Integration

### Update New Booking Page
**File:** `app/admin/bookings/new/page.tsx`

**Required Changes:**

1. **Add Member Search Function**
```typescript
const searchExternalMember = async (searchTerm: string) => {
  try {
    const response = await placeManagementAPI.getTableData('external_members', {
      is_deleted: 'false',
      is_blacklisted: 'false'
    })
    
    const data = Array.isArray(response) ? response : response.data || []
    
    // Filter by email, phone, or name
    return data.filter(member =>
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone?.includes(searchTerm) ||
      member.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  } catch (error) {
    console.error('Failed to search members:', error)
    return []
  }
}
```

2. **Update External Participant Form**
- Add search input that queries existing members
- Show autocomplete dropdown with existing members
- Allow selection of existing member OR manual entry
- If existing member selected, pre-fill all fields
- Prevent duplicate email/phone when adding new

3. **Update Submit Logic**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  // ... existing code ...
  
  // For each external participant
  for (const participant of formData.externalParticipants) {
    let memberId = participant.memberId // if selected from existing
    
    if (!memberId) {
      // Check if member exists by email or phone
      const existing = await searchExternalMember(participant.email)
      
      if (existing.length > 0) {
        // Use existing member
        memberId = existing[0].id
        
        // Update visit count
        await placeManagementAPI.updateRecord('external_members', memberId, {
          visit_count: existing[0].visit_count + 1,
          last_visit_date: new Date().toISOString()
        })
      } else {
        // Create new member
        memberId = crypto.randomUUID()
        await placeManagementAPI.insertRecord('external_members', {
          id: memberId,
          full_name: participant.fullName,
          email: participant.email,
          phone: participant.phone,
          reference_type: participant.referenceType,
          reference_value: participant.referenceValue,
          visit_count: 1,
          last_visit_date: new Date().toISOString(),
          is_active: true,
          is_deleted: false,
          created_at: new Date().toISOString()
        })
      }
    }
    
    // Insert external_participant with member_id
    await placeManagementAPI.insertRecord('external_participants', {
      id: crypto.randomUUID(),
      booking_id: bookingId,
      member_id: memberId,
      full_name: participant.fullName,
      email: participant.email,
      phone: participant.phone,
      // ... other fields
    })
  }
  
  // Update booking with has_external_participants flag
  if (formData.externalParticipants.length > 0) {
    await placeManagementAPI.updateRecord('bookings', bookingId, {
      has_external_participants: true
    })
  }
}
```

---

## 📋 Implementation Checklist

### Phase 1: Database (DONE ✅)
- [x] Create `external_members` table
- [x] Add unique constraints
- [x] Create history table
- [x] Update `bookings` table
- [x] Update `external_participants` table
- [x] Create views and procedures

### Phase 2: External Members Page (DONE ✅)
- [x] Create page component
- [x] Implement CRUD operations
- [x] Add duplicate checking
- [x] Add search and filters
- [x] Add blacklist functionality
- [x] Add statistics

### Phase 3: Booking Integration (TODO)
- [ ] Add member search to new booking form
- [ ] Add autocomplete for external participants
- [ ] Update external participant form UI
- [ ] Implement smart duplicate prevention
- [ ] Auto-increment visit count
- [ ] Update submit logic to link members

### Phase 4: Testing
- [ ] Test duplicate prevention
- [ ] Test member search
- [ ] Test booking creation with existing members
- [ ] Test booking creation with new members
- [ ] Test visit count increment
- [ ] Test blacklist prevention

---

## 🎨 UI Components Needed

### External Participant Search Component
```tsx
<div className="mb-4">
  <Label>Search Existing Member</Label>
  <div className="relative">
    <Input
      placeholder="Search by email, phone, or name..."
      value={searchTerm}
      onChange={handleSearch}
    />
    {searchResults.length > 0 && (
      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
        {searchResults.map(member => (
          <div
            key={member.id}
            className="p-3 hover:bg-gray-100 cursor-pointer border-b"
            onClick={() => selectMember(member)}
          >
            <p className="font-medium">{member.full_name}</p>
            <p className="text-sm text-gray-600">{member.email} • {member.phone}</p>
            {member.company_name && (
              <p className="text-xs text-gray-500">{member.company_name}</p>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
</div>
```

---

## 🔒 Validation Rules

### Email Validation
- Must be unique across all members
- Cannot add same email twice in one booking
- Format: valid email address

### Phone Validation
- Must be unique across all members
- Cannot add same phone twice in one booking
- Format: +94XXXXXXXXX or similar

### Company + Email Validation
- Combination must be unique
- Same email cannot exist for same company

---

## 📊 Database Relationships

```
external_members (1) ←→ (Many) external_participants
        ↓
booking_id references bookings(id)
```

---

## 🚀 Usage Flow

1. Admin goes to New Booking page
2. Adds external participant
3. Types email/phone in search
4. If member exists → auto-fills data, links to member
5. If member new → creates new member record
6. On booking submit → increments visit_count
7. Member can be reused in future bookings

---

## ⚠️ Important Notes

- Always check blacklist before adding to booking
- Prevent blacklisted members from being added
- Update visit count on every booking
- Maintain audit trail in history table
- Use soft delete (is_deleted flag)



