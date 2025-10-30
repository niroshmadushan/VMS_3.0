"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Users, Clock, Calendar, Search, CreditCard, CheckCircle, 
  XCircle, Activity, MapPin, Building2, User, Phone, Mail, Eye, History
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
        const bookingParticipants = participants.filter((p: any) => 
          p.booking_id === booking.id && 
          (p.is_deleted === false || p.is_deleted === 0) && 
          p.member_id &&
          p.participation_status === 'confirmed' // Only show visitors who have confirmed attendance
        )
        
        bookingParticipants.forEach((participant: any) => {
          const member = members.find((m: any) => 
            m.id === participant.member_id && 
            (m.is_deleted === false || m.is_deleted === 0) && 
            (m.is_active === true || m.is_active === 1)
          )
          
          if (!member) return
          
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
          const visitorAssignments = assignments.filter((a: any) => 
            a.holder_reference_id === member.id && 
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
          
          // Check if it's a returned assignment
          const returnedAssignment = bookingAssignment && 
            bookingAssignment.action_type === 'returned' && 
            bookingAssignment.actual_return_date 
            ? bookingAssignment 
            : null
          
          // Check for passes that need manual return (assigned but not returned from past days)
          const needsManualReturn = visitorAssignments.some((a: any) => 
            a.action_type === 'assigned' && 
            a.actual_return_date === null &&
            a.booking_id !== booking.id // Different booking (past booking)
          )
          
          // Also check if pass is currently assigned to this visitor
          const assignedPass = todayAssignment 
            ? allPasses.find((p: any) => p.id === todayAssignment.pass_id) 
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
      const existingAssignments = await placeManagementAPI.getTableData('pass_assignments', { limit: 5000 })
      const existingAssignment = Array.isArray(existingAssignments) ? existingAssignments.find((a: any) => 
        a.pass_id === selectedPassId &&
        a.holder_reference_id === selectedVisitor.member_id &&
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
      const visitorAssignments = assignments.filter((a: any) => a.holder_reference_id === visitor.member_id)
      console.log('👤 All assignments for this visitor:', visitorAssignments.map(a => ({
        id: a.id,
        pass_id: a.pass_id,
        holder_reference_id: a.holder_reference_id,
        holder_name: a.holder_name,
        booking_id: a.booking_id,
        action_type: a.action_type,
        actual_return_date: a.actual_return_date,
        is_deleted: a.is_deleted
      })))
      
      // Try multiple search strategies to find the assignment
      let activeAssignment = null
      
      // Strategy 1: Exact match (pass + visitor + booking)
      let sortedAssignments = assignments
        .filter((a: any) => 
          a.pass_id === visitor.assigned_pass_id &&
          a.holder_reference_id === visitor.member_id &&
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
        sortedAssignments = assignments
          .filter((a: any) => 
            a.pass_id === visitor.assigned_pass_id &&
            a.holder_reference_id === visitor.member_id &&
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
        await placeManagementAPI.insertRecord('pass_assignments', {
          pass_id: visitor.assigned_pass_id,
          pass_type_id: passes.find(p => p.id === visitor.assigned_pass_id)?.pass_type_id,
          pass_number: passes.find(p => p.id === visitor.assigned_pass_id)?.pass_number,
          action_type: 'returned',
          holder_name: visitor.visitor_name,
          holder_contact: visitor.visitor_phone,
          holder_type: 'external',
          holder_reference_id: visitor.member_id,
          holder_id: visitor.member_id,
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
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-blue-700 truncate">All Visitors</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{totalVisitors}</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-lg flex-shrink-0">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-green-700 truncate">Ongoing</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{ongoingCount}</p>
              </div>
              <div className="p-3 bg-green-500 rounded-lg flex-shrink-0">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-orange-700 truncate">Upcoming</p>
                <p className="text-2xl font-bold text-orange-900 mt-1">{upcomingCount}</p>
              </div>
              <div className="p-3 bg-orange-500 rounded-lg flex-shrink-0">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-purple-700 truncate">With Pass</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">{withPassCount}</p>
              </div>
              <div className="p-3 bg-purple-500 rounded-lg flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-red-700 truncate">Need Pass</p>
                <p className="text-2xl font-bold text-red-900 mt-1">{withoutPassCount}</p>
              </div>
              <div className="p-3 bg-red-500 rounded-lg flex-shrink-0">
                <XCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Passes by Type */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Available Passes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {passTypes.map(type => (
              <div 
                key={type.id}
                className="p-3 border-2 rounded-lg text-center min-h-[80px] flex flex-col justify-center"
                style={{ borderColor: type.color + '40', backgroundColor: type.color + '10' }}
              >
                <p className="text-xs font-medium text-muted-foreground truncate">{type.name}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: type.color }}>{type.available_count}</p>
                <p className="text-xs text-muted-foreground">available</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card className="border-2">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone, reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                className="h-10 px-3 text-sm"
              >
                All ({totalVisitors})
              </Button>
              <Button 
                variant={statusFilter === 'ongoing' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('ongoing')}
                className={`h-10 px-3 text-sm ${statusFilter === 'ongoing' ? 'bg-green-500 hover:bg-green-600' : ''}`}
              >
                Ongoing ({ongoingCount})
              </Button>
              <Button 
                variant={statusFilter === 'upcoming' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('upcoming')}
                className={`h-10 px-3 text-sm ${statusFilter === 'upcoming' ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
              >
                Upcoming ({upcomingCount})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visitors Table */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Active & Upcoming Visitors</CardTitle>
            </div>
            <Badge className="bg-blue-600 text-white text-sm px-3 py-1 self-start sm:self-center">
              {filteredVisitors.length} Visitor{filteredVisitors.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Showing today, upcoming bookings, and past bookings with unreturned passes
          </p>
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Only visitors who have confirmed their attendance (participation_status = 'confirmed') are eligible for pass assignment.
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {filteredVisitors.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-3" />
              <p className="text-lg font-semibold text-muted-foreground">No visitors found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px]">
                  <thead className="bg-gradient-to-r from-blue-100 to-purple-100">
                    <tr>
                      <th className="text-left p-3 font-semibold text-sm">Date</th>
                      <th className="text-left p-3 font-semibold text-sm">Time</th>
                      <th className="text-left p-3 font-semibold text-sm">Visitor</th>
                      <th className="text-left p-3 font-semibold text-sm">Reference</th>
                      <th className="text-left p-3 font-semibold text-sm">Booking</th>
                      <th className="text-left p-3 font-semibold text-sm">Place</th>
                      <th className="text-center p-3 font-semibold text-sm">Pass</th>
                      <th className="text-center p-3 font-semibold text-sm">History</th>
                      <th className="text-center p-3 font-semibold text-sm">Status</th>
                      <th className="text-center p-3 font-semibold text-sm">Actions</th>
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
                        <td className="p-3">
                          <div className="space-y-1">
                            <p className="font-bold">
                              {new Date(visitor.booking_date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(visitor.booking_date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </p>
                          </div>
                        </td>
                        
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <p className="font-mono font-bold text-sm">{visitor.time_slot}</p>
                          </div>
                        </td>
                        
                        <td className="p-3">
                          <div className="space-y-1">
                            <p className="font-bold text-sm">{visitor.visitor_name}</p>
                            <p className="text-xs flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {visitor.visitor_email}
                            </p>
                            <p className="text-xs flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {visitor.visitor_phone}
                            </p>
                            {visitor.visitor_company && (
                              <p className="text-xs flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {visitor.visitor_company}
                              </p>
                            )}
                          </div>
                        </td>
                        
                        <td className="p-3">
                          <Badge variant="outline" className="font-mono font-bold text-xs">
                            {visitor.reference_type}
                          </Badge>
                          <p className="font-mono text-xs font-bold mt-1">
                            {visitor.reference_value}
                          </p>
                        </td>
                        
                        <td className="p-3">
                          <p className="font-bold text-sm">{visitor.booking_title}</p>
                          {visitor.booking_ref_id && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {visitor.booking_ref_id}
                            </Badge>
                          )}
                        </td>
                        
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-green-600" />
                            <p className="font-medium text-sm">{visitor.place_name}</p>
                          </div>
                        </td>
                        
                        <td className="p-3 text-center">
                          <div className="space-y-1">
                            {visitor.assigned_pass_number ? (
                              <Badge className="bg-green-500 text-white px-3 py-1 font-bold">
                                {visitor.assigned_pass_number}
                              </Badge>
                            ) : visitor.returned_pass_number ? (
                              <>
                                <Badge className="bg-gray-500 text-white px-3 py-1 font-bold line-through">
                                  {visitor.returned_pass_number}
                                </Badge>
                                <p className="text-xs text-green-600 font-medium">
                                  ✓ Returned
                                </p>
                              </>
                            ) : (
                              <Badge variant="outline" className="text-red-600">
                                No Pass
                              </Badge>
                            )}
                            {visitor.needs_manual_return && (
                              <div className="mt-1">
                                <Badge className="bg-red-100 text-red-800 text-xs">
                                  ⚠ Needs Return
                                </Badge>
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="p-3 text-center">
                          <div className="space-y-1">
                            {visitor.historical_assignments && visitor.historical_assignments.length > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openHistoryDialog(visitor)}
                                className="text-blue-600 hover:bg-blue-50 text-xs h-7"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View ({visitor.historical_assignments.length})
                              </Button>
                            )}
                            {(() => {
                              const todayAssignments = visitor.historical_assignments?.filter((assignment: any) => {
                                const today = new Date().toISOString().split('T')[0]
                                const assignmentDate = assignment.assigned_date ? assignment.assigned_date.split('T')[0] : null
                                return assignmentDate === today
                              }) || []
                              
                              return todayAssignments.length > 1 && (
                                <div className="mt-1">
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                                    {todayAssignments.length} Today
                                  </Badge>
                                </div>
                              )
                            })()}
                            {visitor.needs_manual_return && (
                              <div className="mt-1">
                                <Badge className="bg-orange-100 text-orange-800 text-xs">
                                  Manual Return
                                </Badge>
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="p-3 text-center">
                          <Badge className={`px-3 py-1 font-bold text-xs ${getStatusColor(visitor.current_status)}`}>
                            {visitor.current_status.toUpperCase()}
                          </Badge>
                        </td>
                        
                        <td className="p-3 text-center">
                          <div className="flex gap-1 justify-center">
                            {visitor.assigned_pass_id ? (
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => openReturnDialog(visitor)}
                                className="border-green-500 text-green-700 hover:bg-green-50 text-xs h-7"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Return
                              </Button>
                            ) : visitor.current_status !== 'cancelled' && (
                              <Button 
                                size="sm"
                                onClick={() => openAssignDialog(visitor)}
                                className="text-xs h-7"
                              >
                                <CreditCard className="h-3 w-3 mr-1" />
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

      {/* Historical Assignments Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-6 w-6 text-blue-600" />
              Pass Assignment History - {selectedVisitor?.visitor_name}
            </DialogTitle>
          </DialogHeader>
          
          {historicalAssignments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No pass assignments found</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-medium">Pass</th>
                      <th className="text-left p-3 font-medium">Action</th>
                      <th className="text-left p-3 font-medium">Booking</th>
                      <th className="text-left p-3 font-medium">Assigned Date</th>
                      <th className="text-left p-3 font-medium">Return Date</th>
                      <th className="text-left p-3 font-medium">Assigned By</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicalAssignments.map((assignment, idx) => (
                      <tr 
                        key={assignment.id}
                        className={`border-t ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <td className="p-3">
                          <div>
                            <Badge 
                              className="mb-1"
                              style={{ 
                                backgroundColor: assignment.pass_type_name === 'VIP Pass' ? '#8b5cf6' : '#3b82f6',
                                color: 'white'
                              }}
                            >
                              {assignment.pass_display_name}
                            </Badge>
                            <p className="text-sm text-muted-foreground">{assignment.pass_type_name}</p>
                          </div>
                        </td>
                        
                        <td className="p-3">
                          <Badge 
                            className={
                              assignment.action_type === 'assigned' 
                                ? 'bg-green-500 text-white' 
                                : assignment.action_type === 'returned'
                                ? 'bg-blue-500 text-white'
                                : 'bg-red-500 text-white'
                            }
                          >
                            {assignment.action_type.toUpperCase()}
                          </Badge>
                        </td>
                        
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{assignment.booking_title}</p>
                            <p className="text-sm text-muted-foreground">{assignment.booking_date}</p>
                          </div>
                        </td>
                        
                        <td className="p-3">
                          <p className="text-sm">
                            {new Date(assignment.assigned_date).toLocaleString()}
                          </p>
                        </td>
                        
                        <td className="p-3">
                          <p className="text-sm">
                            {assignment.actual_return_date 
                              ? new Date(assignment.actual_return_date).toLocaleString()
                              : 'Not returned'
                            }
                          </p>
                        </td>
                        
                        <td className="p-3">
                          <p className="text-sm">{assignment.assigned_by_name}</p>
                        </td>
                        
                        <td className="p-3 text-center">
                          {assignment.action_type === 'assigned' && !assignment.actual_return_date && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openManualReturnDialog(assignment)}
                              className="text-orange-600 hover:bg-orange-50"
                            >
                              Set Return Time
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
