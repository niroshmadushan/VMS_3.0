"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  History, Search, Calendar, Clock, User, CreditCard, 
  CheckCircle, XCircle, AlertTriangle, Download, Eye, RotateCcw
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { placeManagementAPI } from "@/lib/place-management-api"
import toast from "react-hot-toast"

interface PassAssignment {
  id: string
  pass_id: string
  pass_type_id: string
  pass_number: number
  pass_display_name?: string
  pass_type_name?: string
  action_type: string
  holder_name: string
  holder_contact?: string
  holder_type: string
  holder_reference_id?: string
  booking_id?: string
  booking_title?: string
  booking_date?: string
  assigned_by?: string
  assigned_by_name?: string
  assigned_date: string
  expected_return_date?: string
  actual_return_date?: string
  duration_hours?: number
  notes?: string
  is_deleted: boolean
  created_at: string
  is_overdue?: boolean
}

export function PassHistoryManagement() {
  const [assignments, setAssignments] = useState<PassAssignment[]>([])
  const [filteredAssignments, setFilteredAssignments] = useState<PassAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isManualReturnDialogOpen, setIsManualReturnDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<PassAssignment | null>(null)
  const [manualReturnTime, setManualReturnTime] = useState("")

  useEffect(() => {
    loadAssignments()
  }, [])

  useEffect(() => {
    filterAssignments()
  }, [assignments, searchTerm, actionFilter, dateFilter, startDate, endDate])

  const loadAssignments = async () => {
    try {
      setIsLoading(true)
      
      const [assignmentsRes, passesRes, passTypesRes, bookingsRes, usersRes] = await Promise.all([
        placeManagementAPI.getTableData('pass_assignments', { limit: 5000 }),
        placeManagementAPI.getTableData('passes', { limit: 5000 }),
        placeManagementAPI.getTableData('pass_types', { limit: 100 }),
        placeManagementAPI.getTableData('bookings', { limit: 1000 }),
        placeManagementAPI.getTableData('users', { limit: 500 })
      ])
      
      const assignmentsList = Array.isArray(assignmentsRes) ? assignmentsRes : []
      const passes = Array.isArray(passesRes) ? passesRes : []
      const passTypes = Array.isArray(passTypesRes) ? passTypesRes : []
      const bookings = Array.isArray(bookingsRes) ? bookingsRes : []
      const users = Array.isArray(usersRes) ? usersRes : []
      
      console.log('📊 Pass Assignments loaded:', assignmentsList.length)
      console.log('📋 Sample assignment:', assignmentsList[0])
      
      // Get today's date for comparison in Sri Lankan timezone (GMT+5:30)
      const now = new Date()
      const sriLankanNow = new Date(now.getTime() + (5.5 * 60 * 60 * 1000))
      const today = sriLankanNow.toISOString().split('T')[0]
      
      // Show ALL records from pass_assignments table without consolidation
      const enrichedAssignments = assignmentsList
        .filter((a: any) => (a.is_deleted === false || a.is_deleted === 0))
        .map((assignment: any) => {
          const pass = passes.find((p: any) => p.id === assignment.pass_id)
          const passType = passTypes.find((pt: any) => pt.id === assignment.pass_type_id)
          const booking = bookings.find((b: any) => b.id === assignment.booking_id)
          const assignedByUser = users.find((u: any) => u.id === assignment.assigned_by)
          
          // Parse booking date
          let bookingDate = booking?.booking_date
          if (bookingDate && typeof bookingDate === 'string') {
            if (bookingDate.includes('T')) {
              const d = new Date(bookingDate)
              bookingDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            } else if (bookingDate.includes(' ')) {
              bookingDate = bookingDate.split(' ')[0]
            }
          }
          
          // Check if this is an overdue assignment (past date, assigned, not returned)
          const assignmentDate = assignment.assigned_date ? assignment.assigned_date.split('T')[0] : null
          const is_overdue = assignment.action_type === 'assigned' && 
                            !assignment.actual_return_date && 
                            ((bookingDate && bookingDate < today) || (assignmentDate && assignmentDate < today))
          
          return {
            ...assignment,
            pass_display_name: pass?.pass_display_name || `Pass #${assignment.pass_number}`,
            pass_type_name: passType?.name || 'Unknown Type',
            booking_title: booking?.title,
            booking_date: bookingDate,
            assigned_by_name: assignedByUser?.full_name || 'System',
            is_overdue
          }
        })
        .sort((a, b) => new Date(b.assigned_date).getTime() - new Date(a.assigned_date).getTime())
      
      setAssignments(enrichedAssignments)
    } catch (error) {
      console.error('Failed to load pass assignments:', error)
      toast.error('Failed to load pass history')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateFilterChange = (filter: string) => {
    setDateFilter(filter)
    if (filter !== 'custom') {
      setStartDate("")
      setEndDate("")
    }
  }

  const openManualReturnDialog = (assignment: PassAssignment) => {
    setSelectedAssignment(assignment)
    setIsManualReturnDialogOpen(true)
    // Set default return time to now, but user can change it
    setManualReturnTime(new Date().toISOString().slice(0, 16))
  }

  const handleManualReturn = async () => {
    if (!selectedAssignment || !manualReturnTime) {
      toast.error('Please select a return date and time')
      return
    }

    // Validate that the return time is not in the future
    const returnDateTime = new Date(manualReturnTime)
    const now = new Date()
    if (returnDateTime > now) {
      toast.error('Return time cannot be in the future')
      return
    }

    try {
      const userStr = localStorage.getItem('user')
      const currentUser = userStr ? JSON.parse(userStr) : null
      const returnedBy = currentUser?.id || currentUser?.user_id || null

      console.log('🔄 Processing manual return for:', selectedAssignment.pass_display_name)

      // Update the existing assignment record to mark as returned (no new record created)
      await placeManagementAPI.updateRecord('pass_assignments',
        { id: selectedAssignment.id },
        {
          action_type: 'returned',
          actual_return_date: returnDateTime.toISOString()
        }
      )

      // Update pass status to available
      await placeManagementAPI.updateRecord('passes',
        { id: selectedAssignment.pass_id },
        {
          status: 'available',
          current_holder_name: null,
          current_holder_contact: null,
          current_holder_type: null,
          returned_at: returnDateTime.toISOString(),
          updated_by: returnedBy
        }
      )

      toast.success(`Pass ${selectedAssignment.pass_display_name} marked as returned`)
      setIsManualReturnDialogOpen(false)
      setSelectedAssignment(null)
      setManualReturnTime("")
      loadAssignments()
    } catch (error: any) {
      console.error('Failed to process manual return:', error)
      toast.error('Failed to process manual return')
    }
  }

  const filterAssignments = () => {
    let filtered = [...assignments]
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(a => 
        a.holder_name?.toLowerCase().includes(search) ||
        a.pass_display_name?.toLowerCase().includes(search) ||
        a.pass_type_name?.toLowerCase().includes(search) ||
        a.holder_contact?.includes(search) ||
        a.booking_title?.toLowerCase().includes(search)
      )
    }
    
    if (actionFilter === 'overdue') {
      filtered = filtered.filter(a => a.is_overdue === true)
    } else if (actionFilter !== 'all') {
      filtered = filtered.filter(a => a.action_type === actionFilter)
    }
    
    // Date filtering
    if (dateFilter !== 'all') {
      const now = new Date()
      
      // Get current date in Sri Lankan timezone (GMT+5:30)
      const sriLankanNow = new Date(now.getTime() + (5.5 * 60 * 60 * 1000))
      const today = sriLankanNow.toISOString().split('T')[0]
      const yesterday = new Date(sriLankanNow.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const lastWeek = new Date(sriLankanNow.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const lastMonth = new Date(sriLankanNow.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      console.log('🗓️ Date filtering debug (GMT+5:30):', {
        dateFilter,
        today,
        yesterday,
        lastWeek,
        lastMonth,
        actualCurrentTime: now.toISOString(),
        sriLankanTime: sriLankanNow.toISOString(),
        actualCurrentDate: now.toDateString()
      })
      
      filtered = filtered.filter(a => {
        // Handle different date formats and timezone issues
        let assignmentDate = a.assigned_date
        
        // More comprehensive date parsing
        if (assignmentDate && assignmentDate.includes('T')) {
          assignmentDate = assignmentDate.split('T')[0]
        } else if (assignmentDate && assignmentDate.includes(' ')) {
          assignmentDate = assignmentDate.split(' ')[0]
        }
        
        // Try to parse the date more robustly
        let assignmentDateObj
        try {
          if (assignmentDate) {
            // Try parsing as ISO date first
            assignmentDateObj = new Date(assignmentDate + 'T00:00:00')
            // If that fails, try parsing the original string
            if (isNaN(assignmentDateObj.getTime())) {
              assignmentDateObj = new Date(a.assigned_date)
            }
          } else {
            // If no assignment date, skip this record
            return false
          }
        } catch (e) {
          console.error('Error parsing date:', a.assigned_date, e)
          assignmentDateObj = new Date(a.assigned_date)
        }
        
        const todayObj = new Date(today + 'T00:00:00')
        const yesterdayObj = new Date(yesterday + 'T00:00:00')
        
        // Get date components for comparison
        const assignmentYear = assignmentDateObj.getFullYear()
        const assignmentMonth = assignmentDateObj.getMonth()
        const assignmentDay = assignmentDateObj.getDate()
        
        const todayYear = todayObj.getFullYear()
        const todayMonth = todayObj.getMonth()
        const todayDay = todayObj.getDate()
        
        const yesterdayYear = yesterdayObj.getFullYear()
        const yesterdayMonth = yesterdayObj.getMonth()
        const yesterdayDay = yesterdayObj.getDate()
        
        console.log('📅 Assignment date check:', {
          original: a.assigned_date,
          parsed: assignmentDate,
          assignmentDateObj: assignmentDateObj.toISOString(),
          assignmentComponents: { year: assignmentYear, month: assignmentMonth, day: assignmentDay },
          todayObj: todayObj.toISOString(),
          todayComponents: { year: todayYear, month: todayMonth, day: todayDay },
          yesterdayObj: yesterdayObj.toISOString(),
          yesterdayComponents: { year: yesterdayYear, month: yesterdayMonth, day: yesterdayDay },
          filter: dateFilter,
          matchesToday: assignmentDate === today,
          matchesYesterday: assignmentDate === yesterday,
          dateComparisonToday: assignmentDateObj.getTime() === todayObj.getTime(),
          dateComparisonYesterday: assignmentDateObj.getTime() === yesterdayObj.getTime(),
          componentComparisonToday: assignmentYear === todayYear && assignmentMonth === todayMonth && assignmentDay === todayDay,
          componentComparisonYesterday: assignmentYear === yesterdayYear && assignmentMonth === yesterdayMonth && assignmentDay === yesterdayDay
        })
        
        // Simplified date comparison using string format
        const assignmentDateStr = assignmentDate // Already parsed to YYYY-MM-DD format
        
        console.log('🔍 Date filter comparison:', {
          dateFilter,
          assignmentDateStr,
          today,
          yesterday,
          lastWeek,
          lastMonth,
          isToday: assignmentDateStr === today,
          isYesterday: assignmentDateStr === yesterday,
          isLastWeek: assignmentDateStr >= lastWeek && assignmentDateStr <= today,
          isLastMonth: assignmentDateStr >= lastMonth && assignmentDateStr <= today
        })
        
        switch (dateFilter) {
          case 'today':
            return assignmentDateStr === today
          case 'yesterday':
            return assignmentDateStr === yesterday
          case 'last_week':
            return assignmentDateStr >= lastWeek && assignmentDateStr <= today
          case 'last_month':
            return assignmentDateStr >= lastMonth && assignmentDateStr <= today
          case 'custom':
            if (startDate && endDate) {
              return assignmentDateStr >= startDate && assignmentDateStr <= endDate
            } else if (startDate) {
              return assignmentDateStr >= startDate
            } else if (endDate) {
              return assignmentDateStr <= endDate
            }
            return true
          default:
            return true
        }
      })
    }
    
    setFilteredAssignments(filtered)
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'assigned':
        return <Badge className="bg-green-500 text-white">ASSIGNED</Badge>
      case 'returned':
        return <Badge className="bg-blue-500 text-white">RETURNED</Badge>
      case 'lost':
        return <Badge className="bg-red-500 text-white">LOST</Badge>
      case 'damaged':
        return <Badge className="bg-orange-500 text-white">DAMAGED</Badge>
      default:
        return <Badge className="bg-gray-500 text-white">{action.toUpperCase()}</Badge>
    }
  }

  const calculateDuration = (assignedDate: string, returnDate?: string) => {
    if (!returnDate) return 'Ongoing'
    
    const start = new Date(assignedDate)
    const end = new Date(returnDate)
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 60) return `${diffMins} mins`
    
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `${hours}h ${mins}m`
  }

  const totalAssigned = assignments.filter(a => a.action_type === 'assigned').length
  const totalReturned = assignments.filter(a => a.action_type === 'returned').length
  const totalLost = assignments.filter(a => a.action_type === 'lost').length
  const currentlyAssigned = assignments.filter(a => a.action_type === 'assigned' && !a.actual_return_date).length
  const overdueCount = assignments.filter(a => a.is_overdue === true).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="text-[13px] leading-tight">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
        <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-blue-700">Total Records</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{assignments.length}</p>
              </div>
              <div className="p-2.5 bg-blue-500 rounded-lg">
                <History className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-green-700">Assigned</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{totalAssigned}</p>
                <p className="text-[11px] text-green-600">{currentlyAssigned} active</p>
              </div>
              <div className="p-2.5 bg-green-500 rounded-lg">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-purple-700">Returned</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">{totalReturned}</p>
              </div>
              <div className="p-2.5 bg-purple-500 rounded-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-red-200 bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-red-700">Lost/Damaged</p>
                <p className="text-2xl font-bold text-red-900 mt-1">{totalLost}</p>
              </div>
              <div className="p-2.5 bg-red-500 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-orange-700">⚠ Overdue</p>
                <p className="text-2xl font-bold text-orange-900 mt-1">{overdueCount}</p>
                <p className="text-[11px] text-orange-600">Past & Not Returned</p>
              </div>
              <div className="p-2.5 bg-orange-500 rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-3 border">
        <CardContent className="pt-3 pb-3">
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by holder name, pass number, booking..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-8"
                  />
                </div>
              </div>
            </div>
            
            {/* Action Filters */}
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant={actionFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setActionFilter('all')}
                className="h-8"
              >
                All
              </Button>
              <Button 
                variant={actionFilter === 'overdue' ? 'default' : 'outline'}
                onClick={() => setActionFilter('overdue')}
                className={`h-8 ${actionFilter === 'overdue' ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
              >
                ⚠ Overdue ({overdueCount})
              </Button>
              <Button 
                variant={actionFilter === 'assigned' ? 'default' : 'outline'}
                onClick={() => setActionFilter('assigned')}
                className={`h-8 ${actionFilter === 'assigned' ? 'bg-green-500' : ''}`}
              >
                Assigned
              </Button>
              <Button 
                variant={actionFilter === 'returned' ? 'default' : 'outline'}
                onClick={() => setActionFilter('returned')}
                className={`h-8 ${actionFilter === 'returned' ? 'bg-blue-500' : ''}`}
              >
                Returned
              </Button>
              <Button 
                variant={actionFilter === 'lost' ? 'default' : 'outline'}
                onClick={() => setActionFilter('lost')}
                className={`h-8 ${actionFilter === 'lost' ? 'bg-red-500' : ''}`}
              >
                Lost
              </Button>
            </div>
            
            {/* Date Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex gap-2 flex-wrap">
                <Button 
                  variant={dateFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => handleDateFilterChange('all')}
                  className="h-8"
                >
                  All Dates
                </Button>
                <Button 
                  variant={dateFilter === 'today' ? 'default' : 'outline'}
                  onClick={() => handleDateFilterChange('today')}
                  className={`h-8 ${dateFilter === 'today' ? 'bg-blue-500' : ''}`}
                >
                  Today
                </Button>
                <Button 
                  variant={dateFilter === 'yesterday' ? 'default' : 'outline'}
                  onClick={() => handleDateFilterChange('yesterday')}
                  className={`h-8 ${dateFilter === 'yesterday' ? 'bg-gray-500' : ''}`}
                >
                  Yesterday
                </Button>
                <Button 
                  variant={dateFilter === 'last_week' ? 'default' : 'outline'}
                  onClick={() => handleDateFilterChange('last_week')}
                  className={`h-8 ${dateFilter === 'last_week' ? 'bg-purple-500' : ''}`}
                >
                  Last 7 Days
                </Button>
                <Button 
                  variant={dateFilter === 'last_month' ? 'default' : 'outline'}
                  onClick={() => handleDateFilterChange('last_month')}
                  className={`h-8 ${dateFilter === 'last_month' ? 'bg-indigo-500' : ''}`}
                >
                  Last 30 Days
                </Button>
                <Button 
                  variant={dateFilter === 'custom' ? 'default' : 'outline'}
                  onClick={() => handleDateFilterChange('custom')}
                  className={`h-8 ${dateFilter === 'custom' ? 'bg-teal-500' : ''}`}
                >
                  Custom Range
                </Button>
              </div>
              
              {/* Custom Date Range */}
              {dateFilter === 'custom' && (
                <div className="flex gap-2 items-center">
                  <div>
                    <Label htmlFor="startDate" className="text-xs text-muted-foreground">From:</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-8 w-36"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate" className="text-xs text-muted-foreground">To:</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-8 w-36"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card className="border shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-5 w-5 text-blue-600" />
            Pass Assignment History
            <Badge className="ml-auto bg-blue-600 text-white text-[12px] px-2.5 py-1">
              {filteredAssignments.length} Records
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <History className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-semibold text-muted-foreground">No pass history records</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead className="bg-gradient-to-r from-blue-100 to-purple-100">
                    <tr>
                      <th className="text-left p-2 font-semibold">Pass</th>
                      <th className="text-left p-2 font-semibold">Action</th>
                      <th className="text-left p-2 font-semibold">Holder</th>
                      <th className="text-left p-2 font-semibold">Booking</th>
                      <th className="text-left p-2 font-semibold">Assigned</th>
                      <th className="text-left p-2 font-semibold">Returned</th>
                      <th className="text-left p-2 font-semibold">Duration</th>
                      <th className="text-left p-2 font-semibold">By</th>
                      <th className="text-center p-2 font-semibold">Status</th>
                      <th className="text-center p-2 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignments.map((assignment, idx) => {
                      const isActive = assignment.action_type === 'assigned' && !assignment.actual_return_date
                      const isReturned = assignment.action_type === 'returned' || assignment.actual_return_date
                      const isLost = assignment.action_type === 'lost'
                      
                      return (
                        <tr 
                          key={assignment.id}
                          className={`border-t hover:bg-blue-50 transition-colors ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          } ${isActive ? 'border-l-2 border-l-green-500' : ''}`}
                        >
                          <td className="p-2">
                            <Badge className="bg-blue-600 text-white font-mono font-bold text-[12px] px-2 py-0.5">
                              {assignment.pass_display_name || `#${assignment.pass_number}`}
                            </Badge>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {assignment.pass_type_name}
                            </p>
                          </td>
                          
                          <td className="p-2">
                            {getActionBadge(assignment.action_type)}
                          </td>
                          
                          <td className="p-2">
                            <div className="space-y-0.5">
                              <p className="font-bold">{assignment.holder_name}</p>
                              {assignment.holder_contact && (
                                <p className="text-[11px] text-muted-foreground">
                                  {assignment.holder_contact}
                                </p>
                              )}
                              <Badge variant="outline" className="text-[11px]">
                                {assignment.holder_type}
                              </Badge>
                            </div>
                          </td>
                          
                          <td className="p-2">
                            {assignment.booking_title ? (
                              <p className="font-medium">{assignment.booking_title}</p>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          
                          <td className="p-2">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-blue-600" />
                              <div>
                                <p className="font-medium">
                                  {(() => {
                                    const date = new Date(assignment.assigned_date)
                                    const sriLankanDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000))
                                    return sriLankanDate.toLocaleDateString('en-LK', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })
                                  })()}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {(() => {
                                    const date = new Date(assignment.assigned_date)
                                    const sriLankanDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000))
                                    return sriLankanDate.toLocaleTimeString('en-LK', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  })()}
                                </p>
                              </div>
                            </div>
                          </td>
                          
                          <td className="p-2">
                            {assignment.action_type === 'returned' ? (
                              <div className="flex items-center gap-1.5">
                                <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                <div>
                                  <p className="font-medium text-green-700">
                                    {(() => {
                                      const date = new Date(assignment.assigned_date)
                                      const sriLankanDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000))
                                      return sriLankanDate.toLocaleDateString('en-LK', {
                                        month: 'short',
                                        day: 'numeric'
                                      })
                                    })()}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {(() => {
                                      const date = new Date(assignment.assigned_date)
                                      const sriLankanDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000))
                                      return sriLankanDate.toLocaleTimeString('en-LK', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })
                                    })()}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-orange-600 border-orange-400 text-[11px]">
                                Not Returned
                              </Badge>
                            )}
                          </td>
                          
                          <td className="p-2">
                            <p className="font-medium">
                              {calculateDuration(assignment.assigned_date, assignment.actual_return_date)}
                            </p>
                          </td>
                          
                          <td className="p-2">
                            <div className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-purple-600" />
                              <p className="text-[12px]">{assignment.assigned_by_name}</p>
                            </div>
                          </td>
                          
                          <td className="p-2 text-center">
                            {isActive ? (
                              <Badge className="bg-green-500 text-white px-2.5 py-0.5 flex items-center gap-1 justify-center w-fit mx-auto text-[11px]">
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                ACTIVE
                              </Badge>
                            ) : isReturned ? (
                              <Badge className="bg-blue-500 text-white px-2.5 py-0.5 text-[11px]">
                                COMPLETED
                              </Badge>
                            ) : isLost ? (
                              <Badge className="bg-red-500 text-white px-2.5 py-0.5 text-[11px]">
                                LOST
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-500 text-white px-2.5 py-0.5 text-[11px]">
                                ARCHIVED
                              </Badge>
                            )}
                          </td>
                          
                          <td className="p-2 text-center">
                            {assignment.is_overdue && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openManualReturnDialog(assignment)}
                                className="h-7 text-[11px] text-orange-600 hover:bg-orange-50 border-orange-300"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Set Return Time
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Return Time Dialog */}
      <Dialog open={isManualReturnDialogOpen} onOpenChange={setIsManualReturnDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-900">
              <div className="p-2 bg-orange-100 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              Set Return Time
            </DialogTitle>
          </DialogHeader>
          
          {selectedAssignment && (
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
                <p className="text-sm font-medium text-orange-900 mb-3">
                  ⚠ This pass was assigned for a past date but never returned systematically.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pass:</span>
                    <Badge className="bg-blue-600 text-white font-bold">
                      {selectedAssignment.pass_display_name}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Holder:</span>
                    <span className="font-bold">{selectedAssignment.holder_name}</span>
                  </div>
                  {selectedAssignment.booking_title && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Booking:</span>
                      <span className="font-medium">{selectedAssignment.booking_title}</span>
                    </div>
                  )}
                  {selectedAssignment.booking_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Booking Date:</span>
                      <span className="font-medium text-red-600">
                        {(() => {
                          const date = new Date(selectedAssignment.booking_date)
                          const sriLankanDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000))
                          return sriLankanDate.toLocaleDateString('en-LK', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="returnTime">When was the pass actually returned? *</Label>
                <Input
                  id="returnTime"
                  type="datetime-local"
                  value={manualReturnTime}
                  onChange={(e) => setManualReturnTime(e.target.value)}
                  max={new Date().toISOString().slice(0, 16)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ⚠ Cannot be in the future. Select when the visitor actually returned the pass.
                </p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-900 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Pass will be marked as available for future assignments
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsManualReturnDialogOpen(false)
                    setSelectedAssignment(null)
                    setManualReturnTime("")
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleManualReturn}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Confirm Return
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
