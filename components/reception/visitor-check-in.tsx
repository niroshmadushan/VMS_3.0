"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserCheck, Search, Camera, Clock, MapPin, Phone } from "lucide-react"

interface ExpectedVisitor {
  id: string
  name: string
  email: string
  phone: string
  meetingId: string
  meetingTitle: string
  place: string
  time: string
  responsiblePerson: string
  status: "expected" | "checked-in" | "no-show"
  referenceType: "NIC" | "Passport" | "Employee ID"
  referenceValue: string
}

const mockExpectedVisitors: ExpectedVisitor[] = [
  {
    id: "1",
    name: "David Wilson",
    email: "david@external.com",
    phone: "+1234567890",
    meetingId: "MTG001",
    meetingTitle: "Weekly Team Meeting",
    place: "Conference Room A",
    time: "10:00 AM",
    responsiblePerson: "John Admin",
    status: "expected",
    referenceType: "NIC",
    referenceValue: "123456789V",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@client.com",
    phone: "+1234567891",
    meetingId: "MTG002",
    meetingTitle: "Client Presentation",
    place: "Board Room",
    time: "2:00 PM",
    responsiblePerson: "Lisa Johnson",
    status: "checked-in",
    referenceType: "Passport",
    referenceValue: "A12345678",
  },
  {
    id: "3",
    name: "Robert Brown",
    email: "robert@client.com",
    phone: "+1234567892",
    meetingId: "MTG002",
    meetingTitle: "Client Presentation",
    place: "Board Room",
    time: "2:00 PM",
    responsiblePerson: "Lisa Johnson",
    status: "expected",
    referenceType: "Employee ID",
    referenceValue: "EMP001",
  },
  {
    id: "4",
    name: "Sarah Davis",
    email: "sarah@partner.com",
    phone: "+1234567893",
    meetingId: "MTG003",
    meetingTitle: "Partnership Discussion",
    place: "Meeting Room B",
    time: "11:00 AM",
    responsiblePerson: "Mike Employee",
    status: "no-show",
    referenceType: "NIC",
    referenceValue: "987654321V",
  },
]

export function VisitorCheckIn() {
  const [visitors, setVisitors] = useState<ExpectedVisitor[]>(mockExpectedVisitors)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedVisitor, setSelectedVisitor] = useState<ExpectedVisitor | null>(null)
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false)

  const filteredVisitors = visitors.filter(
    (visitor) =>
      visitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.meetingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.referenceValue.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const todaysVisitors = filteredVisitors.filter((visitor) => {
    // In a real app, you'd filter by today's date
    return true
  })

  const handleCheckIn = (visitor: ExpectedVisitor) => {
    setSelectedVisitor(visitor)
    setIsCheckInDialogOpen(true)
  }

  const confirmCheckIn = () => {
    if (selectedVisitor) {
      setVisitors(visitors.map((v) => (v.id === selectedVisitor.id ? { ...v, status: "checked-in" as const } : v)))
      setIsCheckInDialogOpen(false)
      setSelectedVisitor(null)
      // In a real app, this would also capture a photo
      alert("Visitor checked in successfully! Photo captured.")
    }
  }

  const markNoShow = (visitorId: string) => {
    setVisitors(visitors.map((v) => (v.id === visitorId ? { ...v, status: "no-show" as const } : v)))
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "checked-in":
        return "default"
      case "expected":
        return "secondary"
      case "no-show":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "checked-in":
        return "text-primary"
      case "expected":
        return "text-secondary"
      case "no-show":
        return "text-destructive"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Visitor Check-in</h2>
          <p className="text-muted-foreground">Manage visitor arrivals and confirmations</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Visitors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search by name, meeting ID, or reference number</Label>
              <Input
                id="search"
                placeholder="Enter visitor name, meeting ID, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="bg-transparent">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Today's Visitors</TabsTrigger>
          <TabsTrigger value="all">All Expected</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Expected Visitors Today ({todaysVisitors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visitor Details</TableHead>
                    <TableHead>Meeting Info</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todaysVisitors.map((visitor) => (
                    <TableRow key={visitor.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{visitor.name}</p>
                          <p className="text-sm text-muted-foreground">{visitor.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{visitor.meetingId}</p>
                          <p className="text-sm text-muted-foreground">{visitor.meetingTitle}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            {visitor.place}
                            <Clock className="h-3 w-3 ml-2" />
                            {visitor.time}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {visitor.phone}
                        </div>
                        <p className="text-xs text-muted-foreground">Host: {visitor.responsiblePerson}</p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{visitor.referenceType}</p>
                          <p className="text-xs text-muted-foreground">{visitor.referenceValue}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(visitor.status)}>
                          {visitor.status === "checked-in"
                            ? "Checked In"
                            : visitor.status === "no-show"
                              ? "No Show"
                              : "Expected"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {visitor.status === "expected" && (
                            <>
                              <Button size="sm" onClick={() => handleCheckIn(visitor)}>
                                Check In
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markNoShow(visitor.id)}
                                className="text-destructive hover:text-destructive bg-transparent"
                              >
                                No Show
                              </Button>
                            </>
                          )}
                          {visitor.status === "checked-in" && (
                            <Badge variant="default" className="text-xs">
                              ✓ Arrived
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Expected Visitors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredVisitors.map((visitor) => (
                  <Card key={visitor.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <h3 className="font-medium">{visitor.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {visitor.meetingId} • {visitor.meetingTitle}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {visitor.place} • {visitor.time} • Host: {visitor.responsiblePerson}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={getStatusBadgeVariant(visitor.status)}>
                            {visitor.status === "checked-in"
                              ? "Checked In"
                              : visitor.status === "no-show"
                                ? "No Show"
                                : "Expected"}
                          </Badge>
                          {visitor.status === "expected" && (
                            <Button size="sm" onClick={() => handleCheckIn(visitor)}>
                              Check In
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Visitor Check-in</DialogTitle>
          </DialogHeader>
          {selectedVisitor && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium">{selectedVisitor.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedVisitor.meetingId} • {selectedVisitor.meetingTitle}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedVisitor.place} • {selectedVisitor.time}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedVisitor.referenceType}: {selectedVisitor.referenceValue}
                </p>
              </div>

              <div className="flex items-center gap-2 p-4 bg-primary/10 rounded-lg">
                <Camera className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Photo Capture</p>
                  <p className="text-xs text-muted-foreground">
                    A photo will be captured automatically upon confirmation
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCheckInDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmCheckIn}>Confirm Check-in</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
