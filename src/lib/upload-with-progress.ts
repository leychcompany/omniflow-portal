/**
 * Upload FormData with progress tracking using XMLHttpRequest.
 * fetch() does not support upload progress; XHR does.
 */
export function uploadWithProgress(
  url: string,
  formData: FormData,
  options: {
    method?: "POST" | "PATCH";
    headers?: Record<string, string>;
    onProgress?: (loaded: number, total: number, percent: number) => void;
  } = {}
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const { method = "POST", headers = {}, onProgress } = options;

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(e.loaded, e.total, percent);
      }
    });

    xhr.addEventListener("load", () => {
      const response = new Response(xhr.responseText, {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: parseHeaders(xhr.getAllResponseHeaders()),
      });
      resolve(response);
    });

    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    xhr.open(method, url);
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }

    xhr.send(formData);
  });
}

function parseHeaders(headerStr: string): Headers {
  const headers = new Headers();
  headerStr.split("\r\n").forEach((line) => {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      headers.set(key, value);
    }
  });
  return headers;
}
