'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function TestLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testDirectAPI = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log('Testing direct API call...')
      
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-ID': process.env.NEXT_PUBLIC_APP_ID || 'your_unique_app_id_here',
          'X-Service-Key': process.env.NEXT_PUBLIC_SERVICE_KEY || 'your_service_key_here'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()
      
      setResult({
        status: response.status,
        ok: response.ok,
        data: data
      })
      
      console.log('Direct API result:', { status: response.status, data })
      
    } catch (error: any) {
      setResult({
        error: error.message
      })
      console.error('Direct API error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Direct API Login Test</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Login API Directly</CardTitle>
            <CardDescription>
              This bypasses all the auth context and tests the API directly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            <Button onClick={testDirectAPI} disabled={loading || !email || !password}>
              {loading ? 'Testing...' : 'Test Direct API Call'}
            </Button>

            {result && (
              <div className="space-y-2">
                <Label>Result:</Label>
                <div className="p-4 bg-gray-50 rounded-md">
                  <div className="mb-2">
                    <strong>Status:</strong> {result.status || 'N/A'}
                  </div>
                  <div className="mb-2">
                    <strong>Success:</strong> {result.ok ? 'YES' : 'NO'}
                  </div>
                  {result.data?.data?.otpRequired !== undefined && (
                    <div className="mb-2">
                      <strong>OTP Required:</strong> {result.data.data.otpRequired ? 'YES' : 'NO'}
                    </div>
                  )}
                  <pre className="text-xs overflow-x-auto bg-white p-2 rounded border">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
