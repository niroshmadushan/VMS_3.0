"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, User, Calendar, MapPin, Star, QrCode, ArrowLeft, UserCheck } from "lucide-react"
import Link from "next/link"

type TabletView = "welcome" | "checkin" | "feedback" | "success"

interface Meeting {
  id: string
  title: string
  time: string
  place: string
  host: string
  status: "upcoming" | "active" | "completed"
}

const mockMeetings: Meeting[] = [
  {
    id: "1",
    title: "Project Review Meeting",
    time: "10:00 AM",
    place: "Conference Room A",
    host: "Sarah Johnson",
    status: "upcoming",
  },
  {
    id: "2",
    title: "Client Presentation",
    time: "2:00 PM",
    place: "Meeting Room B",
    host: "Mike Wilson",
    status: "upcoming",
  },
]

export function TabletInterface() {
  const [currentView, setCurrentView] = useState<TabletView>("welcome")
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [visitorName, setVisitorName] = useState("")
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState("")

  const handleCheckIn = (meeting: Meeting) => {
    setSelectedMeeting(meeting)
    setCurrentView("checkin")
  }

  const handleCheckInComplete = () => {
    setCurrentView("success")
    setTimeout(() => {
      setCurrentView("welcome")
      setSelectedMeeting(null)
      setVisitorName("")
    }, 3000)
  }

  const handleFeedbackSubmit = () => {
    setCurrentView("success")
    setTimeout(() => {
      setCurrentView("welcome")
      setRating(0)
      setFeedback("")
    }, 3000)
  }

  const renderStars = (currentRating: number, onRate?: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-8 w-8 cursor-pointer transition-colors ${
          i < currentRating ? "text-yellow-400 fill-current" : "text-gray-300 hover:text-yellow-200"
        }`}
        onClick={() => onRate && onRate(i + 1)}
      />
    ))
  }

  if (currentView === "welcome") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold text-foreground mb-4">Welcome</h1>
            <p className="text-2xl text-muted-foreground">Visitor Management System</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Link href="/tablet/account">
              <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="text-center space-y-4">
                  <div className="h-16 w-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                    <UserCheck className="h-8 w-8 text-secondary" />
                  </div>
                  <h2 className="text-3xl font-semibold text-foreground">Visitor Account</h2>
                  <p className="text-lg text-muted-foreground">Find your meeting and confirm attendance</p>
                </CardContent>
              </Card>
            </Link>

            <Card
              className="p-8 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setCurrentView("checkin")}
            >
              <CardContent className="text-center space-y-4">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-3xl font-semibold text-foreground">Quick Check In</h2>
                <p className="text-lg text-muted-foreground">Check in for your scheduled meeting</p>
              </CardContent>
            </Card>

            <Card
              className="p-8 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setCurrentView("feedback")}
            >
              <CardContent className="text-center space-y-4">
                <div className="h-16 w-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                  <Star className="h-8 w-8 text-accent" />
                </div>
                <h2 className="text-3xl font-semibold text-foreground">Feedback</h2>
                <p className="text-lg text-muted-foreground">Share your experience with us</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Today's Meetings</CardTitle>
              <CardDescription className="text-lg">Upcoming meetings for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex items-center justify-between p-6 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleCheckIn(meeting)}
                  >
                    <div className="flex items-center space-x-6">
                      <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">{meeting.title}</h3>
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {meeting.time}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {meeting.place}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {meeting.host}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200 text-lg px-4 py-2">Check In</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (currentView === "checkin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-8">
        <div className="max-w-2xl mx-auto">
          <Button variant="outline" onClick={() => setCurrentView("welcome")} className="mb-8 text-lg px-6 py-3">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>

          <Card className="p-8">
            <CardHeader className="text-center">
              <CardTitle className="text-4xl">Check In</CardTitle>
              <CardDescription className="text-xl">
                {selectedMeeting ? `for ${selectedMeeting.title}` : "Complete your check-in"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {selectedMeeting && (
                <div className="bg-muted/50 p-6 rounded-lg space-y-2">
                  <h3 className="text-2xl font-semibold text-foreground">{selectedMeeting.title}</h3>
                  <div className="flex items-center gap-6 text-muted-foreground text-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      {selectedMeeting.time}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {selectedMeeting.place}
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {selectedMeeting.host}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <Label htmlFor="visitor-name" className="text-xl">
                  Your Name
                </Label>
                <Input
                  id="visitor-name"
                  placeholder="Enter your full name"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="text-lg p-6"
                />
              </div>

              <div className="text-center space-y-6">
                <div className="h-32 w-32 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <QrCode className="h-16 w-16 text-primary" />
                </div>
                <p className="text-lg text-muted-foreground">Your visitor pass will be generated after check-in</p>
              </div>

              <Button onClick={handleCheckInComplete} disabled={!visitorName.trim()} className="w-full text-xl py-6">
                <CheckCircle className="h-6 w-6 mr-2" />
                Complete Check In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (currentView === "feedback") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-8">
        <div className="max-w-2xl mx-auto">
          <Button variant="outline" onClick={() => setCurrentView("welcome")} className="mb-8 text-lg px-6 py-3">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>

          <Card className="p-8">
            <CardHeader className="text-center">
              <CardTitle className="text-4xl">Share Your Feedback</CardTitle>
              <CardDescription className="text-xl">Help us improve your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="text-center space-y-4">
                <Label className="text-xl">How was your experience?</Label>
                <div className="flex justify-center gap-2">{renderStars(rating, setRating)}</div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="feedback-text" className="text-xl">
                  Comments (Optional)
                </Label>
                <Textarea
                  id="feedback-text"
                  placeholder="Tell us about your experience..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="text-lg p-6 min-h-32"
                />
              </div>

              <Button onClick={handleFeedbackSubmit} disabled={rating === 0} className="w-full text-xl py-6">
                <Star className="h-6 w-6 mr-2" />
                Submit Feedback
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
            <p className="text-xl text-green-700">
              {selectedMeeting ? "Check-in completed successfully" : "Thank you for your feedback"}
            </p>
            <p className="text-lg text-green-600">Returning to main screen...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
