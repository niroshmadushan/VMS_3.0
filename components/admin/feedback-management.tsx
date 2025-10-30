"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Star, Search, MessageSquare, TrendingUp, Calendar } from "lucide-react"

interface Feedback {
  id: string
  visitorName: string
  visitorEmail: string
  bookingId: string
  meetingTitle: string
  rating: number
  category: "facility" | "service" | "technology" | "overall"
  comments: string
  submittedAt: string
  status: "new" | "reviewed" | "resolved"
}

const mockFeedback: Feedback[] = [
  {
    id: "1",
    visitorName: "John Smith",
    visitorEmail: "john.smith@example.com",
    bookingId: "BK-001",
    meetingTitle: "Project Review Meeting",
    rating: 5,
    category: "facility",
    comments: "Excellent meeting room facilities. Very clean and well-equipped.",
    submittedAt: "2024-01-15T10:30:00",
    status: "new",
  },
  {
    id: "2",
    visitorName: "Emily Davis",
    visitorEmail: "emily.davis@company.com",
    bookingId: "BK-002",
    meetingTitle: "Client Presentation",
    rating: 4,
    category: "technology",
    comments: "Good presentation setup, but the projector took a while to connect.",
    submittedAt: "2024-01-15T14:15:00",
    status: "reviewed",
  },
  {
    id: "3",
    visitorName: "Michael Johnson",
    visitorEmail: "michael.j@startup.com",
    bookingId: "BK-003",
    meetingTitle: "Partnership Discussion",
    rating: 5,
    category: "service",
    comments: "Outstanding service from the reception team. Very professional and helpful.",
    submittedAt: "2024-01-14T16:45:00",
    status: "resolved",
  },
]

export function FeedbackManagement() {
  const [feedback, setFeedback] = useState<Feedback[]>(mockFeedback)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const filteredFeedback = feedback.filter((item) => {
    const matchesSearch =
      item.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.meetingTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.comments.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || item.category === filterCategory
    const matchesStatus = filterStatus === "all" || item.status === filterStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const averageRating = feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length
  const totalFeedback = feedback.length
  const newFeedback = feedback.filter((item) => item.status === "new").length

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "reviewed":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "facility":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "service":
        return "bg-cyan-100 text-cyan-800 border-cyan-200"
      case "technology":
        return "bg-rose-100 text-rose-800 border-rose-200"
      case "overall":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Feedback Management</h1>
          <p className="text-muted-foreground">Monitor and manage visitor feedback</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-foreground">{averageRating.toFixed(1)}</p>
                  <div className="flex">{renderStars(Math.round(averageRating))}</div>
                </div>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Feedback</p>
                <p className="text-2xl font-bold text-foreground">{totalFeedback}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">New Feedback</p>
                <p className="text-2xl font-bold text-foreground">{newFeedback}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-foreground">18</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="facility">Facility</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="overall">Overall</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle>Visitor Feedback</CardTitle>
          <CardDescription>Review and manage visitor feedback submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredFeedback.map((item) => (
              <div key={item.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{item.visitorName}</h3>
                      <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                      <Badge className={getCategoryColor(item.category)}>{item.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.meetingTitle} • {item.visitorEmail}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex">{renderStars(item.rating)}</div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Mark Reviewed
                    </Button>
                    <Button variant="outline" size="sm">
                      Resolve
                    </Button>
                  </div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-foreground">{item.comments}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
