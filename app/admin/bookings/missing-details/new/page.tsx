"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ArrowLeft, Calendar, MapPin, Users, X, Search, Clock, Save, Edit, Plus } from "lucide-react"
import { placeManagementAPI } from "@/lib/place-management-api"
import toast from "react-hot-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { RouteProtection } from "@/components/auth/route-protection"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useAuth } from "@/lib/auth-context"
import { sanitizeInput, sanitizeObject } from "@/lib/validation"

interface ExternalParticipant {
  id: string
  fullName: string
  email: string
  phone: string
  referenceType: "NIC" | "Passport" | "Employee ID"
  referenceValue: string
  memberId?: string // If existing member
  inTime?: string // DateTime format: YYYY-MM-DDTHH:mm
  outTime?: string // DateTime format: YYYY-MM-DDTHH:mm
  visitorPassId?: string
  passTypeId?: string
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

interface PassType {
  id: string
  name: string
  code: string
  is_active: boolean
}

export default function MissingBookingDetailsNewPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  // Form Data State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    place: "",
    startTime: "",
    endTime: "",
    responsiblePerson: null as Employee | null,
    externalParticipants: [] as ExternalParticipant[],
  })

  // Available Places State
  const [availablePlaces, setAvailablePlaces] = useState<Place[]>([])
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false)
  
  // Users State
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  
  // Pass Types State
  const [passTypes, setPassTypes] = useState<PassType[]>([])
  
  // UI State
  const [responsibleSearch, setResponsibleSearch] = useState("")
  const [showResponsibleDropdown, setShowResponsibleDropdown] = useState(false)
  
  // External Member Search state
  const [memberSearch, setMemberSearch] = useState("")
  const [searchedMembers, setSearchedMembers] = useState<any[]>([])
  const [showMemberDropdown, setShowMemberDropdown] = useState(false)
  
  // External Member Edit state
  const [isEditMemberDialogOpen, setIsEditMemberDialogOpen] = useState(false)
  const [editingExternalMember, setEditingExternalMember] = useState<ExternalParticipant | null>(null)
  const [editingMemberFormData, setEditingMemberFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    reference_type: "NIC",
    reference_value: "",
    in_time: "",
    out_time: "",
    visitor_pass_id: "",
    pass_type_id: ""
  })
  const [isUpdatingMember, setIsUpdatingMember] = useState(false)
  
  // Confirmation Dialog State
  const [isCancelConfirmDialogOpen, setIsCancelConfirmDialogOpen] = useState(false)
  const [isCreateConfirmDialogOpen, setIsCreateConfirmDialogOpen] = useState(false)
  const [shouldSubmitForm, setShouldSubmitForm] = useState(false)
  
  const [newExternalParticipant, setNewExternalParticipant] = useState({
    fullName: "",
    email: "",
    phone: "",
    referenceType: "NIC" as "NIC" | "Passport" | "Employee ID",
    referenceValue: "",
    visitorPassId: "",
    inTime: "",
    outTime: "",
    passTypeId: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load places
  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        setIsLoadingPlaces(true)
        const placesData = await placeManagementAPI.getTableData('places', {
          is_deleted: 'false',
          is_active: 'true'
        })
        
        const placesArray = Array.isArray(placesData) ? placesData : placesData?.data || []
        setAvailablePlaces(placesArray)
      } catch (error) {
        console.error('Failed to fetch places:', error)
      } finally {
        setIsLoadingPlaces(false)
      }
    }
    
    fetchPlaces()
  }, [])

  // Load pass types
  useEffect(() => {
    const fetchPassTypes = async () => {
      try {
        const passTypesData = await placeManagementAPI.getTableData('pass_types', {
          is_deleted: 'false',
          is_active: 'true'
        })
        
        const passTypesArray = Array.isArray(passTypesData) ? passTypesData : passTypesData?.data || []
        setPassTypes(passTypesArray)
      } catch (error) {
        console.error('Failed to fetch pass types:', error)
      }
    }
    
    fetchPassTypes()
  }, [])

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true)
        const usersData = await placeManagementAPI.getTableData('userprofile', {
          limit: 200
        })
        
        const usersArray = Array.isArray(usersData) ? usersData : []
        setUsers(usersArray)
      } catch (error) {
        console.error('Failed to fetch users:', error)
      } finally {
        setIsLoadingUsers(false)
      }
    }
    
    fetchUsers()
  }, [])

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
      
      // Filter by email, phone, or name
      const filtered = data.filter((member: any) =>
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone?.includes(searchTerm) ||
        member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10) // Limit to 10 results
      
      setSearchedMembers(filtered)
    } catch (error) {
      console.error('Failed to search members:', error)
    }
  }

  // Select existing member
  const selectExistingMember = (member: any) => {
    const participant: ExternalParticipant = {
      id: member.id,
      fullName: member.full_name,
      email: member.email || '',
      phone: member.phone || '',
      referenceType: member.reference_type || 'NIC',
      referenceValue: member.reference_value || '',
      memberId: member.id,
      // Allow user to add Pass ID, In-Time, Out-Time after selecting
      visitorPassId: undefined,
      inTime: undefined,
      outTime: undefined,
      passTypeId: undefined
    }
    
    // Check if already added
    const isDuplicate = formData.externalParticipants.some(
      p => (p.memberId && p.memberId === member.id) || 
           (p.email && p.email.toLowerCase() === member.email?.toLowerCase()) ||
           p.phone === member.phone
    )
    
    if (isDuplicate) {
      toast.error('This member is already added', { position: 'top-center' })
      return
    }
    
    setFormData({
      ...formData,
      externalParticipants: [...formData.externalParticipants, participant]
    })
    setMemberSearch("")
    setShowMemberDropdown(false)
    setSearchedMembers([])
    toast.success('Member added. Please click "Edit Details" to add Pass ID, In-Time, and Out-Time', {
      position: 'top-center',
      duration: 3000
    })
  }

  // Add new external participant
  const addExternalParticipant = () => {
    if (!newExternalParticipant.fullName.trim() || !newExternalParticipant.phone.trim() || !newExternalParticipant.referenceValue.trim()) {
      toast.error('Please fill in all required fields (Name, Phone, Reference)', {
        position: 'top-center'
      })
      return
    }

    // Check for duplicates
    const isDuplicate = formData.externalParticipants.some(
      p => (p.email && p.email.toLowerCase() === newExternalParticipant.email.toLowerCase()) ||
           p.phone === newExternalParticipant.phone ||
           (p.referenceValue === newExternalParticipant.referenceValue && p.referenceType === newExternalParticipant.referenceType)
    )

    if (isDuplicate) {
      toast.error('This participant is already added', { position: 'top-center' })
      return
    }

    const participant: ExternalParticipant = {
      id: `temp-${Date.now()}-${Math.random()}`,
      fullName: newExternalParticipant.fullName.trim(),
      email: newExternalParticipant.email.trim(),
      phone: newExternalParticipant.phone.trim(),
      referenceType: newExternalParticipant.referenceType,
      referenceValue: newExternalParticipant.referenceValue.trim(),
      visitorPassId: newExternalParticipant.visitorPassId.trim() || undefined,
      inTime: newExternalParticipant.inTime || undefined,
      outTime: newExternalParticipant.outTime || undefined,
      passTypeId: newExternalParticipant.passTypeId || undefined,
    }

    setFormData({
      ...formData,
      externalParticipants: [...formData.externalParticipants, participant]
    })

    // Reset form
    setNewExternalParticipant({
      fullName: "",
      email: "",
      phone: "",
      referenceType: "NIC",
      referenceValue: "",
      visitorPassId: "",
      inTime: "",
      outTime: "",
      passTypeId: ""
    })
  }

  // Remove external participant
  const removeExternalParticipant = (participantId: string) => {
    setFormData({
      ...formData,
      externalParticipants: formData.externalParticipants.filter(p => p.id !== participantId)
    })
  }

  // Edit external participant (for in-time/out-time/pass)
  const editExternalParticipant = (participant: ExternalParticipant) => {
    setEditingExternalMember(participant)
    setEditingMemberFormData({
      full_name: participant.fullName,
      email: participant.email,
      phone: participant.phone,
      reference_type: participant.referenceType,
      reference_value: participant.referenceValue,
      in_time: participant.inTime || '',
      out_time: participant.outTime || '',
      visitor_pass_id: participant.visitorPassId || '',
      pass_type_id: participant.passTypeId || ''
    })
    setIsEditMemberDialogOpen(true)
  }

  // Update external participant
  const handleUpdateExternalMember = async () => {
    if (!editingExternalMember) return

    const updatedParticipants = formData.externalParticipants.map(p => {
      if (p.id === editingExternalMember.id) {
        return {
          ...p,
          inTime: editingMemberFormData.in_time || undefined,
          outTime: editingMemberFormData.out_time || undefined,
          visitorPassId: editingMemberFormData.visitor_pass_id || undefined,
          passTypeId: editingMemberFormData.pass_type_id || undefined
        }
      }
      return p
    })

    setFormData({
      ...formData,
      externalParticipants: updatedParticipants
    })

    setIsEditMemberDialogOpen(false)
    setEditingExternalMember(null)
    toast.success('Participant details updated', { position: 'top-center' })
  }

  // Select responsible person
  const selectResponsiblePerson = (user: UserProfile) => {
    const employee: Employee = {
      id: user.id,
      name: user.full_name,
      email: user.email,
      department: '',
      role: user.role,
      phone: ''
    }
    setFormData({
      ...formData,
      responsiblePerson: employee
    })
    setResponsibleSearch("")
    setShowResponsibleDropdown(false)
  }

  // Handle form submission - NO VALIDATION
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // If confirmation dialog should be shown, show it instead of submitting
    if (!shouldSubmitForm) {
      setIsCreateConfirmDialogOpen(true)
      return
    }
    
    // Reset the flag for next time
    setShouldSubmitForm(false)

    try {
      setIsSubmitting(true)
      console.log('✅ Creating missing booking record...')

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

      console.log('📝 Generated Booking Reference ID:', bookingRefId)

      // Get current time in Sri Lanka timezone
      const getSriLankaTimestamp = (): string => {
        const now = new Date()
        const sriLankaTime = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Colombo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).formatToParts(now)
        
        const year = parseInt(sriLankaTime.find(p => p.type === 'year')?.value || '0')
        const month = parseInt(sriLankaTime.find(p => p.type === 'month')?.value || '0')
        const day = parseInt(sriLankaTime.find(p => p.type === 'day')?.value || '0')
        const hour = parseInt(sriLankaTime.find(p => p.type === 'hour')?.value || '0')
        const minute = parseInt(sriLankaTime.find(p => p.type === 'minute')?.value || '0')
        const second = parseInt(sriLankaTime.find(p => p.type === 'second')?.value || '0')
        
        const sriLankaDate = new Date(year, month - 1, day, hour, minute, second)
        const offsetMs = (5 * 60 + 30) * 60 * 1000
        const utcDate = new Date(sriLankaDate.getTime() - offsetMs)
        
        const utcYear = utcDate.getUTCFullYear()
        const utcMonth = String(utcDate.getUTCMonth() + 1).padStart(2, '0')
        const utcDay = String(utcDate.getUTCDate()).padStart(2, '0')
        const utcHour = String(utcDate.getUTCHours()).padStart(2, '0')
        const utcMinute = String(utcDate.getUTCMinutes()).padStart(2, '0')
        const utcSecond = String(utcDate.getUTCSeconds()).padStart(2, '0')
        
        return `${utcYear}-${utcMonth}-${utcDay} ${utcHour}:${utcMinute}:${utcSecond}`
      }

      // Create booking - NO VALIDATION, marked as missing booking
      const bookingData = sanitizeObject({
        id: bookingId,
        booking_ref_id: bookingRefId,
        title: sanitizeInput(formData.title),
        description: sanitizeInput(formData.description) || null,
        booking_date: formData.date || null,
        start_time: formData.startTime ? formData.startTime + ':00' : null,
        end_time: formData.endTime ? formData.endTime + ':00' : null,
        place_id: formData.place || null,
        place_name: sanitizeInput(selectedPlace?.name || ''),
        status: 'pending',
        responsible_person_id: formData.responsiblePerson?.id || null,
        responsible_person_name: sanitizeInput(formData.responsiblePerson?.name || '') || null,
        is_missing_booking: 1, // Mark as missing booking record
        created_at: getSriLankaTimestamp(),
        created_by: user?.id || null
      })

      await placeManagementAPI.insertRecord('bookings', bookingData)
      console.log('✅ Missing booking record created:', bookingId)

      // Insert external participants with visit times
      let hasExternalParticipants = false
      for (const participant of formData.externalParticipants) {
        let memberId = participant.memberId || participant.id

        // Check if member exists or create new
        try {
          const response = await placeManagementAPI.getTableData('external_members', {
            limit: 500
          })
          const data = Array.isArray(response) ? response : response.data || []
          
          const existingMember = data.find((m: any) => 
            !m.is_deleted && (
              (participant.email && m.email && m.email.toLowerCase() === participant.email.toLowerCase()) || 
              m.phone === participant.phone
            )
          )

          if (existingMember) {
            memberId = existingMember.id
            await placeManagementAPI.updateRecord('external_members', { id: memberId }, {
              visit_count: (existingMember.visit_count || 0) + 1,
              last_visit_date: getSriLankaTimestamp()
            })
          } else {
            // Create new member
            memberId = generateUUID()
            const memberData = sanitizeObject({
              id: memberId,
              full_name: sanitizeInput(participant.fullName),
              email: (participant.email || '').toLowerCase().trim(),
              phone: participant.phone.trim(),
              reference_type: participant.referenceType,
              reference_value: sanitizeInput(participant.referenceValue),
              visit_count: 1,
              last_visit_date: getSriLankaTimestamp(),
              is_active: true,
              is_deleted: false,
              is_blacklisted: false,
              created_at: getSriLankaTimestamp()
            })
            await placeManagementAPI.insertRecord('external_members', memberData)
          }
        } catch (error) {
          console.error('❌ Member check/create failed:', error)
          throw error
        }

        // Create external participant record
        const participantId = generateUUID()
        const participantData = sanitizeObject({
          id: participantId,
          booking_id: bookingId,
          member_id: memberId,
          full_name: sanitizeInput(participant.fullName),
          email: participant.email,
          phone: participant.phone,
          reference_type: participant.referenceType,
          reference_value: sanitizeInput(participant.referenceValue),
          visitor_pass_id: participant.visitorPassId || null,
          participation_status: 'invited'
        })
        
        await placeManagementAPI.insertRecord('external_participants', participantData)

        // Create visit times record if in-time or out-time provided
        if (participant.inTime || participant.outTime || participant.visitorPassId) {
          const visitTimeId = generateUUID()
          const visitTimeData = sanitizeObject({
            id: visitTimeId,
            booking_id: bookingId,
            external_participant_id: participantId,
            member_id: memberId,
            in_time: participant.inTime ? new Date(participant.inTime).toISOString().slice(0, 19).replace('T', ' ') : null,
            out_time: participant.outTime ? new Date(participant.outTime).toISOString().slice(0, 19).replace('T', ' ') : null,
            visitor_pass_id: participant.visitorPassId || null,
            pass_type_id: participant.passTypeId || null,
            created_at: getSriLankaTimestamp(),
            created_by: user?.id || null
          })
          
          await placeManagementAPI.insertRecord('external_member_visit_times', visitTimeData)
          console.log('✅ Visit times created for:', participant.fullName)
        }

        hasExternalParticipants = true
      }

      // Update booking with has_external_participants flag
      if (hasExternalParticipants) {
        await placeManagementAPI.updateRecord('bookings', { id: bookingId }, {
          has_external_participants: true
        })
      }

      toast.success('Missing booking record created successfully!', {
        position: 'top-center',
        duration: 3000,
        icon: '✅'
      })

      // Redirect to missing bookings list
      router.push('/admin/bookings/missing-details')

    } catch (error: any) {
      console.error('Failed to create missing booking:', error)
      toast.error(error.message || 'Failed to create missing booking record', {
        position: 'top-center',
        duration: 4000,
        icon: '❌'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(responsibleSearch.toLowerCase()) ||
    user.email?.toLowerCase().includes(responsibleSearch.toLowerCase())
  ).slice(0, 10)

  return (
    <RouteProtection allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="space-y-4 px-2 sm:px-4 max-w-[98vw] mx-auto dark:bg-background">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/bookings/missing-details')}
                className="dark:border-border dark:hover:bg-muted dark:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold dark:text-foreground">Create Missing Booking Record</h1>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                  Record completed bookings with Pass ID, In-Time, and Out-Time. 
                  <span className="font-semibold text-green-600 dark:text-green-400 ml-1">
                    These records are separate and will NOT affect real bookings.
                  </span>
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Basic Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <Card className="dark:bg-card dark:border-border shadow-md">
                  <CardHeader className="dark:border-border/50">
                    <CardTitle className="dark:text-foreground">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 dark:bg-card">
                    <div>
                      <Label htmlFor="title" className="dark:text-foreground">Booking Name *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter booking name"
                        className="dark:bg-card dark:border-border dark:text-foreground"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description" className="dark:text-foreground">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Enter description"
                        rows={4}
                        className="dark:bg-card dark:border-border dark:text-foreground"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="place" className="dark:text-foreground">Place</Label>
                        <Select
                          value={formData.place}
                          onValueChange={(value) => setFormData({ ...formData, place: value })}
                        >
                          <SelectTrigger className="dark:bg-card dark:border-border dark:text-foreground">
                            <SelectValue placeholder="Select place" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-card dark:border-border">
                            {availablePlaces.map((place) => (
                              <SelectItem key={place.id} value={place.id} className="dark:text-foreground dark:hover:bg-muted">
                                {place.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="date" className="dark:text-foreground">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="dark:bg-card dark:border-border dark:text-foreground"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startTime" className="dark:text-foreground">Start Time</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                          className="dark:bg-card dark:border-border dark:text-foreground"
                        />
                      </div>

                      <div>
                        <Label htmlFor="endTime" className="dark:text-foreground">End Time</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={formData.endTime}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                          className="dark:bg-card dark:border-border dark:text-foreground"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Responsible Person */}
                <Card className="dark:bg-card dark:border-border shadow-md">
                  <CardHeader className="dark:border-border/50">
                    <CardTitle className="dark:text-foreground">Responsible Person</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 dark:bg-card">
                    <div className="relative">
                      <Label htmlFor="responsibleSearch" className="dark:text-foreground">Search Responsible Person</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="responsibleSearch"
                          value={responsibleSearch}
                          onChange={(e) => {
                            setResponsibleSearch(e.target.value)
                            setShowResponsibleDropdown(true)
                          }}
                          onFocus={() => setShowResponsibleDropdown(true)}
                          placeholder="Search by name or email"
                          className="pl-10 dark:bg-card dark:border-border dark:text-foreground"
                        />
                      </div>
                      
                      {showResponsibleDropdown && responsibleSearch && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-card border rounded-lg shadow-lg max-h-60 overflow-y-auto dark:border-border">
                          {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                              <div
                                key={user.id}
                                onClick={() => selectResponsiblePerson(user)}
                                className="p-3 hover:bg-gray-100 dark:hover:bg-muted cursor-pointer border-b dark:border-border last:border-b-0"
                              >
                                <p className="font-medium dark:text-foreground">{user.full_name}</p>
                                <p className="text-sm text-muted-foreground dark:text-muted-foreground">{user.email}</p>
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-muted-foreground dark:text-muted-foreground">No users found</div>
                          )}
                        </div>
                      )}
                    </div>

                    {formData.responsiblePerson && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-muted rounded-lg border dark:border-border">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="dark:bg-primary/20 dark:text-primary">
                              {formData.responsiblePerson.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium dark:text-foreground">{formData.responsiblePerson.name}</p>
                            <p className="text-sm text-muted-foreground dark:text-muted-foreground">{formData.responsiblePerson.email}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData({ ...formData, responsiblePerson: null })}
                          className="dark:hover:bg-muted"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* External Participants */}
                <Card className="dark:bg-card dark:border-border shadow-md">
                  <CardHeader className="dark:border-border/50">
                    <CardTitle className="flex items-center gap-2 dark:text-foreground">
                      <Users className="h-5 w-5" />
                      External Participants
                    </CardTitle>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-2">
                      <span className="font-semibold text-amber-600 dark:text-amber-500">Note:</span> This is for recording completed bookings. 
                      Please add <span className="font-semibold">Pass ID, In-Time, and Out-Time</span> for each participant. 
                      These records are separate and will <span className="font-semibold text-green-600 dark:text-green-500">NOT affect real bookings</span>.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4 dark:bg-card">
                    {/* Search Existing Members */}
                    <div className="relative">
                      <Label className="dark:text-foreground">Search Existing External Members</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={memberSearch}
                          onChange={(e) => {
                            setMemberSearch(e.target.value)
                            searchExternalMembers(e.target.value)
                            setShowMemberDropdown(true)
                          }}
                          onFocus={() => setShowMemberDropdown(true)}
                          placeholder="Search by name, email, or phone"
                          className="pl-10 dark:bg-card dark:border-border dark:text-foreground"
                        />
                      </div>
                      
                      {showMemberDropdown && memberSearch && searchedMembers.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-card border rounded-lg shadow-lg max-h-60 overflow-y-auto dark:border-border">
                          {searchedMembers.map((member) => (
                            <div
                              key={member.id}
                              onClick={() => selectExistingMember(member)}
                              className="p-3 hover:bg-gray-100 dark:hover:bg-muted cursor-pointer border-b dark:border-border last:border-b-0"
                            >
                              <p className="font-medium dark:text-foreground">{member.full_name}</p>
                              <p className="text-sm text-muted-foreground dark:text-muted-foreground">{member.email}</p>
                              <p className="text-xs text-muted-foreground dark:text-muted-foreground">{member.phone}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add New External Participant */}
                    <div className="border-t pt-4 dark:border-border">
                      <Label className="dark:text-foreground text-base font-semibold mb-3 block">Add New External Participant</Label>
                      
                      {/* Basic Information */}
                      <div className="space-y-3 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            placeholder="Full Name *"
                            value={newExternalParticipant.fullName}
                            onChange={(e) => setNewExternalParticipant({ ...newExternalParticipant, fullName: e.target.value })}
                            className="dark:bg-card dark:border-border dark:text-foreground"
                          />
                          <Input
                            placeholder="Email"
                            type="email"
                            value={newExternalParticipant.email}
                            onChange={(e) => setNewExternalParticipant({ ...newExternalParticipant, email: e.target.value })}
                            className="dark:bg-card dark:border-border dark:text-foreground"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            placeholder="Phone *"
                            value={newExternalParticipant.phone}
                            onChange={(e) => setNewExternalParticipant({ ...newExternalParticipant, phone: e.target.value })}
                            className="dark:bg-card dark:border-border dark:text-foreground"
                          />
                          <div className="flex gap-2">
                            <Select
                              value={newExternalParticipant.referenceType}
                              onValueChange={(value: "NIC" | "Passport" | "Employee ID") => 
                                setNewExternalParticipant({ ...newExternalParticipant, referenceType: value })
                              }
                            >
                              <SelectTrigger className="dark:bg-card dark:border-border dark:text-foreground">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="dark:bg-card dark:border-border">
                                <SelectItem value="NIC" className="dark:text-foreground dark:hover:bg-muted">NIC</SelectItem>
                                <SelectItem value="Passport" className="dark:text-foreground dark:hover:bg-muted">Passport</SelectItem>
                                <SelectItem value="Employee ID" className="dark:text-foreground dark:hover:bg-muted">Employee ID</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="Reference Value *"
                              value={newExternalParticipant.referenceValue}
                              onChange={(e) => setNewExternalParticipant({ ...newExternalParticipant, referenceValue: e.target.value })}
                              className="dark:bg-card dark:border-border dark:text-foreground"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Visit Details Section */}
                      <div className="bg-muted/30 dark:bg-muted/20 p-4 rounded-lg border dark:border-border mb-4">
                        <Label className="dark:text-foreground text-sm font-semibold mb-3 block">
                          Visit Details (Pass ID, In-Time, Out-Time)
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <Label htmlFor="passId" className="dark:text-foreground text-xs mb-1 block">Visitor Pass ID</Label>
                            <Input
                              id="passId"
                              placeholder="Enter Pass ID"
                              value={newExternalParticipant.visitorPassId}
                              onChange={(e) => setNewExternalParticipant({ ...newExternalParticipant, visitorPassId: e.target.value })}
                              className="dark:bg-card dark:border-border dark:text-foreground"
                            />
                          </div>
                          <div>
                            <Label htmlFor="passType" className="dark:text-foreground text-xs mb-1 block">Pass Type</Label>
                            <Select
                              value={newExternalParticipant.passTypeId || undefined}
                              onValueChange={(value) => setNewExternalParticipant({ ...newExternalParticipant, passTypeId: value === "none" ? "" : value })}
                            >
                              <SelectTrigger className="dark:bg-card dark:border-border dark:text-foreground">
                                <SelectValue placeholder="Select pass type" />
                              </SelectTrigger>
                              <SelectContent className="dark:bg-card dark:border-border">
                                <SelectItem value="none" className="dark:text-foreground dark:hover:bg-muted">None</SelectItem>
                                {passTypes.map((passType) => (
                                  <SelectItem key={passType.id} value={passType.id} className="dark:text-foreground dark:hover:bg-muted">
                                    {passType.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="inTime" className="dark:text-foreground text-xs mb-1 block">In-Time</Label>
                            <Input
                              id="inTime"
                              type="datetime-local"
                              value={newExternalParticipant.inTime}
                              onChange={(e) => setNewExternalParticipant({ ...newExternalParticipant, inTime: e.target.value })}
                              className="dark:bg-card dark:border-border dark:text-foreground"
                            />
                          </div>
                          <div>
                            <Label htmlFor="outTime" className="dark:text-foreground text-xs mb-1 block">Out-Time</Label>
                            <Input
                              id="outTime"
                              type="datetime-local"
                              value={newExternalParticipant.outTime}
                              onChange={(e) => setNewExternalParticipant({ ...newExternalParticipant, outTime: e.target.value })}
                              className="dark:bg-card dark:border-border dark:text-foreground"
                            />
                          </div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={addExternalParticipant}
                        className="w-full dark:bg-primary dark:hover:bg-primary/90"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Participant with Visit Details
                      </Button>
                    </div>

                    {/* External Participants List */}
                    <div className="space-y-3">
                      {formData.externalParticipants.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground dark:text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No external participants added yet</p>
                          <p className="text-xs mt-1">Add participants and fill in Pass ID, In-Time, and Out-Time</p>
                        </div>
                      ) : (
                        formData.externalParticipants.map((participant) => (
                          <div key={participant.id} className="border rounded-lg dark:border-border dark:bg-muted/30 p-4 space-y-3">
                            {/* Participant Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-base dark:text-foreground">{participant.fullName}</p>
                                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                                  {participant.email || participant.phone}
                                </p>
                                <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                                  {participant.referenceType}: {participant.referenceValue}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => editExternalParticipant(participant)}
                                  className="dark:border-border dark:hover:bg-muted"
                                  title="Edit Pass ID, In-Time, Out-Time"
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit Details
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeExternalParticipant(participant.id)}
                                  className="dark:border-border dark:hover:bg-muted"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Pass ID, In-Time, Out-Time Display */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t dark:border-border/50">
                              {/* Pass ID */}
                              <div className="bg-background dark:bg-card/50 p-3 rounded border dark:border-border">
                                <p className="text-xs font-medium text-muted-foreground dark:text-muted-foreground mb-1">
                                  Visitor Pass ID
                                </p>
                                {participant.visitorPassId ? (
                                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                                    {participant.visitorPassId}
                                  </p>
                                ) : (
                                  <p className="text-xs text-muted-foreground dark:text-muted-foreground italic">
                                    Not set
                                  </p>
                                )}
                              </div>

                              {/* In-Time */}
                              <div className="bg-background dark:bg-card/50 p-3 rounded border dark:border-border">
                                <p className="text-xs font-medium text-muted-foreground dark:text-muted-foreground mb-1">
                                  In-Time
                                </p>
                                {participant.inTime ? (
                                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                    {new Date(participant.inTime).toLocaleString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                ) : (
                                  <p className="text-xs text-muted-foreground dark:text-muted-foreground italic">
                                    Not set
                                  </p>
                                )}
                              </div>

                              {/* Out-Time */}
                              <div className="bg-background dark:bg-card/50 p-3 rounded border dark:border-border">
                                <p className="text-xs font-medium text-muted-foreground dark:text-muted-foreground mb-1">
                                  Out-Time
                                </p>
                                {participant.outTime ? (
                                  <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                    {new Date(participant.outTime).toLocaleString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                ) : (
                                  <p className="text-xs text-muted-foreground dark:text-muted-foreground italic">
                                    Not set
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Completion Status Indicator */}
                            <div className="flex items-center gap-2 pt-2">
                              {participant.visitorPassId && participant.inTime && participant.outTime ? (
                                <Badge className="bg-green-500 dark:bg-green-600 text-white">
                                  ✓ Complete
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="dark:border-amber-500 dark:text-amber-500">
                                  ⚠ Incomplete - Please add Pass ID, In-Time, and Out-Time
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCancelConfirmDialogOpen(true)}
                disabled={isSubmitting}
                className="dark:border-border dark:hover:bg-muted dark:text-foreground"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting} 
                className="min-w-[200px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600 shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Creating Record...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Missing Booking
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Edit External Participant Dialog */}
          <Dialog open={isEditMemberDialogOpen} onOpenChange={setIsEditMemberDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-card dark:border-border">
              <DialogHeader>
                <DialogTitle className="dark:text-foreground">Edit External Participant Details</DialogTitle>
                <DialogDescription className="dark:text-muted-foreground">
                  Add in-time, out-time, and pass number for this participant
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="dark:text-foreground">In Time</Label>
                  <Input
                    type="datetime-local"
                    value={editingMemberFormData.in_time}
                    onChange={(e) => setEditingMemberFormData({ ...editingMemberFormData, in_time: e.target.value })}
                    className="dark:bg-card dark:border-border dark:text-foreground"
                  />
                </div>
                <div>
                  <Label className="dark:text-foreground">Out Time</Label>
                  <Input
                    type="datetime-local"
                    value={editingMemberFormData.out_time}
                    onChange={(e) => setEditingMemberFormData({ ...editingMemberFormData, out_time: e.target.value })}
                    className="dark:bg-card dark:border-border dark:text-foreground"
                  />
                </div>
                <div>
                  <Label className="dark:text-foreground">Visitor Pass ID</Label>
                  <Input
                    value={editingMemberFormData.visitor_pass_id}
                    onChange={(e) => setEditingMemberFormData({ ...editingMemberFormData, visitor_pass_id: e.target.value })}
                    placeholder="Enter pass number"
                    className="dark:bg-card dark:border-border dark:text-foreground"
                  />
                </div>
                <div>
                  <Label className="dark:text-foreground">Pass Type</Label>
                  <Select
                    value={editingMemberFormData.pass_type_id || undefined}
                    onValueChange={(value) => setEditingMemberFormData({ ...editingMemberFormData, pass_type_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger className="dark:bg-card dark:border-border dark:text-foreground">
                      <SelectValue placeholder="Select pass type" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-card dark:border-border">
                      <SelectItem value="none" className="dark:text-foreground dark:hover:bg-muted">None</SelectItem>
                      {passTypes.map((passType) => (
                        <SelectItem key={passType.id} value={passType.id} className="dark:text-foreground dark:hover:bg-muted">
                          {passType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditMemberDialogOpen(false)}
                  className="dark:border-border dark:hover:bg-muted dark:text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateExternalMember}
                  disabled={isUpdatingMember}
                  className="dark:bg-primary dark:hover:bg-primary/90"
                >
                  {isUpdatingMember ? 'Updating...' : 'Update'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Cancel Confirmation Dialog */}
          <Dialog open={isCancelConfirmDialogOpen} onOpenChange={setIsCancelConfirmDialogOpen}>
            <DialogContent className="dark:bg-card dark:border-border">
              <DialogHeader>
                <DialogTitle className="dark:text-foreground">Cancel Booking Creation</DialogTitle>
                <DialogDescription className="dark:text-muted-foreground">
                  Are you sure you want to cancel? All unsaved changes will be lost.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCancelConfirmDialogOpen(false)}
                  className="dark:border-border dark:hover:bg-muted dark:text-foreground"
                >
                  No, Keep Editing
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsCancelConfirmDialogOpen(false)
                    router.push('/admin/bookings/missing-details')
                  }}
                  className="dark:bg-red-600 dark:hover:bg-red-700"
                >
                  Yes, Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Create Booking Confirmation Dialog */}
          <Dialog open={isCreateConfirmDialogOpen} onOpenChange={setIsCreateConfirmDialogOpen}>
            <DialogContent className="dark:bg-card dark:border-border">
              <DialogHeader>
                <DialogTitle className="dark:text-foreground">Create Missing Booking Record</DialogTitle>
                <DialogDescription className="dark:text-muted-foreground space-y-2">
                  <p>
                    Are you sure you want to create this missing booking record? This will save all details without validation.
                  </p>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mt-3">
                    <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                      ✓ This will NOT affect real bookings
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                      Missing booking records are stored separately with <code className="bg-green-100 dark:bg-green-900/40 px-1 rounded">is_missing_booking = 1</code> flag and are used only for record collection purposes.
                    </p>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateConfirmDialogOpen(false)}
                  disabled={isSubmitting}
                  className="dark:border-border dark:hover:bg-muted dark:text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    setIsCreateConfirmDialogOpen(false)
                    setShouldSubmitForm(true)
                    await new Promise(resolve => setTimeout(resolve, 100))
                    const form = document.querySelector('form') as HTMLFormElement
                    if (form) {
                      form.requestSubmit()
                    }
                  }}
                  disabled={isSubmitting}
                  className="min-w-[100px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Creating...
                    </>
                  ) : (
                    'Yes, Create'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </RouteProtection>
  )
}
