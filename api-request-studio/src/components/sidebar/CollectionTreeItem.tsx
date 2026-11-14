'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, MoreVertical, Trash2, Edit2, Copy, FolderPlus, FilePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Collection } from '@/types/collection'
import { useCreateCollection, useUpdateCollection, useDeleteCollection } from '@/hooks/use-collections'
import { useCreateRequest } from '@/hooks/use-collections'

interface CollectionTreeItemProps {
  collection: Collection
  depth?: number
  onSelectRequest?: (requestId: string) => void
  selectedRequestId?: string
}

export function CollectionTreeItem({ collection, depth = 0, onSelectRequest, selectedRequestId }: CollectionTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(collection.name)
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false)
  const [newRequestName, setNewRequestName] = useState('')
  const [newRequestMethod, setNewRequestMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET')

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: collection.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const updateCollection = useUpdateCollection()
  const deleteCollection = useDeleteCollection()
  const createRequest = useCreateRequest()

  const handleUpdateName = async () => {
    if (!editName.trim() || editName === collection.name) {
      setIsEditing(false)
      return
    }
    await updateCollection.mutateAsync({ id: collection.id, data: { name: editName.trim() } })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this collection and all its contents?')) return
    await deleteCollection.mutateAsync(collection.id)
  }

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRequestName.trim()) return
    await createRequest.mutateAsync({
      name: newRequestName.trim(),
      method: newRequestMethod,
      url: '',
      bodyType: 'NONE',
      collectionId: collection.id,
    })
    setNewRequestName('')
    setShowNewRequestDialog(false)
  }

  const hasChildren = (collection.children || []).length > 0
  const hasRequests = (collection.requests || []).length > 0

  return (
    <li style={style} ref={setNodeRef} className="group">
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors',
          'hover:bg-accent',
          isDragging && 'bg-accent shadow-md'
        )}
      >
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded) }}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              aria-expanded={isExpanded}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          )}

          <span
            className={cn(
              'flex items-center gap-2 flex-1 min-w-0 cursor-pointer',
              'text-sm font-medium truncate',
              selectedRequestId === collection.id && 'bg-primary text-primary-foreground'
            )}
            onDoubleClick={() => setIsEditing(true)}
          >
            {isEditing ? (
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleUpdateName}
                onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateName(); if (e.key === 'Escape') setIsEditing(false) }}
                autoFocus
                className="w-32 h-7 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                {(collection.children && collection.children.length > 0) ? (
                  isExpanded ? <FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="truncate">{collection.name}</span>
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setIsEditing(true)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setShowNewRequestDialog(true)}>
                <FilePlus className="mr-2 h-4 w-4" />
                New Request
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => { /* TODO: duplicate */ }}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <ul className="ml-6 space-y-1" role="group">
          {collection.children?.map((child) => (
            <CollectionTreeItem
              key={child.id}
              collection={child}
              depth={depth + 1}
              onSelectRequest={onSelectRequest}
              selectedRequestId={selectedRequestId}
            />
          ))}
        </ul>
      )}

      {isExpanded && hasRequests && (
        <ul className="ml-6 space-y-1" role="group">
          {collection.requests?.map((request) => (
            <li key={request.id}>
              <button
                onClick={() => onSelectRequest?.(request.id)}
                className={cn(
                  'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm',
                  'hover:bg-accent transition-colors',
                  'text-left truncate',
                  selectedRequestId === request.id && 'bg-primary text-primary-foreground'
                )}
              >
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{request.name}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.5 text-xs font-medium rounded',
                    selectedRequestId === request.id
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {request.method}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* New Request Dialog */}
      <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>New Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateRequest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="request-name">Name</Label>
              <Input
                id="request-name"
                value={newRequestName}
                onChange={(e) => setNewRequestName(e.target.value)}
                placeholder="Request name"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="request-method">Method</Label>
              <select
                id="request-method"
                value={newRequestMethod}
                onChange={(e) => setNewRequestMethod(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowNewRequestDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newRequestName.trim()}>
                Create Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </li>
  )
}