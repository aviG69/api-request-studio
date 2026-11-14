export interface Collection {
  id: string
  name: string
  description: string | null
  workspaceId: string
  ownerId: string
  parentId: string | null
  order: number
  createdAt: string
  updatedAt: string
  requests?: Request[]
  children?: Collection[]
  variables?: CollectionVariable[]
}

export interface CollectionVariable {
  id: string
  key: string
  value: string
  type: 'DEFAULT' | 'SECRET'
  description: string | null
  collectionId: string
  createdAt: string
  updatedAt: string
}

export interface Request {
  id: string
  name: string
  description: string | null
  method: HttpMethod
  url: string
  headers: RequestHeader[]
  queryParams: RequestQueryParam[]
  body: any
  bodyType: BodyType
  auth: RequestAuth | null
  settings: RequestSettings
  collectionId: string
  order: number
  createdAt: string
  updatedAt: string
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export type BodyType = 'NONE' | 'JSON' | 'FORM_DATA' | 'URLENCODED' | 'RAW' | 'BINARY' | 'GRAPHQL'

export interface RequestHeader {
  key: string
  value: string
  enabled: boolean
}

export interface RequestQueryParam {
  key: string
  value: string
  enabled: boolean
}

export interface RequestAuth {
  type: 'none' | 'bearer' | 'basic' | 'api_key' | 'oauth2' | 'digest'
  bearer?: { token: string }
  basic?: { username: string; password: string }
  apiKey?: { key: string; value: string; addTo: 'header' | 'query' }
  oauth2?: { accessToken: string; refreshToken?: string; clientId?: string; clientSecret?: string }
  digest?: { username: string; password: string }
}

export interface RequestSettings {
  timeout: number
  followRedirects: boolean
  sslVerification: boolean
}