"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, MapPin, Users, Clock, Utensils, User, Mail, Phone, FileText, Eye } from "lucide-react"
import { placeManagementAPI } from "@/lib/place-management-api"
import toast from "react-hot-toast"
import { RouteProtection } from "@/components/auth/route-protection"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface BookingDetail {
  id: string
  booking_ref_id: string
  title: string
  description: string
  booking_date: string
  start_time: string
  end_time: string
  place_name: string
  place_id: string
  responsible_person_id: string
  responsible_person_name: string
  status: string
  is_missing_booking: boolean | number
  refreshments_required: boolean | number
  refreshment_type: string
  refreshment_items: string
  refreshment_serving_time: string
  refreshment_special_requests: string
  refreshment_estimated_count: number
  created_at: string
  created_by: string
}

interface Participant {
  id: string
  employee_name: string
  employee_email: string
  employee_phone: string
  employee_department: string
  employee_role: string
}

interface ExternalParticipant {
  id: string
  full_name: string
  email: string
  phone: string
  company_name: string
  visitor_pass_id: string
}

interface VisitTime {
  id: string
  external_participant_id: string
  member_id: string
  in_time: string
  out_time: string
  visitor_pass_id: string
  pass_type_id: string
}

export default function BookingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string

  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [externalParticipants, setExternalParticipants] = useState<ExternalParticipant[]>([])
  const [visitTimes, setVisitTimes] = useState<VisitTime[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (bookingId) {
      loadBookingDetails()
    }
  }, [bookingId])

  const loadBookingDetails = async () => {
    try {
      setIsLoading(true)
      
      // Fetch booking
      const bookingsResponse = await placeManagementAPI.getTableData('bookings', {
        limit: 1000
      })
      const allBookings = Array.isArray(bookingsResponse) ? bookingsResponse : bookingsResponse?.data || []
      const bookingData = allBookings.find((b: any) => b.id === bookingId && (b.is_deleted === 0 || b.is_deleted === false))

      if (!bookingData) {
        toast.error('Booking not found')
        router.push('/admin/bookings')
        return
      }

      setBooking({
        id: bookingData.id,
        booking_ref_id: bookingData.booking_ref_id || 'N/A',
        title: bookingData.title || 'Untitled',
        description: bookingData.description || '',
        booking_date: bookingData.booking_date || '',
        start_time: bookingData.start_time || '',
        end_time: bookingData.end_time || '',
        place_name: bookingData.place_name || 'Not specified',
        place_id: bookingData.place_id || '',
        responsible_person_id: bookingData.responsible_person_id || '',
        responsible_person_name: bookingData.responsible_person_name || 'Not assigned',
        status: bookingData.status || 'pending',
        is_missing_booking: bookingData.is_missing_booking || 0,
        refreshments_required: bookingData.refreshments_required || 0,
        refreshment_type: bookingData.refreshment_type || '',
        refreshment_items: bookingData.refreshment_items || '',
        refreshment_serving_time: bookingData.refreshment_serving_time || '',
        refreshment_special_requests: bookingData.refreshment_special_requests || '',
        refreshment_estimated_count: bookingData.refreshment_estimated_count || 0,
        created_at: bookingData.created_at || '',
        created_by: bookingData.created_by || ''
      })

      // Fetch internal participants
      const participantsResponse = await placeManagementAPI.getTableData('booking_participants', {
        limit: 100
      })
      const allParticipants = Array.isArray(participantsResponse) ? participantsResponse : participantsResponse?.data || []
      const bookingParticipants = allParticipants.filter((p: any) => 
        p.booking_id === bookingId && (p.is_deleted === 0 || p.is_deleted === false)
      )
      setParticipants(bookingParticipants)

      // Fetch external participants
      const externalResponse = await placeManagementAPI.getTableData('external_participants', {
        limit: 100
      })
      const allExternals = Array.isArray(externalResponse) ? externalResponse : externalResponse?.data || []
      const bookingExternals = allExternals.filter((p: any) => 
        p.booking_id === bookingId && (p.is_deleted === 0 || p.is_deleted === false)
      )
      setExternalParticipants(bookingExternals)

      // Fetch visit times if missing booking
      if (bookingData.is_missing_booking === 1 || bookingData.is_missing_booking === true) {
        const visitTimesResponse = await placeManagementAPI.getTableData('external_member_visit_times', {
          limit: 100
        })
        const allVisitTimes = Array.isArray(visitTimesResponse) ? visitTimesResponse : visitTimesResponse?.data || []
        const bookingVisitTimes = allVisitTimes.filter((vt: any) => vt.booking_id === bookingId)
        setVisitTimes(bookingVisitTimes)
      }

    } catch (error) {
      console.error('Failed to load booking details:', error)
      toast.error('Failed to load booking details')
      router.push('/admin/bookings')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (time: string) => {
    if (!time) return 'N/A'
    return time.substring(0, 5)
  }

  const formatDate = (date: string) => {
    if (!date) return 'N/A'
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return date
    }
  }

  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return 'N/A'
    try {
      return new Date(dateTime).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateTime
    }
  }

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || ''
    if (statusLower === 'completed') {
      return <Badge className="bg-green-500 dark:bg-green-600 text-white text-[11px] px-2 py-0.5">Completed</Badge>
    } else if (statusLower === 'cancelled') {
      return <Badge className="bg-red-500 dark:bg-red-600 text-white text-[11px] px-2 py-0.5">Cancelled</Badge>
    } else if (statusLower === 'ongoing') {
      return <Badge className="bg-blue-500 dark:bg-blue-600 text-white text-[11px] px-2 py-0.5">Ongoing</Badge>
    } else {
      return <Badge variant="outline" className="dark:border-border text-[11px] px-2 py-0.5">Pending</Badge>
    }
  }

  if (isLoading) {
    return (
      <RouteProtection allowedRoles={['admin']}>
        <DashboardLayout title="Loading..." subtitle="Please wait">
          <div className="flex items-center justify-center h-96 dark:bg-background">
            <div className="text-center">
              <p className="text-muted-foreground dark:text-muted-foreground text-[13px]">Loading booking details...</p>
            </div>
          </div>
        </DashboardLayout>
      </RouteProtection>
    )
  }

  if (!booking) {
    return null
  }

  const isMissingBooking = booking.is_missing_booking === 1 || booking.is_missing_booking === true

  return (
    <RouteProtection allowedRoles={['admin']}>
      <DashboardLayout 
        title={booking.title}
        subtitle={isMissingBooking ? "Missing Booking Record" : "Booking Details"}
      >
        <div className="space-y-2.5 px-2 sm:px-4 max-w-[98vw] mx-auto dark:bg-background">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (isMissingBooking) {
                  router.push('/admin/bookings/missing-details')
                } else {
                  router.push('/admin/bookings')
                }
              }}
              className="h-8 px-3 text-[12px] dark:border-border dark:hover:bg-muted dark:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Back
            </Button>
            {isMissingBooking && (
              <Badge className="bg-amber-500 dark:bg-amber-600 text-white text-[11px] px-2 py-1">
                Missing Booking Record
              </Badge>
            )}
          </div>

          {/* Basic Information */}
          <Card className="dark:bg-card dark:border-border shadow-md">
            <CardHeader className="dark:border-border/50 py-2">
              <CardTitle className="dark:text-foreground text-[13px] font-semibold">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 dark:bg-card">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <p className="text-[11px] text-muted-foreground dark:text-muted-foreground mb-1">Reference ID</p>
                  <Badge variant="outline" className="font-mono text-[11px] dark:border-border">
                    {booking.booking_ref_id}
                  </Badge>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground dark:text-muted-foreground mb-1">Status</p>
                  {getStatusBadge(booking.status)}
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground dark:text-muted-foreground mb-1">Date</p>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-muted-foreground dark:text-muted-foreground" />
                    <span className="text-[12px] font-medium dark:text-foreground">{formatDate(booking.booking_date)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground dark:text-muted-foreground mb-1">Time</p>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-muted-foreground dark:text-muted-foreground" />
                    <span className="text-[12px] font-medium dark:text-foreground">
                      {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground dark:text-muted-foreground mb-1">Place</p>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-muted-foreground dark:text-muted-foreground" />
                  <span className="text-[12px] font-medium dark:text-foreground">{booking.place_name}</span>
                </div>
              </div>
              {booking.description && (
                <div>
                  <p className="text-[11px] text-muted-foreground dark:text-muted-foreground mb-1">Description</p>
                  <p className="text-[12px] dark:text-foreground">{booking.description}</p>
                </div>
              )}
              <div>
                <p className="text-[11px] text-muted-foreground dark:text-muted-foreground mb-1">Responsible Person</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="dark:bg-primary/20 dark:text-primary text-[11px]">
                      {booking.responsible_person_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[12px] font-medium dark:text-foreground">{booking.responsible_person_name}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participants */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
            {/* Internal Participants */}
            <Card className="dark:bg-card dark:border-border shadow-md">
              <CardHeader className="dark:border-border/50 py-2">
                <CardTitle className="dark:text-foreground text-[13px] font-semibold flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Internal Participants ({participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 dark:bg-card">
                {participants.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-[12px] text-muted-foreground dark:text-muted-foreground">No internal participants</p>
                  </div>
                ) : (
                  <div className="max-h-[calc(5*60px)] overflow-y-auto table-scroll-container-vertical">
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-background dark:bg-card">
                        <TableRow>
                          <TableHead className="text-[11px] dark:text-foreground py-2">Name</TableHead>
                          <TableHead className="text-[11px] dark:text-foreground py-2">Email</TableHead>
                          <TableHead className="text-[11px] dark:text-foreground py-2">Department</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {participants.map((p) => (
                          <TableRow key={p.id} className="dark:hover:bg-muted/50">
                            <TableCell className="text-[11px] dark:text-foreground py-2">
                              {p.employee_name}
                            </TableCell>
                            <TableCell className="text-[11px] dark:text-foreground py-2">
                              {p.employee_email || '—'}
                            </TableCell>
                            <TableCell className="text-[11px] dark:text-foreground py-2">
                              {p.employee_department || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* External Participants */}
            <Card className="dark:bg-card dark:border-border shadow-md">
              <CardHeader className="dark:border-border/50 py-2">
                <CardTitle className="dark:text-foreground text-[13px] font-semibold flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  External Participants ({externalParticipants.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 dark:bg-card">
                {externalParticipants.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-[12px] text-muted-foreground dark:text-muted-foreground">No external participants</p>
                  </div>
                ) : (
                  <div className="max-h-[calc(5*60px)] overflow-y-auto table-scroll-container-vertical">
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-background dark:bg-card">
                        <TableRow>
                          <TableHead className="text-[11px] dark:text-foreground py-2">Name</TableHead>
                          <TableHead className="text-[11px] dark:text-foreground py-2">Email</TableHead>
                          <TableHead className="text-[11px] dark:text-foreground py-2">Phone</TableHead>
                          {isMissingBooking && (
                            <TableHead className="text-[11px] dark:text-foreground py-2">Pass ID</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {externalParticipants.map((ep) => {
                          const visitTime = visitTimes.find(vt => vt.external_participant_id === ep.id)
                          return (
                            <TableRow key={ep.id} className="dark:hover:bg-muted/50">
                              <TableCell className="text-[11px] dark:text-foreground py-2">
                                {ep.full_name}
                              </TableCell>
                              <TableCell className="text-[11px] dark:text-foreground py-2">
                                {ep.email || '—'}
                              </TableCell>
                              <TableCell className="text-[11px] dark:text-foreground py-2">
                                {ep.phone || '—'}
                              </TableCell>
                              {isMissingBooking && (
                                <TableCell className="text-[11px] dark:text-foreground py-2">
                                  {visitTime?.visitor_pass_id || ep.visitor_pass_id || '—'}
                                </TableCell>
                              )}
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Visit Times (Only for Missing Bookings) */}
          {isMissingBooking && visitTimes.length > 0 && (
            <Card className="dark:bg-card dark:border-border shadow-md">
              <CardHeader className="dark:border-border/50 py-2">
                <CardTitle className="dark:text-foreground text-[13px] font-semibold flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Visit Times ({visitTimes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 dark:bg-card">
                <div className="max-h-[calc(5*60px)] overflow-y-auto table-scroll-container-vertical">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-background dark:bg-card">
                      <TableRow>
                        <TableHead className="text-[11px] dark:text-foreground py-2">Participant</TableHead>
                        <TableHead className="text-[11px] dark:text-foreground py-2">In-Time</TableHead>
                        <TableHead className="text-[11px] dark:text-foreground py-2">Out-Time</TableHead>
                        <TableHead className="text-[11px] dark:text-foreground py-2">Pass ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visitTimes.map((vt) => {
                        const participant = externalParticipants.find(ep => ep.id === vt.external_participant_id)
                        return (
                          <TableRow key={vt.id} className="dark:hover:bg-muted/50">
                            <TableCell className="text-[11px] dark:text-foreground py-2">
                              {participant?.full_name || 'Unknown'}
                            </TableCell>
                            <TableCell className="text-[11px] dark:text-foreground py-2">
                              {vt.in_time ? formatDateTime(vt.in_time) : '—'}
                            </TableCell>
                            <TableCell className="text-[11px] dark:text-foreground py-2">
                              {vt.out_time ? formatDateTime(vt.out_time) : '—'}
                            </TableCell>
                            <TableCell className="text-[11px] dark:text-foreground py-2">
                              {vt.visitor_pass_id || '—'}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Refreshments */}
          {booking.refreshments_required && (
            <Card className="dark:bg-card dark:border-border shadow-md">
              <CardHeader className="dark:border-border/50 py-2">
                <CardTitle className="dark:text-foreground text-[13px] font-semibold flex items-center gap-1.5">
                  <Utensils className="h-3.5 w-3.5" />
                  Refreshments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 dark:bg-card">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground dark:text-muted-foreground mb-1">Type</p>
                    <p className="text-[12px] font-medium dark:text-foreground">{booking.refreshment_type || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground dark:text-muted-foreground mb-1">Serving Time</p>
                    <p className="text-[12px] font-medium dark:text-foreground">{booking.refreshment_serving_time || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground dark:text-muted-foreground mb-1">Estimated Count</p>
                    <p className="text-[12px] font-medium dark:text-foreground">{booking.refreshment_estimated_count || '—'}</p>
                  </div>
                </div>
                {booking.refreshment_items && (
                  <div>
                    <p className="text-[11px] text-muted-foreground dark:text-muted-foreground mb-1">Items</p>
                    <p className="text-[12px] dark:text-foreground">{booking.refreshment_items}</p>
                  </div>
                )}
                {booking.refreshment_special_requests && (
                  <div>
                    <p className="text-[11px] text-muted-foreground dark:text-muted-foreground mb-1">Special Requests</p>
                    <p className="text-[12px] dark:text-foreground">{booking.refreshment_special_requests}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </RouteProtection>
  )
}











