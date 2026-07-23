import { getTokenWorkaround } from '@/app/actions/authActions';

const baseUrl = process.env.API_URL;

async function get(url: string) {
  const requestOptions = {
    method: 'GET',
    headers: await getHeaders(),
  };

  const response = await fetch(baseUrl + url, requestOptions);
  return handleResponse(response);
}

async function post(url: string, body: object) {
  const requestOptions = {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify(body),
  };

  const response = await fetch(baseUrl + url, requestOptions);
  return handleResponse(response);
}

async function put(url: string, body: object) {
  const requestOptions = {
    method: 'PUT',
    headers: await getHeaders(),
    body: JSON.stringify(body),
  };

  const response = await fetch(baseUrl + url, requestOptions);
  return handleResponse(response);
}

async function del(url: string) {
  const requestOptions = {
    method: 'DELETE',
    headers: await getHeaders(),
  };

  const response = await fetch(baseUrl + url, requestOptions);
  return handleResponse(response);
}

async function getHeaders(): Promise<HeadersInit> {
  const token = await getTokenWorkaround();
  const headers: HeadersInit = { 'Content-type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(response: Response) {
  const text = await response.text();

  let data;
  try {
    data = text && JSON.parse(text);
  } catch {
    data = text;
  }

  if (response.ok) {
    return data || response.statusText;
  } else {
    console.log('[fetchWrapper] NON-OK', response.status, response.url, 'body:', typeof data === 'string' ? data : JSON.stringify(data));
    const error = {
      status: response.status,
      message: typeof data === 'string' ? data : response.statusText,
    };
    return { error };
  }
}

export const fetchWrapper = {
  get,
  post,
  put,
  del,
};
