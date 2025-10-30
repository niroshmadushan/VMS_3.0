'use client'

import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function AuthDebug() {
  const { user, isAuthenticated, isLoading, error } = useAuth()

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Authentication Debug Info</CardTitle>
        <CardDescription>
          Current authentication state and user information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Authentication Status:</label>
            <Badge variant={isAuthenticated ? "default" : "secondary"}>
              {isAuthenticated ? "Authenticated" : "Not Authenticated"}
            </Badge>
          </div>
          <div>
            <label className="text-sm font-medium">Loading:</label>
            <Badge variant={isLoading ? "default" : "secondary"}>
              {isLoading ? "Loading" : "Not Loading"}
            </Badge>
          </div>
        </div>

        {user && (
          <div>
            <label className="text-sm font-medium">User Information:</label>
            <div className="mt-2 p-3 bg-gray-50 rounded-md">
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {error && (
          <div>
            <label className="text-sm font-medium text-red-600">Error:</label>
            <div className="mt-2 p-3 bg-red-50 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-medium">Expected Redirect:</label>
          <div className="mt-2 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              {user?.role ? `Should redirect to: /${user.role}` : 'No user role available'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
