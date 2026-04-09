import { API_BASE_ENDPOINT } from "@/features/api/endpoints";

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: { code: string; message: string } };

function resolveApiUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return url.startsWith("/") ? url : `${API_BASE_ENDPOINT}${url}`;
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(resolveApiUrl(url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ApiOk<T> | ApiErr;
  if (!json.ok) {
    throw new Error(json.error.message);
  }
  return json.data;
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(resolveApiUrl(url), {
    credentials: "include",
    cache: "no-store",
  });
  const json = (await res.json()) as ApiOk<T> | ApiErr;
  if (!json.ok) {
    throw new Error(json.error.message);
  }
  return json.data;
}

export async function apiPatch<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(resolveApiUrl(url), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ApiOk<T> | ApiErr;
  if (!json.ok) {
    throw new Error(json.error.message);
  }
  return json.data;
}

export async function apiDelete<T>(url: string): Promise<T> {
  const res = await fetch(resolveApiUrl(url), {
    method: "DELETE",
    credentials: "include",
  });
  const json = (await res.json()) as ApiOk<T> | ApiErr;
  if (!json.ok) {
    throw new Error(json.error.message);
  }
  return json.data;
}
