export default defineNuxtPlugin((/* nuxtApp */) => {
  if (import.meta.client) {
    const getEnv = () => {
      if (import.meta.dev)
        return 'local'
      if (window.location.hostname.includes('gray'))
        return 'gray'
      return import.meta.env.VITE_ENV
    }

    const env = getEnv()
    const script = document.createElement('script')
    script.innerHTML = `
      !(function(c,b,d,a){c[a]||(c[a]={});c[a]=
        {
          pid: 'a3u72ukxmr@97ced9ba5a7ed22',
          endpoint: 'https://a3u72ukxmr-default-cn.rum.aliyuncs.com',
          env: '${env}', 
          spaMode: 'history',
          collectors: {
            perf: true,
            webVitals: true,
            api: true,
            staticResource: true,
            jsError: true,
            consoleError: true,
            action: true,
          },
          tracing: false,
        }
        with(b)with(body)with(insertBefore(createElement("script"),firstChild))setAttribute("crossorigin","",src=d)
      })(window, document, "https://sdk.rum.aliyuncs.com/v2/browser-sdk.js", "__rum");
    `
    document.head.appendChild(script)
  }
})
