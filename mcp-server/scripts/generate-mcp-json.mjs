import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, relative, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { parse } from 'yaml';

function toToolName(method, path, operationId) {
  if (operationId && typeof operationId === 'string' && operationId.trim().length > 0) return operationId;
  const normalized = path.replace(/^\//, '').replace(/\//g, '_').replace(/\{([^}]+)\}/g, 'by_$1');
  return `${method.toLowerCase()}_${normalized || 'root'}`;
}

function getRequiredParams(params, location) {
  if (!Array.isArray(params)) return [];
  return params.filter((p) => p?.in === location && p?.required).map((p) => p?.name).filter(Boolean);
}

function schemaWithDescription(schema, description) {
  if (!schema || typeof schema !== 'object') return schema;
  if (!description) return schema;
  return { ...schema, description };
}

function buildParamsSchema(params, location) {
  if (!Array.isArray(params)) return null;
  const filtered = params.filter((p) => p?.in === location);
  if (filtered.length === 0) return null;

  const properties = {};
  const required = [];

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

function getRequestBodySchema(operation) {
  const requestBody = operation?.requestBody;
  const content = requestBody?.content || {};
  const jsonContent = content['application/json'] || content['application/*+json'];
  return {
    schema: jsonContent?.schema ?? null,
    required: Boolean(requestBody?.required),
    description: jsonContent?.description || requestBody?.description || null,
  };
}

function buildInputSchema(operation) {
  const params = Array.isArray(operation?.parameters) ? operation.parameters : [];
  const pathParamsSchema = buildParamsSchema(params, 'path');
  const querySchema = buildParamsSchema(params, 'query');
  const { schema: bodySchema, required: bodyRequired, description: bodyDescription } =
    getRequestBodySchema(operation);

  const properties = {
    ...(pathParamsSchema ? { pathParams: pathParamsSchema } : {}),
    ...(querySchema ? { query: querySchema } : {}),
    ...(bodySchema
      ? {
          body: schemaWithDescription(bodySchema, bodyDescription),
        }
      : {}),
    bearerToken: {
      type: 'string',
      description: 'JWT bearer token if the endpoint requires authentication.',
    },
  };

  const required = [];
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

function generate(openapiPath, outPath) {
  const raw = readFileSync(openapiPath, 'utf8');
  const spec = parse(raw);
  const paths = spec.paths || {};
  const tools = [];
  const securityDefaults = Array.isArray(spec.security) ? spec.security : [];

  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, op] of Object.entries(methods)) {
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

  const hash = createHash('sha256').update(raw).digest('hex');
  const cwd = process.cwd();
  const relativePath = openapiPath.startsWith(cwd) ? relative(cwd, openapiPath) : openapiPath;

  const mcp = {
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

  writeFileSync(outPath, JSON.stringify(mcp, null, 2), 'utf8');
  console.log(`Wrote ${outPath} with ${tools.length} tools`);
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const cwdOpenApi = resolve(process.cwd(), 'docs', 'openapi.yaml');
  const parentOpenApi = resolve(process.cwd(), '..', 'docs', 'openapi.yaml');
  const openapiPath =
    process.env.OPENAPI_PATH || (existsSync(cwdOpenApi) ? cwdOpenApi : parentOpenApi);
  const inMcpServerDir = basename(process.cwd()) === 'mcp-server';
  const defaultOutPath = inMcpServerDir
    ? resolve(process.cwd(), 'mcp.tools.json')
    : resolve(process.cwd(), 'mcp-server', 'mcp.tools.json');
  const outPath = process.env.MCP_JSON_OUT || defaultOutPath;
  try {
    generate(openapiPath, outPath);
  } catch (err) {
    console.error('Failed to generate mcp.json:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

export { generate };
