import fs from 'fs'
import yaml from 'js-yaml'
import path from 'path'

function extractRoutesFromNav(nav, prefix = '', routes = new Set()) {
  for (const item of nav) {
    const [, value] = Object.entries(item)[0]
    if (Array.isArray(value)) {
      for (const subItem of value) {
        if (typeof subItem === 'string') {
          // Convert markdown path to route path
          const routePath = subItem
            .replace(/\.md$/, '')
            .replace(/\/index$/, '')
          routes.add(path.join(prefix, routePath))
        } else {
          const [, subValue] = Object.entries(subItem)[0]
          if (typeof subValue === 'string') {
            const routePath = subValue
              .replace(/\.md$/, '')
              .replace(/\/index$/, '')
            routes.add(path.join(prefix, routePath))
          } else if (Array.isArray(subValue)) {
            extractRoutesFromNav([subItem], prefix, routes)
          }
        }
      }
    }
  }
  return routes
}

/**
 * Extract routes from OpenAPI JSON file
 * @param {string} jsonFilePath - Path to the OpenAPI JSON file
 * @param {string} routePrefix - Route prefix to add to each path
 * @param {string} collectionName - Collection name to determine route generation strategy
 * @returns {string[]} Array of route paths
 */
function extractOpenApiRoutes(jsonFilePath, routePrefix = '', collectionName = 'openapi') {
  try {
    const jsonContent = fs.readFileSync(jsonFilePath, 'utf8')
    const openApiSpec = JSON.parse(jsonContent)

    const routes = new Set()

    if (openApiSpec.paths) {
      for (const [, methods] of Object.entries(openApiSpec.paths)) {
        for (const [method, operation] of Object.entries(methods)) {
          if (['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method.toLowerCase())) {
            // Generate route path based on operationId or summary
            const separator = collectionName === 'openapi' ? ' ' : '_'
            let routePath = collectionName === 'openapi' ? operation.summary : operation.operationId

            if (routePath) {
              // Convert to kebab-case
              routePath = routePath.split(separator).map(s => s.toLowerCase()).join('-')
              const fullRoute = path.join(routePrefix, routePath)
              routes.add(fullRoute)
            }
          }
        }
      }
    }

    return Array.from(routes)
  } catch (error) {
    console.error(`Error reading OpenAPI file ${jsonFilePath}:`, error)
    return []
  }
}

export function getCnRoutes() {
  const cnSettings = yaml.load(fs.readFileSync('content/cn/settings.yml', 'utf8'))

  return Array.from(extractRoutesFromNav(cnSettings.nav, '/cn'))
}

export function getEnRoutes() {
  const enSettings = yaml.load(fs.readFileSync('content/en/settings.yml', 'utf8'))

  return Array.from(extractRoutesFromNav(enSettings.nav))
}

/**
 * Get routes from Chinese Dashboard API JSON
 */
export function getCnDashboardApiRoutes() {
  return extractOpenApiRoutes('content/cn/dashboard/api/api.json', '/cn/dashboard/api', 'dashboardApi')
}

/**
 * Get routes from English Dashboard API JSON
 */
export function getEnDashboardApiRoutes() {
  return extractOpenApiRoutes('content/en/dashboard/api/api.json', '/dashboard/api', 'dashboardApi')
}

/**
 * Get routes from main API JSON
 */
export function getCnApiReferenceRoutes() {
  return extractOpenApiRoutes('content/api.json', '/cn/api-reference', 'openapi')
}
