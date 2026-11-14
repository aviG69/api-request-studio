'use client'

import { useState, useMemo } from 'react'
import { Copy, Download, ChevronLeft, ChevronRight, Search, Filter, Columns, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface TableResponseProps {
  data: any
}

export function TableResponse({ data }: TableResponseProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleColumns, setVisibleColumns] = useState<string[]>([])
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 50

  const rows = useMemo(() => {
    if (!Array.isArray(data)) return []
    return data.filter((item) => typeof item === 'object' && item !== null)
  }, [data])

  const columns = useMemo(() => {
    if (rows.length === 0) return []
    const allKeys = new Set<string>()
    rows.forEach((row) => Object.keys(row).forEach((k) => allKeys.add(k)))
    return Array.from(allKeys)
  }, [rows])

  useMemo(() => {
    if (visibleColumns.length === 0 && columns.length > 0) {
      setVisibleColumns(columns)
    }
  }, [columns])

  const filteredRows = useMemo(() => {
    if (!searchQuery) return rows
    const query = searchQuery.toLowerCase()
    return rows.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(query))
    )
  }, [rows, searchQuery])

  const sortedRows = useMemo(() => {
    if (!sortConfig) return filteredRows
    return [...filteredRows].sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]
      if (aVal === bVal) return 0
      const direction = sortConfig.direction === 'asc' ? 1 : -1
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * direction
      }
      return String(aVal).localeCompare(String(bVal)) * direction
    })
  }, [filteredRows, sortConfig])

  const totalPages = Math.ceil(sortedRows.length / pageSize)
  const paginatedRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handleCopy = () => {
    const headers = visibleColumns.join('\t')
    const rowsData = paginatedRows.map((row) => visibleColumns.map((col) => String(row[col] ?? '')).join('\t')).join('\n')
    navigator.clipboard.writeText(`${headers}\n${rowsData}`)
  }

  const handleDownload = () => {
    const headers = visibleColumns.join(',')
    const rowsData = paginatedRows.map((row) => visibleColumns.map((col) => `"${String(row[col] ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const csv = `${headers}\n${rowsData}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'response.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleColumn = (column: string) => {
    setVisibleColumns((prev) =>
      prev.includes(column) ? prev.filter((c) => c !== column) : [...prev, column]
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <Columns className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No tabular data available</p>
          <p className="text-xs mt-1">Response must be an array of objects</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleCopy} className="h-8 w-8">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDownload} className="h-8 w-8">
            <Download className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Filter rows... (Ctrl+F)"
            className="h-8"
          />
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="mr-2 h-4 w-4" />
                Columns ({visibleColumns.length}/{columns.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 max-h-96">
              {columns.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col}
                  checked={visibleColumns.includes(col)}
                  onCheckedChange={() => toggleColumn(col)}
                >
                  {col}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-muted/50 z-10">
            <tr>
              {visibleColumns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-left font-medium text-muted-foreground border-b cursor-pointer hover:bg-muted"
                  onClick={() => handleSort(col)}
                >
                  <div className="flex items-center gap-1">
                    {col}
                    {sortConfig?.key === col && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b hover:bg-muted/50">
                {visibleColumns.map((col) => (
                  <td key={col} className="px-3 py-2 border-b font-mono text-sm max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {String(row[col] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedRows.length === 0 && (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No rows match the filter
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} • {sortedRows.length} rows
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
    </div>
  )
}