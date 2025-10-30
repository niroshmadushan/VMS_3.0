"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, CreditCard } from "lucide-react"

interface PassType {
  id: string
  passNumber: string
  title: string
  description: string
  color: string
  isActive: boolean
  createdAt: string
  totalIssued: number
  currentlyActive: number
}

const mockPassTypes: PassType[] = [
  {
    id: "1",
    passNumber: "01",
    title: "Visitor Pass",
    description: "Issued for normal visitors",
    color: "blue",
    isActive: true,
    createdAt: "2024-01-10T10:00:00",
    totalIssued: 45,
    currentlyActive: 12,
  },
  {
    id: "2",
    passNumber: "02",
    title: "VIP Pass",
    description: "Issued for VIP guests and executives",
    color: "gold",
    isActive: true,
    createdAt: "2024-01-10T10:00:00",
    totalIssued: 8,
    currentlyActive: 3,
  },
  {
    id: "3",
    passNumber: "03",
    title: "Contractor Pass",
    description: "Issued for contractors and maintenance staff",
    color: "green",
    isActive: true,
    createdAt: "2024-01-10T10:00:00",
    totalIssued: 23,
    currentlyActive: 7,
  },
]

export function PassTypeManagement() {
  const [passTypes, setPassTypes] = useState<PassType[]>(mockPassTypes)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingPassType, setEditingPassType] = useState<PassType | null>(null)
  const [formData, setFormData] = useState({
    passNumber: "",
    title: "",
    description: "",
    color: "blue",
  })

  const handleCreatePassType = () => {
    const newPassType: PassType = {
      id: Date.now().toString(),
      passNumber: formData.passNumber,
      title: formData.title,
      description: formData.description,
      color: formData.color,
      isActive: true,
      createdAt: new Date().toISOString(),
      totalIssued: 0,
      currentlyActive: 0,
    }
    setPassTypes([...passTypes, newPassType])
    setFormData({ passNumber: "", title: "", description: "", color: "blue" })
    setIsCreateDialogOpen(false)
  }

  const handleEditPassType = (passType: PassType) => {
    setEditingPassType(passType)
    setFormData({
      passNumber: passType.passNumber,
      title: passType.title,
      description: passType.description,
      color: passType.color,
    })
    setIsCreateDialogOpen(true)
  }

  const handleUpdatePassType = () => {
    if (editingPassType) {
      setPassTypes(passTypes.map((pt) => (pt.id === editingPassType.id ? { ...pt, ...formData } : pt)))
      setEditingPassType(null)
      setFormData({ passNumber: "", title: "", description: "", color: "blue" })
      setIsCreateDialogOpen(false)
    }
  }

  const handleDeletePassType = (id: string) => {
    setPassTypes(passTypes.filter((pt) => pt.id !== id))
  }

  const getColorClass = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "gold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "green":
        return "bg-green-100 text-green-800 border-green-200"
      case "red":
        return "bg-red-100 text-red-800 border-red-200"
      case "purple":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pass Type Management</h1>
          <p className="text-muted-foreground">Create and manage different types of visitor passes</p>
        </div>
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open)
            if (!open) {
              setEditingPassType(null)
              setFormData({ passNumber: "", title: "", description: "", color: "blue" })
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Create Pass Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingPassType ? "Edit Pass Type" : "Create Pass Type"}</DialogTitle>
              <DialogDescription>
                {editingPassType ? "Update pass type details" : "Create a new type of visitor pass"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pass-number">Pass Number</Label>
                <Input
                  id="pass-number"
                  placeholder="e.g., 01, 02, 03"
                  value={formData.passNumber}
                  onChange={(e) => setFormData({ ...formData, passNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Visitor Pass, VIP Pass"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="e.g., Issued for normal visitors"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Pass Color</Label>
                <select
                  id="color"
                  className="w-full p-2 border rounded-md"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                >
                  <option value="blue">Blue</option>
                  <option value="gold">Gold</option>
                  <option value="green">Green</option>
                  <option value="red">Red</option>
                  <option value="purple">Purple</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={() => setIsCreateDialogOpen(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={editingPassType ? handleUpdatePassType : handleCreatePassType} className="flex-1">
                  {editingPassType ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pass Types</p>
                <p className="text-2xl font-bold text-foreground">{passTypes.length}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Types</p>
                <p className="text-2xl font-bold text-foreground">{passTypes.filter((pt) => pt.isActive).length}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Issued</p>
                <p className="text-2xl font-bold text-foreground">
                  {passTypes.reduce((sum, pt) => sum + pt.totalIssued, 0)}
                </p>
              </div>
              <div className="h-8 w-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Currently Active</p>
                <p className="text-2xl font-bold text-foreground">
                  {passTypes.reduce((sum, pt) => sum + pt.currentlyActive, 0)}
                </p>
              </div>
              <div className="h-8 w-8 bg-rose-100 rounded-lg flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pass Types List */}
      <Card>
        <CardHeader>
          <CardTitle>Pass Types</CardTitle>
          <CardDescription>Manage all visitor pass types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {passTypes.map((passType) => (
              <div key={passType.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div
                    className={`h-12 w-12 rounded-lg flex items-center justify-center ${getColorClass(passType.color)}`}
                  >
                    <span className="font-bold text-lg">{passType.passNumber}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{passType.title}</h3>
                      <Badge
                        className={passType.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                      >
                        {passType.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{passType.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Total Issued: {passType.totalIssued} • Currently Active: {passType.currentlyActive}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditPassType(passType)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 bg-transparent"
                    onClick={() => handleDeletePassType(passType.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
