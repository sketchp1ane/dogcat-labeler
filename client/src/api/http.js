// src/api/http.js

// 明确告诉前端：后端 API 在 3000 端口
const baseUrl = 'http://localhost:3000/api';

/**
 * 统一封装 fetch 请求，支持 GET/POST + 自动携带 cookie
 */
export async function api(url, method = 'GET', body) {
  const options = {
    method,
    credentials: 'include', // 必须带上 cookie 才能维持登录态
  };

  if (body) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }

  const res = await fetch(baseUrl + url, options);

  if (!res.ok) {
    // 尝试解析错误信息；否则返回状态码
    let errText = await res.text();
    try {
      const json = JSON.parse(errText);
      errText = json.msg || JSON.stringify(json);
    } catch (_) {
      /* ignore JSON.parse error */
    }
    throw new Error(errText || `HTTP ${res.status}`);
  }

  try {
    return await res.json(); // 有些接口可能返回 null
  } catch {
    return null;
  }
}
