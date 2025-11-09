"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Calendar, MapPin, Users, Clock, User, CalendarDays, Filter, Calendar as CalendarIcon, Trash2, Info, AlertTriangle, Plus, Edit, Loader2 } from "lucide-react"
import { placeManagementAPI } from "@/lib/place-management-api"
import toast from "react-hot-toast"
import { useAuth } from "@/lib/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

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
  booking_ref_id: string
  title: string
  description: string
  booking_date: string
  start_time: string
  end_time: string
  place_name: string
  status: string
  responsible_person_name: string
  responsible_person_email: string
  responsible_person_id: string
  total_participants: number
  created_at: string
  created_by?: string // User ID who created the booking
  cancellation?: BookingCancellation // Cancellation details if cancelled
}

export function StaffBookingManagement() {
  const router = useRouter()
  const { user } = useAuth()
  
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [todayBookings, setTodayBookings] = useState<Booking[]>([])
  const [myBookings, setMyBookings] = useState<Booking[]>([])
  const [invitedBookings, setInvitedBookings] = useState<Booking[]>([])
  
  const [filteredAll, setFilteredAll] = useState<Booking[]>([])
  const [filteredToday, setFilteredToday] = useState<Booking[]>([])
  const [filteredMy, setFilteredMy] = useState<Booking[]>([])
  const [filteredInvited, setFilteredInvited] = useState<Booking[]>([])
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [customDateFrom, setCustomDateFrom] = useState("")
  const [customDateTo, setCustomDateTo] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  
  // Cancellation state
  const [cancellationReason, setCancellationReason] = useState("")
  const [isCancellationDialog, setIsCancellationDialog] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null)
  const [isCancellationReasonDialogOpen, setIsCancellationReasonDialogOpen] = useState(false)
  const [selectedCancellation, setSelectedCancellation] = useState<BookingCancellation | null>(null)
  
  // Create/Edit Booking state
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [isSavingBooking, setIsSavingBooking] = useState(false)
  const [availablePlaces, setAvailablePlaces] = useState<any[]>([])
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false)
  const [bookingFormData, setBookingFormData] = useState({
    title: "",
    description: "",
    date: "",
    place: "",
    startTime: "",
    endTime: "",
  })

  // Load bookings
  useEffect(() => {
    loadBookings()
  }, [user])

  const loadBookings = async () => {
    try {
      setIsLoading(true)
      
      // Fetch all cancellations once (more efficient than per-booking)
      let allCancellations: any[] = []
      try {
        const cancellationsResponse = await placeManagementAPI.getTableData('booking_cancellations', {
          limit: 1000, // Get all cancellations
          sortBy: 'cancelled_at',
          sortOrder: 'desc'
        })
        console.log(`📦 All cancellations API response:`, cancellationsResponse)
        
        // Handle different response formats
        if (Array.isArray(cancellationsResponse)) {
          allCancellations = cancellationsResponse
        } else if (cancellationsResponse && cancellationsResponse.data && Array.isArray(cancellationsResponse.data)) {
          allCancellations = cancellationsResponse.data
        } else if (cancellationsResponse && cancellationsResponse.success && Array.isArray(cancellationsResponse.data)) {
          allCancellations = cancellationsResponse.data
        }
        
        console.log(`✅ Loaded ${allCancellations.length} cancellation records total`)
        if (allCancellations.length > 0) {
          console.log(`📋 Sample cancellation (first record):`, allCancellations[0])
          console.log(`📋 Sample cancellation (stringified):`, JSON.stringify(allCancellations[0], null, 2))
          console.log(`📋 Sample cancellation fields:`, Object.keys(allCancellations[0]))
          console.log(`📋 Sample cancellation_reason value:`, allCancellations[0].cancellation_reason)
          console.log(`📋 Sample cancellation_reason type:`, typeof allCancellations[0].cancellation_reason)
        }
      } catch (error) {
        console.error('❌ Error fetching all cancellations:', error)
      }
      
      const response = await placeManagementAPI.getTableData('bookings', {
        filters: [{ field: 'is_deleted', operator: '=', value: 0 }],
        limit: 500
      })
      
      const bookingsData: Booking[] = Array.isArray(response) ? response : []
      
      // Normalize dates and fetch cancellation data
      const normalizedBookings = await Promise.all(
        bookingsData.map(async (booking: any) => {
          let normalizedDate = booking.booking_date
          if (normalizedDate && typeof normalizedDate === 'string' && normalizedDate.includes('T')) {
            const d = new Date(normalizedDate)
            normalizedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          }
          
          // Find cancellation data from pre-fetched list
          let cancellationData: BookingCancellation | undefined = undefined
          if (booking.status === 'cancelled') {
            const bookingIdStr = String(booking.id).trim()
            console.log(`🔍 Looking for cancellation for booking ID: "${bookingIdStr}"`)
            console.log(`📊 Total cancellations available: ${allCancellations.length}`)
            
            // Log first few cancellations for debugging
            if (allCancellations.length > 0) {
              console.log(`📋 Sample cancellation records:`, allCancellations.slice(0, 3).map((c: any) => ({
                id: c.id,
                booking_id: c.booking_id,
                cancellation_reason: c.cancellation_reason?.substring(0, 50) || 'NO REASON',
                has_reason: !!c.cancellation_reason
              })))
            }
            
            // Find matching cancellation from pre-fetched list
            // Try multiple matching strategies
            const matchingCancellation = allCancellations.find((c: any) => {
              // Try different field names for booking_id
              const cBookingId = c.booking_id || c.bookingId || c.booking_id || ''
              const cancellationBookingIdStr = String(cBookingId).trim()
              
              // Exact match
              if (bookingIdStr === cancellationBookingIdStr) {
                console.log(`✅ Exact match found: "${bookingIdStr}" === "${cancellationBookingIdStr}"`)
                return true
              }
              
              // Case-insensitive match
              if (bookingIdStr.toLowerCase() === cancellationBookingIdStr.toLowerCase()) {
                console.log(`✅ Case-insensitive match found`)
                return true
              }
              
              // UUID format match (remove dashes and compare)
              const bookingIdNoDashes = bookingIdStr.replace(/-/g, '')
              const cancellationIdNoDashes = cancellationBookingIdStr.replace(/-/g, '')
              if (bookingIdNoDashes && cancellationIdNoDashes && bookingIdNoDashes === cancellationIdNoDashes) {
                console.log(`✅ UUID format match found`)
                return true
              }
              
              return false
            })
            
            if (matchingCancellation) {
              console.log(`✅ Found matching cancellation record:`, {
                id: matchingCancellation.id,
                booking_id: matchingCancellation.booking_id,
                cancellation_reason: matchingCancellation.cancellation_reason,
                cancellation_type: matchingCancellation.cancellation_type,
                all_fields: Object.keys(matchingCancellation),
                full_object: JSON.stringify(matchingCancellation, null, 2)
              })
              
              // DIRECTLY access cancellation_reason from the database response
              // Try all possible field name variations
              let reason = ''
              
              // First, try direct property access
              if (matchingCancellation.cancellation_reason !== undefined && matchingCancellation.cancellation_reason !== null) {
                reason = String(matchingCancellation.cancellation_reason)
              }
              // Try bracket notation
              else if (matchingCancellation['cancellation_reason'] !== undefined && matchingCancellation['cancellation_reason'] !== null) {
                reason = String(matchingCancellation['cancellation_reason'])
              }
              // Try camelCase
              else if (matchingCancellation.cancellationReason !== undefined && matchingCancellation.cancellationReason !== null) {
                reason = String(matchingCancellation.cancellationReason)
              }
              // Try lowercase
              else if (matchingCancellation['cancellation_reason'] !== undefined) {
                reason = String(matchingCancellation['cancellation_reason'])
              }
              
              // Log all possible field accesses
              console.log(`📋 Field access attempts:`, {
                'cancellation_reason': matchingCancellation.cancellation_reason,
                "['cancellation_reason']": matchingCancellation['cancellation_reason'],
                'cancellationReason': matchingCancellation.cancellationReason,
                'reason': matchingCancellation.reason,
                'all_keys': Object.keys(matchingCancellation),
                'final_extracted': reason
              })
              
              // Log the full object to see what we actually have
              console.log(`📋 FULL CANCELLATION OBJECT:`, JSON.stringify(matchingCancellation, null, 2))
              
              // Trim and validate the reason
              const finalReason = reason.trim()
              
              // Always create cancellation data if we found a match
              // Even if reason is empty, we still want to show the cancellation record
              cancellationData = {
                id: matchingCancellation.id || `temp-${booking.id}`,
                booking_id: matchingCancellation.booking_id || matchingCancellation.bookingId || booking.id,
                cancelled_by: matchingCancellation.cancelled_by || matchingCancellation.cancelledBy || 'unknown',
                cancellation_reason: finalReason || '', // Use the actual reason from database, or empty string
                cancellation_type: matchingCancellation.cancellation_type || matchingCancellation.cancellationType || 'user_cancelled',
                cancelled_at: matchingCancellation.cancelled_at || matchingCancellation.cancelledAt || new Date().toISOString()
              }
              
              console.log(`✅ Created cancellation data object:`, {
                id: cancellationData.id,
                booking_id: cancellationData.booking_id,
                cancellation_reason: cancellationData.cancellation_reason,
                cancellation_reason_length: cancellationData.cancellation_reason.length,
                cancellation_type: cancellationData.cancellation_type,
                full_object: JSON.stringify(cancellationData, null, 2)
              })
              
              if (!finalReason) {
                console.warn(`⚠️ Cancellation record found but reason is empty. Available fields:`, Object.keys(matchingCancellation))
                console.warn(`⚠️ Full cancellation object:`, JSON.stringify(matchingCancellation, null, 2))
              }
            } else {
              console.log(`⚠️ No matching cancellation found for booking ${bookingIdStr}`)
              console.log(`🔍 Searched in ${allCancellations.length} cancellation records`)
              if (allCancellations.length > 0) {
                console.log(`📋 Available booking_ids in cancellations:`, allCancellations.slice(0, 5).map((c: any) => c.booking_id || c.bookingId))
              }
              
              // Fallback: Check if cancellation_reason exists in bookings table
              if (booking.cancellation_reason && String(booking.cancellation_reason).trim()) {
                cancellationData = {
                  id: `temp-${booking.id}`,
                  booking_id: booking.id,
                  cancelled_by: booking.cancelled_by || 'unknown',
                  cancellation_reason: String(booking.cancellation_reason).trim(),
                  cancellation_type: 'admin_cancelled',
                  cancelled_at: booking.cancelled_at || booking.updated_at || new Date().toISOString()
                }
                console.log(`✅ Using fallback cancellation data from bookings table for ${booking.id}:`, cancellationData)
              }
            }
          }
          
          const bookingWithCancellation = {
            ...booking,
            booking_date: normalizedDate,
            cancellation: cancellationData
          }
          
          // Debug log to verify cancellation data is attached
          if (booking.status === 'cancelled') {
            console.log(`📋 Final booking object for ${booking.id}:`, {
              booking_id: booking.id,
              booking_status: booking.status,
              hasCancellation: !!bookingWithCancellation.cancellation,
              cancellation_id: bookingWithCancellation.cancellation?.id,
              cancellation_booking_id: bookingWithCancellation.cancellation?.booking_id,
              cancellationReason: bookingWithCancellation.cancellation?.cancellation_reason,
              cancellationReasonLength: bookingWithCancellation.cancellation?.cancellation_reason?.length,
              cancellationType: bookingWithCancellation.cancellation?.cancellation_type,
              full_cancellation_object: bookingWithCancellation.cancellation
            })
          }
          
          return bookingWithCancellation
        })
      )
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0]
      
      // All bookings
      setAllBookings(normalizedBookings)
      
      // Today's bookings
      const todayOnly = normalizedBookings.filter(b => b.booking_date === today)
      setTodayBookings(todayOnly)
      
      // My bookings (where current user is responsible person)
      const myOnly = normalizedBookings.filter(b => 
        b.responsible_person_id === user?.id || 
        b.responsible_person_email === user?.email
      )
      setMyBookings(myOnly)

      // Invited bookings (where current user is an internal participant)
      try {
        const participantsResponse = await placeManagementAPI.getTableData('booking_participants', {
          limit: 1000
        })
        const participants = Array.isArray(participantsResponse) ? participantsResponse : []

        const currentUserId = user?.id
        const currentUserEmail = user?.email

        const invitedBookingIdSet = new Set<string>(
          participants
            .filter((p: any) =>
              (currentUserId && p.employee_id === currentUserId) ||
              (currentUserEmail && p.employee_email === currentUserEmail)
            )
            .map((p: any) => p.booking_id)
        )

        const invitedOnly = normalizedBookings.filter(b => invitedBookingIdSet.has(b.id))
        setInvitedBookings(invitedOnly)
      } catch (e) {
        console.error('Failed to load booking participants:', e)
      }
      
      toast.success('Bookings loaded successfully')
    } catch (error) {
      console.error('Failed to load bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter bookings based on search, status, and date
  useEffect(() => {
    filterBookings(allBookings, setFilteredAll)
  }, [allBookings, searchTerm, statusFilter, dateFilter, customDateFrom, customDateTo])

  useEffect(() => {
    filterBookings(todayBookings, setFilteredToday)
  }, [todayBookings, searchTerm, statusFilter, dateFilter, customDateFrom, customDateTo])

  useEffect(() => {
    filterBookings(myBookings, setFilteredMy)
  }, [myBookings, searchTerm, statusFilter, dateFilter, customDateFrom, customDateTo])

  useEffect(() => {
    filterBookings(invitedBookings, setFilteredInvited)
  }, [invitedBookings, searchTerm, statusFilter, dateFilter, customDateFrom, customDateTo])

  const filterBookings = (bookings: Booking[], setFiltered: (b: Booking[]) => void) => {
    let filtered = [...bookings]
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(b =>
        b.title?.toLowerCase().includes(search) ||
        b.place_name?.toLowerCase().includes(search) ||
        b.responsible_person_name?.toLowerCase().includes(search) ||
        b.booking_ref_id?.toLowerCase().includes(search)
      )
    }
    
    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(b => b.status === statusFilter)
    }
    
    // Date filter
    if (dateFilter !== "all") {
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      switch (dateFilter) {
        case "today":
          filtered = filtered.filter(b => b.booking_date === today)
          break
        case "yesterday":
          filtered = filtered.filter(b => b.booking_date === yesterday)
          break
        case "last7days":
          filtered = filtered.filter(b => b.booking_date >= lastWeek)
          break
        case "last30days":
          filtered = filtered.filter(b => b.booking_date >= lastMonth)
          break
        case "custom":
          if (customDateFrom) {
            filtered = filtered.filter(b => b.booking_date >= customDateFrom)
          }
          if (customDateTo) {
            filtered = filtered.filter(b => b.booking_date <= customDateTo)
          }
          break
      }
    }
    
    setFiltered(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ''
    return timeString.substring(0, 5)
  }

  // Check if current user can cancel this booking
  const canCancelBooking = (booking: Booking): boolean => {
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return false
    }
    // User can only cancel bookings they created
    const canCancel = booking.created_by === user?.id
    console.log(`🔍 Can cancel booking ${booking.id}?`, {
      created_by: booking.created_by,
      user_id: user?.id,
      canCancel
    })
    return canCancel
  }

  const handleCancel = (id: string) => {
    // Find booking from any of the booking arrays
    const booking = allBookings.find(b => b.id === id) || 
                    todayBookings.find(b => b.id === id) ||
                    myBookings.find(b => b.id === id) ||
                    invitedBookings.find(b => b.id === id)
    
    if (!booking) return
    
    if (!canCancelBooking(booking)) {
      toast.error('You can only cancel bookings that you created', {
        position: 'top-center',
        duration: 3000,
        icon: '⚠️'
      })
      return
    }
    
    // Open cancellation reason dialog
    setBookingToCancel(id)
    setCancellationReason("")
    setIsCancellationDialog(true)
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

    // Find booking from any of the booking arrays
    const booking = allBookings.find(b => b.id === bookingToCancel) || 
                    todayBookings.find(b => b.id === bookingToCancel) ||
                    myBookings.find(b => b.id === bookingToCancel) ||
                    invitedBookings.find(b => b.id === bookingToCancel)
    if (!booking) return

    try {
      // Get current user ID
      const cancelledBy = user?.id || 'system'

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
        cancellation_type: 'user_cancelled',
        cancelled_at: new Date().toISOString()
      }

      await placeManagementAPI.insertRecord('booking_cancellations', cancellationData)
      
      // Reload bookings to get updated data
      await loadBookings()
      
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

  const handleShowCancellationReason = (booking: Booking) => {
    console.log(`🔍 handleShowCancellationReason called for booking ${booking.id}:`, {
      hasCancellation: !!booking.cancellation,
      cancellation: booking.cancellation,
      cancellation_reason: booking.cancellation?.cancellation_reason,
      cancellation_reason_type: typeof booking.cancellation?.cancellation_reason,
      cancellation_reason_length: booking.cancellation?.cancellation_reason?.length
    })
    
    if (booking.cancellation) {
      // Verify cancellation_reason exists and has value
      const reason = booking.cancellation.cancellation_reason || 
                   booking.cancellation['cancellation_reason'] ||
                   ''
      
      console.log(`📋 Extracted reason in handleShowCancellationReason:`, {
        original: booking.cancellation.cancellation_reason,
        extracted: reason,
        has_value: !!reason && String(reason).trim().length > 0
      })
      
      if (reason && String(reason).trim().length > 0) {
        // Ensure cancellation object has the reason
        const cancellationWithReason = {
          ...booking.cancellation,
          cancellation_reason: String(reason).trim()
        }
        console.log(`✅ Setting cancellation data with reason: "${cancellationWithReason.cancellation_reason}"`)
        setSelectedCancellation(cancellationWithReason)
        setIsCancellationReasonDialogOpen(true)
      } else {
        console.error(`❌ Cancellation data exists but reason is empty for booking ${booking.id}`)
        toast.error('Cancellation reason not available', {
          position: 'top-center',
          duration: 3000,
          icon: '⚠️'
        })
      }
    } else {
      console.error(`❌ No cancellation data found for booking ${booking.id}`)
      toast.error('Cancellation reason not found', {
        position: 'top-center',
        duration: 3000,
        icon: '⚠️'
      })
    }
  }

  // Fetch available places
  const fetchPlaces = async () => {
    try {
      setIsLoadingPlaces(true)
      const places = await placeManagementAPI.getPlaces({
        isActive: true,
        limit: 100
      })
      setAvailablePlaces(places)
    } catch (error) {
      console.error('Failed to fetch places:', error)
      toast.error('Failed to load places', {
        position: 'top-center',
        duration: 3000,
        icon: '❌'
      })
    } finally {
      setIsLoadingPlaces(false)
    }
  }

  // Load places when dialog opens
  useEffect(() => {
    if (isBookingDialogOpen) {
      fetchPlaces()
    }
  }, [isBookingDialogOpen])

  // Handle edit booking
  const handleEdit = async (booking: Booking) => {
    if (booking.status === "completed" || booking.status === "cancelled") {
      toast.error(`Cannot edit ${booking.status} bookings`, {
        position: 'top-center',
        duration: 3000,
        icon: '🚫'
      })
      return
    }

    // Check if user created this booking
    if (booking.created_by !== user?.id) {
      toast.error('You can only edit bookings that you created', {
        position: 'top-center',
        duration: 3000,
        icon: '⚠️'
      })
      return
    }

    // Fetch places first to find the place ID
    await fetchPlaces()
    
    // Find place ID by name
    const place = availablePlaces.find(p => p.name === booking.place_name)
    
    setEditingBooking(booking)
    setBookingFormData({
      title: booking.title,
      description: booking.description || "",
      date: booking.booking_date,
      place: place?.id || booking.place_name, // Use place ID if found, otherwise fallback to name
      startTime: booking.start_time.substring(0, 5),
      endTime: booking.end_time.substring(0, 5),
    })
    setIsBookingDialogOpen(true)
  }

  // Handle booking form submission
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!bookingFormData.title || !bookingFormData.date || !bookingFormData.place || !bookingFormData.startTime || !bookingFormData.endTime) {
      toast.error('Please fill in all required fields', {
        position: 'top-center',
        duration: 3000,
        icon: '⚠️'
      })
      return
    }

    setIsSavingBooking(true)

    try {
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0
          const v = c === 'x' ? r : (r & 0x3 | 0x8)
          return v.toString(16)
        })
      }

      const selectedPlace = availablePlaces.find(p => p.id === bookingFormData.place || p.name === bookingFormData.place)

      if (editingBooking) {
        // Update existing booking
        const updateData = {
          title: bookingFormData.title,
          description: bookingFormData.description || null,
          booking_date: bookingFormData.date,
          start_time: bookingFormData.startTime + ':00',
          end_time: bookingFormData.endTime + ':00',
          place_id: selectedPlace?.id || bookingFormData.place,
          place_name: selectedPlace?.name || bookingFormData.place,
          responsible_person_id: user?.id,
          responsible_person_name: user?.full_name || user?.email || 'Staff User',
          responsible_person_email: user?.email || '',
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
      } else {
        // Create new booking
        const bookingId = generateUUID()
        
        const newBookingData = {
          id: bookingId,
          title: bookingFormData.title,
          description: bookingFormData.description || null,
          booking_date: bookingFormData.date,
          start_time: bookingFormData.startTime + ':00',
          end_time: bookingFormData.endTime + ':00',
          place_id: selectedPlace?.id || bookingFormData.place,
          place_name: selectedPlace?.name || bookingFormData.place,
          status: 'pending',
          responsible_person_id: user?.id,
          responsible_person_name: user?.full_name || user?.email || 'Staff User',
          responsible_person_email: user?.email || '',
          total_participants: 0,
          internal_participants: 0,
          external_participants: 0,
          refreshments_required: 0,
          is_deleted: 0,
          created_by: user?.id, // Set created_by to current user
        }

        await placeManagementAPI.insertRecord('bookings', newBookingData)

        toast.success('Booking created successfully!', {
          position: 'top-center',
          duration: 3000,
          icon: '✅'
        })
      }

      setIsBookingDialogOpen(false)
      setEditingBooking(null)
      setBookingFormData({
        title: "",
        description: "",
        date: "",
        place: "",
        startTime: "",
        endTime: "",
      })
      
      // Reload bookings
      await loadBookings()
    } catch (error: any) {
      console.error('Failed to save booking:', error)
      toast.error(error.message || 'Failed to save booking', {
        position: 'top-center',
        duration: 4000,
        icon: '❌'
      })
    } finally {
      setIsSavingBooking(false)
    }
  }

  const BookingTable = ({ bookings }: { bookings: Booking[] }) => (
    <div className="border rounded-lg overflow-hidden">
      <div className="relative overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-gray-100 to-gray-200">
              <TableHead className="font-semibold min-w-[120px]">Ref ID</TableHead>
              <TableHead className="font-semibold min-w-[200px]">Title</TableHead>
              <TableHead className="font-semibold min-w-[180px]">Date & Time</TableHead>
              <TableHead className="font-semibold min-w-[150px]">Place</TableHead>
              <TableHead className="font-semibold min-w-[200px]">Responsible Person</TableHead>
              <TableHead className="text-center font-semibold min-w-[120px]">Participants</TableHead>
              <TableHead className="text-center font-semibold min-w-[120px]">Status</TableHead>
              <TableHead className="text-center font-semibold min-w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      </div>
      <div className="max-h-[450px] overflow-y-auto overflow-x-auto">
        <Table className="w-full">
          <TableBody>
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No bookings found
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking) => (
                <TableRow key={booking.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-mono text-xs min-w-[120px]">
                    <Badge variant="outline" className="bg-blue-50">
                      {booking.booking_ref_id}
                    </Badge>
                  </TableCell>
                  <TableCell className="min-w-[200px]">
                    <div>
                      <p className="font-semibold">{booking.title}</p>
                      {booking.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{booking.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[180px]">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{formatDate(booking.booking_date)}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{booking.place_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[200px]">
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{booking.responsible_person_name}</p>
                        <p className="text-xs text-muted-foreground">{booking.responsible_person_email}</p>
                        {booking.responsible_person_id === user?.id && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs mt-1">
                            You
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center min-w-[120px]">
                    <Badge variant="outline" className="bg-purple-50">
                      <Users className="h-3 w-3 mr-1" />
                      {booking.total_participants || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center min-w-[120px]">
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center min-w-[150px]">
                    <div className="flex items-center justify-center gap-2 min-h-[32px]">
                      {canCancelBooking(booking) && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(booking)}
                            disabled={booking.status === "completed" || booking.status === "cancelled"}
                            title={
                              booking.status === "completed" || booking.status === "cancelled"
                                ? "Cannot edit this booking"
                                : "Edit booking"
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancel(booking.id)}
                            className="text-red-600 hover:text-red-700 hover:border-red-600"
                            title="Cancel booking"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {booking.status === "cancelled" && (() => {
                        // Debug log for cancelled bookings
                        console.log(`🎯 Rendering Actions for cancelled booking ${booking.id}:`, {
                          hasCancellation: !!booking.cancellation,
                          cancellation: booking.cancellation,
                          reason: booking.cancellation?.cancellation_reason,
                          reasonLength: booking.cancellation?.cancellation_reason?.length
                        })
                        
                        if (booking.cancellation) {
                          const hasReason = booking.cancellation.cancellation_reason && 
                                           booking.cancellation.cancellation_reason.trim().length > 0
                          
                          if (hasReason) {
                            return (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleShowCancellationReason(booking)}
                                className="text-blue-600 hover:text-blue-700 hover:border-blue-600"
                                title={`View cancellation reason: ${booking.cancellation.cancellation_reason.substring(0, 50)}...`}
                              >
                                <Info className="h-4 w-4" />
                              </Button>
                            )
                          } else {
                            return (
                              <span className="text-xs text-muted-foreground" title="Cancellation record exists but reason is empty">
                                No reason
                              </span>
                            )
                          }
                        } else {
                          return (
                            <span className="text-xs text-muted-foreground" title="No cancellation record found">
                              No reason
                            </span>
                          )
                        }
                      })()}
                      {!canCancelBooking(booking) && booking.status !== "cancelled" && (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Booking Management</h2>
          <p className="text-muted-foreground">View and manage your bookings</p>
        </div>
        <Button 
          onClick={() => {
            setEditingBooking(null)
            setBookingFormData({
              title: "",
              description: "",
              date: "",
              place: "",
              startTime: "",
              endTime: "",
            })
            setIsBookingDialogOpen(true)
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
        >
          <Plus className="h-4 w-4" />
          Create New Booking
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bookings by title, place, or person..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Date Filters - Only show for My Bookings and Invited tabs */}
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Date Filter:</span>
              </div>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                  <SelectItem value="last30days">Last 30 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              
              {dateFilter === "custom" && (
                <div className="flex gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">From:</label>
                    <Input
                      type="date"
                      value={customDateFrom}
                      onChange={(e) => setCustomDateFrom(e.target.value)}
                      className="w-[140px]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">To:</label>
                    <Input
                      type="date"
                      value={customDateTo}
                      onChange={(e) => setCustomDateTo(e.target.value)}
                      className="w-[140px]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs with Booking Tables */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-[800px]">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            All Bookings ({filteredAll.length})
          </TabsTrigger>
          <TabsTrigger value="today" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Today ({filteredToday.length})
          </TabsTrigger>
          <TabsTrigger value="my" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            My Bookings ({filteredMy.length})
          </TabsTrigger>
          <TabsTrigger value="invited" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Invited ({filteredInvited.length})
          </TabsTrigger>
        </TabsList>

        {/* All Bookings Tab */}
        <TabsContent value="all">
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                All Bookings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading bookings...</p>
                </div>
              ) : (
                <BookingTable bookings={filteredAll} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Today's Bookings Tab */}
        <TabsContent value="today">
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-green-600" />
                Today's Bookings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading bookings...</p>
                </div>
              ) : (
                <BookingTable bookings={filteredToday} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Bookings Tab */}
        <TabsContent value="my">
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-orange-600" />
                My Bookings (Where I'm Responsible)
                <Badge variant="outline" className="ml-auto bg-blue-50 text-blue-700 border-blue-300">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  Date Filter Available
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading bookings...</p>
                </div>
              ) : (
                <BookingTable bookings={filteredMy} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invited Bookings Tab */}
        <TabsContent value="invited">
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-sky-50">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Invited Bookings (Where I'm a Participant)
                <Badge variant="outline" className="ml-auto bg-blue-50 text-blue-700 border-blue-300">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  Date Filter Available
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading bookings...</p>
                </div>
              ) : (
                <BookingTable bookings={filteredInvited} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                      {(() => {
                        // Directly access the cancellation_reason field
                        const reason = selectedCancellation.cancellation_reason || 
                                     selectedCancellation['cancellation_reason'] ||
                                     ''
                        
                        // Log what we're displaying
                        console.log(`🎨 Displaying cancellation reason:`, {
                          cancellation_reason: selectedCancellation.cancellation_reason,
                          bracket_access: selectedCancellation['cancellation_reason'],
                          final_reason: reason,
                          all_keys: Object.keys(selectedCancellation),
                          full_object: JSON.stringify(selectedCancellation, null, 2)
                        })
                        
                        return reason || 'No reason provided'
                      })()}
                    </p>
                  </div>
                  {/* Debug info - remove in production */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-muted-foreground mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <strong>Debug Info:</strong>
                      <pre className="text-xs mt-1 overflow-auto">
                        {JSON.stringify({
                          has_reason: !!selectedCancellation.cancellation_reason,
                          reason: selectedCancellation.cancellation_reason,
                          reason_type: typeof selectedCancellation.cancellation_reason,
                          bracket_reason: selectedCancellation['cancellation_reason'],
                          all_keys: Object.keys(selectedCancellation),
                          full_object: selectedCancellation
                        }, null, 2)}
                      </pre>
                    </div>
                  )}
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

      {/* Create/Edit Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBooking ? "Edit Booking" : "Create New Booking"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBookingSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="booking-title">Booking Title *</Label>
                <Input
                  id="booking-title"
                  value={bookingFormData.title}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, title: e.target.value })}
                  placeholder="Enter booking title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking-date">Date *</Label>
                <Input
                  id="booking-date"
                  type="date"
                  value={bookingFormData.date}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="booking-description">Description</Label>
              <Textarea
                id="booking-description"
                value={bookingFormData.description}
                onChange={(e) => setBookingFormData({ ...bookingFormData, description: e.target.value })}
                placeholder="Enter booking description (optional)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="booking-place">Place *</Label>
              {isLoadingPlaces ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading places...
                </div>
              ) : (
                <Select
                  value={bookingFormData.place}
                  onValueChange={(value) => setBookingFormData({ ...bookingFormData, place: value })}
                  required
                >
                  <SelectTrigger id="booking-place">
                    <SelectValue placeholder="Select a place" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlaces.map((place) => (
                      <SelectItem key={place.id} value={place.id}>
                        {place.name} {place.city ? `- ${place.city}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="booking-start-time">Start Time *</Label>
                <Input
                  id="booking-start-time"
                  type="time"
                  value={bookingFormData.startTime}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking-end-time">End Time *</Label>
                <Input
                  id="booking-end-time"
                  type="time"
                  value={bookingFormData.endTime}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsBookingDialogOpen(false)
                  setEditingBooking(null)
                  setBookingFormData({
                    title: "",
                    description: "",
                    date: "",
                    place: "",
                    startTime: "",
                    endTime: "",
                  })
                }}
                disabled={isSavingBooking}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingBooking}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isSavingBooking ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingBooking ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  editingBooking ? "Update Booking" : "Create Booking"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

