import showMessage from '@/components/message';
import { openUserDialog } from '@/components/user-dialog';
import type { IApiResponse } from '@/shared/types/request';

export interface IApiOptions {
  /** 返回原始响应 */
  raw?: boolean;
  /** 错误时自动展示message信息, `raw=true`时只会展示请求错误信息 */
  autoToast?: boolean;
  /** 403时自动弹出登录框 = true */
  autoLogin?: boolean;
  /** 取消请求 */
  signal?: AbortSignal;
}

export interface IFetchOptions {
  url: string | URL;
  /** A string indicating how the request will interact with the browser's cache to set request's cache. */
  cache?: RequestCache;
  /** A string indicating whether credentials will be sent with the request always, never, or only when sent to a same-origin URL. Sets request's credentials. */
  credentials?: RequestCredentials;
  /** A Headers object, an object literal, or an array of two-item arrays to set request's headers. */
  headers?: Record<string, string>;
  /** A cryptographic hash of the resource to be fetched by request. Sets request's integrity. */
  integrity?: string;
  /** A boolean to set request's keepalive. */
  keepalive?: boolean;
  /** A string to set request's method. */
  method?: string;
  /** A string to indicate whether the request will use CORS, or will be restricted to same-origin URLs. Sets request's mode. */
  mode?: RequestMode;
  /** A string indicating whether request follows redirects, results in an error upon encountering a redirect, or returns the redirect (in an opaque fashion). Sets request's redirect. */
  redirect?: RequestRedirect;
  /** A string whose value is a same-origin URL, "about:client", or the empty string, to set request's referrer. */
  referrer?: string;
  /** A referrer policy to set request's referrerPolicy. */
  referrerPolicy?: ReferrerPolicy;
  /** An AbortSignal to set request's signal. */
  // signal?: AbortSignal | null;
  /** Can only be null. Used to disassociate request from any Window. */
  window?: null;
}

// jwt过期检查
{
  const jwt = localStorage.getItem('jwt');
  if (jwt) {
    const jwtParts = jwt.split('.');
    try {
      const jwtPayload = JSON.parse(atob(jwtParts[1]));
      if (Date.now() > jwtPayload.exp * 1000) {
        localStorage.removeItem('jwt');
      }
    } catch {
      localStorage.removeItem('jwt');
    }
  }
}

/**
 * 定义api,不适用于向本站外的请求
 * @param fetchOptions fetch选项
 * @param options api选项
 */
export function defineApi<P extends string | object | FormData | void = void, R = void>(
  fetchOptions: IFetchOptions,
  options?: IApiOptions,
) {
  const { url, ...defaultOptions } = fetchOptions;
  return async (args?: P, reqOptions?: IApiOptions) => {
    const { autoToast = true, raw = false } = { ...options, ...reqOptions };
    const accessToken = localStorage.getItem('jwt');
    const init: RequestInit = {
      credentials: 'omit',
      ...defaultOptions,
      headers: {
        ...defaultOptions.headers,
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      signal: reqOptions?.signal,
    };
    let reqUrl = url;
    if ((defaultOptions.method ?? 'GET').toUpperCase() === 'GET') {
      const searchParams = new URLSearchParams(args as Record<string, string>);
      if (searchParams.toString()) {
        if (typeof reqUrl === 'string') {
          reqUrl = `${reqUrl}?${searchParams.toString()}`;
        } else {
          const reqUrlSearchParams = reqUrl.searchParams;
          searchParams.forEach((v, k) => reqUrlSearchParams.set(k, v));
        }
      }
    } else if (args instanceof FormData || typeof args === 'string') {
      init.body = args;
    } else if (typeof args === 'object') {
      init.body = JSON.stringify(args);

      init.headers = {
        'Content-Type': 'application/json',
        ...init.headers,
        ...defaultOptions.headers,
      };
    }
    let response: Response;
    try {
      response = await fetch(reqUrl, init);
    } catch (e) {
      if (options?.autoToast !== false) {
        showMessage(`请求失败:${e instanceof Error ? e.message : '未知错误'} (如果你的网络没问题,那就是服务器挂了)`);
      }
      throw e;
    }

    const data: IApiResponse<R> = await response.json();
    if (data.newToken) {
      localStorage.setItem('jwt', data.newToken);
    }
    if (raw) {
      return data as R;
    }
    if (!data.ok) {
      if (autoToast) {
        showMessage(data.message ?? '', { duration: 5000 });
      }
      if (response.status === 403 && options?.autoLogin !== false) {
        openUserDialog();
      }
      throw new Error('api error', { cause: data });
    }
    return data.data as R;
  };
}
