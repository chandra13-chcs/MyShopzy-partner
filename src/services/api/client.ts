export interface ApiErrorShape {
  status: number
  code: string
  message: string
}

export class ApiError extends Error implements ApiErrorShape {
  readonly status: number
  readonly code: string

  constructor({ status, code, message }: ApiErrorShape) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

type AccessTokenGetter = () => Promise<string>

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const apiBaseUrl = (
  configuredApiBaseUrl || (import.meta.env.DEV ? 'http://localhost:3000/api/v1' : '')
).replace(/\/+$/, '')

export interface ApiClient {
  get<T>(path: string): Promise<T>
  post<T>(path: string, body: unknown): Promise<T>
  patch<T>(path: string, body: unknown): Promise<T>
}

export function createApiClient(getAccessToken: AccessTokenGetter) {
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (!apiBaseUrl) {
      throw new ApiError({
        status: 0,
        code: 'API_BASE_URL_MISSING',
        message: 'The API base URL is not configured.',
      })
    }

    let accessToken: string
    try {
      accessToken = await getAccessToken()
    } catch (error) {
      throw new ApiError({
        status: 0,
        code: 'AUTH_TOKEN_ERROR',
        message:
          error instanceof Error
            ? error.message
            : 'Could not retrieve an access token.',
      })
    }

    let response: Response
    try {
      const headers = new Headers(init.headers)
      headers.set('Accept', 'application/json')
      if (init.body) headers.set('Content-Type', 'application/json')
      headers.set('Authorization', `Bearer ${accessToken}`)
      response = await fetch(`${apiBaseUrl}/${path.replace(/^\/+/, '')}`, {
        ...init,
        headers,
      })
    } catch {
      throw new ApiError({
        status: 0,
        code: 'NETWORK_ERROR',
        message:
          'Could not reach the MyShopzy backend. Check that it is running, the API base URL is correct, and the backend allows this console origin.',
      })
    }

    const responseText = await response.text()
    let payload: unknown
    try {
      payload = responseText ? JSON.parse(responseText) : undefined
    } catch {
      throw new ApiError({
        status: response.status,
        code: 'INVALID_API_RESPONSE',
        message: 'The API returned an invalid response.',
      })
    }

    if (!response.ok) {
      const errorPayload =
        payload && typeof payload === 'object' && 'error' in payload
          ? payload.error
          : undefined
      const details =
        errorPayload && typeof errorPayload === 'object' ? errorPayload : {}
      const code =
        'code' in details && typeof details.code === 'string'
          ? details.code
          : 'REQUEST_FAILED'
      const message =
        'message' in details && typeof details.message === 'string'
          ? details.message
          : 'The request failed.'
      throw new ApiError({
        status: response.status,
        code,
        message: `The MyShopzy backend returned HTTP ${response.status}: ${message}`,
      })
    }

    return payload as T
  }

  return {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body: unknown) =>
      request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
    patch: <T>(path: string, body: unknown) =>
      request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  } satisfies ApiClient
}

export function normalizeApiError(error: unknown): ApiErrorShape {
  if (error instanceof ApiError) {
    return { status: error.status, code: error.code, message: error.message }
  }
  return {
    status: 0,
    code: 'CONFIG_LOAD_FAILED',
    message:
      error instanceof Error
        ? error.message
        : 'Partner configuration could not be loaded.',
  }
}
