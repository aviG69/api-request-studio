'use client'

import { Copy, Download, Maximize2, Minimize2, Clock, Globe, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ResponseHeaderProps {
  response: {
    status: number
    statusText: string
    headers: Record<string, string>
    timing: any
    responseTime: number
    body: any
  }
  onToggleExpand: () => void
  isExpanded: boolean
}

function getStatusColor(status: number) {
  if (status >= 200 && status < 300) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  if (status >= 300 && status < 400) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
  if (status >= 400 && status < 500) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
  if (status >= 500) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
}

export function ResponseHeader({ response, onToggleExpand, isExpanded }: ResponseHeaderProps) {
  const { status, statusText, headers, timing, responseTime } = response

  const statusColor = getStatusColor(status)

  const formatHeaders = (headers: Record<string, string>) =>
    Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')

  const copyHeaders = () => navigator.clipboard.writeText(formatHeaders(headers))
  const copyAll = () => navigator.clipboard.writeText(
    `HTTP/1.1 ${status} ${statusText}\n${formatHeaders(headers)}\n\n${JSON.stringify(response.body, null, 2)}`
  )

  return (
    <div className="border-b bg-card p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Badge className={cn('px-3 py-1.5 text-sm font-mono', statusColor)}>
            {status} {statusText}
          </Badge>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {responseTime !== undefined && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {responseTime}ms
              </span>
            )}
            {timing && (
              <>
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  DNS: {timing.dns?.toFixed(0) || 0}ms
                </span>
                <span className="flex items-center gap-1">
                  <Server className="h-3.5 w-3.5" />
                  TCP: {timing.tcp?.toFixed(0) || 0}ms
                </span>
                {timing.tls && (
                  <span className="flex items-center gap-1">
                    <Server className="h-3.5 w-3.5" />
                    TLS: {timing.tls?.toFixed(0) || 0}ms
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  TTFB: {timing.ttfb?.toFixed(0) || 0}ms
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  Download: {timing.download?.toFixed(0) || 0}ms
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={copyHeaders}>
                Copy Headers
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={copyAll}>
                Copy Response
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleExpand}
            className="h-8 w-8"
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Response Headers */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-sm font-medium">Response Headers</h5>
          <Input
            placeholder="Filter headers..."
            className="w-64 h-8 text-sm"
            onChange={(e) => {
              const filter = e.target.value.toLowerCase()
              document.querySelectorAll('[data-header-key]').forEach((el) => {
                const key = el.getAttribute('data-header-key')?.toLowerCase() || ''
                const value = el.getAttribute('data-header-value')?.toLowerCase() || ''
                ;(el as HTMLElement).style.display = key.includes(filter) || value.includes(filter) ? 'flex' : 'none'
              })
            }}
          />
        </div>
        <div className="max-h-48 overflow-y-auto border rounded bg-background p-2 font-mono text-xs">
          {Object.entries(headers).map(([key, value]) => (
            <div
              key={key}
              className="flex gap-4 py-1"
              data-header-key={key.toLowerCase()}
              data-header-value={value.toLowerCase()}
            >
              <span className="text-muted-foreground min-w-[150px]">{key}:</span>
              <span className="break-all flex-1">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}