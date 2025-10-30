import { EmailTroubleshoot } from '@/components/email-troubleshoot'

export default function TroubleshootEmailPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Email Configuration Troubleshooting</h1>
        <p className="text-gray-600 mb-8">
          Diagnose and fix email confirmation issues with your Supabase setup.
        </p>
        
        <EmailTroubleshoot />
      </div>
    </div>
  )
}

