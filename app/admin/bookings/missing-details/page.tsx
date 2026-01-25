"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Calendar, MapPin, Users, Eye, Clock } from "lucide-react"
import { placeManagementAPI } from "@/lib/place-management-api"
import toast from "react-hot-toast"
import { RouteProtection } from "@/components/auth/route-protection"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

interface MissingBooking {
  id: string
  booking_ref_id: string
  title: string
  description: string
  booking_date: string
  start_time: string
  end_time: string
  place_name: string
  responsible_person_name: string
  status: string
  created_at: string
  external_participants_count: number
  has_visit_times: boolean
}

export default function MissingBookingDetailsPage() {
  const router = useRouter()
  
  // State
  const [missingBookings, setMissingBookings] = useState<MissingBooking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<MissingBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPlace, setFilterPlace] = useState("all")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  
  // Places for filter
  const [availablePlaces, setAvailablePlaces] = useState<Array<{id: string, name: string}>>([])

  // Fetch missing bookings (is_missing_booking = 1)
  useEffect(() => {
    const fetchMissingBookings = async () => {
      try {
        setIsLoading(true)
        const bookingsResponse = await placeManagementAPI.getTableData('bookings', {
          limit: 1000
        })
        
        const bookingsData: any[] = Array.isArray(bookingsResponse) ? bookingsResponse : bookingsResponse?.data || []
        
        // Filter only missing bookings (is_missing_booking = 1)
        const missingBookingsData = bookingsData.filter((b: any) => 
          (b.is_missing_booking === 1 || b.is_missing_booking === true) && 
          (b.is_deleted === 0 || b.is_deleted === false)
        )
        
        // Fetch external participants count and visit times for each booking
        const bookingsWithDetails = await Promise.all(
          missingBookingsData.map(async (booking: any) => {
            try {
              // Get external participants count
              const participantsResponse = await placeManagementAPI.getTableData('external_participants', {
                limit: 100
              })
              const participantsData = Array.isArray(participantsResponse) ? participantsResponse : participantsResponse?.data || []
              const externalCount = participantsData.filter((p: any) => p.booking_id === booking.id).length
              
              // Check if has visit times
              const visitTimesResponse = await placeManagementAPI.getTableData('external_member_visit_times', {
                limit: 100
              })
              const visitTimesData = Array.isArray(visitTimesResponse) ? visitTimesResponse : visitTimesResponse?.data || []
              const hasVisitTimes = visitTimesData.some((vt: any) => vt.booking_id === booking.id)
              
              return {
                id: booking.id,
                booking_ref_id: booking.booking_ref_id || 'N/A',
                title: booking.title || 'Untitled',
                description: booking.description || '',
                booking_date: booking.booking_date || '',
                start_time: booking.start_time || '',
                end_time: booking.end_time || '',
                place_name: booking.place_name || 'Not specified',
                responsible_person_name: booking.responsible_person_name || 'Not assigned',
                status: booking.status || 'pending',
                created_at: booking.created_at || '',
                external_participants_count: externalCount,
                has_visit_times: hasVisitTimes
              }
            } catch (error) {
              console.error('Error fetching details for booking:', booking.id, error)
              return {
                id: booking.id,
                booking_ref_id: booking.booking_ref_id || 'N/A',
                title: booking.title || 'Untitled',
                description: booking.description || '',
                booking_date: booking.booking_date || '',
                start_time: booking.start_time || '',
                end_time: booking.end_time || '',
                place_name: booking.place_name || 'Not specified',
                responsible_person_name: booking.responsible_person_name || 'Not assigned',
                status: booking.status || 'pending',
                created_at: booking.created_at || '',
                external_participants_count: 0,
                has_visit_times: false
              }
            }
          })
        )
        
        // Sort by date (newest first)
        bookingsWithDetails.sort((a, b) => {
          const dateA = a.booking_date ? new Date(a.booking_date).getTime() : 0
          const dateB = b.booking_date ? new Date(b.booking_date).getTime() : 0
          return dateB - dateA
        })
        
        setMissingBookings(bookingsWithDetails)
        setFilteredBookings(bookingsWithDetails)
      } catch (error) {
        console.error('Failed to fetch missing bookings:', error)
        toast.error('Failed to load missing booking records', {
          position: 'top-center',
          duration: 4000
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchMissingBookings()
  }, [])

  // Fetch places for filter
  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const placesData = await placeManagementAPI.getTableData('places', {
          is_deleted: 'false',
          is_active: 'true'
        })
        
        const placesArray = Array.isArray(placesData) ? placesData : placesData?.data || []
        setAvailablePlaces(placesArray.map((p: any) => ({ id: p.id, name: p.name })))
      } catch (error) {
        console.error('Failed to fetch places:', error)
      }
    }
    
    fetchPlaces()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = [...missingBookings]

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(b => {
        const titleMatch = b.title?.toLowerCase().includes(searchLower) || false
        const descMatch = b.description?.toLowerCase().includes(searchLower) || false
        const placeMatch = b.place_name?.toLowerCase().includes(searchLower) || false
        const responsibleMatch = b.responsible_person_name?.toLowerCase().includes(searchLower) || false
        const refIdMatch = b.booking_ref_id?.toLowerCase().includes(searchLower) || false
        return titleMatch || descMatch || placeMatch || responsibleMatch || refIdMatch
      })
    }

    // Place filter
    if (filterPlace !== "all") {
      filtered = filtered.filter(b => {
        const place = availablePlaces.find(p => p.id === filterPlace)
        return place && b.place_name?.toLowerCase().includes(place.name.toLowerCase())
      })
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(b => b.status?.toLowerCase() === filterStatus?.toLowerCase())
    }

    // Date range filter
    if (filterDateFrom) {
      filtered = filtered.filter(b => b.booking_date >= filterDateFrom)
    }
    if (filterDateTo) {
      filtered = filtered.filter(b => b.booking_date <= filterDateTo)
    }

    setFilteredBookings(filtered)
  }, [missingBookings, searchTerm, filterPlace, filterStatus, filterDateFrom, filterDateTo, availablePlaces])

  // Format time
  const formatTime = (time: string) => {
    if (!time) return 'N/A'
    return time.substring(0, 5) // Remove seconds
  }

  // Format date
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

  // Get status badge variant
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

  return (
    <RouteProtection allowedRoles={['admin']}>
      <DashboardLayout 
        title="Missing Booking Records"
        subtitle="Record collection for completed bookings"
      >
        <div className="space-y-2.5 px-2 sm:px-4 max-w-[98vw] mx-auto dark:bg-background">
          {/* Header with Create Button */}
          <div className="flex items-center justify-between">
            <div></div>
            <Button
              onClick={() => router.push('/admin/bookings/missing-details/new')}
              className="h-8 px-3 text-[13px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600 shadow-lg"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Create Missing Booking
            </Button>
          </div>

          {/* Filters and Search - All in One Line */}
          <Card className="dark:bg-card dark:border-border shadow-md">
            <CardContent className="p-2.5 dark:bg-card">
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-8 text-[12px] dark:bg-card dark:border-border dark:text-foreground"
                  />
                </div>

                {/* Place Filter */}
                <Select value={filterPlace} onValueChange={setFilterPlace}>
                  <SelectTrigger className="h-8 w-[140px] text-[12px] dark:bg-card dark:border-border dark:text-foreground">
                    <SelectValue placeholder="All Places" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-card dark:border-border">
                    <SelectItem value="all" className="dark:text-foreground dark:hover:bg-muted text-[12px]">All Places</SelectItem>
                    {availablePlaces.map((place) => (
                      <SelectItem key={place.id} value={place.id} className="dark:text-foreground dark:hover:bg-muted text-[12px]">
                        {place.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 w-[120px] text-[12px] dark:bg-card dark:border-border dark:text-foreground">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-card dark:border-border">
                    <SelectItem value="all" className="dark:text-foreground dark:hover:bg-muted text-[12px]">All Status</SelectItem>
                    <SelectItem value="pending" className="dark:text-foreground dark:hover:bg-muted text-[12px]">Pending</SelectItem>
                    <SelectItem value="ongoing" className="dark:text-foreground dark:hover:bg-muted text-[12px]">Ongoing</SelectItem>
                    <SelectItem value="completed" className="dark:text-foreground dark:hover:bg-muted text-[12px]">Completed</SelectItem>
                    <SelectItem value="cancelled" className="dark:text-foreground dark:hover:bg-muted text-[12px]">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date From */}
                <Input
                  type="date"
                  placeholder="From"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="h-8 w-[140px] text-[12px] dark:bg-card dark:border-border dark:text-foreground"
                />

                {/* Date To */}
                <Input
                  type="date"
                  placeholder="To"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="h-8 w-[140px] text-[12px] dark:bg-card dark:border-border dark:text-foreground"
                />
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards - Zip Design */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Card className="dark:bg-card dark:border-border shadow-sm">
              <CardContent className="p-2 dark:bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground dark:text-muted-foreground">Total</p>
                    <p className="text-base font-bold dark:text-foreground">{missingBookings.length}</p>
                  </div>
                  <Calendar className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-card dark:border-border shadow-sm">
              <CardContent className="p-2 dark:bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground dark:text-muted-foreground">Filtered</p>
                    <p className="text-base font-bold dark:text-foreground">{filteredBookings.length}</p>
                  </div>
                  <Search className="h-6 w-6 text-purple-500 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-card dark:border-border shadow-sm">
              <CardContent className="p-2 dark:bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground dark:text-muted-foreground">With External</p>
                    <p className="text-base font-bold dark:text-foreground">
                      {missingBookings.filter(b => b.external_participants_count > 0).length}
                    </p>
                  </div>
                  <Users className="h-6 w-6 text-green-500 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-card dark:border-border shadow-sm">
              <CardContent className="p-2 dark:bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground dark:text-muted-foreground">Visit Times</p>
                    <p className="text-base font-bold dark:text-foreground">
                      {missingBookings.filter(b => b.has_visit_times).length}
                    </p>
                  </div>
                  <Clock className="h-6 w-6 text-orange-500 dark:text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card className="dark:bg-card dark:border-border shadow-md">
            <CardHeader className="dark:border-border/50 py-2">
              <CardTitle className="dark:text-foreground text-[13px] font-semibold">Missing Booking Records</CardTitle>
            </CardHeader>
            <CardContent className="p-0 dark:bg-card">
              {isLoading ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground dark:text-muted-foreground text-[13px]">Loading missing booking records...</p>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground dark:text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground dark:text-muted-foreground text-[13px]">No missing booking records found</p>
                  <Button
                    onClick={() => router.push('/admin/bookings/missing-details/new')}
                    className="mt-4 h-8 px-3 text-[12px] dark:bg-primary dark:hover:bg-primary/90"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Create Missing Booking
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden dark:border-border">
                  <div className="overflow-x-auto">
                    <div className="max-h-[calc(7*50px)] overflow-y-auto table-scroll-container-vertical">
                      <Table>
                        <TableHeader className="sticky top-0 z-10 bg-background dark:bg-card">
                          <TableRow>
                            <TableHead className="w-[100px] text-[11px] font-semibold dark:text-foreground py-2">Ref ID</TableHead>
                            <TableHead className="min-w-[200px] text-[11px] font-semibold dark:text-foreground py-2">Title</TableHead>
                            <TableHead className="w-[150px] text-[11px] font-semibold dark:text-foreground py-2">Date & Time</TableHead>
                            <TableHead className="w-[120px] text-[11px] font-semibold dark:text-foreground py-2">Place</TableHead>
                            <TableHead className="min-w-[150px] text-[11px] font-semibold dark:text-foreground py-2">Responsible</TableHead>
                            <TableHead className="w-[100px] text-[11px] font-semibold dark:text-foreground py-2">External</TableHead>
                            <TableHead className="w-[100px] text-[11px] font-semibold dark:text-foreground py-2">Status</TableHead>
                            <TableHead className="w-[100px] text-[11px] font-semibold dark:text-foreground py-2">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredBookings.map((booking) => (
                            <TableRow key={booking.id} className="dark:hover:bg-muted/50">
                              <TableCell className="text-[11px] dark:text-foreground font-mono py-2">
                                {booking.booking_ref_id}
                              </TableCell>
                              <TableCell className="text-[11px] dark:text-foreground py-2">
                                <div>
                                  <p className="font-medium truncate max-w-[200px]">{booking.title}</p>
                                  {booking.description && (
                                    <p className="text-[10px] text-muted-foreground dark:text-muted-foreground truncate max-w-[200px]">
                                      {booking.description}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-[11px] dark:text-foreground py-2">
                                <div>
                                  <p className="text-[11px]">{formatDate(booking.booking_date)}</p>
                                  <p className="text-[10px] text-muted-foreground dark:text-muted-foreground">
                                    {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-[11px] dark:text-foreground py-2">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate max-w-[100px]">{booking.place_name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-[11px] dark:text-foreground py-2">
                                <span className="truncate max-w-[150px] block">{booking.responsible_person_name}</span>
                              </TableCell>
                              <TableCell className="text-[11px] dark:text-foreground py-2">
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  <span>{booking.external_participants_count}</span>
                                  {booking.has_visit_times && (
                                    <Clock className="h-3 w-3 text-green-500 dark:text-green-400 ml-1" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-[11px] py-2">
                                {getStatusBadge(booking.status)}
                              </TableCell>
                              <TableCell className="text-[11px] py-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                                  className="h-6 px-2 dark:hover:bg-muted"
                                  title="View Details"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </RouteProtection>
  )
}











