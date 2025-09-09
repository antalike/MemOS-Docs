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

export function getCnRoutes() {
  const cnSettings = yaml.load(fs.readFileSync('content/cn/settings.yml', 'utf8'))

  return Array.from(extractRoutesFromNav(cnSettings.nav, '/cn'))
}

export function getEnRoutes() {
  const enSettings = yaml.load(fs.readFileSync('content/en/settings.yml', 'utf8'))

  return Array.from(extractRoutesFromNav(enSettings.nav))
}