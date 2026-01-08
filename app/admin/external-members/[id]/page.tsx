"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, User, Mail, Phone, Building2, MapPin, FileText, 
  Calendar, Clock, ShieldAlert, Activity, BarChart3, TrendingUp,
  CheckCircle, XCircle, Loader2
} from "lucide-react"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { placeManagementAPI } from "@/lib/place-management-api"
import toast from "react-hot-toast"
import { requireAuth } from "@/lib/auth"

interface ExternalMember {
  id: string
  full_name: string
  email: string
  phone: string
  company_name?: string
  designation?: string
  reference_type: string
  reference_value: string
  address?: string
  city?: string
  country?: string
  notes?: string
  is_blacklisted: boolean
  blacklist_reason?: string
  visit_count: number
  last_visit_date?: string
  is_active: boolean
  created_at: string
}

export default function ExternalMemberDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const memberId = params.id as string

  const [member, setMember] = useState<ExternalMember | null>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [missingBookings, setMissingBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingBookings, setIsLoadingBookings] = useState(false)
  const [isLoadingMissingBookings, setIsLoadingMissingBookings] = useState(false)

  // Get user role to determine correct back path
  const getUserRole = (): string | null => {
    if (typeof window !== 'undefined') {
      try {
        const userData = localStorage.getItem('userData')
        if (userData) {
          const user = JSON.parse(userData)
          return user?.role || null
        }
      } catch (error) {
        // Silent fail - default to null if role cannot be retrieved
      }
    }
    return null
  }

  const getBackPath = (): string => {
    const role = getUserRole()
    return role === 'staff' ? '/staff/external-members' : '/admin/external-members'
  }

  useEffect(() => {
    requireAuth(["admin", "staff"])
    loadMemberData()
    loadMemberBookings()
  }, [memberId])

  const loadMemberData = async () => {
    try {
      setIsLoading(true)
      const response = await placeManagementAPI.getTableData('external_members', { limit: 500 })
      const members = Array.isArray(response) ? response : []
      const foundMember = members.find((m: any) => m.id === memberId && !m.is_deleted)
      
      if (foundMember) {
        setMember(foundMember)
      } else {
        toast.error('Member not found')
        router.push(getBackPath())
      }
    } catch (error) {
      toast.error('Failed to load member')
      router.push(getBackPath())
    } finally {
      setIsLoading(false)
    }
  }

  const loadMemberBookings = async () => {
    try {
      setIsLoadingBookings(true)
      
      // First, get the member data to use for matching
      const memberResponse = await placeManagementAPI.getTableData('external_members', { limit: 500 })
      const members = Array.isArray(memberResponse) ? memberResponse : []
      const memberData = members.find((m: any) => m.id === memberId && !m.is_deleted)
      
      if (!memberData) {
        setBookings([])
        return
      }
      
      // Get all external participants
      const participantsResponse = await placeManagementAPI.getTableData('external_participants', { limit: 1000 })
      const allParticipants = Array.isArray(participantsResponse) ? participantsResponse : []
      
      // Filter participants by:
      // 1. member_id matches (primary method)
      // 2. OR email matches (fallback for older records without member_id)
      // 3. OR phone matches (fallback for older records without member_id)
      const memberEmail = memberData.email?.toLowerCase().trim() || ''
      const memberPhone = memberData.phone?.trim() || ''
      
      const participants = allParticipants.filter((p: any) => {
        if (p.is_deleted === true || p.is_deleted === 1) return false
        
        // Primary: match by member_id
        if (p.member_id === memberId) return true
        
        // Fallback: match by email (case-insensitive)
        if (memberEmail && p.email) {
          const participantEmail = p.email.toLowerCase().trim()
          if (participantEmail === memberEmail) return true
        }
        
        // Fallback: match by phone
        if (memberPhone && p.phone) {
          const participantPhone = p.phone.trim()
          if (participantPhone === memberPhone) return true
        }
        
        return false
      })
      
      const bookingIds = participants.map((p: any) => p.booking_id).filter((id: any) => id) // Remove any null/undefined
      
      if (bookingIds.length === 0) {
        setBookings([])
        return
      }
      
      // Get all bookings (remove limit or increase it significantly)
      const bookingsResponse = await placeManagementAPI.getTableData('bookings', { limit: 1000 })
      const allBookings = Array.isArray(bookingsResponse) ? bookingsResponse : []
      
      // Filter bookings that match this member's booking IDs
      // Do NOT filter out missing bookings - show ALL bookings for admin
      const memberBookingsList = allBookings
        .filter((b: any) => {
          // Must be in the booking IDs list
          if (!bookingIds.includes(b.id)) return false
          
          // Must not be deleted
          if (b.is_deleted === true || b.is_deleted === 1) return false
          
          return true
        })
        .map((b: any) => ({
          id: b.id,
          title: b.title,
          date: b.booking_date,
          startTime: b.start_time,
          endTime: b.end_time,
          place: b.place_name,
          status: b.status,
          bookingRefId: b.booking_ref_id
        }))
        .sort((a, b) => {
          // Sort by date, most recent first
          const dateA = new Date(a.date).getTime()
          const dateB = new Date(b.date).getTime()
          return dateB - dateA
        })
      
      setBookings(memberBookingsList)
    } catch (error) {
      toast.error('Failed to load booking history')
      setBookings([])
    } finally {
      setIsLoadingBookings(false)
    }
  }

  const loadMissingBookings = async () => {
    try {
      setIsLoadingMissingBookings(true)
      
      // Get external participants for this member
      const participantsResponse = await placeManagementAPI.getTableData('external_participants', { limit: 500 })
      const participants = Array.isArray(participantsResponse) ? 
        participantsResponse.filter((p: any) => 
          p.member_id === memberId && 
          (p.is_deleted === false || p.is_deleted === 0)
        ) : []
      
      const bookingIds = participants.map((p: any) => p.booking_id)
      
      if (bookingIds.length === 0) {
        setMissingBookings([])
        return
      }
      
      // Get all bookings
      const bookingsResponse = await placeManagementAPI.getTableData('bookings', { limit: 500 })
      const allBookings = Array.isArray(bookingsResponse) ? bookingsResponse : []
      
      // Filter for missing bookings (is_missing_booking = 1 or true)
      const missingBookingsList = allBookings
        .filter((b: any) => 
          bookingIds.includes(b.id) && 
          (b.is_deleted === false || b.is_deleted === 0) &&
          (b.is_missing_booking === 1 || b.is_missing_booking === true)
        )
        .map((b: any) => ({
          id: b.id,
          title: b.title,
          date: b.booking_date,
          startTime: b.start_time,
          endTime: b.end_time,
          place: b.place_name,
          status: b.status,
          bookingRefId: b.booking_ref_id,
          description: b.description
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      setMissingBookings(missingBookingsList)
    } catch (error) {
      // Silent fail - missing bookings are optional
    } finally {
      setIsLoadingMissingBookings(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Loading..." subtitle="Please wait">
        <div className="flex items-center justify-center h-96 dark:bg-background">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-purple-600 dark:text-purple-400 mb-3" />
            <p className="text-muted-foreground dark:text-muted-foreground text-[13px]">Loading member details...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!member) {
    return null
  }

  const completedBookings = bookings.filter(b => b.status === 'completed').length
  const upcomingBookings = bookings.filter(b => b.status === 'upcoming').length
  const ongoingBookings = bookings.filter(b => b.status === 'ongoing').length

  return (
    <DashboardLayout 
      title={member.full_name} 
      subtitle="External Member Details & Analytics"
    >
      <div className="space-y-3 px-2 sm:px-4 max-w-[98vw] mx-auto dark:bg-background">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => router.push(getBackPath())}
            className="gap-1.5 h-8 px-2.5 text-[13px] dark:border-border dark:text-foreground dark:hover:bg-muted cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Members
          </Button>
          
          {member.is_blacklisted && (
            <Badge variant="destructive" className="text-[13px] px-2.5 py-1 dark:bg-red-600">
              <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
              BLACKLISTED
            </Badge>
          )}
        </div>

        {/* Analytics Table - Compact Design */}
        <Card className="border shadow-md dark:bg-card dark:border-border">
          <CardContent className="p-0">
            <Table>
              <TableBody>
                <TableRow className="hover:bg-transparent">
                  <TableCell className="py-2.5 px-4 border-r dark:border-border">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                      <span className="text-[13px] text-muted-foreground dark:text-muted-foreground">Total Bookings</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 px-4 text-right border-r dark:border-border">
                    <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{bookings.length}</span>
                  </TableCell>
                  <TableCell className="py-2.5 px-4 border-r dark:border-border">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="text-[13px] text-muted-foreground dark:text-muted-foreground">Completed</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 px-4 text-right border-r dark:border-border">
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{completedBookings}</span>
                  </TableCell>
                  <TableCell className="py-2.5 px-4 border-r dark:border-border">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                      <span className="text-[13px] text-muted-foreground dark:text-muted-foreground">Upcoming</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 px-4 text-right border-r dark:border-border">
                    <span className="text-xl font-bold text-orange-600 dark:text-orange-400">{upcomingBookings}</span>
                  </TableCell>
                  <TableCell className="py-2.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      <span className="text-[13px] text-muted-foreground dark:text-muted-foreground">Visit Count</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 px-4 text-right">
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">{member.visit_count}</span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tabs for Profile and History */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="profile">👤 Profile</TabsTrigger>
            <TabsTrigger value="history">📋 History ({bookings.length})</TabsTrigger>
          </TabsList>

          {/* PROFILE TAB */}
          <TabsContent value="profile" className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Personal Information */}
              <Card className="border shadow-md dark:bg-card dark:border-border">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 dark:bg-card border-b dark:border-border/50 pb-2 pt-2.5">
                  <CardTitle className="flex items-center gap-1.5 text-[13px] font-semibold dark:text-foreground">
                    <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2.5 pb-2.5 dark:bg-card space-y-2">
                  <div>
                    <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mb-0.5">Full Name</p>
                    <p className="text-[13px] font-bold dark:text-foreground">{member.full_name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mb-0.5">Email</p>
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-muted-foreground dark:text-muted-foreground" />
                        <p className="text-[13px] font-medium dark:text-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mb-0.5">Phone</p>
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-muted-foreground dark:text-muted-foreground" />
                        <p className="text-[13px] font-medium dark:text-foreground">{member.phone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mb-0.5">Reference Type</p>
                      <p className="text-[13px] font-medium dark:text-foreground">{member.reference_type}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mb-0.5">Reference Value</p>
                      <p className="text-[13px] font-medium font-mono dark:text-foreground">{member.reference_value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Professional Information */}
              <Card className="border shadow-md dark:bg-card dark:border-border">
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 dark:bg-card border-b dark:border-border/50 pb-2 pt-2.5">
                  <CardTitle className="flex items-center gap-1.5 text-[13px] font-semibold dark:text-foreground">
                    <Building2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    Professional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2.5 pb-2.5 dark:bg-card space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mb-0.5">Company</p>
                      <p className="text-[13px] font-medium dark:text-foreground">{member.company_name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mb-0.5">Designation</p>
                      <p className="text-[13px] font-medium dark:text-foreground">{member.designation || '—'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mb-0.5">Address</p>
                    <div className="flex items-start gap-1.5">
                      <MapPin className="h-3 w-3 text-muted-foreground dark:text-muted-foreground mt-0.5" />
                      <p className="text-[13px] dark:text-foreground">{member.address || '—'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mb-0.5">City</p>
                      <p className="text-[13px] font-medium dark:text-foreground">{member.city || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mb-0.5">Country</p>
                      <p className="text-[13px] font-medium dark:text-foreground">{member.country || '—'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card className="border shadow-md dark:bg-card dark:border-border lg:col-span-2">
                <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 dark:bg-card border-b dark:border-border/50 pb-2 pt-2.5">
                  <CardTitle className="flex items-center gap-1.5 text-[13px] font-semibold dark:text-foreground">
                    <FileText className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2.5 pb-2.5 dark:bg-card space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mb-0.5">Status</p>
                      <Badge className={`text-[11px] px-2 py-0.5 ${member.is_active ? 'bg-green-500 dark:bg-green-600 text-white' : 'bg-gray-500 dark:bg-gray-600 text-white'}`}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mb-0.5">Last Visit</p>
                      <p className="text-[13px] font-medium dark:text-foreground">
                        {member.last_visit_date 
                          ? new Date(member.last_visit_date).toLocaleDateString() 
                          : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mb-0.5">Member Since</p>
                      <p className="text-[13px] font-medium dark:text-foreground">
                        {new Date(member.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {member.notes && (
                    <div>
                      <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mb-0.5">Notes</p>
                      <p className="text-[13px] bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded border border-yellow-200 dark:border-yellow-800 dark:text-foreground">
                        {member.notes}
                      </p>
                    </div>
                  )}
                  {member.is_blacklisted && (
                    <div className="p-2.5 bg-red-50 dark:bg-red-950/20 border-2 border-red-300 dark:border-red-800 rounded-lg">
                      <p className="font-bold text-red-900 dark:text-red-400 mb-1 flex items-center gap-1.5 text-[13px]">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        BLACKLISTED
                      </p>
                      <p className="text-[12px] text-red-700 dark:text-red-400">
                        {member.blacklist_reason || 'No reason provided'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="space-y-3">
            <Card className="border shadow-md dark:bg-card dark:border-border">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 dark:bg-card border-b dark:border-border/50 pb-2 pt-2.5">
                <CardTitle className="flex items-center gap-1.5 text-[13px] font-semibold dark:text-foreground">
                  <BarChart3 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  Complete Booking History
                  <Badge className="ml-auto bg-purple-600 dark:bg-purple-600 text-white text-[11px] px-2 py-0.5">
                    {bookings.length} Total Bookings
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2.5 pb-2.5 dark:bg-card">
                {isLoadingBookings ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                    <p className="text-[13px] text-muted-foreground dark:text-muted-foreground">Loading booking history...</p>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg dark:border-border">
                    <Calendar className="h-16 w-16 mx-auto text-muted-foreground dark:text-muted-foreground mb-3 opacity-30" />
                    <p className="text-muted-foreground dark:text-muted-foreground font-bold text-[13px]">No booking history</p>
                    <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mt-1">
                      This member hasn't participated in any bookings yet
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden shadow-sm dark:border-border">
                    <div className="overflow-x-auto">
                      <table className="w-full text-[13px]">
                        <thead className="bg-muted/50 dark:bg-muted/30 border-b dark:border-border">
                          <tr>
                            <th className="text-left p-2.5 font-semibold text-foreground dark:text-foreground min-w-[120px]">Ref ID</th>
                            <th className="text-left p-2.5 font-semibold text-foreground dark:text-foreground min-w-[180px]">Booking Title</th>
                            <th className="text-left p-2.5 font-semibold text-foreground dark:text-foreground min-w-[120px]">Date</th>
                            <th className="text-left p-2.5 font-semibold text-foreground dark:text-foreground min-w-[120px]">Time</th>
                            <th className="text-left p-2.5 font-semibold text-foreground dark:text-foreground min-w-[140px]">Place</th>
                            <th className="text-center p-2.5 font-semibold text-foreground dark:text-foreground min-w-[100px]">Status</th>
                          </tr>
                        </thead>
                      </table>
                      <div className="max-h-[calc(7*60px)] overflow-y-auto table-scroll-container-vertical">
                        <table className="w-full text-[13px]">
                          <tbody>
                            {bookings.map((b, idx) => (
                              <tr 
                                key={b.id} 
                                className={`border-b border-border/30 dark:border-border hover:bg-muted/20 dark:hover:bg-muted/30 transition-colors ${
                                  idx % 2 === 0 ? 'bg-transparent' : 'bg-muted/10 dark:bg-muted/10'
                                }`}
                              >
                                <td className="p-2.5 min-w-[120px]">
                                  {b.bookingRefId ? (
                                    <Badge variant="outline" className="font-mono font-bold text-[11px] px-2 py-0.5 dark:border-border dark:text-foreground">
                                      {b.bookingRefId}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground dark:text-muted-foreground">—</span>
                                  )}
                                </td>
                                <td className="p-2.5 min-w-[180px]">
                                  <p className="font-bold dark:text-foreground">{b.title}</p>
                                </td>
                                <td className="p-2.5 min-w-[120px]">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                                    <span className="font-medium dark:text-foreground">
                                      {new Date(b.date).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric', 
                                        year: 'numeric' 
                                      })}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-2.5 min-w-[120px]">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                    <span className="font-mono font-medium dark:text-foreground">
                                      {b.startTime?.substring(0,5)} - {b.endTime?.substring(0,5)}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-2.5 min-w-[140px]">
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="h-3 w-3 text-green-600 dark:text-green-400" />
                                    <span className="font-medium dark:text-foreground">{b.place}</span>
                                  </div>
                                </td>
                                <td className="p-2.5 text-center min-w-[100px]">
                                  <Badge className={`text-[11px] px-2 py-0.5 font-bold ${
                                    b.status === 'completed' ? 'bg-blue-500 dark:bg-blue-600 text-white' : 
                                    b.status === 'upcoming' ? 'bg-orange-500 dark:bg-orange-600 text-white' : 
                                    b.status === 'ongoing' ? 'bg-green-500 dark:bg-green-600 text-white' :
                                    'bg-gray-500 dark:bg-gray-600 text-white'
                                  }`}>
                                    {b.status?.toUpperCase()}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Missing Bookings Section */}
            {missingBookings.length > 0 && (
              <Card className="border shadow-md dark:bg-card dark:border-border">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 dark:bg-card border-b dark:border-border/50 pb-2 pt-2.5">
                  <CardTitle className="flex items-center gap-1.5 text-[13px] font-semibold dark:text-foreground">
                    <FileText className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    Missing Booking Records
                    <Badge className="ml-auto bg-amber-600 dark:bg-amber-600 text-white text-[11px] px-2 py-0.5">
                      {missingBookings.length} Records
                    </Badge>
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground dark:text-muted-foreground mt-1">
                    These are completed booking records collected separately and do not affect regular bookings
                  </p>
                </CardHeader>
                <CardContent className="pt-2.5 pb-2.5 dark:bg-card">
                  {isLoadingMissingBookings ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-amber-600 dark:text-amber-400" />
                      <p className="text-[13px] text-muted-foreground dark:text-muted-foreground">Loading missing booking records...</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden shadow-sm dark:border-border">
                      <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                          <thead className="bg-muted/50 dark:bg-muted/30 border-b dark:border-border">
                            <tr>
                              <th className="text-left p-2.5 font-semibold text-foreground dark:text-foreground min-w-[120px]">Ref ID</th>
                              <th className="text-left p-2.5 font-semibold text-foreground dark:text-foreground min-w-[180px]">Booking Title</th>
                              <th className="text-left p-2.5 font-semibold text-foreground dark:text-foreground min-w-[120px]">Date</th>
                              <th className="text-left p-2.5 font-semibold text-foreground dark:text-foreground min-w-[120px]">Time</th>
                              <th className="text-left p-2.5 font-semibold text-foreground dark:text-foreground min-w-[140px]">Place</th>
                              <th className="text-center p-2.5 font-semibold text-foreground dark:text-foreground min-w-[100px]">Status</th>
                            </tr>
                          </thead>
                        </table>
                        <div className="max-h-[calc(7*60px)] overflow-y-auto table-scroll-container-vertical">
                          <table className="w-full text-[13px]">
                            <tbody>
                              {missingBookings.map((b, idx) => (
                                <tr 
                                  key={b.id} 
                                  className={`border-b border-border/30 dark:border-border hover:bg-muted/20 dark:hover:bg-muted/30 transition-colors ${
                                    idx % 2 === 0 ? 'bg-transparent' : 'bg-muted/10 dark:bg-muted/10'
                                  }`}
                                >
                                  <td className="p-2.5 min-w-[120px]">
                                    {b.bookingRefId ? (
                                      <Badge variant="outline" className="font-mono font-bold text-[11px] px-2 py-0.5 dark:border-amber-500 dark:text-amber-400 border-amber-500 text-amber-600">
                                        {b.bookingRefId}
                                      </Badge>
                                    ) : (
                                      <span className="text-muted-foreground dark:text-muted-foreground">—</span>
                                    )}
                                  </td>
                                  <td className="p-2.5 min-w-[180px]">
                                    <p className="font-bold dark:text-foreground">{b.title}</p>
                                    {b.description && (
                                      <p className="text-[11px] text-muted-foreground dark:text-muted-foreground mt-0.5 line-clamp-1">
                                        {b.description}
                                      </p>
                                    )}
                                  </td>
                                  <td className="p-2.5 min-w-[120px]">
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                      <span className="font-medium dark:text-foreground">
                                        {b.date ? new Date(b.date).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric'
                                        }) : '—'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-2.5 min-w-[120px]">
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                      <span className="font-mono font-medium dark:text-foreground">
                                        {b.startTime?.substring(0,5) || '—'} - {b.endTime?.substring(0,5) || '—'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-2.5 min-w-[140px]">
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                      <span className="font-medium dark:text-foreground">{b.place || '—'}</span>
                                    </div>
                                  </td>
                                  <td className="p-2.5 text-center min-w-[100px]">
                                    <Badge className="text-[11px] px-2 py-0.5 font-bold bg-amber-500 dark:bg-amber-600 text-white">
                                      MISSING RECORD
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}


