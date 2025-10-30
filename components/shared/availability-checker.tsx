"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Users, Search, RefreshCw } from "lucide-react"

interface AvailabilityCheckerProps {
  role: "admin" | "reception" | "employee"
}

interface TimeSlot {
  time: string
  status: "available" | "busy" | "partially-busy"
  booking?: {
    id: string
    title: string
    organizer: string
    participants: number
  }
}

interface Place {
  id: string
  name: string
  capacity: number
  type: string
}

export function AvailabilityChecker({ role }: AvailabilityCheckerProps) {
  const [selectedPlace, setSelectedPlace] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)

  // Mock data
  const places: Place[] = [
    { id: "1", name: "Conference Room A", capacity: 12, type: "Conference Room" },
    { id: "2", name: "Meeting Room B", capacity: 6, type: "Meeting Room" },
    { id: "3", name: "Board Room", capacity: 20, type: "Board Room" },
    { id: "4", name: "Training Hall", capacity: 50, type: "Training Room" },
    { id: "5", name: "Small Meeting Room C", capacity: 4, type: "Meeting Room" },
  ]

  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = []
    const startHour = 8
    const endHour = 18

    for (let hour = startHour; hour < endHour; hour++) {
      const time = `${hour.toString().padStart(2, "0")}:00`
      const nextTime = `${(hour + 1).toString().padStart(2, "0")}:00`

      // Mock some busy slots
      const isBusy = Math.random() > 0.7
      const isPartiallyBusy = Math.random() > 0.8

      let status: "available" | "busy" | "partially-busy" = "available"
      let booking = undefined

      if (isBusy) {
        status = "busy"
        booking = {
          id: `BK${Math.floor(Math.random() * 1000)}`,
          title: ["Team Meeting", "Client Presentation", "Project Review", "Training Session"][
            Math.floor(Math.random() * 4)
          ],
          organizer: ["John Smith", "Sarah Johnson", "Mike Wilson", "Lisa Brown"][Math.floor(Math.random() * 4)],
          participants: Math.floor(Math.random() * 8) + 2,
        }
      } else if (isPartiallyBusy) {
        status = "partially-busy"
        booking = {
          id: `BK${Math.floor(Math.random() * 1000)}`,
          title: "Quick Sync",
          organizer: "Team Lead",
          participants: 3,
        }
      }

      slots.push({
        time: `${time} - ${nextTime}`,
        status,
        booking,
      })
    }

    return slots
  }

  const checkAvailability = async () => {
    if (!selectedPlace || !selectedDate) return

    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setTimeSlots(generateTimeSlots())
      setLoading(false)
    }, 1000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-200"
      case "busy":
        return "bg-red-100 text-red-800 border-red-200"
      case "partially-busy":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Available"
      case "busy":
        return "Busy"
      case "partially-busy":
        return "Partially Busy"
      default:
        return "Unknown"
    }
  }

  const selectedPlaceInfo = places.find((p) => p.id === selectedPlace)

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Check Availability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="place">Select Place</Label>
              <Select value={selectedPlace} onValueChange={setSelectedPlace}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a place" />
                </SelectTrigger>
                <SelectContent>
                  {places.map((place) => (
                    <SelectItem key={place.id} value={place.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{place.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {place.capacity} seats
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Select Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={checkAvailability}
                disabled={!selectedPlace || !selectedDate || loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
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

          {selectedPlaceInfo && (
            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{selectedPlaceInfo.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedPlaceInfo.type} • Capacity: {selectedPlaceInfo.capacity} people
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {timeSlots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Availability for {selectedDate}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {timeSlots.map((slot, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{slot.time}</span>
                    <Badge className={getStatusColor(slot.status)}>{getStatusText(slot.status)}</Badge>
                  </div>

                  {slot.booking && (
                    <div className="text-right">
                      <p className="font-medium text-sm">{slot.booking.title}</p>
                      <p className="text-xs text-muted-foreground">Organizer: {slot.booking.organizer}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {slot.booking.participants} participants
                      </div>
                    </div>
                  )}

                  {slot.status === "available" && role !== "reception" && (
                    <Button size="sm" variant="outline">
                      Book This Slot
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {timeSlots.filter((s) => s.status === "available").length}
                  </div>
                  <div className="text-muted-foreground">Available Slots</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {timeSlots.filter((s) => s.status === "busy").length}
                  </div>
                  <div className="text-muted-foreground">Busy Slots</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {timeSlots.filter((s) => s.status === "partially-busy").length}
                  </div>
                  <div className="text-muted-foreground">Partially Busy</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
