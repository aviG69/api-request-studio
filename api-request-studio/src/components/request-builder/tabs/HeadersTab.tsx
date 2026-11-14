'use client'

import { useState } from 'react'
import { Plus, Trash2, FileText, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { RequestHeader } from '@/types/collection'

interface HeadersTabProps {
  headers: RequestHeader[]
  onUpdate: (headers: RequestHeader[]) => void
}

const COMMON_HEADERS = [
  { key: 'Content-Type', value: 'application/json' },
  { key: 'Accept', value: 'application/json' },
  { key: 'Authorization', value: '' },
  { key: 'User-Agent', value: 'API Request Studio' },
  { key: 'Cache-Control', value: 'no-cache' },
]

export function HeadersTab({ headers, onUpdate }: HeadersTabProps) {
  const [headerList, setHeaderList] = useState<RequestHeader[]>(headers)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  const addHeader = () => {
    if (!newKey.trim()) return
    const newHeader: RequestHeader = { key: newKey.trim(), value: newValue, enabled: true }
    const updated = [...headerList, newHeader]
    setHeaderList(updated)
    onUpdate(updated)
    setNewKey('')
    setNewValue('')
  }

  const updateHeader = (index: number, field: keyof RequestHeader, value: any) => {
    const updated = [...headerList]
    updated[index] = { ...updated[index], [field]: value }
    setHeaderList(updated)
    onUpdate(updated)
  }

  const removeHeader = (index: number) => {
    const updated = headerList.filter((_, i) => i !== index)
    setHeaderList(updated)
    onUpdate(updated)
  }

  const addCommonHeader = (key: string, value: string) => {
    if (headerList.some((h) => h.key.toLowerCase() === key.toLowerCase())) return
    const newHeader: RequestHeader = { key, value, enabled: true }
    const updated = [...headerList, newHeader]
    setHeaderList(updated)
    onUpdate(updated)
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Headers</h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Add Common
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {COMMON_HEADERS.map((h) => (
              <DropdownMenuItem
                key={h.key}
                onSelect={() => addCommonHeader(h.key, h.value)}
                disabled={headerList.some((existing) => existing.key.toLowerCase() === h.key.toLowerCase())}
              >
                {h.key}: {h.value || '(empty)'}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        {headerList.map((header, index) => (
          <div key={index} className="flex items-center gap-2">
            <Checkbox
              checked={header.enabled}
              onCheckedChange={(checked) => updateHeader(index, 'enabled', checked)}
              className="translate-y-0.5"
            />
            <Input
              value={header.key}
              onChange={(e) => updateHeader(index, 'key', e.target.value)}
              placeholder="Key"
              className="w-48"
            />
            <span className="text-muted-foreground">:</span>
            <Input
              value={header.value}
              onChange={(e) => updateHeader(index, 'value', e.target.value)}
              placeholder="Value"
              className="flex-1"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                  <Copy className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => navigator.clipboard.writeText(`${header.key}: ${header.value}`)}>
                  Copy Header
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigator.clipboard.writeText(header.value)}>
                  Copy Value
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeHeader(index)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {headerList.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-2">No headers</p>
            <p className="text-xs">Add headers to include in the request</p>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Key"
            className="w-48"
            onKeyDown={(e) => e.key === 'Enter' && addHeader()}
          />
          <span className="text-muted-foreground">:</span>
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Value"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && addHeader()}
          />
          <Button size="sm" onClick={addHeader} disabled={!newKey.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}