"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Settings, MapPin, Users } from "lucide-react"

interface Place {
  id: string
  name: string
  capacity: number
  type: string
  status: "available" | "maintenance" | "reserved"
}

const mockPlaces: Place[] = [
  { id: "1", name: "Conference Room A", capacity: 12, type: "Conference Room", status: "available" },
  { id: "2", name: "Meeting Room B", capacity: 6, type: "Meeting Room", status: "reserved" },
  { id: "3", name: "Board Room", capacity: 20, type: "Board Room", status: "available" },
  { id: "4", name: "Training Hall", capacity: 50, type: "Training Room", status: "maintenance" },
]

export function AdminAvailability() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [filterType, setFilterType] = useState<string>("all")

  const filteredPlaces = filterType === "all" ? mockPlaces : mockPlaces.filter((place) => place.type === filterType)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-200"
      case "reserved":
        return "bg-red-100 text-red-800 border-red-200"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Availability Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Select Date</Label>
              <Input id="date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Filter by Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Conference Room">Conference Rooms</SelectItem>
                  <SelectItem value="Meeting Room">Meeting Rooms</SelectItem>
                  <SelectItem value="Board Room">Board Rooms</SelectItem>
                  <SelectItem value="Training Room">Training Rooms</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Check All Availability
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Places Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {filteredPlaces.map((place) => (
              <div key={place.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">{place.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{place.type}</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {place.capacity} capacity
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(place.status)}>{place.status}</Badge>
                  <Button size="sm" variant="outline">
                    Manage
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
