'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function BackendTest() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const testHealth = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:3000/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-App-ID': process.env.NEXT_PUBLIC_APP_ID || 'your_unique_app_id_here',
          'X-Service-Key': process.env.NEXT_PUBLIC_SERVICE_KEY || 'your_service_key_here'
        }
      })
      const data = await response.json()
      setTestResult({ type: 'health', status: response.status, data })
    } catch (error: any) {
      setTestResult({ type: 'health', error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    if (!email || !password) {
      setTestResult({ type: 'login', error: 'Please enter email and password' })
      return
    }

    setLoading(true)
    try {
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
      setTestResult({ type: 'login', status: response.status, data })
    } catch (error: any) {
      setTestResult({ type: 'login', error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Backend API Test</CardTitle>
        <CardDescription>
          Test your backend API endpoints directly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Environment Variables:</Label>
          <div className="text-sm space-y-1">
            <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</p>
            <p><strong>App ID:</strong> {process.env.NEXT_PUBLIC_APP_ID || 'Not set'}</p>
            <p><strong>Service Key:</strong> {process.env.NEXT_PUBLIC_SERVICE_KEY || 'Not set'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Button onClick={testHealth} disabled={loading}>
            Test Health Endpoint
          </Button>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
            />
          </div>

          <Button onClick={testLogin} disabled={loading || !email || !password}>
            Test Login Endpoint
          </Button>
        </div>

        {testResult && (
          <div className="mt-4">
            <Label>Test Result:</Label>
            <div className="mt-2 p-3 bg-gray-50 rounded-md">
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
