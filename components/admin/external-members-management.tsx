"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Users, Plus, Search, Edit, Trash2, Building, Phone, Mail } from "lucide-react"

interface ExternalMember {
  id: string
  name: string
  email: string
  phone: string
  company: string
  position: string
  referenceType: "government_id" | "passport" | "driving_license" | "company_id"
  referenceValue: string
  category: "client" | "vendor" | "partner" | "consultant" | "other"
  status: "active" | "inactive" | "blocked"
  notes: string
  createdAt: string
  lastVisit?: string
  totalVisits: number
}

const mockMembers: ExternalMember[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "+1-555-0123",
    company: "ABC Corporation",
    position: "Project Manager",
    referenceType: "government_id",
    referenceValue: "ID123456789",
    category: "client",
    status: "active",
    notes: "Regular client for quarterly reviews",
    createdAt: "2024-01-10T09:00:00",
    lastVisit: "2024-01-15T14:30:00",
    totalVisits: 8,
  },
  {
    id: "2",
    name: "Emily Davis",
    email: "emily.davis@techsolutions.com",
    phone: "+1-555-0456",
    company: "Tech Solutions Ltd",
    position: "Senior Consultant",
    referenceType: "passport",
    referenceValue: "P987654321",
    category: "consultant",
    status: "active",
    notes: "IT consulting services provider",
    createdAt: "2024-01-08T11:15:00",
    lastVisit: "2024-01-14T10:00:00",
    totalVisits: 12,
  },
  {
    id: "3",
    name: "Michael Johnson",
    email: "michael.j@suppliers.com",
    phone: "+1-555-0789",
    company: "Global Suppliers Inc",
    position: "Sales Director",
    referenceType: "driving_license",
    referenceValue: "DL456789123",
    category: "vendor",
    status: "inactive",
    notes: "Seasonal supplier - active during Q4",
    createdAt: "2024-01-05T16:20:00",
    totalVisits: 3,
  },
]

export function ExternalMembersManagement() {
  const [members, setMembers] = useState<ExternalMember[]>(mockMembers)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || member.category === filterCategory
    const matchesStatus = filterStatus === "all" || member.status === filterStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "blocked":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "client":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "vendor":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "partner":
        return "bg-cyan-100 text-cyan-800 border-cyan-200"
      case "consultant":
        return "bg-rose-100 text-rose-800 border-rose-200"
      case "other":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">External Members Directory</h1>
          <p className="text-muted-foreground">Manage external contacts and visitor information</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add External Member</DialogTitle>
              <DialogDescription>Add a new external contact to the directory</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="member-name">Full Name</Label>
                <Input id="member-name" placeholder="Enter full name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-email">Email Address</Label>
                <Input id="member-email" type="email" placeholder="Enter email address" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-phone">Phone Number</Label>
                <Input id="member-phone" placeholder="Enter phone number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-company">Company</Label>
                <Input id="member-company" placeholder="Enter company name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-position">Position</Label>
                <Input id="member-position" placeholder="Enter job position" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-category">Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="consultant">Consultant</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference-type">Reference Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reference type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="government_id">Government ID</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="driving_license">Driving License</SelectItem>
                    <SelectItem value="company_id">Company ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference-value">Reference Value</Label>
                <Input id="reference-value" placeholder="Enter reference number" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="member-notes">Notes</Label>
                <Textarea id="member-notes" placeholder="Additional notes about this member" />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={() => setIsCreateDialogOpen(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                Add Member
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold text-foreground">{members.length}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Members</p>
                <p className="text-2xl font-bold text-foreground">
                  {members.filter((m) => m.status === "active").length}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Companies</p>
                <p className="text-2xl font-bold text-foreground">{new Set(members.map((m) => m.company)).size}</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent Visits</p>
                <p className="text-2xl font-bold text-foreground">
                  {
                    members.filter(
                      (m) => m.lastVisit && new Date(m.lastVisit) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    ).length
                  }
                </p>
              </div>
              <div className="h-8 w-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-cyan-600" />
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
                placeholder="Search members..."
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
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
                <SelectItem value="consultant">Consultant</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>External Members</CardTitle>
          <CardDescription>Manage external contacts and their information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{member.name}</h3>
                      <Badge className={getStatusColor(member.status)}>{member.status}</Badge>
                      <Badge className={getCategoryColor(member.category)}>{member.category}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {member.company} • {member.position}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {member.phone}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {member.totalVisits} visits • Last visit:{" "}
                      {member.lastVisit ? new Date(member.lastVisit).toLocaleDateString() : "Never"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
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
