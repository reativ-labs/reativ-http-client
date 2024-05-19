import { HttpHeaders } from './http-headers'
import { HttpMethod } from './http-methods'

type HttpClientConfig = {
  baseUrl?: string
  timeout?: number
  headers?: HttpHeaders
}

type RequestConfig = {
  headers?: HttpHeaders
  responseType: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream'
}

export class HttpClient {
  private baseUrl: string
  private timeout: number
  private baseHeaders: HttpHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  public controller: AbortController

  static create(options: HttpClientConfig) {
    return new HttpClient(options)
  }

  private constructor(options: HttpClientConfig) {
    this.baseUrl = options.baseUrl ?? ''
    this.timeout = options.timeout ?? 1000
    this.baseHeaders = {
      ...this.baseHeaders,
      ...options.headers,
    }
  }

  public async get(url: string, config: RequestConfig) {
    return this.makeRequest(url, 'get', undefined, config)
  }

  public post<T>(url: string, body: T, config: RequestConfig) {
    return this.makeRequest<T>(url, 'post', body, config)
  }

  public put<T>(url: string, body: T, config: RequestConfig) {
    return this.makeRequest<T>(url, 'put', body, config)
  }

  public patch<T>(url: string, body: T, config: RequestConfig) {
    return this.makeRequest<T>(url, 'patch', body, config)
  }

  public delete(url: string, config: RequestConfig) {
    return this.makeRequest(url, 'delete', undefined, config)
  }

  private async makeRequest<T>(
    url: string,
    method: HttpMethod,
    body?: T,
    config?: RequestConfig,
  ) {
    const options: RequestInit = {
      method,
      headers: {
        ...this.baseHeaders,
        ...config?.headers,
      },
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    this.controller = new AbortController()
    options.signal = this.controller.signal

    const timeoutId = setTimeout(() => this.controller.abort(), this.timeout)

    const response = await fetch(this.baseUrl.concat(url), options)

    clearTimeout(timeoutId)

    let data

    switch (config?.responseType) {
      case 'json':
        data = await response.json()
        break
      case 'text':
        data = await response.text()
        break
      case 'blob':
        data = await response.blob()
        break
      case 'arrayBuffer':
        data = await response.arrayBuffer()
        break
      case 'stream':
        data = response.body
        break
      default:
        await response.json()
    }

    return {
      response,
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      config,
    }
  }
}
