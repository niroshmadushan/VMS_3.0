"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { 
  Calendar, 
  Clock, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  MapPin,
  Users,
  TrendingUp,
  Sparkles,
  Timer,
  CalendarCheck,
  Building2,
  CircleDot
} from "lucide-react"
import { placeManagementAPI } from "@/lib/place-management-api"
import toast from "react-hot-toast"

interface Place {
  id: string
  name: string
  capacity: number
  place_type: string
}

interface PlaceConfiguration {
  id: string
  place_id: string
  available_monday: boolean
  available_tuesday: boolean
  available_wednesday: boolean
  available_thursday: boolean
  available_friday: boolean
  available_saturday: boolean
  available_sunday: boolean
  start_time: string
  end_time: string
  booking_slot_duration: number
  allow_bookings: boolean
  max_bookings_per_day?: number
}

interface Booking {
  id: string
  title: string
  start_time: string
  end_time: string
  status: string
  responsible_person_name: string
  total_participants?: number
  booking_ref_id?: string
}

interface TimeSlot {
  start: string
  end: string
  duration: string
  isAvailable: boolean
}

interface AvailablePlace extends Place {
  configuration?: PlaceConfiguration
}

export function AvailabilityChecker() {
  const [allPlaces, setAllPlaces] = useState<Place[]>([])
  const [availablePlaces, setAvailablePlaces] = useState<AvailablePlace[]>([])
  const [selectedPlace, setSelectedPlace] = useState("")
  const [selectedPlaceData, setSelectedPlaceData] = useState<AvailablePlace | null>(null)
  const [selectedDate, setSelectedDate] = useState("")
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)
  const [placeConfig, setPlaceConfig] = useState<PlaceConfiguration | null>(null)
  const [existingBookings, setExistingBookings] = useState<Booking[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])

  // Helper function to get day of week from date string
  const getDayOfWeek = (dateString: string): string => {
    const date = new Date(dateString)
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[date.getDay()]
  }

  // Fetch all places (active and not deleted) on mount
  useEffect(() => {
    fetchAllPlaces()
  }, [])

  // Fetch available places when date is selected
  useEffect(() => {
    if (selectedDate) {
      fetchAvailablePlaces(selectedDate)
    } else {
      setAvailablePlaces([])
      setSelectedPlace("")
      setSelectedPlaceData(null)
    }
  }, [selectedDate])

  // Fetch all active, non-deleted places
  const fetchAllPlaces = async () => {
    try {
      const response = await placeManagementAPI.getTableData('places', {
        filters: [
          {
            field: 'is_active',
            operator: '=',
            value: 1
          },
          {
            field: 'is_deleted',
            operator: '=',
            value: 0
          }
        ]
      })
      
      let placesData = []
      if (Array.isArray(response)) {
        placesData = response
      } else if (response && response.success && response.data) {
        placesData = response.data
      } else if (response && response.data) {
        placesData = response.data
      }
      
      setAllPlaces(placesData)
    } catch (error) {
      // Silent fail - errors handled gracefully without exposing details
    }
  }

  // Fetch places available for the selected date
  const fetchAvailablePlaces = async (dateString: string) => {
    try {
      setIsLoadingPlaces(true)
      const dayOfWeek = getDayOfWeek(dateString)
      const dayKey = `available_${dayOfWeek}` as keyof PlaceConfiguration

      // Fetch all place configurations
      const configsResponse = await placeManagementAPI.getTableData('place_configuration', {})
      
      let configsData: any[] = []
      if (Array.isArray(configsResponse)) {
        configsData = configsResponse
      } else if (configsResponse && configsResponse.success && configsResponse.data) {
        configsData = configsResponse.data
      } else if (configsResponse && configsResponse.data) {
        configsData = configsResponse.data
      }

      // Filter places that are available on the selected day
      const availablePlacesForDate: AvailablePlace[] = allPlaces
        .map((place: Place) => {
          const config = configsData.find((c: any) => c.place_id === place.id)
          
          if (!config) {
            return null
          }

          // Check if bookings are allowed
          if (!config.allow_bookings) {
            return null
          }

          // Check if place is available on this day of week
          if (!config[dayKey]) {
            return null
          }

          return {
            ...place,
            configuration: config
          } as AvailablePlace
        })
        .filter((place: AvailablePlace | null): place is AvailablePlace => place !== null)

      setAvailablePlaces(availablePlacesForDate)
      
      if (availablePlacesForDate.length === 0) {
        toast('No places available for the selected date', {
          icon: 'ℹ️',
          duration: 3000
        })
      }
    } catch (error) {
      toast.error('Failed to load available places')
    } finally {
      setIsLoadingPlaces(false)
    }
  }

  const checkAvailability = async () => {
    if (!selectedPlace || !selectedDate) {
      toast.error('Please select both place and date')
      return
    }

    try {
      setIsChecking(true)
      setHasChecked(false)

      // Get selected place data (configuration already loaded)
      const place = availablePlaces.find(p => p.id === selectedPlace)
      if (!place || !place.configuration) {
        toast.error('Place configuration not found')
        return
      }
      
      setSelectedPlaceData(place)
      const config = place.configuration
      setPlaceConfig(config)

      // Fetch existing bookings for the selected date and place
      const bookingsResponse = await placeManagementAPI.getTableData('bookings', {
        filters: [
          { field: 'is_deleted', operator: '=', value: 0 }
        ]
      })

      // Handle both response formats
      let bookingsData = []
      if (Array.isArray(bookingsResponse)) {
        bookingsData = bookingsResponse
      } else if (bookingsResponse && bookingsResponse.success && bookingsResponse.data) {
        bookingsData = bookingsResponse.data
      } else if (bookingsResponse && bookingsResponse.data) {
        bookingsData = bookingsResponse.data
      }

      if (bookingsData && bookingsData.length > 0) {
        // Filter bookings by place, date and exclude cancelled
        const filteredBookings = bookingsData.filter((booking: any) => {
          
          // Check if cancelled - treat cancelled bookings as free time
          // A booking is considered cancelled if:
          // 1. status field is 'cancelled' (case-insensitive)
          // 2. cancelled_at field is not null/empty
          const status = booking.status?.toLowerCase()?.trim()
          const isCancelled = status === 'cancelled' || !!booking.cancelled_at
          
          if (isCancelled) {
            return false
          }
          
          // Also exclude deleted bookings
          if (booking.is_deleted === 1 || booking.is_deleted === true) {
            return false
          }

          // Check if place matches
          const placeMatches = booking.place_id === selectedPlace
          
          if (!placeMatches) {
            return false
          }

          // Normalize and check date (with timezone fix)
          let normalizedDate = ''
          if (typeof booking.booking_date === 'string') {
            if (booking.booking_date.includes('T')) {
              // ISO format with timezone - parse as UTC then get local date
              const dateObj = new Date(booking.booking_date)
              // Get date in local timezone by extracting components
              const year = dateObj.getFullYear()
              const month = String(dateObj.getMonth() + 1).padStart(2, '0')
              const day = String(dateObj.getDate()).padStart(2, '0')
              normalizedDate = `${year}-${month}-${day}`
            } else if (booking.booking_date.includes(' ')) {
              normalizedDate = booking.booking_date.split(' ')[0]
            } else {
              normalizedDate = booking.booking_date
            }
          } else if (booking.booking_date instanceof Date) {
            // Date object - get local date
            const year = booking.booking_date.getFullYear()
            const month = String(booking.booking_date.getMonth() + 1).padStart(2, '0')
            const day = String(booking.booking_date.getDate()).padStart(2, '0')
            normalizedDate = `${year}-${month}-${day}`
          }

          const dateMatches = normalizedDate === selectedDate
          
          if (!dateMatches) {
            return false
          }

          return true
        })

        setExistingBookings(filteredBookings)

        // Generate available slots
        generateAvailableSlots(config, filteredBookings)
      } else {
        // No bookings found
        setExistingBookings([])
        generateAvailableSlots(config, [])
      }

      setHasChecked(true)
      toast.success('Availability checked successfully')
    } catch (error) {
      toast.error('Failed to check availability')
    } finally {
      setIsChecking(false)
    }
  }

  const generateAvailableSlots = (config: PlaceConfiguration, bookings: Booking[]) => {
    const startTime = config.start_time.substring(0, 5)
    const endTime = config.end_time.substring(0, 5)
    const minDuration = config.booking_slot_duration || 30

    // Sort bookings by start time
    // Note: Cancelled bookings are already filtered out in checkAvailability function above
    // This is just an extra safety check
    const sortedBookings = bookings
      .filter(b => {
        const status = b.status?.toLowerCase()?.trim()
        return status !== 'cancelled' && !b.cancelled_at
      })
      .sort((a, b) => a.start_time.localeCompare(b.start_time))

    const available: TimeSlot[] = []

    // Convert time to minutes
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    }

    // Convert minutes to time string
    const minutesToTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
    }

    // Calculate duration in readable format
    const calculateDuration = (start: string, end: string) => {
      const startMins = timeToMinutes(start)
      const endMins = timeToMinutes(end)
      const diffMins = endMins - startMins
      const hours = Math.floor(diffMins / 60)
      const mins = diffMins % 60
      if (hours > 0 && mins > 0) return `${hours}h ${mins}m`
      if (hours > 0) return `${hours}h`
      return `${mins}m`
    }

    let currentTime = timeToMinutes(startTime)
    const closeTime = timeToMinutes(endTime)

    if (sortedBookings.length === 0) {
      // No bookings, entire time is available
      available.push({
        start: startTime,
        end: endTime,
        duration: calculateDuration(startTime, endTime),
        isAvailable: true
      })
    } else {
      // Check gap before first booking
      const firstBookingStart = timeToMinutes(sortedBookings[0].start_time.substring(0, 5))
      if (firstBookingStart - currentTime >= minDuration) {
        available.push({
          start: minutesToTime(currentTime),
          end: minutesToTime(firstBookingStart),
          duration: calculateDuration(minutesToTime(currentTime), minutesToTime(firstBookingStart)),
          isAvailable: true
        })
      }

      // Check gaps between bookings
      for (let i = 0; i < sortedBookings.length - 1; i++) {
        const currentBookingEnd = timeToMinutes(sortedBookings[i].end_time.substring(0, 5))
        const nextBookingStart = timeToMinutes(sortedBookings[i + 1].start_time.substring(0, 5))

        if (nextBookingStart - currentBookingEnd >= minDuration) {
          available.push({
            start: minutesToTime(currentBookingEnd),
            end: minutesToTime(nextBookingStart),
            duration: calculateDuration(minutesToTime(currentBookingEnd), minutesToTime(nextBookingStart)),
            isAvailable: true
          })
        }
      }

      // Check gap after last booking
      const lastBookingEnd = timeToMinutes(sortedBookings[sortedBookings.length - 1].end_time.substring(0, 5))
      if (closeTime - lastBookingEnd >= minDuration) {
        available.push({
          start: minutesToTime(lastBookingEnd),
          end: minutesToTime(closeTime),
          duration: calculateDuration(minutesToTime(lastBookingEnd), minutesToTime(closeTime)),
          isAvailable: true
        })
      }
    }

    setAvailableSlots(available)
  }

  const calculateTotalAvailableHours = () => {
    const totalMinutes = availableSlots.reduce((acc, slot) => {
      const startMins = slot.start.split(':').map(Number)
      const endMins = slot.end.split(':').map(Number)
      const duration = (endMins[0] * 60 + endMins[1]) - (startMins[0] * 60 + startMins[1])
      return acc + duration
    }, 0)
    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60
    return { hours, mins, totalMinutes }
  }

  const calculateUtilization = () => {
    if (!placeConfig) return 0
    const startMins = placeConfig.start_time.split(':').map(Number)
    const endMins = placeConfig.end_time.split(':').map(Number)
    const totalOperatingMins = (endMins[0] * 60 + endMins[1]) - (startMins[0] * 60 + startMins[1])
    
    const bookedMins = existingBookings.reduce((acc, booking) => {
      const startMins = booking.start_time.substring(0, 5).split(':').map(Number)
      const endMins = booking.end_time.substring(0, 5).split(':').map(Number)
      return acc + ((endMins[0] * 60 + endMins[1]) - (startMins[0] * 60 + startMins[1]))
    }, 0)

    return Math.round((bookedMins / totalOperatingMins) * 100)
  }

  return (
    <div className="space-y-3 px-2 sm:px-4 max-w-[98vw] mx-auto dark:bg-background">
      {/* Compact Header with Search in One Line - Centered */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 pb-2 border-b border-border/50 dark:border-border">
            {/* Date Input - Must be selected first */}
        <div className="w-full sm:w-[160px]">
          <Label className="text-[13px] font-semibold mb-1.5 flex items-center justify-center gap-1.5 dark:text-foreground">
            <CalendarCheck className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            Date *
              </Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  // Reset place selection when date changes
                  setSelectedPlace("")
                  setSelectedPlaceData(null)
                }}
                min={new Date().toISOString().split('T')[0]}
            className="h-9 text-[13px] dark:bg-card dark:border-border dark:text-foreground"
              />
            </div>

            {/* Place Select - Only shows places available for selected date */}
        <div className="w-full sm:w-auto sm:min-w-[200px]">
          <Label className="text-[13px] font-semibold mb-1.5 flex items-center justify-center gap-1.5 dark:text-foreground">
            <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            Place *
              </Label>
              <Select 
                value={selectedPlace} 
                onValueChange={(value) => {
                  setSelectedPlace(value)
                  const place = availablePlaces.find(p => p.id === value)
                  setSelectedPlaceData(place || null)
                }}
                disabled={!selectedDate || isLoadingPlaces}
              >
            <SelectTrigger className="h-9 text-[13px] dark:bg-card dark:border-border dark:text-foreground">
                  <SelectValue placeholder={
                    !selectedDate 
                      ? "Select date first" 
                      : isLoadingPlaces 
                      ? "Loading places..." 
                      : availablePlaces.length === 0
                      ? "No places available"
                      : "Choose a place"
                  } />
                </SelectTrigger>
            <SelectContent className="dark:bg-card dark:border-border">
                  {availablePlaces.map(place => (
                <SelectItem key={place.id} value={place.id} className="dark:text-foreground dark:hover:bg-muted text-[13px]">
                      <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                    <span className="font-medium dark:text-foreground">{place.name}</span>
                    <Badge variant="outline" className="text-[11px] dark:border-border dark:text-foreground">
                          <Users className="h-3 w-3 mr-1" />
                          {place.capacity}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Button */}
        <div className="w-full sm:w-auto flex items-end justify-center">
              <Button
                onClick={checkAvailability}
                disabled={!selectedPlace || !selectedDate || isChecking}
            className="w-full sm:w-auto h-9 px-4 text-[13px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600 shadow-lg"
              >
                {isChecking ? (
                  <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                <Search className="h-3.5 w-3.5 mr-1.5" />
                Check
                  </>
                )}
              </Button>
            </div>
          </div>

      {/* Selected Place Info - Compact */}
          {selectedPlaceData && (
        <Card className="border shadow-sm dark:bg-card dark:border-border">
          <CardContent className="p-2.5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <div>
                  <p className="text-[11px] text-muted-foreground dark:text-muted-foreground">Place</p>
                  <p className="text-[13px] font-semibold dark:text-foreground">{selectedPlaceData.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="text-[11px] text-muted-foreground dark:text-muted-foreground">Capacity</p>
                  <p className="text-[13px] font-semibold dark:text-foreground">{selectedPlaceData.capacity}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                  <div>
                  <p className="text-[11px] text-muted-foreground dark:text-muted-foreground">Type</p>
                  <p className="text-[13px] font-semibold dark:text-foreground">{selectedPlaceData.place_type}</p>
                </div>
              </div>
              {hasChecked && placeConfig && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <div>
                    <p className="text-[11px] text-muted-foreground dark:text-muted-foreground">Hours</p>
                    <p className="text-[13px] font-semibold dark:text-foreground">
                        {placeConfig.start_time.substring(0, 5)} - {placeConfig.end_time.substring(0, 5)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
        </CardContent>
      </Card>
      )}

      {hasChecked && (
        <>
          {/* Compact Analytics Table */}
          <Card className="border shadow-sm dark:bg-card dark:border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableBody>
                    <TableRow className="hover:bg-transparent border-b dark:border-border">
                      <TableCell className="py-2.5 px-4 font-medium text-[13px] dark:text-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          Total Bookings
                  </div>
                      </TableCell>
                      <TableCell className="py-2.5 px-4 text-right dark:text-foreground">
                        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{existingBookings.length}</span>
                      </TableCell>
                      <TableCell className="py-2.5 px-4 font-medium text-[13px] dark:text-foreground">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          Available Slots
                  </div>
                      </TableCell>
                      <TableCell className="py-2.5 px-4 text-right dark:text-foreground">
                        <span className="text-xl font-bold text-green-600 dark:text-green-400">{availableSlots.length}</span>
                      </TableCell>
                      <TableCell className="py-2.5 px-4 font-medium text-[13px] dark:text-foreground">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          Utilization
                </div>
                      </TableCell>
                      <TableCell className="py-2.5 px-4 text-right dark:text-foreground">
                        <span className="text-xl font-bold text-orange-600 dark:text-orange-400">{calculateUtilization()}%</span>
                      </TableCell>
                      <TableCell className="py-2.5 px-4 font-medium text-[13px] dark:text-foreground">
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          Free Hours
                  </div>
                      </TableCell>
                      <TableCell className="py-2.5 px-4 text-right dark:text-foreground">
                        <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                          {calculateTotalAvailableHours().hours}h {calculateTotalAvailableHours().mins}m
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>

          {/* Available Time Slots - Compact */}
          {availableSlots.length > 0 && (
            <Card className="border shadow-md dark:bg-card dark:border-border">
              <CardHeader className="pb-2.5 dark:border-border">
                <CardTitle className="flex items-center gap-2 text-[13px] font-semibold dark:text-foreground">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  Available Time Slots ({availableSlots.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-3 dark:bg-card">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {availableSlots.map((slot, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-300 dark:border-green-700 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Badge className="bg-green-600 dark:bg-green-500 text-white font-semibold text-[10px] px-1.5 py-0.5">
                          <Timer className="h-2.5 w-2.5 mr-1" />
                            {slot.duration}
                          </Badge>
                        <div className="w-1.5 h-1.5 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
                          </div>
                      <div className="text-sm font-bold text-green-900 dark:text-green-200">
                          {slot.start} - {slot.end}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Bookings - Compact */}
          {existingBookings.length > 0 && (
            <Card className="border shadow-md dark:bg-card dark:border-border">
              <CardHeader className="pb-2.5 dark:border-border">
                <CardTitle className="flex items-center gap-2 text-[13px] font-semibold dark:text-foreground">
                  <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  Existing Bookings ({existingBookings.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-3 dark:bg-card">
                <div className="max-h-[calc(5*60px)] overflow-y-auto table-scroll-container-vertical space-y-2 pr-2">
                  {existingBookings
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                    .map((booking) => (
                    <div
                      key={booking.id}
                      className="p-2.5 bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 dark:from-orange-950/30 dark:via-red-950/30 dark:to-pink-950/30 border border-orange-300 dark:border-orange-700 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <div className="p-1 bg-orange-500 dark:bg-orange-600 rounded">
                            <CircleDot className="h-3 w-3 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-[13px] text-orange-900 dark:text-orange-200 truncate">{booking.title}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[11px] text-gray-600 dark:text-gray-400">
                                {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                              </p>
                            {booking.booking_ref_id && (
                                <p className="text-[11px] text-gray-600 dark:text-gray-400">• Ref: {booking.booking_ref_id}</p>
                            )}
                            </div>
                          </div>
                        </div>
                        <Badge className={
                          booking.status === 'ongoing' ? 'bg-green-500 dark:bg-green-600 text-white text-[10px] ml-2' :
                          booking.status === 'upcoming' ? 'bg-orange-500 dark:bg-orange-600 text-white text-[10px] ml-2' :
                          booking.status === 'completed' ? 'bg-blue-500 dark:bg-blue-600 text-white text-[10px] ml-2' :
                          'bg-gray-500 dark:bg-gray-600 text-white text-[10px] ml-2'
                        }>
                          {booking.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <div>
                            <p className="text-xs text-gray-600">Time</p>
                            <p className="text-sm font-bold text-gray-900">
                              {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-600" />
                          <div>
                            <p className="text-xs text-gray-600">Participants</p>
                            <p className="text-sm font-bold text-gray-900">
                              {booking.total_participants || 0} people
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-xs text-gray-600">Responsible</p>
                            <p className="text-sm font-bold text-gray-900">
                              {booking.responsible_person_name || 'Unassigned'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fully Available */}
          {availableSlots.length === 0 && existingBookings.length === 0 && (
            <Card className="border-2 border-green-300 dark:border-green-700 shadow-md dark:bg-card dark:border-border">
              <CardContent className="py-6">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-600 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-green-700 dark:text-green-300 mb-1.5">Fully Available!</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">This place has no bookings for the selected date. Entire day is free.</p>
                  <Button
                    onClick={() => window.location.href = `/admin/bookings/new?place=${selectedPlace}&date=${selectedDate}`}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600 shadow-lg h-9 text-[13px]"
                  >
                    <CalendarCheck className="h-4 w-4 mr-1.5" />
                    Create New Booking
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fully Booked */}
          {availableSlots.length === 0 && existingBookings.length > 0 && (
            <Card className="border-2 border-red-300 dark:border-red-700 shadow-md dark:bg-card dark:border-border">
              <CardContent className="py-6">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-400 to-orange-500 dark:from-red-500 dark:to-orange-600 rounded-full flex items-center justify-center mb-3">
                    <XCircle className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-1.5">Fully Booked</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">No free time slots available for this date and place.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!hasChecked && (
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 shadow-sm dark:bg-card dark:border-border">
          <CardContent className="py-8">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
              <p className="text-sm font-medium mb-1.5 dark:text-foreground">No Analysis Yet</p>
              <p className="text-xs dark:text-muted-foreground">Select a place and date above, then click "Check Availability" to see detailed insights</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
