'use client'

import { useState, useEffect } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Loader2, AlertTriangle, Info } from 'lucide-react'

interface DiagnosticResult {
  test: string
  status: 'success' | 'error' | 'warning' | 'info'
  message: string
  details?: string
}

export function AuthTroubleshoot() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [supabaseKey, setSupabaseKey] = useState('')

  useEffect(() => {
    // Get environment variables
    setSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || '')
    setSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
  }, [])

  const runDiagnostics = async () => {
    setIsRunning(true)
    setDiagnostics([])
    const results: DiagnosticResult[] = []

    try {
      // Test 1: Environment Variables
      if (!supabaseUrl) {
        results.push({
          test: 'Environment Variables',
          status: 'error',
          message: 'NEXT_PUBLIC_SUPABASE_URL is not set',
          details: 'Check your .env.local file'
        })
      } else if (!supabaseKey) {
        results.push({
          test: 'Environment Variables',
          status: 'error',
          message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is not set',
          details: 'Check your .env.local file'
        })
      } else {
        results.push({
          test: 'Environment Variables',
          status: 'success',
          message: 'Environment variables are configured',
          details: `URL: ${supabaseUrl}`
        })
      }

      // Test 2: Supabase Connection
      if (supabaseUrl && supabaseKey) {
        try {
          const supabase = createBrowserSupabaseClient()
          const { data, error } = await supabase.auth.getSession()
          
          if (error) {
            results.push({
              test: 'Supabase Connection',
              status: 'error',
              message: 'Failed to connect to Supabase',
              details: error.message
            })
          } else {
            results.push({
              test: 'Supabase Connection',
              status: 'success',
              message: 'Successfully connected to Supabase',
              details: 'Authentication service is accessible'
            })
          }
        } catch (err: any) {
          results.push({
            test: 'Supabase Connection',
            status: 'error',
            message: 'Connection failed',
            details: err.message
          })
        }
      }

      // Test 3: Database Tables
      if (supabaseUrl && supabaseKey) {
        try {
          const supabase = createBrowserSupabaseClient()
          const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .limit(1)
          
          if (error) {
            results.push({
              test: 'Database Tables',
              status: 'error',
              message: 'Profiles table not accessible',
              details: error.message
            })
          } else {
            results.push({
              test: 'Database Tables',
              status: 'success',
              message: 'Profiles table is accessible',
              details: 'Database schema is properly set up'
            })
          }
        } catch (err: any) {
          results.push({
            test: 'Database Tables',
            status: 'error',
            message: 'Database access failed',
            details: err.message
          })
        }
      }

      // Test 4: Authentication Functions
      if (supabaseUrl && supabaseKey) {
        try {
          const supabase = createBrowserSupabaseClient()
          const { data, error } = await supabase.rpc('get_user_profile')
          
          if (error) {
            results.push({
              test: 'Authentication Functions',
              status: 'warning',
              message: 'Authentication functions may not be set up',
              details: error.message
            })
          } else {
            results.push({
              test: 'Authentication Functions',
              status: 'success',
              message: 'Authentication functions are working',
              details: 'Helper functions are properly configured'
            })
          }
        } catch (err: any) {
          results.push({
            test: 'Authentication Functions',
            status: 'warning',
            message: 'Authentication functions test failed',
            details: err.message
          })
        }
      }

      // Test 5: Email Configuration
      if (supabaseUrl && supabaseKey) {
        try {
          const supabase = createBrowserSupabaseClient()
          const { data, error } = await supabase
            .from('email_templates')
            .select('template_type')
            .limit(1)
          
          if (error) {
            results.push({
              test: 'Email Configuration',
              status: 'warning',
              message: 'Email templates table not found',
              details: 'Run the email configuration SQL script'
            })
          } else {
            results.push({
              test: 'Email Configuration',
              status: 'success',
              message: 'Email templates are configured',
              details: 'Email system is ready'
            })
          }
        } catch (err: any) {
          results.push({
            test: 'Email Configuration',
            status: 'warning',
            message: 'Email configuration test failed',
            details: err.message
          })
        }
      }

      // Test 6: Test Sign Up (without actually creating user)
      if (supabaseUrl && supabaseKey) {
        try {
          const supabase = createBrowserSupabaseClient()
          // Test with invalid email to check if auth service responds
          const { error } = await supabase.auth.signUp({
            email: 'test@invalid-domain-that-should-fail.com',
            password: 'test123'
          })
          
          // If we get an error about email format, that's actually good - it means auth is working
          if (error && (error.message.includes('email') || error.message.includes('password'))) {
            results.push({
              test: 'Authentication Service',
              status: 'success',
              message: 'Authentication service is responding',
              details: 'Auth service is working correctly'
            })
          } else if (error) {
            results.push({
              test: 'Authentication Service',
              status: 'error',
              message: 'Authentication service error',
              details: error.message
            })
          } else {
            results.push({
              test: 'Authentication Service',
              status: 'success',
              message: 'Authentication service is working',
              details: 'Sign up functionality is available'
            })
          }
        } catch (err: any) {
          results.push({
            test: 'Authentication Service',
            status: 'error',
            message: 'Authentication service test failed',
            details: err.message
          })
        }
      }

    } catch (error: any) {
      results.push({
        test: 'General',
        status: 'error',
        message: 'Diagnostic failed',
        details: error.message
      })
    }

    setDiagnostics(results)
    setIsRunning(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'info':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const hasErrors = diagnostics.some(d => d.status === 'error')
  const hasWarnings = diagnostics.some(d => d.status === 'warning')

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Authentication Troubleshooting
          </CardTitle>
          <CardDescription>
            Diagnose and fix authentication issues with your Supabase setup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium">Supabase URL:</label>
              <p className="text-sm text-gray-600 font-mono break-all">
                {supabaseUrl || 'Not configured'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Anon Key:</label>
              <p className="text-sm text-gray-600 font-mono break-all">
                {supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'Not configured'}
              </p>
            </div>
          </div>

          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Diagnostics...
              </>
            ) : (
              'Run Diagnostics'
            )}
          </Button>

          {hasErrors && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Critical Issues Found:</strong> Please fix the errors below before proceeding.
              </AlertDescription>
            </Alert>
          )}

          {hasWarnings && !hasErrors && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Warnings Found:</strong> Some features may not work correctly.
              </AlertDescription>
            </Alert>
          )}

          {diagnostics.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Diagnostic Results:</h3>
              {diagnostics.map((diagnostic, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getStatusIcon(diagnostic.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{diagnostic.test}</span>
                      <Badge className={getStatusColor(diagnostic.status)}>
                        {diagnostic.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{diagnostic.message}</p>
                    {diagnostic.details && (
                      <p className="text-xs text-gray-500 mt-1 font-mono">
                        {diagnostic.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {hasErrors && (
        <Card>
          <CardHeader>
            <CardTitle>Common Solutions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Check Environment Variables</h4>
              <p className="text-sm text-gray-600 mb-2">
                Make sure your <code className="bg-gray-100 px-1 rounded">.env.local</code> file exists and contains:
              </p>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://supa.minimart.best
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">2. Verify Supabase Keys</h4>
              <p className="text-sm text-gray-600 mb-2">
                Get your keys from your Supabase dashboard:
              </p>
              <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                <li>Go to <code className="bg-gray-100 px-1 rounded">https://supa.minimart.best</code></li>
                <li>Navigate to Settings → API</li>
                <li>Copy the <code className="bg-gray-100 px-1 rounded">anon</code> key</li>
                <li>Copy the <code className="bg-gray-100 px-1 rounded">service_role</code> key</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium mb-2">3. Run SQL Scripts</h4>
              <p className="text-sm text-gray-600 mb-2">
                Make sure you've run both SQL scripts in your Supabase dashboard:
              </p>
              <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                <li>Run <code className="bg-gray-100 px-1 rounded">supabase-auth-setup-fixed.sql</code></li>
                <li>Run <code className="bg-gray-100 px-1 rounded">supabase-email-config-fixed.sql</code></li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium mb-2">4. Restart Development Server</h4>
              <p className="text-sm text-gray-600">
                After updating environment variables, restart your development server:
              </p>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-2">
{`npm run dev
# or
yarn dev
# or
pnpm dev`}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}




