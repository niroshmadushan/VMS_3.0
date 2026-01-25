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
import { UserCheck, HelpCircle, AlertCircle, Search } from "lucide-react"

export default function AssistantDocumentationPage() {
    return (
        <RouteProtection requiredRole="assistant">
            <DashboardLayout title="Assistant Guide" subtitle="How to use the Smart Assistant Dashboard">
                <div className="max-w-4xl mx-auto space-y-6">
                    <Card className="border-l-4 border-l-purple-500 dark:bg-card dark:border-border">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HelpCircle className="h-5 w-5 text-purple-500" />
                                Assistant Operations Guide
                            </CardTitle>
                            <CardDescription>
                                Manual for marking attendance and managing visitor flow.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Accordion type="single" collapsible className="w-full space-y-4">

                        {/* 1. Mark Attendance */}
                        <AccordionItem value="attendance" className="border rounded-lg bg-card px-4 dark:border-border">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
                                        <UserCheck className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-semibold">Mark Attendance</h3>
                                        <p className="text-sm text-muted-foreground font-normal">Process for verifying visitor arrivals</p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-4 text-base space-y-6">
                                <div className="pl-14 space-y-6">
                                    <p>
                                        The primary function of the Assistant dashboard is to verify visitors and mark their attendance when they arrive for a meeting.
                                    </p>

                                    <div className="space-y-4">
                                        <div className="border-l-2 border-purple-200 pl-4 py-1">
                                            <h5 className="font-medium text-purple-700 dark:text-purple-400">1. Search for Meeting</h5>
                                            <p className="text-muted-foreground text-sm mt-1">
                                                You can find the relevant meeting using one of two methods:
                                            </p>
                                            <ul className="list-disc pl-5 mt-1 text-sm text-muted-foreground">
                                                <li><strong>Meeting ID:</strong> Enter the unique 6-character code (e.g., ABC123) provided to the visitor.</li>
                                                <li><strong>Reference Value:</strong> Enter the visitor's ID number, Passport number, or NIC.</li>
                                            </ul>
                                        </div>

                                        <div className="border-l-2 border-purple-200 pl-4 py-1">
                                            <h5 className="font-medium text-purple-700 dark:text-purple-400">2. Select Visitor</h5>
                                            <p className="text-muted-foreground text-sm mt-1">
                                                Once the meeting is found, you will see a list of external participants invited to that meeting. Locate the specific person standing in front of you.
                                            </p>
                                        </div>

                                        <div className="border-l-2 border-purple-200 pl-4 py-1">
                                            <h5 className="font-medium text-purple-700 dark:text-purple-400">3. Confirm Attendance</h5>
                                            <p className="text-muted-foreground text-sm mt-1">
                                                Click on the visitor's record to verify their details. If everything matches (ID, Name), confirm their attendance. This updates the system in real-time, notifying the host that their guest has arrived.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* 2. General Support */}
                        <AccordionItem value="support" className="border rounded-lg bg-card px-4 dark:border-border">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                                        <HelpCircle className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-semibold">General Support</h3>
                                        <p className="text-sm text-muted-foreground font-normal">Assisting users with the system</p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-4 text-base space-y-6">
                                <div className="pl-14 space-y-6">
                                    <p>
                                        As an Assistant, you play a key role in ensuring a smooth experience for everyone.
                                    </p>

                                    <div className="space-y-4">
                                        <div className="border-l-2 border-blue-200 pl-4 py-1">
                                            <h5 className="font-medium text-blue-700 dark:text-blue-400">Helping Visitors</h5>
                                            <p className="text-muted-foreground text-sm mt-1">
                                                If a visitor does not have their Meeting ID, ask for their standard ID (NIC/Passport) and use the "Reference Value" search. If they are still not found, contact the host directly to verify the booking.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* 3. Troubleshooting */}
                        <AccordionItem value="troubleshooting" className="border rounded-lg bg-card px-4 dark:border-border">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                                        <AlertCircle className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-semibold">Troubleshooting</h3>
                                        <p className="text-sm text-muted-foreground font-normal">Common issues and solutions</p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-4 text-base space-y-6">
                                <div className="pl-14 space-y-6">
                                    <div className="space-y-4">
                                        <div className="border-l-2 border-red-200 pl-4 py-1">
                                            <h5 className="font-medium text-red-700 dark:text-red-400">"Meeting Not Found" Error</h5>
                                            <p className="text-muted-foreground text-sm mt-1">
                                                This usually happens if the meeting date is not <strong>Today</strong>. The Assistant dashboard only processes active check-ins for the current day.
                                            </p>
                                        </div>

                                        <div className="border-l-2 border-red-200 pl-4 py-1">
                                            <h5 className="font-medium text-red-700 dark:text-red-400">System Offline</h5>
                                            <p className="text-muted-foreground text-sm mt-1">
                                                If the system is unresponsive, ensure the device has an active internet connection. Try refreshing the page. If the issue persists, switch to manual logging until the system is back online.
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
