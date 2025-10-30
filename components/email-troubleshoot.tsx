'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, Loader2, AlertTriangle, Mail, Settings } from 'lucide-react'

interface EmailDiagnostic {
  test: string
  status: 'success' | 'error' | 'warning' | 'info'
  message: string
  details?: string
  solution?: string
}

export function EmailTroubleshoot() {
  const [diagnostics, setDiagnostics] = useState<EmailDiagnostic[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [isTestingEmail, setIsTestingEmail] = useState(false)

  const runEmailDiagnostics = async () => {
    setIsRunning(true)
    setDiagnostics([])
    const results: EmailDiagnostic[] = []

    try {
      const supabase = createBrowserSupabaseClient()

      // Test 1: Check if email templates table exists
      try {
        const { data, error } = await supabase
          .from('email_templates')
          .select('template_type')
          .limit(1)
        
        if (error) {
          results.push({
            test: 'Email Templates Table',
            status: 'error',
            message: 'Email templates table not found',
            details: error.message,
            solution: 'Run the supabase-email-config-fixed.sql script in your Supabase dashboard'
          })
        } else {
          results.push({
            test: 'Email Templates Table',
            status: 'success',
            message: 'Email templates table exists',
            details: 'Email configuration database is set up'
          })
        }
      } catch (err: any) {
        results.push({
          test: 'Email Templates Table',
          status: 'error',
          message: 'Failed to check email templates',
          details: err.message
        })
      }

      // Test 2: Check email templates
      try {
        const { data, error } = await supabase
          .from('email_templates')
          .select('template_type, is_active')
          .eq('is_active', true)
        
        if (error) {
          results.push({
            test: 'Email Templates',
            status: 'error',
            message: 'Failed to fetch email templates',
            details: error.message
          })
        } else if (!data || data.length === 0) {
          results.push({
            test: 'Email Templates',
            status: 'warning',
            message: 'No active email templates found',
            details: 'Email templates may not be configured',
            solution: 'Run the email configuration SQL script or create templates manually'
          })
        } else {
          results.push({
            test: 'Email Templates',
            status: 'success',
            message: `Found ${data.length} active email templates`,
            details: `Templates: ${data.map(t => t.template_type).join(', ')}`
          })
        }
      } catch (err: any) {
        results.push({
          test: 'Email Templates',
          status: 'error',
          message: 'Email templates check failed',
          details: err.message
        })
      }

      // Test 3: Test custom email function
      try {
        const { data, error } = await supabase.rpc('send_custom_email', {
          to_email: 'test@example.com',
          template_type: 'confirmation',
          template_vars: {
            site_name: 'Test Site',
            confirmation_url: 'https://example.com/confirm'
          }
        })
        
        if (error) {
          results.push({
            test: 'Custom Email Function',
            status: 'warning',
            message: 'Custom email function not working',
            details: error.message,
            solution: 'This is normal if you haven\'t configured SMTP. Supabase will use its default email service.'
          })
        } else {
          results.push({
            test: 'Custom Email Function',
            status: 'success',
            message: 'Custom email function is working',
            details: 'Email sending function is properly configured'
          })
        }
      } catch (err: any) {
        results.push({
          test: 'Custom Email Function',
          status: 'warning',
          message: 'Custom email function test failed',
          details: err.message
        })
      }

      // Test 4: Check authentication configuration
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          results.push({
            test: 'Authentication Service',
            status: 'error',
            message: 'Authentication service not accessible',
            details: error.message,
            solution: 'Check your Supabase connection and environment variables'
          })
        } else {
          results.push({
            test: 'Authentication Service',
            status: 'success',
            message: 'Authentication service is working',
            details: 'Auth service can handle email confirmations'
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

    } catch (error: any) {
      results.push({
        test: 'General',
        status: 'error',
        message: 'Email diagnostic failed',
        details: error.message
      })
    }

    setDiagnostics(results)
    setIsRunning(false)
  }

  const testEmailSending = async () => {
    if (!testEmail) {
      alert('Please enter a test email address')
      return
    }

    setIsTestingEmail(true)
    
    try {
      const supabase = createBrowserSupabaseClient()
      
      // Try to send a password reset email (this will test email sending)
      const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        alert(`Email test failed: ${error.message}`)
      } else {
        alert('Test email sent successfully! Check your inbox (and spam folder).')
      }
    } catch (error: any) {
      alert(`Email test failed: ${error.message}`)
    } finally {
      setIsTestingEmail(false)
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
        return <Mail className="h-4 w-4 text-blue-500" />
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
            <Mail className="h-5 w-5" />
            Email Configuration Troubleshooting
          </CardTitle>
          <CardDescription>
            Diagnose and fix email confirmation issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runEmailDiagnostics} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Email Diagnostics...
              </>
            ) : (
              'Run Email Diagnostics'
            )}
          </Button>

          {hasErrors && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Critical Email Issues Found:</strong> Please fix the errors below.
              </AlertDescription>
            </Alert>
          )}

          {hasWarnings && !hasErrors && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Email Warnings Found:</strong> Some email features may not work correctly.
              </AlertDescription>
            </Alert>
          )}

          {diagnostics.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Email Diagnostic Results:</h3>
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
            <Settings className="h-5 w-5" />
            Test Email Sending
          </CardTitle>
          <CardDescription>
            Test if email sending is working by sending a password reset email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-email">Test Email Address</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="Enter your email address"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>
          <Button 
            onClick={testEmailSending} 
            disabled={isTestingEmail || !testEmail}
            className="w-full"
          >
            {isTestingEmail ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Test Email...
              </>
            ) : (
              'Send Test Email'
            )}
          </Button>
          <p className="text-xs text-gray-500">
            This will send a password reset email to test if email sending is working.
          </p>
        </CardContent>
      </Card>

      {hasErrors && (
        <Card>
          <CardHeader>
            <CardTitle>Email Configuration Solutions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Run Email Configuration SQL Script</h4>
              <p className="text-sm text-gray-600 mb-2">
                Make sure you've run the email configuration script:
              </p>
              <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                <li>Go to your Supabase dashboard at <code className="bg-gray-100 px-1 rounded">https://supa.minimart.best</code></li>
                <li>Navigate to SQL Editor</li>
                <li>Run the <code className="bg-gray-100 px-1 rounded">supabase-email-config-fixed.sql</code> script</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium mb-2">2. Configure Email Settings in Supabase Dashboard</h4>
              <p className="text-sm text-gray-600 mb-2">
                Enable email confirmations in your Supabase dashboard:
              </p>
              <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                <li>Go to Authentication → Settings</li>
                <li>Enable "Email confirmations"</li>
                <li>Set "Enable email change confirmations" to ON</li>
                <li>Configure email templates if needed</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium mb-2">3. Check SMTP Configuration (Optional)</h4>
              <p className="text-sm text-gray-600 mb-2">
                If you want to use a custom email service:
              </p>
              <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                <li>Go to Authentication → Settings → SMTP Settings</li>
                <li>Configure your SMTP provider (SendGrid, AWS SES, etc.)</li>
                <li>Test the SMTP connection</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium mb-2">4. Check Supabase Logs</h4>
              <p className="text-sm text-gray-600 mb-2">
                Check for email-related errors in your Supabase dashboard:
              </p>
              <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                <li>Go to Logs → Auth</li>
                <li>Look for email-related errors</li>
                <li>Check if emails are being sent but not delivered</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}




