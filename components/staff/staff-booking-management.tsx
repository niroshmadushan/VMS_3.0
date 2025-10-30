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
import { Plus, Search, Calendar, MapPin, Users, Clock, User, CalendarDays, Filter, Calendar as CalendarIcon } from "lucide-react"
import { placeManagementAPI } from "@/lib/place-management-api"
import toast from "react-hot-toast"
import { useAuth } from "@/lib/auth-context"

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

  // Load bookings
  useEffect(() => {
    loadBookings()
  }, [user])

  const loadBookings = async () => {
    try {
      setIsLoading(true)
      
      const response = await placeManagementAPI.getTableData('bookings', {
        filters: [{ field: 'is_deleted', operator: '=', value: 0 }],
        limit: 500
      })
      
      const bookingsData: Booking[] = Array.isArray(response) ? response : []
      
      // Normalize dates
      const normalizedBookings = bookingsData.map((booking: any) => {
        let normalizedDate = booking.booking_date
        if (normalizedDate && typeof normalizedDate === 'string' && normalizedDate.includes('T')) {
          const d = new Date(normalizedDate)
          normalizedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        }
        return {
          ...booking,
          booking_date: normalizedDate
        }
      })
      
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

  const BookingTable = ({ bookings }: { bookings: Booking[] }) => (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-gray-100 to-gray-200">
            <TableHead className="font-semibold">Ref ID</TableHead>
            <TableHead className="font-semibold">Title</TableHead>
            <TableHead className="font-semibold">Date & Time</TableHead>
            <TableHead className="font-semibold">Place</TableHead>
            <TableHead className="font-semibold">Responsible Person</TableHead>
            <TableHead className="text-center font-semibold">Participants</TableHead>
            <TableHead className="text-center font-semibold">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No bookings found
              </TableCell>
            </TableRow>
          ) : (
            bookings.map((booking) => (
              <TableRow key={booking.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-mono text-xs">
                  <Badge variant="outline" className="bg-blue-50">
                    {booking.booking_ref_id}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-semibold">{booking.title}</p>
                    {booking.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{booking.description}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
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
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{booking.place_name}</span>
                  </div>
                </TableCell>
                <TableCell>
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
                <TableCell className="text-center">
                  <Badge variant="outline" className="bg-purple-50">
                    <Users className="h-3 w-3 mr-1" />
                    {booking.total_participants || 0}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
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
        <Button onClick={() => router.push('/staff/bookings/new')} className="bg-gradient-to-r from-blue-600 to-purple-600">
          <Plus className="h-4 w-4 mr-2" />
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
    </div>
  )
}

