'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function LoginDebug() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [step, setStep] = useState('')

  const testStep1 = async () => {
    setStep('Testing environment variables...')
    setResult({
      step: 'Environment Check',
      env: {
        API_URL: process.env.NEXT_PUBLIC_API_URL || 'NOT SET',
        APP_ID: process.env.NEXT_PUBLIC_APP_ID || 'NOT SET',
        SERVICE_KEY: process.env.NEXT_PUBLIC_SERVICE_KEY || 'NOT SET'
      }
    })
  }

  const testStep2 = async () => {
    setStep('Testing backend health...')
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
      setResult({
        step: 'Health Check',
        status: response.status,
        data: data,
        success: response.ok
      })
    } catch (error: any) {
      setResult({
        step: 'Health Check',
        error: error.message,
        success: false
      })
    } finally {
      setLoading(false)
    }
  }

  const testStep3 = async () => {
    if (!email || !password) {
      setResult({
        step: 'Login Test',
        error: 'Please enter email and password',
        success: false
      })
      return
    }

    setStep('Testing login endpoint...')
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
      setResult({
        step: 'Login Test',
        status: response.status,
        data: data,
        success: response.ok,
        hasOtpRequired: data.data?.otpRequired === true
      })
    } catch (error: any) {
      setResult({
        step: 'Login Test',
        error: error.message,
        success: false
      })
    } finally {
      setLoading(false)
    }
  }

  const runAllTests = async () => {
    await testStep1()
    await new Promise(resolve => setTimeout(resolve, 1000))
    await testStep2()
    await new Promise(resolve => setTimeout(resolve, 1000))
    await testStep3()
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Login Flow Debug Tool</CardTitle>
        <CardDescription>
          Step-by-step debugging of the login process
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button onClick={testStep1} variant="outline">
            1. Check Environment
          </Button>
          <Button onClick={testStep2} variant="outline" disabled={loading}>
            2. Test Backend Health
          </Button>
          <Button onClick={testStep3} variant="outline" disabled={loading}>
            3. Test Login
          </Button>
        </div>

        <Button onClick={runAllTests} disabled={loading} className="w-full">
          {loading ? 'Running Tests...' : 'Run All Tests'}
        </Button>

        {step && (
          <Alert>
            <AlertDescription>{step}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
              />
            </div>
          </div>
        </div>

        {result && (
          <div className="space-y-2">
            <Label>Test Result - {result.step}:</Label>
            <div className="p-4 bg-gray-50 rounded-md">
              <div className="mb-2">
                <strong>Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {result.success ? 'SUCCESS' : 'FAILED'}
                </span>
              </div>
              {result.hasOtpRequired !== undefined && (
                <div className="mb-2">
                  <strong>OTP Required:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                    result.hasOtpRequired ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.hasOtpRequired ? 'YES' : 'NO'}
                  </span>
                </div>
              )}
              <pre className="text-xs overflow-x-auto bg-white p-2 rounded border">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-md">
          <h3 className="font-semibold mb-2">Expected Results:</h3>
          <ul className="text-sm space-y-1">
            <li>✅ <strong>Environment:</strong> All variables should be set</li>
            <li>✅ <strong>Health:</strong> Should return 200 status</li>
            <li>✅ <strong>Login:</strong> Should return success: true with otpRequired: true</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
