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
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'

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
        <div className="space-y-3 px-2 sm:px-4 max-w-[98vw] mx-auto dark:bg-background">
          {/* Statistics Table - Compact Design */}
          <Card className="dark:bg-card dark:border-border shadow-md">
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="py-2.5 px-4 border-r dark:border-border">
                      <div className="flex items-center gap-2">
                        <Package className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="text-[13px] text-muted-foreground dark:text-muted-foreground">Total Types</p>
                          <p className="text-xl font-bold dark:text-foreground">{totalTypes}</p>
                          <p className="text-[11px] text-muted-foreground dark:text-muted-foreground">{activeTypes} active</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 px-4 border-r dark:border-border">
                      <div className="flex items-center gap-2">
                        <Coffee className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="text-[13px] text-muted-foreground dark:text-muted-foreground">Total Items</p>
                          <p className="text-xl font-bold dark:text-foreground">{totalItems}</p>
                          <p className="text-[11px] text-muted-foreground dark:text-muted-foreground">{activeItems} active</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 px-4 border-r dark:border-border">
                      <div className="flex items-center gap-2">
                        <Utensils className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        <div>
                          <p className="text-[13px] text-muted-foreground dark:text-muted-foreground">Selected Type</p>
                          <p className="text-xl font-bold dark:text-foreground truncate max-w-[120px]">
                            {selectedType ? getTypeName(selectedType) : 'None'}
                          </p>
                          <p className="text-[11px] text-muted-foreground dark:text-muted-foreground">
                            {selectedType ? `${filteredItems.length} items` : 'Click a type'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 px-4 dark:border-border">
                      <div className="flex items-center gap-2">
                        <Search className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                        <div>
                          <p className="text-[13px] text-muted-foreground dark:text-muted-foreground">Filtered Items</p>
                          <p className="text-xl font-bold dark:text-foreground">{filteredItems.length}</p>
                          <p className="text-[11px] text-muted-foreground dark:text-muted-foreground">Currently showing</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Types Section */}
          <Card className="dark:bg-card dark:border-border shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b dark:border-border/50">
              <CardTitle className="flex items-center gap-2 text-[13px] font-semibold dark:text-foreground">
                <Package className="h-4 w-4" />
                Refreshment Types
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground dark:text-muted-foreground" />
                  <Input
                    placeholder="Search types..."
                    value={typeSearchTerm}
                    onChange={(e) => setTypeSearchTerm(e.target.value)}
                    className="pl-8 h-9 text-[13px] w-[200px] dark:bg-card dark:border-border dark:text-foreground"
                  />
                </div>
                <Button onClick={handleCreateType} size="sm" className="h-9 px-3 text-[13px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Type
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 dark:bg-card">
              {isLoading ? (
                <p className="text-center text-muted-foreground dark:text-muted-foreground py-6 text-[13px]">Loading...</p>
              ) : filteredTypes.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground dark:text-muted-foreground mb-3 text-[13px]">
                    {typeSearchTerm ? 'No types found matching your search' : 'No refreshment types found'}
                  </p>
                  <Button onClick={handleCreateType} variant="outline" className="h-8 text-[12px] dark:border-border dark:text-foreground dark:hover:bg-muted">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Create First Type
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-[calc(5*120px)] overflow-y-auto table-scroll-container-vertical">
                  {filteredTypes.map((type) => {
                    const itemCount = getTypeItemCount(type.id)
                    const isSelected = selectedType === type.id
                    return (
                      <Card
                        key={type.id}
                        className={`cursor-pointer transition-all hover:shadow-md dark:bg-card dark:border-border ${
                          isSelected 
                            ? 'ring-2 ring-primary border-primary dark:ring-primary dark:border-primary' 
                            : 'hover:border-primary/50 dark:hover:border-primary/30'
                        }`}
                        onClick={() => setSelectedType(isSelected ? null : type.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-[13px] mb-1 truncate dark:text-foreground">{type.name}</h3>
                              <Badge variant="outline" className="text-[11px] dark:border-border dark:text-foreground">{type.code}</Badge>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 dark:hover:bg-muted"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditType(type)
                                }}
                              >
                                <Edit className="h-3.5 w-3.5 dark:text-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive dark:hover:bg-muted"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteType(type)
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant={type.is_active ? 'default' : 'secondary'} className="text-[11px] dark:border-border dark:text-foreground">
                                {type.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              <span className="text-[11px] text-muted-foreground dark:text-muted-foreground">
                                {itemCount} {itemCount === 1 ? 'item' : 'items'}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0 dark:border-border dark:hover:bg-muted"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCreateItem(type.id)
                              }}
                              title="Add item to this type"
                            >
                              <Plus className="h-3.5 w-3.5 dark:text-foreground" />
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
            <Card className="dark:bg-card dark:border-border shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b dark:border-border/50">
                <div className="flex items-center gap-3">
                  <CardTitle className="flex items-center gap-2 text-[13px] font-semibold dark:text-foreground">
                    <Coffee className="h-4 w-4" />
                    Items - {getTypeName(selectedType)}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedType(null)}
                    className="h-8 px-2 text-[12px] dark:hover:bg-muted"
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Clear
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground dark:text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      value={itemSearchTerm}
                      onChange={(e) => setItemSearchTerm(e.target.value)}
                      className="pl-8 h-9 text-[13px] w-[200px] dark:bg-card dark:border-border dark:text-foreground"
                    />
                  </div>
                  <Button onClick={() => handleCreateItem(selectedType)} size="sm" className="h-9 px-3 text-[13px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 dark:bg-card">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground dark:text-muted-foreground mb-3 text-[13px]">
                      {itemSearchTerm 
                        ? 'No items found matching your search' 
                        : 'No items found for this type'}
                    </p>
                    <Button onClick={() => handleCreateItem(selectedType)} variant="outline" className="h-8 text-[12px] dark:border-border dark:text-foreground dark:hover:bg-muted">
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add First Item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[calc(5*60px)] overflow-y-auto pr-2 table-scroll-container-vertical">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 border rounded-lg hover:bg-accent/50 dark:hover:bg-muted/30 transition-colors dark:border-border"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                            <Utensils className="h-3.5 w-3.5 text-primary dark:text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-[13px] dark:text-foreground">{item.name}</p>
                            <Badge variant={item.is_active ? 'default' : 'secondary'} className="text-[11px] dark:border-border dark:text-foreground">
                              {item.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditItem(item)}
                            className="h-7 px-2 text-[11px] dark:hover:bg-muted"
                          >
                            <Edit className="h-3.5 w-3.5 mr-1.5" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item)}
                            className="h-7 px-2 text-[11px] text-destructive hover:text-destructive dark:hover:bg-muted"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
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
            <Card className="dark:bg-card dark:border-border shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b dark:border-border/50">
                <CardTitle className="flex items-center gap-2 text-[13px] font-semibold dark:text-foreground">
                  <Coffee className="h-4 w-4" />
                  All Items
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground dark:text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      value={itemSearchTerm}
                      onChange={(e) => setItemSearchTerm(e.target.value)}
                      className="pl-8 h-9 text-[13px] w-[200px] dark:bg-card dark:border-border dark:text-foreground"
                    />
                  </div>
                  <Button onClick={() => handleCreateItem()} size="sm" className="h-9 px-3 text-[13px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 dark:bg-card">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground dark:text-muted-foreground mb-3 text-[13px]">
                      {itemSearchTerm ? 'No items found matching your search' : 'No refreshment items found'}
                    </p>
                    <Button onClick={() => handleCreateItem()} variant="outline" className="h-8 text-[12px] dark:border-border dark:text-foreground dark:hover:bg-muted">
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Create First Item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[calc(5*60px)] overflow-y-auto pr-2 table-scroll-container-vertical">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 border rounded-lg hover:bg-accent/50 dark:hover:bg-muted/30 transition-colors dark:border-border"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                            <Utensils className="h-3.5 w-3.5 text-primary dark:text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-[13px] dark:text-foreground">{item.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[11px] dark:border-border dark:text-foreground">
                                {getTypeName(item.type_id)}
                              </Badge>
                              <Badge variant={item.is_active ? 'default' : 'secondary'} className="text-[11px] dark:border-border dark:text-foreground">
                                {item.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedType(item.type_id)
                              handleEditItem(item)
                            }}
                            className="h-7 px-2 text-[11px] dark:hover:bg-muted"
                          >
                            <Edit className="h-3.5 w-3.5 mr-1.5" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item)}
                            className="h-7 px-2 text-[11px] text-destructive hover:text-destructive dark:hover:bg-muted"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
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
          <DialogContent className="dark:bg-card dark:border-border">
            <DialogHeader className="dark:border-border/50">
              <DialogTitle className="dark:text-foreground text-[13px] font-semibold">{editingType ? 'Edit Type' : 'Create New Type'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[13px] dark:text-foreground">Name</Label>
                <Input
                  value={typeFormData.name}
                  onChange={(e) => setTypeFormData({ ...typeFormData, name: e.target.value })}
                  placeholder="e.g., Beverages"
                  className="h-9 text-[13px] dark:bg-card dark:border-border dark:text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] dark:text-foreground">Code</Label>
                <Input
                  value={typeFormData.code}
                  onChange={(e) => setTypeFormData({ ...typeFormData, code: e.target.value })}
                  placeholder="e.g., beverages"
                  className="h-9 text-[13px] dark:bg-card dark:border-border dark:text-foreground"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsTypeDialogOpen(false)} className="h-9 px-3 text-[13px] dark:border-border dark:text-foreground dark:hover:bg-muted">
                  Cancel
                </Button>
                <Button onClick={handleSaveType} className="h-9 px-3 text-[13px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600">
                  {editingType ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Item Dialog */}
        <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
          <DialogContent className="dark:bg-card dark:border-border">
            <DialogHeader className="dark:border-border/50">
              <DialogTitle className="dark:text-foreground text-[13px] font-semibold">{editingItem ? 'Edit Item' : 'Create New Item'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[13px] dark:text-foreground">Type</Label>
                <Select
                  value={itemFormData.type_id}
                  onValueChange={(value) => setItemFormData({ ...itemFormData, type_id: value })}
                >
                  <SelectTrigger className="h-9 text-[13px] dark:bg-card dark:border-border dark:text-foreground">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-card dark:border-border">
                    {types.map((type) => (
                      <SelectItem key={type.id} value={type.id} className="dark:text-foreground dark:hover:bg-muted text-[13px]">
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] dark:text-foreground">Item Name</Label>
                <Input
                  value={itemFormData.name}
                  onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                  placeholder="e.g., Coffee, Tea, Sandwiches"
                  className="h-9 text-[13px] dark:bg-card dark:border-border dark:text-foreground"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsItemDialogOpen(false)} className="h-9 px-3 text-[13px] dark:border-border dark:text-foreground dark:hover:bg-muted">
                  Cancel
                </Button>
                <Button onClick={handleSaveItem} className="h-9 px-3 text-[13px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600">
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
