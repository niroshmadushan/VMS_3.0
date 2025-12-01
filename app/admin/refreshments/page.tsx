"use client"

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Utensils, Plus, Edit, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { RouteProtection } from '@/components/auth/route-protection'
import { placeManagementAPI } from '@/lib/place-management-api'

interface RefreshmentType {
  id: string
  name: string
  code: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

interface RefreshmentItem {
  id: string
  type_id: string
  name: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export default function RefreshmentManagementPage() {
  const [types, setTypes] = useState<RefreshmentType[]>([])
  const [items, setItems] = useState<RefreshmentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>('')
  
  // Type management
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<RefreshmentType | null>(null)
  const [typeFormData, setTypeFormData] = useState({ name: '', code: '' })
  
  // Item management
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<RefreshmentItem | null>(null)
  const [itemFormData, setItemFormData] = useState({ name: '', type_id: '' })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedType) {
      loadItems(selectedType)
    } else {
      loadItems()
    }
  }, [selectedType])

  const loadData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([loadTypes(), loadItems()])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load refreshment data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadTypes = async () => {
    try {
      const response = await placeManagementAPI.getTableData('refreshment_types', {
        is_deleted: 'false'
      })
      const data = Array.isArray(response) ? response : response?.data || []
      setTypes(data)
    } catch (error) {
      console.error('Error loading types:', error)
      // If table doesn't exist, initialize with default types
      if (types.length === 0) {
        setTypes([
          { id: '1', name: 'Beverages', code: 'beverages', is_active: true },
          { id: '2', name: 'Light Snacks', code: 'light_snacks', is_active: true },
          { id: '3', name: 'Full Meal', code: 'full_meal', is_active: true },
          { id: '4', name: 'Custom', code: 'custom', is_active: true },
        ])
      }
    }
  }

  const loadItems = async (typeId?: string) => {
    try {
      const filters: any = { is_deleted: 'false' }
      if (typeId) {
        filters.type_id = typeId
      }
      const response = await placeManagementAPI.getTableData('refreshment_items', filters)
      const data = Array.isArray(response) ? response : response?.data || []
      setItems(data)
    } catch (error) {
      console.error('Error loading items:', error)
      setItems([])
    }
  }

  const handleCreateType = () => {
    setEditingType(null)
    setTypeFormData({ name: '', code: '' })
    setIsTypeDialogOpen(true)
  }

  const handleEditType = (type: RefreshmentType) => {
    setEditingType(type)
    setTypeFormData({ name: type.name, code: type.code })
    setIsTypeDialogOpen(true)
  }

  const handleSaveType = async () => {
    if (!typeFormData.name || !typeFormData.code) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      if (editingType) {
        // Update existing type
        await placeManagementAPI.updateRecord('refreshment_types', { id: editingType.id }, {
          name: typeFormData.name,
          code: typeFormData.code,
          updated_at: new Date().toISOString()
        })
        toast.success('Refreshment type updated successfully')
      } else {
        // Create new type
        const newType = {
          id: `type_${Date.now()}`,
          name: typeFormData.name,
          code: typeFormData.code,
          is_active: true,
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        await placeManagementAPI.insertRecord('refreshment_types', newType)
        toast.success('Refreshment type created successfully')
      }
      setIsTypeDialogOpen(false)
      loadTypes()
    } catch (error: any) {
      console.error('Error saving type:', error)
      toast.error(error?.message || 'Failed to save refreshment type')
    }
  }

  const handleDeleteType = async (type: RefreshmentType) => {
    if (!confirm(`Are you sure you want to delete "${type.name}"?`)) return

    try {
      await placeManagementAPI.updateRecord('refreshment_types', { id: type.id }, {
        is_deleted: true,
        updated_at: new Date().toISOString()
      })
      toast.success('Refreshment type deleted successfully')
      loadTypes()
    } catch (error: any) {
      console.error('Error deleting type:', error)
      toast.error(error?.message || 'Failed to delete refreshment type')
    }
  }

  const handleCreateItem = () => {
    if (!selectedType && types.length > 0) {
      toast.error('Please select a refreshment type first')
      return
    }
    setEditingItem(null)
    setItemFormData({ name: '', type_id: selectedType || types[0]?.id || '' })
    setIsItemDialogOpen(true)
  }

  const handleEditItem = (item: RefreshmentItem) => {
    setEditingItem(item)
    setItemFormData({ name: item.name, type_id: item.type_id })
    setIsItemDialogOpen(true)
  }

  const handleSaveItem = async () => {
    if (!itemFormData.name || !itemFormData.type_id) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      if (editingItem) {
        // Update existing item
        await placeManagementAPI.updateRecord('refreshment_items', { id: editingItem.id }, {
          name: itemFormData.name,
          type_id: itemFormData.type_id,
          updated_at: new Date().toISOString()
        })
        toast.success('Refreshment item updated successfully')
      } else {
        // Create new item
        const newItem = {
          id: `item_${Date.now()}`,
          name: itemFormData.name,
          type_id: itemFormData.type_id,
          is_active: true,
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        await placeManagementAPI.insertRecord('refreshment_items', newItem)
        toast.success('Refreshment item created successfully')
      }
      setIsItemDialogOpen(false)
      loadItems(selectedType || undefined)
    } catch (error: any) {
      console.error('Error saving item:', error)
      toast.error(error?.message || 'Failed to save refreshment item')
    }
  }

  const handleDeleteItem = async (item: RefreshmentItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return

    try {
      await placeManagementAPI.updateRecord('refreshment_items', { id: item.id }, {
        is_deleted: true,
        updated_at: new Date().toISOString()
      })
      toast.success('Refreshment item deleted successfully')
      loadItems(selectedType || undefined)
    } catch (error: any) {
      console.error('Error deleting item:', error)
      toast.error(error?.message || 'Failed to delete refreshment item')
    }
  }

  const filteredItems = selectedType 
    ? items.filter(item => item.type_id === selectedType)
    : items

  const getTypeName = (typeId: string) => {
    return types.find(t => t.id === typeId)?.name || 'Unknown'
  }

  return (
    <RouteProtection requiredRole="admin">
      <DashboardLayout
        title="Refreshment Management"
        subtitle="Manage refreshment types and items for bookings"
      >
        <div className="space-y-6">
          {/* Refreshment Types Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Refreshment Types
              </CardTitle>
              <Button onClick={handleCreateType} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Type
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-muted-foreground py-4">Loading...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {types.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No refreshment types found
                        </TableCell>
                      </TableRow>
                    ) : (
                      types.map((type) => (
                        <TableRow key={type.id}>
                          <TableCell className="font-medium">{type.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{type.code}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={type.is_active ? 'default' : 'secondary'}>
                              {type.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditType(type)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteType(type)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Refreshment Items Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Refreshment Items
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    {types.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleCreateItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-muted-foreground py-4">Loading...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          {selectedType ? 'No items found for selected type' : 'No refreshment items found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getTypeName(item.type_id)}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.is_active ? 'default' : 'secondary'}>
                              {item.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditItem(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteItem(item)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Type Dialog */}
        <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingType ? 'Edit Type' : 'Create New Type'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={typeFormData.name}
                  onChange={(e) => setTypeFormData({ ...typeFormData, name: e.target.value })}
                  placeholder="e.g., Beverages"
                />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={typeFormData.code}
                  onChange={(e) => setTypeFormData({ ...typeFormData, code: e.target.value })}
                  placeholder="e.g., beverages"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsTypeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveType}>
                  {editingType ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Item Dialog */}
        <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Item' : 'Create New Item'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={itemFormData.type_id}
                  onValueChange={(value) => setItemFormData({ ...itemFormData, type_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input
                  value={itemFormData.name}
                  onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                  placeholder="e.g., Coffee, Tea, Sandwiches"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveItem}>
                  {editingItem ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </RouteProtection>
  )
}

