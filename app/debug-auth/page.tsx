import { AuthDebug } from '@/components/auth-debug'

export default function DebugAuthPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug</h1>
        <p className="text-gray-600 mb-8">
          Debug authentication state and user information.
        </p>
        
        <AuthDebug />
      </div>
    </div>
  )
}
