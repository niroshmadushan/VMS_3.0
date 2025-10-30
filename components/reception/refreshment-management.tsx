"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Coffee, Clock, CheckCircle, AlertCircle, Calendar, MapPin, Users, ChefHat, Timer, Package } from "lucide-react"

interface RefreshmentRequest {
  id: string
  meetingTitle: string
  meetingId: string
  date: string
  startTime: string
  endTime: string
  place: string
  servingTime: string
  organizer: string
  participantCount: number
  refreshmentType: string
  items: string[]
  specialRequests: string
  status: "pending" | "preparing" | "ready" | "served" | "completed"
  estimatedPrepTime: number
  priority: "low" | "medium" | "high"
}

const mockRefreshmentRequests: RefreshmentRequest[] = [
  {
    id: "1",
    meetingTitle: "Weekly Team Meeting",
    meetingId: "MTG001",
    date: "2024-12-10",
    startTime: "10:00",
    endTime: "11:00",
    place: "Conference Room A",
    servingTime: "10:15",
    organizer: "John Admin",
    participantCount: 5,
    refreshmentType: "Light Refreshments",
    items: ["Coffee", "Tea", "Cookies"],
    specialRequests: "Vegetarian options required",
    status: "preparing",
    estimatedPrepTime: 15,
    priority: "medium",
  },
  {
    id: "2",
    meetingTitle: "Client Presentation",
    meetingId: "MTG002",
    date: "2024-12-10",
    startTime: "14:00",
    endTime: "15:30",
    place: "Board Room",
    servingTime: "14:30",
    organizer: "Lisa Johnson",
    participantCount: 8,
    refreshmentType: "Full Catering",
    items: ["Lunch", "Beverages", "Dessert"],
    specialRequests: "Halal and vegetarian options",
    status: "pending",
    estimatedPrepTime: 45,
    priority: "high",
  },
  {
    id: "3",
    meetingTitle: "Training Session",
    meetingId: "MTG003",
    date: "2024-12-11",
    startTime: "09:00",
    endTime: "12:00",
    place: "Training Hall",
    servingTime: "10:30",
    organizer: "Sarah Reception",
    participantCount: 20,
    refreshmentType: "Full Catering",
    items: ["Coffee", "Tea", "Breakfast", "Fruits"],
    specialRequests: "Gluten-free options needed",
    status: "ready",
    estimatedPrepTime: 60,
    priority: "high",
  },
]

export function RefreshmentManagement() {
  const [requests, setRequests] = useState<RefreshmentRequest[]>(mockRefreshmentRequests)
  const [activeTab, setActiveTab] = useState("today")

  const updateRequestStatus = (id: string, newStatus: RefreshmentRequest["status"]) => {
    setRequests(requests.map((req) => (req.id === id ? { ...req, status: newStatus } : req)))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "preparing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "ready":
        return "bg-green-100 text-green-800 border-green-200"
      case "served":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTimeUntilServing = (date: string, servingTime: string) => {
    const now = new Date()
    const servingDateTime = new Date(`${date}T${servingTime}`)
    const diffMs = servingDateTime.getTime() - now.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffMins < 0) return "Overdue"
    if (diffMins < 60) return `${diffMins}m`
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `${hours}h ${mins}m`
  }

  const todaysRequests = requests.filter((req) => req.date === "2024-12-10")
  const upcomingRequests = requests.filter((req) => req.date > "2024-12-10")
  const urgentRequests = requests.filter((req) => {
    const timeUntil = getTimeUntilServing(req.date, req.servingTime)
    return timeUntil !== "Overdue" && Number.parseInt(timeUntil) <= req.estimatedPrepTime && req.status === "pending"
  })

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Requests</CardTitle>
            <Coffee className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysRequests.length}</div>
            <p className="text-xs text-muted-foreground">Refreshment requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Urgent</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{urgentRequests.length}</div>
            <p className="text-xs text-muted-foreground">Need immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            <ChefHat className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {requests.filter((req) => req.status === "preparing").length}
            </div>
            <p className="text-xs text-muted-foreground">Currently preparing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ready to Serve</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {requests.filter((req) => req.status === "ready").length}
            </div>
            <p className="text-xs text-muted-foreground">Ready for delivery</p>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Alerts */}
      {urgentRequests.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              Urgent Refreshment Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {urgentRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200"
                >
                  <div>
                    <p className="font-medium text-red-900">{request.meetingTitle}</p>
                    <p className="text-sm text-red-700">
                      Serving in {getTimeUntilServing(request.date, request.servingTime)} • {request.place}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => updateRequestStatus(request.id, "preparing")}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Start Preparing
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="today">Today's Requests</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Refreshment Requests ({todaysRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todaysRequests.map((request) => (
                  <Card key={request.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{request.meetingTitle}</h3>
                            <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                            <Badge className={getPriorityColor(request.priority)}>{request.priority} priority</Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Serving: {request.servingTime} ({getTimeUntilServing(request.date, request.servingTime)})
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {request.place}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {request.participantCount} people
                            </div>
                          </div>

                          <div className="mb-3">
                            <p className="text-sm font-medium mb-1">Refreshment Details:</p>
                            <p className="text-sm text-muted-foreground mb-1">Type: {request.refreshmentType}</p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {request.items.map((item) => (
                                <Badge key={item} variant="outline" className="text-xs">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                            {request.specialRequests && (
                              <p className="text-sm text-orange-600">Special: {request.specialRequests}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Timer className="h-3 w-3" />
                            Estimated prep time: {request.estimatedPrepTime} minutes
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          {request.status === "pending" && (
                            <Button size="sm" onClick={() => updateRequestStatus(request.id, "preparing")}>
                              Start Preparing
                            </Button>
                          )}
                          {request.status === "preparing" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateRequestStatus(request.id, "ready")}
                            >
                              Mark Ready
                            </Button>
                          )}
                          {request.status === "ready" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => updateRequestStatus(request.id, "served")}
                            >
                              Mark Served
                            </Button>
                          )}
                          {request.status === "served" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateRequestStatus(request.id, "completed")}
                            >
                              Complete
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

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Upcoming Refreshment Requests ({upcomingRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingRequests.map((request) => (
                  <Card key={request.id} className="border-l-4 border-l-secondary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{request.meetingTitle}</h3>
                            <Badge className={getPriorityColor(request.priority)}>{request.priority} priority</Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {request.date}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Serving: {request.servingTime}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {request.place}
                            </div>
                          </div>

                          <div className="mb-3">
                            <p className="text-sm font-medium mb-1">
                              {request.refreshmentType} for {request.participantCount} people
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {request.items.map((item) => (
                                <Badge key={item} variant="outline" className="text-xs">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="h-5 w-5" />
                All Refreshment Requests ({requests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card key={request.id} className="border-l-4 border-l-muted">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{request.meetingTitle}</h3>
                            <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                            <Badge className={getPriorityColor(request.priority)}>{request.priority}</Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {request.date}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {request.servingTime}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {request.place}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {request.participantCount} people
                            </div>
                          </div>
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
    </div>
  )
}
