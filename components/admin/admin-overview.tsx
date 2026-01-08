"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { 
  Users, MapPin, Calendar, UserCheck, TrendingUp, TrendingDown, Clock, 
  AlertCircle, Plus, Eye, Activity, CheckCircle, XCircle, Loader2,
  CreditCard, Building2, BarChart3
} from "lucide-react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { placeManagementAPI } from "@/lib/place-management-api"

interface DashboardStatistics {
  overview: {
    totalUsers: number
    activeUsers: number
    totalPlaces: number
    activePlaces: number
    todaysBookings: number
    ongoingBookings: number
    upcomingBookings: number
    todaysVisitors: number
    checkedInVisitors: number
    expectedVisitors: number
  }
  trends: {
    usersGrowth: string
    bookingsGrowth: string
    visitorsGrowth: string
    placesUtilization: string
  }
}

interface Activity {
  id: string
  type: string
  title: string
  description: string
  user: string
  timestamp: string
  relativeTime: string
  urgent: boolean
}

interface ScheduleItem {
  id: string
  title: string
  place_name: string
  start_time: string
  end_time: string
  status: string
  responsible_person: string
  participants_count: number
  external_visitors_count: number
  color: string
}

interface Alert {
  id: string
  type: string
  severity: string
  title: string
  message: string
  timestamp: string
  resolved: boolean
}

import { API_BASE_URL } from '@/lib/api-config'

const API_BASE = API_BASE_URL

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken')
  return {
    'Authorization': `Bearer ${token}`
  }
}

export function AdminOverview() {
  const router = useRouter()
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null)
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    
    // Auto-refresh intervals
    const statsInterval = setInterval(() => loadStatistics(), 60000) // 60 seconds
    const activityInterval = setInterval(() => loadRecentActivity(), 30000) // 30 seconds
    const scheduleInterval = setInterval(() => loadTodaysSchedule(), 60000) // 60 seconds
    const alertsInterval = setInterval(() => loadAlerts(), 30000) // 30 seconds
    
    return () => {
      clearInterval(statsInterval)
      clearInterval(activityInterval)
      clearInterval(scheduleInterval)
      clearInterval(alertsInterval)
    }
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    await Promise.all([
      loadStatistics(),
      loadRecentActivity(),
      loadTodaysSchedule(),
      loadAlerts()
    ])
    setIsLoading(false)
  }

  const loadStatistics = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/dashboard/statistics`, {
        headers: getAuthHeaders()
      })
      const result = await response.json()
      if (result.success) {
        setStatistics(result.data)
      }
    } catch (error) {
      // Silent fail - statistics will remain null
    }
  }

  const loadRecentActivity = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/dashboard/recent-activity?limit=20`, {
        headers: getAuthHeaders()
      })
      const result = await response.json()
      if (result.success) {
        setRecentActivity(result.data.activities || [])
      }
    } catch (error) {
      // Silent fail - recent activity will remain empty
    }
  }

  const loadTodaysSchedule = async () => {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0]
      
      // Fetch all bookings (not deleted)
      const bookingsResponse = await placeManagementAPI.getTableData('bookings', {
        filters: [
          { field: 'is_deleted', operator: '=', value: 0 }
        ],
        limit: 200,
        sortBy: 'start_time',
        sortOrder: 'asc'
      })
      
      const allBookings = Array.isArray(bookingsResponse) ? bookingsResponse : []
      
      // Filter bookings for today
      const todaysBookings = allBookings.filter((booking: any) => {
        let bookingDate = booking.booking_date
        
        // Normalize date format
        if (bookingDate) {
          if (typeof bookingDate === 'string') {
            if (bookingDate.includes('T')) {
              // ISO format with timezone - extract local date
              const dateObj = new Date(bookingDate)
              const year = dateObj.getFullYear()
              const month = String(dateObj.getMonth() + 1).padStart(2, '0')
              const day = String(dateObj.getDate()).padStart(2, '0')
              bookingDate = `${year}-${month}-${day}`
            } else if (bookingDate.includes(' ')) {
              bookingDate = bookingDate.split(' ')[0]
            }
          } else if (bookingDate instanceof Date) {
            const year = bookingDate.getFullYear()
            const month = String(bookingDate.getMonth() + 1).padStart(2, '0')
            const day = String(bookingDate.getDate()).padStart(2, '0')
            bookingDate = `${year}-${month}-${day}`
          }
        }
        
        return bookingDate === today
      })
      
      // Fetch participants count for each booking
      const participantsResponse = await placeManagementAPI.getTableData('booking_participants', {
        limit: 500
      })
      const allParticipants = Array.isArray(participantsResponse) ? participantsResponse : []
      
      // Fetch external participants count
      const externalResponse = await placeManagementAPI.getTableData('external_participants', {
        limit: 500
      })
      const allExternals = Array.isArray(externalResponse) ? externalResponse : []
      
      // Transform to ScheduleItem format
      const scheduleItems: ScheduleItem[] = todaysBookings.map((booking: any) => {
        // Count participants for this booking
        const participantsCount = allParticipants.filter((p: any) => 
          p.booking_id === booking.id && (p.is_deleted === false || p.is_deleted === 0)
        ).length
        
        const externalCount = allExternals.filter((p: any) => 
          p.booking_id === booking.id && (p.is_deleted === false || p.is_deleted === 0)
        ).length
        
        // Determine status color
        let status = booking.status || 'upcoming'
        let color = '#3b82f6' // default blue
        
        if (status === 'completed') {
          color = '#3b82f6' // blue
        } else if (status === 'ongoing' || status === 'in-progress') {
          color = '#10b981' // green
        } else if (status === 'upcoming' || status === 'pending') {
          color = '#f59e0b' // orange
        } else if (status === 'cancelled') {
          color = '#ef4444' // red
        }
        
        return {
          id: booking.id,
          title: booking.title || 'Untitled Booking',
          place_name: booking.place_name || 'Unknown Place',
          start_time: booking.start_time || '00:00:00',
          end_time: booking.end_time || '00:00:00',
          status: status,
          responsible_person: booking.responsible_person_name || booking.responsible_person_email || 'N/A',
          participants_count: participantsCount,
          external_visitors_count: externalCount,
          color: color
        }
      })
      
      setSchedule(scheduleItems)
    } catch (error) {
      toast.error('Failed to load today\'s schedule', {
        position: 'top-center',
        duration: 3000,
        icon: '❌'
      })
    }
  }

  const loadAlerts = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/dashboard/alerts?severity=all`, {
        headers: getAuthHeaders()
      })
      const result = await response.json()
      if (result.success) {
        setAlerts(result.data.alerts || [])
      }
    } catch (error) {
      // Silent fail - alerts will remain empty
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'booking_created': return 'bg-blue-500 dark:bg-blue-600'
      case 'visitor_checkin': return 'bg-green-500 dark:bg-green-600'
      case 'user_registered': return 'bg-purple-500 dark:bg-purple-600'
      case 'capacity_alert': return 'bg-red-500 dark:bg-red-600'
      case 'pass_assigned': return 'bg-orange-500 dark:bg-orange-600'
      default: return 'bg-gray-500 dark:bg-gray-600'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-blue-500 dark:bg-blue-600'
      case 'ongoing': return 'bg-green-500 dark:bg-green-600'
      case 'upcoming': return 'bg-orange-500 dark:bg-orange-600'
      case 'cancelled': return 'bg-red-500 dark:bg-red-600'
      default: return 'bg-gray-500 dark:bg-gray-600'
    }
  }

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-950/20'
      case 'medium': return 'border-orange-500 dark:border-orange-600 bg-orange-50 dark:bg-orange-950/20'
      case 'low': return 'border-yellow-500 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-950/20'
      default: return 'border-gray-500 dark:border-gray-600 bg-gray-50 dark:bg-gray-950/20'
    }
  }

  const getTrendIcon = (trend: string) => {
    if (trend.startsWith('+')) {
      return <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
    } else if (trend.startsWith('-')) {
      return <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 dark:bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-600 dark:text-blue-400 mb-3" />
          <p className="text-muted-foreground dark:text-muted-foreground text-[13px]">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const stats = [
    {
      title: "Total Users",
      value: statistics?.overview.totalUsers || 0,
      change: statistics?.trends.usersGrowth || "0%",
      description: `${statistics?.overview.activeUsers || 0} active users`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: "up",
    },
    {
      title: "Active Places",
      value: `${statistics?.overview.activePlaces || 0}/${statistics?.overview.totalPlaces || 0}`,
      change: statistics?.trends.placesUtilization || "0%",
      description: "Room utilization",
      icon: MapPin,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: "up",
    },
    {
      title: "Today's Bookings",
      value: statistics?.overview.todaysBookings || 0,
      change: statistics?.trends.bookingsGrowth || "0%",
      description: `${statistics?.overview.ongoingBookings || 0} ongoing, ${statistics?.overview.upcomingBookings || 0} upcoming`,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      trend: "up",
    },
    {
      title: "Visitors Today",
      value: statistics?.overview.todaysVisitors || 0,
      change: statistics?.trends.visitorsGrowth || "0%",
      description: `${statistics?.overview.checkedInVisitors || 0} checked in, ${statistics?.overview.expectedVisitors || 0} expected`,
      icon: UserCheck,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      trend: "up",
    },
  ]

  const quickActions = [
    { icon: Users, label: "Manage Users", href: "/admin/users", color: "green", bgColor: "bg-green-50 dark:bg-green-950/20", hoverBg: "group-hover:bg-green-100 dark:group-hover:bg-green-950/30", borderColor: "border-green-200 dark:border-green-800", iconColor: "text-green-600 dark:text-green-400" },
    { icon: MapPin, label: "Manage Places", href: "/admin/places", color: "purple", bgColor: "bg-purple-50 dark:bg-purple-950/20", hoverBg: "group-hover:bg-purple-100 dark:group-hover:bg-purple-950/30", borderColor: "border-purple-200 dark:border-purple-800", iconColor: "text-purple-600 dark:text-purple-400" },
    { icon: CreditCard, label: "Visitor Passes", href: "/admin/passes", color: "orange", bgColor: "bg-orange-50 dark:bg-orange-950/20", hoverBg: "group-hover:bg-orange-100 dark:group-hover:bg-orange-950/30", borderColor: "border-orange-200 dark:border-orange-800", iconColor: "text-orange-600 dark:text-orange-400" },
  ]

  return (
    <div className="space-y-3 px-2 sm:px-4 max-w-[98vw] mx-auto dark:bg-background animate-fade-in">
      {/* System Alerts (if any) */}
      {alerts.filter(a => !a.resolved && a.severity === 'high').length > 0 && (
        <Card className="border-2 border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-950/20 shadow-md">
          <CardHeader className="pb-2 pt-2.5">
            <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-400 text-[13px] font-semibold">
              <AlertCircle className="h-3.5 w-3.5" />
              System Alerts ({alerts.filter(a => !a.resolved && a.severity === 'high').length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2.5 dark:bg-red-950/20">
            <div className="space-y-1.5">
              {alerts.filter(a => !a.resolved && a.severity === 'high').slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-start gap-2 p-2 bg-white dark:bg-red-950/30 rounded border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-red-900 dark:text-red-300">{alert.title}</p>
                    <p className="text-[11px] text-red-700 dark:text-red-400">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Table - Compact Design */}
      <Card className="border shadow-md dark:bg-card dark:border-border">
        <CardContent className="p-0">
          <Table>
            <TableBody>
              <TableRow className="hover:bg-transparent">
                {stats.map((stat, index) => (
                  <TableCell key={stat.title} className={`py-2.5 px-4 ${index < stats.length - 1 ? 'border-r dark:border-border' : ''}`}>
                    <div className="flex items-center gap-1.5">
                      <div className={`p-2 rounded-lg ${stat.bgColor} dark:bg-opacity-20`}>
                        <stat.icon className={`h-3.5 w-3.5 ${stat.color} dark:text-opacity-80`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-muted-foreground dark:text-muted-foreground">{stat.title}</p>
                        <div className="flex items-baseline gap-1.5">
                          <p className="text-xl font-bold dark:text-foreground">{stat.value}</p>
                          <Badge variant={stat.trend === "up" ? "default" : "secondary"} className="text-[11px] gap-0.5 dark:border-border dark:text-foreground">
                            {getTrendIcon(stat.change)}
                            {stat.change}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground dark:text-muted-foreground mt-0.5">{stat.description}</p>
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Recent Activity - Takes 2 columns */}
        <Card className="lg:col-span-2 border shadow-md dark:bg-card dark:border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-2.5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 dark:bg-card border-b dark:border-border/50">
            <CardTitle className="flex items-center gap-2 text-[13px] font-semibold dark:text-foreground">
              <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              Recent Activity
            </CardTitle>
            <Badge variant="outline" className="text-[11px] animate-pulse bg-green-50 dark:bg-green-950/30 border-green-500 dark:border-green-600 text-green-700 dark:text-green-400">
              <Activity className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </CardHeader>
          <CardContent className="space-y-0 pt-2.5 dark:bg-card">
            {recentActivity.length === 0 ? (
              <div className="text-center py-6">
                <Clock className="h-10 w-10 mx-auto text-muted-foreground dark:text-muted-foreground mb-2" />
                <p className="text-[13px] text-muted-foreground dark:text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[calc(7*60px)] overflow-y-auto pr-2 table-scroll-container-vertical">
                {recentActivity.map((activity, index) => (
                  <div
                    key={activity.id || index}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors border ${
                      activity.urgent ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20' : 'border-transparent dark:border-border'
                    }`}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${getActivityColor(activity.type)} dark:opacity-80 mt-1.5 transition-transform flex-shrink-0`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[13px] font-medium truncate dark:text-foreground">{activity.title}</p>
                        {activity.urgent && <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400 flex-shrink-0" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground dark:text-muted-foreground truncate">{activity.description}</p>
                      <p className="text-[11px] text-muted-foreground dark:text-muted-foreground mt-0.5">by {activity.user}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground dark:text-muted-foreground flex-shrink-0">{activity.relativeTime}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border shadow-md dark:bg-card dark:border-border">
          <CardHeader className="pb-2 pt-2.5 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 dark:bg-card border-b dark:border-border/50">
            <CardTitle className="flex items-center gap-2 text-[13px] font-semibold dark:text-foreground">
              <Plus className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 pt-2.5 dark:bg-card">
            <div className="grid grid-cols-1 gap-2 max-h-[calc(7*60px)] overflow-y-auto pr-2 table-scroll-container-vertical">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className="h-12 flex items-center justify-start gap-2.5 bg-card dark:bg-card hover:bg-muted dark:hover:bg-muted/50 border-2 border-border dark:border-border hover:border-primary/50 dark:hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] group cursor-pointer"
                  variant="outline"
                >
                  <div className={`p-2 rounded-lg ${action.bgColor} ${action.hoverBg} transition-colors border ${action.borderColor}`}>
                    <action.icon className={`h-4 w-4 ${action.iconColor}`} />
                  </div>
                  <span className="text-[13px] font-medium dark:text-foreground">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Today's Schedule */}
        <Card className="border shadow-md dark:bg-card dark:border-border">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 dark:bg-card border-b dark:border-border/50 pb-2 pt-2.5">
            <CardTitle className="text-[13px] font-semibold flex items-center gap-2 dark:text-foreground">
              <Calendar className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              Today's Schedule
              {schedule.length > 0 && (
                <Badge className="ml-auto bg-purple-600 dark:bg-purple-600 text-white text-[11px]">
                  {schedule.length} Bookings
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2.5 dark:bg-card">
            {schedule.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="h-10 w-10 mx-auto text-muted-foreground dark:text-muted-foreground mb-2" />
                <p className="text-[13px] text-muted-foreground dark:text-muted-foreground">No bookings scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[calc(7*60px)] overflow-y-auto pr-2 table-scroll-container-vertical">
                {schedule.map((booking) => (
                  <div 
                    key={booking.id} 
                    className="flex items-center gap-2.5 p-2.5 rounded-lg border hover:shadow-md dark:hover:shadow-lg transition-all dark:border-border"
                    style={{ borderLeftWidth: '3px', borderLeftColor: booking.color || '#3b82f6' }}
                  >
                    <div className={`w-1.5 h-10 ${getStatusColor(booking.status)} dark:opacity-80 rounded-full flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold truncate dark:text-foreground">{booking.title}</p>
                      <p className="text-[11px] text-muted-foreground dark:text-muted-foreground truncate">
                        {booking.place_name} • {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="outline" className="text-[11px] dark:border-border dark:text-foreground">
                          {booking.participants_count} participants
                        </Badge>
                        {booking.external_visitors_count > 0 && (
                          <Badge variant="outline" className="text-[11px] dark:border-border dark:text-foreground">
                            {booking.external_visitors_count} visitors
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(booking.status)} dark:opacity-90 text-white text-[11px]`}>
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card className="border shadow-md dark:bg-card dark:border-border">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 dark:bg-card border-b dark:border-border/50 pb-2 pt-2.5">
            <CardTitle className="text-[13px] font-semibold flex items-center gap-2 dark:text-foreground">
              <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
              System Alerts
              {alerts.filter(a => !a.resolved).length > 0 && (
                <Badge className="ml-auto bg-red-600 dark:bg-red-600 text-white text-[11px]">
                  {alerts.filter(a => !a.resolved).length} Active
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2.5 dark:bg-card">
            {alerts.filter(a => !a.resolved).length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="h-10 w-10 mx-auto text-green-500 dark:text-green-400 mb-2" />
                <p className="text-[13px] font-medium text-green-700 dark:text-green-400">All Clear!</p>
                <p className="text-[11px] text-muted-foreground dark:text-muted-foreground">No active alerts</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[calc(7*60px)] overflow-y-auto pr-2 table-scroll-container-vertical">
                {alerts.filter(a => !a.resolved).map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`p-2.5 rounded-lg border-2 ${getAlertColor(alert.severity)} dark:border-opacity-50`}
                  >
                    <div className="flex items-start gap-1.5">
                      <AlertCircle className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${
                        alert.severity === 'high' ? 'text-red-600 dark:text-red-400' :
                        alert.severity === 'medium' ? 'text-orange-600 dark:text-orange-400' :
                        'text-yellow-600 dark:text-yellow-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold dark:text-foreground">{alert.title}</p>
                        <p className="text-[11px] text-muted-foreground dark:text-muted-foreground mt-0.5">{alert.message}</p>
                        <Badge 
                          className={`mt-1.5 text-[11px] ${
                            alert.severity === 'high' ? 'bg-red-600 dark:bg-red-600' :
                            alert.severity === 'medium' ? 'bg-orange-600 dark:bg-orange-600' :
                            'bg-yellow-600 dark:bg-yellow-600'
                          } text-white`}
                        >
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}