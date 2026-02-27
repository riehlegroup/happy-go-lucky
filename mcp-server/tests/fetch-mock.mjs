const status = Number(process.env.MCP_TEST_MOCK_STATUS || 200);
const contentType = process.env.MCP_TEST_MOCK_CONTENT_TYPE || 'application/json';
const rawBody = process.env.MCP_TEST_MOCK_BODY;

function headersToObject(headers) {
  const obj = {};
  if (!headers) return obj;
  if (typeof headers.forEach === 'function') {
    headers.forEach((value, key) => {
      obj[String(key).toLowerCase()] = value;
    });
    return obj;
  }
  for (const [key, value] of Object.entries(headers)) {
    obj[String(key).toLowerCase()] = value;
  }
  return obj;
}

function mockResponse(url, options) {
  const bodyText = rawBody ?? JSON.stringify({
    ok: status >= 200 && status < 300,
    status,
    method: options?.method || 'GET',
    url,
    headers: headersToObject(options?.headers),
    body: options?.body ? JSON.parse(options.body) : null,
  });

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    headers: {
      get(name) {
        if (String(name).toLowerCase() === 'content-type') return contentType;
        return null;
      },
    },
    async text() {
      return bodyText;
    },
  };
}

globalThis.fetch = async (url, options) => mockResponse(url, options);
