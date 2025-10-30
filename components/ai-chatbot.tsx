"use client"

import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  Sparkles,
  ExternalLink,
  Calendar,
  MapPin,
  Users,
  FileText,
  ChevronDown,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  links?: { title: string; url: string }[]
  suggestions?: string[]
}

const systemKnowledge = {
  availability: {
    keywords: ["available", "availability", "free", "check", "slots", "when", "time slots", "open"],
    info: "You can check place availability at /admin/availability. Select a place and date to see available time slots, existing bookings, utilization rates, and free hours. The system shows real-time analytics and lets you quickly create bookings from available slots.",
    links: [
      { title: "Check Availability", url: "/admin/availability" },
      { title: "Create New Booking", url: "/admin/bookings/new" }
    ]
  },
  bookings: {
    keywords: ["booking", "reserve", "schedule", "meeting", "room", "place"],
    info: "Create bookings at /admin/bookings/new. Bookings require: date, place, time slot, responsible person. You can add internal employees and external participants, request refreshments, and the system prevents double-booking automatically.",
    links: [
      { title: "Create New Booking", url: "/admin/bookings/new" },
      { title: "View All Bookings", url: "/admin/bookings" },
      { title: "Update Booking", url: "/admin/bookings/update" }
    ]
  },
  places: {
    keywords: ["place", "room", "location", "venue", "hall", "office", "conference"],
    info: "Manage places at /admin/places. You can add new places, configure operating hours (day-specific), set capacity limits, define booking slots (30/60 min), and activate/deactivate places. Each place has detailed analytics and utilization tracking.",
    links: [
      { title: "Manage Places", url: "/admin/places" },
      { title: "Check Availability", url: "/admin/availability" }
    ]
  },
  users: {
    keywords: ["user", "employee", "staff", "admin", "reception", "account", "manage users"],
    info: "User Management at /admin/users provides complete control: view all users with pagination, search by name/email, filter by role (admin/reception/employee) and status (active/inactive). You can update user profiles, activate/deactivate accounts, send password resets, and view detailed analytics including role distribution and recent activity.",
    links: [
      { title: "Manage Users", url: "/admin/users" }
    ]
  },
  visitors: {
    keywords: ["visitor", "guest", "external", "client", "vendor", "today's visitors"],
    info: "Visitor management at /admin/passes shows today's visitors with booking details, pass assignments, and check-in status. You can assign/return visitor passes, view visitor history, and track all external participants. The system includes duplicate prevention and member search.",
    links: [
      { title: "Today's Visitors & Passes", url: "/admin/passes" },
      { title: "External Members", url: "/admin/external-members" }
    ]
  },
  externalMembers: {
    keywords: ["external member", "member", "directory", "company", "visitor database"],
    info: "External Members at /admin/external-members is a comprehensive visitor database with analytics dashboard. Features: search members, view visit history, track companies, blacklist management, duplicate prevention (email/phone/company), and detailed member profiles with booking participation history.",
    links: [
      { title: "External Members", url: "/admin/external-members" }
    ]
  },
  passes: {
    keywords: ["pass", "visitor pass", "badge", "vip pass", "pass type", "pass assignment"],
    info: "Pass Management system includes: Pass Types (/admin/pass-types) to create pass categories with number ranges (e.g., VP-001 to VP-020), Visitor Passes (/admin/passes) to assign/return passes to today's visitors, and Pass History (/admin/pass-history) to track all assignments with overdue detection and manual return options.",
    links: [
      { title: "Pass Types", url: "/admin/pass-types" },
      { title: "Visitor Passes", url: "/admin/passes" },
      { title: "Pass History", url: "/admin/pass-history" }
    ]
  },
  timeline: {
    keywords: ["timeline", "today", "schedule", "agenda", "live", "now", "current"],
    info: "Timeline View at /admin/timeline shows today's bookings in real-time with color-coded status indicators (🟠 upcoming, 🟢 ongoing, 🔵 completed). Ongoing bookings have animated effects and 'LIVE NOW' badges. Perfect for monitoring current activities.",
    links: [
      { title: "View Timeline", url: "/admin/timeline" }
    ]
  },
  dashboard: {
    keywords: ["dashboard", "overview", "statistics", "analytics", "metrics", "stats"],
    info: "Admin Dashboard at /admin shows real-time statistics: total users, active places, today's bookings, visitors count with growth trends. Features live activity feed (auto-refresh every 30s), today's schedule, system alerts, and quick action buttons. All data updates automatically.",
    links: [
      { title: "View Dashboard", url: "/admin" }
    ]
  },
  settings: {
    keywords: ["settings", "profile", "password", "theme", "preferences", "account"],
    info: "Settings at /admin/settings has 3 tabs: Profile (edit name/email/phone with OTP verification), Security (password reset via email), and Preferences (theme switcher: Light/Dark/System). All changes save instantly with proper validation.",
    links: [
      { title: "My Settings", url: "/admin/settings" }
    ]
  },
  participants: {
    keywords: ["participant", "attendee", "guest", "people", "invite", "employee"],
    info: "Add participants to bookings: Internal (select from employee list) and External (enter details or search existing members). System prevents duplicates, tracks visit counts, and maintains complete history. Smart update logic handles adding/removing participants efficiently.",
    links: []
  },
  status: {
    keywords: ["status", "pending", "upcoming", "ongoing", "completed", "cancelled"],
    info: "Booking statuses update automatically: 'upcoming' before start, 'ongoing' during meeting, 'completed' after end. You can manually cancel bookings. Status shown with color badges throughout the system.",
    links: []
  },
  refreshments: {
    keywords: ["refreshment", "food", "drinks", "catering", "beverages", "tea", "coffee", "snacks"],
    info: "Request refreshments for bookings: beverages, snacks, breakfast, lunch, or full catering. Specify serving time (15-min intervals) and estimated count. Managed by reception team.",
    links: []
  },
  feedback: {
    keywords: ["feedback", "comment", "suggestion", "complaint", "review"],
    info: "Feedback system at /admin/feedback collects user suggestions and complaints. View all feedback with status tracking and response management.",
    links: [
      { title: "View Feedback", url: "/admin/feedback" }
    ]
  },
  calendar: {
    keywords: ["calendar", "month view", "week view", "schedule view"],
    info: "Calendar view shows bookings in monthly/weekly format with visual timeline. Color-coded by status, shows conflicts, and provides quick booking creation.",
    links: [
      { title: "View Calendar", url: "/admin/calendar" }
    ]
  },
  help: {
    keywords: ["help", "how", "what", "guide", "tutorial", "support"],
    info: "I can help with: bookings, places, users, visitors, passes, timeline, dashboard, settings, and more. Ask specific questions like 'How do I assign a pass?' or 'Show me today's visitors'.",
    links: []
  }
}

const quickSuggestions = [
  "How do I check availability?",
  "Is the conference room available?",
  "Show me today's visitors",
  "How do I create a new booking?",
  "How do I assign a visitor pass?",
  "How do I manage external members?",
  "What is the Timeline View?",
  "How do I manage users?",
  "Show me dashboard statistics",
  "How do I update my profile?",
  "How do I reset my password?",
  "What are pass types?",
  "Show me pass history",
  "How do I add refreshments?",
  "Where can I see today's schedule?"
]

export function AIChatbot() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Hi! I'm your SMART VMS Assistant. I have complete knowledge of all system features:\n\n📊 Dashboard & Analytics\n📅 Bookings & Availability\n🏢 Places & Locations\n👥 Users & Visitors\n🎫 Pass Management\n⚙️ Settings & Preferences\n\nAsk me anything about the system!",
      timestamp: new Date(),
      suggestions: quickSuggestions.slice(0, 3)
    }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('jwt_token')
      setIsLoggedIn(!!token)
    }
    
    checkAuth()
    
    // Check auth status every 5 seconds
    const interval = setInterval(checkAuth, 5000)
    
    return () => clearInterval(interval)
  }, [])

  // Hide chatbot on login and public pages
  const publicPages = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/']
  const hiddenPaths = ['/smart-assistant', '/assistant']
  const shouldHideChatbot = publicPages.includes(pathname) || hiddenPaths.includes(pathname) || !isLoggedIn

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Don't render chatbot if user is not logged in or on public pages
  if (shouldHideChatbot) {
    return null
  }

  const generateAIResponse = (userMessage: string): Message => {
    const lowerMessage = userMessage.toLowerCase()
    
    // Special handling for place-specific availability queries
    const placeNames = [
      "conference room", "meeting room", "main office", "training room", 
      "board room", "hall", "auditorium", "office"
    ]
    
    const isAvailabilityQuery = lowerMessage.includes("available") || 
                                lowerMessage.includes("free") || 
                                lowerMessage.includes("book") ||
                                lowerMessage.includes("slot")
    
    const mentionedPlace = placeNames.find(place => lowerMessage.includes(place))
    
    if (isAvailabilityQuery && mentionedPlace) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: `To check if ${mentionedPlace} is available, please:\n\n1. Go to the Availability page\n2. Select "${mentionedPlace.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}" from the dropdown\n3. Choose your desired date\n4. Click "Check Availability"\n\nYou'll see:\n✅ Available time slots\n📊 Utilization rate\n⏱️ Free hours\n📅 Existing bookings\n\nClick any available slot to create a booking instantly!`,
        timestamp: new Date(),
        links: [
          { title: "Check Availability Now", url: "/admin/availability" },
          { title: "Create New Booking", url: "/admin/bookings/new" }
        ],
        suggestions: [
          "How do I create a booking?",
          "Show me today's bookings",
          "What is the Timeline View?"
        ]
      }
    }
    
    // General availability query without specific place
    if (isAvailabilityQuery) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: "To check availability:\n\n1. Visit the Availability page\n2. Select any place from the dropdown\n3. Choose your desired date\n4. Click 'Check Availability'\n\nYou'll see real-time analytics:\n📊 Total bookings vs available slots\n📈 Utilization percentage\n⏰ Available time slots (clickable to book)\n📅 Existing bookings with details\n\nIt's a powerful way to find the perfect time for your meeting!",
        timestamp: new Date(),
        links: [
          { title: "Check Availability", url: "/admin/availability" },
          { title: "View All Places", url: "/admin/place-management" }
        ],
        suggestions: [
          "Is the conference room available?",
          "How do I create a booking?",
          "Show me today's bookings"
        ]
      }
    }
    
    let bestMatch: { category: string; data: any } | null = null
    let highestScore = 0

    // Find best matching category
    Object.entries(systemKnowledge).forEach(([category, data]) => {
      const score = data.keywords.filter(keyword => 
        lowerMessage.includes(keyword)
      ).length
      
      if (score > highestScore) {
        highestScore = score
        bestMatch = { category, data }
      }
    })

    // Generate response based on match
    if (bestMatch && highestScore > 0) {
      const relatedSuggestions = quickSuggestions.filter(s => 
        !s.toLowerCase().includes(bestMatch.category)
      ).slice(0, 2)

      return {
        id: Date.now().toString(),
        role: "assistant",
        content: bestMatch.data.info,
        timestamp: new Date(),
        links: bestMatch.data.links.length > 0 ? bestMatch.data.links : undefined,
        suggestions: relatedSuggestions
      }
    }

    // Default response if no match - provide comprehensive system overview
    return {
      id: Date.now().toString(),
      role: "assistant",
      content: "I'm here to help with the SMART VMS System! Here's what I can assist you with:\n\n📊 **Dashboard & Analytics**\n• Real-time statistics and trends\n• System performance monitoring\n• Activity feed and alerts\n\n📅 **Bookings Management**\n• Create, edit, cancel bookings\n• Check availability by place and date\n• View timeline and schedule\n\n🏢 **Places & Locations**\n• Manage meeting rooms and venues\n• Configure operating hours and capacity\n• Track utilization rates\n\n👥 **Users & Visitors**\n• Manage system users (admin/reception/employee)\n• Track external members and companies\n• View visitor history and analytics\n\n🎫 **Pass Management**\n• Create pass types and number ranges\n• Assign/return visitor passes\n• Track pass history and overdue items\n\n⚙️ **Settings & Preferences**\n• Update your profile information\n• Change email with OTP verification\n• Reset password and theme preferences\n\nWhat would you like to know more about?",
      timestamp: new Date(),
      suggestions: [
        "Show me today's visitors",
        "How do I check availability?",
        "What's on the dashboard?"
      ]
    }
  }

  const handleSendMessage = () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simulate AI thinking
    setTimeout(() => {
      const aiResponse = generateAIResponse(input)
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 800)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    setTimeout(() => handleSendMessage(), 100)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            className="h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-110"
            size="lg"
          >
            <div className="relative">
              <MessageCircle className="h-7 w-7 text-white" />
              <Sparkles className="h-4 w-4 text-yellow-300 absolute -top-2 -right-2 animate-pulse" />
            </div>
          </Button>
        )}

        {/* Chat Window */}
        {isOpen && (
          <Card className="w-[400px] h-[600px] shadow-2xl border-2 border-purple-200 flex flex-col">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-between rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bot className="h-8 w-8" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h3 className="font-bold text-lg">VMS Assistant</h3>
                  <p className="text-xs text-blue-100">Always here to help</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    message.role === "user" 
                      ? "bg-gradient-to-br from-green-400 to-green-600" 
                      : "bg-gradient-to-br from-blue-400 to-purple-600"
                  )}>
                    {message.role === "user" ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={cn(
                    "flex flex-col gap-2 max-w-[280px]",
                    message.role === "user" ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "rounded-2xl px-4 py-3 shadow-sm",
                      message.role === "user"
                        ? "bg-gradient-to-br from-green-500 to-green-600 text-white"
                        : "bg-white border border-gray-200"
                    )}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>

                    {/* Links */}
                    {message.links && message.links.length > 0 && (
                      <div className="space-y-2 w-full">
                        {message.links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.url}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm text-blue-700 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span className="font-medium">{link.title}</span>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="space-y-1 w-full">
                        <p className="text-xs text-gray-500 px-2">Suggested questions:</p>
                        {message.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full text-left px-3 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs text-purple-700 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}

                    <span className="text-xs text-gray-400 px-2">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-white rounded-b-lg">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask me anything..."
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isTyping}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </>
  )
}

