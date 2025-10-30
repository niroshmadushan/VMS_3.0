import { RateLimitDiagnostic } from '@/components/rate-limit-diagnostic'

export default function DiagnoseRateLimitPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Rate Limiting Diagnostic</h1>
        <p className="text-gray-600 mb-8">
          Diagnose and fix "Too many authentication attempts" errors with your custom backend.
        </p>
        
        <RateLimitDiagnostic />
      </div>
    </div>
  )
}
