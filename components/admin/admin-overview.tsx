"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
      console.error('Error loading statistics:', error)
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
      console.error('Error loading recent activity:', error)
    }
  }

  const loadTodaysSchedule = async () => {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0]
      console.log('📅 Loading today\'s schedule for date:', today)
      
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
      console.log('📊 Total bookings fetched:', allBookings.length)
      
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
      
      console.log('✅ Today\'s bookings found:', todaysBookings.length)
      
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
      
      console.log('✅ Schedule items created:', scheduleItems.length)
      setSchedule(scheduleItems)
    } catch (error) {
      console.error('❌ Error loading schedule:', error)
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
      console.error('Error loading alerts:', error)
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'booking_created': return 'bg-blue-500'
      case 'visitor_checkin': return 'bg-green-500'
      case 'user_registered': return 'bg-purple-500'
      case 'capacity_alert': return 'bg-red-500'
      case 'pass_assigned': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-blue-500'
      case 'ongoing': return 'bg-green-500'
      case 'upcoming': return 'bg-orange-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-50'
      case 'medium': return 'border-orange-500 bg-orange-50'
      case 'low': return 'border-yellow-500 bg-yellow-50'
      default: return 'border-gray-500 bg-gray-50'
    }
  }

  const getTrendIcon = (trend: string) => {
    if (trend.startsWith('+')) {
      return <TrendingUp className="h-3 w-3 text-green-600" />
    } else if (trend.startsWith('-')) {
      return <TrendingDown className="h-3 w-3 text-red-600" />
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
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
    { icon: Users, label: "Manage Users", href: "/admin/users", color: "green" },
    { icon: MapPin, label: "Manage Places", href: "/admin/places", color: "purple" },
    { icon: CreditCard, label: "Visitor Passes", href: "/admin/passes", color: "orange" },
  ]

  return (
    <div className="space-y-6 animate-fade-in max-w-full overflow-x-hidden px-2 sm:px-4">
      {/* System Alerts (if any) */}
      {alerts.filter(a => !a.resolved && a.severity === 'high').length > 0 && (
        <Card className="border-2 border-red-500 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="h-5 w-5" />
              System Alerts ({alerts.filter(a => !a.resolved && a.severity === 'high').length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.filter(a => !a.resolved && a.severity === 'high').slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-start gap-2 p-2 bg-white rounded border border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-900">{alert.title}</p>
                    <p className="text-xs text-red-700">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card
            key={stat.title}
            className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 animate-slide-up hover-lift border-2"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold">{stat.value}</div>
                <Badge variant={stat.trend === "up" ? "default" : "secondary"} className="text-xs gap-1">
                  {getTrendIcon(stat.change)}
                  {stat.change}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{stat.description}</p>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent group-hover:via-primary/40 transition-all duration-300" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity - Takes 2 columns */}
        <Card className="lg:col-span-2 animate-scale-in border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b-2">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Recent Activity
            </CardTitle>
            <Badge variant="outline" className="text-xs animate-pulse bg-green-50 border-green-500 text-green-700">
              <Activity className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </CardHeader>
          <CardContent className="space-y-0 pt-4">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin">
                {recentActivity.map((activity, index) => (
                  <div
                    key={activity.id || index}
                    className={`flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group hover-lift border ${
                      activity.urgent ? 'border-red-300 bg-red-50' : 'border-transparent'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${getActivityColor(activity.type)} mt-1.5 group-hover:scale-110 transition-transform flex-shrink-0`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        {activity.urgent && <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">by {activity.user}</p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{activity.relativeTime}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="animate-scale-in border-2" style={{ animationDelay: "200ms" }}>
          <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-blue-50 border-b-2">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 pt-4">
            <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className="h-16 flex items-center justify-start gap-3 bg-card hover:bg-muted border-2 border-border hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] group"
                  variant="outline"
                >
                  <div className={`p-3 rounded-lg bg-${action.color}-50 group-hover:bg-${action.color}-100 transition-colors border-2 border-${action.color}-200`}>
                    <action.icon className={`h-5 w-5 text-${action.color}-600`} />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card className="animate-slide-up border-2" style={{ animationDelay: "300ms" }}>
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Today's Schedule
              {schedule.length > 0 && (
                <Badge className="ml-auto bg-purple-600 text-white">
                  {schedule.length} Bookings
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {schedule.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No bookings scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin">
                {schedule.map((booking) => (
                  <div 
                    key={booking.id} 
                    className="flex items-center gap-3 p-3 rounded-lg border-2 hover:shadow-md transition-all"
                    style={{ borderLeftWidth: '4px', borderLeftColor: booking.color || '#3b82f6' }}
                  >
                    <div className={`w-2 h-12 ${getStatusColor(booking.status)} rounded-full flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{booking.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {booking.place_name} • {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {booking.participants_count} participants
                        </Badge>
                        {booking.external_visitors_count > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {booking.external_visitors_count} visitors
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(booking.status)} text-white text-xs`}>
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card className="animate-slide-up border-2" style={{ animationDelay: "400ms" }}>
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              System Alerts
              {alerts.filter(a => !a.resolved).length > 0 && (
                <Badge className="ml-auto bg-red-600 text-white">
                  {alerts.filter(a => !a.resolved).length} Active
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {alerts.filter(a => !a.resolved).length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <p className="text-sm font-medium text-green-700">All Clear!</p>
                <p className="text-xs text-muted-foreground">No active alerts</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin">
                {alerts.filter(a => !a.resolved).map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`p-3 rounded-lg border-2 ${getAlertColor(alert.severity)}`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                        alert.severity === 'high' ? 'text-red-600' :
                        alert.severity === 'medium' ? 'text-orange-600' :
                        'text-yellow-600'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold">{alert.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                        <Badge 
                          className={`mt-2 text-xs ${
                            alert.severity === 'high' ? 'bg-red-600' :
                            alert.severity === 'medium' ? 'bg-orange-600' :
                            'bg-yellow-600'
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