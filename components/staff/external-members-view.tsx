"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, Search, Plus, Building2, Mail, Phone, 
  Calendar, ShieldAlert, CheckCircle, TrendingUp, Activity
} from "lucide-react"
import { placeManagementAPI } from "@/lib/place-management-api"
import toast from "react-hot-toast"

interface ExternalMember {
  id: string
  full_name: string
  email: string
  phone: string
  company_name?: string
  designation?: string
  reference_type: string
  reference_value: string
  address?: string
  city?: string
  country?: string
  notes?: string
  is_blacklisted: boolean
  blacklist_reason?: string
  visit_count: number
  last_visit_date?: string
  is_active: boolean
  created_at: string
}

export function StaffExternalMembersView() {
  const [members, setMembers] = useState<ExternalMember[]>([])
  const [filteredMembers, setFilteredMembers] = useState<ExternalMember[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    full_name: "", email: "", phone: "", company_name: "", designation: "",
    reference_type: "NIC", reference_value: "", address: "", city: "",
    country: "Sri Lanka", notes: ""
  })

  useEffect(() => { loadMembers() }, [])
  useEffect(() => { filterMembers() }, [members, searchTerm, filterStatus])

  const loadMembers = async () => {
    try {
      setIsLoading(true)
      const response = await placeManagementAPI.getTableData('external_members', { limit: 500 })
      const data = Array.isArray(response) ? response.filter((m: any) => !m.is_deleted) : []
      setMembers(data)
    } catch (error) {
      toast.error('Failed to load members')
    } finally {
      setIsLoading(false)
    }
  }

  const filterMembers = () => {
    let filtered = [...members]
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(m =>
        m.full_name?.toLowerCase().includes(search) ||
        m.email?.toLowerCase().includes(search) ||
        m.phone?.includes(search) ||
        m.company_name?.toLowerCase().includes(search)
      )
    }
    if (filterStatus !== "all") {
      if (filterStatus === "active") filtered = filtered.filter(m => m.is_active && !m.is_blacklisted)
      else if (filterStatus === "blacklisted") filtered = filtered.filter(m => m.is_blacklisted)
      else if (filterStatus === "inactive") filtered = filtered.filter(m => !m.is_active)
    }
    setFilteredMembers(filtered)
  }

  const handleOpenDialog = () => {
    setFormData({
      full_name: "", email: "", phone: "", company_name: "", designation: "",
      reference_type: "NIC", reference_value: "", address: "", city: "",
      country: "Sri Lanka", notes: ""
    })
    setIsDialogOpen(true)
  }

  const checkDuplicate = async (email: string, phone: string): Promise<boolean> => {
    const duplicates = members.filter(m => m.email === email || m.phone === phone)
    if (duplicates.length > 0) {
      const dup = duplicates[0]
      toast.error(dup.email === email ? `Email exists: ${dup.full_name}` : `Phone exists: ${dup.full_name}`)
      return true
    }
    return false
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.full_name || !formData.email || !formData.phone || !formData.reference_value) {
      toast.error('Fill required fields')
      return
    }
    const isDup = await checkDuplicate(formData.email, formData.phone)
    if (isDup) return

    try {
      const data = { ...formData, is_active: true, is_deleted: false, visit_count: 0 }
      await placeManagementAPI.insertRecord('external_members', { 
        id: crypto.randomUUID(), 
        ...data, 
        created_at: new Date().toISOString() 
      })
      toast.success('Member added successfully')
      setIsDialogOpen(false)
      loadMembers()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add member')
    }
  }

  const activeCount = members.filter(m => m.is_active && !m.is_blacklisted).length
  const blacklistedCount = members.filter(m => m.is_blacklisted).length
  const totalVisits = members.reduce((sum, m) => sum + (m.visit_count || 0), 0)
  const avgVisits = members.length > 0 ? (totalVisits / members.length).toFixed(1) : 0

  const topVisitors = [...members]
    .sort((a, b) => (b.visit_count || 0) - (a.visit_count || 0))
    .slice(0, 5)

  const companiesCount = new Set(members.filter(m => m.company_name).map(m => m.company_name)).size

  return (
    <>
    <Tabs defaultValue="analytics" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 max-w-md">
        <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
        <TabsTrigger value="members">👥 Members</TabsTrigger>
      </TabsList>

      <TabsContent value="analytics" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Members</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{members.length}</p>
                  <p className="text-xs text-blue-600 mt-1">All records</p>
                </div>
                <div className="p-3 bg-blue-500 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Active</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">{activeCount}</p>
                  <p className="text-xs text-green-600 mt-1">{((activeCount/members.length)*100).toFixed(0)}% of total</p>
                </div>
                <div className="p-3 bg-green-500 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Total Visits</p>
                  <p className="text-3xl font-bold text-purple-900 mt-1">{totalVisits}</p>
                  <p className="text-xs text-purple-600 mt-1">Avg: {avgVisits} per member</p>
                </div>
                <div className="p-3 bg-purple-500 rounded-lg">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Companies</p>
                  <p className="text-3xl font-bold text-orange-900 mt-1">{companiesCount}</p>
                  <p className="text-xs text-orange-600 mt-1">Organizations</p>
                </div>
                <div className="p-3 bg-orange-500 rounded-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Top 5 Frequent Visitors
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {topVisitors.map((member, idx) => (
                <div key={member.id} className="flex items-center gap-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-center w-10 h-10 bg-purple-500 text-white font-bold rounded-full">
                    #{idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-base">{member.full_name}</p>
                    <p className="text-sm text-muted-foreground">{member.email} • {member.company_name || 'No company'}</p>
                  </div>
                  <Badge className="bg-purple-600 text-white text-lg px-4 py-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    {member.visit_count} visits
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {blacklistedCount > 0 && (
          <Card className="border-2 border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-8 w-8 text-red-600" />
                <div>
                  <p className="font-bold text-red-900">⚠️ {blacklistedCount} Blacklisted Member{blacklistedCount > 1 ? 's' : ''}</p>
                  <p className="text-sm text-red-700">These members are blocked (admin only can unblock)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="members" className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="blacklisted">Blacklisted</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleOpenDialog} className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Plus className="h-4 w-4 mr-2" />Add Member
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle>Members Directory ({filteredMembers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <div className="text-center py-8">Loading...</div> : 
             filteredMembers.length === 0 ? <div className="text-center py-8">No members</div> :
             <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                  <tr>
                    <th className="text-left p-3 font-semibold">Name</th>
                    <th className="text-left p-3 font-semibold">Contact</th>
                    <th className="text-left p-3 font-semibold">Company</th>
                    <th className="text-center p-3 font-semibold">Visits</th>
                    <th className="text-center p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="border-t hover:bg-muted/50 transition-colors">
                      <td className="p-3">
                        <p className="font-bold">{m.full_name}</p>
                        <p className="text-xs text-muted-foreground">{m.designation || 'No designation'}</p>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{m.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{m.phone}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        {m.company_name ? (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span>{m.company_name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">No company</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className="bg-purple-50">
                          <Calendar className="h-3 w-3 mr-1" />
                          {m.visit_count}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        {m.is_blacklisted ? (
                          <Badge variant="destructive" className="text-xs">
                            <ShieldAlert className="h-3 w-3 mr-1" />Blacklisted
                          </Badge>
                        ) : m.is_active ? (
                          <Badge className="bg-green-500 text-white text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    {/* Add Member Dialog */}
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add New Member</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Full Name *</Label><Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} required /></div>
            <div><Label>Email *</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Phone *</Label><Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+94771234567" required /></div>
            <div><Label>Company</Label><Input value={formData.company_name} onChange={(e) => setFormData({...formData, company_name: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Designation</Label><Input value={formData.designation} onChange={(e) => setFormData({...formData, designation: e.target.value})} /></div>
            <div><Label>Reference Type *</Label>
              <Select value={formData.reference_type} onValueChange={(v) => setFormData({...formData, reference_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NIC">NIC</SelectItem>
                  <SelectItem value="Passport">Passport</SelectItem>
                  <SelectItem value="Driving License">Driving License</SelectItem>
                  <SelectItem value="Employee ID">Employee ID</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Reference Value *</Label><Input value={formData.reference_value} onChange={(e) => setFormData({...formData, reference_value: e.target.value})} placeholder="NIC: 199012345678" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>City</Label><Input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} /></div>
            <div><Label>Country</Label><Input value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} /></div>
          </div>
          <div><Label>Address</Label><Textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} rows={2} /></div>
          <div><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={2} /></div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button type="submit">Add Member</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}



