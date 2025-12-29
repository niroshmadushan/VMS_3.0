"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { 
  Plus, Edit, Trash2, Eye, CreditCard, TrendingUp, 
  CheckCircle, XCircle, AlertCircle, Ticket, Grid3x3
} from "lucide-react"
import { placeManagementAPI } from "@/lib/place-management-api"
import toast from "react-hot-toast"

interface PassType {
  id: string
  name: string
  description?: string
  color: string
  prefix?: string
  min_number: number
  max_number: number
  total_passes: number
  is_active: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

interface PassTypeStats {
  pass_type_id: string
  pass_type_name: string
  prefix: string
  total_passes: number
  available_count: number
  assigned_count: number
  lost_count: number
  damaged_count: number
  utilization_percentage: number
}

function PassTypesContent() {
  const [passTypes, setPassTypes] = useState<PassType[]>([])
  const [stats, setStats] = useState<PassTypeStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPassType, setEditingPassType] = useState<PassType | null>(null)
  const [viewingPassType, setViewingPassType] = useState<PassType | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    prefix: "",
    min_number: 1,
    max_number: 10
  })

  useEffect(() => {
    loadPassTypes()
  }, [])

  const loadPassTypes = async () => {
    try {
      setIsLoading(true)
      const response = await placeManagementAPI.getTableData('pass_types', { limit: 500 })
      const types = Array.isArray(response) ? 
        response.filter((pt: any) => !pt.is_deleted) : []
      setPassTypes(types)
      
      // Load statistics
      await loadStatistics()
    } catch (error) {
      toast.error('Failed to load pass types')
    } finally {
      setIsLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      // This would ideally call the view, but we'll calculate from passes table
      const passesResponse = await placeManagementAPI.getTableData('passes', { limit: 5000 })
      const passes = Array.isArray(passesResponse) ? 
        passesResponse.filter((p: any) => !p.is_deleted) : []
      
      // Group by pass_type_id
      const statsMap: { [key: string]: PassTypeStats } = {}
      
      passes.forEach((pass: any) => {
        if (!statsMap[pass.pass_type_id]) {
          statsMap[pass.pass_type_id] = {
            pass_type_id: pass.pass_type_id,
            pass_type_name: '',
            prefix: '',
            total_passes: 0,
            available_count: 0,
            assigned_count: 0,
            lost_count: 0,
            damaged_count: 0,
            utilization_percentage: 0
          }
        }
        
        statsMap[pass.pass_type_id].total_passes++
        if (pass.status === 'available') statsMap[pass.pass_type_id].available_count++
        if (pass.status === 'assigned') statsMap[pass.pass_type_id].assigned_count++
        if (pass.status === 'lost') statsMap[pass.pass_type_id].lost_count++
        if (pass.status === 'damaged') statsMap[pass.pass_type_id].damaged_count++
      })
      
      // Calculate utilization
      Object.keys(statsMap).forEach(key => {
        const stat = statsMap[key]
        stat.utilization_percentage = stat.total_passes > 0 
          ? Math.round((stat.assigned_count / stat.total_passes) * 100) 
          : 0
      })
      
      setStats(Object.values(statsMap))
    } catch (error) {
      console.error('Failed to load statistics:', error)
    }
  }

  const handleOpenDialog = (passType?: PassType) => {
    if (passType) {
      setEditingPassType(passType)
      setFormData({
        name: passType.name,
        description: passType.description || "",
        color: passType.color,
        prefix: passType.prefix || "",
        min_number: passType.min_number,
        max_number: passType.max_number
      })
    } else {
      setEditingPassType(null)
      setFormData({
        name: "",
        description: "",
        color: "#3B82F6",
        prefix: "",
        min_number: 1,
        max_number: 10
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (formData.min_number < 1) {
      toast.error('Minimum number must be at least 1')
      return
    }
    
    if (formData.max_number < formData.min_number) {
      toast.error('Maximum number must be greater than or equal to minimum number')
      return
    }

    try {
      if (editingPassType) {
        // Update existing pass type
        await placeManagementAPI.updateRecord('pass_types', 
          { id: editingPassType.id },
          {
            name: formData.name,
            description: formData.description,
            color: formData.color,
            prefix: formData.prefix,
            min_number: formData.min_number,
            max_number: formData.max_number
          }
        )
        
        // If prefix changed, update all pass display names
        if (formData.prefix !== editingPassType.prefix) {
          console.log('🔄 Prefix changed, updating all pass display names...')
          await updateAllPassDisplayNames(editingPassType.id, formData.prefix || '')
        }
        
        // If range changed, we need to add/remove passes
        if (formData.min_number !== editingPassType.min_number || 
            formData.max_number !== editingPassType.max_number) {
          await updatePassRange(editingPassType.id, formData.min_number, formData.max_number, formData.prefix || '')
        }
        
        toast.success('Pass type updated successfully')
      } else {
        // Create new pass type
        const passTypeResult = await placeManagementAPI.insertRecord('pass_types', {
          name: formData.name,
          description: formData.description,
          color: formData.color,
          prefix: formData.prefix,
          min_number: formData.min_number,
          max_number: formData.max_number,
          is_active: true,
          is_deleted: false
        })
        
        console.log('✅ Pass type created:', passTypeResult)
        
        // Get the ID from the response
        const newPassTypeId = passTypeResult.id || passTypeResult.insertId || passTypeResult.data?.id
        
        console.log('🆔 New pass type ID:', newPassTypeId)
        
        if (!newPassTypeId) {
          console.error('❌ Failed to get pass type ID from result:', passTypeResult)
          toast.error('Pass type created but failed to generate passes. Please check the database.')
          setIsDialogOpen(false)
          loadPassTypes()
          return
        }
        
        // Generate passes
        console.log(`📝 Generating ${formData.max_number - formData.min_number + 1} passes...`)
        await generatePasses(newPassTypeId, formData.min_number, formData.max_number, formData.prefix || '')
        
        toast.success(`Pass type created with ${formData.max_number - formData.min_number + 1} passes`)
      }
      
      setIsDialogOpen(false)
      loadPassTypes()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save pass type')
    }
  }

  const updateAllPassDisplayNames = async (passTypeId: string, newPrefix: string) => {
    try {
      console.log('📝 Updating pass display names for pass_type_id:', passTypeId, 'with prefix:', newPrefix)
      
      // Get all passes for this pass type
      const response = await placeManagementAPI.getTableData('passes', { limit: 5000 })
      const allPasses = Array.isArray(response) ? response : []
      
      const passesToUpdate = allPasses.filter((p: any) => 
        p.pass_type_id === passTypeId && 
        (p.is_deleted === false || p.is_deleted === 0)
      )
      
      console.log(`📋 Found ${passesToUpdate.length} passes to update`)
      
      let updateCount = 0
      for (const pass of passesToUpdate) {
        const newDisplayName = newPrefix 
          ? `${newPrefix}-${String(pass.pass_number).padStart(3, '0')}` 
          : String(pass.pass_number).padStart(3, '0')
        
        // Only update if display name actually changed
        if (pass.pass_display_name !== newDisplayName) {
          await placeManagementAPI.updateRecord('passes',
            { id: pass.id },
            { pass_display_name: newDisplayName }
          )
          updateCount++
        }
      }
      
      console.log(`✅ Updated ${updateCount} pass display names`)
      toast.success(`Updated ${updateCount} pass display names`)
    } catch (error) {
      console.error('❌ Failed to update pass display names:', error)
      toast.error('Failed to update pass display names')
    }
  }

  const generatePasses = async (passTypeId: string, minNum: number, maxNum: number, prefix: string) => {
    console.log('🎫 generatePasses called with:', { passTypeId, minNum, maxNum, prefix })
    
    if (!passTypeId) {
      console.error('❌ passTypeId is missing or undefined!')
      throw new Error('Pass type ID is required to generate passes')
    }
    
    const passes = []
    for (let i = minNum; i <= maxNum; i++) {
      const displayName = prefix ? `${prefix}-${String(i).padStart(3, '0')}` : String(i).padStart(3, '0')
      const passData = {
        pass_type_id: passTypeId,
        pass_number: i,
        pass_display_name: displayName,
        status: 'available',
        is_active: true,
        is_deleted: false
      }
      passes.push(passData)
    }
    
    console.log(`📋 Created ${passes.length} pass objects`)
    console.log('📊 Sample pass:', passes[0])
    
    // Batch insert
    let successCount = 0
    for (const pass of passes) {
      try {
        const result = await placeManagementAPI.insertRecord('passes', pass)
        successCount++
        
        if (successCount === 1) {
          console.log('✅ First pass inserted successfully:', result)
        }
      } catch (error) {
        console.error('❌ Failed to insert pass:', pass, error)
        throw error
      }
    }
    
    console.log(`✅ Successfully inserted ${successCount} passes`)
  }

  const updatePassRange = async (passTypeId: string, newMin: number, newMax: number, prefix: string) => {
    // Get existing passes
    const response = await placeManagementAPI.getTableData('passes', { limit: 5000 })
    const existingPasses = Array.isArray(response) ? 
      response.filter((p: any) => p.pass_type_id === passTypeId && !p.is_deleted) : []
    
    const existingNumbers = existingPasses.map((p: any) => p.pass_number)
    
    // Add new passes
    for (let i = newMin; i <= newMax; i++) {
      if (!existingNumbers.includes(i)) {
        const displayName = prefix ? `${prefix}-${String(i).padStart(3, '0')}` : String(i).padStart(3, '0')
        await placeManagementAPI.insertRecord('passes', {
          pass_type_id: passTypeId,
          pass_number: i,
          pass_display_name: displayName,
          status: 'available',
          is_active: true,
          is_deleted: false
        })
      } else {
        // Update display name if prefix changed
        const existingPass = existingPasses.find((p: any) => p.pass_number === i)
        if (existingPass) {
          const newDisplayName = prefix ? `${prefix}-${String(i).padStart(3, '0')}` : String(i).padStart(3, '0')
          if (existingPass.pass_display_name !== newDisplayName) {
            await placeManagementAPI.updateRecord('passes',
              { id: existingPass.id },
              { pass_display_name: newDisplayName }
            )
          }
        }
      }
    }
    
    // Soft delete passes outside the new range (only if they're available)
    for (const pass of existingPasses) {
      if (pass.pass_number < newMin || pass.pass_number > newMax) {
        if (pass.status === 'available') {
          await placeManagementAPI.softDeleteRecord('passes', { id: pass.id })
        }
      }
    }
  }

  const handleDelete = async (passType: PassType) => {
    if (!confirm(`Are you sure you want to delete "${passType.name}"? This will also delete all associated passes.`)) {
      return
    }

    try {
      await placeManagementAPI.softDeleteRecord('pass_types', { id: passType.id })
      toast.success('Pass type deleted')
      loadPassTypes()
    } catch (error) {
      toast.error('Failed to delete pass type')
    }
  }

  const handleView = (passType: PassType) => {
    setViewingPassType(passType)
    setIsViewDialogOpen(true)
  }

  const getStatsForType = (passTypeId: string): PassTypeStats | null => {
    return stats.find(s => s.pass_type_id === passTypeId) || null
  }

  const totalPassTypes = passTypes.length
  const activePassTypes = passTypes.filter(pt => pt.is_active).length
  const totalPasses = passTypes.reduce((sum, pt) => sum + pt.total_passes, 0)
  const totalAssigned = stats.reduce((sum, s) => sum + s.assigned_count, 0)
  const totalAvailable = stats.reduce((sum, s) => sum + s.available_count, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 dark:bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 dark:border-blue-400"></div>
      </div>
    )
  }

  return (
    <div className="space-y-3 px-2 sm:px-4 max-w-[98vw] mx-auto dark:bg-background">
      {/* Analytics Table - Compact Design */}
      <Card className="border shadow-md dark:bg-card dark:border-border mb-3">
        <CardContent className="p-0">
          <Table>
            <TableBody>
              <TableRow className="hover:bg-transparent">
                <TableCell className="py-2.5 px-4 border-r dark:border-border">
                  <div className="flex items-center gap-1.5">
                    <Grid3x3 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-[13px] text-muted-foreground dark:text-muted-foreground">Pass Types</p>
                      <p className="text-xl font-bold text-blue-900 dark:text-blue-400">{totalPassTypes}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-2.5 px-4 border-r dark:border-border">
                  <div className="flex items-center gap-1.5">
                    <Ticket className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <p className="text-[13px] text-muted-foreground dark:text-muted-foreground">Total Passes</p>
                      <p className="text-xl font-bold text-purple-900 dark:text-purple-400">{totalPasses}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-2.5 px-4 border-r dark:border-border">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-[13px] text-muted-foreground dark:text-muted-foreground">Available</p>
                      <p className="text-xl font-bold text-green-900 dark:text-green-400">{totalAvailable}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-2.5 px-4 dark:border-border">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                    <div>
                      <p className="text-[13px] text-muted-foreground dark:text-muted-foreground">Assigned</p>
                      <p className="text-xl font-bold text-orange-900 dark:text-orange-400">{totalAssigned}</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Header Actions */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-[13px] font-semibold dark:text-foreground">Pass Type Management</h2>
        <Button onClick={() => handleOpenDialog()} className="gap-1.5 h-9 px-3 text-[13px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600">
          <Plus className="h-3.5 w-3.5" />
          Create Pass Type
        </Button>
      </div>

      {/* Pass Types Grid */}
      {passTypes.length === 0 ? (
        <Card className="border-2 border-dashed dark:border-border dark:bg-card">
          <CardContent className="text-center py-12 dark:bg-card">
            <Ticket className="h-16 w-16 mx-auto text-muted-foreground dark:text-muted-foreground mb-3" />
            <p className="text-lg font-bold text-muted-foreground dark:text-muted-foreground mb-2">No Pass Types Created</p>
            <p className="text-[13px] text-muted-foreground dark:text-muted-foreground mb-4">
              Create your first pass type to start managing passes
            </p>
            <Button onClick={() => handleOpenDialog()} className="gap-1.5 h-9 px-3 text-[13px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600">
              <Plus className="h-3.5 w-3.5" />
              Create Pass Type
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {passTypes.map((pt) => {
            const ptStats = getStatsForType(pt.id)
            return (
              <Card key={pt.id} className="border shadow-md dark:bg-card dark:border-border hover:shadow-lg transition-all">
                <CardHeader 
                  className="pb-2 pt-2.5 dark:bg-card" 
                  style={{ 
                    background: `linear-gradient(135deg, ${pt.color}15 0%, ${pt.color}30 100%)`,
                    borderBottom: `3px solid ${pt.color}`
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-[13px] font-semibold mb-1.5 flex items-center gap-1.5 dark:text-foreground">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: pt.color }}
                        />
                        {pt.name}
                      </CardTitle>
                      {pt.prefix && (
                        <Badge variant="outline" className="font-mono font-bold text-[11px] dark:border-border dark:text-foreground">
                          {pt.prefix}
                        </Badge>
                      )}
                    </div>
                    <Badge className={`text-[11px] ${pt.is_active ? 'bg-green-500 dark:bg-green-600' : 'bg-gray-500 dark:bg-gray-600'}`}>
                      {pt.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 space-y-2.5 dark:bg-card">
                  {pt.description && (
                    <p className="text-[12px] text-muted-foreground dark:text-muted-foreground line-clamp-2">
                      {pt.description}
                    </p>
                  )}
                  
                  {/* Range Info */}
                  <div className="bg-gray-50 dark:bg-muted/50 p-2.5 rounded-lg border dark:border-border">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground">PASS RANGE</p>
                      <Badge variant="secondary" className="font-bold text-[11px] dark:border-border dark:text-foreground">
                        {pt.total_passes} Passes
                      </Badge>
                    </div>
                    <p className="text-[13px] font-bold dark:text-foreground">
                      {pt.prefix || '#'}{String(pt.min_number).padStart(3, '0')} - {pt.prefix || '#'}{String(pt.max_number).padStart(3, '0')}
                    </p>
                  </div>

                  {/* Statistics */}
                  {ptStats && (
                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="text-center p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                        <p className="text-[11px] text-green-600 dark:text-green-400 font-semibold">Available</p>
                        <p className="text-[13px] font-bold text-green-900 dark:text-green-400">{ptStats.available_count}</p>
                      </div>
                      <div className="text-center p-2 bg-orange-50 dark:bg-orange-950/20 rounded border border-orange-200 dark:border-orange-800">
                        <p className="text-[11px] text-orange-600 dark:text-orange-400 font-semibold">Assigned</p>
                        <p className="text-[13px] font-bold text-orange-900 dark:text-orange-400">{ptStats.assigned_count}</p>
                      </div>
                      <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                        <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">Usage</p>
                        <p className="text-[13px] font-bold text-blue-900 dark:text-blue-400">{ptStats.utilization_percentage}%</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="flex-1 h-8 px-2 text-[12px] dark:border-border dark:hover:bg-muted" onClick={() => handleView(pt)}>
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 dark:border-border dark:hover:bg-muted" onClick={() => handleOpenDialog(pt)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="destructive" className="h-8 w-8 p-0 dark:bg-red-600 dark:hover:bg-red-700" onClick={() => handleDelete(pt)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-card dark:border-border">
          <DialogHeader className="dark:border-border/50">
            <DialogTitle className="dark:text-foreground text-[13px] font-semibold">{editingPassType ? 'Edit' : 'Create'} Pass Type</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label className="text-[13px] dark:text-foreground">Pass Type Name *</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Visitor Pass, VIP Pass"
                required 
                className="h-9 text-[13px] dark:bg-card dark:border-border dark:text-foreground"
              />
            </div>

            <div>
              <Label className="text-[13px] dark:text-foreground">Description</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description of this pass type"
                rows={2}
                className="text-[13px] dark:bg-card dark:border-border dark:text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prefix (Optional)</Label>
                <Input 
                  value={formData.prefix} 
                  onChange={(e) => setFormData({...formData, prefix: e.target.value.toUpperCase()})}
                  placeholder="e.g., V, VIP, C"
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Display: {formData.prefix || '#'}-001
                </p>
              </div>

              <div>
                <Label>Color *</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color"
                    value={formData.color} 
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="w-20 h-10"
                  />
                  <Input 
                    value={formData.color} 
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Minimum Number *</Label>
                <Input 
                  type="number"
                  min="1"
                  value={formData.min_number} 
                  onChange={(e) => setFormData({...formData, min_number: parseInt(e.target.value) || 1})}
                  required 
                />
              </div>

              <div>
                <Label>Maximum Number *</Label>
                <Input 
                  type="number"
                  min={formData.min_number}
                  value={formData.max_number} 
                  onChange={(e) => setFormData({...formData, max_number: parseInt(e.target.value) || 10})}
                  required 
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-2">Preview:</p>
              <div className="flex items-center gap-2">
                <Badge className="font-mono text-base px-3 py-1" style={{ backgroundColor: formData.color }}>
                  {formData.prefix || '#'}{String(formData.min_number).padStart(3, '0')}
                </Badge>
                <span className="text-muted-foreground">to</span>
                <Badge className="font-mono text-base px-3 py-1" style={{ backgroundColor: formData.color }}>
                  {formData.prefix || '#'}{String(formData.max_number).padStart(3, '0')}
                </Badge>
                <Badge variant="secondary" className="ml-auto">
                  {formData.max_number - formData.min_number + 1} passes total
                </Badge>
              </div>
            </div>

            {editingPassType && (
              <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                <p className="text-xs text-yellow-900 font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Changing the range will add new passes or remove unused ones
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="h-9 px-3 text-[13px] dark:border-border dark:text-foreground dark:hover:bg-muted">
                Cancel
              </Button>
              <Button type="submit" className="h-9 px-3 text-[13px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600">
                {editingPassType ? 'Update' : 'Create'} Pass Type
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl dark:bg-card dark:border-border">
          <DialogHeader className="dark:border-border/50">
            <DialogTitle className="dark:text-foreground text-[13px] font-semibold">Pass Type Details</DialogTitle>
          </DialogHeader>
          {viewingPassType && (
            <div className="space-y-4">
              <div 
                className="p-6 rounded-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${viewingPassType.color}20 0%, ${viewingPassType.color}40 100%)`
                }}
              >
                <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded-full" 
                    style={{ backgroundColor: viewingPassType.color }}
                  />
                  {viewingPassType.name}
                </h3>
                {viewingPassType.description && (
                  <p className="text-muted-foreground">{viewingPassType.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-1">Prefix</p>
                  <p className="text-lg font-bold font-mono">{viewingPassType.prefix || 'None'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-1">Color Code</p>
                  <p className="text-lg font-bold font-mono">{viewingPassType.color}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-1">Pass Range</p>
                  <p className="text-lg font-bold">
                    {viewingPassType.min_number} - {viewingPassType.max_number}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-1">Total Passes</p>
                  <p className="text-lg font-bold">{viewingPassType.total_passes}</p>
                </div>
              </div>

              {getStatsForType(viewingPassType.id) && (
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200 text-center">
                    <p className="text-xs text-green-600 font-semibold mb-1">AVAILABLE</p>
                    <p className="text-3xl font-bold text-green-900">
                      {getStatsForType(viewingPassType.id)!.available_count}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200 text-center">
                    <p className="text-xs text-orange-600 font-semibold mb-1">ASSIGNED</p>
                    <p className="text-3xl font-bold text-orange-900">
                      {getStatsForType(viewingPassType.id)!.assigned_count}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200 text-center">
                    <p className="text-xs text-red-600 font-semibold mb-1">LOST</p>
                    <p className="text-3xl font-bold text-red-900">
                      {getStatsForType(viewingPassType.id)!.lost_count}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200 text-center">
                    <p className="text-xs text-blue-600 font-semibold mb-1">USAGE</p>
                    <p className="text-3xl font-bold text-blue-900">
                      {getStatsForType(viewingPassType.id)!.utilization_percentage}%
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setIsViewDialogOpen(false)
                  handleOpenDialog(viewingPassType)
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Pass Type
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { RouteProtection } from "@/components/auth/route-protection"

export default function PassTypesPage() {
  return (
    <RouteProtection requiredRole="admin">
      <DashboardLayout title="Pass Types" subtitle="Manage pass types and pass ranges">
        <PassTypesContent />
      </DashboardLayout>
    </RouteProtection>
  )
}
