"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Calendar, MapPin, Users, X, Search, Clock, Utensils, Save, Loader2, AlertTriangle } from "lucide-react"
import { placeManagementAPI } from "@/lib/place-management-api"
import toast from "react-hot-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  id: string  // booking_participant record ID (unique)
  employeeId?: string  // actual employee/user ID (can be same for multiple records)
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

interface Booking {
  id: string
  title: string
  description: string
  date: string
  place: string
  placeId?: string
  startTime: string
  endTime: string
}

export default function UpdateBookingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('id')
  
  const [isLoadingBooking, setIsLoadingBooking] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  
  // Form Data State
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

  // Available Places State
  const [availablePlaces, setAvailablePlaces] = useState<AvailablePlace[]>([])
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false)
  
  // Time Gaps State
  const [availableTimeGaps, setAvailableTimeGaps] = useState<{start: string, end: string, duration: string}[]>([])
  const [selectedTimeGap, setSelectedTimeGap] = useState<string>("")
  const [minBookingDuration, setMinBookingDuration] = useState<number>(30)
  
  // Custom time selection within gap
  const [availableStartTimes, setAvailableStartTimes] = useState<string[]>([])
  const [availableEndTimes, setAvailableEndTimes] = useState<string[]>([])
  const [selectedGapStart, setSelectedGapStart] = useState<string>("")
  const [selectedGapEnd, setSelectedGapEnd] = useState<string>("")
  
  // Users State
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  
  // Bookings State (for conflict checking)
  const [existingBookings, setExistingBookings] = useState<Booking[]>([])
  
  // UI State
  const [employeeSearch, setEmployeeSearch] = useState("")
  const [responsibleSearch, setResponsibleSearch] = useState("")
  const [showResponsibleDropdown, setShowResponsibleDropdown] = useState(false)
  
  // External Member Search state
  const [memberSearch, setMemberSearch] = useState("")
  const [searchedMembers, setSearchedMembers] = useState<any[]>([])
  const [showMemberDropdown, setShowMemberDropdown] = useState(false)
  
  const [newExternalParticipant, setNewExternalParticipant] = useState({
    fullName: "",
    email: "",
    phone: "",
    referenceType: "NIC" as "NIC" | "Passport" | "Employee ID",
    referenceValue: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Refreshment serving time options
  const [servingTimeOptions, setServingTimeOptions] = useState<string[]>([])

  // Load booking data on mount
  useEffect(() => {
    const loadBookingData = async () => {
      if (!bookingId) {
        setLoadError("No booking ID provided")
        setIsLoadingBooking(false)
        return
      }

      try {
        setIsLoadingBooking(true)
        console.log('═══════════════════════════════════════════════════════')
        console.log('📖 LOADING BOOKING FOR EDIT')
        console.log('   Booking ID from URL:', bookingId)
        console.log('═══════════════════════════════════════════════════════')

        // Fetch ALL bookings (API filter may not work)
        const bookingResponse = await placeManagementAPI.getTableData('bookings', {
          is_deleted: 'false',
          limit: 500
        })

        console.log('📥 Raw booking response:', bookingResponse)
        console.log('📥 Response is array?', Array.isArray(bookingResponse))
        
        // Client-side filter by booking ID
        const allBookings = Array.isArray(bookingResponse) ? bookingResponse : bookingResponse?.data || []
        console.log('📥 Total bookings fetched:', allBookings.length)
        console.log('📥 Looking for booking with ID:', bookingId)
        
        const bookingData = allBookings.find((b: any) => b.id === bookingId)
        console.log('📥 Found booking?', !!bookingData)

        if (!bookingData) {
          throw new Error('Booking not found')
        }

        console.log('✅ Loaded booking data:')
        console.log('   ID:', bookingData.id)
        console.log('   Title:', bookingData.title)
        console.log('   Date:', bookingData.booking_date)
        console.log('   Place ID:', bookingData.place_id)
        console.log('📋 Responsible person ID from booking:', bookingData.responsible_person_id)
        console.log('📋 Responsible person name from booking:', bookingData.responsible_person_name)

        // Normalize date (with timezone fix)
        console.log('📅 Raw booking_date:', bookingData.booking_date, '(type:', typeof bookingData.booking_date, ')')
        
        let normalizedDate = bookingData.booking_date
        if (normalizedDate) {
          if (typeof normalizedDate === 'string') {
            if (normalizedDate.includes('T')) {
              // ISO format with timezone - extract local date
              const dateObj = new Date(normalizedDate)
              const year = dateObj.getFullYear()
              const month = String(dateObj.getMonth() + 1).padStart(2, '0')
              const day = String(dateObj.getDate()).padStart(2, '0')
              normalizedDate = `${year}-${month}-${day}`
              console.log('📅 Normalized (ISO with timezone fix):', normalizedDate)
            } else if (normalizedDate.includes(' ')) {
              normalizedDate = normalizedDate.split(' ')[0]
              console.log('📅 Normalized (DateTime):', normalizedDate)
            } else {
              console.log('📅 Already normalized:', normalizedDate)
            }
          } else if (normalizedDate instanceof Date) {
            // Date object - extract local date
            const year = normalizedDate.getFullYear()
            const month = String(normalizedDate.getMonth() + 1).padStart(2, '0')
            const day = String(normalizedDate.getDate()).padStart(2, '0')
            normalizedDate = `${year}-${month}-${day}`
            console.log('📅 Normalized (Date object with timezone fix):', normalizedDate)
          }
        }
        console.log('✅ Final normalized date:', normalizedDate)

        // Fetch ALL users first (for matching)
        const allUsersResponse = await placeManagementAPI.getTableData('userprofile', {
          limit: 500
        })
        const allUsers = Array.isArray(allUsersResponse) ? allUsersResponse : []
        console.log('📋 Loaded all users for matching:', allUsers.length)
        if (allUsers.length > 0) {
          console.log('📋 Sample user object structure:', allUsers[0])
        }

        // Fetch participants (only active ones)
        const participantsResponse = await placeManagementAPI.getTableData('booking_participants', {
          limit: 50
        })
        const participants = Array.isArray(participantsResponse) ? 
          participantsResponse.filter((p: any) => 
            p.booking_id === bookingId && 
            (p.is_deleted === false || p.is_deleted === 0)
          ) : []
        console.log('📋 Loaded ACTIVE participants (is_deleted=false):', participants.length)
        console.log('📋 Participant data:', participants)

        // Fetch external participants (only active ones)
        const externalResponse = await placeManagementAPI.getTableData('external_participants', {
          limit: 50
        })
        const externals = Array.isArray(externalResponse) ? 
          externalResponse.filter((p: any) => 
            p.booking_id === bookingId && 
            (p.is_deleted === false || p.is_deleted === 0)
          ) : []
        console.log('📋 Loaded ACTIVE external participants (is_deleted=false):', externals.length)
        console.log('📋 External participant data:', externals)

        // Check if refreshments are required from bookings table first
        const refreshmentsRequired = bookingData.refreshments_required === 1 || bookingData.refreshments_required === true
        console.log('🍽️ Refreshments required from bookings table:', refreshmentsRequired)
        
        // Only fetch refreshments if they are required
        let refreshmentData = null
        if (refreshmentsRequired) {
          const refreshmentsResponse = await placeManagementAPI.getTableData('booking_refreshments', {
            filters: [{ field: 'booking_id', operator: '=', value: bookingId }],
            limit: 1
          })
          refreshmentData = Array.isArray(refreshmentsResponse) && refreshmentsResponse.length > 0 ? refreshmentsResponse[0] : null
          console.log('🍽️ Loaded refreshment data:', refreshmentData)
          if (refreshmentData) {
            console.log('🍽️ Refreshment serving_time:', refreshmentData.serving_time)
            console.log('🍽️ Refreshment type:', refreshmentData.refreshment_type)
            console.log('🍽️ Refreshment items field:', refreshmentData.items)
            console.log('🍽️ Refreshment refreshments_details field:', refreshmentData.refreshments_details)
          }
        } else {
          console.log('🍽️ Refreshments not required, skipping refreshment data fetch')
        }

        // Find responsible person from users
        let responsiblePersonData = null
        const responsiblePersonId = bookingData.responsible_person_id || bookingData.responsiblePersonId || bookingData.created_by
        console.log('🔍 Looking for responsible person with ID:', responsiblePersonId)
        console.log('🔍 Available user IDs:', allUsers.map(u => u.id))
        
        if (responsiblePersonId) {
          const foundUser = allUsers.find(u => u.id === responsiblePersonId || u.email === responsiblePersonId || u.full_name === responsiblePersonId)
          if (foundUser) {
            console.log('📋 Found user object:', foundUser)
            console.log('📋 User role field:', foundUser.role)
            console.log('📋 User user_role field:', foundUser.user_role)
            responsiblePersonData = {
              id: foundUser.id,
              name: foundUser.full_name || foundUser.email,
              email: foundUser.email,
              department: foundUser.department || '',
              role: foundUser.role || foundUser.user_role || '',
              phone: foundUser.phone || foundUser.contact_number || ''
            }
            console.log('✅ Found responsible person with role:', responsiblePersonData.role)
          } else {
            console.log('⚠️ Responsible person not found in users:', responsiblePersonId)
            // Try to use the stored name if available
            if (bookingData.responsible_person_name) {
              responsiblePersonData = {
                id: responsiblePersonId,
                name: bookingData.responsible_person_name,
                email: bookingData.responsible_person_email || '',
                department: '',
                role: '', // No default role - only show if exists
                phone: ''
              }
              console.log('✅ Using stored responsible person data:', responsiblePersonData)
            }
          }
        } else {
          console.log('⚠️ No responsible person ID found in booking data')
        }

        // Map participants to Employee objects with real user data
        const selectedEmployees = participants.map(p => {
          // IMPORTANT: Use booking_participant record ID, not employee_id!
          // This ensures each participant entry is unique
          const userId = p.employee_id || p.user_id
          const foundUser = allUsers.find(u => u.id === userId)
          
          if (foundUser) {
            return {
              id: p.id,  // ✅ Use participant record ID (unique per booking)
              employeeId: foundUser.id,  // Store employee ID separately
              name: foundUser.full_name || foundUser.email,
              email: foundUser.email,
              department: foundUser.department || '',
              role: foundUser.role || '',
              phone: foundUser.phone || ''
            }
          } else {
            // Fallback to data stored in booking_participants table
            return {
              id: p.id,  // ✅ Use participant record ID
              employeeId: userId,
              name: p.employee_name || 'Unknown',
              email: p.employee_email || '',
              department: p.employee_department || '',
              role: p.employee_role || '',
              phone: p.employee_phone || ''
            }
          }
        })
        console.log('✅ Mapped employees with unique participant IDs:', selectedEmployees)

        // Set form data
        const externalParticipantsData = externals.map(e => ({
          id: e.id,
          fullName: e.full_name || '',
          email: e.email || '',
          phone: e.phone || '',
          referenceType: e.reference_type || 'NIC',
          referenceValue: e.reference_value || ''
        }))
        
        console.log('📝 Setting form data with:')
        console.log('   Employees:', selectedEmployees.length)
        console.log('   Externals:', externalParticipantsData.length)
        
        setFormData(prev => ({
          ...prev,
          title: bookingData.title || '',
          description: bookingData.description || '',
          date: normalizedDate || '',
          place: bookingData.place_id || '',
          startTime: bookingData.start_time || '',
          endTime: bookingData.end_time || '',
          responsiblePerson: responsiblePersonData,
          selectedEmployees: selectedEmployees,
          externalParticipants: externalParticipantsData,
          refreshments: (refreshmentsRequired && refreshmentData) ? {
            required: true,
            type: refreshmentData.refreshment_type || 'beverages',
            items: (() => {
              try {
                // Try to parse items field first
                if (refreshmentData.items) {
                  return typeof refreshmentData.items === 'string' ? 
                    JSON.parse(refreshmentData.items) : 
                    Array.isArray(refreshmentData.items) ? refreshmentData.items : []
                }
                // Fallback to refreshments_details
                if (refreshmentData.refreshments_details) {
                  return typeof refreshmentData.refreshments_details === 'string' ? 
                    JSON.parse(refreshmentData.refreshments_details) : 
                    Array.isArray(refreshmentData.refreshments_details) ? refreshmentData.refreshments_details : []
                }
                return []
              } catch (e) {
                console.error('Failed to parse refreshment items:', e)
                return []
              }
            })(),
            servingTime: (() => {
              const timeStr = refreshmentData.serving_time
              if (!timeStr) return ''
              
              // Handle different time formats
              if (typeof timeStr === 'string') {
                // If it's like "10:30:00", take first 5 chars "10:30"
                if (timeStr.includes(':')) {
                  return timeStr.substring(0, 5)
                }
                return timeStr
              }
              return ''
            })(),
            specialRequests: refreshmentData.special_requests || '',
            estimatedCount: refreshmentData.estimated_count || 0
          } : {
            required: false,
            type: "",
            items: [],
            servingTime: "",
            specialRequests: "",
            estimatedCount: 0
          }
        }))

        console.log('✅ Final form data - Refreshments:', {
          required: refreshmentData ? true : false,
          servingTime: refreshmentData ? ((() => {
            const timeStr = refreshmentData.serving_time
            if (!timeStr) return ''
            if (typeof timeStr === 'string') {
              if (timeStr.includes(':')) {
                return timeStr.substring(0, 5)
              }
              return timeStr
            }
            return ''
          })()) : ''
        })

        setIsLoadingBooking(false)
      } catch (error) {
        console.error('❌ Failed to load booking:', error)
        setLoadError(error instanceof Error ? error.message : 'Failed to load booking')
        setIsLoadingBooking(false)
        toast.error('Failed to load booking data', {
          position: 'top-center',
          duration: 4000,
          icon: '❌'
        })
      }
    }

    loadBookingData()
  }, [bookingId])

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true)
        const usersData = await placeManagementAPI.getTableData('userprofile', {
          limit: 200
        })
        
        const usersArray = Array.isArray(usersData) ? usersData : []
        const filteredUsers = usersArray.filter((user: any) => 
          user.role === 'admin' || user.role === 'employee'
        )
        
        setUsers(filteredUsers)
      } catch (error) {
        console.error('Failed to fetch users:', error)
      } finally {
        setIsLoadingUsers(false)
      }
    }
    
    fetchUsers()
  }, [])

  // Fetch bookings for conflict checking
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const bookingsResponse = await placeManagementAPI.getTableData('bookings', {
          filters: [
            { field: 'is_deleted', operator: '=', value: 0 }
          ],
          limit: 200
        })
        
        const bookingsData: any[] = Array.isArray(bookingsResponse) ? bookingsResponse : []
        
        const transformedBookings: Booking[] = bookingsData.map((booking: any) => {
          // Normalize date
          let normalizedDate = booking.booking_date
          if (normalizedDate && typeof normalizedDate === 'string' && normalizedDate.includes('T')) {
            const d = new Date(normalizedDate)
            normalizedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          }
          
          return {
            id: booking.id,
            title: booking.title,
            description: booking.description || '',
            date: normalizedDate,
            place: booking.place_name,
            placeId: booking.place_id,
            startTime: booking.start_time.substring(0, 5),
            endTime: booking.end_time.substring(0, 5)
          }
        })
        
        setExistingBookings(transformedBookings)
      } catch (error) {
        console.error('Failed to fetch bookings:', error)
      }
    }
    
    fetchBookings()
  }, [])

  // Helper function to get day of week
  const getDayOfWeek = (dateString: string) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const date = new Date(dateString + 'T00:00:00')
    return days[date.getDay()]
  }

  // Fetch available places when date is selected
  useEffect(() => {
    const fetchAvailablePlaces = async (dateString: string) => {
      try {
        setIsLoadingPlaces(true)
        
        const dayOfWeek = getDayOfWeek(dateString)
        
        const allPlaces = await placeManagementAPI.getPlaces({
          isActive: true,
          limit: 100
        })
        
        const configurationsResponse = await placeManagementAPI.getTableData('place_configuration', {
          limit: 100
        })
        
        const availablePlacesForDate = allPlaces
          .map((place: Place) => {
            const config = configurationsResponse.find((c: any) => c.place_id === place.id)
            
            if (!config || !config.allow_bookings) return null
            
            const dayKey = `available_${dayOfWeek}` as keyof PlaceConfiguration
            if (!config[dayKey]) return null
            
            return {
              ...place,
              configuration: config,
              isAvailableForDate: true,
              operatingHours: `${config.start_time.substring(0, 5)} - ${config.end_time.substring(0, 5)}`
            }
          })
          .filter((place: AvailablePlace | null): place is AvailablePlace => place !== null)
        
        setAvailablePlaces(availablePlacesForDate)
        
      } catch (error: any) {
        console.error('Failed to fetch available places:', error)
        toast.error(error.message || 'Failed to load available places', {
          position: 'top-center',
          duration: 4000
        })
      } finally {
        setIsLoadingPlaces(false)
      }
    }

    if (formData.date) {
      fetchAvailablePlaces(formData.date)
    }
  }, [formData.date])

  // Generate time gaps when place is selected
  useEffect(() => {
    const generateTimeGaps = () => {
      if (!formData.place || !formData.date) {
        setAvailableTimeGaps([])
        return
      }

      const selectedPlace = availablePlaces.find(p => p.id === formData.place)
      
      if (!selectedPlace || !selectedPlace.configuration) {
        setAvailableTimeGaps([])
        return
      }

      const config = selectedPlace.configuration
      const minDuration = config.booking_slot_duration || 30
      setMinBookingDuration(minDuration)

      const openTime = config.start_time.substring(0, 5)
      const closeTime = config.end_time.substring(0, 5)

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
        if (hours > 0 && mins > 0) return `${hours}h ${mins}min`
        else if (hours > 0) return `${hours}h`
        else return `${mins}min`
      }

      const openMinutes = timeToMinutes(openTime)
      const closeMinutes = timeToMinutes(closeTime)

      // Get existing bookings for this date and place
      const relevantBookings = existingBookings.filter(booking => {
        const placeMatches = booking.placeId ? booking.placeId === formData.place : booking.place === selectedPlace.name
        return booking.date === formData.date && placeMatches && booking.startTime && booking.endTime
      }).map(booking => ({
        start: timeToMinutes(booking.startTime),
        end: timeToMinutes(booking.endTime),
        title: booking.title
      })).sort((a, b) => a.start - b.start)

      console.log('📋 Relevant bookings for gap calculation:', relevantBookings)

      // Find gaps
      const gaps: {start: string, end: string, duration: string}[] = []
      let currentTime = openMinutes

      for (const booking of relevantBookings) {
        if (currentTime < booking.start) {
          const gapDuration = booking.start - currentTime
          if (gapDuration >= minDuration) {
            gaps.push({
              start: minutesToTime(currentTime),
              end: minutesToTime(booking.start),
              duration: formatDuration(gapDuration)
            })
          }
        }
        currentTime = Math.max(currentTime, booking.end)
      }

      // Check final gap
      if (currentTime < closeMinutes) {
        const gapDuration = closeMinutes - currentTime
        if (gapDuration >= minDuration) {
          gaps.push({
            start: minutesToTime(currentTime),
            end: minutesToTime(closeMinutes),
            duration: formatDuration(gapDuration)
          })
        }
      }

      console.log('✅ Available gaps:', gaps)
      setAvailableTimeGaps(gaps)
    }

    generateTimeGaps()
  }, [formData.place, formData.date, availablePlaces, existingBookings])

  // Generate start times within selected gap
  useEffect(() => {
    if (!selectedTimeGap || !formData.place) {
      setAvailableStartTimes([])
      setAvailableEndTimes([])
      return
    }

    const gap = availableTimeGaps.find(g => `${g.start} - ${g.end}` === selectedTimeGap)
    if (!gap) return

    const selectedPlace = availablePlaces.find(p => p.id === formData.place)
    if (!selectedPlace?.configuration) return

    const config = selectedPlace.configuration
    const slotInterval = 30 // 30-minute intervals for start times
    const minDuration = config.booking_slot_duration || 60 // Minimum booking duration (e.g., 1 hour)
    setMinBookingDuration(minDuration)

    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    }

    const minutesToTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
    }

    const gapStartMinutes = timeToMinutes(gap.start)
    const gapEndMinutes = timeToMinutes(gap.end)

    // Generate start times within gap
    // Last possible start time must allow for minimum duration
    const lastPossibleStart = gapEndMinutes - minDuration
    
    const startTimes: string[] = []
    for (let time = gapStartMinutes; time <= lastPossibleStart; time += slotInterval) {
      startTimes.push(minutesToTime(time))
    }

    console.log(`🕐 Gap: ${gap.start} - ${gap.end} (${gapEndMinutes - gapStartMinutes} min)`)
    console.log(`⏰ Min duration: ${minDuration} min, Interval: ${slotInterval} min`)
    console.log(`📍 Last possible start: ${minutesToTime(lastPossibleStart)} (allows ${minDuration}min until ${gap.end})`)
    console.log(`✅ Available start times:`, startTimes)

    setAvailableStartTimes(startTimes)
    setSelectedGapStart(gap.start)
    setSelectedGapEnd(gap.end)

  }, [selectedTimeGap, availablePlaces, formData.place, availableTimeGaps])

  // Generate end times based on selected start time within gap
  useEffect(() => {
    if (!formData.startTime || !selectedGapEnd) {
      setAvailableEndTimes([])
      return
    }

    const selectedPlace = availablePlaces.find(p => p.id === formData.place)
    if (!selectedPlace?.configuration) return

    const config = selectedPlace.configuration
    const slotInterval = 30 // 30-minute intervals
    const minDuration = config.booking_slot_duration || 60

    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    }

    const minutesToTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
    }

    const startMinutes = timeToMinutes(formData.startTime)
    const gapEndMinutes = timeToMinutes(selectedGapEnd)
    const minEndMinutes = startMinutes + minDuration

    const endTimes: string[] = []
    for (let time = minEndMinutes; time <= gapEndMinutes; time += slotInterval) {
      endTimes.push(minutesToTime(time))
    }

    console.log(`🕐 Start time: ${formData.startTime}, Gap ends: ${selectedGapEnd}`)
    console.log(`⏰ Min end: ${minutesToTime(minEndMinutes)} (${minDuration}min from start)`)
    console.log(`✅ Available end times:`, endTimes)

    setAvailableEndTimes(endTimes)

  }, [formData.startTime, selectedGapEnd, availablePlaces, formData.place])

  // Generate refreshment serving time options based on booking time
  useEffect(() => {
    if (!formData.startTime || !formData.endTime) {
      setServingTimeOptions([])
      return
    }

    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    }

    const minutesToTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
    }

    const startMinutes = timeToMinutes(formData.startTime)
    const endMinutes = timeToMinutes(formData.endTime)
    const interval = 15 // 15-minute intervals

    // Generate serving times from booking start to 15 minutes before booking end
    const servingTimes: string[] = []
    const lastServingTime = endMinutes - 15 // Last option is 15 min before end

    for (let time = startMinutes; time <= lastServingTime; time += interval) {
      servingTimes.push(minutesToTime(time))
    }

    console.log(`🍽️ Serving time options: ${formData.startTime} to ${minutesToTime(lastServingTime)} (15-min intervals)`)
    console.log(`✅ Total options:`, servingTimes.length)

    setServingTimeOptions(servingTimes)

  }, [formData.startTime, formData.endTime])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate date is not in the past
    const today = new Date().toISOString().split('T')[0]
    if (formData.date < today) {
      toast.error('Cannot update booking to a past date', {
        position: 'top-center',
        duration: 3000
      })
      return
    }

    if (!formData.startTime || !formData.endTime) {
      toast.error('Please select a time slot', {
        position: 'top-center',
        duration: 3000
      })
      return
    }

    if (!formData.place) {
      toast.error('Please select a place', {
        position: 'top-center',
        duration: 3000
      })
      return
    }

    if (!formData.responsiblePerson) {
      toast.error('Please assign a responsible person', {
        position: 'top-center',
        duration: 3000
      })
      return
    }

    try {
      setIsSubmitting(true)

      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0
          const v = c === 'x' ? r : (r & 0x3 | 0x8)
          return v.toString(16)
        })
      }

      const generateBookingRefId = () => {
        // Generate 6-character uppercase alphanumeric code
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let refId = ''
        for (let i = 0; i < 6; i++) {
          refId += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return refId
      }

      const selectedPlace = availablePlaces.find(p => p.id === formData.place)

      console.log('📝 Updating booking:', bookingId)

      const updatedBookingData = {
        title: formData.title,
        description: formData.description || null,
        booking_date: formData.date,
        start_time: formData.startTime + ':00',
        end_time: formData.endTime + ':00',
        place_id: formData.place,
        place_name: selectedPlace?.name || '',
        responsible_person_id: formData.responsiblePerson?.id || null,
        responsible_person_name: formData.responsiblePerson?.name || null,
        responsible_person_email: formData.responsiblePerson?.email || null,
        total_participants: formData.selectedEmployees.length + formData.externalParticipants.length,
        internal_participants: formData.selectedEmployees.length,
        external_participants: formData.externalParticipants.length,
        refreshments_required: formData.refreshments.required ? 1 : 0,
        refreshments_details: JSON.stringify(formData.refreshments)
      }

      await placeManagementAPI.updateRecord('bookings', { id: bookingId! }, updatedBookingData)

      // ========================================
      // SMART PARTICIPANT UPDATE
      // ========================================
      
      // Fetch ALL internal participants (including deleted) for this booking
      const allParticipantsResponse = await placeManagementAPI.getTableData('booking_participants', {
        limit: 100
      })
      const allParticipants = (Array.isArray(allParticipantsResponse) ? allParticipantsResponse : [])
        .filter((p: any) => p.booking_id === bookingId)
      
      // Separate active and deleted
      const oldParticipants = allParticipants.filter((p: any) => 
        p.is_deleted === false || p.is_deleted === 0
      )
      const deletedParticipants = allParticipants.filter((p: any) => 
        p.is_deleted === true || p.is_deleted === 1
      )
      
      console.log('👥 Old internal participants:', oldParticipants.length)
      console.log('👥 New internal participants:', formData.selectedEmployees.length)

      // Build current list of employee IDs from form
      const currentEmployeeIds = formData.selectedEmployees.map(e => e.employeeId || e.id)
      console.log('📋 Current employee IDs in form:', currentEmployeeIds)
      
      // Build old list of employee IDs from database
      const oldEmployeeIds = oldParticipants.map((p: any) => p.employee_id)
      console.log('📋 Old employee IDs in database:', oldEmployeeIds)
      
      // Find removed participants (in old but not in new)
      const removedParticipants = oldParticipants.filter((p: any) => 
        !currentEmployeeIds.includes(p.employee_id)
      )
      
      console.log('❌ Participants to remove:', removedParticipants.length, removedParticipants.map((p: any) => p.employee_name))
      
      // Soft delete removed participants
      for (const p of removedParticipants) {
        console.log('🗑️ Soft deleting participant:', p.employee_name, 'record ID:', p.id)
        await placeManagementAPI.softDeleteRecord('booking_participants', p.id)
      }

      // Find new participants (in new but not in old active list)
      const newParticipants = formData.selectedEmployees.filter(e => {
        const empId = e.employeeId || e.id
        const isNew = !oldEmployeeIds.includes(empId)
        console.log(`   ${e.name} (${empId}): ${isNew ? 'NEW' : 'EXISTING'}`)
        return isNew
      })
      
      console.log('✅ New participants to add/restore:', newParticipants.length)
      
      // For each "new" participant, check if they were previously deleted
      for (const employee of newParticipants) {
        const empId = employee.employeeId || employee.id
        
        // Check if this employee was previously deleted
        const deletedRecord = deletedParticipants.find((p: any) => p.employee_id === empId)
        
        if (deletedRecord) {
          // RESTORE the deleted record
          console.log('♻️ Restoring previously deleted participant:', employee.name, 'record ID:', deletedRecord.id)
          await placeManagementAPI.updateRecord('booking_participants', { id: deletedRecord.id }, {
            is_deleted: false,
            participation_status: 'invited',
            updated_at: new Date().toISOString()
          })
        } else {
          // INSERT new record
          console.log('➕ Inserting new participant:', employee.name)
          await placeManagementAPI.insertRecord('booking_participants', {
            id: generateUUID(),
            booking_id: bookingId!,
            employee_id: empId,
            employee_name: employee.name,
            employee_email: employee.email,
            employee_department: employee.department,
            employee_role: employee.role,
            employee_phone: employee.phone,
            participation_status: 'invited'
          })
        }
      }

      // ========================================
      // SMART EXTERNAL PARTICIPANT UPDATE
      // ========================================
      
      // Fetch ALL external participants (including deleted) for this booking
      const allExternalsResponse = await placeManagementAPI.getTableData('external_participants', {
        limit: 100
      })
      const allExternals = (Array.isArray(allExternalsResponse) ? allExternalsResponse : [])
        .filter((p: any) => p.booking_id === bookingId)
      
      // Separate active and deleted
      const oldExternals = allExternals.filter((p: any) => 
        p.is_deleted === false || p.is_deleted === 0
      )
      const deletedExternals = allExternals.filter((p: any) => 
        p.is_deleted === true || p.is_deleted === 1
      )
      
      console.log('👤 Old external participants:', oldExternals.length)
      console.log('👤 New external participants:', formData.externalParticipants.length)

      // Find removed external participants
      const currentExternalEmails = formData.externalParticipants.map(p => p.email)
      const removedExternals = oldExternals.filter((p: any) => 
        !currentExternalEmails.includes(p.email)
      )
      
      console.log('❌ External participants to remove:', removedExternals.length)
      
      // Soft delete removed external participants
      for (const p of removedExternals) {
        await placeManagementAPI.softDeleteRecord('external_participants', p.id)
      }

      // Find new external participants (not in old active list)
      const oldExternalEmails = oldExternals.map((p: any) => p.email)
      const newExternals = formData.externalParticipants.filter(p => 
        !oldExternalEmails.includes(p.email)
      )
      
      console.log('✅ New external participants to add/restore:', newExternals.length)

      let hasExternalParticipants = formData.externalParticipants.length > 0
      
      // For each "new" external participant, check if they were previously deleted
      for (const participant of newExternals) {
        // Check if this participant was previously deleted (by email)
        const deletedRecord = deletedExternals.find((p: any) => p.email === participant.email)
        
        if (deletedRecord) {
          // RESTORE the deleted record
          console.log('♻️ Restoring previously deleted external participant:', participant.fullName, 'record ID:', deletedRecord.id)
          await placeManagementAPI.updateRecord('external_participants', { id: deletedRecord.id }, {
            is_deleted: false,
            participation_status: 'invited',
            updated_at: new Date().toISOString()
          })
        } else {
          // Need to insert new record - first handle member linking
          let memberId = participant.id

          // Check if member exists in database
          try {
            const response = await placeManagementAPI.getTableData('external_members', {
              limit: 200
            })
            const data = Array.isArray(response) ? response : response.data || []
            
            const existingMember = data.find((m: any) => 
              m.email === participant.email || m.phone === participant.phone
            )

            if (existingMember) {
              // Use existing member ID and increment visit count
              memberId = existingMember.id
              await placeManagementAPI.updateRecord('external_members', { id: memberId }, {
                visit_count: (existingMember.visit_count || 0) + 1,
                last_visit_date: new Date().toISOString()
              })
              console.log('✅ Updated visit count for existing member:', existingMember.full_name)
            } else if (!participant.id || participant.id.length < 20) {
              // Create new member record
              memberId = generateUUID()
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
                is_blacklisted: false,
                created_at: new Date().toISOString()
              })
              console.log('✅ Created new member:', participant.fullName)
            }
          } catch (error) {
            console.error('Member check/create failed:', error)
          }

          // Insert external participant with member_id link
          console.log('➕ Inserting new external participant:', participant.fullName)
          await placeManagementAPI.insertRecord('external_participants', {
            id: generateUUID(),
            booking_id: bookingId!,
            member_id: memberId,
            full_name: participant.fullName,
            email: participant.email,
            phone: participant.phone,
            reference_type: participant.referenceType,
            reference_value: participant.referenceValue,
            participation_status: 'invited'
          })
        }
      }

      // Update booking with has_external_participants flag
      if (hasExternalParticipants) {
        await placeManagementAPI.updateRecord('bookings', { id: bookingId! }, {
          has_external_participants: true
        })
      }

      // ========================================
      // SMART REFRESHMENT UPDATE
      // ========================================
      
      // Fetch existing refreshments
      const oldRefreshmentsResponse = await placeManagementAPI.getTableData('booking_refreshments', {
        is_deleted: 'false',
        limit: 10
      })
      const oldRefreshments = (Array.isArray(oldRefreshmentsResponse) ? oldRefreshmentsResponse : [])
        .filter((r: any) => r.booking_id === bookingId)
      
      console.log('🍽️ Old refreshments:', oldRefreshments.length)
      console.log('🍽️ New refreshments required:', formData.refreshments.required)
      
      if (formData.refreshments.required) {
        const refreshmentData = {
          refreshment_type: formData.refreshments.type || 'beverages',
          items: JSON.stringify(formData.refreshments.items),
          serving_time: formData.refreshments.servingTime ? formData.refreshments.servingTime + ':00' : null,
          estimated_count: formData.refreshments.estimatedCount,
          special_requests: formData.refreshments.specialRequests || null,
          status: 'pending'
        }
        
        if (oldRefreshments.length > 0) {
          // Update existing refreshment record
          console.log('✏️ Updating existing refreshment record')
          await placeManagementAPI.updateRecord('booking_refreshments', { id: oldRefreshments[0].id }, refreshmentData)
        } else {
          // Insert new refreshment record
          console.log('➕ Adding new refreshment record')
          await placeManagementAPI.insertRecord('booking_refreshments', {
            id: generateUUID(),
            booking_id: bookingId!,
            ...refreshmentData
          })
        }
      } else {
        // If refreshments not required, soft delete any existing ones
        if (oldRefreshments.length > 0) {
          console.log('🗑️ Removing refreshments (not required)')
          for (const r of oldRefreshments) {
            await placeManagementAPI.softDeleteRecord('booking_refreshments', r.id)
          }
        }
      }

      toast.success('Booking updated successfully!', {
        position: 'top-center',
        duration: 3000,
        icon: '✅'
      })

      // Redirect to bookings list
      router.push('/admin/bookings')

    } catch (error: any) {
      console.error('Failed to update booking:', error)
      toast.error(error.message || 'Failed to update booking', {
        position: 'top-center',
        duration: 4000,
        icon: '❌'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Employee search and selection
  const selectEmployee = (user: UserProfile) => {
    const employee: Employee = {
      id: `temp-${Date.now()}-${Math.random()}`,  // Temporary unique ID for new selections
      employeeId: user.id,  // Actual employee ID
      name: user.full_name,
      email: user.email,
      department: '',
      role: user.role,
      phone: ''
    }
    setFormData(prev => ({
      ...prev,
      selectedEmployees: [...prev.selectedEmployees, employee]
    }))
    setEmployeeSearch("")
    toast.success(`Added ${user.full_name}`)
  }

  const removeEmployee = (employeeId: string) => {
    console.log('═══════════════════════════════════════════════════════')
    console.log('🗑️ REMOVING EMPLOYEE ID:', employeeId)
    
    setFormData(prev => {
      console.log('   Previous selectedEmployees:', prev.selectedEmployees)
      console.log('   Length BEFORE:', prev.selectedEmployees.length)
      
      const filtered = prev.selectedEmployees.filter(e => {
        const keep = e.id !== employeeId
        console.log(`   ${e.name} (${e.id}): ${keep ? 'KEEP' : 'REMOVE'}`)
        return keep
      })
      
      console.log('   Length AFTER:', filtered.length)
      console.log('   Filtered result:', filtered)
      
      const newState = {
        ...prev,
        selectedEmployees: filtered
      }
      
      console.log('   Returning new state with', newState.selectedEmployees.length, 'employees')
      console.log('═══════════════════════════════════════════════════════')
      
      return newState
    })
    
    setTimeout(() => {
      console.log('✅ State after update:', formData.selectedEmployees.length)
    }, 100)
    
    toast.success('Employee removed', {
      position: 'top-center',
      duration: 2000
    })
  }

  // External participant management
  // External member search
  const searchExternalMembers = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchedMembers([])
      return
    }

    try {
      const response = await placeManagementAPI.getTableData('external_members', {
        is_deleted: 'false',
        is_blacklisted: 'false',
        is_active: 'true'
      })
      
      const data = Array.isArray(response) ? response : response.data || []
      const filtered = data.filter((member: any) =>
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone?.includes(searchTerm) ||
        member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10)
      
      setSearchedMembers(filtered)
    } catch (error) {
      console.error('Failed to search members:', error)
    }
  }

  // Select existing member
  const selectExistingMember = (member: any) => {
    if (formData.externalParticipants.some(p => p.email === member.email)) {
      toast.error('This member is already added')
      return
    }

    const participant: ExternalParticipant = {
      id: member.id,
      fullName: member.full_name,
      email: member.email,
      phone: member.phone,
      referenceType: member.reference_type as "NIC" | "Passport" | "Employee ID",
      referenceValue: member.reference_value,
    }

    setFormData({
      ...formData,
      externalParticipants: [...formData.externalParticipants, participant],
    })

    setMemberSearch("")
    setSearchedMembers([])
    setShowMemberDropdown(false)
    toast.success(`Added ${member.full_name}`)
  }

  const addExternalParticipant = async () => {
    if (!newExternalParticipant.fullName || !newExternalParticipant.phone || !newExternalParticipant.referenceValue) {
      toast.error("Please fill in all required fields", {
        position: 'top-center',
        duration: 3000
      })
      return
    }

    // Check for duplicates
    if (formData.externalParticipants.some(p => 
      p.email === newExternalParticipant.email || 
      p.phone === newExternalParticipant.phone
    )) {
      toast.error('Duplicate email or phone')
      return
    }

    // Check if exists in database
    try {
      const response = await placeManagementAPI.getTableData('external_members', {
        is_deleted: 'false'
      })
      const data = Array.isArray(response) ? response : response.data || []
      
      const existing = data.find((m: any) => 
        m.email === newExternalParticipant.email || 
        m.phone === newExternalParticipant.phone
      )

      if (existing) {
        if (existing.is_blacklisted) {
          toast.error(`${existing.full_name} is blacklisted: ${existing.blacklist_reason}`)
          return
        }
        toast.info(`Using existing member: ${existing.full_name}`)
        selectExistingMember(existing)
        return
      }
    } catch (error) {
      console.error('Duplicate check failed:', error)
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

    toast.success('Added new participant')
  }

  const removeExternalParticipant = (id: string) => {
    console.log('═══════════════════════════════════════════════════════')
    console.log('🗑️ REMOVING EXTERNAL PARTICIPANT ID:', id)
    
    setFormData(prev => {
      console.log('   Previous externalParticipants:', prev.externalParticipants)
      console.log('   Length BEFORE:', prev.externalParticipants.length)
      
      const filtered = prev.externalParticipants.filter(p => {
        const keep = p.id !== id
        console.log(`   ${p.fullName} (${p.id}): ${keep ? 'KEEP' : 'REMOVE'}`)
        return keep
      })
      
      console.log('   Length AFTER:', filtered.length)
      console.log('   Filtered result:', filtered)
      
      const newState = {
        ...prev,
        externalParticipants: filtered
      }
      
      console.log('   Returning new state with', newState.externalParticipants.length, 'participants')
      console.log('═══════════════════════════════════════════════════════')
      
      return newState
    })
    
    setTimeout(() => {
      console.log('✅ State after update:', formData.externalParticipants.length)
    }, 100)
    
    toast.success('External participant removed', {
      position: 'top-center',
      duration: 2000
    })
  }

  // Refreshments management
  const addRefreshmentItem = (item: string) => {
    if (!formData.refreshments.items.includes(item)) {
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

  // Show loading screen while fetching booking data
  if (isLoadingBooking) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-[1600px]">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Loading booking data...</p>
            <p className="text-sm text-muted-foreground">Please wait</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error if booking not found
  if (loadError || !bookingId) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-[1600px]">
        <Alert className="border-red-500 mb-4">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">
            {loadError || "No booking ID provided"}
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/admin/bookings')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bookings
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/bookings')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bookings
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Update Booking</h1>
            <p className="text-muted-foreground">Modify the booking details and save changes</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="title">Booking Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Weekly Team Meeting"
                    required
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter booking description..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newDate = e.target.value
                      const today = new Date().toISOString().split('T')[0]
                      
                      if (newDate < today) {
                        toast.error('Cannot select past dates', {
                          position: 'top-center'
                        })
                        return
                      }
                      
                      // Reset place and time slots when date changes
                      setFormData({ 
                        ...formData, 
                        date: newDate, 
                        place: '', 
                        startTime: '', 
                        endTime: '' 
                      })
                      setSelectedTimeGap('')
                      setAvailableTimeGaps([])
                      
                      toast.info('Date changed. Please reselect place and time slot.', {
                        position: 'top-center',
                        duration: 3000
                      })
                    }}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    ⚠️ Changing date will reset place and time selection
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="place">Place *</Label>
                  <Select
                    value={formData.place}
                    onValueChange={(value) => {
                      setFormData({ 
                        ...formData, 
                        place: value, 
                        startTime: '', 
                        endTime: '' 
                      })
                      setSelectedTimeGap('')
                      setAvailableTimeGaps([])
                      toast.info('Place changed. Please reselect time slot.', {
                        position: 'top-center',
                        duration: 2000
                      })
                    }}
                    disabled={!formData.date || isLoadingPlaces}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !formData.date ? "Select date first" :
                        isLoadingPlaces ? "Loading places..." :
                        availablePlaces.length === 0 ? "No places available" :
                        "Select a place"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePlaces.map((place) => (
                        <SelectItem key={place.id} value={place.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{place.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {place.operatingHours} • Capacity: {place.capacity}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availablePlaces.length > 0 && formData.date && (
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
                      // Reset start/end times when selecting a new gap
                      setFormData({
                        ...formData,
                        startTime: '',
                        endTime: ''
                      })
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
                    <SelectContent className="max-h-[400px] w-full min-w-[600px]">
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
                            className="py-4 cursor-pointer"
                          >
                            <div className="flex items-center justify-between w-full gap-12 pr-8">
                              <span className="font-bold text-lg">{gap.start} - {gap.end}</span>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                Duration: {gap.duration}
                              </Badge>
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
                    <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-400 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-sm font-semibold text-green-900">Selected Available Slot Range</p>
                      </div>
                      <p className="text-xl font-bold text-green-800 mb-1">
                        {selectedTimeGap}
                      </p>
                      <p className="text-xs text-green-700">
                        Now choose your exact booking time within this range
                      </p>
                    </div>
                  )}
                </div>

                {/* Custom Start and End Time Selection */}
                {selectedTimeGap && (
                  <div className="col-span-2 grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="customStartTime" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Booking Start Time *
                      </Label>
                      {formData.startTime && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md mb-2">
                          <p className="text-sm font-medium text-green-900">
                            Current Start Time: <span className="font-bold text-lg">{formData.startTime}</span>
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            You can change it by selecting a new time below
                          </p>
                        </div>
                      )}
                      <Select
                        value={formData.startTime}
                        onValueChange={(value) => {
                          setFormData({
                            ...formData,
                            startTime: value,
                            endTime: '' // Reset end time when start changes
                          })
                        }}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder={
                            formData.startTime 
                              ? `Change from ${formData.startTime}` 
                              : "Select start time"
                          } />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {availableStartTimes.map((time) => (
                            <SelectItem key={time} value={time} className="py-3">
                              <span className="font-semibold">{time}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Choose any start time within the selected slot (30-min intervals)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customEndTime" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Booking End Time *
                      </Label>
                      {formData.endTime && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-md mb-2">
                          <p className="text-sm font-medium text-orange-900">
                            Current End Time: <span className="font-bold text-lg">{formData.endTime}</span>
                          </p>
                          <p className="text-xs text-orange-700 mt-1">
                            You can change it by selecting a new time below
                          </p>
                        </div>
                      )}
                      <Select
                        value={formData.endTime}
                        onValueChange={(value) => {
                          setFormData({
                            ...formData,
                            endTime: value
                          })
                        }}
                        disabled={!formData.startTime}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder={
                            !formData.startTime ? "Select start time first" : 
                            formData.endTime 
                              ? `Change from ${formData.endTime}`
                              : "Select end time"
                          } />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {availableEndTimes.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              Select start time first
                            </div>
                          ) : (
                            availableEndTimes.map((time) => {
                              const startMin = parseInt(formData.startTime.split(':')[0]) * 60 + parseInt(formData.startTime.split(':')[1])
                              const endMin = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1])
                              const durationMin = endMin - startMin
                              const hours = Math.floor(durationMin / 60)
                              const mins = durationMin % 60
                              const durationText = hours > 0 && mins > 0 ? `${hours}h ${mins}min` : 
                                                  hours > 0 ? `${hours}h` : `${mins}min`
                              
                              return (
                                <SelectItem key={time} value={time} className="py-3">
                                  <div className="flex items-center justify-between w-full gap-6">
                                    <span className="font-semibold">{time}</span>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                      {durationText}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              )
                            })
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Minimum duration: {minBookingDuration >= 60 ? `${minBookingDuration / 60}h` : `${minBookingDuration}min`}
                      </p>
                    </div>

                    {formData.startTime && formData.endTime && (
                      <div className="col-span-2 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-blue-700" />
                          <p className="text-sm font-semibold text-blue-900">Final Booking Time</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-800">
                          {formData.startTime} - {formData.endTime}
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          Duration: {(() => {
                            const startMin = parseInt(formData.startTime.split(':')[0]) * 60 + parseInt(formData.startTime.split(':')[1])
                            const endMin = parseInt(formData.endTime.split(':')[0]) * 60 + parseInt(formData.endTime.split(':')[1])
                            const durationMin = endMin - startMin
                            const hours = Math.floor(durationMin / 60)
                            const mins = durationMin % 60
                            return hours > 0 && mins > 0 ? `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes` : 
                                   hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''}` : `${mins} minutes`
                          })()}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Current Booking Times Display - At Bottom */}
              {formData.startTime && formData.endTime && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-lg shadow-sm mt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-900 mb-2">📅 Current Booking Schedule</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-xs text-gray-600">Start Time</p>
                            <p className="text-xl font-bold text-green-700">{formData.startTime}</p>
                          </div>
                        </div>
                        <div className="text-2xl text-purple-400">→</div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-orange-600" />
                          <div>
                            <p className="text-xs text-gray-600">End Time</p>
                            <p className="text-xl font-bold text-orange-700">{formData.endTime}</p>
                          </div>
                        </div>
                        <div className="ml-4 px-3 py-1 bg-purple-200 rounded-full">
                          <p className="text-sm font-semibold text-purple-800">
                            Duration: {(() => {
                              const startMin = parseInt(formData.startTime.split(':')[0]) * 60 + parseInt(formData.startTime.split(':')[1])
                              const endMin = parseInt(formData.endTime.split(':')[0]) * 60 + parseInt(formData.endTime.split(':')[1])
                              const durationMin = endMin - startMin
                              const hours = Math.floor(durationMin / 60)
                              const mins = durationMin % 60
                              return hours > 0 && mins > 0 ? `${hours}h ${mins}m` : 
                                     hours > 0 ? `${hours}h` : `${mins}m`
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Column - Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-semibold">{formData.date || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Place</p>
                <p className="font-semibold">
                  {availablePlaces.find(p => p.id === formData.place)?.name || '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Time</p>
                <p className="font-semibold">
                  {formData.startTime && formData.endTime ? 
                    `${formData.startTime} - ${formData.endTime}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Responsible Person</p>
                <p className="font-semibold">
                  {formData.responsiblePerson?.name || '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Participants</p>
                <p className="font-semibold">
                  {formData.selectedEmployees.length + formData.externalParticipants.length}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Refreshments</p>
                <p className="font-semibold">
                  {formData.refreshments.required ? 'Yes' : 'No'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Responsible Person Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Responsible Person *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Search for Responsible Person</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search admin or employee by name..."
                  value={responsibleSearch}
                  onChange={(e) => {
                    setResponsibleSearch(e.target.value)
                    setShowResponsibleDropdown(e.target.value.length > 0)
                  }}
                  onFocus={() => responsibleSearch.length > 0 && setShowResponsibleDropdown(true)}
                  className="pl-10"
                />
              </div>
            </div>

            {showResponsibleDropdown && responsibleSearch && (
              <div className="max-h-60 overflow-y-auto border rounded-md">
                {users
                  .filter(user =>
                    user.full_name.toLowerCase().includes(responsibleSearch.toLowerCase()) ||
                    user.email.toLowerCase().includes(responsibleSearch.toLowerCase())
                  )
                  .map(user => (
                    <div
                      key={user.id}
                      className="p-3 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => {
                        const person: Employee = {
                          id: user.id,
                          name: user.full_name,
                          email: user.email,
                          department: '',
                          role: user.role,
                          phone: ''
                        }
                        setFormData({ ...formData, responsiblePerson: person })
                        setResponsibleSearch("")
                        setShowResponsibleDropdown(false)
                      }}
                    >
                      <p className="font-medium text-sm">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user.email} • {user.role}</p>
                    </div>
                  ))}
              </div>
            )}

            {formData.responsiblePerson && (
              <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-primary">
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {formData.responsiblePerson.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{formData.responsiblePerson.name}</p>
                      <p className="text-xs text-muted-foreground">{formData.responsiblePerson.email}</p>
                      {formData.responsiblePerson.role && (
                        <Badge variant="outline" className="mt-1 text-xs capitalize">
                          {formData.responsiblePerson.role}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData({ ...formData, responsiblePerson: null })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {!formData.responsiblePerson && (
              <p className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">
                No responsible person assigned
              </p>
            )}
          </CardContent>
        </Card>

        {/* Participants Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Internal Participants */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Participants (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Search Employees</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {employeeSearch && (
                <div className="max-h-60 overflow-y-auto border rounded-md">
                  {users
                    .filter(user =>
                      user.full_name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                      user.email.toLowerCase().includes(employeeSearch.toLowerCase())
                    )
                    .filter(user => !formData.selectedEmployees.some(e => e.id === user.id))
                    .map(user => (
                      <div
                        key={user.id}
                        className="p-3 cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => selectEmployee(user)}
                      >
                        <p className="font-medium text-sm">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">{user.email} • {user.role}</p>
                      </div>
                    ))}
                </div>
              )}

              <div className="space-y-2">
                <Label>Selected Employees ({formData.selectedEmployees.length})</Label>
                {formData.selectedEmployees && formData.selectedEmployees.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2 font-medium">Name</th>
                          <th className="text-left p-2 font-medium">Email</th>
                          <th className="text-center p-2 font-medium w-16">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.selectedEmployees.map((employee, index) => (
                          <tr key={`emp-${index}-${employee.id}`} className="border-t hover:bg-muted/50">
                            <td className="p-2 font-medium">{employee.name || 'Unknown'}</td>
                            <td className="p-2 text-muted-foreground">{employee.email || ''}</td>
                            <td className="p-2 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  removeEmployee(employee.id)
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">
                    No employees selected
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* External Participants */}
          <Card>
            <CardHeader>
              <CardTitle>External Participants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Existing Members */}
              <div className="space-y-2 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <Label className="text-blue-900 font-semibold">🔍 Search Existing Members</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, phone, or company..."
                    value={memberSearch}
                    onChange={(e) => {
                      setMemberSearch(e.target.value)
                      searchExternalMembers(e.target.value)
                      setShowMemberDropdown(true)
                    }}
                    onFocus={() => memberSearch.length >= 2 && setShowMemberDropdown(true)}
                    className="pl-10"
                  />
                </div>
                {showMemberDropdown && searchedMembers.length > 0 && (
                  <div className="max-h-60 overflow-y-auto border rounded-md bg-white shadow-lg">
                    {searchedMembers.map(member => (
                      <div
                        key={member.id}
                        className="p-3 cursor-pointer hover:bg-blue-50 transition-colors border-b last:border-b-0"
                        onClick={() => selectExistingMember(member)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{member.full_name}</p>
                            <p className="text-xs text-muted-foreground">{member.email} • {member.phone}</p>
                            {member.company_name && (
                              <p className="text-xs text-blue-600">{member.company_name} • {member.designation}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="bg-green-50">
                            {member.visit_count} visits
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-blue-700">
                  💡 Search for existing members to auto-fill details
                </p>
              </div>

              {/* OR Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or Add New</span>
                </div>
              </div>

              {/* Add New Member Form */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={newExternalParticipant.fullName}
                    onChange={(e) => setNewExternalParticipant({...newExternalParticipant, fullName: e.target.value})}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newExternalParticipant.email}
                    onChange={(e) => setNewExternalParticipant({...newExternalParticipant, email: e.target.value})}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input
                    value={newExternalParticipant.phone}
                    onChange={(e) => setNewExternalParticipant({...newExternalParticipant, phone: e.target.value})}
                    placeholder="+1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reference Type *</Label>
                  <Select
                    value={newExternalParticipant.referenceType}
                    onValueChange={(value: any) => setNewExternalParticipant({...newExternalParticipant, referenceType: value})}
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
                  <Label>Reference Value *</Label>
                  <Input
                    value={newExternalParticipant.referenceValue}
                    onChange={(e) => setNewExternalParticipant({...newExternalParticipant, referenceValue: e.target.value})}
                    placeholder="Enter ID number"
                  />
                </div>
                <div className="col-span-2">
                  <Button type="button" onClick={addExternalParticipant} className="w-full">
                    Add External Participant
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Added External Participants ({formData.externalParticipants.length})</Label>
                {formData.externalParticipants && formData.externalParticipants.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2 font-medium">Name</th>
                          <th className="text-left p-2 font-medium">Contact</th>
                          <th className="text-center p-2 font-medium w-16">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.externalParticipants.map((participant, index) => (
                          <tr key={`ext-${index}-${participant.id}`} className="border-t hover:bg-muted/50">
                            <td className="p-2 font-medium">{participant.fullName || 'Unknown'}</td>
                            <td className="p-2 text-muted-foreground">
                              {participant.email}<br/>
                              <span className="text-xs">{participant.phone}</span>
                            </td>
                            <td className="p-2 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  removeExternalParticipant(participant.id)
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">
                    No external participants added
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Refreshments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              Refreshments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                className="h-4 w-4"
              />
              <Label htmlFor="refreshmentsRequired" className="cursor-pointer">
                Refreshments Required
              </Label>
            </div>

            {formData.refreshments.required && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.refreshments.type}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        refreshments: { ...formData.refreshments, type: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beverages">Beverages</SelectItem>
                      <SelectItem value="light_snacks">Light Snacks</SelectItem>
                      <SelectItem value="full_meal">Full Meal</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Serving Time</Label>
                  {formData.refreshments.servingTime && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mb-2">
                      <p className="text-sm font-medium text-blue-900">
                        Current Serving Time: <span className="font-bold text-lg">{formData.refreshments.servingTime}</span>
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        You can change it by selecting a new time below
                      </p>
                    </div>
                  )}
                  <Select
                    value={formData.refreshments.servingTime}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        refreshments: { ...formData.refreshments, servingTime: value },
                      })
                    }
                    disabled={servingTimeOptions.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        servingTimeOptions.length === 0 
                          ? "Select booking time first" 
                          : formData.refreshments.servingTime 
                            ? `Change from ${formData.refreshments.servingTime}`
                            : "Select serving time"
                      } />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {servingTimeOptions.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Select booking start and end time first
                        </div>
                      ) : (
                        servingTimeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {servingTimeOptions.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {servingTimeOptions.length} time options (15-min intervals, last: {servingTimeOptions[servingTimeOptions.length - 1]})
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Estimated Count</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.refreshments.estimatedCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        refreshments: { ...formData.refreshments, estimatedCount: parseInt(e.target.value) || 0 },
                      })
                    }
                  />
                </div>

                <div className="col-span-3 space-y-2">
                  <Label>Items</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.refreshments.items.map((item) => (
                      <Badge key={item} variant="secondary" className="flex items-center gap-1">
                        {item}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeRefreshmentItem(item)} />
                      </Badge>
                    ))}
                  </div>
                  <Select onValueChange={(value) => addRefreshmentItem(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Coffee">Coffee</SelectItem>
                      <SelectItem value="Tea">Tea</SelectItem>
                      <SelectItem value="Water">Water</SelectItem>
                      <SelectItem value="Juice">Juice</SelectItem>
                      <SelectItem value="Cookies">Cookies</SelectItem>
                      <SelectItem value="Sandwiches">Sandwiches</SelectItem>
                      <SelectItem value="Lunch">Lunch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-3 space-y-2">
                  <Label>Special Requests</Label>
                  <Textarea
                    value={formData.refreshments.specialRequests}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        refreshments: { ...formData.refreshments, specialRequests: e.target.value },
                      })
                    }
                    placeholder="Any special requirements..."
                    rows={2}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/bookings')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[200px]">
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Updating Booking...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Booking
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

