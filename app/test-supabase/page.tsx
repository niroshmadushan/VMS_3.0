import { SupabaseConnectionTest } from '@/components/supabase-connection-test'

export default function TestSupabasePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase VM Connection Test</h1>
        <p className="text-gray-600 mb-8">
          This page helps you verify that your application is properly connected to your VM Supabase instance.
        </p>
        
        <SupabaseConnectionTest />
        
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-medium text-blue-900 mb-2">Setup Instructions:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Create a <code className="bg-blue-100 px-1 rounded">.env.local</code> file in your project root</li>
            <li>Add your VM Supabase credentials:
              <pre className="mt-2 p-2 bg-blue-100 rounded text-xs overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://supa.minimart.best
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here`}
              </pre>
            </li>
            <li>Get your keys from your VM Supabase dashboard at <code className="bg-blue-100 px-1 rounded">https://supa.minimart.best</code></li>
            <li>Restart your development server after adding the environment variables</li>
          </ol>
        </div>
      </div>
    </div>
  )
}




