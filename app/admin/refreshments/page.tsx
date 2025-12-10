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
import { Utensils, Plus, Edit, Trash2, Search, X, Package, Coffee } from 'lucide-react'
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
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [typeSearchTerm, setTypeSearchTerm] = useState('')
  const [itemSearchTerm, setItemSearchTerm] = useState('')
  
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
    loadItems()
  }, [])

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

  const loadItems = async () => {
    try {
      const filters: any = { is_deleted: 'false' }
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
        await placeManagementAPI.updateRecord('refreshment_types', { id: editingType.id }, {
          name: typeFormData.name,
          code: typeFormData.code,
          updated_at: new Date().toISOString()
        })
        toast.success('Refreshment type updated successfully')
      } else {
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
      if (selectedType === type.id) {
        setSelectedType(null)
      }
      loadTypes()
      loadItems()
    } catch (error: any) {
      console.error('Error deleting type:', error)
      toast.error(error?.message || 'Failed to delete refreshment type')
    }
  }

  const handleCreateItem = (typeId?: string) => {
    if (types.length === 0) {
      toast.error('Please create a refreshment type first')
      return
    }
    setEditingItem(null)
    setItemFormData({ name: '', type_id: typeId || selectedType || types[0]?.id || '' })
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
        await placeManagementAPI.updateRecord('refreshment_items', { id: editingItem.id }, {
          name: itemFormData.name,
          type_id: itemFormData.type_id,
          updated_at: new Date().toISOString()
        })
        toast.success('Refreshment item updated successfully')
      } else {
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
      loadItems()
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
      loadItems()
    } catch (error: any) {
      console.error('Error deleting item:', error)
      toast.error(error?.message || 'Failed to delete refreshment item')
    }
  }

  // Filter types by search term
  const filteredTypes = types.filter(type => 
    type.name.toLowerCase().includes(typeSearchTerm.toLowerCase()) ||
    type.code.toLowerCase().includes(typeSearchTerm.toLowerCase())
  )

  // Filter items by selected type and search term
  const filteredItems = items.filter(item => {
    const matchesType = !selectedType || item.type_id === selectedType
    const matchesSearch = item.name.toLowerCase().includes(itemSearchTerm.toLowerCase())
    return matchesType && matchesSearch
  })

  const getTypeName = (typeId: string) => {
    return types.find(t => t.id === typeId)?.name || 'Unknown'
  }

  const getTypeItemCount = (typeId: string) => {
    return items.filter(item => item.type_id === typeId && !item.is_active === false).length
  }

  const totalTypes = types.length
  const totalItems = items.length
  const activeTypes = types.filter(t => t.is_active).length
  const activeItems = items.filter(i => i.is_active).length

  return (
    <RouteProtection requiredRole="admin">
      <DashboardLayout
        title="Refreshment Management"
        subtitle="Manage refreshment types and items for bookings"
      >
        <div className="space-y-6">
          {/* Statistics Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Types</p>
                    <p className="text-2xl font-bold">{totalTypes}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activeTypes} active</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                    <p className="text-2xl font-bold">{totalItems}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activeItems} active</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <Coffee className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Selected Type</p>
                    <p className="text-2xl font-bold">
                      {selectedType ? getTypeName(selectedType) : 'None'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedType ? `${filteredItems.length} items` : 'Click a type card'}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <Utensils className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Filtered Items</p>
                    <p className="text-2xl font-bold">{filteredItems.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Currently showing</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                    <Search className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Types Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Refreshment Types
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search types..."
                    value={typeSearchTerm}
                    onChange={(e) => setTypeSearchTerm(e.target.value)}
                    className="pl-9 w-[250px]"
                  />
                </div>
                <Button onClick={handleCreateType} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Type
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-muted-foreground py-8">Loading...</p>
              ) : filteredTypes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    {typeSearchTerm ? 'No types found matching your search' : 'No refreshment types found'}
                  </p>
                  <Button onClick={handleCreateType} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Type
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredTypes.map((type) => {
                    const itemCount = getTypeItemCount(type.id)
                    const isSelected = selectedType === type.id
                    return (
                      <Card
                        key={type.id}
                        className={`cursor-pointer transition-all hover:shadow-lg ${
                          isSelected 
                            ? 'ring-2 ring-primary border-primary' 
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedType(isSelected ? null : type.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">{type.name}</h3>
                              <Badge variant="outline" className="text-xs">{type.code}</Badge>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditType(type)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteType(type)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant={type.is_active ? 'default' : 'secondary'}>
                                {type.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {itemCount} {itemCount === 1 ? 'item' : 'items'}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCreateItem(type.id)
                              }}
                              title="Add item to this type"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items Section - Only show when a type is selected */}
          {selectedType && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <Coffee className="h-5 w-5" />
                    Items - {getTypeName(selectedType)}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedType(null)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Selection
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      value={itemSearchTerm}
                      onChange={(e) => setItemSearchTerm(e.target.value)}
                      className="pl-9 w-[250px]"
                    />
                  </div>
                  <Button onClick={() => handleCreateItem(selectedType)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {filteredItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      {itemSearchTerm 
                        ? 'No items found matching your search' 
                        : 'No items found for this type'}
                    </p>
                    <Button onClick={() => handleCreateItem(selectedType)} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Utensils className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <Badge variant={item.is_active ? 'default' : 'secondary'} className="text-xs">
                              {item.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditItem(item)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Show all items if no type selected */}
          {!selectedType && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Coffee className="h-5 w-5" />
                  All Items
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      value={itemSearchTerm}
                      onChange={(e) => setItemSearchTerm(e.target.value)}
                      className="pl-9 w-[250px]"
                    />
                  </div>
                  <Button onClick={() => handleCreateItem()} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {filteredItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      {itemSearchTerm ? 'No items found matching your search' : 'No refreshment items found'}
                    </p>
                    <Button onClick={() => handleCreateItem()} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Utensils className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {getTypeName(item.type_id)}
                              </Badge>
                              <Badge variant={item.is_active ? 'default' : 'secondary'} className="text-xs">
                                {item.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedType(item.type_id)
                              handleEditItem(item)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
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
