'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function SupabaseConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing')
  const [error, setError] = useState<string | null>(null)
  const [supabaseUrl, setSupabaseUrl] = useState<string>('')
  const [testResults, setTestResults] = useState<{
    url: boolean
    auth: boolean
    database: boolean
  } | null>(null)

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      setConnectionStatus('testing')
      setError(null)
      
      // Get the Supabase URL from environment
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      setSupabaseUrl(url || 'Not configured')
      
      if (!url) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured')
      }

      // Test basic connection
      const supabase = createBrowserSupabaseClient()
      
      // Test 1: Basic connection
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      
      // Test 2: Database connection (try to query a simple table)
      const { data: dbData, error: dbError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1)

      setTestResults({
        url: !!url,
        auth: !authError,
        database: !dbError
      })

      if (authError && dbError) {
        throw new Error(`Connection failed: ${authError.message || dbError.message}`)
      }

      setConnectionStatus('connected')
    } catch (err) {
      setConnectionStatus('error')
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'testing':
        return <Loader2 className="h-5 w-5 animate-spin" />
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'testing':
        return 'bg-yellow-100 text-yellow-800'
      case 'connected':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Supabase VM Connection Test
        </CardTitle>
        <CardDescription>
          Testing connection to your VM Supabase instance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Connection Status:</span>
          <Badge className={getStatusColor()}>
            {connectionStatus.toUpperCase()}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Supabase URL:</span>
            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
              {supabaseUrl}
            </span>
          </div>
        </div>

        {testResults && (
          <div className="space-y-2">
            <h4 className="font-medium">Test Results:</h4>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm">URL Configuration</span>
                <Badge variant={testResults.url ? "default" : "destructive"}>
                  {testResults.url ? "✓" : "✗"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Authentication</span>
                <Badge variant={testResults.auth ? "default" : "destructive"}>
                  {testResults.auth ? "✓" : "✗"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Access</span>
                <Badge variant={testResults.database ? "default" : "destructive"}>
                  {testResults.database ? "✓" : "✗"}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        <Button onClick={testConnection} variant="outline" className="w-full">
          Test Connection Again
        </Button>
      </CardContent>
    </Card>
  )
}




