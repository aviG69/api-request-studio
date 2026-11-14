'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
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
import { Search, Filter, Download, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'

interface HistoryItem {
  id: string
  method: string
  url: string
  statusCode: number | null
  responseTime: number | null
  createdAt: string
  headers: any[]
  queryParams: any[]
  body: any
  bodyType: string
  responseHeaders: Record<string, string> | null
  responseBody: any
  error: string | null
}

export default function HistoryPage() {
  const params = useParams()
  const workspaceSlug = params.workspaceSlug as string

  const [searchQuery, setSearchQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  const { data: workspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => fetch('/api/workspaces').then((res) => res.json()),
  })

  const workspace = workspaces?.find((w: any) => w.slug === workspaceSlug)

  const { data: history, isLoading } = useQuery({
    queryKey: ['history', workspace?.id, searchQuery, methodFilter, statusFilter],
    queryFn: async () => {
      if (!workspace?.id) return []
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (methodFilter !== 'all') params.set('method', methodFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      params.set('limit', String(pageSize))
      params.set('offset', String((currentPage - 1) * pageSize))
      const res = await fetch(`/api/history?${params}`)
      return res.json()
    },
    enabled: !!workspace?.id,
  })

  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

  const filteredHistory = history?.items || []
  const totalPages = Math.ceil((history?.total || 0) / pageSize)

  function getStatusColor(status: number | null) {
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    if (status >= 300 && status < 400) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    if (status >= 400 && status < 500) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    if (status >= 500) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }

  const handleReRun = async (item: HistoryItem) => {
    try {
      const res = await fetch('/api/requests/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: item.method,
          url: item.url,
          headers: item.headers,
          queryParams: item.queryParams,
          body: item.body,
          bodyType: item.bodyType,
        }),
      })
      const result = await res.json()
      // TODO: Show response in a modal or navigate to request view
      console.log('Re-run result:', result)
    } catch (error) {
      console.error('Re-run failed:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">History</h1>
        <p className="text-muted-foreground">View and re-run your past requests</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="flex h-10 w-[140px] items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="all">All Methods</option>
            {methods.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="flex h-10 w-[140px] items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="all">All Status</option>
            <option value="2xx">2xx Success</option>
            <option value="3xx">3xx Redirect</option>
            <option value="4xx">4xx Client Error</option>
            <option value="5xx">5xx Server Error</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-center text-muted-foreground">
          <div>
            <p className="text-lg">No history found</p>
            <p className="text-sm mt-1">Execute requests to see them here</p>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">URL</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredHistory.map((item: HistoryItem) => (
                  <tr key={item.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn(
                        'px-2 py-0.5 text-xs font-mono',
                        item.method === 'GET' && 'bg-green-100 text-green-800',
                        item.method === 'POST' && 'bg-orange-100 text-orange-800',
                        item.method === 'PUT' && 'bg-blue-100 text-blue-800',
                        item.method === 'PATCH' && 'bg-yellow-100 text-yellow-800',
                        item.method === 'DELETE' && 'bg-red-100 text-red-800',
                      )}>
                        {item.method}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm truncate max-w-[400px]" title={item.url}>
                        {item.url}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {item.error ? (
                        <Badge variant="destructive">Error</Badge>
                      ) : (
                        <Badge variant="outline" className={getStatusColor(item.statusCode)}>
                          {item.statusCode || '—'}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                      {item.responseTime !== null ? `${item.responseTime}ms` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handleReRun(item)}>
                            Re-run Request
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            View Response
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} • {history?.total || 0} total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}