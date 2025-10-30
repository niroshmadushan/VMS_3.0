import { AuthTroubleshoot } from '@/components/auth-troubleshoot'

export default function TroubleshootAuthPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Troubleshooting</h1>
        <p className="text-gray-600 mb-8">
          Use this tool to diagnose and fix authentication issues with your Supabase setup.
        </p>
        
        <AuthTroubleshoot />
      </div>
    </div>
  )
}




