import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fetchMockModule = resolve(__dirname, 'fetch-mock.mjs');

function buildNodeOptions(extra) {
  if (!extra) return `--import ${fetchMockModule}`;
  return `${extra} --import ${fetchMockModule}`;
}

function parseContentText(res) {
  const text = res.content?.[0]?.text ?? '';
  return JSON.parse(text);
}

async function withClient(fn, options = {}) {
  const env = {
    ...process.env,
    MCP_HTTP_PORT: '0',
    ...options.env,
  };

  if (options.mockFetch !== false) {
    env.NODE_OPTIONS = buildNodeOptions(env.NODE_OPTIONS);
  }

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['dist/index.js'],
    cwd: new URL('..', import.meta.url).pathname,
    env,
    stderr: 'inherit',
  });

  const client = new Client({ name: 'mcp-test-client', version: '0.0.1' });

  await client.connect(transport);
  try {
    await fn(client);
  } finally {
    await client.close();
    await transport.close();
  }
}

describe('MCP server (stdio)', () => {
  it('lists tools and includes list_openapi_paths', async () => {
    await withClient(async (client) => {
      const tools = await client.listTools();
      expect(Array.isArray(tools.tools)).toBe(true);
      expect(tools.tools.length).toBeGreaterThan(0);
      expect(tools.tools.some((tool) => tool.name === 'list_openapi_paths')).toBe(true);
    });
  });

  it('list_openapi_paths returns array of paths', async () => {
    await withClient(async (client) => {
      const res = await client.callTool({ name: 'list_openapi_paths', arguments: {} });
      expect(Array.isArray(res.content)).toBe(true);
      const parsed = parseContentText(res);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed[0].path).toBeTruthy();
    });
  });

  it('exposes input schema for generated tools', async () => {
    await withClient(async (client) => {
      const tools = await client.listTools();
      const createTerm = tools.tools.find((tool) => tool.name === 'createTerm');
      expect(createTerm).toBeTruthy();
      expect(createTerm.inputSchema).toBeTruthy();
      expect(createTerm.inputSchema?.properties?.body).toBeTruthy();
    });
  });

  it('call_api rejects unknown paths', async () => {
    await withClient(async (client) => {
      const res = await client.callTool({
        name: 'call_api',
        arguments: { method: 'GET', path: '/does-not-exist' },
      });
      expect(res.isError).toBe(true);
      const text = res.content?.[0]?.text ?? '';
      expect(text).toContain('Path not found in OpenAPI spec');
    }, { mockFetch: false });
  });

  it('call_api forwards bearer token and body', async () => {
    await withClient(async (client) => {
      const res = await client.callTool({
        name: 'call_api',
        arguments: {
          method: 'POST',
          path: '/session',
          body: { email: 'demo@example.com', password: 'Secret123!' },
          bearerToken: 'test-token',
        },
      });
      const parsed = parseContentText(res);
      expect(parsed.status).toBe(200);
      expect(parsed.data.method).toBe('POST');
      expect(parsed.data.url).toContain('/session');
      expect(parsed.data.headers.authorization).toBe('Bearer test-token');
      expect(parsed.data.body).toEqual({ email: 'demo@example.com', password: 'Secret123!' });
    });
  });

  it('generated tools substitute path params', async () => {
    await withClient(async (client) => {
      const res = await client.callTool({
        name: 'getCourseSchedule',
        arguments: { pathParams: { id: 123 } },
      });
      const parsed = parseContentText(res);
      expect(parsed.data.url).toContain('/course/123/schedule');
    });
  });

  it('generated tools reject missing path params', async () => {
    await withClient(async (client) => {
      const res = await client.callTool({
        name: 'getCourseSchedule',
        arguments: {},
      });
      expect(res.isError).toBe(true);
      const text = res.content?.[0]?.text ?? '';
      expect(text).toContain('Missing required path parameter: id');
    }, { mockFetch: false });
  });

  it('handles non-JSON error responses', async () => {
    await withClient(
      async (client) => {
        const res = await client.callTool({
          name: 'call_api',
          arguments: { method: 'POST', path: '/session', body: { email: 'x', password: 'y' } },
        });
        expect(res.isError).toBe(true);
        const parsed = parseContentText(res);
        expect(parsed.status).toBe(500);
        expect(parsed.data).toBe('plain error');
      },
      {
        env: {
          MCP_TEST_MOCK_STATUS: '500',
          MCP_TEST_MOCK_CONTENT_TYPE: 'text/plain',
          MCP_TEST_MOCK_BODY: 'plain error',
        },
      }
    );
  });
});
