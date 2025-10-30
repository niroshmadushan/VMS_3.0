'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, Loader2, AlertTriangle, Clock, Server } from 'lucide-react'

interface DiagnosticResult {
  test: string
  status: 'success' | 'error' | 'warning' | 'info'
  message: string
  details?: string
  solution?: string
}

export function RateLimitDiagnostic() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testPassword, setTestPassword] = useState('')
  const [isTestingLogin, setIsTestingLogin] = useState(false)

  const runDiagnostics = async () => {
    setIsRunning(true)
    setDiagnostics([])
    const results: DiagnosticResult[] = []

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

      // Test 1: Backend Health Check
      try {
        const response = await fetch(`${API_BASE_URL}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          results.push({
            test: 'Backend Health Check',
            status: 'success',
            message: 'Backend server is running',
            details: `Server responded: ${data.message || 'OK'}`
          })
        } else {
          results.push({
            test: 'Backend Health Check',
            status: 'error',
            message: 'Backend server is not responding',
            details: `HTTP ${response.status}: ${response.statusText}`,
            solution: 'Start your backend server on port 3000'
          })
        }
      } catch (err: any) {
        results.push({
          test: 'Backend Health Check',
          status: 'error',
          message: 'Cannot connect to backend server',
          details: err.message,
          solution: 'Check if your backend server is running on http://localhost:3000'
        })
      }

      // Test 2: API Information
      try {
        const response = await fetch(`${API_BASE_URL}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          results.push({
            test: 'API Information',
            status: 'success',
            message: 'API is accessible',
            details: `Version: ${data.version || 'Unknown'}`
          })
        } else {
          results.push({
            test: 'API Information',
            status: 'warning',
            message: 'API information endpoint not accessible',
            details: `HTTP ${response.status}`
          })
        }
      } catch (err: any) {
        results.push({
          test: 'API Information',
          status: 'warning',
          message: 'API information check failed',
          details: err.message
        })
      }

      // Test 3: Environment Variables
      const appId = process.env.NEXT_PUBLIC_APP_ID
      const serviceKey = process.env.NEXT_PUBLIC_SERVICE_KEY
      const apiUrl = process.env.NEXT_PUBLIC_API_URL

      if (!apiUrl) {
        results.push({
          test: 'Environment Variables',
          status: 'error',
          message: 'NEXT_PUBLIC_API_URL is not configured',
          solution: 'Add NEXT_PUBLIC_API_URL to your .env.local file'
        })
      } else if (!appId) {
        results.push({
          test: 'Environment Variables',
          status: 'error',
          message: 'NEXT_PUBLIC_APP_ID is not configured',
          solution: 'Add NEXT_PUBLIC_APP_ID to your .env.local file'
        })
      } else if (!serviceKey) {
        results.push({
          test: 'Environment Variables',
          status: 'error',
          message: 'NEXT_PUBLIC_SERVICE_KEY is not configured',
          solution: 'Add NEXT_PUBLIC_SERVICE_KEY to your .env.local file'
        })
      } else {
        results.push({
          test: 'Environment Variables',
          status: 'success',
          message: 'All required environment variables are configured',
          details: `API URL: ${apiUrl}`
        })
      }

      // Test 4: Rate Limit Status (if backend is accessible)
      if (results[0]?.status === 'success') {
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-App-ID': appId || '',
              'X-Service-Key': serviceKey || ''
            },
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'test123'
            })
          })

          const data = await response.json()

          if (response.status === 429) {
            results.push({
              test: 'Rate Limiting',
              status: 'warning',
              message: 'Rate limiting is active',
              details: data.message || 'Too many requests',
              solution: 'Wait a few minutes before trying again, or check rate limit settings'
            })
          } else if (response.status === 400 || response.status === 401) {
            results.push({
              test: 'Rate Limiting',
              status: 'success',
              message: 'Rate limiting is not blocking requests',
              details: 'Authentication endpoint is accessible (expected auth failure)'
            })
          } else {
            results.push({
              test: 'Rate Limiting',
              status: 'info',
              message: 'Rate limiting status unknown',
              details: `HTTP ${response.status}: ${data.message || 'Unknown response'}`
            })
          }
        } catch (err: any) {
          results.push({
            test: 'Rate Limiting',
            status: 'warning',
            message: 'Could not test rate limiting',
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

  const testLogin = async () => {
    if (!testEmail || !testPassword) {
      alert('Please enter both email and password for testing')
      return
    }

    setIsTestingLogin(true)
    
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const APP_ID = process.env.NEXT_PUBLIC_APP_ID || ''
      const SERVICE_KEY = process.env.NEXT_PUBLIC_SERVICE_KEY || ''

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-ID': APP_ID,
          'X-Service-Key': SERVICE_KEY
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      })

      const data = await response.json()

      if (response.status === 429) {
        alert(`Rate Limited: ${data.message || 'Too many authentication attempts'}`)
      } else if (response.status === 401) {
        alert(`Authentication Failed: ${data.message || 'Invalid credentials'}`)
      } else if (response.status === 200) {
        alert(`Login Test Successful: ${data.message || 'OTP sent to email'}`)
      } else {
        alert(`Unexpected Response: ${response.status} - ${data.message || 'Unknown error'}`)
      }
    } catch (error: any) {
      alert(`Network Error: ${error.message}`)
    } finally {
      setIsTestingLogin(false)
    }
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
        return <Server className="h-4 w-4 text-blue-500" />
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
            Rate Limiting Diagnostic
          </CardTitle>
          <CardDescription>
            Diagnose and fix "Too many authentication attempts" error
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              'Run Rate Limit Diagnostics'
            )}
          </Button>

          {hasErrors && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Critical Issues Found:</strong> Please fix the errors below.
              </AlertDescription>
            </Alert>
          )}

          {hasWarnings && !hasErrors && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Rate Limiting Issues Found:</strong> Check the warnings below.
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
                    {diagnostic.solution && (
                      <p className="text-xs text-blue-600 mt-1 font-medium">
                        💡 {diagnostic.solution}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Test Login (Rate Limit Check)
          </CardTitle>
          <CardDescription>
            Test if you can make login requests or if rate limiting is blocking you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-email">Test Email</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="Enter test email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="test-password">Test Password</Label>
            <Input
              id="test-password"
              type="password"
              placeholder="Enter test password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
            />
          </div>
          <Button 
            onClick={testLogin} 
            disabled={isTestingLogin || !testEmail || !testPassword}
            className="w-full"
          >
            {isTestingLogin ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Login...
              </>
            ) : (
              'Test Login Request'
            )}
          </Button>
          <p className="text-xs text-gray-500">
            This will test if rate limiting is blocking your login attempts.
          </p>
        </CardContent>
      </Card>

      {hasWarnings && (
        <Card>
          <CardHeader>
            <CardTitle>Rate Limiting Solutions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Wait for Rate Limit Reset</h4>
              <p className="text-sm text-gray-600 mb-2">
                Rate limits typically reset after a certain time period:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Auth Endpoints: 5 requests per 15 minutes</li>
                <li>OTP Endpoints: 3 requests per 10 minutes</li>
                <li>Password Reset: 3 requests per hour</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">2. Check Backend Server</h4>
              <p className="text-sm text-gray-600 mb-2">
                Make sure your backend server is running:
              </p>
              <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                <li>Start your backend server on port 3000</li>
                <li>Check <code className="bg-gray-100 px-1 rounded">http://localhost:3000/health</code></li>
                <li>Verify the server responds with status 200</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium mb-2">3. Check Environment Variables</h4>
              <p className="text-sm text-gray-600 mb-2">
                Ensure your <code className="bg-gray-100 px-1 rounded">.env.local</code> file contains:
              </p>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
{`NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_ID=your_unique_app_id_here
NEXT_PUBLIC_SERVICE_KEY=your_service_key_here`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">4. Clear Browser Data</h4>
              <p className="text-sm text-gray-600 mb-2">
                Sometimes cached data can cause issues:
              </p>
              <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                <li>Clear browser cache and cookies</li>
                <li>Clear localStorage data</li>
                <li>Try in an incognito/private window</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium mb-2">5. Check Backend Logs</h4>
              <p className="text-sm text-gray-600">
                Look at your backend server logs for:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Rate limiting messages</li>
                <li>Authentication errors</li>
                <li>Request processing issues</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
