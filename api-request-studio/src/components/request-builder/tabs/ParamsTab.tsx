'use client'

import { useState } from 'react'
import { Plus, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

interface RequestQueryParam {
  key: string
  value: string
  enabled: boolean
}

interface ParamsTabProps {
  queryParams: RequestQueryParam[]
  onUpdate: (params: RequestQueryParam[]) => void
}

export function ParamsTab({ queryParams, onUpdate }: ParamsTabProps) {
  const [params, setParams] = useState<RequestQueryParam[]>(queryParams)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  const addParam = () => {
    if (!newKey.trim()) return
    const newParam: RequestQueryParam = { key: newKey.trim(), value: newValue, enabled: true }
    const updated = [...params, newParam]
    setParams(updated)
    onUpdate(updated)
    setNewKey('')
    setNewValue('')
  }

  const updateParam = (index: number, field: keyof RequestQueryParam, value: any) => {
    const updated = [...params]
    updated[index] = { ...updated[index], [field]: value }
    setParams(updated)
    onUpdate(updated)
  }

  const removeParam = (index: number) => {
    const updated = params.filter((_, i) => i !== index)
    setParams(updated)
    onUpdate(updated)
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-medium">Query Parameters</h4>
        <p className="text-xs text-muted-foreground">
          Parameters will be appended to the URL
        </p>
      </div>

      <div className="space-y-2">
        {params.map((param, index) => (
          <div key={index} className="flex items-center gap-2">
            <Checkbox
              checked={param.enabled}
              onCheckedChange={(checked) => updateParam(index, 'enabled', checked)}
              className="translate-y-0.5"
            />
            <Input
              value={param.key}
              onChange={(e) => updateParam(index, 'key', e.target.value)}
              placeholder="Key"
              className="w-48"
            />
            <span className="text-muted-foreground">=</span>
            <Input
              value={param.value}
              onChange={(e) => updateParam(index, 'value', e.target.value)}
              placeholder="Value"
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeParam(index)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {params.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-2">No query parameters</p>
            <p className="text-xs">Add parameters to append to the URL</p>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Key"
            className="w-48"
            onKeyDown={(e) => e.key === 'Enter' && addParam()}
          />
          <span className="text-muted-foreground">=</span>
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Value"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && addParam()}
          />
          <Button size="sm" onClick={addParam} disabled={!newKey.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}