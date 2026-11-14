'use client'

import { useState, useRef, useEffect } from 'react'
import { Brackets, FileText, Copy, Download, FileCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Editor } from '@monaco-editor/react'
import type { BodyType } from '@/types/collection'

interface BodyTabProps {
  body: any
  bodyType: BodyType
  onUpdate: (body: any, bodyType: BodyType) => void
}

const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: 'NONE', label: 'None' },
  { value: 'JSON', label: 'JSON' },
  { value: 'FORM_DATA', label: 'Form Data' },
  { value: 'URLENCODED', label: 'URL Encoded' },
  { value: 'RAW', label: 'Raw' },
  { value: 'BINARY', label: 'Binary' },
  { value: 'GRAPHQL', label: 'GraphQL' },
]

export function BodyTab({ body, bodyType, onUpdate }: BodyTabProps) {
  const [activeBodyType, setActiveBodyType] = useState<BodyType>(bodyType)
  const [jsonContent, setJsonContent] = useState<string>('')
  const [rawContent, setRawContent] = useState<string>('')
  const [graphqlQuery, setGraphqlQuery] = useState<string>(body?.query || '')
  const [graphqlVariables, setGraphqlVariables] = useState<string>(JSON.stringify(body?.variables || {}, null, 2))
  const [formData, setFormData] = useState<Array<{ key: string; value: string; type: 'text' | 'file'; enabled: boolean }>>([])
  const [urlEncoded, setUrlEncoded] = useState<Array<{ key: string; value: string; enabled: boolean }>>([])
  const editorRef = useRef<any>(null)

  useEffect(() => {
    if (activeBodyType === 'JSON' && body) {
      setJsonContent(JSON.stringify(body, null, 2))
    }
  }, [activeBodyType, body])

  useEffect(() => {
    if (activeBodyType === 'RAW' && body) {
      setRawContent(typeof body === 'string' ? body : JSON.stringify(body, null, 2))
    }
  }, [activeBodyType, body])

  useEffect(() => {
    if (activeBodyType === 'FORM_DATA' && body) {
      const entries = Object.entries(body).map(([key, value]) => ({
        key,
        value: String(value),
        type: 'text' as const,
        enabled: true,
      }))
      setFormData(entries)
    }
  }, [activeBodyType, body])

  useEffect(() => {
    if (activeBodyType === 'URLENCODED' && body) {
      const entries = Object.entries(body).map(([key, value]) => ({
        key,
        value: String(value),
        enabled: true,
      }))
      setUrlEncoded(entries)
    }
  }, [activeBodyType, body])

  const handleBodyTypeChange = (type: BodyType) => {
    setActiveBodyType(type)
    let newBody: any = null
    switch (type) {
      case 'NONE':
        newBody = null
        break
      case 'JSON':
        try {
          newBody = jsonContent ? JSON.parse(jsonContent) : {}
        } catch {
          newBody = {}
        }
        break
      case 'FORM_DATA':
        newBody = {}
        formData.filter((f) => f.enabled && f.key).forEach((f) => { newBody[f.key] = f.value })
        break
      case 'URLENCODED':
        newBody = {}
        urlEncoded.filter((u) => u.enabled && u.key).forEach((u) => { newBody[u.key] = u.value })
        break
      case 'RAW':
        newBody = rawContent
        break
      case 'GRAPHQL':
        try {
          newBody = {
            query: graphqlQuery,
            variables: graphqlVariables ? JSON.parse(graphqlVariables) : {},
          }
        } catch {
          newBody = { query: graphqlQuery, variables: {} }
        }
        break
    }
    onUpdate(newBody, type)
  }

  const handleJsonChange = (value: string | undefined) => {
    const str = value || ''
    setJsonContent(str)
    try {
      const parsed = str ? JSON.parse(str) : {}
      onUpdate(parsed, 'JSON')
    } catch {
      // Invalid JSON, don't update
    }
  }

  const handleRawChange = (value: string) => {
    setRawContent(value)
    onUpdate(value, 'RAW')
  }

  const handleGraphqlQueryChange = (value: string) => {
    setGraphqlQuery(value)
    try {
      const vars = graphqlVariables ? JSON.parse(graphqlVariables) : {}
      onUpdate({ query: value, variables: vars }, 'GRAPHQL')
    } catch {
      onUpdate({ query: value, variables: {} }, 'GRAPHQL')
    }
  }

  const handleGraphqlVariablesChange = (value: string) => {
    setGraphqlVariables(value)
    try {
      const vars = value ? JSON.parse(value) : {}
      onUpdate({ query: graphqlQuery, variables: vars }, 'GRAPHQL')
    } catch {
      // Invalid JSON
    }
  }

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonContent)
      const formatted = JSON.stringify(parsed, null, 2)
      setJsonContent(formatted)
      onUpdate(parsed, 'JSON')
    } catch {
      // Invalid JSON
    }
  }

  const renderBodyEditor = () => {
    switch (activeBodyType) {
      case 'NONE':
        return (
          <div className="p-4 text-center text-muted-foreground">
            <p className="mb-2">No body</p>
            <p className="text-xs">Select a body type to add a request body</p>
          </div>
        )

      case 'JSON':
        return (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <Label>Request Body (JSON)</Label>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={formatJson}>
                  <FileCode className="mr-2 h-4 w-4" />
                  Format
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(jsonContent)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
            </div>
            <Editor
              height="calc(100% - 50px)"
              defaultLanguage="json"
              value={jsonContent}
              onChange={handleJsonChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                wordWrap: 'on',
                automaticLayout: true,
              }}
            />
          </div>
        )

      case 'FORM_DATA':
        return (
          <div className="p-4 space-y-4 overflow-y-auto">
            <FormDataEditor
              formData={formData}
              setFormData={setFormData}
              onUpdate={(data) => {
                const body: any = {}
                data.filter((f) => f.enabled && f.key).forEach((f) => { body[f.key] = f.value })
                onUpdate(body, 'FORM_DATA')
              }}
            />
          </div>
        )

      case 'URLENCODED':
        return (
          <div className="p-4 space-y-4 overflow-y-auto">
            <UrlEncodedEditor
              urlEncoded={urlEncoded}
              setUrlEncoded={setUrlEncoded}
              onUpdate={(data) => {
                const body: any = {}
                data.filter((u) => u.enabled && u.key).forEach((u) => { body[u.key] = u.value })
                onUpdate(body, 'URLENCODED')
              }}
            />
          </div>
        )

      case 'RAW':
        return (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <Label>Raw Body</Label>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(rawContent)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
            </div>
            <Textarea
              value={rawContent}
              onChange={(e) => handleRawChange(e.target.value)}
              placeholder="Enter raw request body..."
              className="flex-1 font-mono text-sm resize-none p-4"
              spellCheck={false}
            />
          </div>
        )

      case 'BINARY':
        return (
          <div className="p-4 text-center text-muted-foreground">
            <p className="mb-2">Binary file upload</p>
            <p className="text-xs">Select a file to upload as request body</p>
            <input type="file" className="mt-4" onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                onUpdate(file, 'BINARY')
              }
            }} />
          </div>
        )

      case 'GRAPHQL':
        return (
          <div className="flex flex-col h-full">
            <Tabs defaultValue="query" className="flex-1">
              <TabsList className="p-4 border-b">
                <TabsTrigger value="query">Query</TabsTrigger>
                <TabsTrigger value="variables">Variables</TabsTrigger>
              </TabsList>
              <TabsContent value="query" className="flex-1 p-0">
                <Editor
                  height="100%"
                  defaultLanguage="graphql"
                  value={graphqlQuery}
                  onChange={(e) => handleGraphqlQueryChange(e || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    automaticLayout: true,
                  }}
                />
              </TabsContent>
              <TabsContent value="variables" className="flex-1 p-0">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  value={graphqlVariables}
                  onChange={(e) => handleGraphqlVariablesChange(e || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    automaticLayout: true,
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <Label className="block mb-2">Body Type</Label>
        <Select value={activeBodyType} onValueChange={handleBodyTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select body type" />
          </SelectTrigger>
          <SelectContent>
            {BODY_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-hidden">
        {renderBodyEditor()}
      </div>
    </div>
  )
}

function FormDataEditor({
  formData,
  setFormData,
  onUpdate,
}: {
  formData: Array<{ key: string; value: string; type: 'text' | 'file'; enabled: boolean }>
  setFormData: React.Dispatch<React.SetStateAction<Array<{ key: string; value: string; type: 'text' | 'file'; enabled: boolean }>>>
  onUpdate: (data: Array<{ key: string; value: string; type: 'text' | 'file'; enabled: boolean }>) => void
}) {
  const addRow = () => {
    const newData = [...formData, { key: '', value: '', type: 'text' as const, enabled: true }]
    setFormData(newData)
    onUpdate(newData)
  }

  const updateRow = (index: number, field: string, value: any) => {
    const newData = [...formData]
    newData[index] = { ...newData[index], [field]: value }
    setFormData(newData)
    onUpdate(newData)
  }

  const removeRow = (index: number) => {
    const newData = formData.filter((_, i) => i !== index)
    setFormData(newData)
    onUpdate(newData)
  }

  return (
    <div className="space-y-2">
      {formData.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={row.enabled}
            onChange={(e) => updateRow(index, 'enabled', e.target.checked)}
            className="h-4 w-4 translate-y-0.5"
          />
          <Input
            value={row.key}
            onChange={(e) => updateRow(index, 'key', e.target.value)}
            placeholder="Key"
            className="w-40"
          />
          <select
            value={row.type}
            onChange={(e) => updateRow(index, 'type', e.target.value)}
            className="w-24 border rounded px-2 py-1 text-sm"
          >
            <option value="text">Text</option>
            <option value="file">File</option>
          </select>
          <Input
            value={row.value}
            onChange={(e) => updateRow(index, 'value', e.target.value)}
            placeholder="Value"
            className="flex-1"
            type={row.type === 'file' ? 'file' : 'text'}
          />
          <Button variant="ghost" size="icon" onClick={() => removeRow(index)} className="text-destructive">
            <span>×</span>
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addRow}>
        Add Field
      </Button>
    </div>
  )
}

function UrlEncodedEditor({
  urlEncoded,
  setUrlEncoded,
  onUpdate,
}: {
  urlEncoded: Array<{ key: string; value: string; enabled: boolean }>
  setUrlEncoded: React.Dispatch<React.SetStateAction<Array<{ key: string; value: string; enabled: boolean }>>>
  onUpdate: (data: Array<{ key: string; value: string; enabled: boolean }>) => void
}) {
  const addRow = () => {
    const newData = [...urlEncoded, { key: '', value: '', enabled: true }]
    setUrlEncoded(newData)
    onUpdate(newData)
  }

  const updateRow = (index: number, field: string, value: any) => {
    const newData = [...urlEncoded]
    newData[index] = { ...newData[index], [field]: value }
    setUrlEncoded(newData)
    onUpdate(newData)
  }

  const removeRow = (index: number) => {
    const newData = urlEncoded.filter((_, i) => i !== index)
    setUrlEncoded(newData)
    onUpdate(newData)
  }

  return (
    <div className="space-y-2">
      {urlEncoded.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={row.enabled}
            onChange={(e) => updateRow(index, 'enabled', e.target.checked)}
            className="h-4 w-4 translate-y-0.5"
          />
          <Input
            value={row.key}
            onChange={(e) => updateRow(index, 'key', e.target.value)}
            placeholder="Key"
            className="w-48"
          />
          <span className="text-muted-foreground">=</span>
          <Input
            value={row.value}
            onChange={(e) => updateRow(index, 'value', e.target.value)}
            placeholder="Value"
            className="flex-1"
          />
          <Button variant="ghost" size="icon" onClick={() => removeRow(index)} className="text-destructive">
            <span>×</span>
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addRow}>
        Add Pair
      </Button>
    </div>
  )
}