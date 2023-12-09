export interface IUploadPolicyData {
  accessid: string;
  dir: string;
  // 上传参数过期时间
  expire: number;
  host: string;
  policy: string;
  signature: string;
  key: string;
}

export interface IUploadEncryptMeta {
  /** 'caesar' */
  method: string;
  /** caesar: 偏移量 = 1 */
  params: string;
}

/**
 * 上传文件
 * https://help.aliyun.com/zh/oss/developer-reference/postobject
 */
export async function uploadFile({
  file,
  uploadPolicyData,
  extraFormData,
  onProgress,
  signal,
}: {
  file: Blob;
  uploadPolicyData: IUploadPolicyData;
  extraFormData?: Record<string, string>;
  onProgress?: (e: ProgressEvent<XMLHttpRequestEventTarget>) => void;
  signal?: AbortSignal;
}) {
  const formData = new FormData();
  formData.append('key', uploadPolicyData.key);
  formData.append('OSSAccessKeyId', uploadPolicyData.accessid);
  formData.append('policy', uploadPolicyData.policy);
  formData.append('Signature', uploadPolicyData.signature);
  formData.append('Cache-Control', 'public, max-age=31536000, immutable');

  if (extraFormData) {
    Object.entries(extraFormData).forEach(([k, v]) => {
      formData.append(k, v);
    });
  }
  formData.append('file', file);

  const xhr = new XMLHttpRequest();
  if (onProgress) {
    xhr.upload.addEventListener('progress', onProgress);
  }

  if (signal) {
    signal.addEventListener('abort', () => xhr.abort());
  }

  return new Promise<void>((resolve, reject) => {
    xhr.addEventListener('load', () => {
      if (`${xhr.status}`.startsWith('2')) {
        resolve();
      }

      if (xhr.getResponseHeader('Content-Type') === 'application/xml' && xhr.responseXML) {
        // 错误码 https://help.aliyun.com/zh/oss/developer-reference/putobject#section-dsv-grs-qgb
        const code = xhr.responseXML.getElementsByTagName('Code').item(0);
        if (code?.textContent) {
          reject(new Error(`上传失败: ${code.textContent} ${xhr.status} ${xhr.statusText}`, { cause: xhr }));
          return;
        }
      }

      reject(new Error(`上传失败: ${xhr.status} ${xhr.statusText}`, { cause: xhr }));
    });
    xhr.addEventListener('error', () => reject(new Error('上传失败, 网络异常', { cause: xhr })));
    xhr.addEventListener('abort', () => {
      const err = new Error('已取消', { cause: xhr });
      err.name = 'AbortError';
      reject(err);
    });
    xhr.open('POST', uploadPolicyData.host, true);

    xhr.send(formData);
  });
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(2)}KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(2)}MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)}GB`;
}
