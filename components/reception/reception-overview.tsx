"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserCheck, Clock, CreditCard, Calendar, Coffee, AlertTriangle } from "lucide-react"

const todaysStats = [
  {
    title: "Expected Visitors",
    value: "8",
    description: "Scheduled for today",
    icon: UserCheck,
    color: "text-primary",
  },
  {
    title: "Checked In",
    value: "5",
    description: "Already arrived",
    icon: Clock,
    color: "text-chart-1",
  },
  {
    title: "Passes Assigned",
    value: "5",
    description: "Currently active",
    icon: CreditCard,
    color: "text-secondary",
  },
  {
    title: "Today's Meetings",
    value: "6",
    description: "Total scheduled",
    icon: Calendar,
    color: "text-chart-2",
  },
]

const expectedVisitors = [
  {
    id: "1",
    name: "David Wilson",
    meetingId: "MTG001",
    place: "Conference Room A",
    time: "10:00 AM",
    status: "expected",
    phone: "+1234567890",
  },
  {
    id: "2",
    name: "Jane Smith",
    meetingId: "MTG002",
    place: "Board Room",
    time: "2:00 PM",
    status: "checked-in",
    phone: "+1234567891",
  },
  {
    id: "3",
    name: "Robert Brown",
    meetingId: "MTG002",
    place: "Board Room",
    time: "2:00 PM",
    status: "expected",
    phone: "+1234567892",
  },
]

const recentActivity = [
  {
    id: "1",
    action: "Visitor checked in",
    details: "Jane Smith - Board Room",
    time: "10 min ago",
    type: "check-in",
  },
  {
    id: "2",
    action: "Pass assigned",
    details: "Pass #12 to Jane Smith",
    time: "8 min ago",
    type: "pass",
  },
  {
    id: "3",
    action: "New booking created",
    details: "Client Meeting - Meeting Room B",
    time: "25 min ago",
    type: "booking",
  },
]

const refreshmentAlerts = [
  {
    id: "1",
    meetingTitle: "Weekly Team Meeting",
    servingTime: "10:15 AM",
    place: "Conference Room A",
    status: "preparing",
    timeUntil: "15m",
    priority: "medium",
  },
  {
    id: "2",
    meetingTitle: "Client Presentation",
    servingTime: "2:30 PM",
    place: "Board Room",
    status: "pending",
    timeUntil: "45m",
    priority: "high",
  },
]

export function ReceptionOverview() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {todaysStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {refreshmentAlerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Coffee className="h-5 w-5" />
              Refreshment Alerts
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                {refreshmentAlerts.length} active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {refreshmentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        alert.priority === "high"
                          ? "bg-red-500"
                          : alert.priority === "medium"
                            ? "bg-orange-500"
                            : "bg-green-500"
                      }`}
                    ></div>
                    <div>
                      <p className="font-medium text-orange-900">{alert.meetingTitle}</p>
                      <p className="text-sm text-orange-700">
                        Serve at {alert.servingTime} • {alert.place} • {alert.timeUntil} remaining
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        alert.status === "pending"
                          ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                          : alert.status === "preparing"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-green-100 text-green-800 border-green-200"
                      }
                    >
                      {alert.status}
                    </Badge>
                    {alert.priority === "high" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full bg-transparent" asChild>
                <a href="/reception/refreshments">View All Refreshment Requests</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Expected Visitors Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expectedVisitors.map((visitor) => (
                <div key={visitor.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{visitor.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {visitor.meetingId} • {visitor.place} • {visitor.time}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={visitor.status === "checked-in" ? "default" : "secondary"}>
                      {visitor.status === "checked-in" ? "Checked In" : "Expected"}
                    </Badge>
                    {visitor.status === "expected" && (
                      <Button size="sm" variant="outline">
                        Check In
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      activity.type === "check-in"
                        ? "bg-primary"
                        : activity.type === "pass"
                          ? "bg-secondary"
                          : "bg-chart-1"
                    }`}
                  ></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.details}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Button className="h-20 flex flex-col gap-2 bg-transparent" variant="outline">
              <UserCheck className="h-6 w-6" />
              <span className="text-sm">Check In Visitor</span>
            </Button>
            <Button className="h-20 flex flex-col gap-2 bg-transparent" variant="outline">
              <CreditCard className="h-6 w-6" />
              <span className="text-sm">Assign Pass</span>
            </Button>
            <Button className="h-20 flex flex-col gap-2 bg-transparent" variant="outline">
              <Calendar className="h-6 w-6" />
              <span className="text-sm">New Booking</span>
            </Button>
            <Button className="h-20 flex flex-col gap-2 bg-transparent" variant="outline">
              <Clock className="h-6 w-6" />
              <span className="text-sm">View Schedule</span>
            </Button>
            <Button className="h-20 flex flex-col gap-2 bg-transparent" variant="outline" asChild>
              <a href="/reception/refreshments">
                <Coffee className="h-6 w-6" />
                <span className="text-sm">Refreshments</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
