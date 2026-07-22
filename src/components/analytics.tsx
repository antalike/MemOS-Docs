import Script from 'next/script';

/**
 * Third-party analytics & attribution, ported verbatim from the legacy Nuxt
 * site (`nuxt.config.ts` head scripts):
 *  - first-touch UTM attribution cookie (`memos_attr`)
 *  - Microsoft Clarity + Google Analytics (gtag), self-disabled on
 *    localhost / `-pre.` / `-gray.` hosts
 *  - Aliyun ARMS RUM (perf / web-vitals / JS errors / action tracking)
 *
 * The locale helper libraries (js-cookie / locale.min.js) are NOT loaded here —
 * they belong to the i18n subsystem, see `@/components/locale-scripts`.
 *
 * The inline script bodies use the same escaping as the original config and
 * must not be reformatted.
 */
export function Analytics() {
  return (
    <>
      <Script id="memos-utm-attr" strategy="afterInteractive">
        {`(function(){try{var d=document,l=location,n='memos_attr',R='openmem.net';if(d.cookie.match(new RegExp('(?:^|;\\\\s*)'+n+'=([^;]*)')))return;var q=new URLSearchParams(l.search),s=q.get('utm_source')||'',m=q.get('utm_medium')||'',c=q.get('utm_campaign')||'',rh='';try{rh=d.referrer?new URL(d.referrer).hostname:''}catch(e){}var int=!rh||rh===l.hostname||rh===R||rh.endsWith('.'+R);if(!s){if(!int){s=rh;m=m||'referral'}else{s='(direct)';m=m||'(none)'}}var v=JSON.stringify({source:s,medium:m||'(not set)',campaign:c,referrer:(d.referrer||'').slice(0,300),landing_page:(l.origin+l.pathname).slice(0,300),ts:Date.now()});var dm=l.hostname.endsWith(R)?';domain=.'+R:'';d.cookie=n+'='+encodeURIComponent(v)+';path=/;max-age=7776000'+dm+';SameSite=Lax'}catch(e){}})();`}
      </Script>
      <Script id="memos-clarity-gtag" strategy="afterInteractive">
        {`(function(){var h=location.hostname;if(h.indexOf('-pre.')!==-1||h.indexOf('-gray.')!==-1||h==='localhost')return;(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","wfn83tdrco");window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments);};window.gtag('js',new Date());window.gtag('config','G-7J1J9RW0T1',{page_location:location.origin+(location.pathname.replace(/\\\/$/,'')||'/')+location.search});var s=document.createElement('script');s.async=1;s.src='https://www.googletagmanager.com/gtag/js?id=G-7J1J9RW0T1';document.head.appendChild(s);})();`}
      </Script>
      {/* Aliyun ARMS RUM (perf / web-vitals / JS errors / action tracking),
          ported from the legacy `plugins/arms.client.ts`. Rewritten without the
          original `with(...)` form, which is a SyntaxError under strict mode. */}
      <Script id="memos-arms-rum" strategy="afterInteractive">
        {`(function(){var h=location.hostname;var env=(h==='localhost'||h==='127.0.0.1')?'local':(h.indexOf('gray')>=0?'gray':'prod');window.__rum={pid:'a3u72ukxmr@97ced9ba5a7ed22',endpoint:'https://a3u72ukxmr-default-cn.rum.aliyuncs.com',env:env,spaMode:'history',collectors:{perf:true,webVitals:true,api:true,staticResource:true,jsError:true,consoleError:true,action:true},tracing:false};var s=document.createElement('script');document.body.insertBefore(s,document.body.firstChild);s.setAttribute('crossorigin','');s.src='https://sdk.rum.aliyuncs.com/v2/browser-sdk.js';})();`}
      </Script>
    </>
  );
}
