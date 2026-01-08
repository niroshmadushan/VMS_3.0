"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import {
  Users, Clock, Calendar, Search, CreditCard, CheckCircle, 
  XCircle, Activity, MapPin, Building2, User, Phone, Mail, Eye, History, Maximize2
} from "lucide-react"
import { placeManagementAPI } from "@/lib/place-management-api"
import toast from "react-hot-toast"

interface TodaysVisitor {
  member_id: string
  visitor_name: string
  visitor_email: string
  visitor_phone: string
  visitor_company?: string
  visitor_designation?: string
  reference_type: string
  reference_value: string
  is_blacklisted: boolean
  visit_count: number
  
  booking_id: string
  booking_ref_id?: string
  booking_title: string
  booking_date: string
  start_time: string
  end_time: string
  booking_status: string
  
  place_name: string
  responsible_person_name: string
  
  time_slot: string
  current_status: string
  duration_minutes: number
  
  // Pass assignment
  assigned_pass_id?: string
  assigned_pass_number?: string
  assigned_pass_type?: string
  returned_pass_number?: string
  pass_return_time?: string
  
  // Returned passes support
  returned_passes?: Array<{
    pass_id: string
    pass_number: string
    pass_type: string
    assigned_date: string
    returned_date: string
    booking_id: string
    booking_title: string
  }>
  returned_passes_count?: number
  
  // Historical pass assignments
  historical_assignments?: PassAssignment[]
  needs_manual_return?: boolean
}

interface PassAssignment {
  id: string
  pass_id: string
  pass_display_name: string
  pass_type_name: string
  action_type: 'assigned' | 'returned' | 'lost'
  holder_name: string
  holder_contact: string
  assigned_date: string
  actual_return_date?: string
  assigned_by_name: string
  booking_title: string
  booking_date: string
}

interface Pass {
  id: string
  pass_type_id: string
  pass_number: number
  pass_display_name: string
  status: string
  is_deleted?: boolean | number
  pass_type_name?: string
  pass_type_color?: string
}

interface PassType {
  id: string
  name: string
  color: string
  prefix: string
  available_count: number
}

export function VisitorPassManagement() {
  const [visitors, setVisitors] = useState<TodaysVisitor[]>([])
  const [filteredVisitors, setFilteredVisitors] = useState<TodaysVisitor[]>([])
  const [passes, setPasses] = useState<Pass[]>([])
  const [passTypes, setPassTypes] = useState<PassType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedVisitor, setSelectedVisitor] = useState<TodaysVisitor | null>(null)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
  const [visitorToReturn, setVisitorToReturn] = useState<TodaysVisitor | null>(null)
  const [selectedPassId, setSelectedPassId] = useState("")
  const [historicalAssignments, setHistoricalAssignments] = useState<PassAssignment[]>([])
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [isManualReturnDialogOpen, setIsManualReturnDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<PassAssignment | null>(null)
  const [manualReturnTime, setManualReturnTime] = useState("")
  const [showDetailedHistory, setShowDetailedHistory] = useState(false)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    filterVisitors()
  }, [visitors, searchTerm, statusFilter])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Load active and upcoming visitors with pass assignments
      const today = new Date().toISOString().split('T')[0]
      
      const [bookingsRes, participantsRes, membersRes, passesRes, passTypesRes, passAssignmentsRes, usersRes] = await Promise.all([
        placeManagementAPI.getTableData('bookings', { 
          filters: [{ field: 'is_deleted', operator: '=', value: 0 }],
          limit: 500 
        }),
        placeManagementAPI.getTableData('external_participants', { limit: 5000 }),
        placeManagementAPI.getTableData('external_members', { limit: 5000 }),
        placeManagementAPI.getTableData('passes', { limit: 5000 }),
        placeManagementAPI.getTableData('pass_types', { limit: 100 }),
        placeManagementAPI.getTableData('pass_assignments', { limit: 5000 }),
        placeManagementAPI.getTableData('users', { limit: 1000 })
      ])
      
      const bookings = Array.isArray(bookingsRes) ? bookingsRes : []
      const participants = Array.isArray(participantsRes) ? participantsRes : []
      const members = Array.isArray(membersRes) ? membersRes : []
      const allPasses = Array.isArray(passesRes) ? passesRes : []
      const types = Array.isArray(passTypesRes) ? passTypesRes : []
      const assignments = Array.isArray(passAssignmentsRes) ? passAssignmentsRes : []
      const users = Array.isArray(usersRes) ? usersRes : []
      
      console.log('📊 Data loaded:', {
        bookings: bookings.length,
        participants: participants.length,
        members: members.length,
        passes: allPasses.length,
        passTypes: types.length,
        assignments: assignments.length
      })
      console.log('🎫 Sample assignment:', assignments[0])
      
      // Filter bookings - show all bookings with active pass assignments (not just today)
      // Include today + future bookings + past bookings with unreturned passes
      const relevantBookings = bookings.filter((b: any) => {
        let bookingDate = b.booking_date
        if (typeof bookingDate === 'string') {
          if (bookingDate.includes('T')) {
            const d = new Date(bookingDate)
            bookingDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          } else if (bookingDate.includes(' ')) {
            bookingDate = bookingDate.split(' ')[0]
          }
        }
        // Show bookings from today onwards, or past bookings if they have active pass assignments
        return bookingDate >= today || assignments.some((a: any) => 
          a.booking_id === b.id && 
          a.action_type === 'assigned' && 
          a.actual_return_date === null
        )
      })
      
      // Build visitors list
      const visitorsList: TodaysVisitor[] = []
      
      relevantBookings.forEach((booking: any) => {
        // Filter to show ONLY users with participation_status = 'confirmed' (have marked attendance)
        const bookingParticipants = participants.filter((p: any) => {
          // Basic filters
          if (p.booking_id !== booking.id) return false
          if (p.is_deleted === true || p.is_deleted === 1) return false
          
          // ONLY show users with participation_status = 'confirmed'
          // This means they have marked attendance through Smart Assistant
          if (p.participation_status === 'confirmed') {
            console.log(`✅ INCLUDED - ${p.full_name}: participation_status = 'confirmed'`, {
              participation_status: p.participation_status,
              check_in_time: p.check_in_time,
              checked_in_at: p.checked_in_at
            })
            return true
          }
          
          // EXCLUDE all others (invited, pending, checked_in, attended, null, etc.)
          console.log(`❌ EXCLUDED - ${p.full_name}: participation_status = '${p.participation_status}' (not 'confirmed')`, {
            participation_status: p.participation_status || 'null/undefined',
            check_in_time: p.check_in_time || 'null',
            checked_in_at: p.checked_in_at || 'null'
          })
          return false
        })
        
        bookingParticipants.forEach((participant: any) => {
          // Try to find linked member, but also allow participants without member_id
          let member = null
          if (participant.member_id) {
            member = members.find((m: any) => 
            m.id === participant.member_id && 
            (m.is_deleted === false || m.is_deleted === 0) && 
            (m.is_active === true || m.is_active === 1)
          )
          }
          
          // If no member found but participant has data, use participant data directly
          // This handles cases where participants exist but aren't linked to external_members
          if (!member && participant.full_name) {
            // Use participant's own data as fallback
            member = {
              id: participant.member_id || participant.id, // Use participant id as fallback
              full_name: participant.full_name,
              email: participant.email,
              phone: participant.phone,
              company_name: participant.company_name,
              designation: participant.company_position,
              reference_type: participant.reference_type,
              reference_value: participant.reference_value,
              is_blacklisted: false,
              visit_count: 0,
              is_deleted: false,
              is_active: true
            }
          }
          
          // Skip if we still don't have member data
          if (!member || !member.full_name) return
          
          // Calculate current status
          const now = new Date()
          const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`
          
          // Parse booking date to compare with today
          let bookingDate = booking.booking_date
          if (typeof bookingDate === 'string') {
            if (bookingDate.includes('T')) {
              const d = new Date(bookingDate)
              bookingDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            } else if (bookingDate.includes(' ')) {
              bookingDate = bookingDate.split(' ')[0]
            }
          }
          
          let currentStatus = booking.status || 'upcoming'
          if (booking.status === 'cancelled' || booking.status === 'completed') {
            currentStatus = booking.status
          } else if (bookingDate > today) {
            currentStatus = 'upcoming' // Future date
          } else if (bookingDate === today) {
            // Today - check time
            if (currentTime >= booking.start_time && currentTime <= booking.end_time) {
              currentStatus = 'ongoing'
            } else if (currentTime < booking.start_time) {
              currentStatus = 'upcoming'
            } else {
              currentStatus = 'completed'
            }
          } else {
            currentStatus = 'completed' // Past date
          }
          
          const startTime = booking.start_time ? booking.start_time.substring(0, 5) : '00:00'
          const endTime = booking.end_time ? booking.end_time.substring(0, 5) : '00:00'
          const timeSlot = `${startTime} - ${endTime}`
          
          const [startHour, startMin] = startTime.split(':').map(Number)
          const [endHour, endMin] = endTime.split(':').map(Number)
          const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin)
          
          // Find all historical pass assignments for this visitor (any date)
          // Check both holder_reference_id and holder_id to match the external member
          const visitorAssignments = assignments.filter((a: any) => 
            (a.holder_reference_id === member.id || a.holder_id === member.id) && 
            (a.is_deleted === false || a.is_deleted === 0)
          )
          
          // Find the assignment for this booking (could be assigned or returned)
          const bookingAssignment = visitorAssignments.find((a: any) => 
            a.booking_id === booking.id
          )
          
          // Check if it's an active assignment (assigned, not returned)
          const todayAssignment = bookingAssignment && 
            bookingAssignment.action_type === 'assigned' && 
            !bookingAssignment.actual_return_date 
            ? bookingAssignment 
            : null
          
          // Check if it's a returned assignment for this booking
          const returnedAssignment = bookingAssignment && 
            bookingAssignment.action_type === 'returned' && 
            bookingAssignment.actual_return_date 
            ? bookingAssignment 
            : null
          
          // Find ALL returned passes for this visitor (across all bookings)
          // Check BOTH holder_reference_id AND holder_id to match the external member
          // Filter by action_type = 'returned' and actual_return_date is not null
          const allReturnedAssignments = assignments.filter((a: any) => 
            a.action_type === 'returned' && 
            a.actual_return_date !== null &&
            (a.holder_reference_id === member.id || a.holder_id === member.id) &&
            (a.is_deleted === false || a.is_deleted === 0)
          )
          
          // Build returned passes list
          const returnedPassesList = allReturnedAssignments.map((a: any) => {
            const pass = allPasses.find((p: any) => p.id === a.pass_id)
            const assignmentBooking = bookings.find((b: any) => b.id === a.booking_id)
            return {
              pass_id: a.pass_id,
              pass_number: pass?.pass_display_name || `Pass ${a.pass_number}`,
              pass_type: pass?.pass_type_name || 'Unknown',
              assigned_date: a.assigned_date,
              returned_date: a.actual_return_date,
              booking_id: a.booking_id,
              booking_title: assignmentBooking?.title || 'Unknown Booking'
            }
          }).sort((a, b) => new Date(b.returned_date).getTime() - new Date(a.returned_date).getTime()) // Sort by most recent return first
          
          // Find ALL active passes for this visitor (assigned but not returned) - for reference
          const activeAssignments = visitorAssignments.filter((a: any) => 
            a.action_type === 'assigned' && 
            !a.actual_return_date
          )
          
          // Check for passes that need manual return (assigned but not returned from past days)
          const needsManualReturn = visitorAssignments.some((a: any) => 
            a.action_type === 'assigned' && 
            a.actual_return_date === null &&
            a.booking_id !== booking.id // Different booking (past booking)
          )
          
          // Find the currently assigned pass for this booking
          // Priority: booking-specific assignment > any active pass for this visitor
          const assignedPass = todayAssignment 
            ? allPasses.find((p: any) => p.id === todayAssignment.pass_id) 
            : activeAssignments.length > 0
            ? allPasses.find((p: any) => p.id === activeAssignments[0].pass_id)
            : allPasses.find((p: any) => 
                p.status === 'assigned' && 
                p.current_holder_name === member.full_name &&
                (p.is_deleted === false || p.is_deleted === 0)
              )
          
          // Build historical assignments data
          const historicalAssignmentsData: PassAssignment[] = visitorAssignments
            .map((a: any) => {
              const pass = allPasses.find((p: any) => p.id === a.pass_id)
              const booking = bookings.find((b: any) => b.id === a.booking_id)
              const assignedByUser = users?.find((u: any) => u.id === a.assigned_by)
              
              return {
                id: a.id,
                pass_id: a.pass_id,
                pass_display_name: pass?.pass_display_name || 'Unknown Pass',
                pass_type_name: pass?.pass_type_name || 'Unknown Type',
                action_type: a.action_type,
                holder_name: a.holder_name,
                holder_contact: a.holder_contact,
                assigned_date: a.assigned_date,
                actual_return_date: a.actual_return_date,
                assigned_by_name: assignedByUser?.name || 'Unknown',
                booking_title: booking?.title || 'Unknown Booking',
                booking_date: booking?.booking_date || 'Unknown Date'
              }
            })
            .sort((a, b) => new Date(b.assigned_date).getTime() - new Date(a.assigned_date).getTime())

          console.log('🔍 Checking pass for:', member.full_name, {
            todayAssignment,
            returnedAssignment,
            needsManualReturn,
            historicalCount: historicalAssignmentsData.length,
            assignedPass: assignedPass ? {
              id: assignedPass.id,
              display_name: assignedPass.pass_display_name,
              status: assignedPass.status
            } : null
          })
          
          visitorsList.push({
            member_id: member.id,
            visitor_name: member.full_name,
            visitor_email: member.email,
            visitor_phone: member.phone,
            visitor_company: member.company_name,
            visitor_designation: member.designation,
            reference_type: member.reference_type,
            reference_value: member.reference_value,
            is_blacklisted: member.is_blacklisted === true || member.is_blacklisted === 1,
            visit_count: member.visit_count || 0,
            
            booking_id: booking.id,
            booking_ref_id: booking.booking_ref_id,
            booking_title: booking.title,
            booking_date: booking.booking_date,
            start_time: booking.start_time,
            end_time: booking.end_time,
            booking_status: booking.status,
            
            place_name: booking.place_name || 'Unknown',
            responsible_person_name: booking.responsible_person_name || 'Unknown',
            
            time_slot: timeSlot,
            current_status: currentStatus,
            duration_minutes: durationMinutes,
            
            assigned_pass_id: assignedPass?.id,
            assigned_pass_number: assignedPass?.pass_display_name,
            assigned_pass_type: assignedPass?.pass_type_name,
            returned_pass_number: returnedAssignment ? allPasses.find((p: any) => p.id === returnedAssignment.pass_id)?.pass_display_name : undefined,
            pass_return_time: returnedAssignment?.actual_return_date,
            
            // Returned passes support
            returned_passes: returnedPassesList,
            returned_passes_count: returnedPassesList.length,
            
            // Historical data
            historical_assignments: historicalAssignmentsData,
            needs_manual_return: needsManualReturn
          })
        })
      })
      
      // Sort by date first, then by time
      visitorsList.sort((a, b) => {
        const dateCompare = a.booking_date.localeCompare(b.booking_date)
        if (dateCompare !== 0) return dateCompare
        return a.start_time.localeCompare(b.start_time)
      })
      
      setVisitors(visitorsList)
      
      // Process passes with type information
      const passesWithTypes = allPasses
        .filter((p: any) => (p.is_deleted === false || p.is_deleted === 0))
        .map((pass: any) => {
          const type = types.find((t: any) => t.id === pass.pass_type_id)
          return {
            ...pass,
            pass_type_id: pass.pass_type_id, // Explicitly preserve
            pass_type_name: type?.name,
            pass_type_color: type?.color
          }
        })
      
      setPasses(passesWithTypes)
      
      // Calculate pass type stats
      const typeStats = types.map((type: any) => {
        const available = allPasses.filter((p: any) => 
          p.pass_type_id === type.id && 
          p.status === 'available' &&
          (p.is_deleted === false || p.is_deleted === 0)
        ).length
        
        return {
          id: type.id,
          name: type.name,
          color: type.color,
          prefix: type.prefix,
          available_count: available
        }
      })
      setPassTypes(typeStats)
      
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load visitors')
    } finally {
      setIsLoading(false)
    }
  }

  const filterVisitors = () => {
    let filtered = [...visitors]
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(v => 
        v.visitor_name.toLowerCase().includes(search) ||
        v.visitor_email.toLowerCase().includes(search) ||
        v.visitor_phone.includes(search) ||
        v.reference_value.toLowerCase().includes(search) ||
        v.visitor_company?.toLowerCase().includes(search) ||
        v.booking_title.toLowerCase().includes(search)
      )
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.current_status === statusFilter)
    }
    
    setFilteredVisitors(filtered)
  }

  const openAssignDialog = (visitor: TodaysVisitor) => {
    setSelectedVisitor(visitor)
    setIsAssignDialogOpen(true)
    
    // Debug: Show what passes are available
    console.log('📋 Total passes:', passes.length)
    console.log('✅ Available passes:', passes.filter(p => p.status === 'available').length)
    console.log('🎫 Available with type_id:', passes.filter(p => p.status === 'available' && p.pass_type_id).length)
    console.log('📊 Sample passes:', passes.slice(0, 3))
  }

  const handleAssignPass = async () => {
    if (!selectedVisitor || !selectedPassId) {
      toast.error('Please select a pass')
      return
    }

    try {
      const pass = passes.find(p => p.id === selectedPassId)
      if (!pass || !pass.pass_type_id) {
        toast.error('Invalid pass selected')
        return
      }

      // Get current user info from localStorage
      const userStr = localStorage.getItem('user')
      const currentUser = userStr ? JSON.parse(userStr) : null
      const assignedBy = currentUser?.id || currentUser?.user_id || null

      console.log('👤 Assigning pass by user:', assignedBy)

      // Check if assignment already exists for this pass and visitor
      // Check both holder_reference_id and holder_id
      const existingAssignments = await placeManagementAPI.getTableData('pass_assignments', { limit: 5000 })
      const existingAssignment = Array.isArray(existingAssignments) ? existingAssignments.find((a: any) => 
        a.pass_id === selectedPassId &&
        (a.holder_reference_id === selectedVisitor.member_id || a.holder_id === selectedVisitor.member_id) &&
        a.booking_id === selectedVisitor.booking_id &&
        (a.is_deleted === false || a.is_deleted === 0)
      ) : null

      if (existingAssignment) {
        // Update existing assignment to assigned
        await placeManagementAPI.updateRecord('pass_assignments',
          { id: existingAssignment.id },
          {
            action_type: 'assigned',
            assigned_date: new Date().toISOString(),
            actual_return_date: null
          }
        )
        console.log('🔄 Updated existing assignment:', existingAssignment.id)
      } else {
        // Create new assignment record
        await placeManagementAPI.insertRecord('pass_assignments', {
          pass_id: selectedPassId,
          pass_type_id: pass.pass_type_id,
          pass_number: pass.pass_number,
          action_type: 'assigned',
          holder_name: selectedVisitor.visitor_name,
          holder_contact: selectedVisitor.visitor_phone,
          holder_type: 'external',
          holder_reference_id: selectedVisitor.member_id,
          holder_id: selectedVisitor.member_id,
          booking_id: selectedVisitor.booking_id,
          assigned_by: assignedBy,
          assigned_date: new Date().toISOString(),
          is_deleted: false
        })
        console.log('✅ Created new assignment record')
      }

      // Update pass status
      await placeManagementAPI.updateRecord('passes',
        { id: selectedPassId },
        { 
          status: 'assigned',
          current_holder_name: selectedVisitor.visitor_name,
          current_holder_contact: selectedVisitor.visitor_phone,
          current_holder_type: 'external',
          assigned_at: new Date().toISOString(),
          updated_by: assignedBy
        }
      )

      toast.success(`Pass ${pass.pass_display_name} assigned successfully`)
      setIsAssignDialogOpen(false)
      setSelectedPassId("")
      loadData()
    } catch (error: any) {
      console.error('Failed to assign pass:', error)
      toast.error('Failed to assign pass')
    }
  }

  const openReturnDialog = (visitor: TodaysVisitor) => {
    if (!visitor.assigned_pass_id) {
      toast.error('No pass assigned to return')
      return
    }
    setVisitorToReturn(visitor)
    setIsReturnDialogOpen(true)
  }

  const openHistoryDialog = (visitor: TodaysVisitor) => {
    setSelectedVisitor(visitor)
    setHistoricalAssignments(visitor.historical_assignments || [])
    setIsHistoryDialogOpen(true)
  }

  const openManualReturnDialog = (assignment: PassAssignment) => {
    setSelectedAssignment(assignment)
    setIsManualReturnDialogOpen(true)
    // Set default return time to now
    setManualReturnTime(new Date().toISOString().slice(0, 16))
  }

  const handleManualReturn = async () => {
    if (!selectedAssignment || !manualReturnTime) {
      toast.error('Please select a return time')
      return
    }

    try {
      const userStr = localStorage.getItem('user')
      const currentUser = userStr ? JSON.parse(userStr) : null
      const returnedBy = currentUser?.id || currentUser?.user_id || null

      // Update the existing assignment record to mark as returned (no new record created)
      await placeManagementAPI.updateRecord('pass_assignments',
        { id: selectedAssignment.id },
        {
          action_type: 'returned',
          actual_return_date: new Date(manualReturnTime).toISOString()
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
          holder_id: null,
          returned_at: new Date(manualReturnTime).toISOString(),
          updated_by: returnedBy
        }
      )

      toast.success(`Pass ${selectedAssignment.pass_display_name} marked as returned`)
      setIsManualReturnDialogOpen(false)
      setSelectedAssignment(null)
      setManualReturnTime("")
      loadData()
    } catch (error: any) {
      console.error('Failed to process manual return:', error)
      toast.error('Failed to process manual return')
    }
  }

  const handleUnassignPass = async () => {
    if (!visitorToReturn || !visitorToReturn.assigned_pass_id) {
      toast.error('No pass to return')
      return
    }

    try {
      const visitor = visitorToReturn
      // Get current user info
      const userStr = localStorage.getItem('user')
      const currentUser = userStr ? JSON.parse(userStr) : null
      const returnedBy = currentUser?.id || currentUser?.user_id || null

      console.log('🔄 Returning pass:', visitor.assigned_pass_number, 'by user:', returnedBy)

      // Find and update the existing assignment record instead of creating a new one
      const assignmentsRes = await placeManagementAPI.getTableData('pass_assignments', { limit: 5000 })
      const assignments = Array.isArray(assignmentsRes) ? assignmentsRes : []
      
      console.log('🔍 Searching for assignment:', {
        pass_id: visitor.assigned_pass_id,
        member_id: visitor.member_id,
        booking_id: visitor.booking_id,
        visitor_name: visitor.visitor_name,
        total_assignments: assignments.length
      })
      
      // Debug: Show all assignments for this pass
      const passAssignments = assignments.filter((a: any) => a.pass_id === visitor.assigned_pass_id)
      console.log('🎫 All assignments for this pass:', passAssignments.map(a => ({
        id: a.id,
        pass_id: a.pass_id,
        holder_reference_id: a.holder_reference_id,
        holder_name: a.holder_name,
        booking_id: a.booking_id,
        action_type: a.action_type,
        actual_return_date: a.actual_return_date,
        is_deleted: a.is_deleted
      })))
      
      // Debug: Show all assignments for this visitor
      // Check both holder_reference_id and holder_id
      const visitorAssignments = assignments.filter((a: any) => 
        (a.holder_reference_id === visitor.member_id || a.holder_id === visitor.member_id) &&
        (a.is_deleted === false || a.is_deleted === 0)
      )
      console.log('👤 All assignments for this visitor:', visitorAssignments.map(a => ({
        id: a.id,
        pass_id: a.pass_id,
        holder_reference_id: a.holder_reference_id,
        holder_id: a.holder_id,
        holder_name: a.holder_name,
        booking_id: a.booking_id,
        action_type: a.action_type,
        actual_return_date: a.actual_return_date,
        is_deleted: a.is_deleted
      })))
      
      // Try multiple search strategies to find the assignment
      let activeAssignment = null
      
      // Strategy 1: Exact match (pass + visitor + booking)
      // Check both holder_reference_id and holder_id
      let sortedAssignments = assignments
        .filter((a: any) => 
          a.pass_id === visitor.assigned_pass_id &&
          (a.holder_reference_id === visitor.member_id || a.holder_id === visitor.member_id) &&
          a.booking_id === visitor.booking_id &&
          (a.is_deleted === false || a.is_deleted === 0)
        )
        .sort((a: any, b: any) => new Date(b.created_at || b.assigned_date).getTime() - new Date(a.created_at || a.assigned_date).getTime())
      
      console.log('📋 Strategy 1 - Exact match (pass+visitor+booking):', sortedAssignments.map(a => ({
        id: a.id,
        action_type: a.action_type,
        assigned_date: a.assigned_date,
        actual_return_date: a.actual_return_date
      })))
      
      if (sortedAssignments.length > 0) {
        activeAssignment = sortedAssignments[0]
        console.log('✅ Found assignment with Strategy 1')
      } else {
        // Strategy 2: Pass + visitor only (ignore booking)
        // Check both holder_reference_id and holder_id
        sortedAssignments = assignments
          .filter((a: any) => 
            a.pass_id === visitor.assigned_pass_id &&
            (a.holder_reference_id === visitor.member_id || a.holder_id === visitor.member_id) &&
            (a.is_deleted === false || a.is_deleted === 0)
          )
          .sort((a: any, b: any) => new Date(b.created_at || b.assigned_date).getTime() - new Date(a.created_at || a.assigned_date).getTime())
        
        console.log('📋 Strategy 2 - Pass+visitor only:', sortedAssignments.map(a => ({
          id: a.id,
          action_type: a.action_type,
          assigned_date: a.assigned_date,
          actual_return_date: a.actual_return_date,
          booking_id: a.booking_id
        })))
        
        if (sortedAssignments.length > 0) {
          activeAssignment = sortedAssignments[0]
          console.log('✅ Found assignment with Strategy 2')
        } else {
          // Strategy 3: Just by pass_id (most recent assignment for this pass)
          sortedAssignments = assignments
            .filter((a: any) => 
              a.pass_id === visitor.assigned_pass_id &&
              (a.is_deleted === false || a.is_deleted === 0)
            )
            .sort((a: any, b: any) => new Date(b.created_at || b.assigned_date).getTime() - new Date(a.created_at || a.assigned_date).getTime())
          
          console.log('📋 Strategy 3 - Pass only:', sortedAssignments.map(a => ({
            id: a.id,
            action_type: a.action_type,
            assigned_date: a.assigned_date,
            actual_return_date: a.actual_return_date,
            holder_name: a.holder_name,
            holder_reference_id: a.holder_reference_id,
            booking_id: a.booking_id
          })))
          
          if (sortedAssignments.length > 0) {
            activeAssignment = sortedAssignments[0]
            console.log('✅ Found assignment with Strategy 3')
          }
        }
      }
      
      console.log('🎯 Found assignment:', activeAssignment ? {
        id: activeAssignment.id,
        action_type: activeAssignment.action_type,
        actual_return_date: activeAssignment.actual_return_date,
        pass_id: activeAssignment.pass_id,
        holder_reference_id: activeAssignment.holder_reference_id,
        holder_id: activeAssignment.holder_id,
        booking_id: activeAssignment.booking_id
      } : 'None')

      if (activeAssignment) {
        // Check if already returned
        if (activeAssignment.action_type === 'returned' && activeAssignment.actual_return_date) {
          toast.error('This pass has already been returned.')
          return
        }
        
        // Update the existing assignment record to mark as returned
        await placeManagementAPI.updateRecord('pass_assignments',
          { id: activeAssignment.id },
          {
            action_type: 'returned',
            actual_return_date: new Date().toISOString()
          }
        )
      } else {
        // If no assignment found at all, create a fallback record
        console.warn('⚠️ No assignment found, creating fallback return record:', {
          pass_id: visitor.assigned_pass_id,
          member_id: visitor.member_id,
          booking_id: visitor.booking_id,
          visitor_name: visitor.visitor_name
        })
        
        // Create a fallback return record
        // Set both holder_reference_id and holder_id to ensure it's found
        await placeManagementAPI.insertRecord('pass_assignments', {
          pass_id: visitor.assigned_pass_id,
          pass_type_id: passes.find(p => p.id === visitor.assigned_pass_id)?.pass_type_id,
          pass_number: passes.find(p => p.id === visitor.assigned_pass_id)?.pass_number,
          action_type: 'returned',
          holder_name: visitor.visitor_name,
          holder_contact: visitor.visitor_phone,
          holder_type: 'external',
          holder_reference_id: visitor.member_id,
          holder_id: visitor.member_id, // Ensure holder_id is set
          booking_id: visitor.booking_id,
          assigned_by: returnedBy,
          assigned_date: new Date().toISOString(),
          actual_return_date: new Date().toISOString(),
          is_deleted: false
        })
        
        toast.success('Pass returned successfully (fallback record created)')
      }

      // Update pass status to available
      await placeManagementAPI.updateRecord('passes',
        { id: visitor.assigned_pass_id },
        {
          status: 'available',
          current_holder_name: null,
          current_holder_contact: null,
          current_holder_type: null,
          returned_at: new Date().toISOString(),
          updated_by: returnedBy
        }
      )

      toast.success(`Pass ${visitor.assigned_pass_number} returned and now available`)
      setIsReturnDialogOpen(false)
      setVisitorToReturn(null)
      loadData()
    } catch (error: any) {
      console.error('Failed to return pass:', error)
      toast.error('Failed to return pass')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-green-500 text-white'
      case 'upcoming': return 'bg-orange-500 text-white'
      case 'completed': return 'bg-blue-500 text-white'
      case 'cancelled': return 'bg-gray-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const totalVisitors = visitors.length
  const ongoingCount = visitors.filter(v => v.current_status === 'ongoing').length
  const upcomingCount = visitors.filter(v => v.current_status === 'upcoming').length
  const withPassCount = visitors.filter(v => v.assigned_pass_id).length
  const withoutPassCount = visitors.filter(v => !v.assigned_pass_id && v.current_status !== 'cancelled').length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 dark:bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 dark:border-blue-400"></div>
      </div>
    )
  }

  return (
    <div className="space-y-3 px-2 sm:px-4 max-w-[98vw] mx-auto dark:bg-background">
      {/* Statistics & Available Passes - Compact Table */}
      <Card className="border shadow-md dark:bg-card dark:border-border mb-3">
        <CardContent className="p-0">
          <Table>
            <TableBody>
              <TableRow className="hover:bg-transparent">
                <TableCell className="py-2.5 px-4 border-r dark:border-border">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-[13px] text-muted-foreground dark:text-muted-foreground">All Visitors</p>
                      <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{totalVisitors}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-2.5 px-4 border-r dark:border-border">
                  <div className="flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-[13px] text-muted-foreground dark:text-muted-foreground">Ongoing</p>
                      <p className="text-xl font-bold text-green-700 dark:text-green-400">{ongoingCount}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-2.5 px-4 border-r dark:border-border">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                    <div>
                      <p className="text-[13px] text-muted-foreground dark:text-muted-foreground">Upcoming</p>
                      <p className="text-xl font-bold text-orange-700 dark:text-orange-400">{upcomingCount}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-2.5 px-4 border-r dark:border-border">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <p className="text-[13px] text-muted-foreground dark:text-muted-foreground">With Pass</p>
                      <p className="text-xl font-bold text-purple-700 dark:text-purple-400">{withPassCount}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-2.5 px-4 border-r dark:border-border">
                  <div className="flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                    <div>
                      <p className="text-[13px] text-muted-foreground dark:text-muted-foreground">Need Pass</p>
                      <p className="text-xl font-bold text-red-700 dark:text-red-400">{withoutPassCount}</p>
                    </div>
                  </div>
                </TableCell>
                {passTypes.map((type, index) => (
                  <TableCell key={type.id} className={`py-2.5 px-4 ${index < passTypes.length - 1 ? 'border-r dark:border-border' : ''}`}>
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5" style={{ color: type.color }} />
                      <div>
                        <p className="text-[13px] text-muted-foreground dark:text-muted-foreground">{type.name}</p>
                        <p className="text-xl font-bold" style={{ color: type.color }}>{type.available_count}</p>
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card className="border shadow-md dark:bg-card dark:border-border mb-3">
        <CardContent className="pt-2.5 pb-2.5 px-3 dark:bg-card">
          <div className="flex flex-col lg:flex-row gap-2.5">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground dark:text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone, reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9 text-[13px] dark:bg-card dark:border-border dark:text-foreground"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                className="h-9 px-3 text-[13px] dark:border-border dark:hover:bg-muted"
              >
                All ({totalVisitors})
              </Button>
              <Button 
                variant={statusFilter === 'ongoing' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('ongoing')}
                className={`h-9 px-3 text-[13px] ${statusFilter === 'ongoing' ? 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700' : 'dark:border-border dark:hover:bg-muted'}`}
              >
                Ongoing ({ongoingCount})
              </Button>
              <Button 
                variant={statusFilter === 'upcoming' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('upcoming')}
                className={`h-9 px-3 text-[13px] ${statusFilter === 'upcoming' ? 'bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700' : 'dark:border-border dark:hover:bg-muted'}`}
              >
                Upcoming ({upcomingCount})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visitors Table */}
      <Card className="border shadow-md dark:bg-card dark:border-border">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 dark:bg-card border-b dark:border-border/50 pb-2 pt-2.5 px-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-[13px] font-semibold dark:text-foreground">Active & Upcoming Visitors</CardTitle>
            </div>
            <Badge className="bg-blue-600 dark:bg-blue-600 text-white text-[11px] px-2 py-0.5 self-start sm:self-center">
              {filteredVisitors.length} Visitor{filteredVisitors.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground dark:text-muted-foreground mt-1">
            Showing only visitors with confirmed attendance status (marked via Smart Assistant)
          </p>
          <div className="mt-1.5 p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded text-[11px]">
            <p className="text-green-800 dark:text-green-300">
              <strong>Note:</strong> This page shows only visitors with <strong>participation_status = 'confirmed'</strong>. These are visitors who have marked their attendance through the Smart Assistant.
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-2 px-3 pb-3">
          {filteredVisitors.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-3" />
              <p className="text-lg font-semibold text-muted-foreground">No visitors found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden w-full">
              <div className="max-h-[500px] overflow-y-auto overflow-x-auto w-full">
                <div className="inline-block min-w-full align-middle">
                  <table className="w-full text-sm" style={{ minWidth: '1100px' }}>
                    <thead className="bg-gradient-to-r from-blue-100 to-purple-100 sticky top-0 z-10">
                      <tr>
                        <th className="text-left p-2 font-semibold text-xs whitespace-nowrap">Date</th>
                        <th className="text-left p-2 font-semibold text-xs whitespace-nowrap">Time</th>
                        <th className="text-left p-2 font-semibold text-xs whitespace-nowrap">Visitor</th>
                        <th className="text-left p-2 font-semibold text-xs whitespace-nowrap">Reference</th>
                        <th className="text-left p-2 font-semibold text-xs whitespace-nowrap">Booking</th>
                        <th className="text-left p-2 font-semibold text-xs whitespace-nowrap">Place</th>
                        <th className="text-center p-2 font-semibold text-xs whitespace-nowrap">Current Pass</th>
                        <th className="text-center p-2 font-semibold text-xs whitespace-nowrap">History</th>
                        <th className="text-center p-2 font-semibold text-xs whitespace-nowrap sticky right-[100px] bg-gradient-to-r from-blue-100 to-purple-100 z-10">Status</th>
                        <th className="text-center p-2 font-semibold text-xs whitespace-nowrap sticky right-0 bg-gradient-to-r from-blue-100 to-purple-100 z-10">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVisitors.map((visitor, idx) => (
                      <tr 
                        key={`${visitor.booking_id}-${visitor.member_id}-${idx}`}
                        className={`border-t hover:bg-blue-50 transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        } ${visitor.is_blacklisted ? 'bg-red-50 border-l-4 border-l-red-500' : ''}`}
                      >
                          <td className="p-2 whitespace-nowrap">
                            <div className="space-y-0.5">
                              <p className="font-bold text-xs">
                              {new Date(visitor.booking_date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                              <p className="text-[10px] text-muted-foreground">
                              {new Date(visitor.booking_date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </p>
                          </div>
                        </td>
                        
                          <td className="p-2 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-blue-600" />
                              <p className="font-mono font-bold text-xs">{visitor.time_slot}</p>
                          </div>
                        </td>
                        
                          <td className="p-2">
                            <div className="space-y-0.5">
                              <p className="font-bold text-xs">{visitor.visitor_name}</p>
                              <p className="text-[10px] flex items-center gap-1 truncate max-w-[150px]">
                                <Mail className="h-2.5 w-2.5" />
                              {visitor.visitor_email}
                            </p>
                              <p className="text-[10px] flex items-center gap-1">
                                <Phone className="h-2.5 w-2.5" />
                              {visitor.visitor_phone}
                            </p>
                            {visitor.visitor_company && (
                                <p className="text-[10px] flex items-center gap-1 truncate max-w-[150px]">
                                  <Building2 className="h-2.5 w-2.5" />
                                {visitor.visitor_company}
                              </p>
                            )}
                          </div>
                        </td>
                        
                          <td className="p-2 whitespace-nowrap">
                            <Badge variant="outline" className="font-mono font-bold text-[10px] px-1 py-0">
                            {visitor.reference_type}
                          </Badge>
                            <p className="font-mono text-[10px] font-bold mt-0.5">
                            {visitor.reference_value}
                          </p>
                        </td>
                        
                          <td className="p-2">
                            <p className="font-bold text-xs">{visitor.booking_title}</p>
                          {visitor.booking_ref_id && (
                              <Badge variant="outline" className="text-[10px] mt-0.5 px-1 py-0">
                              {visitor.booking_ref_id}
                            </Badge>
                          )}
                        </td>
                        
                          <td className="p-2 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-green-600" />
                              <p className="font-medium text-xs">{visitor.place_name}</p>
                          </div>
                        </td>
                        
                          <td className="p-2 text-center whitespace-nowrap">
                          <div className="space-y-0.5">
                            {visitor.assigned_pass_number ? (
                              <Badge className="bg-green-500 text-white px-2 py-0.5 font-bold text-[10px]">
                                {visitor.assigned_pass_number}
                              </Badge>
                            ) : visitor.returned_pass_number ? (
                              <>
                                <Badge className="bg-gray-500 text-white px-2 py-0.5 font-bold text-[10px] line-through">
                                  {visitor.returned_pass_number}
                                </Badge>
                                <p className="text-[10px] text-green-600 font-medium">
                                  ✓ Returned
                                </p>
                              </>
                            ) : (
                              <Badge variant="outline" className="text-red-600 text-[10px] px-2 py-0.5">
                                No Pass
                              </Badge>
                            )}
                            {visitor.needs_manual_return && (
                              <div className="mt-0.5">
                                <Badge className="bg-red-100 text-red-800 text-[10px] px-1 py-0">
                                  ⚠ Needs Return
                                </Badge>
                              </div>
                            )}
                          </div>
                        </td>
                        
                          <td className="p-2 text-center whitespace-nowrap">
                            {visitor.historical_assignments && visitor.historical_assignments.length > 0 ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openHistoryDialog(visitor)}
                                className="text-blue-600 hover:bg-blue-50 text-[10px] h-6 px-2"
                                title={`View ${visitor.historical_assignments.length} pass assignment(s)`}
                              >
                                <Eye className="h-2.5 w-2.5 mr-0.5" />
                                {visitor.historical_assignments.length}
                              </Button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">—</span>
                            )}
                          </td>
                        
                          <td className="p-2 text-center whitespace-nowrap sticky right-[100px] bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">
                            <Badge className={`px-2 py-0.5 font-bold text-[10px] ${getStatusColor(visitor.current_status)}`}>
                            {visitor.current_status.toUpperCase()}
                          </Badge>
                        </td>
                        
                          <td className="p-2 text-center whitespace-nowrap sticky right-0 bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">
                            <div className="flex gap-0.5 justify-center">
                            {visitor.assigned_pass_id ? (
                              <>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openReturnDialog(visitor)}
                                    className="border-green-500 text-green-700 hover:bg-green-50 text-[10px] h-6 px-2"
                                >
                                    <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                                  Return
                                </Button>
                                {visitor.current_status !== 'cancelled' && (
                                  <Button 
                                    size="sm"
                                    onClick={() => openAssignDialog(visitor)}
                                      className="text-[10px] h-6 px-2"
                                  >
                                      <CreditCard className="h-2.5 w-2.5 mr-0.5" />
                                    Re-assign
                                  </Button>
                                )}
                              </>
                            ) : visitor.current_status !== 'cancelled' && (
                              <Button 
                                size="sm"
                                onClick={() => openAssignDialog(visitor)}
                                  className="text-[10px] h-6 px-2"
                              >
                                  <CreditCard className="h-2.5 w-2.5 mr-0.5" />
                                Assign
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Return Pass Confirmation Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-900">
              <div className="p-2 bg-orange-100 rounded-full">
                <XCircle className="h-6 w-6 text-orange-600" />
              </div>
              Return Pass
            </DialogTitle>
          </DialogHeader>
          {visitorToReturn && (
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
                <p className="text-sm font-medium text-orange-900 mb-3">
                  Are you sure you want to return this pass?
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pass Number:</span>
                    <Badge className="bg-blue-600 text-white font-bold text-base px-3 py-1">
                      {visitorToReturn.assigned_pass_number}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Visitor:</span>
                    <span className="font-bold">{visitorToReturn.visitor_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Booking:</span>
                    <span className="font-medium">{visitorToReturn.booking_title}</span>
                  </div>
                </div>
              </div>

              {/* Daily Pass History */}
              {visitorToReturn.historical_assignments && visitorToReturn.historical_assignments.length > 0 && (() => {
                const todayAssignments = visitorToReturn.historical_assignments.filter((assignment: any) => {
                  const today = new Date().toISOString().split('T')[0]
                  const assignmentDate = assignment.assigned_date ? assignment.assigned_date.split('T')[0] : null
                  return assignmentDate === today
                })
                
                return (
                  <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-blue-900">Today's Pass History</h3>
                      </div>
                      <Badge className="bg-blue-600 text-white text-sm px-2 py-1">
                        {todayAssignments.length} Pass{todayAssignments.length !== 1 ? 'es' : ''}
                      </Badge>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                    {todayAssignments.map((assignment: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center gap-3">
                            <Badge 
                              className={`px-2 py-1 text-xs ${
                                assignment.action_type === 'assigned' 
                                  ? 'bg-green-500 text-white' 
                                  : assignment.action_type === 'returned'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-500 text-white'
                              }`}
                            >
                              {assignment.action_type.toUpperCase()}
                            </Badge>
                            <div>
                              <p className="font-medium text-sm">{assignment.pass_display_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {assignment.booking_title} - {assignment.booking_date}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {new Date(assignment.assigned_date).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {assignment.actual_return_date && (
                              <p className="text-xs text-green-600">
                                Returned: {new Date(assignment.actual_return_date).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    {todayAssignments.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No other passes assigned today
                      </p>
                    )}
                  </div>
                </div>
                )
              })()}

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-900 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Pass will become available for other visitors immediately
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsReturnDialogOpen(false)
                    setVisitorToReturn(null)
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUnassignPass}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Return
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Pass Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Pass to Visitor</DialogTitle>
          </DialogHeader>
          {selectedVisitor && (
            <div className="space-y-4">
              {/* Visitor Info */}
              <Card className="border-2 bg-blue-50">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Visitor</p>
                  <p className="font-bold text-lg">{selectedVisitor.visitor_name}</p>
                  <p className="text-sm">{selectedVisitor.visitor_email}</p>
                  <p className="text-sm">{selectedVisitor.reference_type}: {selectedVisitor.reference_value}</p>
                  {selectedVisitor.returned_pass_number && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                      <p className="text-xs text-green-800">
                        <strong>Previous Pass:</strong> {selectedVisitor.returned_pass_number} was returned for this booking.
                        You can assign a new pass.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pass Selection */}
              <div>
                <Label>Select Available Pass *</Label>
                <Select value={selectedPassId} onValueChange={setSelectedPassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a pass" />
                  </SelectTrigger>
                  <SelectContent>
                    {passes.filter(p => p.status === 'available' && p.pass_type_id).length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        <p>No available passes.</p>
                        <p className="text-xs mt-1">Go to Pass Types page to create passes.</p>
                      </div>
                    ) : (
                      passes
                        .filter(p => p.status === 'available' && p.pass_type_id)
                        .map(pass => (
                          <SelectItem key={pass.id} value={pass.id}>
                            {pass.pass_display_name} - {pass.pass_type_name || 'Unknown Type'}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  {passes.filter(p => p.status === 'available' && p.pass_type_id).length} available passes
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssignPass}>
                  Assign Pass
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Historical Assignments Dialog - Compact/Detailed View */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={(open) => {
        setIsHistoryDialogOpen(open)
        if (!open) setShowDetailedHistory(false)
      }}>
        <DialogContent className={showDetailedHistory ? "max-w-6xl max-h-[90vh] overflow-y-auto" : "max-w-md max-h-[70vh] overflow-y-auto"}>
          <DialogHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4 text-blue-600" />
                  Pass History - {selectedVisitor?.visitor_name}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {historicalAssignments.length} assignment{historicalAssignments.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDetailedHistory(!showDetailedHistory)}
                className="text-xs h-7 px-2"
              >
                {showDetailedHistory ? (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Compact
                  </>
                ) : (
                  <>
                    <History className="h-3 w-3 mr-1" />
                    Detailed
                  </>
                )}
              </Button>
            </div>
          </DialogHeader>
          
          {historicalAssignments.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">No pass assignments found</p>
            </div>
          ) : showDetailedHistory ? (
            // Detailed Table View
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-[70vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 sticky top-0 z-10">
                    <tr>
                      <th className="text-left p-3 font-semibold text-xs border-b dark:border-border">Pass</th>
                      <th className="text-left p-3 font-semibold text-xs border-b dark:border-border">Type</th>
                      <th className="text-left p-3 font-semibold text-xs border-b dark:border-border">Action</th>
                      <th className="text-left p-3 font-semibold text-xs border-b dark:border-border">Booking</th>
                      <th className="text-left p-3 font-semibold text-xs border-b dark:border-border">Assigned Date</th>
                      <th className="text-left p-3 font-semibold text-xs border-b dark:border-border">Return Date</th>
                      <th className="text-left p-3 font-semibold text-xs border-b dark:border-border">Assigned By</th>
                      <th className="text-center p-3 font-semibold text-xs border-b dark:border-border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicalAssignments.map((assignment, idx) => (
                      <tr 
                        key={assignment.id}
                        className={`border-b dark:border-border ${
                          idx % 2 === 0 
                            ? 'bg-white dark:bg-card' 
                            : 'bg-gray-50/50 dark:bg-gray-800/30'
                        } hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors`}
                      >
                        <td className="p-3">
                          <Badge 
                            className="text-xs px-2 py-1"
                            style={{ 
                              backgroundColor: assignment.pass_type_name === 'VIP Pass' ? '#8b5cf6' : '#3b82f6',
                              color: 'white'
                            }}
                          >
                            {assignment.pass_display_name}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground">{assignment.pass_type_name}</p>
                        </td>
                        <td className="p-3">
                          <Badge 
                            className={
                              assignment.action_type === 'assigned' 
                                ? 'bg-green-500 text-white dark:bg-green-600' 
                                : assignment.action_type === 'returned'
                                ? 'bg-blue-500 text-white dark:bg-blue-600'
                                : 'bg-red-500 text-white dark:bg-red-600'
                            }
                          >
                            {assignment.action_type.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="font-medium text-xs dark:text-foreground">{assignment.booking_title}</p>
                            <p className="text-xs text-muted-foreground dark:text-muted-foreground">{assignment.booking_date}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="text-xs dark:text-foreground">
                            {new Date(assignment.assigned_date).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </td>
                        <td className="p-3">
                          <p className="text-xs dark:text-foreground">
                            {assignment.actual_return_date 
                              ? new Date(assignment.actual_return_date).toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : <span className="text-muted-foreground dark:text-muted-foreground">Not returned</span>
                            }
                          </p>
                        </td>
                        <td className="p-3">
                          <p className="text-xs dark:text-foreground">{assignment.assigned_by_name}</p>
                        </td>
                        <td className="p-3 text-center">
                          {assignment.action_type === 'assigned' && !assignment.actual_return_date && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setIsHistoryDialogOpen(false)
                                openManualReturnDialog(assignment)
                              }}
                              className="text-xs h-7 px-2 text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/30"
                            >
                              Set Return
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            // Compact Card View
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {historicalAssignments.map((assignment, idx) => (
                <div 
                  key={assignment.id}
                  className={`p-2.5 rounded-lg border text-xs ${
                    assignment.action_type === 'assigned' 
                      ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' 
                      : assignment.action_type === 'returned'
                      ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
                      : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge 
                          className="text-[10px] px-1.5 py-0"
                          style={{ 
                            backgroundColor: assignment.pass_type_name === 'VIP Pass' ? '#8b5cf6' : '#3b82f6',
                            color: 'white'
                          }}
                        >
                          {assignment.pass_display_name}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={`text-[9px] px-1 py-0 ${
                            assignment.action_type === 'assigned' 
                              ? 'border-green-500 text-green-700 dark:border-green-400 dark:text-green-300' 
                              : 'border-blue-500 text-blue-700 dark:border-blue-400 dark:text-blue-300'
                          }`}
                        >
                          {assignment.action_type.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground dark:text-muted-foreground truncate">
                        {assignment.booking_title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[9px] text-muted-foreground dark:text-muted-foreground">
                        <span>Assigned: {new Date(assignment.assigned_date).toLocaleDateString()}</span>
                        {assignment.actual_return_date && (
                          <span>• Returned: {new Date(assignment.actual_return_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    {assignment.action_type === 'assigned' && !assignment.actual_return_date && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsHistoryDialogOpen(false)
                          openManualReturnDialog(assignment)
                        }}
                        className="text-[9px] h-5 px-1.5 text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/30"
                      >
                        Return
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                  This pass was physically returned but not systematically marked as returned.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pass:</span>
                    <Badge className="bg-blue-600 text-white font-bold">
                      {selectedAssignment.pass_display_name}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Visitor:</span>
                    <span className="font-bold">{selectedAssignment.holder_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Original Booking:</span>
                    <span className="font-medium">{selectedAssignment.booking_title}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="returnTime">When was the pass actually returned? *</Label>
                <Input
                  id="returnTime"
                  type="datetime-local"
                  value={manualReturnTime}
                  onChange={(e) => setManualReturnTime(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Select the actual date and time when the visitor returned the pass
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
                  Set Return Time
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
