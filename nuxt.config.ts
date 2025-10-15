import yaml from '@rollup/plugin-yaml'
import type { NuxtConfig } from '@nuxt/schema'
import pkg from './package.json'
import { getCnRoutes, getCnDashboardApiRoutes, getCnApiReferenceRoutes } from './scripts/extract-routes.mjs'

const cnRoutes = getCnRoutes()
const cnDashboardApiRoutes = getCnDashboardApiRoutes()
const cnApiRoutes = getCnApiReferenceRoutes()
// Get locale from command line arguments or environment variable
const env = process.env.NUXT_ENV_CONFIG || 'prod'

const armsScript = process.env.NODE_ENV === 'production'
  ? [{ innerHTML: `var _czc = _czc || [];
        (function () {
          var um = document.createElement("script");
          um.src = "https://v1.cnzz.com/z.js?id=1281423419&async=1";
          var s = document.getElementsByTagName("script")[0];
          s.parentNode.insertBefore(um, s);
        })();`,
    type: 'text/javascript' }]
  : []

const envConfig = await import(`./envConfig/config.${env}.ts`).then(m => m.default).catch(() => {
  return {
    env: 'prod',
    enDomain: 'https://memos-docs.openmem.net'
  }
})

const config: NuxtConfig = {
  app: {
    head: {
      script: [
        ...armsScript
      ]
    }
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui-pro',
    '@nuxt/content',
    [
      'nuxt-openapi-docs-module',
      {
        folder: './content',
        name: 'Api Docs',
        list: true,
        prefix: '/api',
        files: function () {
          return {
            'api.json': 'API Proxy'
          }
        }
      }
    ],
    '@nuxtjs/i18n'
  ],

  runtimeConfig: {
    public: {
      ...envConfig,
      version: pkg.version
    }
  },

  i18n: {
    locales: [
      {
        code: 'cn',
        iso: 'zh-CN',
        name: '中文'
      },
      {
        code: 'en',
        iso: 'en-US',
        name: 'English'
      }
    ],
    defaultLocale: 'en',
    // locale prefix added for every locale except default
    strategy: 'prefix_except_default',
    vueI18n: './i18n.config.ts',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'MEMOS_LANG',
      cookieDomain: 'openmem.net',
      fallbackLocale: 'en'
    },
    pages: undefined
  },

  devtools: {
    enabled: true
  },

  vite: {
    plugins: [
      yaml()
    ]
  },

  ssr: true,

  css: ['~/assets/css/main.css'],

  ui: {
    fonts: false,
    colorMode: false
  },

  content: {
    build: {
      markdown: {
        highlight: {
          langs: ['bash', 'shell', 'ts', 'typescript', 'diff', 'vue', 'json', 'yml', 'css', 'mdc', 'python', 'py', 'mermaid']
        }
      }
    }
  },

  future: {
    compatibilityVersion: 4
  },

  compatibilityDate: '2024-07-11',

  nitro: {
    prerender: {
      routes: [
        '/',
        '/cn',
        ...cnRoutes,
        ...cnDashboardApiRoutes,
        ...cnApiRoutes,
        '/cn/dashboard/api/overview',
        '/cn/dashboard/api/error_code'
      ],
      crawlLinks: true
    }
  },

  routeRules: {
    '/': {
      redirect: '/open_source/home/overview'
    },
    '/cn': {
      redirect: '/cn/open_source/home/overview'
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  icon: {
    provider: 'iconify'
  },

  uiPro: {
    license: process.env.NUXT_UI_PRO_LICENSE
  }
}

export default defineNuxtConfig(config)
