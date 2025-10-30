"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CheckCircle,
  Search,
  User,
  Calendar,
  MapPin,
  ArrowLeft,
  UserPlus,
  Award as IdCard,
  AlertCircle,
  Clock,
  Users,
} from "lucide-react"

type AccountView = "search" | "booking-details" | "confirm-participant" | "add-member" | "success" | "error"

interface Booking {
  id: string
  title: string
  date: string
  time: string
  startTime: string
  endTime: string
  place: string
  host: string
  status: "upcoming" | "ongoing" | "completed"
  internalParticipants: string[]
  externalParticipants: ExternalMember[]
  description?: string
}

interface ExternalMember {
  id: string
  name: string
  email: string
  phone: string
  nic: string
  company?: string
  status: "pending" | "confirmed" | "checked-in"
}

const mockBookings: Booking[] = [
  {
    id: "BK001",
    title: "Project Review Meeting",
    date: "2024-01-15",
    time: "10:00 AM - 11:00 AM",
    startTime: "10:00",
    endTime: "11:00",
    place: "Conference Room A",
    host: "Sarah Johnson",
    status: "upcoming",
    description: "Quarterly project review and planning session",
    internalParticipants: ["John Doe", "Jane Smith"],
    externalParticipants: [
      {
        id: "1",
        name: "Mike Wilson",
        email: "mike@company.com",
        phone: "+1234567890",
        nic: "123456789V",
        company: "Tech Corp",
        status: "pending",
      },
      {
        id: "2",
        name: "Lisa Brown",
        email: "lisa@startup.com",
        phone: "+1234567891",
        nic: "987654321V",
        company: "StartupXYZ",
        status: "pending",
      },
    ],
  },
  {
    id: "MTG123",
    title: "Client Presentation",
    date: "2024-01-15",
    time: "2:00 PM - 3:30 PM",
    startTime: "14:00",
    endTime: "15:30",
    place: "Boardroom",
    host: "David Chen",
    status: "ongoing",
    description: "Product demonstration for potential clients",
    internalParticipants: ["David Chen", "Maria Garcia"],
    externalParticipants: [
      {
        id: "3",
        name: "Robert Taylor",
        email: "robert@clientcorp.com",
        phone: "+1234567892",
        nic: "456789123V",
        company: "Client Corp",
        status: "pending",
      },
    ],
  },
]

export default function TabletAccountPage() {
  const [currentView, setCurrentView] = useState<AccountView>("search")
  const [bookingId, setBookingId] = useState("")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [selectedMember, setSelectedMember] = useState<ExternalMember | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    nic: "",
    company: "",
  })

  const handleSearchBooking = () => {
    setErrorMessage("")

    if (!bookingId.trim()) {
      setErrorMessage("Please enter a booking ID")
      return
    }

    const booking = mockBookings.find((b) => b.id.toLowerCase() === bookingId.toLowerCase())
    if (booking) {
      setSelectedBooking(booking)
      setCurrentView("booking-details")
    } else {
      setErrorMessage("Booking not found. Please check your booking ID or contact reception for assistance.")
      setCurrentView("error")
    }
  }

  const handleConfirmParticipant = (member: ExternalMember) => {
    setSelectedMember(member)
    setCurrentView("confirm-participant")
  }

  const handleAddNewMember = () => {
    setCurrentView("add-member")
  }

  const handleConfirmAttendance = () => {
    if (selectedMember && selectedBooking) {
      // Update member status to confirmed
      selectedMember.status = "confirmed"
      console.log("[v0] Participant confirmed:", selectedMember.name, "for booking:", selectedBooking.id)
    }
    setCurrentView("success")
    setTimeout(() => {
      resetForm()
    }, 4000)
  }

  const handleAddMemberSubmit = () => {
    if (!newMember.name || !newMember.email || !newMember.phone || !newMember.nic) {
      setErrorMessage("Please fill in all required fields")
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newMember.email)) {
      setErrorMessage("Please enter a valid email address")
      return
    }

    // NIC validation (basic)
    if (newMember.nic.length < 9) {
      setErrorMessage("Please enter a valid NIC number")
      return
    }

    console.log("[v0] New participant added:", newMember.name, "for booking:", selectedBooking?.id)
    setCurrentView("success")
    setTimeout(() => {
      resetForm()
    }, 4000)
  }

  const resetForm = () => {
    setCurrentView("search")
    setBookingId("")
    setSelectedBooking(null)
    setSelectedMember(null)
    setErrorMessage("")
    setNewMember({ name: "", email: "", phone: "", nic: "", company: "" })
  }

  if (currentView === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <CardContent className="text-center space-y-6">
              <div className="h-24 w-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <h1 className="text-3xl font-bold text-destructive">Booking Not Found</h1>
              <p className="text-lg text-muted-foreground">{errorMessage}</p>

              <div className="space-y-4">
                <Button onClick={() => setCurrentView("search")} className="w-full text-lg py-4">
                  <Search className="h-5 w-5 mr-2" />
                  Try Another Search
                </Button>

                <div className="text-center text-muted-foreground">
                  <p className="text-base">Need help?</p>
                  <p className="text-sm">Contact reception desk for assistance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (currentView === "search") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-foreground mb-4">Visitor Account</h1>
            <p className="text-xl text-muted-foreground">Enter your meeting details to check in</p>
          </div>

          <Card className="p-8">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Find Your Meeting</CardTitle>
              <CardDescription className="text-lg">Enter your booking ID or meeting reference</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <Label htmlFor="booking-id" className="text-xl">
                  Booking ID / Meeting Reference
                </Label>
                <Input
                  id="booking-id"
                  placeholder="e.g., BK001, MTG123"
                  value={bookingId}
                  onChange={(e) => {
                    setBookingId(e.target.value.toUpperCase())
                    setErrorMessage("")
                  }}
                  className="text-lg p-6"
                  onKeyPress={(e) => e.key === "Enter" && handleSearchBooking()}
                />
              </div>

              <Button onClick={handleSearchBooking} disabled={!bookingId.trim()} className="w-full text-xl py-6">
                <Search className="h-6 w-6 mr-2" />
                Find Meeting
              </Button>

              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Demo Booking IDs:</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="cursor-pointer" onClick={() => setBookingId("BK001")}>
                    BK001
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer" onClick={() => setBookingId("MTG123")}>
                    MTG123
                  </Badge>
                </div>
              </div>

              <div className="text-center text-muted-foreground">
                <p className="text-lg">Don't have a booking ID?</p>
                <p>Contact reception for assistance</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (currentView === "booking-details") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-8">
        <div className="max-w-3xl mx-auto">
          <Button variant="outline" onClick={() => setCurrentView("search")} className="mb-8 text-lg px-6 py-3">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Search
          </Button>

          {selectedBooking && (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-3xl">{selectedBooking.title}</CardTitle>
                      <CardDescription className="text-lg">Meeting Details</CardDescription>
                    </div>
                    <Badge
                      variant={
                        selectedBooking.status === "ongoing"
                          ? "default"
                          : selectedBooking.status === "upcoming"
                            ? "secondary"
                            : "outline"
                      }
                      className="text-lg px-4 py-2"
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <span>{selectedBooking.date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <span>{selectedBooking.time}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span>{selectedBooking.place}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-primary" />
                      <span>Host: {selectedBooking.host}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <IdCard className="h-5 w-5 text-primary" />
                      <span>ID: {selectedBooking.id}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-primary" />
                      <span>
                        {selectedBooking.internalParticipants.length + selectedBooking.externalParticipants.length}{" "}
                        Participants
                      </span>
                    </div>
                  </div>

                  {selectedBooking.description && (
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                      <p className="text-muted-foreground">{selectedBooking.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Are you an expected participant?</CardTitle>
                  <CardDescription className="text-lg">
                    Select your name from the list or add yourself as a new participant
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">External Participants</h3>
                    <div className="space-y-3">
                      {selectedBooking.externalParticipants.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleConfirmParticipant(member)}
                        >
                          <div>
                            <h4 className="text-lg font-medium">{member.name}</h4>
                            <p className="text-muted-foreground">{member.email}</p>
                            {member.company && <p className="text-sm text-muted-foreground">{member.company}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={member.status === "confirmed" ? "default" : "secondary"}
                              className="text-sm"
                            >
                              {member.status}
                            </Badge>
                            <Badge className="bg-primary/10 text-primary border-primary/20">Select</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t">
                    <Button
                      onClick={handleAddNewMember}
                      variant="outline"
                      className="w-full text-lg py-4 bg-transparent"
                    >
                      <UserPlus className="h-5 w-5 mr-2" />
                      I'm not listed - Add me as new participant
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (currentView === "confirm-participant") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-8">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={() => setCurrentView("booking-details")}
            className="mb-8 text-lg px-6 py-3"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>

          {selectedMember && (
            <Card className="p-8">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl">Confirm Your Identity</CardTitle>
                <CardDescription className="text-lg">Please verify your details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                  <h3 className="text-2xl font-semibold">{selectedMember.name}</h3>
                  <div className="space-y-2 text-lg">
                    <p>
                      <strong>Email:</strong> {selectedMember.email}
                    </p>
                    <p>
                      <strong>Phone:</strong> {selectedMember.phone}
                    </p>
                    <p>
                      <strong>NIC:</strong> {selectedMember.nic}
                    </p>
                    {selectedMember.company && (
                      <p>
                        <strong>Company:</strong> {selectedMember.company}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-center space-y-4">
                  <p className="text-lg text-muted-foreground">Is this information correct?</p>
                  <p className="text-sm text-muted-foreground">
                    A visitor pass will be requested from reception after confirmation
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" onClick={() => setCurrentView("booking-details")} className="text-lg py-4">
                    No, Go Back
                  </Button>
                  <Button onClick={handleConfirmAttendance} className="text-lg py-4">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Yes, Confirm
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  if (currentView === "add-member") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-8">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={() => setCurrentView("booking-details")}
            className="mb-8 text-lg px-6 py-3"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>

          <Card className="p-8">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Add New Participant</CardTitle>
              <CardDescription className="text-lg">Please provide your details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-lg">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={newMember.name}
                    onChange={(e) => {
                      setNewMember({ ...newMember, name: e.target.value })
                      setErrorMessage("")
                    }}
                    className="text-lg p-4"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-lg">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@company.com"
                    value={newMember.email}
                    onChange={(e) => {
                      setNewMember({ ...newMember, email: e.target.value })
                      setErrorMessage("")
                    }}
                    className="text-lg p-4"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-lg">
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    placeholder="+1234567890"
                    value={newMember.phone}
                    onChange={(e) => {
                      setNewMember({ ...newMember, phone: e.target.value })
                      setErrorMessage("")
                    }}
                    className="text-lg p-4"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nic" className="text-lg">
                    NIC Number *
                  </Label>
                  <Input
                    id="nic"
                    placeholder="123456789V"
                    value={newMember.nic}
                    onChange={(e) => {
                      setNewMember({ ...newMember, nic: e.target.value })
                      setErrorMessage("")
                    }}
                    className="text-lg p-4"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company" className="text-lg">
                    Company (Optional)
                  </Label>
                  <Input
                    id="company"
                    placeholder="Your company name"
                    value={newMember.company}
                    onChange={(e) => setNewMember({ ...newMember, company: e.target.value })}
                    className="text-lg p-4"
                  />
                </div>
              </div>

              <Button
                onClick={handleAddMemberSubmit}
                disabled={!newMember.name || !newMember.email || !newMember.phone || !newMember.nic}
                className="w-full text-lg py-4"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Add Participant & Request Pass
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (currentView === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-8">
        <Card className="p-12 text-center max-w-lg">
          <CardContent className="space-y-6">
            <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-green-800">Success!</h1>
            <p className="text-xl text-green-700">Participation confirmed successfully</p>
            <div className="space-y-2">
              <p className="text-lg text-green-600">Please proceed to reception to collect your visitor pass</p>
              <p className="text-base text-green-600">Show this confirmation to reception staff</p>
              {selectedBooking && (
                <div className="bg-green-50 p-4 rounded-lg mt-4">
                  <p className="text-sm font-medium text-green-800">Meeting: {selectedBooking.title}</p>
                  <p className="text-sm text-green-700">ID: {selectedBooking.id}</p>
                  <p className="text-sm text-green-700">Time: {selectedBooking.time}</p>
                </div>
              )}
            </div>
            <p className="text-sm text-green-600">Returning to main screen...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
