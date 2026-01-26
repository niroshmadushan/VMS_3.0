"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { RouteProtection } from "@/components/auth/route-protection"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, UserCheck, Settings, BarChart3, HelpCircle } from "lucide-react"

export default function StaffDocumentationPage() {
    return (
        <RouteProtection requiredRole="staff">
            <DashboardLayout title="System Documentation" subtitle="Guide on how to use the Visitor Management System">
                <div className="max-w-4xl mx-auto space-y-6">
                    <Card className="border-l-4 border-l-blue-500 dark:bg-card dark:border-border">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HelpCircle className="h-5 w-5 text-blue-500" />
                                VMS Staff Guide
                            </CardTitle>
                            <CardDescription>
                                Welcome to the Visitor Management System. This guide covers all the essential functions available to staff members.
                                Click on any section below to view detailed instructions.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Accordion type="single" collapsible className="w-full space-y-4">

                        {/* 1. Bookings Function */}
                        <AccordionItem value="bookings" className="border rounded-lg bg-card px-4 dark:border-border">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-semibold">How to Book Correctly</h3>
                                        <p className="text-sm text-muted-foreground font-normal">Advanced guide to creating and managing bookings</p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-4 text-base space-y-6">
                                <div className="pl-14 space-y-6">
                                    <p>
                                        The <strong>Bookings</strong> page is your command center for scheduling. This advanced guide ensures you make the most of the system's features and avoid common pitfalls.
                                    </p>

                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-foreground text-lg">Step-by-Step Booking Process</h4>
                                        <div className="space-y-4">
                                            <div className="border-l-2 border-blue-200 pl-4 py-1">
                                                <h5 className="font-medium text-blue-700 dark:text-blue-400">1. Initiation</h5>
                                                <p className="text-muted-foreground text-sm mt-1">Navigate to the <strong>Bookings</strong> tab and click the <Badge variant="outline">New Booking</Badge> button. This opens the booking creation form.</p>
                                            </div>

                                            <div className="border-l-2 border-blue-200 pl-4 py-1">
                                                <h5 className="font-medium text-blue-700 dark:text-blue-400">2. Meeting Details</h5>
                                                <p className="text-muted-foreground text-sm mt-1">
                                                    <strong>Title:</strong> Use a descriptive title (e.g., "Q3 Quarterly Review" instead of "Meeting").<br />
                                                    <strong>Description:</strong> Add agenda items or context here. This is visible to participants in their email invites.
                                                </p>
                                            </div>

                                            <div className="border-l-2 border-blue-200 pl-4 py-1">
                                                <h5 className="font-medium text-blue-700 dark:text-blue-400">3. Scheduling & Location</h5>
                                                <p className="text-muted-foreground text-sm mt-1">
                                                    Select your <strong>Date</strong>, <strong>Start Time</strong>, and <strong>End Time</strong>.
                                                    Then choose a <strong>Place</strong>. The system automatically filters out rooms that are already booked for your selected time slot.
                                                    <em className="block mt-1 text-xs">Note: If a room doesn't appear, it means it's unavailable. Check the "Availability" tab to find free slots.</em>
                                                </p>
                                            </div>

                                            <div className="border-l-2 border-blue-200 pl-4 py-1">
                                                <h5 className="font-medium text-blue-700 dark:text-blue-400">4. Participant Management</h5>
                                                <div className="space-y-2 mt-1">
                                                    <p className="text-muted-foreground text-sm">
                                                        <strong>Internal Employees:</strong> Search and select from the dropdown. They receive calendar notifications.
                                                    </p>
                                                    <p className="text-muted-foreground text-sm">
                                                        <strong>External Visitors:</strong> This is critical for security.
                                                    </p>
                                                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                                                        <li><strong>Recall Past Visitors:</strong> If they have visited before, search by name/NIC to auto-fill details.</li>
                                                        <li><strong>New Visitors:</strong> You must enter their Full Name, valid Email, Phone Number, and ID/NIC/Passport Number.</li>
                                                        <li><strong>QR Codes:</strong> The system sends a unique QR code to the visitor's email, which they use for express check-in at the gate.</li>
                                                    </ul>
                                                </div>
                                            </div>

                                            <div className="border-l-2 border-blue-200 pl-4 py-1">
                                                <h5 className="font-medium text-blue-700 dark:text-blue-400">5. Hospitality Services</h5>
                                                <p className="text-muted-foreground text-sm mt-1">
                                                    Toggle <strong>Refreshments Required</strong> if needed. Specify the type (e.g., "Coffee & Snacks"), serving time, and any dietary restrictions (e.g., "Vegetarian only"). This notifies the pantry team automatically.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md border border-amber-100 dark:border-amber-900/50">
                                        <h4 className="font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                                            <HelpCircle className="h-4 w-4" /> Important Policies
                                        </h4>
                                        <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-300">
                                            <li>Bookings should be made at least <strong>30 minutes</strong> in advance.</li>
                                            <li>Always <strong>Cancel</strong> meetings if they are no longer happening to free up the room for others.</li>
                                            <li>Ensure visitor ID numbers are accurate; security will verify this against the physical ID at the gate.</li>
                                        </ul>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* 2. Timeline Option */}
                        <AccordionItem value="timeline" className="border rounded-lg bg-card px-4 dark:border-border">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
                                        <BarChart3 className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-semibold">Timeline Option</h3>
                                        <p className="text-sm text-muted-foreground font-normal">Visualizing conflicts and optimizing schedule</p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-4 text-base space-y-6">
                                <div className="pl-14 space-y-6">
                                    <p>
                                        The <strong>Timeline</strong> is a powerful visual tool for efficiently planning your day. It transforms your booking data into an interactive, time-scaled Gantt chart.
                                    </p>

                                    <div className="space-y-4">
                                        <div className="border-l-2 border-purple-200 pl-4 py-1">
                                            <h5 className="font-medium text-purple-700 dark:text-purple-400">Strategic Planning</h5>
                                            <p className="text-muted-foreground text-sm mt-1">
                                                Use the timeline to identify "dead zones" in your schedule or find contiguous blocks of free time for deep work. It helps prevent "context switching" by grouping meetings together.
                                            </p>
                                        </div>

                                        <div className="border-l-2 border-purple-200 pl-4 py-1">
                                            <h5 className="font-medium text-purple-700 dark:text-purple-400">Conflict Detection</h5>
                                            <p className="text-muted-foreground text-sm mt-1">
                                                Overlapping meetings appear stacked. If you see a red overlap indicator, you have double-booked yourself. Resolve this by rescheduling immediately.
                                            </p>
                                        </div>

                                        <div className="border-l-2 border-purple-200 pl-4 py-1">
                                            <h5 className="font-medium text-purple-700 dark:text-purple-400">Real-time Status</h5>
                                            <p className="text-muted-foreground text-sm mt-1">
                                                The timeline updates in real-time. A vertical red line indicates the <span className="text-red-500 font-medium">current time</span>, helping you track how much time is left in your current meeting.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-md border border-purple-100 dark:border-purple-900/50">
                                        <strong className="text-purple-800 dark:text-purple-300">Pro Tip:</strong> Hover over any block to see a quick summary (Topic, Venue, Participants) without leaving the view.
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* 3. Availability Option */}
                        <AccordionItem value="availability" className="border rounded-lg bg-card px-4 dark:border-border">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-semibold">Availability Option</h3>
                                        <p className="text-sm text-muted-foreground font-normal">Finding the perfect room efficiently</p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-4 text-base space-y-6">
                                <div className="pl-14 space-y-6">
                                    <p>
                                        Stop guessing which room is free. The <strong>Availability</strong> checker acts as a search engine for physical spaces within the organization.
                                    </p>

                                    <div className="space-y-4">
                                        <div className="border-l-2 border-green-200 pl-4 py-1">
                                            <h5 className="font-medium text-green-700 dark:text-green-400">Advanced Filtering</h5>
                                            <p className="text-muted-foreground text-sm mt-1">
                                                Don't just look for "free" rooms. Filter by <strong>Date</strong> and <strong>Specific Room</strong> to see all bookings for that space. This helps you negotiate swaps with colleagues if you desperately need a specific venue.
                                            </p>
                                        </div>

                                        <div className="border-l-2 border-green-200 pl-4 py-1">
                                            <h5 className="font-medium text-green-700 dark:text-green-400">Understanding Capacity</h5>
                                            <p className="text-muted-foreground text-sm mt-1">
                                                The view displays room details like "Capacity: 10 pax". Never book a 10-person room for a 2-person meeting if smaller pods are available—optimize resource usage for the whole team.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* 4. External Members */}
                        <AccordionItem value="external" className="border rounded-lg bg-card px-4 dark:border-border">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-600 dark:text-orange-400">
                                        <UserCheck className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-semibold">External Members</h3>
                                        <p className="text-sm text-muted-foreground font-normal">Managing your visitor database</p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-4 text-base space-y-6">
                                <div className="pl-14 space-y-6">
                                    <p>
                                        This is your personal directory of frequent visitors (clients, vendors, consultants). Maintaining this database speeds up future bookings significantly.
                                    </p>

                                    <div className="space-y-4">
                                        <div className="border-l-2 border-orange-200 pl-4 py-1">
                                            <h5 className="font-medium text-orange-700 dark:text-orange-400">Data Integrity</h5>
                                            <p className="text-muted-foreground text-sm mt-1">
                                                Ensure Full Names match their government IDs exactly. Mismatches can cause delays at the security gate check-in.
                                            </p>
                                        </div>

                                        <div className="border-l-2 border-orange-200 pl-4 py-1">
                                            <h5 className="font-medium text-orange-700 dark:text-orange-400">Visit History</h5>
                                            <p className="text-muted-foreground text-sm mt-1">
                                                Click on a member to view their log. This is useful for auditing how often a vendor visits or verifying if a client attended a past scheduled meeting.
                                            </p>
                                        </div>

                                        <div className="border-l-2 border-orange-200 pl-4 py-1">
                                            <h5 className="font-medium text-orange-700 dark:text-orange-400">Privacy & Maintenance</h5>
                                            <p className="text-muted-foreground text-sm mt-1">
                                                If a contact leaves their company or no longer visits, please remove them to keep the database compliant with data privacy regulations.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* 5. Settings */}
                        <AccordionItem value="settings" className="border rounded-lg bg-card px-4 dark:border-border">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
                                        <Settings className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-semibold">Settings</h3>
                                        <p className="text-sm text-muted-foreground font-normal">Personalization and security</p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-4 text-base space-y-6">
                                <div className="pl-14 space-y-6">
                                    <p>
                                        Tailor the VMS experience to your workflow and ensure account security.
                                    </p>

                                    <div className="space-y-4">
                                        <div className="border-l-2 border-gray-300 pl-4 py-1">
                                            <h5 className="font-medium text-gray-700 dark:text-gray-300">Theme Management</h5>
                                            <p className="text-muted-foreground text-sm mt-1">
                                                Toggle between <strong>Light</strong> and <strong>Dark</strong> modes. Dark mode is recommended for low-light environments to reduce eye strain.
                                            </p>
                                        </div>

                                        <div className="border-l-2 border-gray-300 pl-4 py-1">
                                            <h5 className="font-medium text-gray-700 dark:text-gray-300">Notification Preferences</h5>
                                            <p className="text-muted-foreground text-sm mt-1">
                                                Control how you receive alerts (Email vs In-App). We recommend keeping Email enabled for critical booking confirmations and cancellations.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                    </Accordion>
                </div>
            </DashboardLayout>
        </RouteProtection>
    )
}
