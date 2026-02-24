if (!import.meta.env.VITE_API_URL && import.meta.env.DEV) {
  console.warn('[NKAtlas] VITE_API_URL is not set, using default /api/v1')
}

export const CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  appTitle: import.meta.env.VITE_APP_TITLE || 'NKAtlas 图床',
  timeout: 30000,
  maxToasts: 3,
  toastDuration: 5000,
  avatarMaxSize: 2 * 1024 * 1024,
} as const

export const ERROR_CODES = {
  SUCCESS: 200,
  TOKEN_INVALID: 20004,
  TOKEN_EXPIRED: 20005,
} as const

export const STORAGE_KEYS = {
  TOKEN: 'token',
  THEME_MODE: 'nkatlas-theme-mode',
  PRIMARY_COLOR: 'nkatlas-primary-color',
  LOCALE: 'nkatlas-locale',
  LINK_FORMATS: 'nkatlas_link_formats',
} as const
