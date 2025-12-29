"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, Clock, MapPin, Users, Trash2, Utensils, AlertTriangle } from "lucide-react"
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
    // Cancelled bookings can never be ongoing/live
    if (booking.status === "cancelled") {
      return false
    }
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
      <Card className="dark:bg-card dark:border-border">
        <CardContent className="py-12 dark:bg-card">
          <div className="text-center">
            <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-muted-foreground dark:text-muted-foreground" />
            <p className="dark:text-foreground">Loading today's bookings...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-3 px-2 sm:px-4 max-w-[98vw] mx-auto dark:bg-background">
        {/* Compact Header with Current Time */}
        <div className="flex items-center justify-between pb-2 border-b border-border/50 dark:border-border">
        <div>
          <CardTitle className="flex items-center gap-2 text-[13px] font-semibold dark:text-foreground">
            <Clock className="h-4 w-4" />
            Today's Timeline View
          </CardTitle>
          <p className="text-[11px] text-muted-foreground dark:text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-lg shadow-md">
          <div className="text-center">
            <p className="text-[10px] text-white/80 mb-0.5">Current Time</p>
            <p className="text-lg font-bold text-white font-mono tabular-nums">
              {currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit',
                hour12: false 
              })}
            </p>
            <p className="text-[10px] text-white/70 mt-0.5">
              {currentTime.toLocaleDateString('en-US', { 
                month: 'short',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      <Card className="dark:bg-card dark:border-border shadow-md">
        <CardContent className="p-3 dark:bg-card">
          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground dark:text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">No bookings scheduled for today</p>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">Create a new booking to get started</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline - Compact */}
              <div className="max-h-[calc(7*80px)] overflow-y-auto table-scroll-container-vertical space-y-3 pr-2">
                {bookings.map((booking, index) => {
                  const isCancelled = booking.status === 'cancelled'
                  const isOngoing = isBookingOngoing(booking) // This will return false for cancelled bookings
                  const isCompleted = booking.status === 'completed'
                  const isUpcoming = booking.status === 'upcoming'
                  
                  // Color scheme based on status with dark theme support
                  const getStatusColors = () => {
                    if (isCancelled) {
                      return {
                        connector: 'bg-red-300/30 dark:bg-red-900/30',
                        timeText: 'text-red-600 dark:text-red-400',
                        timeTextSecondary: 'text-red-500 dark:text-red-500',
                        dot: 'bg-gradient-to-br from-red-400 to-red-600 dark:from-red-600 dark:to-red-800 shadow-lg',
                        cardBorder: 'border-red-500 dark:border-red-700',
                        cardBg: 'bg-red-50 dark:bg-red-950/20',
                        cardShadow: 'shadow-lg',
                        title: 'text-red-900 dark:text-red-200',
                        description: 'text-red-700 dark:text-red-300',
                        icon: 'text-red-500 dark:text-red-400',
                        label: 'text-red-600 dark:text-red-400',
                        value: 'text-red-900 dark:text-red-200',
                        badgeBorder: 'border-red-300 dark:border-red-700',
                        badgeText: 'text-red-700 dark:text-red-300'
                      }
                    } else if (isOngoing) {
                      return {
                        connector: 'bg-green-300/30 dark:bg-green-900/30',
                        timeText: 'text-green-600 dark:text-green-400 font-bold',
                        timeTextSecondary: 'text-green-600 dark:text-green-400',
                        dot: 'bg-gradient-to-br from-green-400 to-green-600 dark:from-green-500 dark:to-green-700 shadow-xl shadow-green-500/50 dark:shadow-green-600/50',
                        cardBorder: 'border-green-500 dark:border-green-600',
                        cardBg: 'bg-green-50 dark:bg-green-950/20',
                        cardShadow: 'shadow-xl shadow-green-500/20 dark:shadow-green-600/20',
                        title: 'text-green-900 dark:text-green-200',
                        description: 'text-green-700 dark:text-green-300',
                        icon: 'text-green-500 dark:text-green-400',
                        label: 'text-green-600 dark:text-green-400',
                        value: 'text-green-900 dark:text-green-200',
                        badgeBorder: '',
                        badgeText: ''
                      }
                    } else if (isCompleted) {
                      return {
                        connector: 'bg-blue-300/30 dark:bg-blue-900/30',
                        timeText: 'text-blue-600 dark:text-blue-400',
                        timeTextSecondary: 'text-blue-500 dark:text-blue-500',
                        dot: 'bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 shadow-lg',
                        cardBorder: 'border-blue-500 dark:border-blue-600',
                        cardBg: 'bg-blue-50 dark:bg-blue-950/20',
                        cardShadow: 'shadow-lg',
                        title: 'text-blue-900 dark:text-blue-200',
                        description: 'text-blue-700 dark:text-blue-300',
                        icon: 'text-blue-500 dark:text-blue-400',
                        label: 'text-blue-600 dark:text-blue-400',
                        value: 'text-blue-900 dark:text-blue-200',
                        badgeBorder: '',
                        badgeText: ''
                      }
                    } else { // Upcoming
                      return {
                        connector: 'bg-orange-300/30 dark:bg-orange-900/30',
                        timeText: 'text-orange-600 dark:text-orange-400',
                        timeTextSecondary: 'text-orange-500 dark:text-orange-500',
                        dot: 'bg-gradient-to-br from-orange-400 to-orange-600 dark:from-orange-500 dark:to-orange-700 shadow-lg',
                        cardBorder: 'border-orange-500 dark:border-orange-600',
                        cardBg: 'bg-orange-50 dark:bg-orange-950/20',
                        cardShadow: 'shadow-lg',
                        title: 'text-orange-900 dark:text-orange-200',
                        description: 'text-orange-700 dark:text-orange-300',
                        icon: 'text-orange-500 dark:text-orange-400',
                        label: 'text-orange-600 dark:text-orange-400',
                        value: 'text-orange-900 dark:text-orange-200',
                        badgeBorder: '',
                        badgeText: ''
                      }
                    }
                  }
                  
                  const colors = getStatusColors()
                  
                  return (
                    <div key={booking.id} className="relative">
                      {/* Connector Line */}
                      {index < bookings.length - 1 && (
                        <div className={`absolute left-4 top-16 bottom-0 w-0.5 h-4 ${colors.connector}`} />
                      )}
                      
                      {/* Booking Card - Compact */}
                      <div className={`relative flex gap-3 group`}>
                        {/* Time Indicator - Compact */}
                        <div className="flex-shrink-0 w-16 pt-1">
                          <div className={`text-right text-[13px] font-semibold ${colors.timeText}`}>
                            {formatTime(booking.startTime)}
                          </div>
                          <div className={`text-right text-[11px] mt-0.5 ${colors.timeTextSecondary}`}>
                            {formatTime(booking.endTime)}
                          </div>
                        </div>
                        
                        {/* Timeline Dot - Compact */}
                        <div className="relative flex-shrink-0">
                          {/* Animated Ripple Effect for Ongoing - NOT for cancelled */}
                          {isOngoing && !isCancelled && (
                            <>
                              <div className="absolute inset-0 w-8 h-8 rounded-full bg-green-300 opacity-75 animate-ping" style={{animationDuration: '2s'}}></div>
                              <div className="absolute inset-0 w-8 h-8 rounded-full bg-green-400 opacity-50 animate-ping" style={{animationDuration: '3s', animationDelay: '0.5s'}}></div>
                            </>
                          )}
                          
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 ${colors.dot} transition-all duration-300`}>
                            {isCancelled ? (
                              <AlertTriangle className="h-3.5 w-3.5 text-white" />
                            ) : isOngoing ? (
                              <Calendar className="h-4 w-4 text-white animate-pulse" />
                            ) : isCompleted ? (
                              <div className="text-white text-sm font-bold">✓</div>
                            ) : (
                              <Calendar className="h-3.5 w-3.5 text-white" />
                            )}
                          </div>
                        </div>
                        
                        {/* Booking Card - Compact */}
                        <div className={`flex-1 rounded-lg border p-3 transition-all duration-300 ${colors.cardBorder} ${colors.cardBg} ${colors.cardShadow} hover:shadow-md`}>
                          {/* Header - Compact */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {booking.bookingRefId && (
                                  <Badge variant="outline" className={`font-mono font-semibold text-[10px] px-1.5 py-0 ${colors.badgeBorder} ${colors.badgeText}`}>
                                    {booking.bookingRefId}
                                  </Badge>
                                )}
                                <h3 className={`text-[13px] font-bold truncate ${colors.title}`}>
                                  {booking.title}
                                </h3>
                              </div>
                              {booking.description && (
                                <p className={`text-[11px] truncate ${colors.description}`}>{booking.description}</p>
                              )}
                            </div>
                            <Badge {...getStatusBadgeProps(booking.status)} className="text-[10px] px-2 py-0.5 ml-2 flex-shrink-0">
                              {booking.status === "ongoing" && isOngoing ? (
                                <span className="flex items-center gap-1">
                                  <span className="animate-pulse">⚡</span>
                                  LIVE
                                </span>
                              ) : (
                                booking.status
                              )}
                            </Badge>
                          </div>
                          
                          {/* Details Grid - Compact */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                            <div className="flex items-center gap-1.5">
                              <MapPin className={`h-3 w-3 ${colors.icon}`} />
                              <div>
                                <p className={`text-[10px] ${colors.label}`}>Place</p>
                                <p className={`font-semibold text-[11px] truncate ${colors.value}`}>{booking.place}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                              <Clock className={`h-3 w-3 ${colors.icon}`} />
                              <div>
                                <p className={`text-[10px] ${colors.label}`}>Duration</p>
                                <p className={`font-semibold text-[11px] ${colors.value}`}>
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
                            
                            <div className="flex items-center gap-1.5">
                              <Users className={`h-3 w-3 ${colors.icon}`} />
                              <div>
                                <p className={`text-[10px] ${colors.label}`}>Participants</p>
                                <p className={`font-semibold text-[11px] ${colors.value}`}>
                                  {booking.totalParticipantsCount ?? 0}
                                </p>
                              </div>
                            </div>
                            
                            {booking.refreshments?.required && (
                              <div className="flex items-center gap-1.5">
                                <Utensils className={`h-3 w-3 ${colors.icon}`} />
                                <div>
                                  <p className={`text-[10px] ${colors.label}`}>Refreshments</p>
                                  <p className={`font-semibold text-[11px] ${colors.value}`}>Yes</p>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Actions - Compact */}
                          {!isCancelled && (booking.status === "upcoming" || booking.status === "ongoing") && (
                            <div className="flex gap-2 mt-2 pt-2 border-t dark:border-border/50">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancel(booking)}
                                className="text-destructive hover:text-destructive h-7 px-2 text-[11px] dark:border-border dark:hover:bg-muted"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          )}
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
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md dark:bg-card dark:border-border">
          <DialogHeader className="dark:border-border/50">
            <DialogTitle className="flex items-center gap-2 dark:text-foreground">
              <AlertTriangle className="h-5 w-5 text-orange-500 dark:text-orange-400" />
              {confirmTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">{confirmMessage}</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)} className="dark:border-border dark:hover:bg-muted">
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

