import { readFileSync, existsSync } from 'node:fs';
import { resolve, relative, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { parse } from 'yaml';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Default API base URL used when API_BASE_URL is not provided.
const DEFAULT_BASE_URL = 'http://localhost:3000';

// Minimal OpenAPI shape used by this server. Keep small to avoid over-typing.
type OpenApiSpec = {
  info?: { title?: string; version?: string };
  security?: unknown[];
  paths?: Record<string, Record<string, any>>;
};

// Tool definition derived from OpenAPI operations.
type GeneratedTool = {
  name: string;
  method: string;
  path: string;
  operationId?: string | null;
  summary?: string | null;
  description?: string | null;
  requiredPathParams?: string[];
  requiredQueryParams?: string[];
  inputSchema?: any;
  security?: unknown[];
};

// JSON file persisted from OpenAPI generation.
type McpToolsFile = {
  name?: string;
  version?: string;
  apiBaseUrl?: string;
  tools: GeneratedTool[];
  source?: { openapiPath?: string; sha256?: string; generatedAt?: string };
};

type ToolCallArgs = Record<string, any>;

type ApiCallResult = {
  ok: boolean;
  status: number;
  data: any;
};

// Build a stable tool name from method/path unless operationId exists.
function toToolName(method: string, path: string, operationId?: string) {
  if (operationId && operationId.trim().length > 0) return operationId;
  const normalized = path
    .replace(/^\//, '')
    .replace(/\//g, '_')
    .replace(/\{([^}]+)\}/g, 'by_$1');
  return `${method.toLowerCase()}_${normalized || 'root'}`;
}

// Extract required params for a given parameter location (path/query).
function getRequiredParams(params: any[], location: string) {
  if (!Array.isArray(params)) return [];
  return params.filter((p) => p?.in === location && p?.required).map((p) => p?.name).filter(Boolean);
}

// Ensure schema carries the parameter/body description (if any).
function schemaWithDescription(schema: any, description?: string | null) {
  if (!schema || typeof schema !== 'object' || !description) return schema;
  return { ...schema, description };
}

// Build JSON schema for a parameter location.
function buildParamsSchema(params: any[], location: string) {
  if (!Array.isArray(params)) return null;
  const filtered = params.filter((p) => p?.in === location);
  if (filtered.length === 0) return null;

  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const param of filtered) {
    const name = param?.name;
    if (!name) continue;
    const schema = schemaWithDescription(param?.schema ?? { type: 'string' }, param?.description);
    properties[name] = schema;
    if (param?.required) required.push(name);
  }

  return {
    type: 'object',
    properties,
    ...(required.length > 0 ? { required } : {}),
    additionalProperties: false,
  };
}

// Pull JSON request body schema from an OpenAPI operation.
function getRequestBodySchema(operation: any) {
  const requestBody = operation?.requestBody;
  const content = requestBody?.content || {};
  const jsonContent = content['application/json'] || content['application/*+json'];
  return {
    schema: jsonContent?.schema ?? null,
    required: Boolean(requestBody?.required),
    description: jsonContent?.description || requestBody?.description || null,
  };
}

// Build tool input schema from OpenAPI operation parameters/body.
function buildInputSchema(operation: any) {
  const params = Array.isArray(operation?.parameters) ? operation.parameters : [];
  const pathParamsSchema = buildParamsSchema(params, 'path');
  const querySchema = buildParamsSchema(params, 'query');
  const { schema: bodySchema, required: bodyRequired, description: bodyDescription } =
    getRequestBodySchema(operation);

  const properties: Record<string, any> = {
    ...(pathParamsSchema ? { pathParams: pathParamsSchema } : {}),
    ...(querySchema ? { query: querySchema } : {}),
    ...(bodySchema ? { body: schemaWithDescription(bodySchema, bodyDescription) } : {}),
    bearerToken: {
      type: 'string',
      description: 'JWT bearer token if the endpoint requires authentication.',
    },
  };

  const required: string[] = [];
  if (pathParamsSchema?.required?.length) required.push('pathParams');
  if (querySchema?.required?.length) required.push('query');
  if (bodySchema && bodyRequired) required.push('body');

  return {
    type: 'object',
    properties,
    ...(required.length > 0 ? { required } : {}),
    additionalProperties: false,
  };
}

// Convert OpenAPI paths/operations to MCP tool definitions.
function buildToolsFromOpenApi(spec: OpenApiSpec): GeneratedTool[] {
  const tools: GeneratedTool[] = [];
  const paths = spec.paths || {};
  const securityDefaults = Array.isArray(spec.security) ? spec.security : [];

  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, op] of Object.entries(methods || {})) {
      const m = method.toUpperCase();
      if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(m)) continue;
      const operation = op || {};
      const name = toToolName(m, path, operation.operationId);
      const description = operation.description || operation.summary || `${m} ${path}`;
      const params = Array.isArray(operation.parameters) ? operation.parameters : [];
      const requiredPathParams = getRequiredParams(params, 'path');
      const requiredQueryParams = getRequiredParams(params, 'query');
      const inputSchema = buildInputSchema(operation);
      const security = Array.isArray(operation.security) ? operation.security : securityDefaults;
      tools.push({
        name,
        method: m,
        path,
        operationId: operation.operationId || null,
        summary: operation.summary || null,
        description,
        requiredPathParams,
        requiredQueryParams,
        inputSchema,
        security,
      });
    }
  }

  return tools;
}

// Load OpenAPI YAML as JS object.
function loadOpenApi(openapiPath: string): OpenApiSpec {
  const raw = readFileSync(openapiPath, 'utf8');
  return parse(raw);
}

// Resolve OpenAPI path with env override and sane defaults.
function resolveOpenApiPath(): string {
  const cwdOpenApi = resolve(process.cwd(), 'docs', 'openapi.yaml');
  const parentOpenApi = resolve(process.cwd(), '..', 'docs', 'openapi.yaml');
  const defaultPath = existsSync(cwdOpenApi) ? cwdOpenApi : parentOpenApi;
  return process.env.OPENAPI_PATH || defaultPath;
}

// Resolve MCP tools JSON path with env override and sane defaults.
function resolveMcpJsonPath(): string {
  const inMcpServerDir = basename(process.cwd()) === 'mcp-server';
  const defaultOutPath = inMcpServerDir
    ? resolve(process.cwd(), 'mcp.tools.json')
    : resolve(process.cwd(), 'mcp-server', 'mcp.tools.json');
  return process.env.MCP_JSON_PATH || defaultOutPath;
}

// Load generated MCP tools file from disk.
function loadMcpTools(mcpJsonPath: string): McpToolsFile {
  const raw = readFileSync(mcpJsonPath, 'utf8');
  return JSON.parse(raw);
}

// Build MCP tools JSON from OpenAPI spec and include metadata.
function buildMcpToolsFromOpenApi(openapiPath: string): McpToolsFile {
  const raw = readFileSync(openapiPath, 'utf8');
  const spec = parse(raw) as OpenApiSpec;
  const tools = buildToolsFromOpenApi(spec);
  const hash = createHash('sha256').update(raw).digest('hex');
  const cwd = process.cwd();
  const relativePath = openapiPath.startsWith(cwd) ? relative(cwd, openapiPath) : openapiPath;

  return {
    name: spec.info?.title || 'mcp-generated',
    version: spec.info?.version || '0.0.0',
    apiBaseUrl: '${API_BASE_URL}',
    source: {
      openapiPath: relativePath,
      sha256: hash,
      generatedAt: new Date().toISOString(),
    },
    tools,
  };
}

// Build a small index to expose available paths/methods.
function buildPathsIndex(spec: OpenApiSpec) {
  const paths = spec.paths || {};
  return Object.entries(paths).map(([path, methods]) => ({
    path,
    methods: Object.keys(methods || {}).map((method) => method.toUpperCase()),
  }));
}

// Match a request path to an OpenAPI template path.
function matchOpenApiPath(requestPath: string, specPaths: Record<string, any>) {
  if (specPaths[requestPath]) return { specPath: requestPath };

  for (const specPath of Object.keys(specPaths)) {
    const pattern = specPath.replace(/\{[^}]+\}/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    if (regex.test(requestPath)) return { specPath };
  }

  return null;
}

// Build a full URL with path params and query params.
function buildUrl(
  baseUrl: string,
  pathTemplate: string,
  pathParams?: Record<string, any>,
  query?: Record<string, any>
) {
  let path = pathTemplate;
  if (pathParams) {
    for (const [key, value] of Object.entries(pathParams)) {
      path = path.replace(new RegExp(`\\{${key}\\}`, 'g'), encodeURIComponent(String(value)));
    }
  }

  const url = new URL(path, baseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

// Allow query params to be passed either via `query` or aliased at top-level.
function buildToolInputSchema(tool: GeneratedTool) {
  const baseSchema = tool.inputSchema || {
    type: 'object',
    properties: {},
    additionalProperties: false,
  };

  if (!baseSchema?.properties?.query) return baseSchema;

  const schema = JSON.parse(JSON.stringify(baseSchema));
  if (Array.isArray(schema.required)) {
    schema.required = schema.required.filter((item: string) => item !== 'query');
  }

  const queryProps = schema.properties?.query?.properties;
  if (queryProps && typeof queryProps === 'object') {
    schema.properties = schema.properties || {};
    for (const [key, value] of Object.entries(queryProps)) {
      if (!schema.properties[key]) {
        schema.properties[key] = {
          ...(value as Record<string, any>),
          description: `Alias for query.${key}`,
        };
      }
    }
  }

  return schema;
}

// Call upstream API and normalize response.
async function callApi(options: {
  method: string;
  path: string;
  baseUrl: string;
  pathParams?: Record<string, any>;
  query?: Record<string, any>;
  body?: any;
  bearerToken?: string;
}): Promise<ApiCallResult> {
  const { method, path, baseUrl, pathParams, query, body, bearerToken } = options;
  const url = buildUrl(baseUrl, path, pathParams, query);

  const headers: Record<string, string> = {};
  if (bearerToken) headers.authorization = `Bearer ${bearerToken}`;

  let bodyPayload: string | undefined;
  if (body !== undefined) {
    if (typeof body === 'string') {
      bodyPayload = body;
    } else {
      bodyPayload = JSON.stringify(body);
      headers['content-type'] = 'application/json';
    }
  }

  const response = await fetch(url, {
    method,
    headers,
    body: bodyPayload,
  });

  const contentType = response.headers?.get('content-type') || '';
  const rawText = await response.text();
  let data: any = rawText;
  if (contentType.includes('application/json')) {
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      data = rawText;
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

async function main() {
  const openapiPath = resolveOpenApiPath();
  const spec = loadOpenApi(openapiPath);
  const mcpJsonPath = resolveMcpJsonPath();
  const useRuntimeGeneration = process.env.MCP_REGENERATE_TOOLS === 'true';

  let toolsFile: McpToolsFile;
  if (useRuntimeGeneration) {
    toolsFile = buildMcpToolsFromOpenApi(openapiPath);
  } else if (!existsSync(mcpJsonPath)) {
    console.warn(
      `MCP tools file not found at ${mcpJsonPath}. Regenerating from OpenAPI spec. ` +
        `Set MCP_REGENERATE_TOOLS=true to silence this warning.`
    );
    toolsFile = buildMcpToolsFromOpenApi(openapiPath);
  } else {
    toolsFile = loadMcpTools(mcpJsonPath);
  }

  const generatedTools = toolsFile.tools || [];
  const generatedToolMap = new Map(generatedTools.map((tool) => [tool.name, tool]));
  const baseUrl = process.env.API_BASE_URL || DEFAULT_BASE_URL;
  const pathsIndex = buildPathsIndex(spec);
  const specPaths = spec.paths || {};

  const server = new Server(
    { name: toolsFile.name || 'hgl-mcp-server', version: toolsFile.version || '0.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const list = generatedTools.map((tool) => ({
      name: tool.name,
      description: tool.description || tool.summary || `${tool.method} ${tool.path}`,
      inputSchema: buildToolInputSchema(tool),
    }));

    list.push({
      name: 'list_openapi_paths',
      description: 'List available OpenAPI paths and methods.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    });

    list.push({
      name: 'call_api',
      description: 'Call an OpenAPI endpoint by method and path.',
      inputSchema: {
        type: 'object',
        properties: {
          method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
          path: { type: 'string' },
          pathParams: { type: 'object', additionalProperties: true },
          query: { type: 'object', additionalProperties: true },
          body: { type: 'object', additionalProperties: true },
          bearerToken: { type: 'string' },
        },
        required: ['method', 'path'],
        additionalProperties: false,
      },
    });

    return { tools: list };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const name = request.params.name;
    const args = (request.params.arguments || {}) as ToolCallArgs;

    if (name === 'list_openapi_paths') {
      return {
        content: [{ type: 'text', text: JSON.stringify(pathsIndex) }],
      };
    }

    if (name === 'call_api') {
      const method = String(args.method || '').toUpperCase();
      const path = String(args.path || '');

      if (!method || !path) {
        return {
          isError: true,
          content: [{ type: 'text', text: 'method and path are required.' }],
        };
      }

      const matched = matchOpenApiPath(path, specPaths);
      if (!matched) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Path not found in OpenAPI spec: ${path}` }],
        };
      }

      const methodSpec = specPaths[matched.specPath]?.[method.toLowerCase()];
      if (!methodSpec) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Method ${method} not found for path ${matched.specPath}` }],
        };
      }

      const result = await callApi({
        method,
        path,
        baseUrl,
        pathParams: args.pathParams,
        query: args.query,
        body: args.body,
        bearerToken: args.bearerToken || process.env.API_AUTH_TOKEN,
      });

      return {
        isError: !result.ok,
        content: [{ type: 'text', text: JSON.stringify(result) }],
      };
    }

    const tool = generatedToolMap.get(name);
    if (!tool) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      };
    }

    // Support query params passed either in `query` or at top level.
    const queryFromArgs = args.query ?? {};
    const queryParams: Record<string, any> = { ...queryFromArgs };
    if (!args.query && tool.inputSchema?.properties?.query?.properties) {
      for (const key of Object.keys(tool.inputSchema.properties.query.properties)) {
        if (args[key] !== undefined) {
          queryParams[key] = args[key];
        }
      }
    }

    const requiredPathParams = tool.requiredPathParams || [];
    for (const param of requiredPathParams) {
      if (!args.pathParams || args.pathParams[param] === undefined) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Missing required path parameter: ${param}` }],
        };
      }
    }

    const requiredQueryParams = tool.requiredQueryParams || [];
    for (const param of requiredQueryParams) {
      if (queryParams[param] === undefined) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Missing required query parameter: ${param}` }],
        };
      }
    }

    const result = await callApi({
      method: tool.method,
      path: tool.path,
      baseUrl,
      pathParams: args.pathParams,
      query: Object.keys(queryParams).length > 0 ? queryParams : undefined,
      body: args.body,
      bearerToken: args.bearerToken || process.env.API_AUTH_TOKEN,
    });

    return {
      isError: !result.ok,
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  const httpPort = process.env.MCP_HTTP_PORT;
  if (httpPort) {
    const portNumber = Number(httpPort);
    if (!Number.isNaN(portNumber)) {
      const httpServer = createServer((req, res) => {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', tools: generatedTools.length }));
      });
      httpServer.listen(portNumber);
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
