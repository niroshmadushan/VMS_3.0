"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Users, UserCheck } from "lucide-react"

interface CalendarEvent {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  place: string
  visitors: number
  hasRefreshments?: boolean
  status: "upcoming" | "ongoing" | "completed"
}

const mockEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Client Visit",
    date: "2024-12-10",
    startTime: "10:00",
    endTime: "11:30",
    place: "Reception Area",
    visitors: 3,
    hasRefreshments: true,
    status: "upcoming",
  },
  {
    id: "2",
    title: "Vendor Meeting",
    date: "2024-12-10",
    startTime: "14:00",
    endTime: "15:00",
    place: "Conference Room A",
    visitors: 2,
    status: "upcoming",
  },
]

export function ReceptionCalendar() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Visitor Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{event.title}</h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {event.startTime} - {event.endTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.place}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {event.visitors} visitors
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {event.hasRefreshments && (
                    <Badge variant="outline" className="text-orange-600">
                      🍽️ Refreshments
                    </Badge>
                  )}
                  <Button size="sm" variant="outline">
                    Check-in
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
