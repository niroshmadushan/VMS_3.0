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
  Users, Search, Plus, Edit, Trash2, AlertTriangle, Building2, Mail, Phone, 
  Calendar, ShieldAlert, CheckCircle, XCircle, TrendingUp, Eye, Activity,
  BarChart3, Loader2
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
  const [isBlacklistDialogOpen, setIsBlacklistDialogOpen] = useState(false)
  const [blacklistMember, setBlacklistMember] = useState<ExternalMember | null>(null)
  const [blacklistReason, setBlacklistReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      // Silent fail - continue with local check if database check fails
    }
    
    // Check company + email combination if company is provided
    if (formData.company_name && formData.company_name.trim()) {
      const companyDup = members.find(m => 
        m.company_name?.toLowerCase().trim() === formData.company_name.toLowerCase().trim() && 
        m.email?.toLowerCase().trim() === email.toLowerCase().trim()
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
      const isDup = await checkDuplicate(formData.email.trim(), formData.phone.trim())
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
        is_active: true,
        is_deleted: false,
        visit_count: 0,
        is_blacklisted: false,
        blacklist_reason: null
      }
      
      // Create new member (staff can only add, not edit)
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
      
      setIsDialogOpen(false)
      // Reset form
      setFormData({
        full_name: "", email: "", phone: "", company_name: "", designation: "",
        reference_type: "NIC", reference_value: "", address: "", city: "",
        country: "Sri Lanka", notes: ""
      })
      // Reload members
      await loadMembers()
    } catch (error: any) {
      toast.error('Failed to save member. Please try again.', {
        position: 'top-center',
        duration: 4000
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
    <div className="space-y-3 px-2 sm:px-4 max-w-[98vw] mx-auto dark:bg-background">
      <Tabs defaultValue="members" className="space-y-3">
        {/* Premium Header: Search, Filters, Analytics Tab, Members Tab, Add Button in One Line */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-2 pb-3 border-b border-border/50 dark:border-border">
        {/* Search Bar */}
        <div className="flex-1 min-w-0 relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-muted-foreground z-10" />
          <Input
            placeholder="Search by name, email, phone, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-[13px] border-border/50 dark:border-border focus:border-primary/50 dark:focus:border-primary/30 shadow-sm dark:bg-card dark:text-foreground"
          />
        </div>

        {/* Status Filter */}
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full lg:w-[140px] h-9 border-border/50 dark:border-border shadow-sm text-[13px] dark:bg-card dark:text-foreground">
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
        <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted/50 dark:bg-muted p-1 border border-border/50 dark:border-border shadow-sm">
          <TabsTrigger 
            value="analytics" 
            className="data-[state=active]:bg-background dark:data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary dark:data-[state=active]:text-primary px-3 text-[13px]"
          >
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
          <TabsTrigger 
            value="members" 
            className="data-[state=active]:bg-background dark:data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary dark:data-[state=active]:text-primary px-3 text-[13px]"
          >
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Members
          </TabsTrigger>
        </TabsList>

        {/* Add Member Button */}
        <Button 
          onClick={handleOpenDialog} 
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600 shadow-md hover:shadow-lg transition-all h-9 whitespace-nowrap font-semibold text-[13px]"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          <span className="hidden sm:inline">Add Member</span>
          <span className="sm:hidden">Add</span>
        </Button>
        </div>

        <TabsContent value="analytics" className="space-y-3">
        {/* Compact Statistics Table */}
        <Card className="border border-border/50 dark:border-border shadow-sm dark:bg-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <tbody>
                  <tr className="hover:bg-transparent border-b dark:border-border">
                    <td className="py-2.5 px-4 font-medium dark:text-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Total Members</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{members.length}</span>
                    </td>
                    <td className="py-2.5 px-4 font-medium dark:text-foreground">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        <span>Active</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">{activeCount}</span>
                    </td>
                    <td className="py-2.5 px-4 font-medium dark:text-foreground">
                      <div className="flex items-center gap-2">
                        <Activity className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Total Visits</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{totalVisits}</span>
                    </td>
                    <td className="py-2.5 px-4 font-medium dark:text-foreground">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                        <span>Companies</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{companiesCount}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 dark:border-border shadow-sm dark:bg-card">
          <CardHeader className="pb-2.5 border-b border-border/50 dark:border-border">
            <CardTitle className="flex items-center gap-2 text-[13px] font-semibold dark:text-foreground">
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              Top 5 Frequent Visitors
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 dark:bg-card">
            <div className="space-y-2">
              {topVisitors.length > 0 ? (
                topVisitors.map((member, idx) => (
                  <div key={member.id} className="flex items-center gap-3 p-2.5 bg-muted/20 dark:bg-muted/30 border border-border/30 dark:border-border rounded-lg hover:bg-muted/30 dark:hover:bg-muted/40 transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-600 dark:bg-purple-600 text-white font-bold rounded-lg flex-shrink-0 text-[11px]">
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[13px] text-foreground dark:text-foreground">{member.full_name}</p>
                      <p className="text-[11px] text-muted-foreground dark:text-muted-foreground truncate mt-0.5">{member.email} • {member.company_name || 'No company'}</p>
                    </div>
                    <Badge className="bg-purple-600 dark:bg-purple-600 text-white px-2.5 py-1 flex-shrink-0 text-[11px] border-0">
                      <Calendar className="h-3 w-3 mr-1" />
                      {member.visit_count} visits
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground dark:text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-[13px]">No visitor data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {blacklistedCount > 0 && (
          <Card className="border border-red-300 dark:border-red-600 bg-red-50/50 dark:bg-red-950/20 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-600 dark:bg-red-600 rounded-lg">
                  <ShieldAlert className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-red-900 dark:text-red-400 text-[13px]">
                    {blacklistedCount} Blacklisted Member{blacklistedCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-[11px] text-red-700 dark:text-red-400 mt-0.5">Review blacklisted members in the Members tab</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        </TabsContent>

        <TabsContent value="members" className="space-y-3">
        {/* Compact Statistics Table */}
        <Card className="border border-border/50 dark:border-border shadow-sm dark:bg-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <tbody>
                  <tr className="hover:bg-transparent border-b dark:border-border">
                    <td className="py-2.5 px-4 font-medium dark:text-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Total Members</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{members.length}</span>
                    </td>
                    <td className="py-2.5 px-4 font-medium dark:text-foreground">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        <span>Active</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">{activeCount}</span>
                    </td>
                    <td className="py-2.5 px-4 font-medium dark:text-foreground">
                      <div className="flex items-center gap-2">
                        <Activity className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Total Visits</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{totalVisits}</span>
                    </td>
                    <td className="py-2.5 px-4 font-medium dark:text-foreground">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                        <span>Blacklisted</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="text-lg font-bold text-red-600 dark:text-red-400">{blacklistedCount}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 dark:border-border shadow-sm dark:bg-card">
          <CardHeader className="pb-2.5 border-b border-border/50 dark:border-border">
            <CardTitle className="flex items-center gap-2 text-[13px] font-semibold dark:text-foreground">
              <Users className="h-4 w-4" />
              Members Directory ({filteredMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 dark:bg-card">
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary dark:text-primary" />
                <p className="text-[13px] text-muted-foreground dark:text-muted-foreground">Loading members...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground dark:text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-[13px]">No members found matching your criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-muted/50 dark:bg-muted/30 border-b border-border/50 dark:border-border">
                      <th className="text-left p-2.5 font-semibold text-foreground dark:text-foreground min-w-[180px]">Name</th>
                      <th className="text-left p-2.5 font-semibold text-foreground dark:text-foreground min-w-[180px]">Contact</th>
                      <th className="text-left p-2.5 font-semibold text-foreground dark:text-foreground min-w-[140px]">Company</th>
                      <th className="text-center p-2.5 font-semibold text-foreground dark:text-foreground min-w-[90px]">Visits</th>
                      <th className="text-center p-2.5 font-semibold text-foreground dark:text-foreground min-w-[110px]">Status</th>
                      <th className="text-center p-2.5 font-semibold text-foreground dark:text-foreground min-w-[120px]">Actions</th>
                    </tr>
                  </thead>
                </table>
                <div className="max-h-[calc(5*48px)] overflow-y-auto table-scroll-container-vertical">
                  <table className="w-full text-[13px]">
                    <tbody>
                      {filteredMembers.map((m) => (
                        <tr key={m.id} className="border-b border-border/30 dark:border-border hover:bg-muted/20 dark:hover:bg-muted/30 transition-colors">
                          <td className="p-2.5 min-w-[180px]">
                            <p className="font-semibold text-[13px] text-foreground dark:text-foreground">{m.full_name}</p>
                            <p className="text-[11px] text-muted-foreground dark:text-muted-foreground mt-0.5">{m.designation || 'No designation'}</p>
                          </td>
                          <td className="p-2.5 min-w-[180px]">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Mail className="h-3 w-3 text-muted-foreground dark:text-muted-foreground flex-shrink-0" />
                              <span className="text-[13px] dark:text-foreground">{m.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3 text-muted-foreground dark:text-muted-foreground flex-shrink-0" />
                              <span className="text-[13px] dark:text-foreground">{m.phone}</span>
                            </div>
                          </td>
                          <td className="p-2.5 min-w-[140px]">
                            {m.company_name ? (
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-3 w-3 text-muted-foreground dark:text-muted-foreground flex-shrink-0" />
                                <span className="text-[13px] dark:text-foreground">{m.company_name}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground dark:text-muted-foreground text-[13px]">No company</span>
                            )}
                          </td>
                          <td className="p-2.5 text-center min-w-[90px]">
                            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 text-[11px] px-2 py-0.5">
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
                              <Badge className="bg-green-500 dark:bg-green-600 text-white text-[11px] px-2 py-0.5 border-0">
                                <CheckCircle className="h-3 w-3 mr-1" />Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[11px] px-2 py-0.5 dark:border-border dark:text-foreground">Inactive</Badge>
                            )}
                          </td>
                          <td className="p-2.5 min-w-[120px]">
                            <div className="flex gap-1 justify-center">
                              <Button size="sm" variant="ghost" onClick={() => {
                                window.location.href = `/admin/external-members/${m.id}`;
                              }} title="View Full Profile" className="h-7 w-7 p-0 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleToggleBlacklist(m)} title={m.is_blacklisted ? "Unblock" : "Blacklist"} className={`h-7 w-7 p-0 ${m.is_blacklisted ? 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/20' : 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20'}`}>
                                {m.is_blacklisted ? <CheckCircle className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
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

      {/* Add Member Dialog */}
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-card dark:border-border">
        <DialogHeader className="dark:border-border/50">
          <DialogTitle className="dark:text-foreground text-[13px] font-semibold">Add New Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 dark:bg-card">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[13px] dark:text-foreground">Full Name *</Label>
              <Input 
                value={formData.full_name} 
                onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
                required 
                className="h-9 text-[13px] dark:bg-card dark:border-border dark:text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] dark:text-foreground">Email *</Label>
              <Input 
                type="email" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                required 
                className="h-9 text-[13px] dark:bg-card dark:border-border dark:text-foreground"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[13px] dark:text-foreground">Phone *</Label>
              <Input 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                placeholder="+94771234567" 
                required 
                className="h-9 text-[13px] dark:bg-card dark:border-border dark:text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] dark:text-foreground">Company</Label>
              <Input 
                value={formData.company_name} 
                onChange={(e) => setFormData({...formData, company_name: e.target.value})} 
                className="h-9 text-[13px] dark:bg-card dark:border-border dark:text-foreground"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[13px] dark:text-foreground">Designation</Label>
              <Input 
                value={formData.designation} 
                onChange={(e) => setFormData({...formData, designation: e.target.value})} 
                className="h-9 text-[13px] dark:bg-card dark:border-border dark:text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] dark:text-foreground">Reference Type *</Label>
              <Select value={formData.reference_type} onValueChange={(v) => setFormData({...formData, reference_type: v})}>
                <SelectTrigger className="h-9 text-[13px] dark:bg-card dark:border-border dark:text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-card dark:border-border">
                  <SelectItem value="NIC" className="dark:text-foreground">NIC</SelectItem>
                  <SelectItem value="Passport" className="dark:text-foreground">Passport</SelectItem>
                  <SelectItem value="Driving License" className="dark:text-foreground">Driving License</SelectItem>
                  <SelectItem value="Employee ID" className="dark:text-foreground">Employee ID</SelectItem>
                  <SelectItem value="Other" className="dark:text-foreground">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] dark:text-foreground">Reference Value *</Label>
            <Input 
              value={formData.reference_value} 
              onChange={(e) => setFormData({...formData, reference_value: e.target.value})} 
              placeholder="NIC: 199012345678" 
              required 
              className="h-9 text-[13px] dark:bg-card dark:border-border dark:text-foreground"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[13px] dark:text-foreground">City</Label>
              <Input 
                value={formData.city} 
                onChange={(e) => setFormData({...formData, city: e.target.value})} 
                className="h-9 text-[13px] dark:bg-card dark:border-border dark:text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] dark:text-foreground">Country</Label>
              <Input 
                value={formData.country} 
                onChange={(e) => setFormData({...formData, country: e.target.value})} 
                className="h-9 text-[13px] dark:bg-card dark:border-border dark:text-foreground"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] dark:text-foreground">Address</Label>
            <Textarea 
              value={formData.address} 
              onChange={(e) => setFormData({...formData, address: e.target.value})} 
              rows={2} 
              className="text-[13px] dark:bg-card dark:border-border dark:text-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] dark:text-foreground">Notes</Label>
            <Textarea 
              value={formData.notes} 
              onChange={(e) => setFormData({...formData, notes: e.target.value})} 
              rows={2} 
              className="text-[13px] dark:bg-card dark:border-border dark:text-foreground"
            />
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t dark:border-border">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsDialogOpen(false)
                setFormData({
                  full_name: "", email: "", phone: "", company_name: "", designation: "",
                  reference_type: "NIC", reference_value: "", address: "", city: "",
                  country: "Sri Lanka", notes: ""
                })
              }}
              disabled={isSubmitting}
              className="h-9 px-3 text-[13px] dark:border-border dark:text-foreground dark:hover:bg-muted"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-[100px] h-9 px-3 text-[13px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Member'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Blacklist Confirmation Dialog */}
    <Dialog open={isBlacklistDialogOpen} onOpenChange={setIsBlacklistDialogOpen}>
      <DialogContent className="max-w-md dark:bg-card dark:border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-400">
            <div className="p-2 bg-orange-100 dark:bg-orange-950/20 rounded-full">
              <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            {blacklistMember?.is_blacklisted ? 'Unblock Member' : 'Blacklist Member'}
          </DialogTitle>
        </DialogHeader>
        
        {blacklistMember && (
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <p className="text-sm font-medium text-orange-900 dark:text-orange-300 mb-2">
                {blacklistMember.is_blacklisted ? 
                  'Are you sure you want to unblock this member?' :
                  'Are you sure you want to blacklist this member?'
                }
              </p>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                <span className="font-bold">{blacklistMember.full_name}</span>
                <br />
                {blacklistMember.email} • {blacklistMember.company_name || 'No company'}
              </p>
            </div>

            {!blacklistMember.is_blacklisted && (
              <div className="space-y-2">
                <Label className="text-red-900 dark:text-red-400 font-semibold">Blacklist Reason *</Label>
                <Textarea
                  value={blacklistReason}
                  onChange={(e) => setBlacklistReason(e.target.value)}
                  placeholder="Enter the reason for blacklisting this member..."
                  rows={3}
                  className="border-red-300 dark:border-red-800 focus:border-red-500 dark:focus:border-red-600 dark:bg-card dark:text-foreground"
                  required
                />
                <p className="text-xs text-red-600 dark:text-red-400">
                  ⚠️ This member will be blocked from all future bookings
                </p>
              </div>
            )}

            {blacklistMember.is_blacklisted && blacklistMember.blacklist_reason && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-xs text-red-600 dark:text-red-400 font-semibold mb-1">Current Reason:</p>
                <p className="text-sm text-red-900 dark:text-red-300">{blacklistMember.blacklist_reason}</p>
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
                className="dark:border-border dark:text-foreground dark:hover:bg-muted"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmBlacklist}
                variant={blacklistMember.is_blacklisted ? "default" : "destructive"}
                className={blacklistMember.is_blacklisted ? "" : "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"}
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

    </div>
  )
}



