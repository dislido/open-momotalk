import showMessage from '@/components/message';
import { md5, md5hex } from '@/utils/md5';
import { defineApi } from '@/utils/request';
import type { IUploadPolicyData } from '@/utils/upload';
import { uploadFile } from '@/utils/upload';

/**
 * 获取oss文件meta
 * @param url oss文件访问地址(无search部分)
 * @returns 若文件不存在,返回null, 否则返回文件meta Headers对象
 */
export async function OSSFMeta(url: string, options?: RequestInit) {
  const res = await fetch(`${url}`, {
    method: 'HEAD',
    ...options,
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error('请求失败 未知错误');
  return res.headers;
}

const requestUpload = defineApi<
  {
    /** 32位md5字符串,不区分大小写 */
    md5: string;
    /** 文件Content-Type */
    contentType: string;
    /** 文件扩展名, 如'.jpg' */
    ext?: string;
  },
  IUploadPolicyData
>(
  {
    url: '/api/oss/requestUpload',
    method: 'POST',
  },
  { autoToast: false },
);

const requestSUpload = defineApi<
  {
    /** 32位md5字符串,不区分大小写 */
    md5: string;
    /** 文件Content-Type */
    contentType: string;
    /** 文件扩展名, 如'.jpg' */
    ext?: string;
  },
  IUploadPolicyData
>(
  {
    url: '/api/oss/requestSUpload',
    method: 'POST',
  },
  { autoToast: false },
);

/**
 * 通用上传文件
 * @returns 文件url
 */
export async function commonUpload(
  file: File,
  options?: {
    onProgress?: (e: ProgressEvent<XMLHttpRequestEventTarget>) => void;
    signal?: AbortSignal;
    extraFormData?: Record<string, string>;
  },
) {
  const fileMd5Buf = md5(
    await file.arrayBuffer().catch((e) => {
      if (e.name === 'NotFoundError') {
        const err = new Error('暂不支持上传文件夹', { cause: e });
        throw err;
      }
      throw e;
    }),
  );
  const fileMD5 = md5hex(fileMd5Buf);
  const ext = file.name.match(/\.[^.]+$/)?.[0];
  const uploadPolicyData = await requestUpload({ md5: fileMD5, contentType: file.type, ext });
  try {
    await uploadFile({
      file,
      uploadPolicyData,
      extraFormData: options?.extraFormData,
      onProgress: options?.onProgress,
      signal: options?.signal,
    });
  } catch (err) {
    if (err instanceof Error) {
      showMessage(err.message);
    }
    throw err;
  }
  return `${uploadPolicyData.host}/${uploadPolicyData.key}`;
}

export async function commonUploadEncrypted(
  originFile: File,
  options?: {
    onProgress?: (e: ProgressEvent<XMLHttpRequestEventTarget>) => void;
    signal?: AbortSignal;
    extraFormData?: Record<string, string>;
  },
) {
  const u8Arr = new Uint8Array(
    await originFile.arrayBuffer().catch((e) => {
      if (e.name === 'NotFoundError') {
        const err = new Error('暂不支持上传文件夹', { cause: e });
        throw err;
      }
      throw e;
    }),
  );
  const su8Arr = u8Arr.map((it) => it + 1);
  const blob = new Blob([su8Arr], { type: originFile.type });

  const fileMd5Buf = md5(su8Arr);
  const fileMD5 = md5hex(fileMd5Buf);
  const ext = originFile.name.match(/\.[^.]+$/)?.[0];
  const uploadPolicyData = await requestSUpload(
    { md5: fileMD5, contentType: originFile.type, ext },
    { signal: options?.signal },
  );
  const fmeta = await OSSFMeta(`${uploadPolicyData.host}/${uploadPolicyData.key}`, { signal: options?.signal });
  const lastModified = fmeta?.get('last-modified');
  // 文件不存在或上传修改时间超过30天则重传,配合oss生命周期自动删除文件用
  if (!lastModified || Date.now() - new Date(lastModified).getTime() > 2592e6) {
    if (options?.signal?.aborted) {
      const err = new Error('已取消');
      err.name = 'AbortError';
      throw err;
    }
    await uploadFile({
      file: new File([blob], originFile.name, { type: originFile.type, lastModified: originFile.lastModified }),
      uploadPolicyData,
      extraFormData: options?.extraFormData,
      onProgress: options?.onProgress,
      signal: options?.signal,
    });
  }
  return `${uploadPolicyData.host}/${uploadPolicyData.key}`;
}

const sFileBlobMap = new Map<string, Blob>();

export interface IFetchProgress {
  total: number;
  loaded: number;
}
/** 下载解密文件 */
export async function decryptSFile(
  url: string,
  mime: string,
  options?: { onProgress?: (e: IFetchProgress) => void; fetchOptions?: RequestInit },
) {
  const cache = sFileBlobMap.get(url);
  if (cache) return cache;
  const res = await fetch(url, options?.fetchOptions);
  if (!res.body) throw new Error('下载失败,网络错误');
  const reader = res.body.getReader();
  const contentLength = +(res.headers.get('content-length') ?? Infinity);
  let receivedBytes = 0;
  const result = new Uint8Array(contentLength);
  while (contentLength !== receivedBytes) {
    const { value, done } = await reader.read();
    if (done) break;
    result.set(value, receivedBytes);
    receivedBytes += value.length;

    options?.onProgress?.({
      total: contentLength,
      loaded: receivedBytes,
    });
  }
  const encBuf = result.buffer;
  const blob = new Blob([new Uint8Array(encBuf).map((it) => it - 1).buffer], { type: mime });
  sFileBlobMap.set(url, blob);
  return blob;
}
