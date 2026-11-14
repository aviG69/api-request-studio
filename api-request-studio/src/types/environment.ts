export interface Environment {
  id: string
  name: string
  workspaceId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  variables: EnvironmentVariable[]
}

export interface EnvironmentVariable {
  id: string
  key: string
  value: string
  type: 'DEFAULT' | 'SECRET'
  description: string | null
  environmentId: string
  createdAt: string
  updatedAt: string
}