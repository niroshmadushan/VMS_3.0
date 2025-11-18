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
  UserCheck, CheckCircle, Building2, Phone, Mail, ArrowRight, ArrowLeft, AlertCircle, User
} from "lucide-react"
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

        const participantsResponse = await placeManagementAPI.getTableData('external_participants', {
          filters: [
            { column: 'booking_id', operator: 'equals', value: foundBooking.id }
          ],
          limit: 100
        })

        const participants = Array.isArray(participantsResponse) ? participantsResponse : []
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
        
        // Get participants for this specific booking
        const bookingParticipantsResponse = await placeManagementAPI.getTableData('external_participants', {
          filters: [
            { column: 'booking_id', operator: 'equals', value: foundBooking.id }
          ],
          limit: 100
        })
        
        const bookingParticipants = Array.isArray(bookingParticipantsResponse) ? bookingParticipantsResponse : []
        
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
                       <CardTitle className="text-lg flex items-center gap-2">
                         <Users className="h-5 w-5 text-indigo-600" />
                         {isTodayBooking ? 'Select Your Name to Mark Attendance' : 'External Visitors (View Only)'}
                         <Badge className={`ml-auto ${isTodayBooking ? 'bg-indigo-600 text-white' : 'bg-gray-500 text-white'} text-xs`}>
                           {externalVisitors.length} Visitors
                         </Badge>
                       </CardTitle>
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
                        className={`border-2 transition-all ${
                          isTodayBooking 
                            ? 'cursor-pointer hover:shadow-lg hover:border-indigo-500' 
                            : 'cursor-default opacity-75'
                        }`}
                        onClick={isTodayBooking ? () => handleSelectVisitor(visitor) : undefined}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold mb-2">{visitor.full_name}</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs text-muted-foreground">
                                {visitor.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate">{visitor.email}</span>
                                  </div>
                                )}
                                {visitor.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    <span>{visitor.phone}</span>
                                  </div>
                                )}
                                {visitor.company_name && (
                                  <div className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    <span className="truncate">{visitor.company_name}</span>
                                  </div>
                                )}
                                {visitor.reference_type && (
                                  <div className="flex items-center gap-1">
                                    <Hash className="h-3 w-3" />
                                    <span className="truncate">{visitor.reference_type}: {visitor.reference_value}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {isTodayBooking ? (
                              <ArrowRight className="h-6 w-6 text-indigo-600" />
                            ) : (
                              <div className="text-gray-400 text-xs font-medium">
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

