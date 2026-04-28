import { resolveToken, resolveApiUrl } from "./config";

export interface ApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export async function apiRequest<T = unknown>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<ApiResponse<T>> {
  const token = resolveToken();
  if (!token) {
    return {
      ok: false,
      status: 0,
      error:
        "Not authenticated. Run `abmlib login` or set the ABMLIB_API_TOKEN environment variable.",
    };
  }

  const baseUrl = resolveApiUrl();
  const url = `${baseUrl}${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}`;
    if (contentType.includes("application/json")) {
      try {
        const errBody = (await response.json()) as { message?: string };
        if (errBody.message) {
          errorMsg = Array.isArray(errBody.message)
            ? errBody.message.join(", ")
            : errBody.message;
        }
      } catch {
        // non-JSON error body, use status text
      }
    }
    return { ok: false, status: response.status, error: errorMsg };
  }

  if (response.status === 204 || !contentType.includes("application/json")) {
    return { ok: true, status: response.status };
  }

  const data = (await response.json()) as T;
  return { ok: true, status: response.status, data };
}
