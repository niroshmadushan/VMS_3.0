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
  CheckCircle, XCircle
} from "lucide-react"
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
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingBookings, setIsLoadingBookings] = useState(false)

  useEffect(() => {
    requireAuth(["admin"])
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
        router.push('/admin/external-members')
      }
    } catch (error) {
      toast.error('Failed to load member')
      router.push('/admin/external-members')
    } finally {
      setIsLoading(false)
    }
  }

  const loadMemberBookings = async () => {
    try {
      setIsLoadingBookings(true)
      
      const participantsResponse = await placeManagementAPI.getTableData('external_participants', { limit: 500 })
      const participants = Array.isArray(participantsResponse) ? 
        participantsResponse.filter((p: any) => 
          p.member_id === memberId && 
          (p.is_deleted === false || p.is_deleted === 0)
        ) : []
      
      const bookingIds = participants.map((p: any) => p.booking_id)
      
      if (bookingIds.length === 0) {
        setBookings([])
        return
      }
      
      const bookingsResponse = await placeManagementAPI.getTableData('bookings', { limit: 500 })
      const allBookings = Array.isArray(bookingsResponse) ? bookingsResponse : []
      
      const memberBookingsList = allBookings
        .filter((b: any) => 
          bookingIds.includes(b.id) && 
          (b.is_deleted === false || b.is_deleted === 0)
        )
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
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      setBookings(memberBookingsList)
    } catch (error) {
      console.error('Failed to load member bookings:', error)
      toast.error('Failed to load booking history')
    } finally {
      setIsLoadingBookings(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Loading..." subtitle="Please wait">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
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
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin/external-members')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Members
          </Button>
          
          {member.is_blacklisted && (
            <Badge variant="destructive" className="text-lg px-4 py-2">
              <ShieldAlert className="h-5 w-5 mr-2" />
              BLACKLISTED
            </Badge>
          )}
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Total Bookings</p>
                  <p className="text-4xl font-bold text-purple-900 mt-2">{bookings.length}</p>
                </div>
                <div className="p-4 bg-purple-500 rounded-lg">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Completed</p>
                  <p className="text-4xl font-bold text-blue-900 mt-2">{completedBookings}</p>
                </div>
                <div className="p-4 bg-blue-500 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Upcoming</p>
                  <p className="text-4xl font-bold text-orange-900 mt-2">{upcomingBookings}</p>
                </div>
                <div className="p-4 bg-orange-500 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Visit Count</p>
                  <p className="text-4xl font-bold text-green-900 mt-2">{member.visit_count}</p>
                </div>
                <div className="p-4 bg-green-500 rounded-lg">
                  <Activity className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Profile and History */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="profile">👤 Profile</TabsTrigger>
            <TabsTrigger value="history">📋 History ({bookings.length})</TabsTrigger>
          </TabsList>

          {/* PROFILE TAB */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                    <p className="text-lg font-bold">{member.full_name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Email</p>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">{member.email}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Phone</p>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">{member.phone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Reference Type</p>
                      <p className="text-sm font-medium">{member.reference_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Reference Value</p>
                      <p className="text-sm font-medium font-mono">{member.reference_value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Professional Information */}
              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-green-600" />
                    Professional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Company</p>
                      <p className="text-sm font-medium">{member.company_name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Designation</p>
                      <p className="text-sm font-medium">{member.designation || '—'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Address</p>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm">{member.address || '—'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">City</p>
                      <p className="text-sm font-medium">{member.city || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Country</p>
                      <p className="text-sm font-medium">{member.country || '—'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card className="border-2 shadow-lg lg:col-span-2">
                <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-yellow-600" />
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <Badge className={member.is_active ? 'bg-green-500' : 'bg-gray-500'}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Last Visit</p>
                      <p className="text-sm font-medium">
                        {member.last_visit_date 
                          ? new Date(member.last_visit_date).toLocaleDateString() 
                          : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Member Since</p>
                      <p className="text-sm font-medium">
                        {new Date(member.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {member.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm bg-yellow-50 p-3 rounded border border-yellow-200">
                        {member.notes}
                      </p>
                    </div>
                  )}
                  {member.is_blacklisted && (
                    <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                      <p className="font-bold text-red-900 mb-2 flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5" />
                        BLACKLISTED
                      </p>
                      <p className="text-sm text-red-700">
                        {member.blacklist_reason || 'No reason provided'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history">
            <Card className="border-2 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                  Complete Booking History
                  <Badge className="ml-auto bg-purple-600 text-white text-base px-4 py-2">
                    {bookings.length} Total Bookings
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoadingBookings ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-lg text-muted-foreground">Loading booking history...</p>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <Calendar className="h-20 w-20 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground font-bold text-xl">No booking history</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      This member hasn't participated in any bookings yet
                    </p>
                  </div>
                ) : (
                  <div className="border-2 rounded-lg overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-purple-100 to-blue-100">
                          <tr>
                            <th className="text-left p-4 font-bold">Ref ID</th>
                            <th className="text-left p-4 font-bold">Booking Title</th>
                            <th className="text-left p-4 font-bold">Date</th>
                            <th className="text-left p-4 font-bold">Time</th>
                            <th className="text-left p-4 font-bold">Place</th>
                            <th className="text-center p-4 font-bold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map((b, idx) => (
                            <tr 
                              key={b.id} 
                              className={`border-t-2 hover:bg-purple-50 transition-all ${
                                idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                              }`}
                            >
                              <td className="p-4">
                                {b.bookingRefId ? (
                                  <Badge variant="outline" className="font-mono font-bold">
                                    {b.bookingRefId}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="p-4">
                                <p className="font-bold">{b.title}</p>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-5 w-5 text-purple-600" />
                                  <span className="font-medium">
                                    {new Date(b.date).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric', 
                                      year: 'numeric' 
                                    })}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-5 w-5 text-blue-600" />
                                  <span className="font-mono font-medium">
                                    {b.startTime?.substring(0,5)} - {b.endTime?.substring(0,5)}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-5 w-5 text-green-600" />
                                  <span className="font-medium">{b.place}</span>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <Badge className={`px-4 py-1.5 font-bold ${
                                  b.status === 'completed' ? 'bg-blue-500 text-white' : 
                                  b.status === 'upcoming' ? 'bg-orange-500 text-white' : 
                                  b.status === 'ongoing' ? 'bg-green-500 text-white' :
                                  'bg-gray-500 text-white'
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
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}


