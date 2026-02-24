import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import { useUserStore } from '@/stores/user'
import { CONFIG, ERROR_CODES } from '@/config'
import router from '@/router'

const axiosInstance: AxiosInstance = axios.create({
  baseURL: CONFIG.baseURL,
  timeout: CONFIG.timeout,
})

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    const token = userStore.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response) => {
    const { code, message, data } = response.data
    if (code === ERROR_CODES.SUCCESS) {
      return data
    }
    // Token 过期或无效，跳转到登录页
    if (code === ERROR_CODES.TOKEN_INVALID || code === ERROR_CODES.TOKEN_EXPIRED) {
      const userStore = useUserStore()
      userStore.logout()
      router.push('/login')
    }
    return Promise.reject(new Error(message))
  },
  (error) => {
    console.error(error.message)
    return Promise.reject(error)
  }
)

// 自定义请求类型，正确反映拦截器返回的是 data 而非 AxiosResponse
interface RequestInstance {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>
  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
}

const request = axiosInstance as unknown as RequestInstance

export default request
