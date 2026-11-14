'use client'

import { useParams } from 'next/navigation'
import { useWorkspaces } from '@/hooks/use-workspaces'
import { CollectionTree } from '@/components/sidebar/CollectionTree'
import { Divider } from '@/components/ui/divider'

export default function WorkspaceDashboardPage() {
  const params = useParams()
  const workspaceSlug = params.workspaceSlug as string

  const { data: workspaces } = useWorkspaces()
  const workspace = workspaces?.find((w: { slug: string }) => w.slug === workspaceSlug)
  const workspaceId = workspace?.id

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Workspace not found</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex">
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">{workspace.name}</h2>
          <p className="text-sm text-muted-foreground truncate">{workspace.description || 'No description'}</p>
        </div>
        <CollectionTree workspaceId={workspaceId!} />
      </div>

      <Divider className="hidden lg:block" />

      <div className="flex-1 flex flex-col">
        <div className="p-8 text-center text-muted-foreground">
          <p className="text-lg">Select a request from the sidebar to get started</p>
          <p className="text-sm mt-1">Or create a new collection to organize your API requests</p>
        </div>
      </div>
    </div>
  )
}