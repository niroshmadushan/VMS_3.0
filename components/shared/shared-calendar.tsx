"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, Download, ChevronLeft, ChevronRight, Clock, MapPin, Users, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CalendarEvent {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  place: string
  type: "my-booking" | "invited" | "all-access"
  status: "upcoming" | "ongoing" | "completed" | "cancelled"
  organizer: string
  participants: number
  hasRefreshments?: boolean
}

interface SharedCalendarProps {
  role: "admin" | "reception" | "employee"
}

const mockEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Team Standup",
    date: "2024-12-10",
    startTime: "09:00",
    endTime: "09:30",
    place: "Conference Room A",
    type: "my-booking",
    status: "upcoming",
    organizer: "John Admin",
    participants: 5,
    hasRefreshments: false,
  },
  {
    id: "2",
    title: "Client Presentation",
    date: "2024-12-10",
    startTime: "10:00",
    endTime: "11:30",
    place: "Board Room",
    type: "all-access",
    status: "upcoming",
    organizer: "Sarah Reception",
    participants: 8,
    hasRefreshments: true,
  },
  {
    id: "3",
    title: "Project Planning",
    date: "2024-12-10",
    startTime: "14:00",
    endTime: "15:00",
    place: "Meeting Room B",
    type: "invited",
    status: "upcoming",
    organizer: "Mike Employee",
    participants: 4,
    hasRefreshments: false,
  },
  {
    id: "4",
    title: "Vendor Meeting",
    date: "2024-12-11",
    startTime: "11:00",
    endTime: "12:00",
    place: "Conference Room A",
    type: "all-access",
    status: "upcoming",
    organizer: "Lisa Johnson",
    participants: 6,
    hasRefreshments: true,
  },
  {
    id: "5",
    title: "Training Session",
    date: "2024-12-12",
    startTime: "09:00",
    endTime: "12:00",
    place: "Training Hall",
    type: "all-access",
    status: "upcoming",
    organizer: "John Admin",
    participants: 20,
    hasRefreshments: true,
  },
]

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const timeSlots = Array.from({ length: 10 }, (_, i) => `${(i + 8).toString().padStart(2, "0")}:00`)

export function SharedCalendar({ role }: SharedCalendarProps) {
  const [currentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"week" | "month">("week")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPlace, setFilterPlace] = useState<string>("all")

  const getEventsForDate = (date: string) => {
    let events = mockEvents.filter((event) => event.date === date)

    // Apply filters
    if (filterStatus !== "all") {
      events = events.filter((event) => event.status === filterStatus)
    }

    if (filterPlace !== "all") {
      events = events.filter((event) => event.place === filterPlace)
    }

    // Role-based filtering
    if (role === "employee") {
      events = events.filter((event) => event.type === "my-booking" || event.type === "invited")
    }

    return events
  }

  const exportToCalendar = (type: "google" | "outlook") => {
    alert(`Export to ${type} Calendar - Feature coming soon!`)
  }

  const generateWeekDates = () => {
    const week = []
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1) // Start from Monday

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      week.push(date.toISOString().split("T")[0])
    }
    return week
  }

  const weekDates = generateWeekDates()

  const getEventTypeColor = (type: string, hasRefreshments?: boolean) => {
    let baseColor = ""
    switch (type) {
      case "my-booking":
        baseColor = "bg-primary text-primary-foreground"
        break
      case "invited":
        baseColor = "bg-secondary text-secondary-foreground"
        break
      case "all-access":
        baseColor = "bg-accent text-accent-foreground"
        break
      default:
        baseColor = "bg-muted text-muted-foreground"
    }

    return hasRefreshments ? `${baseColor} border-l-4 border-orange-500` : baseColor
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "upcoming":
        return "default"
      case "ongoing":
        return "secondary"
      case "completed":
        return "outline"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  const places = [...new Set(mockEvents.map((event) => event.place))]

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Place</label>
              <Select value={filterPlace} onValueChange={setFilterPlace}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Places</SelectItem>
                  {places.map((place) => (
                    <SelectItem key={place} value={place}>
                      {place}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFilterStatus("all")
                  setFilterPlace("all")
                }}
                className="w-full h-9"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Export buttons */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t">
            <span className="text-sm font-medium">Export:</span>
            <Button variant="outline" size="sm" onClick={() => exportToCalendar("google")} className="h-8">
              <Download className="h-3 w-3 mr-1" />
              Google
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportToCalendar("outlook")} className="h-8">
              <Download className="h-3 w-3 mr-1" />
              Outlook
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
        <TabsList>
          <TabsTrigger value="week">Week View</TabsTrigger>
          <TabsTrigger value="month">Month View</TabsTrigger>
        </TabsList>

        <TabsContent value="week" className="mt-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Week of {weekDates[0]} to {weekDates[6]}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent">
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent">
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-8 gap-px bg-border rounded-lg overflow-hidden">
                {/* Header row */}
                <div className="p-2 bg-muted"></div>
                {daysOfWeek.map((day, index) => (
                  <div key={day} className="p-2 text-center font-medium bg-muted">
                    <div className="text-sm">{day}</div>
                    <div className="text-xs text-muted-foreground">{weekDates[index]?.split("-")[2]}</div>
                  </div>
                ))}

                {/* Time slots */}
                {timeSlots.map((time) => (
                  <div key={time} className="contents">
                    <div className="p-2 text-sm text-muted-foreground bg-muted/50 flex items-center">{time}</div>
                    {weekDates.map((date) => {
                      const events = getEventsForDate(date).filter((event) => event.startTime === time)
                      return (
                        <div key={`${date}-${time}`} className="p-1 bg-background min-h-[50px]">
                          {events.map((event) => (
                            <div
                              key={event.id}
                              className={`p-1.5 rounded text-xs mb-1 ${getEventTypeColor(event.type, event.hasRefreshments)}`}
                            >
                              <div className="font-medium truncate">{event.title}</div>
                              <div className="truncate opacity-90">{event.place}</div>
                              {event.hasRefreshments && (
                                <div className="text-orange-600 font-medium text-[10px]">🍽️</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month" className="mt-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  December 2024
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent">
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent">
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {daysOfWeek.map((day) => (
                  <div key={day} className="p-2 text-center font-medium bg-muted text-sm">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 35 }, (_, i) => {
                  const dayNumber = i - 6 // Adjust for month start
                  const isCurrentMonth = dayNumber > 0 && dayNumber <= 31
                  const date = isCurrentMonth ? `2024-12-${dayNumber.toString().padStart(2, "0")}` : ""
                  const events = date ? getEventsForDate(date) : []

                  return (
                    <div
                      key={i}
                      className={`p-2 bg-background min-h-[80px] ${
                        !isCurrentMonth ? "bg-muted/30 text-muted-foreground" : ""
                      }`}
                    >
                      {isCurrentMonth && (
                        <>
                          <div className="text-sm font-medium mb-1">{dayNumber}</div>
                          <div className="space-y-0.5">
                            {events.slice(0, 2).map((event) => (
                              <div
                                key={event.id}
                                className={`text-[10px] p-1 rounded truncate ${getEventTypeColor(event.type, event.hasRefreshments)}`}
                              >
                                {event.title}
                                {event.hasRefreshments && " 🍽️"}
                              </div>
                            ))}
                            {events.length > 2 && (
                              <div className="text-[10px] text-muted-foreground">+{events.length - 2} more</div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Event Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-4 w-4" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {mockEvents
              .filter((event) => event.status === "upcoming")
              .slice(0, 5)
              .map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{event.title}</p>
                      {event.hasRefreshments && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600 text-xs">
                          🍽️
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {event.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {event.startTime} - {event.endTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.place}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {event.participants}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">by {event.organizer}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <Badge variant={getStatusBadgeVariant(event.status)} className="text-xs">
                      {event.status}
                    </Badge>
                    {role !== "employee" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs bg-transparent">
                        View
                      </Button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
