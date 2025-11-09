"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Clock, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  ArrowRight,
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
  start_time: string
  end_time: string
  booking_slot_duration: number
  allow_bookings: boolean
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

export function AvailabilityChecker() {
  const [places, setPlaces] = useState<Place[]>([])
  const [selectedPlace, setSelectedPlace] = useState("")
  const [selectedPlaceData, setSelectedPlaceData] = useState<Place | null>(null)
  const [selectedDate, setSelectedDate] = useState("")
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)
  const [placeConfig, setPlaceConfig] = useState<PlaceConfiguration | null>(null)
  const [existingBookings, setExistingBookings] = useState<Booking[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])

  useEffect(() => {
    fetchPlaces()
  }, [])

  const fetchPlaces = async () => {
    try {
      setIsLoadingPlaces(true)
      const response = await placeManagementAPI.getTableData('places', {
        is_active: 'true'
      })
      console.log('📍 Fetched places response:', response)
      
      // Handle both response formats: direct array or {success, data} object
      let placesData = []
      if (Array.isArray(response)) {
        // Direct array response
        placesData = response
      } else if (response && response.success && response.data) {
        // Object response with data property
        placesData = response.data
      } else if (response && response.data) {
        // Object response without success flag
        placesData = response.data
      }
      
      console.log('✅ Places data:', placesData)
      setPlaces(placesData)
    } catch (error) {
      console.error('❌ Error fetching places:', error)
      toast.error('Failed to load places')
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

      // Get selected place data
      const place = places.find(p => p.id === selectedPlace)
      setSelectedPlaceData(place || null)

      // Fetch place configuration
      const configResponse = await placeManagementAPI.getTableData('place_configuration', {
        place_id: selectedPlace
      })
      console.log('⚙️ Config response:', configResponse)

      // Handle both response formats
      let configData = []
      if (Array.isArray(configResponse)) {
        configData = configResponse
      } else if (configResponse && configResponse.success && configResponse.data) {
        configData = configResponse.data
      } else if (configResponse && configResponse.data) {
        configData = configResponse.data
      }

      if (!configData || configData.length === 0) {
        toast.error('Place configuration not found')
        return
      }

      const config = configData[0]
      console.log('✅ Config data:', config)
      setPlaceConfig(config)

      // Fetch existing bookings for the selected date and place
      console.log('═══════════════════════════════════════════════════════')
      console.log('🔍 SEARCH CRITERIA:')
      console.log('   Selected Place ID:', selectedPlace)
      console.log('   Selected Date:', selectedDate)
      console.log('═══════════════════════════════════════════════════════')
      
      const bookingsResponse = await placeManagementAPI.getTableData('bookings', {
        is_deleted: 'false'
      })
      
      console.log('📅 Raw API Response:', bookingsResponse)

      // Handle both response formats
      let bookingsData = []
      if (Array.isArray(bookingsResponse)) {
        bookingsData = bookingsResponse
      } else if (bookingsResponse && bookingsResponse.success && bookingsResponse.data) {
        bookingsData = bookingsResponse.data
      } else if (bookingsResponse && bookingsResponse.data) {
        bookingsData = bookingsResponse.data
      }
      
      console.log('📊 Total bookings fetched:', bookingsData.length)
      console.log('📋 All bookings data:', bookingsData)

      if (bookingsData && bookingsData.length > 0) {
        console.log('───────────────────────────────────────────────────────')
        console.log('🔍 STARTING FILTER PROCESS')
        console.log('───────────────────────────────────────────────────────')
        
        // Filter bookings by place, date and exclude cancelled
        const filteredBookings = bookingsData.filter((booking: any, index: number) => {
          console.log(`\n📋 Booking #${index + 1}:`)
          console.log('   ID:', booking.id)
          console.log('   Title:', booking.title)
          console.log('   Place ID:', booking.place_id, '(type:', typeof booking.place_id, ')')
          console.log('   Booking Date:', booking.booking_date, '(type:', typeof booking.booking_date, ')')
          console.log('   Status:', booking.status)
          console.log('   Start Time:', booking.start_time)
          console.log('   End Time:', booking.end_time)
          
          // Check if cancelled
          if (booking.status === 'cancelled') {
            console.log('❌ Skipped: cancelled')
            return false
          }

          // Check if place matches
          console.log('\n   🔍 PLACE CHECK:')
          console.log('      Booking place_id:', booking.place_id)
          console.log('      Selected place:', selectedPlace)
          const placeMatches = booking.place_id === selectedPlace
          console.log('      Match?', placeMatches)
          
          if (!placeMatches) {
            console.log('   ❌ RESULT: Skipped (place mismatch)')
            return false
          }

          // Normalize and check date (with timezone fix)
          console.log('\n   📅 DATE CHECK:')
          console.log('      Raw booking_date:', booking.booking_date)
          console.log('      Selected date:', selectedDate)
          
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
              console.log('      Normalized (ISO with timezone fix):', normalizedDate)
              console.log('      Date object:', dateObj)
              console.log('      Local date parts:', { year, month, day })
            } else if (booking.booking_date.includes(' ')) {
              normalizedDate = booking.booking_date.split(' ')[0]
              console.log('      Normalized (DateTime):', normalizedDate)
            } else {
              normalizedDate = booking.booking_date
              console.log('      Already normalized:', normalizedDate)
            }
          } else if (booking.booking_date instanceof Date) {
            // Date object - get local date
            const year = booking.booking_date.getFullYear()
            const month = String(booking.booking_date.getMonth() + 1).padStart(2, '0')
            const day = String(booking.booking_date.getDate()).padStart(2, '0')
            normalizedDate = `${year}-${month}-${day}`
            console.log('      Normalized (Date object with timezone fix):', normalizedDate)
          }

          const dateMatches = normalizedDate === selectedDate
          console.log('      Match?', dateMatches)
          
          if (!dateMatches) {
            console.log('   ❌ RESULT: Skipped (date mismatch)')
            return false
          }

          console.log('   ✅ RESULT: INCLUDED (all checks passed)')
          return true
        })
        
        console.log('\n═══════════════════════════════════════════════════════')
        console.log('✅ FILTER COMPLETE')
        console.log('   Total filtered bookings:', filteredBookings.length)
        console.log('   Filtered bookings:', filteredBookings)
        console.log('═══════════════════════════════════════════════════════\n')

        console.log('✅ Filtered bookings:', filteredBookings)
        setExistingBookings(filteredBookings)

        // Generate available slots
        generateAvailableSlots(config, filteredBookings)
      } else {
        // No bookings found
        console.log('ℹ️ No bookings found')
        setExistingBookings([])
        generateAvailableSlots(config, [])
      }

      setHasChecked(true)
      toast.success('Availability checked successfully')
    } catch (error) {
      console.error('Error checking availability:', error)
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
    const sortedBookings = bookings
      .filter(b => b.status !== 'cancelled')
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
    <div className="space-y-4">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-lg p-5 shadow-xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Availability Intelligence
              </h1>
              <p className="text-white/90 text-xs">
                Advanced place availability analysis with real-time insights
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Search Card */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4 text-blue-600" />
            Search Availability
          </CardTitle>
          <p className="text-xs text-muted-foreground">Select place and date to analyze availability</p>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Place Select */}
            <div className="md:col-span-2">
              <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                Select Place *
              </Label>
              <Select value={selectedPlace} onValueChange={(value) => {
                console.log('🏢 Place selected:', value)
                setSelectedPlace(value)
                const place = places.find(p => p.id === value)
                console.log('📊 Place data found:', place)
                setSelectedPlaceData(place || null)
              }}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={isLoadingPlaces ? "Loading places..." : "Choose a place"} />
                </SelectTrigger>
                <SelectContent>
                  {places.map(place => (
                    <SelectItem key={place.id} value={place.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{place.name}</span>
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {place.capacity}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">{place.place_type}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Input */}
            <div>
              <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-purple-600" />
                Select Date *
              </Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="h-11"
              />
            </div>

            {/* Action Button */}
            <div className="flex items-end">
              <Button
                onClick={checkAvailability}
                disabled={!selectedPlace || !selectedDate || isChecking}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                size="lg"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Check Availability
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Selected Place Info */}
          {selectedPlaceData && (
            <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-600 font-semibold mb-2">SELECTED PLACE DETAILS</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">Place</p>
                    <p className="text-sm font-bold text-gray-900">{selectedPlaceData.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-600">Capacity</p>
                    <p className="text-sm font-bold text-gray-900">{selectedPlaceData.capacity} People</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-pink-600" />
                  <div>
                    <p className="text-xs text-gray-600">Type</p>
                    <p className="text-sm font-bold text-gray-900">{selectedPlaceData.place_type}</p>
                  </div>
                </div>
                {hasChecked && placeConfig && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-xs text-gray-600">Operating Hours</p>
                      <p className="text-sm font-bold text-gray-900">
                        {placeConfig.start_time.substring(0, 5)} - {placeConfig.end_time.substring(0, 5)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {hasChecked && (
        <>
          {/* Premium Analytics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Total Bookings */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Total Bookings</p>
                    <p className="text-3xl font-bold text-blue-900 mt-1">{existingBookings.length}</p>
                  </div>
                  <div className="p-3 bg-blue-500 rounded-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Slots */}
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Available Slots</p>
                    <p className="text-3xl font-bold text-green-900 mt-1">{availableSlots.length}</p>
                  </div>
                  <div className="p-3 bg-green-500 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Utilization Rate */}
            <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">Utilization</p>
                    <p className="text-3xl font-bold text-orange-900 mt-1">{calculateUtilization()}%</p>
                  </div>
                  <div className="p-3 bg-orange-500 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Hours */}
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Free Hours</p>
                    <p className="text-3xl font-bold text-purple-900 mt-1">
                      {calculateTotalAvailableHours().hours}h {calculateTotalAvailableHours().mins}m
                    </p>
                  </div>
                  <div className="p-3 bg-purple-500 rounded-lg">
                    <Timer className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Available Time Slots */}
          {availableSlots.length > 0 && (
            <Card className="border-2 border-green-300 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 pb-3">
                <CardTitle className="flex items-center gap-2 text-green-800 text-base">
                  <CheckCircle className="h-4 w-4" />
                  Available Time Slots ({availableSlots.length})
                </CardTitle>
                <p className="text-xs text-muted-foreground">Click any slot to create a booking</p>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {availableSlots.map((slot, idx) => (
                    <div
                      key={idx}
                      className="group relative overflow-hidden p-3 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg hover:shadow-lg hover:scale-102 transition-all cursor-pointer"
                      onClick={() => {
                        const url = `/admin/bookings/new?place=${selectedPlace}&date=${selectedDate}&startTime=${encodeURIComponent(slot.start)}&endTime=${encodeURIComponent(slot.end)}`
                        window.location.href = url
                      }}
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-green-200 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-green-600 text-white font-semibold text-xs">
                            <Timer className="h-3 w-3 mr-1" />
                            {slot.duration}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-green-700">Available</span>
                          </div>
                        </div>
                        <div className="text-xl font-bold text-green-900 mb-1">
                          {slot.start} - {slot.end}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-green-700 group-hover:text-green-900 transition-colors">
                          <span className="font-medium">Book this slot</span>
                          <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Bookings */}
          {existingBookings.length > 0 && (
            <Card className="border-2 border-orange-300 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 pb-3">
                <CardTitle className="flex items-center gap-2 text-orange-800 text-base">
                  <Calendar className="h-4 w-4" />
                  Existing Bookings ({existingBookings.length})
                </CardTitle>
                <p className="text-xs text-muted-foreground">Current bookings for this date and place</p>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="max-h-[450px] overflow-y-auto space-y-3 pr-2">
                  {existingBookings
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                    .map((booking) => (
                    <div
                      key={booking.id}
                      className="p-3 bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 border-2 border-orange-300 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-2">
                          <div className="p-1.5 bg-orange-500 rounded-lg">
                            <CircleDot className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-orange-900">{booking.title}</h4>
                            {booking.booking_ref_id && (
                              <p className="text-xs text-gray-600">Ref: {booking.booking_ref_id}</p>
                            )}
                          </div>
                        </div>
                        <Badge className={
                          booking.status === 'ongoing' ? 'bg-green-500 text-white text-xs' :
                          booking.status === 'upcoming' ? 'bg-orange-500 text-white text-xs' :
                          booking.status === 'completed' ? 'bg-blue-500 text-white text-xs' :
                          'bg-gray-500 text-white text-xs'
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
            <Card className="border-2 border-green-300 shadow-xl">
              <CardContent className="py-8">
                <div className="text-center">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-700 mb-2">Fully Available!</h3>
                  <p className="text-gray-600 mb-6">This place has no bookings for the selected date. Entire day is free.</p>
                  <Button
                    onClick={() => window.location.href = `/admin/bookings/new?place=${selectedPlace}&date=${selectedDate}`}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
                    size="lg"
                  >
                    <CalendarCheck className="h-5 w-5 mr-2" />
                    Create New Booking
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fully Booked */}
          {availableSlots.length === 0 && existingBookings.length > 0 && (
            <Card className="border-2 border-red-300 shadow-xl">
              <CardContent className="py-8">
                <div className="text-center">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
                    <XCircle className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-red-700 mb-2">Fully Booked</h3>
                  <p className="text-gray-600">No free time slots available for this date and place.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!hasChecked && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="py-10">
            <div className="text-center text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No Analysis Yet</p>
              <p className="text-sm">Select a place and date above, then click "Check Availability" to see detailed insights</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
