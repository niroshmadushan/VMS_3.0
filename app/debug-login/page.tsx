import { LoginDebug } from '@/components/login-debug'

export default function DebugLoginPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Login Flow Debug</h1>
        <p className="text-gray-600 mb-8">
          Debug why the login shows loading but doesn't ask for OTP.
        </p>
        
        <LoginDebug />
      </div>
    </div>
  )
}
