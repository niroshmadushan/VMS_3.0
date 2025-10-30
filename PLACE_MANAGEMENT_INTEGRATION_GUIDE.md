# 🏢 PLACE MANAGEMENT SYSTEM - SECURE-SELECT API INTEGRATION

## 📋 **Complete Integration Guide**

This guide shows how to integrate the Place Management System with the secure-select API backend, using the database schema and React components provided.

---

## 🗄️ **Database Setup**

### **1. Run the SQL Schema**
```bash
# Execute the place management schema
psql -U your_username -d your_database -f place-management-schema.sql
```

### **2. Verify Tables Created**
```sql
-- Check if all tables are created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'places', 'place_deactivation_reasons', 'visitors', 'visits', 
  'visit_cancellations', 'place_access_logs', 'place_notifications', 
  'place_statistics'
);
```

---

## 🔧 **Backend API Setup**

### **1. Secure-Select API Endpoints**

The backend should implement these endpoints based on the secure-select API documentation:

```javascript
// Base URL: http://localhost:3000/api/secure-select

// Get allowed tables for user role
GET /tables

// Get table information
GET /:table/info

// Get table data with filtering
GET /:table?filters=[...]&limit=20&page=1

// Examples:
GET /places?filters=[{"column":"is_active","operator":"is_true","value":true}]
GET /visitors?filters=[{"column":"first_name","operator":"contains","value":"John"}]
GET /visits?filters=[{"column":"visit_status","operator":"equals","value":"scheduled"}]
```

### **2. Required Views for Complex Queries**

Create these views in your database for better performance:

```sql
-- Place status view with deactivation info
CREATE OR REPLACE VIEW place_status_view AS
SELECT 
    p.id as place_id,
    p.name as place_name,
    p.is_active,
    p.deactivation_reason,
    p.deactivated_at,
    p.deactivated_by,
    pdr.reason_type,
    pdr.reason_description,
    pdr.estimated_reactivation_date,
    pdr.contact_person,
    pdr.contact_phone,
    pdr.contact_email
FROM places p
LEFT JOIN place_deactivation_reasons pdr ON p.id = pdr.place_id AND pdr.is_resolved = false;

-- Visits with visitor and place info
CREATE OR REPLACE VIEW visits_with_details AS
SELECT 
    v.*,
    vis.first_name as visitor_first_name,
    vis.last_name as visitor_last_name,
    vis.company as visitor_company,
    p.name as place_name,
    p.address as place_address
FROM visits v
JOIN visitors vis ON v.visitor_id = vis.id
JOIN places p ON v.place_id = p.id;
```

---

## 🚀 **Frontend Integration**

### **1. Install Dependencies**

```bash
npm install date-fns lucide-react
```

### **2. API Client Setup**

The `lib/place-management-api.ts` file provides a complete API client that integrates with the secure-select API:

```typescript
import { placeManagementAPI } from '@/lib/place-management-api'

// Get all active places
const activePlaces = await placeManagementAPI.getActivePlaces()

// Search visitors by name
const visitors = await placeManagementAPI.searchVisitorsByName('John')

// Get today's visits
const todaysVisits = await placeManagementAPI.getTodaysVisits()

// Get place statistics
const stats = await placeManagementAPI.getPlaceStatistics()
```

### **3. Component Integration**

#### **Place Management Dashboard**
```typescript
// app/place-management/page.tsx
import { PlaceManagementDashboard } from "@/components/place-management/place-management-dashboard"

export default function PlaceManagementPage() {
  return <PlaceManagementDashboard />
}
```

#### **Visitor Management**
```typescript
// app/visitor-management/page.tsx
import { VisitorManagementDashboard } from "@/components/visitor-management/visitor-management-dashboard"

export default function VisitorManagementPage() {
  return <VisitorManagementDashboard />
}
```

#### **Visits Management**
```typescript
// app/visits-management/page.tsx
import { VisitsManagementDashboard } from "@/components/visits-management/visits-management-dashboard"

export default function VisitsManagementPage() {
  return <VisitsManagementDashboard />
}
```

---

## 🔍 **API Usage Examples**

### **1. Place Management**

```typescript
// Get all places with filtering
const places = await placeManagementAPI.getPlaces({
  limit: 50,
  city: 'New York',
  placeType: 'office',
  isActive: true
})

// Get deactivated places
const deactivatedPlaces = await placeManagementAPI.getDeactivatedPlaces()

// Get place status with deactivation info
const placeStatus = await placeManagementAPI.getPlaceStatus('place-uuid')

// Get deactivation history
const history = await placeManagementAPI.getPlaceDeactivationHistory('place-uuid')
```

### **2. Visitor Management**

```typescript
// Get all visitors
const visitors = await placeManagementAPI.getVisitors({
  limit: 100,
  search: 'John',
  company: 'ABC Corp',
  isBlacklisted: false
})

// Search visitors by name
const searchResults = await placeManagementAPI.searchVisitorsByName('John')

// Get blacklisted visitors
const blacklisted = await placeManagementAPI.getBlacklistedVisitors()
```

### **3. Visit Management**

```typescript
// Get today's visits
const todaysVisits = await placeManagementAPI.getTodaysVisits()

// Get visits by date range
const weekVisits = await placeManagementAPI.getVisitsByDateRange('2024-01-01', '2024-01-07')

// Get visits by place
const placeVisits = await placeManagementAPI.getVisitsByPlace('place-uuid')

// Get visits with filtering
const scheduledVisits = await placeManagementAPI.getVisits({
  status: 'scheduled',
  limit: 20
})
```

### **4. Statistics and Reporting**

```typescript
// Get place statistics
const placeStats = await placeManagementAPI.getPlaceStatistics('place-uuid')

// Get statistics summary
const summary = await placeManagementAPI.getPlaceStatisticsSummary()

// Get access logs
const accessLogs = await placeManagementAPI.getAccessLogs({
  placeId: 'place-uuid',
  accessType: 'entry',
  dateFrom: '2024-01-01',
  dateTo: '2024-01-31'
})
```

---

## 🔒 **Authentication Integration**

### **1. JWT Token Management**

The API client automatically handles JWT tokens:

```typescript
// Token is automatically included in requests
const places = await placeManagementAPI.getPlaces()

// Token expiration is handled automatically
// If token expires, user is redirected to login
```

### **2. Role-Based Access**

The secure-select API enforces role-based access:

```typescript
// Different roles see different data
// Admin: Can see all places, visitors, visits
// Manager: Can see assigned places and their data
// Reception: Can see today's visits and visitor info
// Employee: Can see their own visits

// The API automatically filters data based on user role
```

---

## 📊 **Filtering Examples**

### **1. Text Search**
```typescript
// Search places by name
const filters = [{
  column: 'name',
  operator: 'contains',
  value: 'Office'
}]

const places = await placeManagementAPI.getTableData('places', { filters })
```

### **2. Date Range**
```typescript
// Get visits from last week
const filters = [{
  column: 'scheduled_start_time',
  operator: 'date_between',
  value: ['2024-01-01', '2024-01-07']
}]

const visits = await placeManagementAPI.getTableData('visits', { filters })
```

### **3. Boolean Filters**
```typescript
// Get active places only
const filters = [{
  column: 'is_active',
  operator: 'is_true',
  value: true
}]

const activePlaces = await placeManagementAPI.getTableData('places', { filters })
```

### **4. Numeric Range**
```typescript
// Get places with capacity between 100-500
const filters = [{
  column: 'capacity',
  operator: 'between',
  value: [100, 500]
}]

const places = await placeManagementAPI.getTableData('places', { filters })
```

---

## 🎯 **Real-World Usage Scenarios**

### **1. Reception Dashboard**
```typescript
const ReceptionDashboard = () => {
  const [todaysVisits, setTodaysVisits] = useState([])
  const [visitors, setVisitors] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    // Load today's visits
    const visits = await placeManagementAPI.getTodaysVisits()
    setTodaysVisits(visits)

    // Load recent visitors
    const recentVisitors = await placeManagementAPI.getVisitors({ limit: 20 })
    setVisitors(recentVisitors)
  }

  return (
    <div>
      <h2>Today's Visits ({todaysVisits.length})</h2>
      {todaysVisits.map(visit => (
        <div key={visit.id}>
          <h3>{visit.visitor_first_name} {visit.visitor_last_name}</h3>
          <p>Purpose: {visit.visit_purpose}</p>
          <p>Time: {new Date(visit.scheduled_start_time).toLocaleTimeString()}</p>
        </div>
      ))}
    </div>
  )
}
```

### **2. Place Management**
```typescript
const PlaceManagement = () => {
  const [places, setPlaces] = useState([])
  const [filters, setFilters] = useState({
    city: '',
    placeType: '',
    isActive: true
  })

  useEffect(() => {
    loadPlaces()
  }, [filters])

  const loadPlaces = async () => {
    const placesData = await placeManagementAPI.getPlaces({
      city: filters.city || undefined,
      placeType: filters.placeType || undefined,
      isActive: filters.isActive
    })
    setPlaces(placesData)
  }

  return (
    <div>
      <h2>Place Management</h2>
      {places.map(place => (
        <div key={place.id}>
          <h3>{place.name}</h3>
          <p>Type: {place.place_type}</p>
          <p>Status: {place.is_active ? 'Active' : 'Inactive'}</p>
        </div>
      ))}
    </div>
  )
}
```

---

## 🚨 **Error Handling**

### **1. API Error Handling**
```typescript
try {
  const places = await placeManagementAPI.getPlaces()
} catch (error) {
  if (error.message.includes('Authentication failed')) {
    // Redirect to login
    window.location.href = '/login'
  } else {
    // Show error message
    setError(error.message)
  }
}
```

### **2. Network Error Handling**
```typescript
const loadData = async () => {
  try {
    setLoading(true)
    const data = await placeManagementAPI.getPlaces()
    setPlaces(data)
  } catch (error) {
    setError('Failed to load data. Please try again.')
  } finally {
    setLoading(false)
  }
}
```

---

## 📱 **Mobile Responsiveness**

All components are built with responsive design:

```css
/* Components automatically adapt to mobile screens */
.place-card {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
}

.visitor-table {
  @apply overflow-x-auto
}
```

---

## 🔧 **Customization**

### **1. Custom Filters**
```typescript
// Add custom filtering logic
const customFilters = [
  {
    column: 'created_at',
    operator: 'date_between',
    value: [startDate, endDate]
  },
  {
    column: 'place_type',
    operator: 'in',
    value: ['office', 'warehouse']
  }
]

const results = await placeManagementAPI.getTableData('places', { filters: customFilters })
```

### **2. Custom Sorting**
```typescript
// Sort by multiple columns
const sortedData = await placeManagementAPI.getTableData('visits', {
  sortBy: 'scheduled_start_time',
  sortOrder: 'desc'
})
```

---

## 🎉 **Summary**

This integration provides:

✅ **Complete database schema** with all necessary tables  
✅ **Secure-select API client** with authentication  
✅ **React components** for place, visitor, and visit management  
✅ **Role-based access control** enforced by the API  
✅ **Advanced filtering** and search capabilities  
✅ **Real-time data** with automatic updates  
✅ **Error handling** and loading states  
✅ **Mobile responsive** design  
✅ **TypeScript support** for type safety  

**Your Place Management System is now fully integrated with the secure-select API!** 🚀
