"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Edit, Trash2, Calendar, Clock, MapPin, Users, X, Search, AlertTriangle, Loader2, Utensils, Mail, Send, Info } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { placeManagementAPI } from "@/lib/place-management-api"
import { bookingEmailAPI, type BookingParticipant } from "@/lib/booking-email-api"
import toast from "react-hot-toast"

interface ExternalParticipant {
  id: string
  fullName: string
  email: string
  phone: string
  referenceType: "NIC" | "Passport" | "Employee ID"
  referenceValue: string
}

interface RefreshmentDetails {
  required: boolean
  type: string
  items: string[]
  servingTime: string
  specialRequests: string
  estimatedCount: number
}

interface Employee {
  id: string
  name: string
  email: string
  department: string
  role: string
  phone: string
}

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: string
}

interface Place {
  id: string
  name: string
  description: string
  city: string
  state: string
  place_type: string
  capacity: number
  is_active: boolean
}

interface PlaceConfiguration {
  id: string
  place_id: string
  available_monday: boolean
  available_tuesday: boolean
  available_wednesday: boolean
  available_thursday: boolean
  available_friday: boolean
  available_saturday: boolean
  available_sunday: boolean
  start_time: string
  end_time: string
  allow_bookings: boolean
  max_bookings_per_day: number
  booking_slot_duration: number
}

interface AvailablePlace extends Place {
  configuration?: PlaceConfiguration
  isAvailableForDate?: boolean
  operatingHours?: string
}

// Generate 100+ mock employees
const generateMockEmployees = (): Employee[] => {
  const departments = [
    "Engineering",
    "Marketing",
    "Sales",
    "HR",
    "Finance",
    "Operations",
    "Design",
    "Legal",
    "IT Support",
    "Customer Success",
  ]
  const roles = [
    "Manager",
    "Senior",
    "Junior",
    "Lead",
    "Director",
    "Specialist",
    "Coordinator",
    "Analyst",
    "Executive",
    "Associate",
  ]
  const firstNames = [
    "John",
    "Sarah",
    "Mike",
    "Lisa",
    "David",
    "Emma",
    "James",
    "Anna",
    "Robert",
    "Maria",
    "Chris",
    "Jennifer",
    "Michael",
    "Jessica",
    "William",
    "Ashley",
    "Daniel",
    "Amanda",
    "Matthew",
    "Stephanie",
    "Andrew",
    "Nicole",
    "Joshua",
    "Elizabeth",
    "Christopher",
    "Megan",
    "Anthony",
    "Rachel",
    "Mark",
    "Lauren",
    "Steven",
    "Samantha",
    "Paul",
    "Brittany",
    "Kenneth",
    "Danielle",
    "Kevin",
    "Rebecca",
    "Brian",
    "Katherine",
  ]
  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Anderson",
    "Thomas",
    "Taylor",
    "Moore",
    "Jackson",
    "Martin",
    "Lee",
    "Perez",
    "Thompson",
    "White",
    "Harris",
    "Sanchez",
    "Clark",
    "Ramirez",
    "Lewis",
    "Robinson",
    "Walker",
    "Young",
    "Allen",
    "King",
    "Wright",
    "Scott",
    "Torres",
    "Nguyen",
    "Hill",
    "Flores",
  ]

  const employees: Employee[] = []

  for (let i = 1; i <= 120; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const department = departments[Math.floor(Math.random() * departments.length)]
    const role = roles[Math.floor(Math.random() * roles.length)]

    employees.push({
      id: `emp-${i}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
      department,
      role,
      phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    })
  }

  return employees
}

const mockEmployees = generateMockEmployees()

interface BookingCancellation {
  id: string
  booking_id: string
  cancelled_by: string
  cancellation_reason: string
  cancellation_type: string
  cancelled_at: string
}

interface Booking {
  id: string
  bookingRefId?: string // 6-character reference ID
  title: string
  description: string
  date: string
  place: string // place name for display
  placeId?: string // place ID for form
  startTime: string
  endTime: string
  responsiblePerson: Employee | null
  selectedEmployees: Employee[]
  externalParticipants: ExternalParticipant[]
  refreshments?: RefreshmentDetails
  status: "upcoming" | "ongoing" | "completed" | "cancelled"
  createdBy: string
  createdAt: string
  totalParticipantsCount?: number // From database for accurate display
  internalParticipantsCount?: number
  externalParticipantsCount?: number
  cancellation?: BookingCancellation // Cancellation details if cancelled
}

const mockPlaces = [
  { id: "1", name: "Conference Room A" },
  { id: "2", name: "Meeting Room B" },
  { id: "3", name: "Board Room" },
]

const initialBookings: Booking[] = [
  {
    id: "1",
    title: "Weekly Team Meeting",
    description: "Regular team sync and updates",
    date: "2024-12-10",
    place: "Conference Room A",
    startTime: "10:00",
    endTime: "11:00",
    responsiblePerson: mockEmployees[0],
    selectedEmployees: [mockEmployees[0], mockEmployees[1]],
    externalParticipants: [
      {
        id: "1",
        fullName: "David Wilson",
        email: "david@external.com",
        phone: "+1234567890",
        referenceType: "NIC",
        referenceValue: "123456789V",
      },
    ],
    refreshments: {
      required: true,
      type: "Light Refreshments",
      items: ["Coffee", "Tea", "Cookies"],
      servingTime: "10:15",
      specialRequests: "Vegetarian options required",
      estimatedCount: 5,
    },
    status: "upcoming",
    createdBy: "John Admin",
    createdAt: "2024-12-05",
  },
  {
    id: "2",
    title: "Client Presentation",
    description: "Product demo for potential client",
    date: "2024-12-11",
    place: "Board Room",
    startTime: "14:00",
    endTime: "15:30",
    responsiblePerson: mockEmployees[2],
    selectedEmployees: [mockEmployees[2]],
    externalParticipants: [
      {
        id: "2",
        fullName: "Jane Smith",
        email: "jane@client.com",
        phone: "+1234567891",
        referenceType: "Passport",
        referenceValue: "A12345678",
      },
      {
        id: "3",
        fullName: "Robert Brown",
        email: "robert@client.com",
        phone: "+1234567892",
        referenceType: "Employee ID",
        referenceValue: "EMP001",
      },
    ],
    refreshments: {
      required: true,
      type: "Full Catering",
      items: ["Lunch", "Beverages", "Dessert"],
      servingTime: "14:30",
      specialRequests: "Halal and vegetarian options",
      estimatedCount: 8,
    },
    status: "upcoming",
    createdBy: "Lisa Johnson",
    createdAt: "2024-12-06",
  },
]

export function BookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [isLoadingBookings, setIsLoadingBookings] = useState(true)
  const [bookingsError, setBookingsError] = useState<string | null>(null)
  
  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPlace, setFilterPlace] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [placeFilter, setPlaceFilter] = useState<string>("all")
  const [filterDateFrom, setFilterDateFrom] = useState<string>("")
  const [filterDateTo, setFilterDateTo] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  
  // Confirmation dialog state
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null)
  const [confirmMessage, setConfirmMessage] = useState("")
  const [confirmTitle, setConfirmTitle] = useState("")
  const [cancellationReason, setCancellationReason] = useState("")
  const [isCancellationDialog, setIsCancellationDialog] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null)
  const [isCancellationReasonDialogOpen, setIsCancellationReasonDialogOpen] = useState(false)
  const [selectedCancellation, setSelectedCancellation] = useState<BookingCancellation | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [activeTab, setActiveTab] = useState("list")
  
  // Email notification state
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [selectedBookingForEmail, setSelectedBookingForEmail] = useState<Booking | null>(null)
  const [selectedEmailParticipants, setSelectedEmailParticipants] = useState<string[]>([])
  const [isSendingEmails, setIsSendingEmails] = useState(false)
  const [bookingParticipants, setBookingParticipants] = useState<BookingParticipant[]>([])
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false)
  const [emailType, setEmailType] = useState<'booking_details' | 'booking_confirmation'>('booking_details')
  const [customMessage, setCustomMessage] = useState('')
  
  // Available Places State
  const [availablePlaces, setAvailablePlaces] = useState<AvailablePlace[]>([])
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false)
  const [placesError, setPlacesError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  
  // Available Time Slots State (old fixed slot system - keeping for reference)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("")
  
  // Flexible Time Selection State
  const [availableStartTimes, setAvailableStartTimes] = useState<string[]>([])
  const [availableEndTimes, setAvailableEndTimes] = useState<string[]>([])
  const [minBookingDuration, setMinBookingDuration] = useState<number>(30) // Default 30 minutes
  const [currentPlaceConfig, setCurrentPlaceConfig] = useState<PlaceConfiguration | null>(null)
  
  // Available Time Gaps (complete ranges)
  const [availableTimeGaps, setAvailableTimeGaps] = useState<{start: string, end: string, duration: string}[]>([])
  const [selectedTimeGap, setSelectedTimeGap] = useState<string>("")
  
  // Users (Admin & Employee) State
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    place: "",
    startTime: "",
    endTime: "",
    responsiblePerson: null as Employee | null,
    selectedEmployees: [] as Employee[],
    externalParticipants: [] as ExternalParticipant[],
    refreshments: {
      required: false,
      type: "",
      items: [] as string[],
      servingTime: "",
      specialRequests: "",
      estimatedCount: 0,
    },
  })

  const [employeeSearch, setEmployeeSearch] = useState("")
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false)
  const [responsibleSearch, setResponsibleSearch] = useState("")
  const [showResponsibleDropdown, setShowResponsibleDropdown] = useState(false)

  const [newExternalParticipant, setNewExternalParticipant] = useState({
    fullName: "",
    email: "",
    phone: "",
    referenceType: "NIC" as "NIC" | "Passport" | "Employee ID",
    referenceValue: "",
  })

  // Load users on component mount
  useEffect(() => {
    fetchUsers()
  }, [])

  // Reload participants when email dialog opens
  useEffect(() => {
    if (isEmailDialogOpen && selectedBookingForEmail) {
      console.log('📧 ==========================================')
      console.log('📧 EMAIL DIALOG OPENED')
      console.log('📧 ==========================================')
      console.log('📧 Booking ID:', selectedBookingForEmail.id)
      console.log('📧 Booking Title:', selectedBookingForEmail.title)
      
      // Create participants from booking data immediately (synchronous)
      const participantsFromBooking = createParticipantsFromBooking(selectedBookingForEmail)
      console.log('📧 ==========================================')
      console.log('📧 PARTICIPANTS FROM BOOKING DATA')
      console.log('📧 ==========================================')
      console.log('📧 Total participants:', participantsFromBooking.length)
      participantsFromBooking.forEach((p, index) => {
        console.log(`📧   ${index + 1}. ID: ${p.id}`)
        console.log(`📧      Name: ${p.full_name}`)
        console.log(`📧      Email: ${p.email || 'NO EMAIL ❌'}`)
        console.log(`📧      Has Email: ${p.has_email === 1 ? '✅' : '❌'}`)
        console.log(`📧      Type: ${p.member_type || 'N/A'}`)
      })
      
      if (participantsFromBooking.length > 0) {
        console.log('✅ Setting participants from booking data:', participantsFromBooking.length)
        setBookingParticipants(participantsFromBooking)
      } else {
        console.warn('⚠️ No participants found in booking data')
        setBookingParticipants([])
      }
      
      // Also try to load from API (may update with more accurate data)
      loadBookingParticipants(selectedBookingForEmail.id).catch(error => {
        console.error('Failed to load participants from API:', error)
        // Keep the participants from booking data if API fails
      })
    } else if (!isEmailDialogOpen) {
      // Clear participants when dialog closes
      console.log('📧 Email dialog closed, clearing participants')
      setBookingParticipants([])
      setSelectedEmailParticipants([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmailDialogOpen, selectedBookingForEmail?.id])

  // Fetch users (admin and employee roles) from userprofile table
  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true)
      
      console.log('👥 Fetching users from userprofile table...')
      
      // Fetch all users and filter by role on frontend
      // This ensures compatibility with all API versions
      const allUsersResponse = await placeManagementAPI.getTableData('userprofile', {
        limit: 500
      })
      
      console.log('📦 Total users fetched:', allUsersResponse.length)
      
      // Filter for admin and employee roles only
      const filteredUsers = allUsersResponse.filter((user: any) => 
        user.role === 'admin' || user.role === 'employee'
      )
      
      console.log('✅ Admin & Employee users:', filteredUsers.length)
      
      setUsers(filteredUsers)
      
      if (filteredUsers.length === 0) {
        toast('No admin or employee users found in the system', {
          position: 'top-center',
          duration: 4000,
          icon: '⚠️'
        })
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch users:', error)
      toast.error('Failed to load users', {
        position: 'top-center',
        duration: 3000,
        icon: '❌'
      })
    } finally {
      setIsLoadingUsers(false)
    }
  }

  // Function to get day of week from date
  const getDayOfWeek = (dateString: string): string => {
    const date = new Date(dateString)
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[date.getDay()]
  }

  // Fetch places that are available for the selected date
  const fetchAvailablePlaces = async (dateString: string) => {
    try {
      setIsLoadingPlaces(true)
      setPlacesError(null)
      
      console.log('📅 Fetching available places for date:', dateString)
      
      const dayOfWeek = getDayOfWeek(dateString)
      console.log('📅 Day of week:', dayOfWeek)
      
      // Step 1: Get all active places
      const allPlaces = await placeManagementAPI.getPlaces({
        isActive: true,
        limit: 100
      })
      
      console.log('📍 Active places found:', allPlaces.length)
      
      // Step 2: Get configurations for all places
      const configurationsResponse = await placeManagementAPI.getTableData('place_configuration', {
        limit: 100
      })
      
      console.log('⚙️ Configurations found:', configurationsResponse.length)
      
      // Step 3: Filter places based on date availability and booking settings
      const availablePlacesForDate = allPlaces
        .map((place: Place) => {
          // Find configuration for this place
          const config = configurationsResponse.find((c: any) => c.place_id === place.id)
          
          if (!config) {
            console.log(`⚠️ No configuration found for place: ${place.name}`)
            return null
          }
          
          // Check if bookings are allowed
          if (!config.allow_bookings) {
            console.log(`🚫 Bookings not allowed for: ${place.name}`)
            return null
          }
          
          // Check if place is available on this day of week
          const dayKey = `available_${dayOfWeek}` as keyof PlaceConfiguration
          if (!config[dayKey]) {
            console.log(`📅 ${place.name} not available on ${dayOfWeek}`)
            return null
          }
          
          console.log(`✅ ${place.name} is available on ${dayOfWeek}`)
          
          return {
            ...place,
            configuration: config,
            isAvailableForDate: true,
            operatingHours: `${config.start_time} - ${config.end_time}`
          }
        })
        .filter((place: AvailablePlace | null): place is AvailablePlace => place !== null)
      
      console.log(`✅ Available places for ${dateString}:`, availablePlacesForDate.length)
      
      setAvailablePlaces(availablePlacesForDate)
      
      if (availablePlacesForDate.length === 0) {
        toast('No places available for the selected date', {
          position: 'top-center',
          duration: 3000,
          icon: '📅'
        })
      }
      
    } catch (error: any) {
      console.error('❌ Failed to fetch available places:', error)
      const errorMessage = error.message || 'Failed to load available places'
      setPlacesError(errorMessage)
      toast.error(errorMessage, {
        position: 'top-center',
        duration: 4000,
        icon: '❌'
      })
    } finally {
      setIsLoadingPlaces(false)
    }
  }

  // Fetch bookings from database
  const fetchBookings = async () => {
    try {
      setIsLoadingBookings(true)
      setBookingsError(null)
      
      // Fetch all bookings (not deleted)
      const bookingsResponse = await placeManagementAPI.getTableData('bookings', {
        filters: [
          { field: 'is_deleted', operator: '=', value: 0 }
        ],
        sortBy: 'booking_date',
        sortOrder: 'desc',
        limit: 100
      })
      
      const bookingsData: any[] = Array.isArray(bookingsResponse) ? bookingsResponse : []
      
      // Fetch ALL cancellations once at the start (more reliable than filtering per booking)
      console.log('\n  🔍 ========== FETCHING ALL CANCELLATIONS ==========')
      let allCancellations: any[] = []
      try {
        const allCancellationsResponse = await placeManagementAPI.getTableData('booking_cancellations', {
          limit: 1000 // Get all cancellations
        })
        
        console.log(`  📥 RAW CANCELLATIONS API RESPONSE:`, allCancellationsResponse)
        
        // Handle different response formats
        if (Array.isArray(allCancellationsResponse)) {
          allCancellations = allCancellationsResponse
        } else if (allCancellationsResponse && allCancellationsResponse.data && Array.isArray(allCancellationsResponse.data)) {
          allCancellations = allCancellationsResponse.data
        } else if (allCancellationsResponse && allCancellationsResponse.success && Array.isArray(allCancellationsResponse.data)) {
          allCancellations = allCancellationsResponse.data
        }
        
        console.log(`  📊 Total cancellations fetched: ${allCancellations.length}`)
        console.log(`  📋 Cancellation booking IDs:`, allCancellations.map((c: any) => ({
          id: c.id,
          booking_id: c.booking_id || c.bookingId,
          reason: c.cancellation_reason || c.cancellationReason
        })))
        console.log(`  ==========================================\n`)
      } catch (error) {
        console.error(`  ❌ Error fetching all cancellations:`, error)
      }
      
      // Transform database records to Booking interface
      const transformedBookings: Booking[] = await Promise.all(
        bookingsData.map(async (booking: any) => {
          // Fetch participants for this booking
          const participantsResponse = await placeManagementAPI.getTableData('booking_participants', {
            limit: 50
          })
          let participants: any[] = Array.isArray(participantsResponse) ? participantsResponse : []
          
          // Client-side filter by booking_id and is_deleted
          participants = participants.filter((p: any) => 
            p.booking_id === booking.id && (p.is_deleted === false || p.is_deleted === 0)
          )
          
          // CLIENT-SIDE FILTER: Ensure we only use participants for THIS booking
          participants = participants.filter(p => p.booking_id === booking.id)
          
          // Fetch external participants
          const externalParticipantsResponse = await placeManagementAPI.getTableData('external_participants', {
            limit: 50
          })
          let externalParticipants: any[] = Array.isArray(externalParticipantsResponse) ? externalParticipantsResponse : []
          
          // CLIENT-SIDE FILTER: Ensure we only use participants for THIS booking AND not deleted
          externalParticipants = externalParticipants.filter((p: any) => 
            p.booking_id === booking.id && (p.is_deleted === false || p.is_deleted === 0)
          )
          
          // Fetch refreshments
          const refreshmentsResponse = await placeManagementAPI.getTableData('booking_refreshments', {
            filters: [
              { field: 'booking_id', operator: '=', value: booking.id }
            ],
            limit: 1
          })
          const refreshments: any[] = Array.isArray(refreshmentsResponse) ? refreshmentsResponse : []
          
          // Find cancellation data from pre-fetched list (client-side matching)
          let cancellationData: BookingCancellation | undefined = undefined
          const isCancelledStatus = booking.status?.toLowerCase() === 'cancelled' || booking.status === 'cancelled' || booking.status === 'Cancelled'
          if (isCancelledStatus) {
            console.log(`\n  🔍 ========== MATCHING CANCELLATION DATA ==========`)
            console.log(`  📋 Booking ID: "${booking.id}"`)
            console.log(`  📋 Booking Title: "${booking.title}"`)
            console.log(`  📋 Booking Status: "${booking.status}"`)
            console.log(`  📊 Total cancellations available: ${allCancellations.length}`)
            
            // Find matching cancellation (try multiple field name variations)
            const matchingCancellation = allCancellations.find((c: any) => {
              const bookingIdMatch = c.booking_id === booking.id || 
                                    c.bookingId === booking.id ||
                                    String(c.booking_id || '').toLowerCase() === String(booking.id || '').toLowerCase() ||
                                    String(c.bookingId || '').toLowerCase() === String(booking.id || '').toLowerCase()
              
              if (bookingIdMatch) {
                console.log(`  ✅ Found matching cancellation:`, {
                  cancellation_id: c.id,
                  cancellation_booking_id: c.booking_id || c.bookingId,
                  booking_id: booking.id,
                  reason: c.cancellation_reason || c.cancellationReason
                })
              }
              
              return bookingIdMatch
            })
            
            if (matchingCancellation) {
              console.log(`  📋 Raw cancellation object:`, matchingCancellation)
              console.log(`  📋 Cancellation object keys:`, Object.keys(matchingCancellation))
              
              const reason = matchingCancellation.cancellation_reason || 
                           matchingCancellation.cancellationReason ||
                           matchingCancellation['cancellation_reason'] ||
                           matchingCancellation.reason ||
                           ''
              
              cancellationData = {
                id: matchingCancellation.id,
                booking_id: matchingCancellation.booking_id || matchingCancellation.bookingId || booking.id,
                cancelled_by: matchingCancellation.cancelled_by || matchingCancellation.cancelledBy,
                cancellation_reason: String(reason).trim(),
                cancellation_type: matchingCancellation.cancellation_type || matchingCancellation.cancellationType || 'user_cancelled',
                cancelled_at: matchingCancellation.cancelled_at || matchingCancellation.cancelledAt
              }
              
              console.log(`  ✅ Final cancellation data object:`, cancellationData)
              console.log(`  ✅ Cancellation reason (final):`, cancellationData.cancellation_reason)
              console.log(`  ==========================================\n`)
            } else {
              console.log(`  ⚠️ No matching cancellation found for booking ${booking.id}`)
              console.log(`  📋 Available cancellation booking IDs:`, allCancellations.map((c: any) => c.booking_id || c.bookingId))
              console.log(`  ==========================================\n`)
            }
          }
          
          // Transform participants
          const selectedEmployees: Employee[] = participants.map((p: any) => ({
            id: p.employee_id,
            name: p.employee_name,
            email: p.employee_email,
            department: p.employee_department || '',
            role: p.employee_role || '',
            phone: p.employee_phone || ''
          }))
          
          // Transform external participants
          const externalParticipantsList: ExternalParticipant[] = externalParticipants.map((p: any) => ({
            id: p.id,
            fullName: p.full_name,
            email: p.email,
            phone: p.phone,
            referenceType: p.reference_type,
            referenceValue: p.reference_value
          }))
          
          // Parse refreshments
          // Check refreshments_required field from bookings table first
          const refreshmentsRequired = booking.refreshments_required === 1 || booking.refreshments_required === true
          
          let refreshmentDetails: RefreshmentDetails = {
            required: false,
            type: '',
            items: [],
            servingTime: '',
            specialRequests: '',
            estimatedCount: 0
          }
          
          // Only set refreshments as required if:
          // 1. refreshments_required is 1/true in bookings table
          // 2. AND there's a record in booking_refreshments table
          if (refreshmentsRequired && refreshments.length > 0) {
            const r = refreshments[0]
            refreshmentDetails = {
              required: true,
              type: r.refreshment_type || '',
              items: r.items ? JSON.parse(r.items) : [],
              servingTime: r.serving_time ? r.serving_time.substring(0, 5) : '', // HH:MM:SS -> HH:MM
              specialRequests: r.special_requests || '',
              estimatedCount: r.estimated_count || 0
            }
          }
          
          // Create responsible person object
          const responsiblePerson: Employee | null = booking.responsible_person_id ? {
            id: booking.responsible_person_id,
            name: booking.responsible_person_name || '',
            email: booking.responsible_person_email || '',
            department: '',
            role: '',
            phone: ''
          } : null
          
          // Normalize date format to YYYY-MM-DD
          // IMPORTANT: Database stores dates, but API may convert to UTC timestamps
          // We need to convert back to LOCAL date
          let normalizedDate = booking.booking_date
          
          if (normalizedDate) {
            // If it's already in simple YYYY-MM-DD format (no time), keep it
            if (typeof normalizedDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
              // Already in correct format, no conversion needed
            }
            // If it's "YYYY-MM-DD HH:MM:SS" format, extract date part
            else if (typeof normalizedDate === 'string' && normalizedDate.includes(' ') && !normalizedDate.includes('T')) {
              normalizedDate = normalizedDate.split(' ')[0]
            }
            // If it's ISO string (with T) - this is UTC, convert to LOCAL date
            else if (typeof normalizedDate === 'string' && normalizedDate.includes('T')) {
              // Parse as UTC and get the local date components
              const d = new Date(normalizedDate)
              const year = d.getFullYear()
              const month = String(d.getMonth() + 1).padStart(2, '0')
              const day = String(d.getDate()).padStart(2, '0')
              normalizedDate = `${year}-${month}-${day}`
            }
            // If it's a Date object
            else if (typeof normalizedDate === 'object') {
              const d = new Date(normalizedDate)
              const year = d.getFullYear()
              const month = String(d.getMonth() + 1).padStart(2, '0')
              const day = String(d.getDate()).padStart(2, '0')
              normalizedDate = `${year}-${month}-${day}`
            }
          }
          
          return {
            id: booking.id,
            bookingRefId: booking.booking_ref_id, // 6-character reference
            title: booking.title,
            description: booking.description || '',
            date: normalizedDate,
            place: booking.place_name,
            placeId: booking.place_id, // Store place ID for editing
            startTime: booking.start_time.substring(0, 5), // HH:MM:SS -> HH:MM
            endTime: booking.end_time.substring(0, 5), // HH:MM:SS -> HH:MM
            responsiblePerson,
            selectedEmployees,
            externalParticipants: externalParticipantsList,
            refreshments: refreshmentDetails,
            status: booking.status === 'in-progress' ? 'ongoing' : booking.status as 'upcoming' | 'ongoing' | 'completed' | 'cancelled',
            createdBy: booking.created_by || 'Unknown',
            createdAt: booking.created_at ? new Date(booking.created_at).toISOString().split('T')[0] : '',
            // Use actual loaded participant counts (more accurate than database totals)
            totalParticipantsCount: selectedEmployees.length + externalParticipantsList.length,
            internalParticipantsCount: selectedEmployees.length,
            externalParticipantsCount: externalParticipantsList.length,
            cancellation: cancellationData // Add cancellation data if available
          }
        })
      )
      
      // Log cancellation data for each booking to verify correct assignment
      console.log('\n📋 CANCELLATION DATA VERIFICATION:')
      transformedBookings.forEach((b, idx) => {
        if (b.status === 'cancelled' || b.status === 'Cancelled') {
          console.log(`\n${idx + 1}. Booking "${b.title}" (ID: ${b.id}):`)
          if (b.cancellation) {
            console.log(`   ✅ Has cancellation data:`)
            console.log(`      - Reason: "${b.cancellation.cancellation_reason}"`)
            console.log(`      - Booking ID: ${b.cancellation.booking_id}`)
            console.log(`      - Cancelled by: ${b.cancellation.cancelled_by}`)
          } else {
            console.log(`   ⚠️ No cancellation data found`)
          }
        }
      })
      console.log('\n')
      
      setBookings(transformedBookings)
      
    } catch (error: any) {
      console.error('❌ Failed to fetch bookings:', error)
      const errorMessage = error.message || 'Failed to load bookings'
      setBookingsError(errorMessage)
      toast.error(errorMessage, {
        position: 'top-center',
        duration: 4000,
        icon: '❌'
      })
    } finally {
      setIsLoadingBookings(false)
    }
  }

  // Fetch bookings on mount
  useEffect(() => {
    console.log('🔄 Component mounted - Fetching bookings from database...')
    fetchBookings()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Generate available time gaps (complete ranges between bookings)
  const generateAvailableTimeGaps = (placeId: string, date: string) => {
    console.log('🕐 Generating available time gaps for place:', placeId, 'date:', date)
    
    const selectedPlace = availablePlaces.find(p => p.id === placeId)
    
    if (!selectedPlace || !selectedPlace.configuration) {
      console.log('⚠️ No place configuration found')
      setAvailableTimeGaps([])
      setCurrentPlaceConfig(null)
      return
    }
    
    const config = selectedPlace.configuration
    setCurrentPlaceConfig(config)
    
    const minDuration = config.booking_slot_duration || 30
    setMinBookingDuration(minDuration)
    
    const openTime = config.start_time.substring(0, 5) // HH:MM
    const closeTime = config.end_time.substring(0, 5)
    
    console.log('⏰ Operating hours:', openTime, '-', closeTime, '| Min Duration:', minDuration, 'min')
    
    // Helper functions
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    }
    
    const minutesToTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
    }
    
    const formatDuration = (minutes: number) => {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      if (hours > 0 && mins > 0) {
        return `${hours}h ${mins}min`
      } else if (hours > 0) {
        return `${hours}h`
      } else {
        return `${mins}min`
      }
    }
    
    const openMinutes = timeToMinutes(openTime)
    const closeMinutes = timeToMinutes(closeTime)
    
    // Get existing bookings for this date and place, sorted by start time
    console.log('🔍 Checking bookings - Total in state:', bookings.length)
    console.log('🔍 Filtering for date:', date, 'place:', selectedPlace.name, 'placeId:', placeId)
    
    const existingBookings = bookings.filter(booking => {
      console.log('  Checking booking:', {
        id: booking.id,
        title: booking.title,
        date: booking.date,
        place: booking.place,
        placeId: booking.placeId,
        status: booking.status,
        time: `${booking.startTime}-${booking.endTime}`
      })
      
      // Match by place ID if available, fallback to place name
      const placeMatches = booking.placeId ? booking.placeId === placeId : booking.place === selectedPlace.name
      
      if (booking.date !== date) {
        console.log('    ❌ Date mismatch:', booking.date, '!=', date)
        return false
      }
      
      if (!placeMatches) {
        console.log('    ❌ Place mismatch:', booking.placeId || booking.place, '!=', placeId, 'or', selectedPlace.name)
        return false
      }
      
      if (booking.status === 'cancelled') {
        console.log('    ⏭️ Cancelled booking')
        return false
      }
      
      if (editingBooking && booking.id === editingBooking.id) {
        console.log('    ⏭️ Current editing booking')
        return false
      }
      
      console.log('    ✅ Booking matches criteria')
      return true
    }).map(booking => ({
      start: timeToMinutes(booking.startTime),
      end: timeToMinutes(booking.endTime),
      title: booking.title
    })).sort((a, b) => a.start - b.start)
    
    console.log('📋 Existing bookings found:', existingBookings.length)
    existingBookings.forEach(b => {
      console.log(`  📌 ${b.title}: ${minutesToTime(b.start)} - ${minutesToTime(b.end)}`)
    })
    
    // Find gaps between bookings
    const gaps: {start: string, end: string, duration: string}[] = []
    
    let currentTime = openMinutes
    
    for (const booking of existingBookings) {
      // Check if there's a gap before this booking
      if (currentTime < booking.start) {
        const gapDuration = booking.start - currentTime
        
        // Only add gap if it meets minimum duration
        if (gapDuration >= minDuration) {
          gaps.push({
            start: minutesToTime(currentTime),
            end: minutesToTime(booking.start),
            duration: formatDuration(gapDuration)
          })
          console.log(`✅ Gap found: ${minutesToTime(currentTime)} - ${minutesToTime(booking.start)} (${formatDuration(gapDuration)})`)
        } else {
          console.log(`⏭️ Gap too small: ${minutesToTime(currentTime)} - ${minutesToTime(booking.start)} (${formatDuration(gapDuration)})`)
        }
      }
      
      // Move current time to end of this booking
      currentTime = Math.max(currentTime, booking.end)
    }
    
    // Check if there's a gap after the last booking until closing
    if (currentTime < closeMinutes) {
      const gapDuration = closeMinutes - currentTime
      
      if (gapDuration >= minDuration) {
        gaps.push({
          start: minutesToTime(currentTime),
          end: minutesToTime(closeMinutes),
          duration: formatDuration(gapDuration)
        })
        console.log(`✅ Gap found: ${minutesToTime(currentTime)} - ${minutesToTime(closeMinutes)} (${formatDuration(gapDuration)})`)
      }
    }
    
    console.log(`✅ Total available gaps: ${gaps.length}`)
    setAvailableTimeGaps(gaps)
  }

  // Generate available start times (flexible booking) - OLD SYSTEM
  const generateAvailableStartTimes = (placeId: string, date: string) => {
    console.log('🕐 Generating available start times for place:', placeId, 'date:', date)
    
    const selectedPlace = availablePlaces.find(p => p.id === placeId)
    
    if (!selectedPlace || !selectedPlace.configuration) {
      console.log('⚠️ No place configuration found')
      setAvailableStartTimes([])
      setCurrentPlaceConfig(null)
      return
    }
    
    const config = selectedPlace.configuration
    setCurrentPlaceConfig(config)
    
    // Use slot duration as both interval and minimum duration
    const slotInterval = config.booking_slot_duration || 30
    const minDuration = config.booking_slot_duration || 30 // Minimum duration = slot duration
    setMinBookingDuration(minDuration)
    
    // Parse operating hours
    const openTime = config.start_time.substring(0, 5) // HH:MM
    const closeTime = config.end_time.substring(0, 5)
    
    console.log('⏰ Operating hours:', openTime, '-', closeTime, '| Interval:', slotInterval, 'min | Min Duration:', minDuration, 'min')
    
    // Helper functions
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    }
    
    const minutesToTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
    }
    
    const openMinutes = timeToMinutes(openTime)
    const closeMinutes = timeToMinutes(closeTime)
    
    // Get existing bookings for this date and place
    const existingBookings = bookings.filter(booking => {
      if (booking.date !== date || booking.place !== selectedPlace.name) return false
      if (booking.status === 'cancelled') return false
      if (editingBooking && booking.id === editingBooking.id) return false
      return true
    }).map(booking => ({
      start: timeToMinutes(booking.startTime),
      end: timeToMinutes(booking.endTime)
    })).sort((a, b) => a.start - b.start)
    
    console.log('📋 Existing bookings:', existingBookings)
    
    // Generate all possible time points with the interval
    const allTimes: string[] = []
    for (let time = openMinutes; time < closeMinutes; time += slotInterval) {
      allTimes.push(minutesToTime(time))
    }
    
    // Filter start times that have at least minDuration available
    const availableStarts = allTimes.filter(time => {
      const startMin = timeToMinutes(time)
      const minEndMin = startMin + minDuration
      
      // Check if minimum duration fits before closing
      if (minEndMin > closeMinutes) {
        return false
      }
      
      // Check if there's any booking that would prevent minimum duration
      const hasConflict = existingBookings.some(booking => {
        // If booking starts before our minimum end time and ends after our start time
        return booking.start < minEndMin && booking.end > startMin
      })
      
      return !hasConflict
    })
    
    console.log('✅ Available start times:', availableStarts.length)
    setAvailableStartTimes(availableStarts)
  }
  
  // Generate available end times based on selected start time
  const generateAvailableEndTimes = (placeId: string, date: string, startTime: string) => {
    console.log('🕐 Generating available end times for start:', startTime)
    
    const selectedPlace = availablePlaces.find(p => p.id === placeId)
    
    if (!selectedPlace || !selectedPlace.configuration) {
      console.log('⚠️ No place configuration found')
      setAvailableEndTimes([])
      return
    }
    
    const config = selectedPlace.configuration
    const slotInterval = config.booking_slot_duration || 30
    const closeTime = config.end_time.substring(0, 5)
    
    // Helper functions
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    }
    
    const minutesToTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
    }
    
    const startMinutes = timeToMinutes(startTime)
    const closeMinutes = timeToMinutes(closeTime)
    const minEndMinutes = startMinutes + minBookingDuration
    
    // Get existing bookings
    const existingBookings = bookings.filter(booking => {
      if (booking.date !== date || booking.place !== selectedPlace.name) return false
      if (booking.status === 'cancelled') return false
      if (editingBooking && booking.id === editingBooking.id) return false
      return true
    }).map(booking => ({
      start: timeToMinutes(booking.startTime),
      end: timeToMinutes(booking.endTime)
    })).sort((a, b) => a.start - b.start)
    
    // Find the next booking after our start time
    const nextBooking = existingBookings.find(booking => booking.start >= startMinutes)
    const maxEndMinutes = nextBooking ? nextBooking.start : closeMinutes
    
    console.log('📍 Max end time:', minutesToTime(maxEndMinutes), '(next booking at', nextBooking ? minutesToTime(nextBooking.start) : 'close', ')')
    
    // Generate available end times
    const availableEnds: string[] = []
    for (let time = minEndMinutes; time <= maxEndMinutes; time += slotInterval) {
      if (time <= closeMinutes) {
        availableEnds.push(minutesToTime(time))
      }
    }
    
    console.log('✅ Available end times:', availableEnds.length)
    setAvailableEndTimes(availableEnds)
  }

  // Generate time slots based on place configuration (OLD SYSTEM - DEPRECATED)
  const generateTimeSlots = (placeId: string, date: string) => {
    console.log('🕐 Generating time slots for place:', placeId, 'date:', date)
    
    const selectedPlace = availablePlaces.find(p => p.id === placeId)
    
    if (!selectedPlace || !selectedPlace.configuration) {
      console.log('⚠️ No place configuration found')
      setAvailableTimeSlots([])
      return
    }
    
    const config = selectedPlace.configuration
    const slotDuration = config.booking_slot_duration || 60 // Default 60 minutes
    
    // Parse operating hours
    const startTime = config.start_time.substring(0, 5) // HH:MM:SS -> HH:MM
    const endTime = config.end_time.substring(0, 5)
    
    console.log('⏰ Operating hours:', startTime, '-', endTime, '| Slot duration:', slotDuration, 'min')
    
    // Convert time to minutes
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    }
    
    // Convert minutes to time
    const minutesToTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
    }
    
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)
    
    // Generate all possible slots
    const allSlots: string[] = []
    for (let time = startMinutes; time < endMinutes; time += slotDuration) {
      const slotStart = minutesToTime(time)
      const slotEnd = minutesToTime(time + slotDuration)
      
      // Don't add slot if it exceeds end time
      if (time + slotDuration <= endMinutes) {
        allSlots.push(`${slotStart} - ${slotEnd}`)
      }
    }
    
    console.log('📋 All possible slots:', allSlots.length, 'slots')
    
    // Filter out booked slots
    const availableSlots = allSlots.filter(slot => {
      const [slotStart, slotEnd] = slot.split(' - ')
      
      // Check if this slot overlaps with any existing booking
      const hasConflict = bookings.some(booking => {
        if (booking.date !== date || booking.place !== selectedPlace.name) {
          return false
        }
        
        if (booking.status === 'cancelled') {
          return false
        }
        
        // Skip current booking if editing
        if (editingBooking && booking.id === editingBooking.id) {
          return false
        }
        
        const bookingStart = booking.startTime
        const bookingEnd = booking.endTime
        
        // Check for overlap
        const overlap = (
          (slotStart >= bookingStart && slotStart < bookingEnd) ||
          (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
          (slotStart <= bookingStart && slotEnd >= bookingEnd)
        )
        
        if (overlap) {
          console.log('❌ Slot', slot, 'conflicts with', booking.title)
        }
        
        return overlap
      })
      
      return !hasConflict
    })
    
    console.log('✅ Available slots:', availableSlots.length, 'slots')
    setAvailableTimeSlots(availableSlots)
  }

  // Fetch available places when date is selected
  useEffect(() => {
    if (formData.date) {
      fetchAvailablePlaces(formData.date)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.date])
  
  // Generate time gaps when place is selected
  useEffect(() => {
    if (formData.place && formData.date) {
      generateAvailableTimeGaps(formData.place, formData.date)
    } else {
      setAvailableTimeGaps([])
      setSelectedTimeGap("")
      setFormData(prev => ({ ...prev, startTime: '', endTime: '' }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.place, formData.date, bookings])

  const handleEmployeeSearch = (searchTerm: string) => {
    setEmployeeSearch(searchTerm)
    if (searchTerm.length > 0) {
      // Filter from real users fetched from userprofile table
      const filtered = users
        .filter(
          (user) =>
            user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.role.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        .map((user) => ({
          id: user.id,
          name: user.full_name,
          email: user.email,
          department: user.role === 'admin' ? 'Administration' : 'General',
          role: user.role,
          phone: ''
        }))
        .slice(0, 10) // Limit to 10 results for performance
      setFilteredEmployees(filtered)
      setShowEmployeeDropdown(true)
    } else {
      setFilteredEmployees([])
      setShowEmployeeDropdown(false)
    }
  }

  const selectEmployee = (employee: Employee) => {
    if (!formData.selectedEmployees.find((emp) => emp.id === employee.id)) {
      setFormData({
        ...formData,
        selectedEmployees: [...formData.selectedEmployees, employee],
      })
    }
    setEmployeeSearch("")
    setShowEmployeeDropdown(false)
    setFilteredEmployees([])
  }

  const removeEmployee = (employeeId: string) => {
    setFormData({
      ...formData,
      selectedEmployees: formData.selectedEmployees.filter((emp) => emp.id !== employeeId),
    })
  }

  const handleResponsiblePersonSelect = (employee: Employee) => {
    setFormData({ ...formData, responsiblePerson: employee })
    setResponsibleSearch(employee.name)
    setShowResponsibleDropdown(false)
  }

  const handleResponsiblePersonRemove = () => {
    setFormData({ ...formData, responsiblePerson: null })
    setResponsibleSearch("")
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: "",
      place: "",
      startTime: "",
      endTime: "",
      responsiblePerson: null,
      selectedEmployees: [],
      externalParticipants: [],
      refreshments: {
        required: false,
        type: "",
        items: [],
        servingTime: "",
        specialRequests: "",
        estimatedCount: 0,
      },
    })
    setEmployeeSearch("")
    setShowEmployeeDropdown(false)
    setFilteredEmployees([])
    setNewExternalParticipant({
      fullName: "",
      email: "",
      phone: "",
      referenceType: "NIC",
      referenceValue: "",
    })
    setResponsibleSearch("")
    setShowResponsibleDropdown(false)
    setEditingBooking(null)
    setSelectedTimeSlot("")
    setAvailableTimeSlots([])
    setAvailableStartTimes([])
    setAvailableEndTimes([])
    setAvailableTimeGaps([])
    setSelectedTimeGap("")
  }

  const checkAvailability = (date: string, placeId: string, startTime: string, endTime: string, excludeId?: string) => {
    console.log('🔍 Checking availability:', { date, placeId, startTime, endTime, excludeId })
    
    // Find the selected place configuration
    const selectedPlace = availablePlaces.find(p => p.id === placeId)
    
    if (!selectedPlace || !selectedPlace.configuration) {
      toast.error("Place configuration not found. Please select a valid place.", {
        position: 'top-center',
        duration: 4000,
        icon: '⚠️'
      })
      return false
    }
    
    const config = selectedPlace.configuration
    
    // Step 1: Check if booking time is within place operating hours
    const placeStartTime = config.start_time.substring(0, 5) // HH:MM:SS -> HH:MM
    const placeEndTime = config.end_time.substring(0, 5)
    
    if (startTime < placeStartTime || endTime > placeEndTime) {
      toast.error(`Booking time must be within operating hours: ${placeStartTime} - ${placeEndTime}`, {
        position: 'top-center',
        duration: 4000,
        icon: '⏰'
      })
      return false
    }
    
    console.log('✅ Time is within operating hours:', placeStartTime, '-', placeEndTime)
    
    // Step 2: Check if start time is before end time
    if (startTime >= endTime) {
      toast.error("End time must be after start time", {
        position: 'top-center',
        duration: 3000,
        icon: '⚠️'
      })
      return false
    }
    
    // Step 3: Check for overlapping bookings on the same date and place
    const conflictingBookings = bookings.filter((booking) => {
      // Skip if this is the booking being edited
      if (excludeId && booking.id === excludeId) {
        console.log('⏭️ Skipping current booking:', booking.id)
        return false
      }
      
      // Only check bookings on the same date and same place
      if (booking.date !== date || booking.place !== selectedPlace.name) {
        return false
      }
      
      // Skip cancelled bookings
      if (booking.status === "cancelled") {
        console.log('⏭️ Skipping cancelled booking:', booking.id)
        return false
      }

      const bookingStart = new Date(`${date}T${booking.startTime}:00`)
      const bookingEnd = new Date(`${date}T${booking.endTime}:00`)
      const newStart = new Date(`${date}T${startTime}:00`)
      const newEnd = new Date(`${date}T${endTime}:00`)

      // Check for overlap
      const hasOverlap = (
        (newStart >= bookingStart && newStart < bookingEnd) ||
        (newEnd > bookingStart && newEnd <= bookingEnd) ||
        (newStart <= bookingStart && newEnd >= bookingEnd)
      )
      
      if (hasOverlap) {
        console.log('❌ Conflict found with booking:', booking.title, booking.startTime, '-', booking.endTime)
      }
      
      return hasOverlap
    })

    if (conflictingBookings.length > 0) {
      const conflict = conflictingBookings[0]
      toast.error(`Time slot conflicts with "${conflict.title}" (${conflict.startTime} - ${conflict.endTime})`, {
        position: 'top-center',
        duration: 5000,
        icon: '⚠️'
      })
      return false
    }
    
    console.log('✅ No conflicts found. Booking is available!')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check availability
    if (!checkAvailability(formData.date, formData.place, formData.startTime, formData.endTime, editingBooking?.id)) {
      toast.error("This time slot is not available. Please choose a different time or place.", {
        position: 'top-center',
        duration: 4000,
        icon: '⚠️'
      })
      return
    }

    try {
      // Generate UUID for booking
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0
          const v = c === 'x' ? r : (r & 0x3 | 0x8)
          return v.toString(16)
        })
      }

      // Get selected place details
      const selectedPlace = availablePlaces.find(p => p.id === formData.place)

    if (editingBooking) {
        // UPDATE existing booking
        const updateData = {
          title: formData.title,
          description: formData.description,
          booking_date: formData.date,
          start_time: formData.startTime + ':00',
          end_time: formData.endTime + ':00',
          place_id: formData.place,
          place_name: selectedPlace?.name || '',
          responsible_person_id: formData.responsiblePerson?.id,
          responsible_person_name: formData.responsiblePerson?.name,
          responsible_person_email: formData.responsiblePerson?.email,
          refreshments_required: formData.refreshments.required ? 1 : 0,
          refreshments_details: JSON.stringify(formData.refreshments)
        }

        await placeManagementAPI.updateRecord('bookings', 
          { id: editingBooking.id }, 
          updateData
        )

        toast.success('Booking updated successfully!', {
          position: 'top-center',
          duration: 3000,
          icon: '✅'
        })

        // Refresh bookings list from database
        await fetchBookings()
    } else {
        // INSERT new booking
        const bookingId = generateUUID()
        
        const newBookingData = {
          id: bookingId,
          title: formData.title,
          description: formData.description || null,
          booking_date: formData.date,
          start_time: formData.startTime + ':00',
          end_time: formData.endTime + ':00',
          place_id: formData.place,
          place_name: selectedPlace?.name || '',
          status: 'pending',
          responsible_person_id: formData.responsiblePerson?.id || null,
          responsible_person_name: formData.responsiblePerson?.name || null,
          responsible_person_email: formData.responsiblePerson?.email || null,
          total_participants: formData.selectedEmployees.length + formData.externalParticipants.length,
          internal_participants: formData.selectedEmployees.length,
          external_participants: formData.externalParticipants.length,
          refreshments_required: formData.refreshments.required ? 1 : 0,
          refreshments_details: JSON.stringify(formData.refreshments),
          is_deleted: 0
        }

        console.log('📝 Creating new booking:', newBookingData)

        await placeManagementAPI.insertRecord('bookings', newBookingData)

        // Insert internal participants
        for (const employee of formData.selectedEmployees) {
          await placeManagementAPI.insertRecord('booking_participants', {
            id: generateUUID(),
            booking_id: bookingId,
            employee_id: employee.id,
            employee_name: employee.name,
            employee_email: employee.email,
            employee_department: employee.department,
            employee_role: employee.role,
            employee_phone: employee.phone,
            participation_status: 'invited'
          })
        }

        // Insert external participants
        for (const participant of formData.externalParticipants) {
          await placeManagementAPI.insertRecord('external_participants', {
            id: generateUUID(),
            booking_id: bookingId,
            full_name: participant.fullName,
            email: participant.email,
            phone: participant.phone,
            reference_type: participant.referenceType,
            reference_value: participant.referenceValue,
            participation_status: 'invited'
          })
        }

        // Insert refreshments if required
        if (formData.refreshments.required) {
          await placeManagementAPI.insertRecord('booking_refreshments', {
            id: generateUUID(),
            booking_id: bookingId,
            refreshment_type: formData.refreshments.type || 'beverages',
            items: JSON.stringify(formData.refreshments.items),
            serving_time: formData.refreshments.servingTime ? formData.refreshments.servingTime + ':00' : null,
            estimated_count: formData.refreshments.estimatedCount,
            special_requests: formData.refreshments.specialRequests || null,
            status: 'pending'
          })
        }

        toast.success('Booking created successfully!', {
          position: 'top-center',
          duration: 3000,
          icon: '✅'
        })

        // Refresh bookings list from database
        await fetchBookings()
    }

    setIsDialogOpen(false)
    resetForm()
    } catch (error: any) {
      console.error('❌ Failed to save booking:', error)
      toast.error(error.message || 'Failed to save booking', {
        position: 'top-center',
        duration: 4000,
        icon: '❌'
      })
    }
  }

  const handleEdit = (booking: Booking) => {
    // Check if booking is completed or cancelled
    if (booking.status === "completed") {
      toast.error("Cannot edit completed bookings", {
        position: 'top-center',
        duration: 3000,
        icon: '🚫'
      })
      return
    }
    
    if (booking.status === "cancelled") {
      toast.error("Cannot edit cancelled bookings", {
        position: 'top-center',
        duration: 3000,
        icon: '🚫'
      })
      return
    }

    setConfirmTitle("Edit Booking")
    setConfirmMessage(`Do you want to edit "${booking.title}"?`)
    setConfirmAction(() => () => {
      // Redirect to update page with booking ID
      window.location.href = `/admin/bookings/update?id=${booking.id}`
      setIsConfirmDialogOpen(false)
    })
    setIsConfirmDialogOpen(true)
  }

  const handleCancel = async (id: string) => {
    const booking = bookings.find(b => b.id === id)
    if (!booking) return
    
    // Open cancellation reason dialog
    setBookingToCancel(id)
    setCancellationReason("")
    setIsCancellationDialog(true)
  }

  const handleShowCancellationReason = async (booking: Booking) => {
    console.log(`🔍 handleShowCancellationReason called for booking ${booking.id}:`, {
      hasCancellation: !!booking.cancellation,
      cancellation: booking.cancellation,
      status: booking.status
    })
    
    // If cancellation data is already loaded, use it
    if (booking.cancellation) {
      const cancellationWithReason = {
        ...booking.cancellation,
        cancellation_reason: booking.cancellation.cancellation_reason || 
                           booking.cancellation['cancellation_reason'] ||
                           ''
      }
      
      console.log(`✅ Using existing cancellation data:`, cancellationWithReason)
      setSelectedCancellation(cancellationWithReason)
      setIsCancellationReasonDialogOpen(true)
      return
    }
    
    // If cancellation data is not loaded, try to fetch it
    console.log(`⚠️ Cancellation data not found in booking, fetching from database...`)
    try {
      const cancellationResponse = await placeManagementAPI.getTableData('booking_cancellations', {
        filters: [
          { field: 'booking_id', operator: '=', value: booking.id }
        ],
        limit: 1,
        sortBy: 'cancelled_at',
        sortOrder: 'desc'
      })
      
      console.log(`📥 Cancellation API response:`, cancellationResponse)
      
      // Handle different response formats
      let cancellations: any[] = []
      if (Array.isArray(cancellationResponse)) {
        cancellations = cancellationResponse
      } else if (cancellationResponse && cancellationResponse.data && Array.isArray(cancellationResponse.data)) {
        cancellations = cancellationResponse.data
      } else if (cancellationResponse && cancellationResponse.success && Array.isArray(cancellationResponse.data)) {
        cancellations = cancellationResponse.data
      }
      
      if (cancellations.length > 0) {
        const cancellation = cancellations[0]
        const reason = cancellation.cancellation_reason || 
                     cancellation['cancellation_reason'] ||
                     cancellation.cancellationReason ||
                     cancellation.reason ||
                     ''
        
        const cancellationData: BookingCancellation = {
          id: cancellation.id,
          booking_id: cancellation.booking_id || cancellation.bookingId || booking.id,
          cancelled_by: cancellation.cancelled_by || cancellation.cancelledBy,
          cancellation_reason: String(reason).trim(),
          cancellation_type: cancellation.cancellation_type || cancellation.cancellationType || 'user_cancelled',
          cancelled_at: cancellation.cancelled_at || cancellation.cancelledAt
        }
        
        console.log(`✅ Fetched cancellation data:`, cancellationData)
        setSelectedCancellation(cancellationData)
        setIsCancellationReasonDialogOpen(true)
      } else {
        console.log(`❌ No cancellation data found in database for booking ${booking.id}`)
        toast.error('Cancellation reason not found in database', {
          position: 'top-center',
          duration: 3000,
          icon: '⚠️'
        })
      }
    } catch (error) {
      console.error('❌ Error fetching cancellation data:', error)
      toast.error('Failed to load cancellation data', {
        position: 'top-center',
        duration: 3000,
        icon: '⚠️'
      })
    }
  }

  const handleConfirmCancellation = async () => {
    if (!bookingToCancel) return
    
    if (!cancellationReason.trim()) {
      toast.error('Please provide a reason for cancellation', {
        position: 'top-center',
        duration: 3000,
        icon: '⚠️'
      })
      return
    }

    const booking = bookings.find(b => b.id === bookingToCancel)
    if (!booking) return

    try {
      // Get current user ID from localStorage
      const userData = localStorage.getItem('userData')
      const currentUser = userData ? JSON.parse(userData) : null
      const cancelledBy = currentUser?.id || 'system'

      // Update booking status
      await placeManagementAPI.updateRecord('bookings', 
        { id: bookingToCancel }, 
        { 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        }
      )

      // Save cancellation reason to booking_cancellations table
      const cancellationData = {
        id: crypto.randomUUID(),
        booking_id: bookingToCancel,
        cancelled_by: cancelledBy,
        cancellation_reason: cancellationReason.trim(),
        cancellation_type: 'admin_cancelled',
        cancelled_at: new Date().toISOString()
      }

      await placeManagementAPI.insertRecord('booking_cancellations', cancellationData)
      
      setBookings(bookings.map((b) => (b.id === bookingToCancel ? { ...b, status: "cancelled" } : b)))
      
      toast.success('Booking cancelled successfully', {
        position: 'top-center',
        duration: 3000,
        icon: '✅'
      })
      
      setIsCancellationDialog(false)
      setCancellationReason("")
      setBookingToCancel(null)
    } catch (error: any) {
      console.error('Failed to cancel booking:', error)
      toast.error(error.message || 'Failed to cancel booking', {
        position: 'top-center',
        duration: 4000,
        icon: '❌'
      })
    }
  }

  const addExternalParticipant = () => {
    if (!newExternalParticipant.fullName || !newExternalParticipant.phone || !newExternalParticipant.referenceValue) {
      alert("Please fill in all required fields for the external participant.")
      return
    }

    const participant: ExternalParticipant = {
      id: Math.random().toString(36).substr(2, 9),
      ...newExternalParticipant,
    }

    setFormData({
      ...formData,
      externalParticipants: [...formData.externalParticipants, participant],
    })

    setNewExternalParticipant({
      fullName: "",
      email: "",
      phone: "",
      referenceType: "NIC",
      referenceValue: "",
    })
  }

  const removeExternalParticipant = (id: string) => {
    setFormData({
      ...formData,
      externalParticipants: formData.externalParticipants.filter((p) => p.id !== id),
    })
  }

  const addRefreshmentItem = (item: string) => {
    if (item && !formData.refreshments.items.includes(item)) {
      setFormData({
        ...formData,
        refreshments: {
          ...formData.refreshments,
          items: [...formData.refreshments.items, item],
        },
      })
    }
  }

  const removeRefreshmentItem = (item: string) => {
    setFormData({
      ...formData,
      refreshments: {
        ...formData.refreshments,
        items: formData.refreshments.items.filter((i) => i !== item),
      },
    })
  }

  const getStatusBadgeVariant = (status: string): any => {
    switch (status) {
      case "pending":
        return "secondary" // Gray
      case "upcoming":
        return { className: "bg-orange-500 text-white hover:bg-orange-600" } // Orange
      case "ongoing":
      case "in_progress":
        return { className: "bg-green-500 text-white hover:bg-green-600" } // Green
      case "completed":
        return { className: "bg-blue-500 text-white hover:bg-blue-600" } // Blue
      case "cancelled":
        return "destructive" // Red
      default:
        return "outline"
    }
  }

  const getStatusBadgeProps = (status: string) => {
    const variant = getStatusBadgeVariant(status)
    if (typeof variant === 'object') {
      return variant
    }
    return { variant }
  }

  // Format time to HH:MM (removes seconds and handles timestamps)
  const formatTime = (time: string) => {
    if (!time) return ''
    
    // If it's already in HH:MM format, return as is
    if (time.length === 5 && time.includes(':')) {
      return time
    }
    
    // If it's in HH:MM:SS format, remove seconds
    if (time.includes(':')) {
      return time.substring(0, 5)
    }
    
    // If it's a full timestamp, extract time
    try {
      const date = new Date(time)
      if (!isNaN(date.getTime())) {
        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        return `${hours}:${minutes}`
      }
    } catch (e) {
      console.error('Error parsing time:', time, e)
    }
    
    return time
  }

  // Format date to readable format (YYYY-MM-DD to readable)
  const formatDate = (date: string) => {
    if (!date) return ''
    
    try {
      const d = new Date(date)
      if (!isNaN(d.getTime())) {
        // Format as: Jan 15, 2024 or use toLocaleDateString
        return d.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        })
      }
    } catch (e) {
      console.error('Error parsing date:', date, e)
    }
    
    return date
  }

  // Apply filters
  useEffect(() => {
    let filtered = [...bookings]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(b =>
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.place.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(b => b.status === filterStatus)
    }

    // Place filter
    if (filterPlace !== "all") {
      filtered = filtered.filter(b => b.placeId === filterPlace || b.place === filterPlace)
    }

    // Date range filter
    if (filterDateFrom) {
      filtered = filtered.filter(b => b.date >= filterDateFrom)
    }
    if (filterDateTo) {
      filtered = filtered.filter(b => b.date <= filterDateTo)
    }

    setFilteredBookings(filtered)
  }, [bookings, searchTerm, filterStatus, filterPlace, filterDateFrom, filterDateTo])

  // Get today's bookings sorted by start time
  const todaysBookings = bookings
    .filter((booking) => {
    const today = new Date().toISOString().split("T")[0]
    return booking.date === today && booking.status !== "cancelled"
  })
    .sort((a, b) => {
      // Sort by start time
      const timeA = a.startTime.split(':').map(Number)
      const timeB = b.startTime.split(':').map(Number)
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1])
    })
  
  // Check if a booking is currently ongoing
  const isBookingOngoing = (booking: Booking) => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    if (booking.date !== today) return false
    
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    return currentTime >= booking.startTime && currentTime < booking.endTime
  }

  // Email notification helper functions
  const handleSendEmailClick = async (booking: Booking) => {
    console.log('🔍 handleSendEmailClick called with booking:', booking)
    setSelectedBookingForEmail(booking)
    setSelectedEmailParticipants([])
    setEmailType('booking_details')
    setCustomMessage('')
    setIsEmailDialogOpen(true)
    
    // First, create participants from booking data (immediate)
    const participantsFromBooking = createParticipantsFromBooking(booking)
    if (participantsFromBooking.length > 0) {
      console.log('🔍 Setting participants from booking data:', participantsFromBooking.length)
      setBookingParticipants(participantsFromBooking)
    }
    
    // Also try to load from API (for more accurate data)
    console.log('🔍 About to call loadBookingParticipants')
    await loadBookingParticipants(booking.id)
    console.log('🔍 loadBookingParticipants completed')
  }

  const loadBookingParticipants = async (bookingId: string) => {
    try {
      setIsLoadingParticipants(true)
      console.log('🔍 Loading participants for booking ID:', bookingId)
      console.log('🔍 Using OLD METHOD - fetch from database like original booking system')
      
      // Use the NEW Booking Email API to get participants
      console.log('🔍 Fetching participants using NEW API...')
      
      // Get token from localStorage (check both possible keys) - same as OTP email sending
      const token = localStorage.getItem('authToken') || 
                    localStorage.getItem('jwt_token') || 
                    localStorage.getItem('token') || 
                    ''
      
      if (!token) {
        console.error('❌ No authentication token found in localStorage')
        toast.error('Authentication required. Please log in again.', {
          position: 'top-center',
          duration: 3000
        })
        setBookingParticipants([])
        return
      }
      
      // Get required headers from environment (same as OTP email sending)
      const appId = process.env.NEXT_PUBLIC_APP_ID || 'default_app_id'
      const serviceKey = process.env.NEXT_PUBLIC_SERVICE_KEY || 'default_service_key'
      
      console.log('🔍 Using token for API request:', token.substring(0, 20) + '...')
      console.log('🔍 App-Id:', appId)
      console.log('🔍 Service-Key:', serviceKey ? '✅ Set' : '❌ Missing')
      
      // Use same headers as OTP email sending
      const response = await fetch(`/api/booking-email/${bookingId}/participants`, {
        headers: {
          'Content-Type': 'application/json',
          'X-App-Id': appId,
          'X-Service-Key': serviceKey,
          'Authorization': `Bearer ${token}`
        }
      })
      
      // Check if response is unauthorized
      if (response.status === 401) {
        console.error('❌ Unauthorized: Token may be expired or invalid')
        toast.error('Authentication failed. Please log in again.', {
          position: 'top-center',
          duration: 3000
        })
        setBookingParticipants([])
        return
      }
      
      // Check if response is not OK
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ API Error:', response.status, errorData)
        toast.error(errorData.message || 'Failed to load participants from API', {
          position: 'top-center',
          duration: 3000
        })
        // Keep participants from booking data if API fails
        return
      }
      
      const result = await response.json()
      console.log('🔍 NEW API Response:', result)
      
      if (result.success && result.data && result.data.participants && result.data.participants.length > 0) {
        const participants: BookingParticipant[] = result.data.participants.map((p: any) => ({
          id: p.id || `api-${p.full_name}-${Date.now()}`,
          full_name: p.full_name || 'Unknown',
          email: p.email || '',
          phone: p.phone || '',
          company_name: p.company_name || '',
          member_type: p.member_type || 'employee',
          has_email: p.email ? 1 : 0
        }))
        
        console.log('🔍 Participants from NEW API:', participants.length, participants)
        
        // Debug each participant's email data
        participants.forEach((participant, index) => {
          console.log(`🔍 Participant ${index + 1} from NEW API:`, {
            id: participant.id,
            full_name: participant.full_name,
            email: participant.email,
            has_email: participant.has_email,
            member_type: participant.member_type
          })
        })
        
        setBookingParticipants(participants)
        console.log('🔍 Set bookingParticipants state with NEW API data')
      } else {
        console.error('❌ Failed to get participants from NEW API or no participants returned:', result.message)
        // Don't clear participants if we already have them from booking data
        if (bookingParticipants.length === 0) {
          console.log('🔍 No participants from API and no existing participants, keeping empty')
        } else {
          console.log('🔍 Keeping existing participants from booking data:', bookingParticipants.length)
        }
      }
      
    } catch (error: any) {
      console.error('🔍 Error loading participants from API:', error)
      // Don't clear participants - keep the ones we loaded from booking data
      console.log('🔍 Keeping participants from booking data')
      // Only show error if we don't have any participants
      const currentParticipants = bookingParticipants.length
      if (currentParticipants === 0) {
        toast.error('Failed to load participants. Please try again.', {
          position: 'top-center',
          duration: 3000
        })
      } else {
        console.log(`🔍 Using ${currentParticipants} participants from booking data`)
      }
    } finally {
      setIsLoadingParticipants(false)
    }
  }

  // Create participants from booking data (original working version)
  const createParticipantsFromBooking = (booking: Booking): BookingParticipant[] => {
    const participants: BookingParticipant[] = []
    
    console.log('🔍 Creating participants from booking:', {
      id: booking.id,
      title: booking.title,
      responsiblePerson: booking.responsiblePerson,
      selectedEmployees: booking.selectedEmployees?.length || 0,
      externalParticipants: booking.externalParticipants?.length || 0
    })
    
    // Add responsible person
    if (booking.responsiblePerson) {
      console.log('🔍 Adding responsible person:', booking.responsiblePerson)
      
      // Handle both string and object formats for responsiblePerson
      let responsiblePersonName = ''
      let responsiblePersonEmail = ''
      
      if (typeof booking.responsiblePerson === 'string') {
        responsiblePersonName = booking.responsiblePerson
        responsiblePersonEmail = ''
      } else if (typeof booking.responsiblePerson === 'object' && booking.responsiblePerson !== null) {
        // Extract name from object
        responsiblePersonName = booking.responsiblePerson.name || 'Responsible Person'
        // Extract email from object
        responsiblePersonEmail = booking.responsiblePerson.email || ''
        
        console.log('🔍 Responsible person object details:', {
          name: booking.responsiblePerson.name,
          email: booking.responsiblePerson.email,
          extractedName: responsiblePersonName,
          extractedEmail: responsiblePersonEmail
        })
      }
      
      participants.push({
        id: `responsible-${booking.id}`,
        full_name: responsiblePersonName || 'Responsible Person',
        email: responsiblePersonEmail || '',
        phone: '',
        company_name: '',
        member_type: 'employee', // Use 'employee' type for responsible person
        has_email: responsiblePersonEmail ? 1 : 0
      })
      console.log('✅ Added responsible person to participants:', {
        name: responsiblePersonName,
        email: responsiblePersonEmail,
        has_email: responsiblePersonEmail ? 1 : 0
      })
    } else {
      console.log('🔍 No responsible person found')
    }
    
    // Add internal participants (employees)
    // Format: internal-{bookingId}-{userId} or internal-{bookingId}-{email}
    if (booking.selectedEmployees && Array.isArray(booking.selectedEmployees)) {
      console.log('🔍 Adding internal participants:', booking.selectedEmployees.length)
      booking.selectedEmployees.forEach((employee, index) => {
        console.log('🔍 Internal employee:', employee)
        console.log('🔍 Employee email check:', {
          email: employee.email,
          hasEmail: !!employee.email,
          emailType: typeof employee.email,
          employeeId: employee.id
        })
        const employeeName = String(employee.name || 'Unknown Employee')
        const employeeEmail = String(employee.email || '')
        const employeeId = employee.id || ''
        
        // Format ID: Use email if available, otherwise use user ID
        // Format: internal-{bookingId}-{email} or internal-{bookingId}-{userId}
        const participantId = employeeEmail 
          ? `internal-${booking.id}-${employeeEmail}`
          : `internal-${booking.id}-${employeeId}`
        
        participants.push({
          id: participantId,
          full_name: employeeName,
          email: employeeEmail,
          phone: String(employee.phone || ''),
          company_name: '',
          member_type: 'employee',
          has_email: employeeEmail ? 1 : 0,
          user_id: employeeId // Store user ID for reference
        })
        console.log(`✅ Added internal participant ${index + 1}:`, {
          id: participantId,
          name: employeeName,
          email: employeeEmail,
          user_id: employeeId,
          has_email: employeeEmail ? 1 : 0
        })
      })
    } else {
      console.log('🔍 No internal participants found')
    }
    
    // Add external participants
    // Format: external-{participantId} (UUID from external_participants table)
    if (booking.externalParticipants && Array.isArray(booking.externalParticipants)) {
      console.log('🔍 Adding external participants:', booking.externalParticipants.length)
      booking.externalParticipants.forEach((participant, index) => {
        console.log('🔍 External participant:', participant)
        console.log('🔍 External participant email check:', {
          email: participant.email,
          hasEmail: !!participant.email,
          emailType: typeof participant.email,
          participantId: participant.id
        })
        const participantName = String(participant.fullName || 'Unknown Participant')
        const participantEmail = String(participant.email || '')
        // Use participant.id (UUID) if available, otherwise generate a placeholder
        // Format: external-{uuid}
        const participantId = participant.id 
          ? `external-${participant.id}`
          : `external-${booking.id}-${index}` // Fallback if no UUID
        
        participants.push({
          id: participantId,
          full_name: participantName,
          email: participantEmail,
          phone: String(participant.phone || ''),
          company_name: String(participant.companyName || ''),
          member_type: 'visitor',
          has_email: participantEmail ? 1 : 0
        })
        console.log(`✅ Added external participant ${index + 1}:`, {
          id: participantId,
          name: participantName,
          email: participantEmail,
          has_email: participantEmail ? 1 : 0
        })
      })
    } else {
      console.log('🔍 No external participants found')
    }
    
    console.log('🔍 Final participants created:', participants.length, participants)
    
    // Debug each participant's email data
    participants.forEach((participant, index) => {
      console.log(`🔍 Participant ${index + 1}:`, {
        id: participant.id,
        full_name: participant.full_name,
        email: participant.email,
        has_email: participant.has_email,
        member_type: participant.member_type
      })
    })
    
    return participants
  }

  const handleParticipantEmailSelection = (participantId: string, checked: boolean) => {
    console.log('📧 Participant selection changed:', { participantId, checked })
    if (checked) {
      setSelectedEmailParticipants(prev => {
        const updated = [...prev, participantId]
        console.log('📧 Added participant. Selected count:', updated.length, 'IDs:', updated)
        return updated
      })
    } else {
      setSelectedEmailParticipants(prev => {
        const updated = prev.filter(id => id !== participantId)
        console.log('📧 Removed participant. Selected count:', updated.length, 'IDs:', updated)
        return updated
      })
    }
  }

  const handleSelectAllParticipants = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allParticipantIds = bookingParticipants
        .filter(p => p.has_email === 1)
        .map(p => p.id)
      console.log('📧 Select All clicked - selecting:', allParticipantIds.length, 'participants')
      console.log('📧 Participant IDs:', allParticipantIds)
      setSelectedEmailParticipants(allParticipantIds)
    } else {
      console.log('📧 Select All unchecked - clearing selection')
      setSelectedEmailParticipants([])
    }
  }

  const sendReminderEmails = async (reminderType: '24_hours' | '1_hour') => {
    console.log('📧 ==========================================')
    console.log('📧 REMINDER EMAIL SENDING FUNCTION CALLED')
    console.log('📧 ==========================================')
    
    if (!selectedBookingForEmail) {
      console.error('❌ REMINDER EMAIL ERROR: No booking selected')
      toast.error('Please select a booking')
      return
    }

    try {
      setIsSendingEmails(true)
      
      // Get token from localStorage (check all possible keys)
      const token = localStorage.getItem('authToken') || 
                    localStorage.getItem('jwt_token') || 
                    localStorage.getItem('token') || 
                    ''
      
      // Get required headers from environment
      const appId = process.env.NEXT_PUBLIC_APP_ID || 'default_app_id'
      const serviceKey = process.env.NEXT_PUBLIC_SERVICE_KEY || 'default_service_key'
      
      console.log('📧 ==========================================')
      console.log('📧 REMINDER EMAIL - INITIAL DATA')
      console.log('📧 ==========================================')
      console.log('📧 Reminder Type:', reminderType)
      console.log('📧 Booking ID:', selectedBookingForEmail.id)
      console.log('📧 Booking Title:', selectedBookingForEmail.title)
      console.log('📧 Custom Message:', customMessage || '(none)')
      console.log('📧 Token Available:', !!token)
      console.log('📧 Token Preview:', token ? token.substring(0, 20) + '...' : 'NO TOKEN')
      console.log('📧 App-Id:', appId)
      console.log('📧 Service-Key:', serviceKey ? '✅ Set' : '❌ Missing')
      console.log('📧 Total Participants:', bookingParticipants.length)
      console.log('📧 Participants with Email:', bookingParticipants.filter(p => p.has_email === 1).length)

      console.log('📧 ==========================================')
      console.log('📧 SENDING REMINDER API REQUEST')
      console.log('📧 ==========================================')
      console.log('📧 API Endpoint:', `/api/booking-email/${selectedBookingForEmail.id}/send-reminder`)
      console.log('📧 Request Method: POST')
      console.log('📧 Request Headers:', {
        'Content-Type': 'application/json',
        'X-App-Id': appId,
        'X-Service-Key': serviceKey ? '✅ Set' : '❌ Missing',
        'Authorization': token ? 'Bearer ' + token.substring(0, 20) + '...' : '❌ Missing'
      })
      console.log('📧 Request Body:', {
        reminderType: reminderType,
        customMessage: customMessage || '(none)'
      })
      
      const requestStartTime = Date.now()

      const response = await fetch(`/api/booking-email/${selectedBookingForEmail.id}/send-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Id': appId,
          'X-Service-Key': serviceKey,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reminderType: reminderType,
          customMessage: customMessage
        })
      })

      const requestDuration = Date.now() - requestStartTime
      console.log('📧 ==========================================')
      console.log('📧 REMINDER API RESPONSE RECEIVED')
      console.log('📧 ==========================================')
      console.log('📧 Response Status:', response.status)
      console.log('📧 Response OK:', response.ok)
      console.log('📧 Request Duration:', requestDuration + 'ms')

      // Check for errors before parsing JSON
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ ==========================================')
        console.error('❌ REMINDER API ERROR RESPONSE')
        console.error('❌ ==========================================')
        console.error('❌ Status:', response.status)
        console.error('❌ Status Text:', response.statusText)
        console.error('❌ Error Response Body:', errorText)
        
        try {
          const errorResult = JSON.parse(errorText)
          console.error('❌ Parsed Error:', errorResult)
          toast.error(errorResult.message || `Failed to send reminder emails (Status: ${response.status})`)
        } catch (parseError) {
          console.error('❌ Could not parse error response as JSON')
          toast.error(`Failed to send reminder emails (Status: ${response.status})`)
        }
        return
      }

      const result = await response.json()
      console.log('📧 ==========================================')
      console.log('📧 REMINDER API RESPONSE DATA')
      console.log('📧 ==========================================')
      console.log('📧 Full Response:', JSON.stringify(result, null, 2))
      console.log('📧 Success:', result.success)
      console.log('📧 Message:', result.message)
      console.log('📧 Data:', result.data)

      if (result.success) {
        const { emailsSent, emailsFailed, results } = result.data || {}
        console.log('📧 ==========================================')
        console.log('📧 REMINDER EMAIL SENDING RESULTS')
        console.log('📧 ==========================================')
        console.log('📧 Emails Sent:', emailsSent)
        console.log('📧 Emails Failed:', emailsFailed)
        
        if (results && Array.isArray(results)) {
          console.log('📧 Individual Reminder Email Results:')
          results.forEach((emailResult: any, index: number) => {
            if (emailResult.success) {
              console.log(`📧   ✅ ${index + 1}. ${emailResult.participantEmail} - ${emailResult.message}`)
            } else {
              console.error(`📧   ❌ ${index + 1}. ${emailResult.participantEmail} - ${emailResult.message}`)
            }
          })
        }
        
        if (emailsFailed > 0) {
          toast.success(`Reminder emails sent to ${emailsSent} participants, ${emailsFailed} failed`)
        } else {
          toast.success(`Reminder emails sent to ${emailsSent} participants`)
        }
        
        // Close dialog
        setIsEmailDialogOpen(false)
        setSelectedBookingForEmail(null)
        setSelectedEmailParticipants([])
        setBookingParticipants([])
        setCustomMessage('')
      } else {
        console.error('❌ ==========================================')
        console.error('❌ REMINDER EMAIL SENDING FAILED')
        console.error('❌ ==========================================')
        console.error('❌ Error Message:', result.message)
        console.error('❌ Error Data:', result.error)
        toast.error(result.message || 'Failed to send reminder emails')
      }
      
      console.log('📧 ==========================================')
      console.log('📧 REMINDER EMAIL SENDING FUNCTION COMPLETED')
      console.log('📧 ==========================================')
      
    } catch (error: any) {
      console.error('❌ ==========================================')
      console.error('❌ REMINDER EMAIL SENDING EXCEPTION')
      console.error('❌ ==========================================')
      console.error('❌ Error Type:', error.constructor.name)
      console.error('❌ Error Message:', error.message)
      console.error('❌ Error Stack:', error.stack)
      console.error('❌ Full Error Object:', error)
      toast.error(`Failed to send reminder emails: ${error.message}`)
    } finally {
      setIsSendingEmails(false)
      console.log('📧 Reminder email sending state reset (isSendingEmails = false)')
    }
  }

  // New simplified API: Send email with all details from frontend (no database queries)
  const sendBookingEmailFromFrontend = async (bookingData: {
    meetingName: string
    date: string
    startTime: string
    endTime: string
    place?: string
    description?: string
    participantEmails: string[]
    emailType?: string
    customMessage?: string
  }) => {
    try {
      console.log('📧 ==========================================')
      console.log('📧 SEND BOOKING EMAIL FROM FRONTEND (NEW API)')
      console.log('📧 ==========================================')
      console.log('📧 Booking Data:', bookingData)

      // Get token from localStorage
      const token = localStorage.getItem('authToken') || 
                    localStorage.getItem('jwt_token') || 
                    localStorage.getItem('token') || 
                    ''

      if (!token) {
        toast.error('Authentication required. Please log in again.', {
          position: 'top-center',
          duration: 3000
        })
        return
      }

      // Prepare full API request details
      const apiUrl = '/api/booking-email/send-from-frontend'
      const requestMethod = 'POST'
      const requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
      const requestBody = JSON.stringify(bookingData)
      
      console.log('📧 ==========================================')
      console.log('📧 ==========================================')
      console.log('📧 FULL API REQUEST - FRONTEND')
      console.log('📧 ==========================================')
      console.log('📧 ==========================================')
      console.log('')
      console.log('📧 REQUEST URL:')
      console.log('📧   ', apiUrl)
      console.log('')
      console.log('📧 REQUEST METHOD:')
      console.log('📧   ', requestMethod)
      console.log('')
      console.log('📧 REQUEST HEADERS:')
      console.log('📧   ', JSON.stringify(requestHeaders, null, 2))
      console.log('')
      console.log('📧 AUTHORIZATION HEADER:')
      console.log('📧   ', requestHeaders['Authorization'] ? `Bearer ${token.substring(0, 30)}...` : '❌ Missing')
      console.log('')
      console.log('📧 REQUEST BODY (JSON):')
      console.log('📧   ', requestBody)
      console.log('')
      console.log('📧 REQUEST BODY (Parsed/Object):')
      console.log('📧   ', JSON.stringify(bookingData, null, 2))
      console.log('')
      console.log('📧 REQUEST BODY FIELDS:')
      console.log('📧   meetingName:', bookingData.meetingName)
      console.log('📧   date:', bookingData.date)
      console.log('📧   startTime:', bookingData.startTime)
      console.log('📧   endTime:', bookingData.endTime)
      console.log('📧   place:', bookingData.place || '(not provided)')
      console.log('📧   description:', bookingData.description || '(not provided)')
      console.log('📧   participantEmails:', bookingData.participantEmails)
      console.log('📧   participantEmails (count):', bookingData.participantEmails ? bookingData.participantEmails.length : 0)
      console.log('📧   emailType:', bookingData.emailType || 'booking_details (default)')
      console.log('📧   customMessage:', bookingData.customMessage || '(not provided)')
      console.log('')
      console.log('📧 REQUEST BODY FIELD TYPES:')
      console.log('📧   meetingName type:', typeof bookingData.meetingName)
      console.log('📧   date type:', typeof bookingData.date)
      console.log('📧   startTime type:', typeof bookingData.startTime)
      console.log('📧   endTime type:', typeof bookingData.endTime)
      console.log('📧   participantEmails type:', typeof bookingData.participantEmails)
      console.log('📧   participantEmails isArray:', Array.isArray(bookingData.participantEmails))
      console.log('')
      console.log('📧 COMPLETE FETCH REQUEST:')
      console.log('📧   fetch("' + apiUrl + '", {')
      console.log('📧     method: "' + requestMethod + '",')
      console.log('📧     headers: ' + JSON.stringify(requestHeaders, null, 6).replace(/\n/g, '\n📧     '))
      console.log('📧     body: ' + requestBody.substring(0, 200) + (requestBody.length > 200 ? '...' : ''))
      console.log('📧   })')
      console.log('')
      console.log('📧 ==========================================')
      console.log('📧 ==========================================')
      console.log('')

      const requestStartTime = Date.now()
      console.log('📧 Sending fetch request at:', new Date().toISOString())
      console.log('📧 Request timestamp:', requestStartTime)
      
      const response = await fetch(apiUrl, {
        method: requestMethod,
        headers: requestHeaders,
        body: requestBody
      })

      const requestDuration = Date.now() - requestStartTime
      console.log('📧 Request Duration:', requestDuration + 'ms')

      if (response.status === 401) {
        toast.error('Session expired. Please log in again.', {
          position: 'top-center',
          duration: 3000
        })
        return
      }

      const result = await response.json()

      console.log('📧 ==========================================')
      console.log('📧 FRONTEND - EMAIL SENDING RESPONSE')
      console.log('📧 ==========================================')
      console.log('📧 Response Status:', response.status)
      console.log('📧 Response OK:', response.ok)
      console.log('📧 Result Success:', result.success)
      console.log('📧 Result Message:', result.message)

      if (result.success) {
        console.log('📧 ==========================================')
        console.log('📧 EMAIL SENDING SUCCESS SUMMARY')
        console.log('📧 ==========================================')
        console.log('📧 Meeting Name:', result.data?.meetingName)
        console.log('📧 Total Participants:', result.data?.totalParticipants)
        console.log('📧 Emails Sent:', result.data?.emailsSent)
        console.log('📧 Emails Failed:', result.data?.emailsFailed)
        console.log('📧 ==========================================')
        console.log('📧 DETAILED RESULTS:')
        console.log('📧 ==========================================')
        if (result.data?.results && Array.isArray(result.data.results)) {
          result.data.results.forEach((emailResult: any, index: number) => {
            if (emailResult.success) {
              console.log(`✅ ${index + 1}. ${emailResult.participantEmail} - ${emailResult.message}`)
            } else {
              console.error(`❌ ${index + 1}. ${emailResult.participantEmail} - ${emailResult.message}`)
            }
          })
        }
        console.log('📧 ==========================================')

        toast.success(`✅ Emails sent to ${result.data.emailsSent} participants`, {
          position: 'top-center',
          duration: 3000
        })
        console.log('✅ Full email sending result:', JSON.stringify(result, null, 2))
        return result
      } else {
        console.error('❌ ==========================================')
        console.error('❌ EMAIL SENDING FAILED')
        console.error('❌ ==========================================')
        console.error('❌ Error Message:', result.message)
        console.error('❌ Error Details:', result.error)
        console.error('❌ Full Error Response:', JSON.stringify(result, null, 2))

        toast.error(result.message || 'Failed to send emails', {
          position: 'top-center',
          duration: 3000
        })
        return null
      }
    } catch (error: any) {
      console.error('❌ ==========================================')
      console.error('❌ FRONTEND - EMAIL SENDING EXCEPTION')
      console.error('❌ ==========================================')
      console.error('❌ Error Type:', error.constructor.name)
      console.error('❌ Error Message:', error.message)
      console.error('❌ Error Stack:', error.stack)
      console.error('❌ Full Error:', error)
      console.error('❌ ==========================================')

      toast.error('Failed to send emails. Please try again.', {
        position: 'top-center',
        duration: 3000
      })
      return null
    }
  }

  const sendEmailNotifications = async () => {
    console.log('📧 ==========================================')
    console.log('📧 EMAIL SENDING FUNCTION CALLED')
    console.log('📧 ==========================================')
    
    if (!selectedBookingForEmail || selectedEmailParticipants.length === 0) {
      console.error('❌ EMAIL SEND ERROR: No booking or participants selected')
      console.error('❌ selectedBookingForEmail:', selectedBookingForEmail)
      console.error('❌ selectedEmailParticipants.length:', selectedEmailParticipants.length)
      toast.error('Please select participants to send emails to')
      return
    }

    try {
      setIsSendingEmails(true)
      
      // Get token from localStorage (check all possible keys)
      const token = localStorage.getItem('authToken') || 
                    localStorage.getItem('jwt_token') || 
                    localStorage.getItem('token') || 
                    ''
      
      if (!token) {
        console.error('❌ No authentication token found')
        toast.error('Authentication required. Please log in again.', {
          position: 'top-center',
          duration: 3000
        })
        return
      }
      
      console.log('📧 ==========================================')
      console.log('📧 EMAIL SENDING - INITIAL DATA (NEW SIMPLIFIED API)')
      console.log('📧 ==========================================')
      console.log('📧 Booking Title:', selectedBookingForEmail.title)
      console.log('📧 Booking Date:', selectedBookingForEmail.date)
      console.log('📧 Selected Participants Count:', selectedEmailParticipants.length)
      console.log('📧 Email Type:', emailType)
      console.log('📧 Custom Message:', customMessage || '(none)')
      console.log('📧 Token Available:', !!token)
      
      if (!selectedEmailParticipants || selectedEmailParticipants.length === 0) {
        console.error('❌ NO PARTICIPANTS SELECTED')
        toast.error('Please select at least one participant to send emails to', {
          position: 'top-center',
          duration: 3000
        })
        return
      }
      
      // Get selected participants with valid emails (NEW APPROACH - extract emails directly)
      const selectedParticipantsWithEmails = bookingParticipants.filter(p => 
        selectedEmailParticipants.includes(p.id) && 
        p.email && 
        p.email.trim() !== '' &&
        p.has_email === 1
      )
      
      if (selectedParticipantsWithEmails.length === 0) {
        console.error('❌ NO PARTICIPANTS WITH VALID EMAILS FOUND!')
        toast.error('No participants with valid emails found. Please select participants with email addresses.', {
          position: 'top-center',
          duration: 3000
        })
        return
      }
      
      // Extract participant emails
      const participantEmails = selectedParticipantsWithEmails
        .map(p => p.email)
        .filter((email): email is string => !!email && email.trim() !== '')
      
      console.log('📧 ==========================================')
      console.log('📧 SELECTED PARTICIPANTS WITH VALID EMAILS')
      console.log('📧 ==========================================')
      selectedParticipantsWithEmails.forEach((p, index) => {
        console.log(`📧   ${index + 1}. ${p.full_name} (${p.email})`)
      })
      console.log('📧 Total emails to send:', participantEmails.length)
      
      // Format time - ensure it has seconds (HH:MM:SS)
      const formatTime = (time: string): string => {
        if (!time) return ''
        // If time is in HH:MM format, add :00 for seconds
        if (time.split(':').length === 2) {
          return time + ':00'
        }
        // If already in HH:MM:SS format, return as is
        return time
      }
      
      // Format date - ensure YYYY-MM-DD format
      const formatDate = (date: string): string => {
        if (!date) return ''
        // If date is already in YYYY-MM-DD format, return as is
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return date
        }
        // Try to parse and format if needed
        try {
          const dateObj = new Date(date)
          const year = dateObj.getFullYear()
          const month = String(dateObj.getMonth() + 1).padStart(2, '0')
          const day = String(dateObj.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        } catch (e) {
          return date
        }
      }
      
      // Prepare booking data for NEW SIMPLIFIED API (no booking ID needed!)
      const bookingData = {
        meetingName: selectedBookingForEmail.title || 'Meeting',
        date: formatDate(selectedBookingForEmail.date),
        startTime: formatTime(selectedBookingForEmail.startTime),
        endTime: formatTime(selectedBookingForEmail.endTime),
        place: selectedBookingForEmail.place || '',
        description: selectedBookingForEmail.description || '',
        participantEmails: participantEmails,
        emailType: emailType || 'booking_details',
        customMessage: customMessage || ''
      }
      
      console.log('📧 ==========================================')
      console.log('📧 PREPARED BOOKING DATA FOR NEW SIMPLIFIED API')
      console.log('📧 ==========================================')
      console.log('📧 meetingName:', bookingData.meetingName)
      console.log('📧 date:', bookingData.date)
      console.log('📧 startTime:', bookingData.startTime)
      console.log('📧 endTime:', bookingData.endTime)
      console.log('📧 place:', bookingData.place || '(not provided)')
      console.log('📧 description:', bookingData.description || '(not provided)')
      console.log('📧 participantEmails:', participantEmails)
      console.log('📧 participantEmails count:', participantEmails.length)
      console.log('📧 emailType:', bookingData.emailType)
      console.log('📧 customMessage:', bookingData.customMessage || '(not provided)')
      console.log('📧 ==========================================')
      console.log('📧 USING NEW SIMPLIFIED API - NO BOOKING ID NEEDED!')
      console.log('📧 ==========================================')
      
      // Use the new simplified API function (already exists in the file)
      // Note: The function gets the token internally, so we don't pass it
      const result = await sendBookingEmailFromFrontend(bookingData)
      
      if (result && result.success) {
        console.log('📧 ==========================================')
        console.log('📧 EMAIL SENDING SUCCESS')
        console.log('📧 ==========================================')
        console.log('📧 Emails Sent:', result.data?.emailsSent)
        console.log('📧 Emails Failed:', result.data?.emailsFailed)
        console.log('📧 Total Participants:', result.data?.totalParticipants)
        
        if (result.data?.emailsFailed && result.data.emailsFailed > 0) {
          toast.success(`✅ Emails sent to ${result.data.emailsSent} participants, ${result.data.emailsFailed} failed`, {
            position: 'top-center',
            duration: 3000
          })
        } else {
          toast.success(`✅ Emails sent successfully to ${result.data?.emailsSent || participantEmails.length} participants`, {
            position: 'top-center',
            duration: 3000
          })
        }
        
        // Close dialog
        setIsEmailDialogOpen(false)
        setSelectedBookingForEmail(null)
        setSelectedEmailParticipants([])
        setBookingParticipants([])
        setCustomMessage('')
      } else {
        console.error('❌ ==========================================')
        console.error('❌ EMAIL SENDING FAILED')
        console.error('❌ ==========================================')
        console.error('❌ Result:', result)
        toast.error(result?.message || 'Failed to send emails. Please try again.', {
          position: 'top-center',
          duration: 3000
        })
      }
      
      console.log('📧 ==========================================')
      console.log('📧 EMAIL SENDING FUNCTION COMPLETED')
      console.log('📧 ==========================================')
      
    } catch (error: any) {
      console.error('❌ ==========================================')
      console.error('❌ EMAIL SENDING EXCEPTION')
      console.error('❌ ==========================================')
      console.error('❌ Error Type:', error.constructor.name)
      console.error('❌ Error Message:', error.message)
      console.error('❌ Error Stack:', error.stack)
      console.error('❌ Full Error Object:', error)
      toast.error(`Failed to send email notifications: ${error.message}`)
    } finally {
      setIsSendingEmails(false)
      console.log('📧 Email sending state reset (isSendingEmails = false)')
    }
  }

  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  
  // Real-time clock for timeline view
  const [currentTime, setCurrentTime] = useState(new Date())
  
  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="space-y-4">
      {/* Compact Header with Filters and Actions in One Line */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, description, place, or responsible person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="ongoing">Ongoing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {/* Place Filter */}
        <Select value={placeFilter} onValueChange={setPlaceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Places" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Places</SelectItem>
            {Array.from(new Set(bookings.map(b => b.place))).map(place => (
              <SelectItem key={place} value={place}>{place}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* New Booking Button */}
        <Button 
          onClick={() => window.location.href = '/admin/bookings/new'} 
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
        >
              <Plus className="h-4 w-4" />
              New Booking
            </Button>
      </div>

      {/* Hidden dialog - kept for edit functionality */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBooking ? "Edit Booking" : "Create New Booking"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Booking Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="place">Place *</Label>
                  <Select 
                    value={formData.place} 
                    onValueChange={(value) => setFormData({ ...formData, place: value })}
                    disabled={!formData.date || isLoadingPlaces}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !formData.date 
                          ? "Select date first" 
                          : isLoadingPlaces 
                            ? "Loading places..." 
                            : availablePlaces.length === 0 
                              ? "No places available" 
                              : "Select place"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingPlaces ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Loading available places...</span>
                        </div>
                      ) : availablePlaces.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          <AlertTriangle className="h-4 w-4 mx-auto mb-2" />
                          <p className="text-sm">No places available for this date</p>
                        </div>
                      ) : (
                        availablePlaces.map((place) => (
                          <SelectItem key={place.id} value={place.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{place.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {place.operatingHours} • Capacity: {place.capacity}
                              </span>
                            </div>
                        </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {formData.date && !isLoadingPlaces && availablePlaces.length > 0 && (
                    <p className="text-xs text-green-600">
                      ✅ {availablePlaces.length} place(s) available for {getDayOfWeek(formData.date)}
                    </p>
                  )}
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="timeSlot">Available Time Slots *</Label>
                  <Select
                    value={selectedTimeGap}
                    onValueChange={(value) => {
                      setSelectedTimeGap(value)
                      // Extract start and end time from selected gap
                      const gap = availableTimeGaps.find(g => `${g.start} - ${g.end}` === value)
                      if (gap) {
                        setFormData({
                          ...formData,
                          startTime: gap.start,
                          endTime: gap.end
                        })
                      }
                    }}
                    disabled={!formData.date || !formData.place}
                  >
                    <SelectTrigger className="h-auto py-3">
                      <SelectValue placeholder={
                        !formData.date ? "Select date first" :
                        !formData.place ? "Select place first" :
                        availableTimeGaps.length === 0 ? "No available time slots" :
                        "Select an available time slot"
                      } />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px] w-full min-w-[500px]">
                      {availableTimeGaps.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          {!formData.date || !formData.place ? 
                            "Select date and place first" :
                            "No available time slots for this date and place"
                          }
                </div>
                      ) : (
                        availableTimeGaps.map((gap) => (
                          <SelectItem 
                            key={`${gap.start}-${gap.end}`} 
                            value={`${gap.start} - ${gap.end}`}
                            className="py-3 cursor-pointer"
                          >
                            <div className="flex items-center justify-between w-full gap-8">
                              <span className="font-semibold text-base">{gap.start} - {gap.end}</span>
                              <span className="text-sm text-green-600 font-medium">Duration: {gap.duration}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {availableTimeGaps.length > 0 && (
                    <p className="text-xs text-green-600">
                      ✅ {availableTimeGaps.length} time slot(s) available (min. {minBookingDuration >= 60 ? `${minBookingDuration / 60}h` : `${minBookingDuration}min`})
                    </p>
                  )}
                  {selectedTimeGap && (
                    <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-sm font-semibold text-green-900">Selected Time Slot</p>
                      </div>
                      <p className="text-lg font-bold text-green-800 mb-1">
                        {selectedTimeGap}
                      </p>
                      <p className="text-xs text-green-700">
                        Start: {formData.startTime} | End: {formData.endTime}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Employee Participants</Label>

                {/* Selected Employees Display */}
                {formData.selectedEmployees.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Selected Employees ({formData.selectedEmployees.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.selectedEmployees.map((employee) => (
                        <Badge key={employee.id} variant="secondary" className="flex items-center gap-2 px-3 py-1">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{employee.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {employee.department} • {employee.role}
                            </span>
                          </div>
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-destructive"
                            onClick={() => removeEmployee(employee.id)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Smart Search Input */}
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search employees by name, department, or role..."
                      value={employeeSearch}
                      onChange={(e) => handleEmployeeSearch(e.target.value)}
                      onFocus={() => {
                        if (filteredEmployees.length > 0) {
                          setShowEmployeeDropdown(true)
                        }
                      }}
                      className="pl-10 pr-10"
                    />
                    {employeeSearch && (
                      <X
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground"
                        onClick={() => {
                          setEmployeeSearch("")
                          setShowEmployeeDropdown(false)
                          setFilteredEmployees([])
                        }}
                      />
                    )}
                  </div>

                  {/* Dropdown Results */}
                  {showEmployeeDropdown && filteredEmployees.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredEmployees.map((employee) => {
                        const isSelected = formData.selectedEmployees.find((emp) => emp.id === employee.id)
                        return (
                          <div
                            key={employee.id}
                            className={`p-3 cursor-pointer hover:bg-muted transition-colors ${
                              isSelected ? "bg-muted opacity-50" : ""
                            }`}
                            onClick={() => !isSelected && selectEmployee(employee)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{employee.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {employee.department} • {employee.role}
                                </p>
                                <p className="text-xs text-muted-foreground">{employee.email}</p>
                              </div>
                              {isSelected && (
                                <Badge variant="outline" className="text-xs">
                                  Selected
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {employeeSearch && filteredEmployees.length === 0 && (
                  <p className="text-sm text-muted-foreground">No employees found matching "{employeeSearch}"</p>
                )}
              </div>

              <div className="space-y-4">
                <Label>Responsible Person *</Label>
                <div className="relative">
                  <Input
                    placeholder="Search for responsible person..."
                    value={responsibleSearch}
                    onChange={(e) => {
                      setResponsibleSearch(e.target.value)
                      setShowResponsibleDropdown(true)
                    }}
                    onFocus={() => setShowResponsibleDropdown(true)}
                    className="pr-10"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                  {showResponsibleDropdown && responsibleSearch && (
                    <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                      {isLoadingUsers ? (
                        <div className="p-4 text-center">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                          <p className="text-sm">Loading users...</p>
                        </div>
                      ) : users.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          <p className="text-sm">No users found</p>
                        </div>
                      ) : (
                        users
                        .filter(
                            (user) =>
                              user.full_name.toLowerCase().includes(responsibleSearch.toLowerCase()) ||
                              user.email.toLowerCase().includes(responsibleSearch.toLowerCase()) ||
                              user.role.toLowerCase().includes(responsibleSearch.toLowerCase()),
                        )
                        .slice(0, 10)
                          .map((user) => (
                          <div
                              key={user.id}
                            className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                              onClick={() => {
                                // Convert UserProfile to Employee format
                                const employeeData: Employee = {
                                  id: user.id,
                                  name: user.full_name,
                                  email: user.email,
                                  department: user.role === 'admin' ? 'Administration' : 'General',
                                  role: user.role,
                                  phone: ''
                                }
                                handleResponsiblePersonSelect(employeeData)
                              }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                  <p className="font-medium">{user.full_name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {user.email} • {user.role}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                  {user.role}
                              </Badge>
                            </div>
                          </div>
                          ))
                      )}
                      {!isLoadingUsers && users.filter(
                        (user) =>
                          user.full_name.toLowerCase().includes(responsibleSearch.toLowerCase()) ||
                          user.email.toLowerCase().includes(responsibleSearch.toLowerCase()) ||
                          user.role.toLowerCase().includes(responsibleSearch.toLowerCase()),
                      ).length === 0 && <div className="p-3 text-center text-muted-foreground">No users found</div>}
                    </div>
                  )}
                </div>

                {formData.responsiblePerson && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {formData.responsiblePerson.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{formData.responsiblePerson.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formData.responsiblePerson.department} • {formData.responsiblePerson.role}
                        </p>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={handleResponsiblePersonRemove}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Label>External Participants</Label>

                {formData.externalParticipants.length > 0 && (
                  <div className="space-y-2">
                    {formData.externalParticipants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{participant.fullName}</p>
                          <p className="text-sm text-muted-foreground">
                            {participant.email} • {participant.phone} • {participant.referenceType}:{" "}
                            {participant.referenceValue}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeExternalParticipant(participant.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Add External Participant</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="extFullName">Full Name *</Label>
                        <Input
                          id="extFullName"
                          value={newExternalParticipant.fullName}
                          onChange={(e) =>
                            setNewExternalParticipant({ ...newExternalParticipant, fullName: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="extEmail">Email</Label>
                        <Input
                          id="extEmail"
                          type="email"
                          value={newExternalParticipant.email}
                          onChange={(e) =>
                            setNewExternalParticipant({ ...newExternalParticipant, email: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="extPhone">Phone *</Label>
                        <Input
                          id="extPhone"
                          type="tel"
                          value={newExternalParticipant.phone}
                          onChange={(e) =>
                            setNewExternalParticipant({ ...newExternalParticipant, phone: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="extRefType">Reference Type *</Label>
                        <Select
                          value={newExternalParticipant.referenceType}
                          onValueChange={(value: any) =>
                            setNewExternalParticipant({ ...newExternalParticipant, referenceType: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NIC">NIC</SelectItem>
                            <SelectItem value="Passport">Passport</SelectItem>
                            <SelectItem value="Employee ID">Employee ID</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="extRefValue">Reference Value *</Label>
                        <Input
                          id="extRefValue"
                          value={newExternalParticipant.referenceValue}
                          onChange={(e) =>
                            setNewExternalParticipant({ ...newExternalParticipant, referenceValue: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addExternalParticipant}
                      className="w-full bg-transparent"
                    >
                      Add Participant
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="refreshmentsRequired"
                    checked={formData.refreshments.required}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        refreshments: {
                          ...formData.refreshments,
                          required: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-input"
                  />
                  <Label htmlFor="refreshmentsRequired" className="text-base font-medium">
                    Refreshments Required
                  </Label>
                </div>

                {formData.refreshments.required && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Refreshment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="refreshmentType">Refreshment Type</Label>
                          <Select
                            value={formData.refreshments.type}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                refreshments: {
                                  ...formData.refreshments,
                                  type: value,
                                },
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Light Refreshments">Light Refreshments</SelectItem>
                              <SelectItem value="Full Catering">Full Catering</SelectItem>
                              <SelectItem value="Beverages Only">Beverages Only</SelectItem>
                              <SelectItem value="Custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="servingTime">Serving Time</Label>
                          <Input
                            id="servingTime"
                            type="time"
                            value={formData.refreshments.servingTime}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                refreshments: {
                                  ...formData.refreshments,
                                  servingTime: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Refreshment Items</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {formData.refreshments.items.map((item) => (
                            <Badge key={item} variant="secondary" className="flex items-center gap-1">
                              {item}
                              <X className="h-3 w-3 cursor-pointer" onClick={() => removeRefreshmentItem(item)} />
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Select onValueChange={(value) => addRefreshmentItem(value)}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Add refreshment item" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Coffee">Coffee</SelectItem>
                              <SelectItem value="Tea">Tea</SelectItem>
                              <SelectItem value="Water">Water</SelectItem>
                              <SelectItem value="Juice">Juice</SelectItem>
                              <SelectItem value="Cookies">Cookies</SelectItem>
                              <SelectItem value="Sandwiches">Sandwiches</SelectItem>
                              <SelectItem value="Lunch">Lunch</SelectItem>
                              <SelectItem value="Breakfast">Breakfast</SelectItem>
                              <SelectItem value="Dessert">Dessert</SelectItem>
                              <SelectItem value="Fruits">Fruits</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="estimatedCount">Estimated Count</Label>
                          <Input
                            id="estimatedCount"
                            type="number"
                            min="1"
                            value={formData.refreshments.estimatedCount}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                refreshments: {
                                  ...formData.refreshments,
                                  estimatedCount: Number.parseInt(e.target.value) || 0,
                                },
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="specialRequests">Special Requests</Label>
                        <Textarea
                          id="specialRequests"
                          value={formData.refreshments.specialRequests}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              refreshments: {
                                ...formData.refreshments,
                                specialRequests: e.target.value,
                              },
                            })
                          }
                          placeholder="Dietary restrictions, allergies, special requirements..."
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingBooking ? "Update" : "Create"} Booking</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      {/* Compact Results Summary */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing <strong className="text-foreground">{filteredBookings.length}</strong> of <strong className="text-foreground">{bookings.length}</strong> bookings
          {(searchTerm || statusFilter !== "all" || placeFilter !== "all") && (
            <Badge variant="secondary" className="ml-2">Filters active</Badge>
          )}
        </div>
        {(searchTerm || statusFilter !== "all" || placeFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm("")
              setStatusFilter("all")
              setPlaceFilter("all")
            }}
            className="h-8"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">All Bookings ({filteredBookings.length})</TabsTrigger>
          <TabsTrigger value="today">Today's Bookings ({todaysBookings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                All Bookings ({filteredBookings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingBookings ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-3 text-muted-foreground">Loading bookings...</span>
                </div>
              ) : bookingsError ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{bookingsError}</AlertDescription>
                </Alert>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {bookings.length === 0 ? 'No bookings found' : 'No bookings match your filters'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {bookings.length === 0 ? 'Click "New Booking" to create your first booking' : 'Try adjusting your filters'}
                  </p>
                </div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                      <TableHead>Ref ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Place</TableHead>
                    <TableHead>Responsible</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        {booking.bookingRefId ? (
                          <Badge variant="secondary" className="font-mono font-bold text-sm">
                            {booking.bookingRefId}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{booking.title}</p>
                            {booking.refreshments?.required && (
                              <Badge variant="outline" className="text-orange-600 border-orange-600">
                                🍽️ Refreshments
                              </Badge>
                            )}
                          </div>
                          {booking.description && (
                            <p className="text-sm text-muted-foreground">{booking.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{formatDate(booking.date)}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {booking.place}
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.responsiblePerson ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {booking.responsiblePerson.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{booking.responsiblePerson.name}</p>
                              <p className="text-xs text-muted-foreground">{booking.responsiblePerson.department}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {booking.totalParticipantsCount ?? (booking.selectedEmployees.length + booking.externalParticipants.length)} participants
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge {...getStatusBadgeProps(booking.status)}>{booking.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Only show Mail button if booking is NOT cancelled or completed */}
                          {booking.status !== "cancelled" && booking.status !== "completed" && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleSendEmailClick(booking)}
                              className="text-blue-600 border-blue-600 hover:bg-blue-50"
                              title="Send email to participants"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEdit(booking)}
                            disabled={booking.status === "completed" || booking.status === "cancelled"}
                            title={
                              booking.status === "completed" ? "Cannot edit completed bookings" :
                              booking.status === "cancelled" ? "Cannot edit cancelled bookings" :
                              "Edit booking"
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancel(booking.id)}
                            disabled={booking.status === "completed" || booking.status === "cancelled"}
                            className="text-red-600 hover:text-red-700 hover:border-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={
                              booking.status === "completed" || booking.status === "cancelled" 
                                ? "Cannot cancel this booking" 
                                : "Cancel booking"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          {/* Always show cancellation reason button for ALL cancelled bookings */}
                          {(() => {
                            // Check if booking is cancelled (handle all case variations)
                            const bookingStatus = String(booking.status || '').toLowerCase().trim()
                            const isCancelled = bookingStatus === 'cancelled'
                            
                            if (!isCancelled) return null
                            
                            // Get cancellation reason with fallbacks
                            const reason = booking.cancellation?.cancellation_reason || 
                                         booking.cancellation?.['cancellation_reason'] ||
                                         booking.cancellation?.cancellationReason ||
                                         booking.cancellation?.reason ||
                                         ''
                            
                            const hasReason = reason && String(reason).trim().length > 0
                            
                            return (
                              <div className="flex items-center gap-2 min-w-[150px]">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleShowCancellationReason(booking)}
                                  className="text-blue-600 hover:text-blue-700 hover:border-blue-600"
                                  title={hasReason ? `View cancellation reason: ${String(reason).substring(0, 50)}...` : "View cancellation details"}
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                                {hasReason ? (
                                  <span 
                                    className="text-xs text-muted-foreground max-w-[200px] truncate cursor-pointer hover:text-foreground"
                                    onClick={() => handleShowCancellationReason(booking)}
                                    title={String(reason)}
                                  >
                                    {String(reason)}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">No reason</span>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="today">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Bookings ({todaysBookings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaysBookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No bookings scheduled for today</p>
              ) : (
                <div className="space-y-4">
                  {todaysBookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{booking.title}</h3>
                              {booking.refreshments?.required && (
                                <Badge variant="outline" className="text-orange-600 border-orange-600">
                                  🍽️ Refreshments
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatTime(booking.startTime)} - {formatTime(booking.endTime)} • {booking.place}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Employees: {booking.selectedEmployees.map((emp) => emp.name).join(", ")}
                            </p>
                            {booking.refreshments?.required && (
                              <p className="text-xs text-orange-600 mt-1">
                                Refreshments: {booking.refreshments.type} at {formatTime(booking.refreshments.servingTime)} for{" "}
                                {booking.refreshments.estimatedCount} people
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              {/* Only show Mail button if booking is NOT cancelled or completed */}
                              {booking.status !== "cancelled" && booking.status !== "completed" && (
                              <Button
                                onClick={() => handleSendEmailClick(booking)}
                                size="sm"
                                variant="outline"
                                className="flex items-center gap-1 text-blue-600 border-blue-600 hover:bg-blue-50"
                                  title="Send email to participants"
                              >
                                <Mail className="h-4 w-4" />
                                Send Email
                              </Button>
                              )}
                            </div>
                            <Badge {...getStatusBadgeProps(booking.status)}>{booking.status}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {confirmTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">{confirmMessage}</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              No, Keep It
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmAction) confirmAction()
              }}
            >
              Yes, Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancellation Reason Dialog */}
      <Dialog open={isCancellationDialog} onOpenChange={setIsCancellationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Cancel Booking
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Please provide a reason for cancelling this booking. This information will be stored for records.
            </p>
            <div className="space-y-2">
              <Label htmlFor="cancellationReason">Cancellation Reason *</Label>
              <Textarea
                id="cancellationReason"
                placeholder="Enter the reason for cancellation (e.g., Room unavailable, Event postponed, etc.)"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
                className="resize-none"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsCancellationDialog(false)
                setCancellationReason("")
                setBookingToCancel(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancellation}
              disabled={!cancellationReason.trim()}
            >
              Confirm Cancellation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Cancellation Reason Dialog */}
      <Dialog open={isCancellationReasonDialogOpen} onOpenChange={setIsCancellationReasonDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              Cancellation Details
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {selectedCancellation && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Cancellation Reason</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {selectedCancellation.cancellation_reason}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Cancelled At</Label>
                    <p className="text-sm font-medium">
                      {selectedCancellation.cancelled_at 
                        ? new Date(selectedCancellation.cancelled_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Cancellation Type</Label>
                    <p className="text-sm font-medium capitalize">
                      {selectedCancellation.cancellation_type?.replace('_', ' ') || 'N/A'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsCancellationReasonDialogOpen(false)
                setSelectedCancellation(null)
              }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Notification Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Send Email Notifications
            </DialogTitle>
            {selectedBookingForEmail && (
              <p className="text-sm text-muted-foreground">
                Meeting: <strong>{selectedBookingForEmail.title}</strong> • {selectedBookingForEmail.date} at {formatTime(selectedBookingForEmail.startTime)}
              </p>
            )}
          </DialogHeader>
          
          {selectedBookingForEmail && (
            <div className="space-y-6">
              {/* Email Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="emailType">Email Type</Label>
                <Select value={emailType} onValueChange={(value: 'booking_details' | 'booking_confirmation') => setEmailType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="booking_details">Booking Details</SelectItem>
                    <SelectItem value="booking_confirmation">Booking Confirmation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Message */}
              <div className="space-y-2">
                <Label htmlFor="customMessage">Custom Message (Optional)</Label>
                <Textarea
                  id="customMessage"
                  placeholder="Add a custom message to include in the email..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Participants Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Select Participants</h3>
                  {isLoadingParticipants && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading participants...
                    </div>
                  )}
                </div>

                {/* Select All */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="selectAllParticipants"
                      checked={bookingParticipants.length > 0 && 
                               bookingParticipants
                                 .filter(p => p.has_email === 1)
                                 .every(p => selectedEmailParticipants.includes(p.id))}
                      onChange={handleSelectAllParticipants}
                      className="h-4 w-4"
                      disabled={isLoadingParticipants}
                    />
                    <Label htmlFor="selectAllParticipants" className="cursor-pointer font-medium">
                      Select All Participants
                    </Label>
                  </div>
                  <Badge variant="outline">
                    {selectedEmailParticipants.length} of {bookingParticipants.filter(p => p.has_email === 1).length} selected
                    {bookingParticipants.length > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({bookingParticipants.length} total)
                      </span>
                    )}
                  </Badge>
                </div>

                {/* Participants List */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {isLoadingParticipants ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Loading participants...</p>
                    </div>
                  ) : bookingParticipants.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="font-medium">No participants found for this booking</p>
                      <p className="text-xs mt-2">
                        {selectedBookingForEmail ? (
                          <>
                            Booking ID: {selectedBookingForEmail.id}<br/>
                            This booking may not have any participants assigned yet.
                          </>
                        ) : (
                          'Loading booking information...'
                        )}
                      </p>
                    </div>
                  ) : (
                    (() => {
                      console.log('📧 ==========================================')
                      console.log('📧 RENDERING PARTICIPANTS LIST')
                      console.log('📧 ==========================================')
                      console.log('📧 Total participants to render:', bookingParticipants.length)
                      console.log('📧 Currently selected:', selectedEmailParticipants.length, 'participants')
                      console.log('📧 Selected IDs:', selectedEmailParticipants)
                      bookingParticipants.forEach((p, index) => {
                        console.log(`📧   Participant ${index + 1}:`)
                        console.log(`📧      ID: ${p.id}`)
                        console.log(`📧      Name: ${p.full_name}`)
                        console.log(`📧      Email: ${p.email || 'NO EMAIL ❌'}`)
                        console.log(`📧      Has Email: ${p.has_email === 1 ? '✅' : '❌'}`)
                        console.log(`📧      Is Selected: ${selectedEmailParticipants.includes(p.id) ? '✅ YES' : '❌ NO'}`)
                      })
                      return bookingParticipants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id={`participant-${participant.id}`}
                            checked={selectedEmailParticipants.includes(participant.id)}
                              onChange={(e) => {
                                console.log('📧 ==========================================')
                                console.log('📧 CHECKBOX CLICKED')
                                console.log('📧 ==========================================')
                                console.log('📧 Participant ID:', participant.id)
                                console.log('📧 Participant Name:', participant.full_name)
                                console.log('📧 Participant Email:', participant.email || 'NO EMAIL')
                                console.log('📧 Checked:', e.target.checked)
                                console.log('📧 Current selected count:', selectedEmailParticipants.length)
                                console.log('📧 Current selected IDs:', selectedEmailParticipants)
                                handleParticipantEmailSelection(participant.id, e.target.checked)
                              }}
                            className="h-4 w-4"
                            disabled={participant.has_email === 0}
                          />
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {(() => {
                                  const name = participant.full_name || 'Unknown'
                                  if (typeof name === 'string') {
                                    return name.split(' ').map(n => n[0]).join('').toUpperCase()
                                  }
                                  return 'UN'
                                })()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {typeof participant.full_name === 'string' ? participant.full_name : 'Unknown Participant'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {participant.email || 'No email address'}
                              </p>
                              {participant.company_name && (
                                <p className="text-xs text-muted-foreground">{participant.company_name}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={participant.has_email === 0 ? 'destructive' : 'outline'}
                            className="text-xs"
                          >
                            {participant.member_type || 'N/A'}
                          </Badge>
                          {participant.has_email === 0 && (
                            <Badge variant="destructive" className="text-xs">
                              No Email
                            </Badge>
                          )}
                          {selectedEmailParticipants.includes(participant.id) && (
                            <Badge variant="default" className="text-xs bg-green-500">
                              Selected ✅
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                    })()
                  )}
                </div>

                {bookingParticipants.filter(p => p.has_email === 1).length === 0 && 
                 bookingParticipants.length > 0 && 
                 !isLoadingParticipants && (
                  <div className="text-center py-4 text-muted-foreground border-t pt-4">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50 text-yellow-600" />
                    <p className="text-sm font-medium">No email addresses available</p>
                    <p className="text-xs">None of the {bookingParticipants.length} participant(s) have email addresses</p>
                  </div>
                )}
              </div>
              
              {/* Debug Info - Remove in production */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-muted-foreground p-2 bg-gray-50 rounded border">
                  <p>Debug: {bookingParticipants.length} participants loaded</p>
                  <p>Participants with email: {bookingParticipants.filter(p => p.has_email === 1).length}</p>
                  <p>Selected: {selectedEmailParticipants.length}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end items-center pt-4 border-t">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEmailDialogOpen(false)
                      setSelectedBookingForEmail(null)
                      setSelectedEmailParticipants([])
                      setBookingParticipants([])
                      setCustomMessage('')
                    }}
                    disabled={isSendingEmails}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={sendEmailNotifications}
                    disabled={selectedEmailParticipants.length === 0 || isSendingEmails}
                    className="flex items-center gap-2"
                  >
                    {isSendingEmails ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Emails ({selectedEmailParticipants.length})
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
