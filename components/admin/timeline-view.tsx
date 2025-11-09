"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, Clock, MapPin, Users, Edit, Trash2, Utensils, AlertTriangle } from "lucide-react"
import { placeManagementAPI } from "@/lib/place-management-api"
import toast from "react-hot-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Booking {
  id: string
  bookingRefId?: string
  title: string
  description?: string
  date: string
  place: string
  placeId?: string
  startTime: string
  endTime: string
  responsiblePerson?: { name: string; email: string }
  selectedEmployees: any[]
  externalParticipants: any[]
  refreshments?: { required: boolean; type: string; servingTime?: string }
  status: "upcoming" | "ongoing" | "completed" | "cancelled"
  totalParticipantsCount?: number
}

export function TimelineView() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState("")
  const [confirmMessage, setConfirmMessage] = useState("")
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null)

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  // Fetch today's bookings
  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setIsLoading(true)
      const today = new Date().toISOString().split('T')[0]
      console.log('📅 Fetching today\'s bookings for date:', today)
      
      const [bookingsData, participantsData, externalData, refreshmentsData] = await Promise.all([
        placeManagementAPI.getTableData('bookings', { 
          filters: [{ field: 'is_deleted', operator: '=', value: 0 }],
          limit: 200 
        }),
        placeManagementAPI.getTableData('booking_participants', { limit: 500 }),
        placeManagementAPI.getTableData('external_participants', { limit: 500 }),
        placeManagementAPI.getTableData('booking_refreshments', { limit: 200 })
      ])

      console.log('📊 Fetched data:', {
        bookings: bookingsData.length,
        participants: participantsData.length,
        externals: externalData.length
      })

      const allBookings = Array.isArray(bookingsData) ? bookingsData : []
      const allParticipants = Array.isArray(participantsData) ? participantsData : []
      const allExternals = Array.isArray(externalData) ? externalData : []
      const allRefreshments = Array.isArray(refreshmentsData) ? refreshmentsData : []

      console.log('🔍 All bookings from database:', allBookings.length)
      allBookings.forEach((b, idx) => {
        console.log(`  ${idx + 1}. "${b.title}" - booking_date:`, b.booking_date, `(type: ${typeof b.booking_date})`)
      })

      const formattedBookings: Booking[] = allBookings
        .map(b => {
          let bookingDate = b.booking_date
          
          // Normalize date format - be more aggressive
          if (typeof bookingDate === 'string') {
            // ISO timestamp: "2025-10-02T18:30:00.000Z"
            if (bookingDate.includes('T')) {
              // Extract local date from ISO timestamp
              const d = new Date(bookingDate)
              const year = d.getFullYear()
              const month = String(d.getMonth() + 1).padStart(2, '0')
              const day = String(d.getDate()).padStart(2, '0')
              bookingDate = `${year}-${month}-${day}`
            } 
            // MySQL datetime: "2025-10-02 10:30:00"
            else if (bookingDate.includes(' ')) {
              bookingDate = bookingDate.split(' ')[0]
            }
            // Already simple format: "2025-10-02"
          } else if (bookingDate instanceof Date) {
            const d = new Date(bookingDate)
            const year = d.getFullYear()
            const month = String(d.getMonth() + 1).padStart(2, '0')
            const day = String(d.getDate()).padStart(2, '0')
            bookingDate = `${year}-${month}-${day}`
          }
          
          const isToday = bookingDate === today
          console.log(`  📅 "${b.title}" - Normalized: ${bookingDate} vs Today: ${today} = ${isToday ? '✅ MATCH' : '❌ NO MATCH'}`)
          
          return { booking: b, bookingDate, isToday }
        })
        .filter(item => item.isToday)
        .map(item => {
          const b = item.booking
          const participants = allParticipants.filter(p => p.booking_id === b.id)
          const externals = allExternals.filter(p => p.booking_id === b.id)
          const refreshments = allRefreshments.find(r => r.booking_id === b.id)

          return {
            id: b.id,
            bookingRefId: b.booking_ref_id,
            title: b.title,
            description: b.description,
            date: item.bookingDate,
            place: b.place_name || 'Unknown',
            placeId: b.place_id,
            startTime: b.start_time?.substring(0, 5) || '',
            endTime: b.end_time?.substring(0, 5) || '',
            status: b.status === 'in_progress' ? 'ongoing' : b.status,
            selectedEmployees: [],
            externalParticipants: [],
            totalParticipantsCount: participants.length + externals.length,
            refreshments: refreshments ? {
              required: true,
              type: refreshments.refreshment_type || '',
              servingTime: refreshments.serving_time?.substring(0, 5) || ''
            } : undefined
          }
        })
        .sort((a, b) => a.startTime.localeCompare(b.startTime))

      console.log('✅ Today\'s bookings found:', formattedBookings.length)
      formattedBookings.forEach(b => {
        console.log(`  📌 ${b.startTime} - ${b.endTime}: ${b.title} (${b.status})`)
      })

      setBookings(formattedBookings)
      setIsLoading(false)
    } catch (error) {
      console.error('❌ Failed to fetch bookings:', error)
      toast.error('Failed to load bookings', {
        position: 'top-center',
        duration: 4000,
        icon: '❌'
      })
      setIsLoading(false)
    }
  }

  const isBookingOngoing = (booking: Booking) => {
    const now = currentTime
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    return booking.startTime <= currentTimeStr && booking.endTime > currentTimeStr
  }

  const formatTime = (time: string) => {
    if (!time) return ''
    return time.substring(0, 5)
  }

  const getStatusBadgeProps = (status: string) => {
    switch (status) {
      case "upcoming":
        return { className: "bg-orange-500 text-white hover:bg-orange-600" }
      case "ongoing":
      case "in_progress":
        return { className: "bg-green-500 text-white hover:bg-green-600" }
      case "completed":
        return { className: "bg-blue-500 text-white hover:bg-blue-600" }
      case "cancelled":
        return { className: "bg-red-500 text-white hover:bg-red-600" }
      default:
        return { className: "bg-gray-500 text-white hover:bg-gray-600" }
    }
  }

  const handleEdit = (booking: Booking) => {
    if (booking.status === "completed" || booking.status === "cancelled") {
      toast.error(`Cannot edit ${booking.status} bookings`, { position: 'top-center', duration: 3000, icon: '🚫' })
      return
    }
    window.location.href = `/admin/bookings/update?id=${booking.id}`
  }

  const handleCancel = (booking: Booking) => {
    if (booking.status === "completed" || booking.status === "cancelled") {
      toast.error(`Cannot cancel ${booking.status} bookings`, { position: 'top-center', duration: 3000, icon: '🚫' })
      return
    }

    setConfirmTitle("Cancel Booking")
    setConfirmMessage(`Are you sure you want to cancel "${booking.title}"? This action cannot be undone.`)
    setConfirmAction(() => async () => {
      try {
        await placeManagementAPI.updateRecord('bookings', booking.id, { status: 'cancelled' })
        toast.success('Booking cancelled successfully', { position: 'top-center', duration: 3000, icon: '✅' })
        fetchBookings()
        setIsConfirmDialogOpen(false)
      } catch (error) {
        toast.error('Failed to cancel booking', { position: 'top-center', duration: 4000, icon: '❌' })
      }
    })
    setIsConfirmDialogOpen(true)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p>Loading today's bookings...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Current Time - Top Right Corner */}
      <div className="fixed top-20 right-6 z-40">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-xl border-2 border-white">
          <div className="text-center">
            <p className="text-xs text-white/80 mb-1">Current Time</p>
            <p className="text-2xl font-bold text-white font-mono tabular-nums">
              {currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit',
                hour12: false 
              })}
            </p>
            <p className="text-xs text-white/70 mt-1">
              {currentTime.toLocaleDateString('en-US', { 
                month: 'short',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Timeline View
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">No bookings scheduled for today</p>
              <p className="text-sm text-muted-foreground mt-2">Create a new booking to get started</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline */}
              <div className="max-h-[600px] overflow-y-auto space-y-6 pr-2">
                {bookings.map((booking, index) => {
                  const isOngoing = isBookingOngoing(booking)
                  const isCompleted = booking.status === 'completed'
                  
                  return (
                    <div key={booking.id} className="relative">
                      {/* Connector Line */}
                      {index < bookings.length - 1 && (
                        <div className="absolute left-6 top-24 bottom-0 w-0.5 bg-gradient-to-b from-primary/30 to-transparent h-6" />
                      )}
                      
                      {/* Booking Card */}
                      <div className={`relative flex gap-6 group`}>
                        {/* Time Indicator */}
                        <div className="flex-shrink-0 w-24 pt-2">
                          <div className={`text-right ${isOngoing ? 'text-green-600 font-bold text-lg' : 'text-muted-foreground'}`}>
                            {formatTime(booking.startTime)}
                          </div>
                          <div className="text-right text-xs text-muted-foreground mt-1">
                            to {formatTime(booking.endTime)}
                          </div>
                        </div>
                        
                        {/* Timeline Dot */}
                        <div className="relative flex-shrink-0">
                          {/* Animated Ripple Effect for Ongoing */}
                          {isOngoing && (
                            <>
                              <div className="absolute inset-0 w-12 h-12 rounded-full bg-green-300 opacity-75 animate-ping" style={{animationDuration: '2s'}}></div>
                              <div className="absolute inset-0 w-12 h-12 rounded-full bg-green-400 opacity-50 animate-ping" style={{animationDuration: '3s', animationDelay: '0.5s'}}></div>
                            </>
                          )}
                          
                          <div className={`
                            w-12 h-12 rounded-full flex items-center justify-center relative z-10
                            ${isOngoing ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-xl shadow-green-500/50' : 
                              isCompleted ? 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg' : 
                              'bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg'}
                            transition-all duration-300
                          `}>
                            {isOngoing ? (
                              <Calendar className="h-6 w-6 text-white animate-pulse" />
                            ) : isCompleted ? (
                              <div className="text-white text-2xl font-bold">✓</div>
                            ) : (
                              <Calendar className="h-5 w-5 text-white" />
                            )}
                          </div>
                        </div>
                        
                        {/* Booking Card */}
                        <div className={`
                          flex-1 rounded-lg border-2 p-6 transition-all duration-300
                          ${isOngoing ? 'border-green-500 bg-green-50 shadow-xl shadow-green-500/20' : 
                            isCompleted ? 'border-blue-300 bg-blue-50/50' : 
                            'border-orange-300 bg-orange-50/50'}
                          hover:shadow-lg
                        `}>
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                {booking.bookingRefId && (
                                  <Badge variant="outline" className="font-mono font-bold">
                                    {booking.bookingRefId}
                                  </Badge>
                                )}
                                <h3 className={`text-xl font-bold ${isOngoing ? 'text-green-900' : isCompleted ? 'text-blue-900' : 'text-orange-900'}`}>
                                  {booking.title}
                                </h3>
                                {isOngoing && (
                                  <Badge className="relative bg-green-500 text-white shadow-lg">
                                    <span className="relative z-10 flex items-center gap-1">
                                      <span className="animate-pulse">⚡</span>
                                      LIVE NOW
                                    </span>
                                  </Badge>
                                )}
                              </div>
                              {booking.description && (
                                <p className="text-sm text-muted-foreground">{booking.description}</p>
                              )}
                            </div>
                            <Badge {...getStatusBadgeProps(booking.status)} className="text-sm px-3 py-1">
                              {booking.status}
                            </Badge>
                          </div>
                          
                          {/* Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Place</p>
                                <p className="font-medium text-sm">{booking.place}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Duration</p>
                                <p className="font-medium text-sm">
                                  {(() => {
                                    const start = booking.startTime.split(':').map(Number)
                                    const end = booking.endTime.split(':').map(Number)
                                    const minutes = (end[0] * 60 + end[1]) - (start[0] * 60 + start[1])
                                    const hours = Math.floor(minutes / 60)
                                    const mins = minutes % 60
                                    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
                                  })()}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Participants</p>
                                <p className="font-medium text-sm">
                                  {booking.totalParticipantsCount ?? 0}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex gap-2 mt-4 pt-4 border-t">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEdit(booking)}
                              disabled={booking.status === "completed" || booking.status === "cancelled"}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            {(booking.status === "upcoming" || booking.status === "ongoing") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancel(booking)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {confirmTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">{confirmMessage}</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              No, Keep It
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmAction) confirmAction()
              }}
            >
              Yes, Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

