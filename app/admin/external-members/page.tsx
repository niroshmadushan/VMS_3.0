"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
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
  Users, Search, Plus, Edit, Trash2, AlertTriangle, Building2, Mail, Phone, 
  Calendar, ShieldAlert, CheckCircle, XCircle, TrendingUp, Eye, Activity,
  MapPin, Clock, BarChart3, Loader2
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

function ExternalMembersContent() {
  const [members, setMembers] = useState<ExternalMember[]>([])
  const [filteredMembers, setFilteredMembers] = useState<ExternalMember[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<ExternalMember | null>(null)
  const [isBlacklistDialogOpen, setIsBlacklistDialogOpen] = useState(false)
  const [blacklistMember, setBlacklistMember] = useState<ExternalMember | null>(null)
  const [blacklistReason, setBlacklistReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<ExternalMember | null>(null)

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

  const handleOpenDialog = (member?: ExternalMember) => {
    if (member) {
      setEditingMember(member)
      setFormData({
        full_name: member.full_name, email: member.email, phone: member.phone,
        company_name: member.company_name || "", designation: member.designation || "",
        reference_type: member.reference_type, reference_value: member.reference_value,
        address: member.address || "", city: member.city || "",
        country: member.country || "Sri Lanka", notes: member.notes || ""
      })
    } else {
      setEditingMember(null)
      setFormData({
        full_name: "", email: "", phone: "", company_name: "", designation: "",
        reference_type: "NIC", reference_value: "", address: "", city: "",
        country: "Sri Lanka", notes: ""
      })
    }
    setIsDialogOpen(true)
  }

  const checkDuplicate = async (email: string, phone: string, currentId?: string): Promise<boolean> => {
    // Check in loaded members first
    const duplicates = members.filter(m => {
      if (currentId && m.id === currentId) return false
      return (m.email.toLowerCase().trim() === email.toLowerCase().trim() || 
              m.phone.trim() === phone.trim())
    })
    
    if (duplicates.length > 0) {
      const dup = duplicates[0]
      toast.error(dup.email.toLowerCase().trim() === email.toLowerCase().trim() 
        ? `Email already exists: ${dup.full_name}` 
        : `Phone number already exists: ${dup.full_name}`, {
        position: 'top-center',
        duration: 4000
      })
      return true
    }
    
    // Also check against database for more accurate validation
    try {
      const response = await placeManagementAPI.getTableData('external_members', {
        is_deleted: 'false'
      })
      const allMembers = Array.isArray(response) ? response : response.data || []
      
      const dbDuplicate = allMembers.find((m: any) => {
        if (currentId && m.id === currentId) return false
        return (m.email?.toLowerCase().trim() === email.toLowerCase().trim() || 
                m.phone?.trim() === phone.trim())
      })
      
      if (dbDuplicate) {
        toast.error(dbDuplicate.email?.toLowerCase().trim() === email.toLowerCase().trim()
          ? `Email already exists in database: ${dbDuplicate.full_name}`
          : `Phone number already exists in database: ${dbDuplicate.full_name}`, {
          position: 'top-center',
          duration: 4000
        })
        return true
      }
    } catch (error) {
      console.error('Error checking duplicates in database:', error)
      // Continue with local check if database check fails
    }
    
    // Check company + email combination if company is provided
    if (formData.company_name && formData.company_name.trim()) {
      const companyDup = members.find(m => 
        m.company_name?.toLowerCase().trim() === formData.company_name.toLowerCase().trim() && 
        m.email?.toLowerCase().trim() === email.toLowerCase().trim() && 
        (!currentId || m.id !== currentId)
      )
      if (companyDup) {
        toast.error(`Email already exists for company ${formData.company_name}: ${companyDup.full_name}`, {
          position: 'top-center',
          duration: 4000
        })
        return true
      }
    }
    
    return false
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.full_name || !formData.full_name.trim()) {
      toast.error('Full name is required', { position: 'top-center' })
      return
    }
    if (!formData.email || !formData.email.trim()) {
      toast.error('Email is required', { position: 'top-center' })
      return
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email.trim())) {
      toast.error('Please enter a valid email address', { position: 'top-center' })
      return
    }
    if (!formData.phone || !formData.phone.trim()) {
      toast.error('Phone number is required', { position: 'top-center' })
      return
    }
    if (!formData.reference_value || !formData.reference_value.trim()) {
      toast.error('Reference value is required', { position: 'top-center' })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Check for duplicates
      const isDup = await checkDuplicate(formData.email.trim(), formData.phone.trim(), editingMember?.id)
      if (isDup) {
        setIsSubmitting(false)
        return
      }

      // Prepare data with trimmed values
      const data = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        company_name: formData.company_name?.trim() || null,
        designation: formData.designation?.trim() || null,
        reference_type: formData.reference_type,
        reference_value: formData.reference_value.trim(),
        address: formData.address?.trim() || null,
        city: formData.city?.trim() || null,
        country: formData.country?.trim() || 'Sri Lanka',
        notes: formData.notes?.trim() || null,
        is_active: editingMember?.is_active !== undefined ? editingMember.is_active : true,
        is_deleted: false,
        visit_count: editingMember?.visit_count || 0,
        is_blacklisted: editingMember?.is_blacklisted || false,
        blacklist_reason: editingMember?.blacklist_reason || null
      }
      
      if (editingMember) {
        // Update existing member
        await placeManagementAPI.updateRecord('external_members', { id: editingMember.id }, data)
        toast.success(`Member "${data.full_name}" updated successfully!`, {
          position: 'top-center',
          duration: 3000
        })
      } else {
        // Create new member
        const newId = crypto.randomUUID()
        await placeManagementAPI.insertRecord('external_members', { 
          id: newId, 
          ...data, 
          created_at: new Date().toISOString() 
        })
        toast.success(`Member "${data.full_name}" added successfully!`, {
          position: 'top-center',
          duration: 3000
        })
      }
      
      setIsDialogOpen(false)
      // Reset form
      setFormData({
        full_name: "", email: "", phone: "", company_name: "", designation: "",
        reference_type: "NIC", reference_value: "", address: "", city: "",
        country: "Sri Lanka", notes: ""
      })
      setEditingMember(null)
      // Reload members
      await loadMembers()
    } catch (error: any) {
      console.error('Error saving external member:', error)
      toast.error(error.message || 'Failed to save member. Please try again.', {
        position: 'top-center',
        duration: 4000
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = (member: ExternalMember) => {
    setMemberToDelete(member)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!memberToDelete) return
    
    try {
      setIsSubmitting(true)
      await placeManagementAPI.softDeleteRecord('external_members', memberToDelete.id)
      toast.success(`Member "${memberToDelete.full_name}" deleted successfully`, {
        position: 'top-center',
        duration: 3000,
        icon: '✅'
      })
      setIsDeleteDialogOpen(false)
      setMemberToDelete(null)
      await loadMembers()
    } catch (error: any) {
      console.error('Error deleting member:', error)
      toast.error(error.message || 'Failed to delete member. Please try again.', {
        position: 'top-center',
        duration: 4000,
        icon: '❌'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleBlacklist = (member: ExternalMember) => {
    setBlacklistMember(member)
    setBlacklistReason(member.blacklist_reason || "")
    setIsBlacklistDialogOpen(true)
  }

  const confirmBlacklist = async () => {
    if (!blacklistMember) return

    const isBlacklisting = !blacklistMember.is_blacklisted

    if (isBlacklisting && !blacklistReason.trim()) {
      toast.error('Please provide a blacklist reason')
      return
    }

    try {
      await placeManagementAPI.updateRecord('external_members', { id: blacklistMember.id }, {
        is_blacklisted: isBlacklisting,
        blacklist_reason: isBlacklisting ? blacklistReason : null
      })
      toast.success(isBlacklisting ? 'Member blacklisted' : 'Member unblocked')
      setIsBlacklistDialogOpen(false)
      setBlacklistReason("")
      loadMembers()
    } catch (error: any) {
      toast.error('Failed')
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
    <Tabs defaultValue="members" className="space-y-3">
      {/* Premium Header: Search, Filters, Analytics Tab, Members Tab, Add Button in One Line */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-2 pb-3 border-b border-border/50">
        {/* Search Bar */}
        <div className="flex-1 min-w-0 relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            placeholder="Search by name, email, phone, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-[13px] border-border/50 focus:border-primary/50 shadow-sm"
          />
        </div>

        {/* Status Filter */}
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full lg:w-[140px] h-9 border-border/50 shadow-sm text-[13px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="blacklisted">Blacklisted</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Tabs - Analytics and Members */}
        <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted/50 p-1 border border-border/50 shadow-sm">
          <TabsTrigger 
            value="analytics" 
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary px-3 text-[13px]"
          >
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
          <TabsTrigger 
            value="members" 
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary px-3 text-[13px]"
          >
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Members
          </TabsTrigger>
        </TabsList>

        {/* Add Member Button */}
        <Button 
          onClick={() => handleOpenDialog()} 
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all h-9 whitespace-nowrap font-semibold text-[13px]"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          <span className="hidden sm:inline">Add Member</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      <TabsContent value="analytics" className="space-y-3">
        {/* Compact Statistics Table */}
        <Card className="border border-border/50 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <tbody>
                  <tr className="hover:bg-transparent border-b">
                    <td className="py-2.5 px-4 font-medium">
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-blue-600" />
                        <span>Total Members</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="text-lg font-bold text-blue-600">{members.length}</span>
                    </td>
                    <td className="py-2.5 px-4 font-medium">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                        <span>Active</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="text-lg font-bold text-green-600">{activeCount}</span>
                    </td>
                    <td className="py-2.5 px-4 font-medium">
                      <div className="flex items-center gap-2">
                        <Activity className="h-3.5 w-3.5 text-purple-600" />
                        <span>Total Visits</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="text-lg font-bold text-purple-600">{totalVisits}</span>
                    </td>
                    <td className="py-2.5 px-4 font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-orange-600" />
                        <span>Companies</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="text-lg font-bold text-orange-600">{companiesCount}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="pb-2.5 border-b border-border/50">
            <CardTitle className="flex items-center gap-2 text-[13px] font-semibold">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              Top 5 Frequent Visitors
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="space-y-2">
              {topVisitors.length > 0 ? (
                topVisitors.map((member, idx) => (
                  <div key={member.id} className="flex items-center gap-3 p-2.5 bg-muted/20 border border-border/30 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white font-bold rounded-lg flex-shrink-0 text-[11px]">
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[13px] text-foreground">{member.full_name}</p>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{member.email} • {member.company_name || 'No company'}</p>
                    </div>
                    <Badge className="bg-purple-600 text-white px-2.5 py-1 flex-shrink-0 text-[11px] border-0">
                      <Calendar className="h-3 w-3 mr-1" />
                      {member.visit_count} visits
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-[13px]">No visitor data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {blacklistedCount > 0 && (
          <Card className="border border-red-300 bg-red-50/50 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-600 rounded-lg">
                  <ShieldAlert className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-red-900 text-[13px]">
                    {blacklistedCount} Blacklisted Member{blacklistedCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-[11px] text-red-700 mt-0.5">Review blacklisted members in the Members tab</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="members" className="space-y-3">
        {/* Compact Statistics Table */}
        <Card className="border border-border/50 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <tbody>
                  <tr className="hover:bg-transparent border-b">
                    <td className="py-2.5 px-4 font-medium">
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-blue-600" />
                        <span>Total Members</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="text-lg font-bold text-blue-600">{members.length}</span>
                    </td>
                    <td className="py-2.5 px-4 font-medium">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                        <span>Active</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="text-lg font-bold text-green-600">{activeCount}</span>
                    </td>
                    <td className="py-2.5 px-4 font-medium">
                      <div className="flex items-center gap-2">
                        <Activity className="h-3.5 w-3.5 text-purple-600" />
                        <span>Total Visits</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="text-lg font-bold text-purple-600">{totalVisits}</span>
                    </td>
                    <td className="py-2.5 px-4 font-medium">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
                        <span>Blacklisted</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="text-lg font-bold text-red-600">{blacklistedCount}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="pb-2.5 border-b border-border/50">
            <CardTitle className="flex items-center gap-2 text-[13px] font-semibold">
              <Users className="h-4 w-4" />
              Members Directory ({filteredMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-[13px] text-muted-foreground">Loading members...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-[13px]">No members found matching your criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border/50">
                      <th className="text-left p-2.5 font-semibold text-foreground min-w-[180px]">Name</th>
                      <th className="text-left p-2.5 font-semibold text-foreground min-w-[180px]">Contact</th>
                      <th className="text-left p-2.5 font-semibold text-foreground min-w-[140px]">Company</th>
                      <th className="text-center p-2.5 font-semibold text-foreground min-w-[90px]">Visits</th>
                      <th className="text-center p-2.5 font-semibold text-foreground min-w-[110px]">Status</th>
                      <th className="text-center p-2.5 font-semibold text-foreground min-w-[160px]">Actions</th>
                    </tr>
                  </thead>
                </table>
                <div className="max-h-[calc(5*48px)] overflow-y-auto table-scroll-container-vertical">
                  <table className="w-full text-[13px]">
                    <tbody>
                      {filteredMembers.map((m) => (
                        <tr key={m.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                          <td className="p-2.5 min-w-[180px]">
                            <p className="font-semibold text-[13px] text-foreground">{m.full_name}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{m.designation || 'No designation'}</p>
                          </td>
                          <td className="p-2.5 min-w-[180px]">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="text-[13px]">{m.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="text-[13px]">{m.phone}</span>
                            </div>
                          </td>
                          <td className="p-2.5 min-w-[140px]">
                            {m.company_name ? (
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <span className="text-[13px]">{m.company_name}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-[13px]">No company</span>
                            )}
                          </td>
                          <td className="p-2.5 text-center min-w-[90px]">
                            <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700 text-[11px] px-2 py-0.5">
                              <Calendar className="h-3 w-3 mr-1" />
                              {m.visit_count}
                            </Badge>
                          </td>
                          <td className="p-2.5 text-center min-w-[110px]">
                            {m.is_blacklisted ? (
                              <Badge variant="destructive" className="text-[11px] px-2 py-0.5">
                                <ShieldAlert className="h-3 w-3 mr-1" />Blacklisted
                              </Badge>
                            ) : m.is_active ? (
                              <Badge className="bg-green-500 text-white text-[11px] px-2 py-0.5 border-0">
                                <CheckCircle className="h-3 w-3 mr-1" />Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[11px] px-2 py-0.5">Inactive</Badge>
                            )}
                          </td>
                          <td className="p-2.5 min-w-[160px]">
                            <div className="flex gap-1 justify-center">
                              <Button size="sm" variant="ghost" onClick={() => {
                                window.location.href = `/admin/external-members/${m.id}`;
                              }} title="View Full Profile" className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(m)} title="Edit" className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary">
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleToggleBlacklist(m)} title={m.is_blacklisted ? "Unblock" : "Blacklist"} className={`h-7 w-7 p-0 ${m.is_blacklisted ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}>
                                {m.is_blacklisted ? <CheckCircle className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDelete(m)} title="Delete" className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    {/* Add/Edit Member Dialog */}
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editingMember ? 'Edit' : 'Add'} Member</DialogTitle></DialogHeader>
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
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsDialogOpen(false)
                setEditingMember(null)
                setFormData({
                  full_name: "", email: "", phone: "", company_name: "", designation: "",
                  reference_type: "NIC", reference_value: "", address: "", city: "",
                  country: "Sri Lanka", notes: ""
                })
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingMember ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingMember ? 'Update Member' : 'Create Member'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Blacklist Confirmation Dialog */}
    <Dialog open={isBlacklistDialogOpen} onOpenChange={setIsBlacklistDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-900">
            <div className="p-2 bg-orange-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            {blacklistMember?.is_blacklisted ? 'Unblock Member' : 'Blacklist Member'}
          </DialogTitle>
        </DialogHeader>
        
        {blacklistMember && (
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm font-medium text-orange-900 mb-2">
                {blacklistMember.is_blacklisted ? 
                  'Are you sure you want to unblock this member?' :
                  'Are you sure you want to blacklist this member?'
                }
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-bold">{blacklistMember.full_name}</span>
                <br />
                {blacklistMember.email} • {blacklistMember.company_name || 'No company'}
              </p>
            </div>

            {!blacklistMember.is_blacklisted && (
              <div className="space-y-2">
                <Label className="text-red-900 font-semibold">Blacklist Reason *</Label>
                <Textarea
                  value={blacklistReason}
                  onChange={(e) => setBlacklistReason(e.target.value)}
                  placeholder="Enter the reason for blacklisting this member..."
                  rows={3}
                  className="border-red-300 focus:border-red-500"
                  required
                />
                <p className="text-xs text-red-600">
                  ⚠️ This member will be blocked from all future bookings
                </p>
              </div>
            )}

            {blacklistMember.is_blacklisted && blacklistMember.blacklist_reason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600 font-semibold mb-1">Current Reason:</p>
                <p className="text-sm text-red-900">{blacklistMember.blacklist_reason}</p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsBlacklistDialogOpen(false)
                  setBlacklistReason("")
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmBlacklist}
                variant={blacklistMember.is_blacklisted ? "default" : "destructive"}
                className={blacklistMember.is_blacklisted ? "" : "bg-red-600 hover:bg-red-700"}
              >
                {blacklistMember.is_blacklisted ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Unblock Member
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-4 w-4 mr-2" />
                    Confirm Blacklist
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-900">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            Delete Member
          </DialogTitle>
        </DialogHeader>
        
        {memberToDelete && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-900 mb-2">
                Are you sure you want to delete this member?
              </p>
              <p className="text-xs text-red-700 mb-3">
                This action will permanently remove the member from the system. This action cannot be undone.
              </p>
              <div className="mt-3 pt-3 border-t border-red-200">
                <p className="text-sm font-medium text-red-900 mb-1">Member Details:</p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">{memberToDelete.full_name}</span>
                  <br />
                  {memberToDelete.email}
                  {memberToDelete.company_name && (
                    <>
                      <br />
                      {memberToDelete.company_name}
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setMemberToDelete(null)
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmDelete}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Member
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  )
}

import { RouteProtection } from "@/components/auth/route-protection"

export default function ExternalMembersPage() {
  return (
    <RouteProtection requiredRole="admin">
      <DashboardLayout title="External Members" subtitle="Manage external visitors and participants">
        <ExternalMembersContent />
      </DashboardLayout>
    </RouteProtection>
  )
}

