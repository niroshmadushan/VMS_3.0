import { BackendTest } from '@/components/backend-test'

export default function TestBackendPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Backend API Test</h1>
        <p className="text-gray-600 mb-8">
          Test your backend API endpoints to diagnose login issues.
        </p>
        
        <BackendTest />
      </div>
    </div>
  )
}
