'use client'

import { useState } from 'react'
import { sendAlertSms, fetchSmsStatus } from '@/lib/ml-api'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

interface SubscribeFormProps {
  onSent?: () => void
}

export function SubscribeForm({ onSent }: SubscribeFormProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [smsConfigured, setSmsConfigured] = useState<boolean | null>(null)

  const checkStatus = async () => {
    const status = await fetchSmsStatus()
    setSmsConfigured(status?.configured ?? false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
      setResult({ success: false, message: 'Enter a valid phone number with country code (e.g., +91XXXXXXXXXX)' })
      return
    }

    setSending(true)
    setResult(null)

    try {
      const response = await sendAlertSms(phoneNumber)
      if (response) {
        const successCount = response.results.filter(r => r.sms_result.success).length
        const failCount = response.results.length - successCount
        
        if (successCount > 0) {
          setResult({
            success: true,
            message: `SMS sent for ${successCount} alert(s). ${failCount > 0 ? `${failCount} failed.` : ''}`
          })
          setPhoneNumber('')
          onSent?.()
        } else {
          setResult({
            success: false,
            message: response.results[0]?.sms_result.error || 'Failed to send SMS'
          })
        }
      } else {
        setResult({ success: false, message: 'Failed to connect to server' })
      }
    } catch {
      setResult({ success: false, message: 'An error occurred' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center gap-2 mb-3">
        <span style={{ fontSize: 16 }}>&#x1F4F1;</span>
        <h3 className="text-sm font-medium">SMS Alert Subscription</h3>
      </div>
      
      {smsConfigured === null && (
        <Button variant="outline" size="sm" onClick={checkStatus} className="mb-3 text-xs">
          Check SMS Status
        </Button>
      )}
      
      {smsConfigured === false && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mb-3">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            SMS service not configured. Add Twilio credentials to .env.local
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="phone" className="text-xs text-muted-foreground mb-1 block">
            Phone number with country code
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="+91XXXXXXXXXX"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={sending}
          />
        </div>
        
        <Button type="submit" size="sm" disabled={sending || !phoneNumber} className="w-full">
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <span style={{ marginRight: 6 }}>&#x2709;</span>
              Send Alert SMS
            </>
          )}
        </Button>
      </form>

      {result && (
        <div className={`mt-3 flex items-start gap-2 text-xs p-2 rounded-md ${
          result.success 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
        }`}>
          {result.success ? (
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          )}
          <span>{result.message}</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-3">
        Sends SMS for High and Very High risk alerts in all monitored regions.
      </p>
    </div>
  )
}
