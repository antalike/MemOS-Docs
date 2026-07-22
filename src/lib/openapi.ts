import { createOpenAPI } from 'fumadocs-openapi/server';

// Server-side OpenAPI instance. The processed specs live in `openapi/`
// (checked into the repo):
//   - opensource    : MemOS open-source REST API (-> /api-reference/*)
//   - dashboard-en  : MemOS Dashboard (cloud) API, English snippets injected
//   - dashboard-cn  : MemOS Dashboard (cloud) API, Chinese snippets injected
//
// Paths are resolved relative to the project root (cwd) at build time.
export const openapi = createOpenAPI({
  input: {
    opensource: './openapi/opensource.json',
    'dashboard-en': './openapi/dashboard.en.json',
    'dashboard-cn': './openapi/dashboard.cn.json',
  },
});
