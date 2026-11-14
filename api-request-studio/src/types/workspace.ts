export interface User {
  id: string
  name: string | null
  email: string
  image: string | null
}

export interface WorkspaceMember {
  id: string
  userId: string
  workspaceId: string
  role: MemberRole
  joinedAt: string
  user: User
}

export type MemberRole = 'ADMIN' | 'EDITOR' | 'VIEWER'

export interface Workspace {
  id: string
  name: string
  slug: string
  description: string | null
  ownerId: string
  createdAt: string
  updatedAt: string
  owner: User
  members: WorkspaceMember[]
  _count?: {
    collections: number
    environments: number
    invitations: number
  }
}

export interface Invitation {
  id: string
  email: string
  workspaceId: string
  role: MemberRole
  token: string
  expiresAt: string
  createdAt: string
  workspace: Pick<Workspace, 'id' | 'name' | 'slug'>
}