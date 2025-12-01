"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  QrCode, Hash, Search, Calendar, MapPin, Users, Clock, 
  UserCheck, CheckCircle, Building2, Phone, Mail, ArrowRight, ArrowLeft, AlertCircle, User, Plus, X
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { placeManagementAPI } from "@/lib/place-management-api"
import { API_BASE_URL } from '@/lib/api-config'
import toast from "react-hot-toast"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { LogOut, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

interface Meeting {
  id: string
  booking_ref_id: string
  title: string
  description: string
  booking_date: string
  start_time: string
  end_time: string
  place_name: string
  responsible_person_name: string
  responsible_person_email: string
  status: string
}

interface ExternalVisitor {
  id: string
  full_name: string
  email: string
  phone: string
  reference_type: string
  reference_value: string
  company_name?: string
  designation?: string
}

export default function SmartAssistantPage() {
  const { signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  
  const [currentView, setCurrentView] = useState<'search' | 'details' | 'confirm' | 'success' | 'error'>('search')
  const [meetingId, setMeetingId] = useState("")
  const [referenceValue, setReferenceValue] = useState("")
  const [searchType, setSearchType] = useState<'meetingId' | 'reference'>('meetingId')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [externalVisitors, setExternalVisitors] = useState<ExternalVisitor[]>([])
  const [selectedVisitor, setSelectedVisitor] = useState<ExternalVisitor | null>(null)
  const [isTodayBooking, setIsTodayBooking] = useState(false)
  
  // Add member state
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)
  const [memberSearchTerm, setMemberSearchTerm] = useState("")
  const [searchedMembers, setSearchedMembers] = useState<any[]>([])
  const [showMemberDropdown, setShowMemberDropdown] = useState(false)
  const [showCreateMemberDialog, setShowCreateMemberDialog] = useState(false)
  const [newMemberForm, setNewMemberForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    company_name: "",
    designation: "",
    reference_type: "NIC" as "NIC" | "Passport" | "Employee ID",
    reference_value: "",
  })
  const [isAddingMember, setIsAddingMember] = useState(false)
  
  const handleLogout = async () => {
    await signOut()
    window.location.href = '/'
  }

  const handleSearch = async () => {
    setErrorMessage("")
    
    if (searchType === 'meetingId' && !meetingId.trim()) {
      setErrorMessage('Please enter a Meeting ID')
      return
    }
    
    if (searchType === 'reference' && !referenceValue.trim()) {
      setErrorMessage('Please enter your reference value')
      return
    }

    try {
      setIsLoading(true)
      
      if (searchType === 'meetingId') {
        console.log('🔍 Searching for Meeting ID:', meetingId.toUpperCase())
        console.log('🔗 API Base URL:', API_BASE_URL)
        
        // Get all bookings (not deleted)
        console.log('📡 Fetching bookings from database...')
        const allBookingsResponse = await placeManagementAPI.getTableData('bookings', {
          limit: 500
        })
        
        console.log('📦 Raw response type:', typeof allBookingsResponse)
        console.log('📦 Raw response is array:', Array.isArray(allBookingsResponse))
        console.log('📦 Raw response:', allBookingsResponse)
        
        const allBookings = Array.isArray(allBookingsResponse) ? allBookingsResponse : []
        console.log('📊 Total bookings in database:', allBookings.length)
        
        // Debug: Show ALL booking_ref_ids
        if (allBookings.length > 0) {
          console.log('📝 ALL booking_ref_ids in database:')
          console.log('=====================================')
          allBookings.forEach((b: any, idx: number) => {
            const refId = b.booking_ref_id || 'NULL'
            console.log(`  ${idx + 1}. REF_ID: "${refId}" | TITLE: "${b.title}" | DELETED: ${b.is_deleted}`)
          })
          console.log('=====================================')
          
          // Also show as a list
          const allRefIds = allBookings
            .map((b: any) => b.booking_ref_id)
            .filter((id: any) => id)
          console.log('📋 Quick List of all IDs:', allRefIds)
        } else {
          console.warn('⚠️ No bookings found in database!')
          setErrorMessage('No bookings found in the database. Please create a booking first.')
          setCurrentView('error')
          return
        }
        
        // Search manually
        const foundBooking = allBookings.find((b: any) => {
          const refIdMatch = b.booking_ref_id && 
                            b.booking_ref_id.toUpperCase().trim() === meetingId.toUpperCase().trim()
          const notDeleted = b.is_deleted !== 1 && b.is_deleted !== true
          
          console.log(`  Checking "${b.booking_ref_id}": refIdMatch=${refIdMatch}, notDeleted=${notDeleted}`)
          
          return refIdMatch && notDeleted
        })
        
        console.log('🎯 Found booking:', foundBooking ? `Yes - ${foundBooking.title}` : 'No match')
        
        if (!foundBooking) {
          const availableIds = allBookings
            .filter((b: any) => b.is_deleted !== 1)
            .map((b: any) => b.booking_ref_id)
            .join(', ')
          
          setErrorMessage(`Meeting ID "${meetingId}" not found. Available IDs: ${availableIds || 'None'}`)
          setCurrentView('error')
          return
        }
        
        // Process found booking
        let normalizedDate = foundBooking.booking_date
        if (normalizedDate && typeof normalizedDate === 'string' && normalizedDate.includes('T')) {
          const d = new Date(normalizedDate)
          normalizedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        }
        
        setMeeting({
          ...foundBooking,
          booking_date: normalizedDate
        })

        // Check if booking is for today
        const today = new Date().toISOString().split('T')[0]
        const isToday = normalizedDate === today
        setIsTodayBooking(isToday)

        // Get all external participants and filter by booking_id client-side
        // This ensures we only show participants for THIS specific booking
        const participantsResponse = await placeManagementAPI.getTableData('external_participants', {
          limit: 500
        })

        const allParticipants = Array.isArray(participantsResponse) ? participantsResponse : participantsResponse?.data || []
        
        // IMPORTANT: Filter to only show participants for THIS booking
        const participants = allParticipants.filter((p: any) => 
          p.booking_id === foundBooking.id
        )
        
        console.log('📋 All participants fetched:', allParticipants.length)
        console.log('📋 Participants for booking', foundBooking.id, ':', participants.length)
        console.log('📋 Filtered participants:', participants)
        
        setExternalVisitors(participants)

        setCurrentView('details')
        
        if (isToday) {
          toast.success('Meeting found! You can mark attendance.')
        } else {
          toast.success('Meeting found! (View only - not today\'s booking)')
        }
        
      } else {
        // Search by reference value
        console.log('🔍 Searching by reference value:', referenceValue)
        
        // Get today's date
        const today = new Date().toISOString().split('T')[0]
        
        // First, find external participants with matching reference value for today's bookings
        const participantsResponse = await placeManagementAPI.getTableData('external_participants', {
          filters: [
            { column: 'reference_value', operator: 'equals', value: referenceValue }
          ],
          limit: 100
        })
        
        const participants = Array.isArray(participantsResponse) ? participantsResponse : []
        console.log('📊 Found participants with reference:', participants.length)
        
        if (participants.length === 0) {
          setErrorMessage(`No meetings found for reference "${referenceValue}". Please check your reference number.`)
          setCurrentView('error')
          return
        }
        
        // Get all bookings (not just today's) to check if participant exists
        const allBookingsResponse = await placeManagementAPI.getTableData('bookings', {
          limit: 500
        })
        
        const allBookings = Array.isArray(allBookingsResponse) ? allBookingsResponse : []
        console.log('📊 All bookings:', allBookings.length)
        
        // Find bookings where the participant is invited
        const participantBookingIds = new Set(participants.map(p => p.booking_id))
        const matchingBookings = allBookings.filter(b => participantBookingIds.has(b.id))
        
        console.log('📊 Matching bookings (all dates):', matchingBookings.length)
        
        if (matchingBookings.length === 0) {
          setErrorMessage(`No meetings found for reference "${referenceValue}". Please check your reference number.`)
          setCurrentView('error')
          return
        }
        
        // Filter for today's bookings only
        const todayMatchingBookings = matchingBookings.filter(b => {
          let normalizedDate = b.booking_date
          if (normalizedDate && typeof normalizedDate === 'string' && normalizedDate.includes('T')) {
            const d = new Date(normalizedDate)
            normalizedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          }
          return normalizedDate === today
        })
        
        console.log('📊 Matching today\'s bookings:', todayMatchingBookings.length)
        
        if (todayMatchingBookings.length === 0) {
          // Check if there are any future or past bookings
          const futureBookings = matchingBookings.filter(b => {
            let normalizedDate = b.booking_date
            if (normalizedDate && typeof normalizedDate === 'string' && normalizedDate.includes('T')) {
              const d = new Date(normalizedDate)
              normalizedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            }
            return normalizedDate > today
          })
          
          const pastBookings = matchingBookings.filter(b => {
            let normalizedDate = b.booking_date
            if (normalizedDate && typeof normalizedDate === 'string' && normalizedDate.includes('T')) {
              const d = new Date(normalizedDate)
              normalizedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            }
            return normalizedDate < today
          })
          
          if (futureBookings.length > 0) {
            setErrorMessage(`Meetings found for reference "${referenceValue}" but they are scheduled for future dates. Attendance marking is only available for today's meetings.`)
          } else if (pastBookings.length > 0) {
            setErrorMessage(`Meetings found for reference "${referenceValue}" but they were scheduled for past dates. Attendance marking is only available for today's meetings.`)
          } else {
            setErrorMessage(`No meetings found for today with reference "${referenceValue}". Please check if you have any meetings scheduled for today.`)
          }
          setCurrentView('error')
          return
        }
        
        // If multiple bookings, show the first one (or we could show a list)
        const foundBooking = todayMatchingBookings[0]
        
        // Get all external participants and filter by booking_id client-side
        // This ensures we only show participants for THIS specific booking
        const bookingParticipantsResponse = await placeManagementAPI.getTableData('external_participants', {
          limit: 500
        })
        
        const allParticipants = Array.isArray(bookingParticipantsResponse) ? bookingParticipantsResponse : bookingParticipantsResponse?.data || []
        
        // IMPORTANT: Filter to only show participants for THIS booking
        const bookingParticipants = allParticipants.filter((p: any) => 
          p.booking_id === foundBooking.id
        )
        
        console.log('📋 All participants fetched:', allParticipants.length)
        console.log('📋 Participants for booking', foundBooking.id, ':', bookingParticipants.length)
        console.log('📋 Filtered participants:', bookingParticipants)
        
        let normalizedDate = foundBooking.booking_date
        if (normalizedDate && typeof normalizedDate === 'string' && normalizedDate.includes('T')) {
          const d = new Date(normalizedDate)
          normalizedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        }
        
        setMeeting({
          ...foundBooking,
          booking_date: normalizedDate
        })
        
        setIsTodayBooking(true) // Always true for reference search since we filter for today
        setExternalVisitors(bookingParticipants)
        setCurrentView('details')
        
        toast.success(`Meeting found for reference "${referenceValue}"! You can mark attendance.`)
      }
      
    } catch (error) {
      console.error('Failed to find meeting:', error)
      setErrorMessage('Failed to search for meeting. Please try again.')
      setCurrentView('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectVisitor = (visitor: ExternalVisitor) => {
    setSelectedVisitor(visitor)
    setCurrentView('confirm')
  }

  const handleConfirmAttendance = async () => {
    if (!selectedVisitor) return

    try {
      setIsLoading(true)
      
      await placeManagementAPI.updateRecord('external_participants', 
        { id: selectedVisitor.id },
        { 
          participation_status: 'confirmed',
          check_in_time: new Date().toISOString()
        }
      )
      
      toast.success(`✅ Attendance confirmed for ${selectedVisitor.full_name}!`)
      setCurrentView('success')
      
    } catch (error) {
      console.error('Failed to submit attendance:', error)
      toast.error('Failed to submit attendance')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setMeetingId("")
    setReferenceValue("")
    setMeeting(null)
    setExternalVisitors([])
    setSelectedVisitor(null)
    setErrorMessage("")
    setIsTodayBooking(false)
    setSearchType('meetingId')
    setCurrentView('search')
    setShowAddMemberDialog(false)
    setMemberSearchTerm("")
    setSearchedMembers([])
    setShowMemberDropdown(false)
    setShowCreateMemberDialog(false)
  }

  // Search external members by reference
  const searchExternalMembers = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchedMembers([])
      return
    }

    try {
      const response = await placeManagementAPI.getTableData('external_members', {
        limit: 500
      })
      
      const data = Array.isArray(response) ? response : response?.data || []
      
      // Filter out deleted and blacklisted members
      const activeMembers = data.filter((m: any) => !m.is_deleted && !m.is_blacklisted && m.is_active)
      
      // Search by reference value, name, email, phone, or company
      const filtered = activeMembers.filter((member: any) =>
        member.reference_value?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone?.includes(searchTerm) ||
        member.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10)
      
      setSearchedMembers(filtered)
    } catch (error) {
      console.error('Failed to search members:', error)
      setSearchedMembers([])
    }
  }

  // Select existing member and add to meeting
  const selectExistingMember = async (member: any) => {
    if (!meeting) return

    // Check if member is already in the meeting
    if (externalVisitors.some(v => v.email === member.email)) {
      toast.error('This member is already added to the meeting')
      return
    }

    try {
      setIsAddingMember(true)
      
      // Create external participant record
      const participantId = `participant_${Date.now()}`
      await placeManagementAPI.insertRecord('external_participants', {
        id: participantId,
        booking_id: meeting.id,
        full_name: member.full_name,
        email: member.email,
        phone: member.phone,
        company_name: member.company_name || null,
        designation: member.designation || null,
        reference_type: member.reference_type,
        reference_value: member.reference_value,
        participation_status: 'invited',
        created_at: new Date().toISOString()
      })

      // Add to local state
      const newVisitor: ExternalVisitor = {
        id: participantId,
        full_name: member.full_name,
        email: member.email,
        phone: member.phone,
        reference_type: member.reference_type,
        reference_value: member.reference_value,
        company_name: member.company_name,
        designation: member.designation,
      }

      setExternalVisitors([...externalVisitors, newVisitor])
      setMemberSearchTerm("")
      setSearchedMembers([])
      setShowMemberDropdown(false)
      setShowAddMemberDialog(false)
      toast.success(`Added ${member.full_name} to the meeting`)
    } catch (error: any) {
      console.error('Failed to add member:', error)
      toast.error(error?.message || 'Failed to add member to meeting')
    } finally {
      setIsAddingMember(false)
    }
  }

  // Create new member and add to meeting
  const createAndAddMember = async () => {
    if (!meeting) return

    // Validate required fields
    if (!newMemberForm.full_name || !newMemberForm.email || !newMemberForm.phone || !newMemberForm.reference_value) {
      toast.error('Please fill in all required fields')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newMemberForm.email.trim())) {
      toast.error('Please enter a valid email address')
      return
    }

    try {
      setIsAddingMember(true)

      // Check for duplicate email or phone
      const existingResponse = await placeManagementAPI.getTableData('external_members', {
        limit: 500
      })
      const existingMembers = Array.isArray(existingResponse) ? existingResponse : existingResponse?.data || []
      
      // Filter out deleted members
      const activeMembers = existingMembers.filter((m: any) => !m.is_deleted)
      
      const duplicate = activeMembers.find((m: any) => 
        m.email?.toLowerCase().trim() === newMemberForm.email.toLowerCase().trim() ||
        m.phone?.trim() === newMemberForm.phone.trim()
      )

      let memberId: string
      if (duplicate) {
        // Use existing member
        memberId = duplicate.id
        toast.success('Using existing member record')
      } else {
        // Create new member
        memberId = `member_${Date.now()}`
        await placeManagementAPI.insertRecord('external_members', {
          id: memberId,
          full_name: newMemberForm.full_name.trim(),
          email: newMemberForm.email.trim(),
          phone: newMemberForm.phone.trim(),
          company_name: newMemberForm.company_name?.trim() || null,
          designation: newMemberForm.designation?.trim() || null,
          reference_type: newMemberForm.reference_type,
          reference_value: newMemberForm.reference_value.trim(),
          is_active: true,
          is_deleted: false,
          is_blacklisted: false,
          visit_count: 1,
          last_visit_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        toast.success('New member created')
      }

      // Check if member is already in the meeting
      if (externalVisitors.some(v => v.email === newMemberForm.email.trim())) {
        toast.error('This member is already added to the meeting')
        return
      }

      // Create external participant record
      const participantId = `participant_${Date.now()}`
      await placeManagementAPI.insertRecord('external_participants', {
        id: participantId,
        booking_id: meeting.id,
        full_name: newMemberForm.full_name.trim(),
        email: newMemberForm.email.trim(),
        phone: newMemberForm.phone.trim(),
        company_name: newMemberForm.company_name?.trim() || null,
        designation: newMemberForm.designation?.trim() || null,
        reference_type: newMemberForm.reference_type,
        reference_value: newMemberForm.reference_value.trim(),
        participation_status: 'invited',
        created_at: new Date().toISOString()
      })

      // Add to local state
      const newVisitor: ExternalVisitor = {
        id: participantId,
        full_name: newMemberForm.full_name.trim(),
        email: newMemberForm.email.trim(),
        phone: newMemberForm.phone.trim(),
        reference_type: newMemberForm.reference_type,
        reference_value: newMemberForm.reference_value.trim(),
        company_name: newMemberForm.company_name?.trim(),
        designation: newMemberForm.designation?.trim(),
      }

      setExternalVisitors([...externalVisitors, newVisitor])
      
      // Reset form
      setNewMemberForm({
        full_name: "",
        email: "",
        phone: "",
        company_name: "",
        designation: "",
        reference_type: "NIC",
        reference_value: "",
      })
      setShowCreateMemberDialog(false)
      setShowAddMemberDialog(false)
      toast.success(`Added ${newMemberForm.full_name.trim()} to the meeting`)
    } catch (error: any) {
      console.error('Failed to create and add member:', error)
      toast.error(error?.message || 'Failed to create and add member')
    } finally {
      setIsAddingMember(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5)
  }

  // Floating Action Buttons Component
  const FloatingButtons = () => (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      <Button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        size="sm"
        className="rounded-full w-10 h-10 shadow-lg hover:scale-110 transition-transform"
        variant="outline"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      <Button
        onClick={handleLogout}
        size="sm"
        className="rounded-full w-10 h-10 shadow-lg bg-red-600 hover:bg-red-700 text-white hover:scale-110 transition-transform"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )

  // Error View
  if (currentView === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <FloatingButtons />
        <div className="max-w-lg mx-auto">
          <Card className="p-6">
            <CardContent className="text-center space-y-4">
              <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="text-xl font-bold text-destructive">Meeting Not Found</h1>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>

              <Button onClick={handleReset} className="w-full text-sm py-3">
                <Search className="h-4 w-4 mr-2" />
                Try Another Search
              </Button>

              <div className="text-center text-muted-foreground">
                <p className="text-sm">Need help?</p>
                <p className="text-xs">Contact reception or the meeting organizer</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Search View
  if (currentView === 'search') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <FloatingButtons />
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <UserCheck className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Smart Assistant</h1>
            <p className="text-base text-muted-foreground">Mark your attendance - No login required</p>
          </div>

          <Card className="p-6">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">Find Your Meeting</CardTitle>
              <CardDescription className="text-sm">Enter your 6-character Meeting ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                {/* Search Type Toggle */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Button
                    type="button"
                    variant={searchType === 'meetingId' ? 'default' : 'outline'}
                    onClick={() => {
                      setSearchType('meetingId')
                      setErrorMessage("")
                    }}
                    className="flex items-center gap-1 text-sm px-3 py-2"
                  >
                    <Hash className="h-3 w-3" />
                    Meeting ID
                  </Button>
                  <Button
                    type="button"
                    variant={searchType === 'reference' ? 'default' : 'outline'}
                    onClick={() => {
                      setSearchType('reference')
                      setErrorMessage("")
                    }}
                    className="flex items-center gap-1 text-sm px-3 py-2"
                  >
                    <User className="h-3 w-3" />
                    Reference Value
                  </Button>
                </div>

                {searchType === 'meetingId' ? (
                  <>
                    <Label htmlFor="meeting-id" className="text-sm flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      Meeting ID
                    </Label>
                    <Input
                      id="meeting-id"
                      placeholder="e.g., ABC123"
                      value={meetingId}
                      onChange={(e) => {
                        // Remove any # symbols and non-alphanumeric characters, then convert to uppercase
                        const cleanValue = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
                        setMeetingId(cleanValue)
                        setErrorMessage("")
                      }}
                      className="text-lg font-mono tracking-wider uppercase p-4 text-center"
                      maxLength={6}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <p className="text-xs text-muted-foreground">
                      The Meeting ID can be found in your invitation email
                    </p>
                  </>
                ) : (
                  <>
                    <Label htmlFor="reference-value" className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Your Reference Value
                    </Label>
                    <Input
                      id="reference-value"
                      placeholder="e.g., Passport number, ID number, etc."
                      value={referenceValue}
                      onChange={(e) => {
                        setReferenceValue(e.target.value)
                        setErrorMessage("")
                      }}
                      className="text-lg font-mono tracking-wider p-4 text-center"
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the reference value you provided when registering for the meeting
                    </p>
                  </>
                )}
              </div>

              <Button 
                onClick={handleSearch} 
                disabled={(searchType === 'meetingId' ? !meetingId.trim() : !referenceValue.trim()) || isLoading} 
                className="w-full text-base py-3 bg-gradient-to-r from-blue-600 to-purple-600"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Find Meeting
                  </>
                )}
              </Button>

              <Link href="/" className="block text-center">
                <Button variant="outline" className="w-full text-sm py-2">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Details View - Show external visitors list
  if (currentView === 'details' && meeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <FloatingButtons />
        <div className="max-w-2xl mx-auto">
          <Button variant="outline" onClick={handleReset} className="mb-4 text-sm px-4 py-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>

          <div className="space-y-4">
            {/* Meeting Details Card */}
            <Card className="border-2 border-green-500 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-green-900">{meeting.title}</CardTitle>
                    <CardDescription className="text-sm">Meeting Details</CardDescription>
                  </div>
                  <Badge className="bg-green-600 text-white text-sm px-3 py-1">
                    {meeting.booking_ref_id}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {meeting.description && (
                  <p className="text-muted-foreground mb-3 text-sm">{meeting.description}</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{formatDate(meeting.booking_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">
                      {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                    <MapPin className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">{meeting.place_name}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-pink-50 rounded-lg">
                    <User className="h-4 w-4 text-pink-600" />
                    <span className="font-medium">{meeting.responsible_person_name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

                   {/* External Visitors List */}
                   <Card className="border-2 shadow-lg">
                     <CardHeader className={`bg-gradient-to-r ${isTodayBooking ? 'from-indigo-50 to-sky-50' : 'from-gray-50 to-slate-50'} pb-3`}>
                       <div className="flex items-center justify-between">
                         <CardTitle className="text-lg flex items-center gap-2">
                           <Users className="h-5 w-5 text-indigo-600" />
                           {isTodayBooking ? 'Select Your Name to Mark Attendance' : 'External Visitors (View Only)'}
                           <Badge className={`ml-2 ${isTodayBooking ? 'bg-indigo-600 text-white' : 'bg-gray-500 text-white'} text-xs`}>
                             {externalVisitors.length} Visitors
                           </Badge>
                         </CardTitle>
                         <Button
                           onClick={() => setShowAddMemberDialog(true)}
                           size="sm"
                           className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                         >
                           <Plus className="h-4 w-4 mr-2" />
                           Add Member
                         </Button>
                       </div>
                       {!isTodayBooking && (
                         <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                           <p className="text-amber-800 text-sm">
                             ⚠️ This meeting is not scheduled for today. Attendance marking is only available for today's bookings.
                           </p>
                         </div>
                       )}
                     </CardHeader>
              <CardContent className="pt-4">
                {externalVisitors.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-base font-medium text-muted-foreground">No external visitors for this meeting</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {isTodayBooking ? (
                      <Alert className="border-indigo-300 bg-indigo-50">
                        <AlertDescription className="text-indigo-900 text-sm">
                          <strong>Instructions:</strong> Please find your name below and click on your card to mark your attendance.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert className="border-amber-300 bg-amber-50">
                        <AlertDescription className="text-amber-900 text-sm">
                          <strong>View Only:</strong> This meeting is not scheduled for today. You can view the visitor list but cannot mark attendance.
                        </AlertDescription>
                      </Alert>
                    )}

                    {externalVisitors.map((visitor) => (
                      <Card
                        key={visitor.id}
                        className={`border-2 transition-all duration-200 ${
                          isTodayBooking 
                            ? 'cursor-pointer hover:shadow-xl hover:border-indigo-500 hover:scale-[1.02] bg-gradient-to-r from-white to-indigo-50/30' 
                            : 'cursor-default opacity-75 bg-gray-50'
                        }`}
                        onClick={isTodayBooking ? () => handleSelectVisitor(visitor) : undefined}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                  {visitor.full_name.charAt(0).toUpperCase()}
                                </div>
                                <h3 className="text-lg font-bold">{visitor.full_name}</h3>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                {visitor.email && (
                                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                                    <Mail className="h-3 w-3 text-blue-600" />
                                    <span className="truncate text-blue-900">{visitor.email}</span>
                                  </div>
                                )}
                                {visitor.phone && (
                                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md">
                                    <Phone className="h-3 w-3 text-green-600" />
                                    <span className="text-green-900">{visitor.phone}</span>
                                  </div>
                                )}
                                {visitor.company_name && (
                                  <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-md">
                                    <Building2 className="h-3 w-3 text-purple-600" />
                                    <span className="truncate text-purple-900">{visitor.company_name}</span>
                                  </div>
                                )}
                                {visitor.reference_type && (
                                  <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-md">
                                    <Hash className="h-3 w-3 text-orange-600" />
                                    <span className="truncate text-orange-900">
                                      <span className="font-medium">{visitor.reference_type}:</span> {visitor.reference_value}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {isTodayBooking ? (
                              <div className="ml-4 p-2 bg-indigo-100 rounded-full">
                                <ArrowRight className="h-5 w-5 text-indigo-600" />
                              </div>
                            ) : (
                              <div className="ml-4 text-gray-400 text-xs font-medium bg-gray-100 px-3 py-2 rounded-full">
                                View Only
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Member Dialog */}
        <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600" />
                Add External Member to Meeting
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Search Existing Members */}
              <div className="space-y-3 p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300 rounded-xl shadow-sm">
                <Label className="text-blue-900 font-semibold flex items-center gap-2 text-base">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Search className="h-4 w-4 text-white" />
                  </div>
                  Search Existing Members by Reference
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by reference value, name, email, phone, or company..."
                    value={memberSearchTerm}
                    onChange={(e) => {
                      setMemberSearchTerm(e.target.value)
                      searchExternalMembers(e.target.value)
                      setShowMemberDropdown(true)
                    }}
                    onFocus={() => memberSearchTerm.length >= 2 && setShowMemberDropdown(true)}
                    className="pl-10 border-2 focus:border-blue-500"
                  />
                </div>
                {showMemberDropdown && searchedMembers.length > 0 && (
                  <div className="mt-2 border-2 border-blue-200 rounded-lg bg-white shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                    {searchedMembers.map((member) => (
                      <div
                        key={member.id}
                        onClick={() => selectExistingMember(member)}
                        className="p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer border-b last:border-b-0 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {member.full_name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-base">{member.full_name}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {member.email}
                              </span>
                              <span className="flex items-center gap-1 mt-1">
                                <Phone className="h-3 w-3" />
                                {member.phone}
                              </span>
                            </div>
                            {member.reference_value && (
                              <div className="text-xs text-blue-700 mt-2 font-medium bg-blue-100 px-2 py-1 rounded inline-block">
                                <Hash className="h-3 w-3 inline mr-1" />
                                {member.reference_type}: {member.reference_value}
                              </div>
                            )}
                          </div>
                          <Plus className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {memberSearchTerm.length >= 2 && searchedMembers.length === 0 && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">No members found. Create a new member below.</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 border-t"></div>
                <span className="text-sm text-muted-foreground">OR</span>
                <div className="flex-1 border-t"></div>
              </div>

              {/* Create New Member */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Create New Member</Label>
                  <Button
                    onClick={() => setShowCreateMemberDialog(true)}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create New Member Dialog */}
        <Dialog open={showCreateMemberDialog} onOpenChange={setShowCreateMemberDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-600" />
                Create New Member & Add to Meeting
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={newMemberForm.full_name}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, full_name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newMemberForm.email}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input
                    value={newMemberForm.phone}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                    placeholder="+94XXXXXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={newMemberForm.company_name}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, company_name: e.target.value })}
                    placeholder="Company name (optional)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Input
                    value={newMemberForm.designation}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, designation: e.target.value })}
                    placeholder="Job title (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reference Type *</Label>
                  <Select
                    value={newMemberForm.reference_type}
                    onValueChange={(value: "NIC" | "Passport" | "Employee ID") => 
                      setNewMemberForm({ ...newMemberForm, reference_type: value })
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
              </div>

              <div className="space-y-2">
                <Label>Reference Value *</Label>
                <Input
                  value={newMemberForm.reference_value}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, reference_value: e.target.value })}
                  placeholder="Enter reference number"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateMemberDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={createAndAddMember}
                  disabled={isAddingMember}
                  className="bg-gradient-to-r from-green-600 to-emerald-600"
                >
                  {isAddingMember ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Create & Add to Meeting
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Confirm View
  if (currentView === 'confirm' && selectedVisitor && meeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <FloatingButtons />
        <div className="max-w-lg mx-auto">
          <Button variant="outline" onClick={() => setCurrentView('details')} className="mb-4 text-sm px-4 py-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Visitor List
          </Button>

          <Card className="border-2 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 text-center border-b-2 pb-3">
              <CardTitle className="text-xl text-green-900">Confirm Attendance</CardTitle>
              <CardDescription className="text-sm">Please confirm the details below</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Meeting Info */}
              <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                <h3 className="font-bold text-base mb-3 text-blue-900">Meeting Information</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Title:</strong> {meeting.title}</p>
                  <p><strong>Date:</strong> {formatDate(meeting.booking_date)}</p>
                  <p><strong>Time:</strong> {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}</p>
                  <p><strong>Location:</strong> {meeting.place_name}</p>
                  <p><strong>Organizer:</strong> {meeting.responsible_person_name}</p>
                </div>
              </div>

              {/* Visitor Info */}
              <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                <h3 className="font-bold text-base mb-3 text-green-900">Your Information</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {selectedVisitor.full_name}</p>
                  <p><strong>Email:</strong> {selectedVisitor.email}</p>
                  <p><strong>Phone:</strong> {selectedVisitor.phone}</p>
                  {selectedVisitor.company_name && (
                    <p><strong>Company:</strong> {selectedVisitor.company_name}</p>
                  )}
                  <p><strong>{selectedVisitor.reference_type}:</strong> {selectedVisitor.reference_value}</p>
                </div>
              </div>

              <Alert className="border-green-500 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900 text-sm">
                  By confirming, you acknowledge your attendance at this meeting
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentView('details')}
                  className="flex-1 text-sm py-3"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmAttendance}
                  disabled={isLoading}
                  className="flex-1 text-sm py-3 bg-gradient-to-r from-green-600 to-emerald-600"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Attendance
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Success View
  if (currentView === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <FloatingButtons />
        <div className="max-w-lg mx-auto">
          <Card className="border-2 border-green-500 shadow-2xl">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-3 animate-bounce-gentle">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-green-900">Attendance Confirmed!</h1>
              <p className="text-base text-muted-foreground">
                Thank you, {selectedVisitor?.full_name}
              </p>

              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                <p className="text-green-900 font-semibold mb-2 text-sm">
                  ✅ Check-in successful
                </p>
                <p className="text-xs text-green-700">
                  Meeting: {meeting?.title}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {new Date().toLocaleString()}
                </p>
              </div>

              <Button
                onClick={handleReset}
                className="w-full text-sm py-3 bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Mark Attendance for Another Visitor
              </Button>

              <Link href="/" className="block">
                <Button variant="outline" className="w-full text-sm py-2">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Fallback to search
  handleReset()
  return null
}

