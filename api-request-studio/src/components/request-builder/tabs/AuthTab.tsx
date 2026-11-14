'use client'

import { useState } from 'react'
import { Key, User, Shield, Globe, Fingerprint } from 'lucide-react'
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
import type { RequestAuth } from '@/types/collection'

interface AuthTabProps {
  auth: RequestAuth | null
  onUpdate: (auth: RequestAuth) => void
}

const AUTH_TYPES = [
  { value: 'none', label: 'No Auth', icon: Shield, description: 'No authentication required' },
  { value: 'bearer', label: 'Bearer Token', icon: Key, description: 'API key or JWT token' },
  { value: 'basic', label: 'Basic Auth', icon: User, description: 'Username and password' },
  { value: 'api_key', label: 'API Key', icon: Key, description: 'Custom header or query parameter' },
  { value: 'oauth2', label: 'OAuth 2.0', icon: Globe, description: 'OAuth 2.0 flow' },
  { value: 'digest', label: 'Digest Auth', icon: Fingerprint, description: 'HTTP Digest authentication' },
] as const

export function AuthTab({ auth, onUpdate }: AuthTabProps) {
  const [activeAuthType, setActiveAuthType] = useState<RequestAuth['type']>(auth?.type || 'none')
  const [bearerToken, setBearerToken] = useState(auth?.bearer?.token || '')
  const [basicUsername, setBasicUsername] = useState(auth?.basic?.username || '')
  const [basicPassword, setBasicPassword] = useState(auth?.basic?.password || '')
  const [apiKeyKey, setApiKeyKey] = useState(auth?.apiKey?.key || '')
  const [apiKeyValue, setApiKeyValue] = useState(auth?.apiKey?.value || '')
  const [apiKeyAddTo, setApiKeyAddTo] = useState<'header' | 'query'>(auth?.apiKey?.addTo || 'header')
  const [oauth2AccessToken, setOAuth2AccessToken] = useState(auth?.oauth2?.accessToken || '')
  const [oauth2RefreshToken, setOAuth2RefreshToken] = useState(auth?.oauth2?.refreshToken || '')
  const [oauth2ClientId, setOAuth2ClientId] = useState(auth?.oauth2?.clientId || '')
  const [oauth2ClientSecret, setOAuth2ClientSecret] = useState(auth?.oauth2?.clientSecret || '')
  const [digestUsername, setDigestUsername] = useState(auth?.digest?.username || '')
  const [digestPassword, setDigestPassword] = useState(auth?.digest?.password || '')

  const updateAuth = (newAuth: RequestAuth) => {
    setActiveAuthType(newAuth.type)
    onUpdate(newAuth)
  }

  const handleTypeChange = (type: RequestAuth['type']) => {
    switch (type) {
      case 'none':
        updateAuth({ type: 'none' })
        break
      case 'bearer':
        updateAuth({ type: 'bearer', bearer: { token: bearerToken } })
        break
      case 'basic':
        updateAuth({ type: 'basic', basic: { username: basicUsername, password: basicPassword } })
        break
      case 'api_key':
        updateAuth({ type: 'api_key', apiKey: { key: apiKeyKey, value: apiKeyValue, addTo: apiKeyAddTo } })
        break
      case 'oauth2':
        updateAuth({
          type: 'oauth2',
          oauth2: { accessToken: oauth2AccessToken, refreshToken: oauth2RefreshToken, clientId: oauth2ClientId, clientSecret: oauth2ClientSecret },
        })
        break
      case 'digest':
        updateAuth({ type: 'digest', digest: { username: digestUsername, password: digestPassword } })
        break
    }
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-medium">Authentication</h4>
      </div>

      <div className="space-y-2" role="radiogroup" aria-label="Authentication type">
        {AUTH_TYPES.map((type) => (
          <Button
            key={type.value}
            variant={activeAuthType === type.value ? 'default' : 'outline'}
            className="w-full justify-start gap-3"
            onClick={() => handleTypeChange(type.value)}
          >
            <type.icon className="h-4 w-4" />
            <div className="flex-1 text-left">
              <p className="font-medium">{type.label}</p>
              <p className="text-xs text-muted-foreground">{type.description}</p>
            </div>
          </Button>
        ))}
      </div>

      <Tabs value={activeAuthType} onValueChange={handleTypeChange} className="mt-4">
        <TabsContent value="none">
          <p className="text-center text-muted-foreground py-8">No authentication configured</p>
        </TabsContent>

        <TabsContent value="bearer">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bearer-token">Token</Label>
              <Input
                id="bearer-token"
                type="password"
                value={bearerToken}
                onChange={(e) => {
                  setBearerToken(e.target.value)
                  updateAuth({ type: 'bearer', bearer: { token: e.target.value } })
                }}
                placeholder="Enter your bearer token"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              The token will be sent as:{' '}
              <code className="bg-muted px-1 rounded">Authorization: Bearer {'<token>'}</code>
            </p>
          </div>
        </TabsContent>

        <TabsContent value="basic">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="basic-username">Username</Label>
              <Input
                id="basic-username"
                value={basicUsername}
                onChange={(e) => {
                  setBasicUsername(e.target.value)
                  updateAuth({ type: 'basic', basic: { username: e.target.value, password: basicPassword } })
                }}
                placeholder="Username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="basic-password">Password</Label>
              <Input
                id="basic-password"
                type="password"
                value={basicPassword}
                onChange={(e) => {
                  setBasicPassword(e.target.value)
                  updateAuth({ type: 'basic', basic: { username: basicUsername, password: e.target.value } })
                }}
                placeholder="Password"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Credentials will be Base64 encoded and sent as:{' '}
              <code className="bg-muted px-1 rounded">Authorization: Basic {'<base64>'}</code>
            </p>
          </div>
        </TabsContent>

        <TabsContent value="api_key">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key-key">Key</Label>
              <Input
                id="api-key-key"
                value={apiKeyKey}
                onChange={(e) => {
                  setApiKeyKey(e.target.value)
                  updateAuth({ type: 'api_key', apiKey: { key: e.target.value, value: apiKeyValue, addTo: apiKeyAddTo } })
                }}
                placeholder="API Key name (e.g., X-API-Key)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key-value">Value</Label>
              <Input
                id="api-key-value"
                type="password"
                value={apiKeyValue}
                onChange={(e) => {
                  setApiKeyValue(e.target.value)
                  updateAuth({ type: 'api_key', apiKey: { key: apiKeyKey, value: e.target.value, addTo: apiKeyAddTo } })
                }}
                placeholder="API Key value"
              />
            </div>
            <div className="space-y-2">
              <Label>Add to</Label>
              <Select value={apiKeyAddTo} onValueChange={(v) => {
                setApiKeyAddTo(v as 'header' | 'query')
                updateAuth({ type: 'api_key', apiKey: { key: apiKeyKey, value: apiKeyValue, addTo: v as 'header' | 'query' } })
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select where to add the API key" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="header">Header</SelectItem>
                  <SelectItem value="query">Query Parameter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="oauth2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oauth2-access-token">Access Token</Label>
              <Input
                id="oauth2-access-token"
                type="password"
                value={oauth2AccessToken}
                onChange={(e) => {
                  setOAuth2AccessToken(e.target.value)
                  updateAuth({
                    type: 'oauth2',
                    oauth2: { accessToken: e.target.value, refreshToken: oauth2RefreshToken, clientId: oauth2ClientId, clientSecret: oauth2ClientSecret },
                  })
                }}
                placeholder="Access token"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oauth2-refresh-token">Refresh Token (optional)</Label>
              <Input
                id="oauth2-refresh-token"
                type="password"
                value={oauth2RefreshToken}
                onChange={(e) => {
                  setOAuth2RefreshToken(e.target.value)
                  updateAuth({
                    type: 'oauth2',
                    oauth2: { accessToken: oauth2AccessToken, refreshToken: e.target.value, clientId: oauth2ClientId, clientSecret: oauth2ClientSecret },
                  })
                }}
                placeholder="Refresh token"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oauth2-client-id">Client ID (optional)</Label>
              <Input
                id="oauth2-client-id"
                value={oauth2ClientId}
                onChange={(e) => {
                  setOAuth2ClientId(e.target.value)
                  updateAuth({
                    type: 'oauth2',
                    oauth2: { accessToken: oauth2AccessToken, refreshToken: oauth2RefreshToken, clientId: e.target.value, clientSecret: oauth2ClientSecret },
                  })
                }}
                placeholder="Client ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oauth2-client-secret">Client Secret (optional)</Label>
              <Input
                id="oauth2-client-secret"
                type="password"
                value={oauth2ClientSecret}
                onChange={(e) => {
                  setOAuth2ClientSecret(e.target.value)
                  updateAuth({
                    type: 'oauth2',
                    oauth2: { accessToken: oauth2AccessToken, refreshToken: oauth2RefreshToken, clientId: oauth2ClientId, clientSecret: e.target.value },
                  })
                }}
                placeholder="Client Secret"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Token will be sent as:{' '}
              <code className="bg-muted px-1 rounded">Authorization: Bearer {'<access_token>'}</code>
            </p>
          </div>
        </TabsContent>

        <TabsContent value="digest">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="digest-username">Username</Label>
              <Input
                id="digest-username"
                value={digestUsername}
                onChange={(e) => {
                  setDigestUsername(e.target.value)
                  updateAuth({ type: 'digest', digest: { username: e.target.value, password: digestPassword } })
                }}
                placeholder="Username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="digest-password">Password</Label>
              <Input
                id="digest-password"
                type="password"
                value={digestPassword}
                onChange={(e) => {
                  setDigestPassword(e.target.value)
                  updateAuth({ type: 'digest', digest: { username: digestUsername, password: e.target.value } })
                }}
                placeholder="Password"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              The browser will automatically compute the Digest authentication header.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}