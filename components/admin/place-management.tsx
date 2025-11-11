"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Plus, 
  Edit, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Building2, 
  CheckCircle, 
  Clock,
  Phone,
  Mail,
  Users,
  Calendar,
  Loader2,
  Trash2
} from "lucide-react"
import { placeManagementAPI } from "@/lib/place-management-api"
import { format } from "date-fns"
import toast from "react-hot-toast"
interface Place {
  id: string
  name: string
  description: string
  address: string
  city: string
  state: string
  country: string
  place_type: string
  capacity: number
  area_sqft: number
  phone: string
  email: string
  is_active: boolean
  deactivation_reason?: string
  deactivated_at?: string
  created_at: string
}

interface PlaceConfiguration {
  id: string
  place_id: string
  available_monday: boolean
  available_tuesday: boolean
  available_wednesday: boolean
  available_thursday: boolean
  available_friday: boolean
  available_saturday: boolean
  available_sunday: boolean
  start_time: string
  end_time: string
  allow_bookings: boolean
  max_bookings_per_day: number
  booking_slot_duration: number
  created_at: string
  updated_at: string
}

const placeTypes = [
  { value: "office", label: "Office" },
  { value: "warehouse", label: "Warehouse" },
  { value: "factory", label: "Factory" },
  { value: "retail", label: "Retail" },
  { value: "hospital", label: "Hospital" },
  { value: "school", label: "School" },
  { value: "government", label: "Government" },
  { value: "other", label: "Other" }
]

export function PlaceManagement() {
  const [places, setPlaces] = useState<Place[]>([])
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null)
  const [confirmMessage, setConfirmMessage] = useState("")
  const [editingPlace, setEditingPlace] = useState<Place | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    state: "",
    country: "",
    place_type: "",
    capacity: 0,
    area_sqft: 0,
    phone: "",
    email: "",
    is_active: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  
  // Place Configuration State
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
  const [selectedPlaceForConfig, setSelectedPlaceForConfig] = useState<Place | null>(null)
  const [configFormData, setConfigFormData] = useState({
    available_monday: true,
    available_tuesday: true,
    available_wednesday: true,
    available_thursday: true,
    available_friday: true,
    available_saturday: false,
    available_sunday: false,
    start_time: '08:00',
    end_time: '17:00',
    allow_bookings: true,
    max_bookings_per_day: 10,
    booking_slot_duration: 60
  })

  // Calculate active and inactive place counts
  const activePlacesCount = places.filter((place) => place.is_active).length
  const inactivePlacesCount = places.filter((place) => !place.is_active).length
  const totalCapacity = places.reduce((sum, place) => sum + place.capacity, 0)

  // Load places from secure-select API
  const loadPlaces = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('🔄 Loading places...')
      
      // Build options object with only defined values
      const options: any = {
        limit: 100
      }
      
      // Only add filters if they have valid values
      if (typeFilter !== 'all') {
        options.placeType = typeFilter
      }
      
      if (statusFilter !== 'all') {
        options.isActive = statusFilter === 'active'
      }
      
      console.log('📋 API Options:', options)
      
      const placesData = await placeManagementAPI.getPlaces(options)
      
      console.log('✅ Places loaded:', placesData)
      
      setPlaces(placesData)
    } catch (err: any) {
      console.error('❌ Failed to load places:', err)
      const errorMessage = err.message || 'Network error. Please try again.'
      setError(errorMessage)
      
      // Show more helpful error messages
      if (err.message?.includes('No authentication token')) {
        setError('Please login first to view places.')
      } else if (err.message?.includes('Authentication failed')) {
        setError('Your session has expired. Please login again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Filter places when search or filters change
  useEffect(() => {
    filterPlaces()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, searchTerm, statusFilter, typeFilter])

  const filterPlaces = () => {
    let filtered = places

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(place =>
        place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.address.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(place => {
        if (statusFilter === 'active') return place.is_active
        if (statusFilter === 'inactive') return !place.is_active
        return true
      })
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(place => place.place_type === typeFilter)
    }

    setFilteredPlaces(filtered)
  }

  useEffect(() => {
    loadPlaces()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      address: "",
      city: "",
      state: "",
      country: "",
      place_type: "",
      capacity: 0,
      area_sqft: 0,
      phone: "",
      email: "",
      is_active: true,
    })
    setEditingPlace(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setConfirmMessage(editingPlace ? "Are you sure you want to update this place?" : "Are you sure you want to create this place?")
    setConfirmAction(() => async () => {
      try {
        // Clean the form data - remove undefined values and convert empty strings to null
        // Also set email, phone, and city to null for new places (these fields are not in the form)
        const cleanData = Object.entries(formData).reduce((acc, [key, value]) => {
          // For new places, set email, phone, and city to null (not shown in form)
          if (!editingPlace && (key === 'email' || key === 'phone' || key === 'city')) {
            acc[key] = null
          } else if (value !== undefined && value !== '') {
            acc[key] = value
          } else if (value === '') {
            acc[key] = null
          }
          return acc
        }, {} as Record<string, any>)

        console.log('🧹 Cleaned form data:', cleanData)

        if (editingPlace) {
          // Update existing place using secure-update API
          await placeManagementAPI.updateRecord('places', { id: editingPlace.id }, cleanData)
          console.log('✅ Place updated successfully')
          toast.success('Place updated successfully!', {
            position: 'top-center',
            duration: 3000,
            icon: '✅'
          })
        } else {
          // Create new place using secure-insert API
          await placeManagementAPI.insertRecord('places', cleanData)
          console.log('✅ Place created successfully')
          toast.success('Place created successfully!', {
            position: 'top-center',
            duration: 3000,
            icon: '✅'
          })
        }
        
        setIsDialogOpen(false)
        resetForm()
        // Refresh the places list
        await loadPlaces()
      } catch (error) {
        console.error('❌ Failed to save place:', error)
        const errorMessage = error instanceof Error ? error.message : "Failed to save place"
        setError(errorMessage)
        toast.error(errorMessage, {
          position: 'top-center',
          duration: 4000,
          icon: '❌'
        })
      }
    })
    setIsConfirmDialogOpen(true)
  }

  const handleEdit = (place: Place) => {
    setEditingPlace(place)
    setFormData({
      name: place.name,
      description: place.description,
      address: place.address,
      city: place.city,
      state: place.state,
      country: place.country,
      place_type: place.place_type,
      capacity: place.capacity,
      area_sqft: place.area_sqft,
      phone: place.phone,
      email: place.email,
      is_active: place.is_active,
    })
    setIsDialogOpen(true)
  }

  const toggleStatus = (id: string) => {
    const place = places.find((p) => p.id === id)
    if (!place) return
    setConfirmMessage(`Are you sure you want to change the status to ${place.is_active ? "inactive" : "active"}?`)
    setConfirmAction(() => async () => {
      try {
        const newStatus = !place.is_active
        // Update place status using secure-update API
        await placeManagementAPI.updateRecord('places', { id }, { is_active: newStatus })
        console.log('✅ Place status updated successfully')
        toast.success(`Place status changed to ${newStatus ? 'active' : 'inactive'}!`, {
          position: 'top-center',
          duration: 3000,
          icon: '🔄'
        })
        // Refresh the places list
        await loadPlaces()
      } catch (error) {
        console.error('❌ Failed to update status:', error)
        const errorMessage = error instanceof Error ? error.message : "Failed to update status"
        setError(errorMessage)
        toast.error(errorMessage, {
          position: 'top-center',
          duration: 4000,
          icon: '❌'
        })
      }
    })
    setIsConfirmDialogOpen(true)
  }

  const handleDeletePlace = (id: string) => {
    const place = places.find((p) => p.id === id)
    if (!place) return
    setConfirmMessage(`Are you sure you want to delete "${place.name}"? This will mark it as deleted (soft delete).`)
    setConfirmAction(() => async () => {
      try {
        // Soft delete using secure-update API
        await placeManagementAPI.softDeleteRecord('places', id)
        console.log('✅ Place deleted successfully (soft delete)')
        toast.success(`"${place.name}" has been deleted successfully!`, {
          position: 'top-center',
          duration: 3000,
          icon: '🗑️'
        })
        // Refresh the places list
        await loadPlaces()
      } catch (error) {
        console.error('❌ Failed to delete place:', error)
        const errorMessage = error instanceof Error ? error.message : "Failed to delete place"
        setError(errorMessage)
        toast.error(errorMessage, {
          position: 'top-center',
          duration: 4000,
          icon: '❌'
        })
      }
    })
    setIsConfirmDialogOpen(true)
  }

  const handleConfirm = async () => {
    if (confirmAction) {
      await confirmAction()
    }
    setIsConfirmDialogOpen(false)
    setConfirmAction(null)
  }

  const handleOpenConfig = async (place: Place) => {
    try {
      setSelectedPlaceForConfig(place)
      setIsLoading(true)
      
      console.log('⚙️ Loading configuration for place:', place.id, place.name)
      
      // Fetch configuration for this specific place
      const configResponse = await placeManagementAPI.getTableData('place_configuration', {
        filters: [{
          column: 'place_id',
          operator: 'equals',
          value: place.id
        }],
        limit: 1
      })
      
      console.log('📦 Configuration response:', configResponse)
      
      if (configResponse && configResponse.length > 0) {
        const config = configResponse[0]
        console.log('✅ Configuration found for', place.name, ':', config)
        
        // Load configuration data into form
        setConfigFormData({
          available_monday: config.available_monday || false,
          available_tuesday: config.available_tuesday || false,
          available_wednesday: config.available_wednesday || false,
          available_thursday: config.available_thursday || false,
          available_friday: config.available_friday || false,
          available_saturday: config.available_saturday || false,
          available_sunday: config.available_sunday || false,
          start_time: config.start_time ? config.start_time.substring(0, 5) : '08:00',
          end_time: config.end_time ? config.end_time.substring(0, 5) : '17:00',
          allow_bookings: config.allow_bookings !== false,
          max_bookings_per_day: config.max_bookings_per_day || 10,
          booking_slot_duration: config.booking_slot_duration || 60
        })
      } else {
        console.log('⚠️ No configuration found for', place.name, '- using defaults')
        
        // No configuration exists - use defaults
        setConfigFormData({
          available_monday: true,
          available_tuesday: true,
          available_wednesday: true,
          available_thursday: true,
          available_friday: true,
          available_saturday: false,
          available_sunday: false,
          start_time: '08:00',
          end_time: '17:00',
          allow_bookings: true,
          max_bookings_per_day: 10,
          booking_slot_duration: 60
        })
      }
      
      setIsConfigDialogOpen(true)
    } catch (error) {
      console.error('❌ Failed to load configuration:', error)
      toast.error('Failed to load configuration', {
        position: 'top-center',
        duration: 3000,
        icon: '❌'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveConfiguration = async () => {
    if (!selectedPlaceForConfig) return
    
    setConfirmMessage(`Are you sure you want to save the configuration for "${selectedPlaceForConfig.name}"?`)
    setConfirmAction(() => async () => {
      try {
        // Clean the configuration data - remove undefined values and empty strings
        const cleanConfigData = Object.entries(configFormData).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== '') {
            acc[key] = value
          } else if (value === '') {
            acc[key] = null
          }
          return acc
        }, {} as Record<string, any>)
        
        console.log('🧹 Cleaned config data:', cleanConfigData)
        
        // Use UPDATE API with place_id as WHERE condition
        await placeManagementAPI.updateRecord('place_configuration', 
          { place_id: selectedPlaceForConfig.id }, 
          cleanConfigData
        )
        
        console.log('✅ Configuration saved successfully')
        toast.success(`Configuration for "${selectedPlaceForConfig.name}" saved successfully!`, {
          position: 'top-center',
          duration: 3000,
          icon: '⏰'
        })
        setIsConfigDialogOpen(false)
      } catch (error) {
        console.error('❌ Failed to save configuration:', error)
        // If update fails (record doesn't exist), try insert
        if (error instanceof Error && error.message.includes('No records updated')) {
          try {
            console.log('🔄 Configuration not found, creating new one...')
            const cleanConfigData = Object.entries({
              place_id: selectedPlaceForConfig.id,
              ...configFormData
            }).reduce((acc, [key, value]) => {
              if (value !== undefined && value !== '') {
                acc[key] = value
              }
              return acc
            }, {} as Record<string, any>)
            
            await placeManagementAPI.insertRecord('place_configuration', cleanConfigData)
            console.log('✅ Configuration created successfully')
            toast.success(`Configuration for "${selectedPlaceForConfig.name}" created successfully!`, {
              position: 'top-center',
              duration: 3000,
              icon: '⏰'
            })
            setIsConfigDialogOpen(false)
          } catch (insertError) {
            console.error('❌ Failed to create configuration:', insertError)
            const errorMessage = insertError instanceof Error ? insertError.message : "Failed to save configuration"
            setError(errorMessage)
            toast.error(errorMessage, {
              position: 'top-center',
              duration: 4000,
              icon: '❌'
            })
          }
        } else {
          const errorMessage = error instanceof Error ? error.message : "Failed to save configuration"
          setError(errorMessage)
          toast.error(errorMessage, {
            position: 'top-center',
            duration: 4000,
            icon: '❌'
          })
        }
      }
    })
    setIsConfirmDialogOpen(true)
  }

  const handleDayToggle = (day: string) => {
    setConfigFormData({
      ...configFormData,
      [`available_${day.toLowerCase()}`]: !configFormData[`available_${day.toLowerCase()}` as keyof typeof configFormData]
    })
  }

  const getStatusBadge = (place: Place) => {
    if (place.is_active) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
    } else {
      return <Badge variant="destructive">Inactive</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    const colors = {
      office: 'bg-blue-100 text-blue-800',
      warehouse: 'bg-orange-100 text-orange-800',
      factory: 'bg-purple-100 text-purple-800',
      retail: 'bg-green-100 text-green-800',
      hospital: 'bg-red-100 text-red-800',
      school: 'bg-yellow-100 text-yellow-800',
      government: 'bg-gray-100 text-gray-800',
      other: 'bg-gray-100 text-gray-800'
    }
    
    return (
      <Badge variant="outline" className={colors[type as keyof typeof colors] || colors.other}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading places...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Place Management</h1>
          <p className="text-muted-foreground">Manage places and their status</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Places</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{places.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Places</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activePlacesCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Places</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactivePlacesCount}</div>
          </CardContent>
            </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCapacity}</div>
          </CardContent>
            </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search places..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
          </div>
        </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {placeTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div></div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Place
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlace ? "Edit Place" : "Add New Place"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Place Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="place_type">Place Type *</Label>
                  <Select value={formData.place_type} onValueChange={(value) => setFormData({ ...formData, place_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select place type" />
                    </SelectTrigger>
                    <SelectContent>
                      {placeTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    required
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area_sqft">Area (sq ft) *</Label>
                  <Input
                    id="area_sqft"
                    type="number"
                    value={formData.area_sqft}
                    onChange={(e) => setFormData({ ...formData, area_sqft: parseInt(e.target.value) || 0 })}
                    required
                    min="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>{formData.is_active ? "Active" : "Inactive"}</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingPlace ? "Update" : "Create"} Place</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Places ({filteredPlaces.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPlaces.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No places found matching your criteria.
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Name</TableHead>
                    <TableHead className="min-w-[100px]">Type</TableHead>
                    <TableHead className="min-w-[150px]">Location</TableHead>
                    <TableHead className="min-w-[100px]">Capacity</TableHead>
                    <TableHead className="min-w-[120px]">Status</TableHead>
                    <TableHead className="min-w-[120px]">Created</TableHead>
                    <TableHead className="min-w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
              <div className="max-h-[450px] overflow-y-auto">
                <Table className="w-full">
                  <TableBody>
                    {filteredPlaces.map((place) => (
                      <TableRow key={place.id}>
                        <TableCell className="min-w-[200px]">
                          <div>
                            <div className="font-medium">{place.name}</div>
                            <div className="text-sm text-muted-foreground">{place.description}</div>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[100px]">{getTypeBadge(place.place_type)}</TableCell>
                        <TableCell className="min-w-[150px]">
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {place.city}, {place.state}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {place.capacity}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[120px]">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(place)}
                            <Switch
                              checked={place.is_active}
                              onCheckedChange={() => toggleStatus(place.id)}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[120px]">
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(place.created_at), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[150px]">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleOpenConfig(place)}
                              title="Configure availability & hours"
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(place)} title="Edit place">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeletePlace(place.id)}
                              title="Delete place (soft delete)"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirm Action
            </DialogTitle>
          </DialogHeader>
          <p>{confirmMessage}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Place Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Configure Place Availability & Hours
            </DialogTitle>
          </DialogHeader>
          
          {selectedPlaceForConfig && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <h3 className="font-semibold">{selectedPlaceForConfig.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedPlaceForConfig.city}, {selectedPlaceForConfig.state}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold mb-3 block">Available Days for Meetings</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                      <div key={day} className="flex items-center space-x-2 bg-muted p-3 rounded-lg">
                        <input
                          type="checkbox"
                          id={`config_${day}`}
                          checked={configFormData[`available_${day}` as keyof typeof configFormData] as boolean}
                          onChange={() => handleDayToggle(day)}
                          className="rounded border-input w-4 h-4"
                        />
                        <Label htmlFor={`config_${day}`} className="text-sm font-medium capitalize cursor-pointer">
                          {day}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="config_start_time">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Start Time (Opening)
                      </div>
                    </Label>
                    <Input
                      id="config_start_time"
                      type="time"
                      value={configFormData.start_time}
                      onChange={(e) => setConfigFormData({ ...configFormData, start_time: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      When the place opens for bookings (e.g., 8:00 AM)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="config_end_time">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        End Time (Closing)
                      </div>
                    </Label>
                    <Input
                      id="config_end_time"
                      type="time"
                      value={configFormData.end_time}
                      onChange={(e) => setConfigFormData({ ...configFormData, end_time: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      When the place closes for bookings (e.g., 5:00 PM)
                    </p>
                  </div>
                </div>

                <div className="space-y-3 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold">Booking Settings</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow_bookings">Allow Bookings</Label>
                      <p className="text-xs text-muted-foreground">Enable meeting bookings for this place</p>
                    </div>
                    <Switch
                      id="allow_bookings"
                      checked={configFormData.allow_bookings}
                      onCheckedChange={(checked) => setConfigFormData({ ...configFormData, allow_bookings: checked })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="max_bookings">Max Bookings Per Day</Label>
                      <Input
                        id="max_bookings"
                        type="number"
                        min="1"
                        max="100"
                        value={configFormData.max_bookings_per_day}
                        onChange={(e) => setConfigFormData({ ...configFormData, max_bookings_per_day: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="slot_duration">Slot Duration (minutes)</Label>
                      <Select 
                        value={configFormData.booking_slot_duration.toString()} 
                        onValueChange={(value) => setConfigFormData({ ...configFormData, booking_slot_duration: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                          <SelectItem value="180">3 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Summary:</strong> This place will be available for bookings on selected days 
                    between {configFormData.start_time} and {configFormData.end_time}, 
                    with {configFormData.booking_slot_duration} minute time slots.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveConfiguration}>
                  Save Configuration
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}