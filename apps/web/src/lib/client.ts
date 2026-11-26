export class ApiError extends Error {
  status: number;
  fields?: Record<string, string>;
  constructor(message: string, status: number, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

export const SESSION_EXPIRED_EVENT = 'mobcheck:session-expired';

// Same-origin fetch; the httpOnly session cookie is attached by the browser.
export async function api<T = any>(url: string, options: { method?: string; body?: unknown; formData?: FormData } = {}): Promise<T> {
  const res = await fetch(url, {
    method: options.method || (options.body || options.formData ? 'POST' : 'GET'),
    credentials: 'same-origin',
    headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: options.formData ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON response
  }
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined' && !url.startsWith('/api/auth/')) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status, data?.fields);
  }
  return data as T;
}
