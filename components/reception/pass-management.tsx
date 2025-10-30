"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, RotateCcw, User, UserCheck } from "lucide-react"

interface VisitorPass {
  id: string
  passNo: string
  passTitle: string
  assignedTo: string | null
  assignedToId: string | null
  status: "available" | "assigned" | "returned"
  assignedAt: string | null
  returnedAt: string | null
  meetingId: string | null
}

interface CheckedInVisitor {
  id: string
  name: string
  meetingId: string
  meetingTitle: string
  place: string
  time: string
  photo?: string
}

interface ConfirmedVisitor {
  id: string
  name: string
  email: string
  phone: string
  nic: string
  bookingId: string
  bookingTitle: string
  confirmationTime: string
  passAssigned?: string
  status: "confirmed" | "pass-issued" | "checked-in"
}

const initialPasses: VisitorPass[] = [
  {
    id: "1",
    passNo: "VP001",
    passTitle: "Visitor Pass 1",
    assignedTo: "Jane Smith",
    assignedToId: "visitor-2",
    status: "assigned",
    assignedAt: "2024-12-09T10:15:00",
    returnedAt: null,
    meetingId: "MTG002",
  },
  {
    id: "2",
    passNo: "VP002",
    passTitle: "Visitor Pass 2",
    assignedTo: null,
    assignedToId: null,
    status: "available",
    assignedAt: null,
    returnedAt: null,
    meetingId: null,
  },
  {
    id: "3",
    passNo: "VP003",
    passTitle: "Visitor Pass 3",
    assignedTo: null,
    assignedToId: null,
    status: "available",
    assignedAt: null,
    returnedAt: null,
    meetingId: null,
  },
  {
    id: "4",
    passNo: "VP004",
    passTitle: "Visitor Pass 4",
    assignedTo: "David Wilson",
    assignedToId: "visitor-1",
    status: "returned",
    assignedAt: "2024-12-08T09:00:00",
    returnedAt: "2024-12-08T11:00:00",
    meetingId: "MTG001",
  },
]

const checkedInVisitors: CheckedInVisitor[] = [
  {
    id: "visitor-3",
    name: "Robert Brown",
    meetingId: "MTG002",
    meetingTitle: "Client Presentation",
    place: "Board Room",
    time: "2:00 PM",
  },
  {
    id: "visitor-4",
    name: "Sarah Davis",
    meetingId: "MTG003",
    meetingTitle: "Partnership Discussion",
    place: "Meeting Room B",
    time: "11:00 AM",
  },
]

const mockConfirmedVisitors: ConfirmedVisitor[] = [
  {
    id: "1",
    name: "Mike Wilson",
    email: "mike@company.com",
    phone: "+1234567890",
    nic: "123456789V",
    bookingId: "BK001",
    bookingTitle: "Project Review Meeting",
    confirmationTime: "2024-01-15T08:45:00",
    status: "confirmed",
  },
  {
    id: "2",
    name: "Lisa Brown",
    email: "lisa@startup.com",
    phone: "+1234567891",
    nic: "987654321V",
    bookingId: "BK001",
    bookingTitle: "Project Review Meeting",
    confirmationTime: "2024-01-15T09:15:00",
    passAssigned: "VP-01-002",
    status: "pass-issued",
  },
]

export function PassManagement() {
  const [passes, setPasses] = useState<VisitorPass[]>(initialPasses)
  const [confirmedVisitors, setConfirmedVisitors] = useState<ConfirmedVisitor[]>(mockConfirmedVisitors)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedPass, setSelectedPass] = useState<VisitorPass | null>(null)
  const [selectedVisitor, setSelectedVisitor] = useState("")
  const [selectedConfirmedVisitor, setSelectedConfirmedVisitor] = useState<ConfirmedVisitor | null>(null)

  const availablePasses = passes.filter((pass) => pass.status === "available")
  const assignedPasses = passes.filter((pass) => pass.status === "assigned")
  const unassignedVisitors = checkedInVisitors.filter(
    (visitor) => !passes.some((pass) => pass.assignedToId === visitor.id && pass.status === "assigned"),
  )

  const handleAssignPass = (pass: VisitorPass) => {
    setSelectedPass(pass)
    setIsAssignDialogOpen(true)
  }

  const confirmAssignment = () => {
    if (selectedPass && selectedVisitor) {
      const visitor = checkedInVisitors.find((v) => v.id === selectedVisitor)
      if (visitor) {
        setPasses(
          passes.map((pass) =>
            pass.id === selectedPass.id
              ? {
                  ...pass,
                  assignedTo: visitor.name,
                  assignedToId: visitor.id,
                  status: "assigned" as const,
                  assignedAt: new Date().toISOString(),
                  meetingId: visitor.meetingId,
                }
              : pass,
          ),
        )
        setIsAssignDialogOpen(false)
        setSelectedPass(null)
        setSelectedVisitor("")
      }
    }
  }

  const handleAssignToConfirmedVisitor = (visitor: ConfirmedVisitor, passId: string) => {
    const pass = passes.find((p) => p.id === passId)
    if (pass) {
      setPasses((prev) =>
        prev.map((p) =>
          p.id === passId
            ? {
                ...p,
                status: "assigned" as const,
                assignedTo: visitor.name,
                assignedToId: visitor.id,
                assignedAt: new Date().toISOString(),
                meetingId: visitor.bookingId,
              }
            : p,
        ),
      )

      setConfirmedVisitors((prev) =>
        prev.map((v) =>
          v.id === visitor.id ? { ...v, passAssigned: pass.passNo, status: "pass-issued" as const } : v,
        ),
      )
    }
  }

  const handleReturnPass = (passId: string) => {
    setPasses(
      passes.map((pass) =>
        pass.id === passId
          ? {
              ...pass,
              status: "available" as const,
              returnedAt: new Date().toISOString(),
              assignedTo: null,
              assignedToId: null,
              meetingId: null,
            }
          : pass,
      ),
    )
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "available":
        return "secondary"
      case "assigned":
        return "default"
      case "returned":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Pass Management</h2>
          <p className="text-muted-foreground">Assign and track visitor passes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Passes</CardTitle>
            <CreditCard className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availablePasses.length}</div>
            <p className="text-xs text-muted-foreground">Ready for assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assigned Passes</CardTitle>
            <User className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedPasses.length}</div>
            <p className="text-xs text-muted-foreground">Currently in use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unassigned Visitors</CardTitle>
            <User className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unassignedVisitors.length}</div>
            <p className="text-xs text-muted-foreground">Need pass assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed Visitors</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedVisitors.filter((v) => v.status === "confirmed").length}</div>
            <p className="text-xs text-muted-foreground">Waiting for pass</p>
          </CardContent>
        </Card>
      </div>

      {confirmedVisitors.filter((v) => v.status === "confirmed").length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <UserCheck className="h-5 w-5" />
              Confirmed Visitors Awaiting Pass Assignment
            </CardTitle>
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Only visitors who have confirmed their attendance (marked attendance via Smart Assistant) are eligible for pass assignment.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {confirmedVisitors
                .filter((v) => v.status === "confirmed")
                .map((visitor) => (
                  <div
                    key={visitor.id}
                    className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{visitor.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {visitor.email} • {visitor.phone}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {visitor.bookingTitle} • Confirmed: {new Date(visitor.confirmationTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {availablePasses.length > 0 ? (
                        <Select onValueChange={(passId) => handleAssignToConfirmedVisitor(visitor, passId)}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select pass to assign" />
                          </SelectTrigger>
                          <SelectContent>
                            {availablePasses.map((pass) => (
                              <SelectItem key={pass.id} value={pass.id}>
                                {pass.passNo} - {pass.passTitle}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className="text-red-600">
                          No passes available
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {unassignedVisitors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Visitors Awaiting Pass Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unassignedVisitors.map((visitor) => (
                <div key={visitor.id} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                  <div>
                    <p className="font-medium">{visitor.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {visitor.meetingId} • {visitor.place} • {visitor.time}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (availablePasses.length > 0) {
                        setSelectedPass(availablePasses[0])
                        setSelectedVisitor(visitor.id)
                        setIsAssignDialogOpen(true)
                      } else {
                        alert("No passes available for assignment")
                      }
                    }}
                    disabled={availablePasses.length === 0}
                  >
                    Assign Pass
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            All Passes ({passes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pass Details</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Meeting Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {passes.map((pass) => (
                <TableRow key={pass.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{pass.passNo}</p>
                      <p className="text-sm text-muted-foreground">{pass.passTitle}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {pass.assignedTo ? (
                      <div>
                        <p className="font-medium">{pass.assignedTo}</p>
                        {pass.assignedAt && (
                          <p className="text-xs text-muted-foreground">
                            Assigned: {new Date(pass.assignedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {pass.meetingId ? (
                      <p className="text-sm">{pass.meetingId}</p>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(pass.status)}>{pass.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {pass.status === "available" && (
                        <Button size="sm" variant="outline" onClick={() => handleAssignPass(pass)}>
                          Assign
                        </Button>
                      )}
                      {pass.status === "assigned" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReturnPass(pass.id)}
                          className="bg-transparent"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Return
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Visitor Pass</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPass && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedPass.passNo}</p>
                <p className="text-sm text-muted-foreground">{selectedPass.passTitle}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="visitor">Select Visitor</Label>
              <Select value={selectedVisitor} onValueChange={setSelectedVisitor}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a checked-in visitor" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedVisitors.map((visitor) => (
                    <SelectItem key={visitor.id} value={visitor.id}>
                      {visitor.name} - {visitor.meetingId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmAssignment} disabled={!selectedVisitor}>
                Assign Pass
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
