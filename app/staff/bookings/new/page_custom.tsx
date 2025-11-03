"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { RouteProtection } from "@/components/auth/route-protection"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Calendar, MapPin, Users, X, Search, Clock, Utensils, Save, Lock, CheckCircle } from "lucide-react"
import { placeManagementAPI } from "@/lib/place-management-api"
import toast from "react-hot-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface ExternalParticipant {
  id: string
  fullName: string
  email: string
  phone: string
  referenceType: "NIC" | "Passport" | "Employee ID"
  referenceValue: string
}

interface Employee {
  id: string
  name: string
  email: string
  department: string
  role: string
  phone: string
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

export default function StaffNewBookingPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  // Auto-set current user as responsible person (locked)
  const currentUserAsResponsible: Employee = {
    id: user?.id || '',
    name: user?.full_name || user?.email || '',
    email: user?.email || '',
    department: '',
    role: user?.role || 'staff',
    phone: ''
  }
  
  // Form Data State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    place: "",
    startTime: "",
    endTime: "",
    responsiblePerson: currentUserAsResponsible, // Auto-set and locked
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
  
  // Users State (only for employee participants, not responsible person)
  const [users, setUsers] = useState<any[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  
  // Bookings State (for conflict checking)
  const [existingBookings, setExistingBookings] = useState<Booking[]>([])
  
  // UI State
  const [employeeSearch, setEmployeeSearch] = useState("")
  
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

  // Fetch users on mount (for participants only)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true)
        const usersData = await placeManagementAPI.getTableData('userprofile', { limit: 200 })
        const usersArray = Array.isArray(usersData) ? usersData : []
        const filteredUsers = usersArray.filter((u: any) => u.role === 'admin' || u.role === 'employee' || u.role === 'staff')
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
          filters: [{ field: 'is_deleted', operator: '=', value: 0 }],
          limit: 200
        })
        const bookingsData: any[] = Array.isArray(bookingsResponse) ? bookingsResponse : []
        const transformedBookings: Booking[] = bookingsData.map((booking: any) => {
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
        const allPlaces = await placeManagementAPI.getPlaces({ isActive: true, limit: 100 })
        const configurationsResponse = await placeManagementAPI.getTableData('place_configuration', { limit: 100 })
        
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
        toast.error(error.message || 'Failed to load available places')
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

      const relevantBookings = existingBookings.filter(booking => {
        const placeMatches = booking.placeId ? booking.placeId === formData.place : booking.place === selectedPlace.name
        return booking.date === formData.date && placeMatches && booking.startTime && booking.endTime
      }).map(booking => ({
        start: timeToMinutes(booking.startTime),
        end: timeToMinutes(booking.endTime),
        title: booking.title
      })).sort((a, b) => a.start - b.start)

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
    const slotInterval = 30
    const minDuration = config.booking_slot_duration || 60
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
    const lastPossibleStart = gapEndMinutes - minDuration
    
    const startTimes: string[] = []
    for (let time = gapStartMinutes; time <= lastPossibleStart; time += slotInterval) {
      startTimes.push(minutesToTime(time))
    }

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
    const slotInterval = 30
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
    const interval = 15

    const servingTimes: string[] = []
    const lastServingTime = endMinutes - 15

    for (let time = startMinutes; time <= lastServingTime; time += interval) {
      servingTimes.push(minutesToTime(time))
    }

    setServingTimeOptions(servingTimes)

  }, [formData.startTime, formData.endTime])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.date || !formData.place || !formData.startTime || !formData.endTime) {
      toast.error('Please fill in all required fields')
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
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let refId = ''
        for (let i = 0; i < 6; i++) {
          refId += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return refId
      }

      const selectedPlace = availablePlaces.find(p => p.id === formData.place)
      const bookingId = generateUUID()
      const bookingRefId = generateBookingRefId()

      const bookingData = {
        id: bookingId,
        booking_ref_id: bookingRefId,
        title: formData.title,
        description: formData.description || null,
        booking_date: formData.date,
        start_time: formData.startTime + ':00',
        end_time: formData.endTime + ':00',
        place_id: formData.place,
        place_name: selectedPlace?.name || '',
        status: 'pending',
        responsible_person_id: formData.responsiblePerson.id,
        responsible_person_name: formData.responsiblePerson.name,
        responsible_person_email: formData.responsiblePerson.email,
        total_participants: formData.selectedEmployees.length + formData.externalParticipants.length,
        internal_participants: formData.selectedEmployees.length,
        external_participants: formData.externalParticipants.length,
        refreshments_required: formData.refreshments.required ? 1 : 0,
        refreshments_details: JSON.stringify(formData.refreshments),
        is_deleted: 0
      }

      await placeManagementAPI.insertRecord('bookings', bookingData)

      // Insert participants
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
        let memberId = participant.id

        try {
          const response = await placeManagementAPI.getTableData('external_members', { is_deleted: 'false' })
          const data = Array.isArray(response) ? response : response.data || []
          
          const existingMember = data.find((m: any) => m.email === participant.email || m.phone === participant.phone)

          if (existingMember) {
            memberId = existingMember.id
            await placeManagementAPI.updateRecord('external_members', { id: memberId }, {
              visit_count: (existingMember.visit_count || 0) + 1,
              last_visit_date: new Date().toISOString()
            })
          } else if (!participant.id.startsWith('existing_')) {
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
          }
        } catch (error) {
          console.error('Member check/create failed:', error)
        }

        await placeManagementAPI.insertRecord('external_participants', {
          id: generateUUID(),
          booking_id: bookingId,
          member_id: memberId,
          full_name: participant.fullName,
          email: participant.email,
          phone: participant.phone,
          reference_type: participant.referenceType,
          reference_value: participant.referenceValue,
          participation_status: 'invited'
        })
      }

      // Insert refreshments
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

      toast.success('Booking created successfully!')
      router.push('/staff/bookings')

    } catch (error: any) {
      console.error('Failed to create booking:', error)
      toast.error(error.message || 'Failed to create booking')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Employee search and selection
  const selectEmployee = (u: any) => {
    const employee: Employee = {
      id: u.id,
      name: u.full_name,
      email: u.email,
      department: '',
      role: u.role,
      phone: ''
    }
    setFormData({
      ...formData,
      selectedEmployees: [...formData.selectedEmployees, employee]
    })
    setEmployeeSearch("")
  }

  const removeEmployee = (employeeId: string) => {
    setFormData({
      ...formData,
      selectedEmployees: formData.selectedEmployees.filter(e => e.id !== employeeId)
    })
  }

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

  // External participant management
  const addExternalParticipant = async () => {
    if (!newExternalParticipant.fullName || !newExternalParticipant.phone || !newExternalParticipant.referenceValue) {
      toast.error("Please fill in all required fields")
      return
    }

    if (formData.externalParticipants.some(p => 
      p.email === newExternalParticipant.email || 
      p.phone === newExternalParticipant.phone
    )) {
      toast.error('Duplicate email or phone in participants')
      return
    }

    try {
      const response = await placeManagementAPI.getTableData('external_members', { is_deleted: 'false' })
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

    toast.success('Added new external participant')
  }

  const removeExternalParticipant = (id: string) => {
    setFormData({
      ...formData,
      externalParticipants: formData.externalParticipants.filter(p => p.id !== id)
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

  return (
    <RouteProtection requiredRole="staff">
      <div className="container mx-auto py-6 px-4 max-w-[1600px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/staff/bookings')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Create New Booking</h1>
              <p className="text-muted-foreground">Fill in the details to create a new booking</p>
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
                      onChange={(e) => setFormData({ ...formData, date: e.target.value, place: '', startTime: '', endTime: '' })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="place">Place *</Label>
                    <Select
                      value={formData.place}
                      onValueChange={(value) => setFormData({ ...formData, place: value, startTime: '', endTime: '' })}
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
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="timeSlot">Available Time Slots *</Label>
                    <Select
                      value={selectedTimeGap}
                      onValueChange={(value) => {
                        setSelectedTimeGap(value)
                        setFormData({ ...formData, startTime: '', endTime: '' })
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
                      <SelectContent className="max-h-[400px]">
                        {availableTimeGaps.map((gap) => (
                          <SelectItem 
                            key={`${gap.start}-${gap.end}`} 
                            value={`${gap.start} - ${gap.end}`}
                            className="py-4"
                          >
                            <div className="flex items-center justify-between w-full gap-12">
                              <span className="font-bold text-lg">{gap.start} - {gap.end}</span>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                Duration: {gap.duration}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Start and End Time Selection */}
                  {selectedTimeGap && (
                    <div className="col-span-2 grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="customStartTime">Start Time *</Label>
                        <Select
                          value={formData.startTime}
                          onValueChange={(value) => setFormData({ ...formData, startTime: value, endTime: '' })}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select start time" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {availableStartTimes.map((time) => (
                              <SelectItem key={time} value={time} className="py-3">
                                <span className="font-semibold">{time}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="customEndTime">End Time *</Label>
                        <Select
                          value={formData.endTime}
                          onValueChange={(value) => setFormData({ ...formData, endTime: value })}
                          disabled={!formData.startTime}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder={!formData.startTime ? "Select start time first" : "Select end time"} />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {availableEndTimes.map((time) => {
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
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
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
                    {formData.responsiblePerson.name}
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

          {/* Responsible Person Section - LOCKED */}
          <Card className="border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Users className="h-5 w-5" />
                Responsible Person (Auto-Assigned & Locked)
                <Lock className="h-4 w-4 ml-auto" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-white/80 border-2 border-green-300 rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-3 border-green-500">
                    <AvatarFallback className="bg-green-500 text-white font-bold text-lg">
                      {formData.responsiblePerson.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-green-900">{formData.responsiblePerson.name}</p>
                    <p className="text-sm text-green-700">{formData.responsiblePerson.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-green-600 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {formData.responsiblePerson.role.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-400">
                        <Lock className="h-3 w-3 mr-1" />
                        Cannot be changed
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-green-700 mt-3 text-center">
                ✅ You are automatically assigned as the responsible person and this cannot be changed.
              </p>
            </CardContent>
          </Card>

          {/* Participants Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Internal Participants */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Employee Participants (Optional)
                </CardTitle>
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
                      .filter(u =>
                        u.full_name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                        u.email.toLowerCase().includes(employeeSearch.toLowerCase())
                      )
                      .filter(u => !formData.selectedEmployees.some(e => e.id === u.id))
                      .map(u => (
                        <div
                          key={u.id}
                          className="p-3 cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => selectEmployee(u)}
                        >
                          <p className="font-medium text-sm">{u.full_name}</p>
                          <p className="text-xs text-muted-foreground">{u.email} • {u.role}</p>
                        </div>
                      ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Selected Employees ({formData.selectedEmployees.length})</Label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {formData.selectedEmployees.map((employee) => (
                      <div key={employee.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {employee.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{employee.name}</p>
                            <p className="text-xs text-muted-foreground">{employee.email}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEmployee(employee.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {formData.selectedEmployees.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No employees selected
                      </p>
                    )}
                  </div>
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
                      placeholder="Search by name, email, phone..."
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
                            </div>
                            <Badge variant="outline" className="bg-green-50">
                              {member.visit_count} visits
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* OR Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">Or Add New Member</span>
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
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {formData.externalParticipants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                        <div>
                          <p className="font-medium text-sm">{participant.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {participant.referenceType}: {participant.referenceValue} • {participant.phone}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExternalParticipant(participant.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {formData.externalParticipants.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No external participants added
                      </p>
                    )}
                  </div>
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
                            : "Select serving time"
                        } />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {servingTimeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
              onClick={() => router.push('/staff/bookings')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[200px]">
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Creating Booking...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Booking
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </RouteProtection>
  )
}



