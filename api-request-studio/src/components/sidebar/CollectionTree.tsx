'use client'

import { useState } from 'react'
import { useCollections, useCreateCollection, useDeleteCollection, useReorderCollections } from '@/hooks/use-collections'
import { CollectionTreeItem } from './CollectionTreeItem'
import { Plus, Folder, FileText, MoreVertical, Trash2, Edit2, Copy, FolderPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useDndContext } from '@dnd-kit/core'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import type { Collection } from '@/types/collection'

interface CollectionTreeProps {
  workspaceId: string
  onSelectRequest?: (requestId: string) => void
  selectedRequestId?: string
}

function CollectionNode({
  collections,
  depth = 0,
  onSelectRequest,
  selectedRequestId,
}: {
  collections: Collection[]
  depth?: number
  onSelectRequest?: (requestId: string) => void
  selectedRequestId?: string
}) {
  return (
    <ul className="space-y-1" role="tree">
      {collections.map((collection) => (
        <CollectionTreeItem
          key={collection.id}
          collection={collection}
          depth={depth}
          onSelectRequest={onSelectRequest}
          selectedRequestId={selectedRequestId}
        />
      ))}
    </ul>
  )
}

export function CollectionTree({ workspaceId, onSelectRequest, selectedRequestId }: CollectionTreeProps) {
  const { data: collections, isLoading } = useCollections(workspaceId)
  const createCollection = useCreateCollection()
  const deleteCollection = useDeleteCollection()
  const reorderCollections = useReorderCollections()

  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionParentId, setNewCollectionParentId] = useState<string | undefined>()
  const [isCreating, setIsCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const handleDragEnd = async (event: any) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const allCollections = collections?.flatMap((c: { id: string; children?: any[] }) => [c, ...(c.children || [])]) ?? []
    const activeCollection = allCollections.find((c: { id: string }) => c.id === active.id)
    const overCollection = allCollections.find((c: { id: string }) => c.id === over.id)

    if (!activeCollection || !overCollection) return

    const activeIndex = allCollections.findIndex((c: { id: string }) => c.id === active.id) ?? 0
    const overIndex = allCollections.findIndex((c: { id: string }) => c.id === over.id) ?? 0

    const items = allCollections.map((c: { id: string; parentId?: string }, index: number) => ({
      id: c.id,
      order: index === activeIndex ? overIndex : index === overIndex ? activeIndex : index,
      parentId: c.parentId,
    })) ?? []

    await reorderCollections.mutateAsync(items)
  }

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCollectionName.trim() || isCreating) return

    setIsCreating(true)
    try {
      await createCollection.mutateAsync({
        name: newCollectionName.trim(),
        workspaceId,
        parentId: newCollectionParentId,
      })
      setNewCollectionName('')
      setNewCollectionParentId(undefined)
      setIsDialogOpen(false)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteCollection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this collection and all its contents?')) return
    setDeletingId(id)
    try {
      await deleteCollection.mutateAsync(id)
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const rootCollections = collections?.filter((c: { parentId?: string }) => !c.parentId) ?? []
  const allCollections = collections?.flatMap((c: { id: string; children?: any[] }) => [c, ...(c.children || [])]) ?? []

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Collections
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>New Collection</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="collection-name">Name</Label>
                <Input
                  id="collection-name"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Collection name"
                  autoFocus
                  disabled={isCreating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collection-parent">Parent (optional)</Label>
                <select
                  id="collection-parent"
                  value={newCollectionParentId || ''}
                  onChange={(e) => setNewCollectionParentId(e.target.value || undefined)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isCreating}
                >
                  <option value="">None (Root level)</option>
                  {allCollections
                    .filter((c: { requests?: any[]; children?: any[] }) => c.requests?.length === 0 || (c.children?.length ?? 0) > 0)
                    .map((c: { id: string; name: string }) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isCreating}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating || !newCollectionName.trim()}>
                  {isCreating ? 'Creating...' : 'Create Collection'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={allCollections.map((c: { id: string }) => c.id)} strategy={verticalListSortingStrategy}>
          <CollectionNode
            collections={rootCollections}
            onSelectRequest={onSelectRequest}
            selectedRequestId={selectedRequestId}
          />
        </SortableContext>
      </DndContext>
    </div>
  )
}