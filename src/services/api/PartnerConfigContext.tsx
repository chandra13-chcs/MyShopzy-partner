import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { routes, type AppRoute } from '../../app/routes'
import type { PartnerTypeCode } from '../../types/partner'
import { isPartnerTypeCode, partnerTypes } from '../../config/partnerTypes'
import {
  createApiClient,
  normalizeApiError,
  type ApiErrorShape,
} from './client'

export interface PartnerTypeProfile {
  label: string
  allowedUnits: string[]
  extraProductFields: Array<{
    key: string
    label: string
    type: 'text' | 'boolean' | 'select' | 'number'
    required: boolean
    options?: string[]
  }>
  defaultCategories: Array<{ name: string; slug: string }>
  orderStatusLabels: {
    accepted: string
    preparing: string
    ready: string
  }
}

export interface PartnerConfig {
  profile: PartnerTypeProfile
  partner: {
    id: string
    name: string
    type: PartnerTypeCode
    status: string
    contactEmail: string | null
    contactPhone: string | null
    timezone: string | null
  }
  shops: Array<{
    id: string
    name: string
    slug: string
    status: string
    address: string | null
    operatingDetails: unknown
  }>
  navigation: AppRoute[]
}

interface PartnerConfigContextValue {
  config: PartnerConfig | null
  loading: boolean
  error: ApiErrorShape | null
  reload: () => Promise<void>
}

interface ConfigResponse {
  data: Omit<PartnerConfig, 'navigation'> & { navigation?: AppRoute[] }
}

const navigation = routes.filter((route) => route.path !== '/login')
const PartnerConfigContext = createContext<PartnerConfigContextValue | undefined>(
  undefined,
)

function validateConfigResponse(response: ConfigResponse): PartnerConfig {
  const data = response?.data
  if (
    !data ||
    !data.profile ||
    !isPartnerTypeCode(data.partner?.type) ||
    typeof data.profile.label !== 'string' ||
    !Array.isArray(data.profile.allowedUnits) ||
    !Array.isArray(data.profile.defaultCategories) ||
    !Array.isArray(data.profile.extraProductFields) ||
    !Array.isArray(data.shops) ||
    typeof data.profile.orderStatusLabels?.accepted !== 'string' ||
    typeof data.profile.orderStatusLabels?.preparing !== 'string' ||
    typeof data.profile.orderStatusLabels?.ready !== 'string' ||
    data.profile.defaultCategories.some(
      (category) =>
        typeof category?.name !== 'string' || typeof category?.slug !== 'string',
    )
  ) {
    throw new Error('The partner configuration response has an invalid shape.')
  }
  if (
    data.navigation?.some(
      (item) => !navigation.some((route) => route.path === item.path),
    )
  ) {
    throw new Error('The partner configuration contains an unsupported navigation route.')
  }
  const configuredNavigation = data.navigation ?? navigation
  return { ...data, navigation: configuredNavigation }
}

export function PartnerConfigProvider({ children }: { children: ReactNode }) {
  const { getAccessTokenSilently } = useAuth0()
  const [config, setConfig] = useState<PartnerConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiErrorShape | null>(null)
  const requestId = useRef(0)

  const reload = useCallback(async () => {
    const currentRequestId = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const client = createApiClient(async () => {
        const accessToken = await getAccessTokenSilently({
          authorizationParams: {
            audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          },
        })
        if (!accessToken) {
          throw new Error('Could not retrieve an access token.')
        }
        return accessToken
      })
      const response = await client.get<ConfigResponse>('/partner/me/config')
      if (currentRequestId === requestId.current) {
        setConfig(validateConfigResponse(response))
      }
    } catch (loadError) {
      if (currentRequestId === requestId.current) {
        setError(normalizeApiError(loadError))
      }
    } finally {
      if (currentRequestId === requestId.current) {
        setLoading(false)
      }
    }
  }, [getAccessTokenSilently])

  useEffect(() => {
    void reload()
    return () => {
      requestId.current += 1
    }
  }, [reload])

  const value = useMemo(
    () => ({ config, loading, error, reload }),
    [config, loading, error, reload],
  )

  return (
    <PartnerConfigContext.Provider value={value}>
      {children}
    </PartnerConfigContext.Provider>
  )
}

export function PartnerConfigPreviewProvider({
  children,
  config,
}: {
  children: ReactNode
  config: PartnerConfig
}) {
  const value = useMemo(
    () => ({
      config,
      loading: false,
      error: null,
      reload: async () => {},
    }),
    [config],
  )

  return (
    <PartnerConfigContext.Provider value={value}>
      {children}
    </PartnerConfigContext.Provider>
  )
}

export function usePartnerConfig() {
  const context = useContext(PartnerConfigContext)
  if (!context) {
    throw new Error('usePartnerConfig must be used within a PartnerConfigProvider.')
  }
  return context
}

export function usePartnerOrderStatusLabel() {
  const { config } = usePartnerConfig()
  return useCallback(
    (status: string, fallback: string) => {
      const wording = config ? partnerTypes[config.partner.type].orderStatusWording : null
      if (status === 'ACCEPTED') return wording?.accepted ?? fallback
      if (status === 'PREPARING') return wording?.preparing ?? fallback
      if (status === 'READY_FOR_PICKUP') return wording?.ready ?? fallback
      return fallback
    },
    [config],
  )
}
