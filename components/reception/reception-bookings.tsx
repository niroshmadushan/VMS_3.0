"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Plus, Eye, Edit, MapPin, Users } from "lucide-react"

interface Booking {
  id: string
  title: string
  description: string
  date: string
  place: string
  startTime: string
  endTime: string
  responsiblePerson: string
  internalParticipants: string[]
  externalParticipants: number
  status: "upcoming" | "ongoing" | "completed" | "cancelled"
  createdBy: string
  canEdit: boolean
}

const mockBookings: Booking[] = [
  {
    id: "1",
    title: "Client Meeting",
    description: "Quarterly review with key client",
    date: "2024-12-10",
    place: "Conference Room A",
    startTime: "10:00",
    endTime: "11:00",
    responsiblePerson: "Sarah Reception",
    internalParticipants: ["John Admin"],
    externalParticipants: 2,
    status: "upcoming",
    createdBy: "Sarah Reception",
    canEdit: true,
  },
  {
    id: "2",
    title: "Weekly Team Meeting",
    description: "Regular team sync and updates",
    date: "2024-12-10",
    place: "Conference Room A",
    startTime: "14:00",
    endTime: "15:00",
    responsiblePerson: "John Admin",
    internalParticipants: ["Sarah Reception", "Mike Employee"],
    externalParticipants: 1,
    status: "upcoming",
    createdBy: "John Admin",
    canEdit: false,
  },
  {
    id: "3",
    title: "Vendor Presentation",
    description: "New software demo",
    date: "2024-12-11",
    place: "Board Room",
    startTime: "09:00",
    endTime: "10:30",
    responsiblePerson: "Sarah Reception",
    internalParticipants: ["Lisa Johnson"],
    externalParticipants: 3,
    status: "upcoming",
    createdBy: "Sarah Reception",
    canEdit: true,
  },
]

export function ReceptionBookings() {
  const [bookings] = useState<Booking>(mockBookings)

  const myBookings = bookings.filter((booking) => booking.canEdit)
  const otherBookings = bookings.filter((booking) => !booking.canEdit)

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Booking Management</h2>
          <p className="text-muted-foreground">Create and manage meeting bookings</p>
        </div>

        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Booking
        </Button>
      </div>

      <Tabs defaultValue="my-bookings">
        <TabsList>
          <TabsTrigger value="my-bookings">My Bookings ({myBookings.length})</TabsTrigger>
          <TabsTrigger value="all-bookings">All Bookings ({bookings.length})</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="my-bookings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                My Bookings - Can Edit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Place</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.title}</p>
                          {booking.description && (
                            <p className="text-sm text-muted-foreground">{booking.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm">{booking.date}</p>
                            <p className="text-xs text-muted-foreground">
                              {booking.startTime} - {booking.endTime}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {booking.place}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {booking.internalParticipants.length + booking.externalParticipants} total
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(booking.status)}>{booking.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-bookings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                All Bookings - Read Only
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Place</TableHead>
                    <TableHead>Responsible</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.title}</p>
                          {booking.description && (
                            <p className="text-sm text-muted-foreground">{booking.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm">{booking.date}</p>
                            <p className="text-xs text-muted-foreground">
                              {booking.startTime} - {booking.endTime}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {booking.place}
                        </div>
                      </TableCell>
                      <TableCell>{booking.responsiblePerson}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {booking.internalParticipants.length + booking.externalParticipants} total
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(booking.status)}>{booking.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" disabled={!booking.canEdit}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Calendar view will be implemented with a calendar component
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
