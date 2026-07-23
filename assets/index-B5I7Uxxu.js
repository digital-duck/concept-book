(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const l of document.querySelectorAll('link[rel="modulepreload"]'))o(l);new MutationObserver(l=>{for(const n of l)if(n.type==="childList")for(const r of n.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&o(r)}).observe(document,{childList:!0,subtree:!0});function a(l){const n={};return l.integrity&&(n.integrity=l.integrity),l.referrerPolicy&&(n.referrerPolicy=l.referrerPolicy),l.crossOrigin==="use-credentials"?n.credentials="include":l.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function o(l){if(l.ep)return;l.ep=!0;const n=a(l);fetch(l.href,n)}})();const S={};function A(t,e){S[t]=e}function re(t){window.location.hash=t}function Y(){var o,l,n;const t=window.location.hash.slice(1)||"/",e=t.match(/^\/domain\/([^?]+)/);if(e){(o=S["/domain/:id"])==null||o.call(S,{id:decodeURIComponent(e[1])});return}const a=t.match(/^\/book(\?.*)?$/);if(a){const r=a[1]||"",p=Object.fromEntries(new URLSearchParams(r.slice(1)));(l=S["/book"])==null||l.call(S,p);return}(n=S[t])==null||n.call(S,{})}function de(){window.addEventListener("hashchange",Y),Y()}let z=null;async function G(){if(z)return z;const t=await fetch("/concept-book/domains/catalog.json");if(!t.ok)throw new Error(`Failed to load catalog: ${t.status}`);return z=await t.json(),z}const Z={en:{"app.title":"ConceptBook","app.tagline":"Explore knowledge through concept graphs","nav.graph":"Graph","nav.content":"Content","nav.about":"About","nav.settings":"Settings","home.subtitle":"Choose a domain to explore","home.filter.all":"All","home.filter.level":"Level","card.nodes":"nodes","card.edges":"edges","card.explore":"Explore Concept-Graph","card.read":"Read book","domain.back":"← Back","domain.openFullscreen":"Open fullscreen","about.title":"About concept-book",loading:"Loading…"}};let X=localStorage.getItem("cb-lang")||"en";function T(t){return(Z[X]||Z.en)[t]??t}function pe(t){X=t,localStorage.setItem("cb-lang",t)}function oe(){return X}function ue(t){const e=document.createElement("article");e.className="cb-card";const a=(t.tags||[]).map(o=>`<span class="cb-tag" data-tag="${o}">${o}</span>`).join("");return e.innerHTML=`
    <div class="cb-card__header">
      <h2 class="cb-card__title">${t.name}</h2>
      <div class="cb-card__tags">${a}</div>
    </div>
    <p class="cb-card__stats">${t.nodes} nodes · ${t.edges} edges · ${t.primitives} primitives</p>
    <p class="cb-card__desc">${t.description}</p>
    <div class="cb-card__actions">
      <button class="cb-btn cb-btn--primary js-explore" ${t.has_navigator?"":"disabled"}>
        ${T("card.explore")}
      </button>
      <span class="cb-book-indicator" title="${t.has_book?"Book available":""}">${t.has_book?"📖":""}</span>
    </div>
  `,e.querySelector(".js-explore").addEventListener("click",()=>{re(`/domain/${t.id}`)}),e}const ae=[{code:"en",label:"English"},{code:"zh",label:"中文 (Chinese)"},{code:"es",label:"Español (Spanish)"},{code:"fr",label:"Français (French)"},{code:"de",label:"Deutsch (German)"},{code:"ja",label:"日本語 (Japanese)"},{code:"ko",label:"한국어 (Korean)"},{code:"pt",label:"Português (Portuguese)"},{code:"ar",label:"العربية (Arabic)"},{code:"hi",label:"हिन्दी (Hindi)"}];function me(){const t=document.createElement("select");t.className="cb-lang-picker",t.title="Content language";const e=oe();return ae.forEach(({code:a,label:o})=>{const l=document.createElement("option");l.value=a,l.textContent=o,a===e&&(l.selected=!0),t.appendChild(l)}),t.addEventListener("change",()=>pe(t.value)),t}function P({domainName:t=""}={}){const e=document.createElement("header");e.className="cb-header";const a=document.createElement("div");a.className="cb-header__top";const o=document.createElement("a");if(o.className="cb-header__logo",o.href="#/",o.textContent=T("app.title"),a.appendChild(o),t){const s=document.createElement("span");s.className="cb-header__sep",s.textContent="›",a.appendChild(s);const h=document.createElement("span");h.className="cb-header__domain",h.textContent=t,a.appendChild(h)}const l=document.createElement("span");l.className="cb-header__spacer",a.appendChild(l);const n=document.createElement("nav");n.className="cb-header__nav";const r=document.createElement("a");r.href="#/graph",r.textContent=T("nav.graph"),n.appendChild(r);const p=document.createElement("a");p.href="#/book",p.textContent=T("nav.content"),n.appendChild(p);const c=document.createElement("a");c.href="#/settings",c.textContent=T("nav.settings"),n.appendChild(c),n.appendChild(me());const d=document.createElement("a");return d.href="#/about",d.textContent=T("nav.about"),n.appendChild(d),a.appendChild(n),e.appendChild(a),e}async function be(t){t.innerHTML="",t.appendChild(P());const e=document.createElement("main");e.className="cb-home",e.innerHTML=`<p class="cb-loading">${T("loading")}</p>`,t.appendChild(e);let a;try{a=await G()}catch(c){e.innerHTML=`<p class="cb-error">Could not load domains. ${c.message}</p>`;return}const o=[...new Set(a.flatMap(c=>c.tags))].sort(),l=["intro","core","college","research"];let n="all",r="all";function p(){let c=a;n!=="all"&&(c=c.filter(s=>s.tags.includes(n))),r!=="all"&&(c=c.filter(s=>s.default_level===r)),e.innerHTML=`
      <div class="cb-home__filters">
        <span class="cb-filter-group">
          <span class="cb-filter-label">Subject</span>
          <button class="cb-filter-btn ${n==="all"?"active":""}" data-tag="all">All</button>
          ${o.map(s=>`<button class="cb-filter-btn ${n===s?"active":""}" data-tag="${s}">${s}</button>`).join("")}
        </span>
        <span class="cb-filter-right">
          <span class="cb-filter-label">Level</span>
          <select class="cb-level-select" id="cb-level-filter">
            <option value="all" ${r==="all"?"selected":""}>All</option>
            ${l.map(s=>`<option value="${s}" ${r===s?"selected":""}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join("")}
          </select>
        </span>
      </div>
      <div class="cb-card-grid"></div>
    `;const d=e.querySelector(".cb-card-grid");c.forEach(s=>d.appendChild(ue(s))),e.querySelectorAll(".cb-filter-btn[data-tag]").forEach(s=>{s.addEventListener("click",()=>{n=s.dataset.tag,p()})}),e.querySelector("#cb-level-filter").addEventListener("change",s=>{r=s.target.value,p()})}p()}const fe=[{code:"en",label:"English"},{code:"zh",label:"中文"},{code:"es",label:"Español"},{code:"fr",label:"Français"},{code:"de",label:"Deutsch"},{code:"ja",label:"日本語"},{code:"ko",label:"한국어"},{code:"pt",label:"Português"},{code:"ar",label:"العربية"},{code:"hi",label:"हिन्दी"}],he=["intro","core","college","research"];function ge(t,e){const a={};(e||[]).forEach(l=>{if(!l.name||!l.file)return;const n=a[l.name];(!n||n.model&&!l.model)&&(a[l.name]={file:l.file,model:l.model})});const o={};return Object.keys(a).forEach(l=>{o[l]=`/concept-book/domains/${t}/${a[l].file}`}),o}function ve(t,{level:e="intro",lang:a="en"}={}){const{id:o,books:l=[],generated_concepts:n=[],capstone:r}=t,p=document.createElement("div");p.className="cb-graph-viewer";const c=document.createElement("iframe");return c.className="cb-graph-viewer__frame",c.src=`/concept-book/domains/${o}/output/graph.html`,c.title=`${o} concept graph`,c.setAttribute("allowfullscreen",""),c.addEventListener("load",()=>{var d;try{const s=c.contentWindow;if(!s)return;s.eval("window.__cb_RAW = RAW; window.__cb_nodeIndex = nodeIndex"),s.__cb_CONCEPTS_BASE=`/concept-book/domains/${o}/output/${e}.${a}/html/`,s.__cb_CONCEPT_URLS=ge(o,n);const h=(((d=s.__cb_RAW)==null?void 0:d.nodes)||[]).map(b=>({id:b.id,label:b.label,kind:b.kind,tier:b.tier??0}));window.dispatchEvent(new CustomEvent("cb:graphLoaded",{detail:{concepts:h}}));const _=s.handleSelect;s.handleSelect=function(b){var u;_.call(s,b);const g=(u=s.__cb_nodeIndex)==null?void 0:u[b];g&&window.dispatchEvent(new CustomEvent("cb:nodeSelected",{detail:{nodeId:b,node:g}}))},ye(s,c.contentDocument),xe(s,c.contentDocument,o,l,n,e,a),_e(s,c.contentDocument,o,r,e,a,l)}catch{}}),p.appendChild(c),p.selectNode=d=>{var s,h;try{(h=(s=c.contentWindow)==null?void 0:s.selectNode)==null||h.call(s,d)}catch{}},p}function ye(t,e){if(e.querySelector("#cb-sidebar-theme"))return;const a=e.createElement("style");a.id="cb-sidebar-theme",a.textContent=`
    .app { grid-template-columns: 260px 1fr 220px !important; }
    #path-sidebar {
      background: #1e3a5f !important;
      color: #e8f0fe !important;
      border-right-color: rgba(255,255,255,0.12) !important;
    }
    #path-header { border-bottom-color: rgba(255,255,255,0.12) !important; }
    #path-header h1 { color: #90b4e8 !important; }
    #path-header .domain-name { color: #a8c8f0 !important; }
    #path-count { color: #90b4e8 !important; }
    #path-steps .hint { color: #90b4e8 !important; }
    .step-item:hover { background: rgba(255,255,255,0.07) !important; }
    .step-item.active { background: rgba(74,144,217,0.25) !important; border-left-color: #60a5fa !important; }
    .step-item.target { background: rgba(76,175,80,0.18) !important; border-left-color: #4caf50 !important; }
    .step-label { color: #e8f0fe !important; }
    .step-def { color: #90b4e8 !important; }
    .step-num { color: #90b4e8 !important; }
    .step-item.target .step-num { color: #6fcf73 !important; }
    /* Fix node-type badge colors to match the graph */
    .primitive-k { background: #fffde7 !important; color: #795548 !important; }
    .concept-k   { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .application-k { background: #fce4ec !important; color: #c62828 !important; }
  `,e.head.appendChild(a);const o=e.querySelector("#path-steps");if(o&&!e.querySelector("#cb-node-legend")){const l=e.createElement("div");l.id="cb-node-legend",l.style.cssText="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.1);flex-shrink:0",l.innerHTML=`
      <div style="font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:#90b4e8;font-weight:700;margin-bottom:6px">Node Types</div>
      <div style="display:flex;flex-direction:row;flex-wrap:wrap;gap:8px">
        <span style="display:flex;align-items:center;gap:5px;font-size:10px;color:#e8f0fe">
          <span style="display:inline-block;width:16px;height:10px;background:#fffde7;border:1px solid #795548;border-radius:2px;flex-shrink:0"></span>Primitive
        </span>
        <span style="display:flex;align-items:center;gap:5px;font-size:10px;color:#e8f0fe">
          <span style="display:inline-block;width:16px;height:10px;background:#e8f5e9;border:1px solid #2e7d32;border-radius:50%;flex-shrink:0"></span>Concept
        </span>
        <span style="display:flex;align-items:center;gap:5px;font-size:10px;color:#e8f0fe">
          <span style="display:inline-block;width:16px;height:10px;background:#fce4ec;border:1px solid #c62828;border-radius:2px;flex-shrink:0"></span>Application
        </span>
      </div>
    `,o.insertAdjacentElement("beforebegin",l)}}const ee=["flex:1","min-width:0","padding:5px 6px","border:1px solid rgba(255,255,255,0.3)","border-radius:5px","background:#fff","color:#2a2a2a","font-size:12px","font-family:system-ui,sans-serif","box-sizing:border-box"].join(";"),V=["flex-shrink:0","padding:5px 10px","background:#2563eb","color:#fff","border:none","border-radius:5px","font-size:12px","cursor:pointer","font-family:system-ui,sans-serif"].join(";"),j=V+";opacity:.4;cursor:default",te="display:flex;gap:6px;align-items:center;margin-bottom:10px",ne=["font-size:10px","letter-spacing:.06em","text-transform:uppercase","color:#90b4e8","font-weight:700","margin-bottom:4px"].join(";"),le="padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.1);flex-shrink:0;background:#1e3a5f",se="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#90b4e8;font-weight:700;margin-bottom:8px";function B(t,e,a,o=""){return o&&/output\/[^/]+\/[^/]+\/html\//.test(t)?t.replace(/output\/[^/]+\/[^/]+\/html\//,`output/${e}.${a}/${o}/html/`):t.replace(/output\/[^/]+\/html\//,`output/${e}.${a}/html/`)}function xe(t,e,a,o,l,n,r){const p=e.querySelector("#path-header");if(!p||e.querySelector("#cb-read"))return;const c=[...o].sort((i,f)=>i.target.localeCompare(f.target)),d=[...l].sort((i,f)=>i.label.localeCompare(f.label)),s="margin-top:4px;font-size:11px;color:#fca5a5;display:none",h=new Set(c.map(i=>i.model).filter(Boolean)),_=new Set(d.map(i=>i.model).filter(Boolean)),b=h.size>1,g=_.size>1,u=c.length>0?`
    <div style="${ne}">TOC Index</div>
    <div style="${te}">
      <select id="cb-book-sel" style="${ee}">
        <option value="">Select book…</option>
        ${c.map(i=>{const f=i.target.replace(/_/g," ")+(b&&i.model?` (${i.model})`:"");return`<option value="${B(i.file,n,r,i.model||"")}" data-orig="${i.file}" data-model="${i.model||""}">${f}</option>`}).join("")}
      </select>
      <button id="cb-book-btn" disabled style="${j}">Open</button>
    </div>
    <div id="cb-book-warn" style="${s}"></div>
  `:"",m=d.length>0?`
    <div style="${ne}">Concept</div>
    <div style="${te}">
      <select id="cb-cpt-sel" style="${ee}">
        <option value="">Select concept…</option>
        ${d.map(i=>{const f=i.label+(g&&i.model?` (${i.model})`:"");return`<option value="${B(i.file,n,r,i.model||"")}" data-orig="${i.file}" data-model="${i.model||""}">${f}</option>`}).join("")}
      </select>
      <button id="cb-cpt-btn" disabled style="${j}">Open</button>
    </div>
    <div id="cb-cpt-warn" style="${s}"></div>
  `:"",v=e.createElement("div");v.id="cb-read",v.style.cssText=le,v.innerHTML=`
    <div style="${se}">Concept Books</div>
    ${u}
    ${m}
  `,p.insertAdjacentElement("afterend",v);function y(i,f){i.textContent=f,i.style.display="block"}async function x(i){try{const f=await fetch(i);if(!f.ok)return!1;const C=await f.text();return C.includes("spl-credit")||C.includes("Generated by")}catch{return!1}}function E(i,f){const C=`/concept-book/domains/${a}/${i}`;x(C).then(L=>{L?window.location.hash=`/book?domain=${a}&file=${encodeURIComponent(i)}`:y(f,"No content available for this level/language combination.")})}if(e.addEventListener("cb:settings-change",({detail:{level:i,lang:f}})=>{v.querySelectorAll("#cb-book-sel option[data-orig]").forEach(C=>{C.value=B(C.dataset.orig,i,f,C.dataset.model)}),v.querySelectorAll("#cb-cpt-sel option[data-orig]").forEach(C=>{C.value=B(C.dataset.orig,i,f,C.dataset.model)}),e.querySelector("#cb-book-warn")&&(e.querySelector("#cb-book-warn").style.display="none"),e.querySelector("#cb-cpt-warn")&&(e.querySelector("#cb-cpt-warn").style.display="none")}),c.length>0){const i=v.querySelector("#cb-book-sel"),f=v.querySelector("#cb-book-btn"),C=v.querySelector("#cb-book-warn");i.addEventListener("change",()=>{f.disabled=!i.value,f.style.cssText=i.value?V:j,C.style.display="none"}),f.addEventListener("click",()=>{i.value&&E(i.value,C)})}if(d.length>0){const i=v.querySelector("#cb-cpt-sel"),f=v.querySelector("#cb-cpt-btn"),C=v.querySelector("#cb-cpt-warn");i.addEventListener("change",()=>{f.disabled=!i.value,f.style.cssText=i.value?V:j,C.style.display="none"}),f.addEventListener("click",()=>{i.value&&E(i.value,C)})}}function _e(t,e,a,o,l,n,r=[]){var M;const p=e.querySelector("#path-header");if(!p||e.querySelector("#cb-gen"))return;const c=["width:100%","padding:5px 8px","border:1px solid rgba(255,255,255,0.3)","border-radius:5px","background:#fff","color:#2a2a2a","font-size:12px","margin-bottom:6px","font-family:system-ui,sans-serif"].join(";"),d=e.createElement("div");d.id="cb-gen",d.style.cssText=le,d.innerHTML=`
    <div style="${se}">Generate Book</div>
    <select id="cb-target-sel" style="${c}">
      <option value="">Select target concept…</option>
    </select>
    <select id="cb-model-sel" style="${c}">
      <option value="gemma3">gemma3 — local (Ollama)</option>
      <option value="gemma4">gemma4 — local (Ollama)</option>
      <option value="sonnet" selected>sonnet — premium, default (Claude API)</option>
      <option value="haiku">haiku — fast, premium (Claude API)</option>
      <option value="opus">opus — best quality (Claude API)</option>
    </select>
    <div style="display:flex;gap:6px;margin-bottom:6px">
      <select id="cb-level-sel" style="flex:1;padding:5px 6px;border:1px solid rgba(255,255,255,0.3);border-radius:5px;background:#fff;color:#2a2a2a;font-size:12px;font-family:system-ui,sans-serif">
        ${he.map(k=>`<option value="${k}" ${k===l?"selected":""}>${k.charAt(0).toUpperCase()+k.slice(1)}</option>`).join("")}
      </select>
      <select id="cb-lang-sel" style="flex:1;padding:5px 6px;border:1px solid rgba(255,255,255,0.3);border-radius:5px;background:#fff;color:#2a2a2a;font-size:12px;font-family:system-ui,sans-serif">
        ${fe.map(k=>`<option value="${k.code}" ${k.code===n?"selected":""}>${k.label}</option>`).join("")}
      </select>
    </div>
    <label style="display:flex;align-items:center;gap:5px;font-size:11px;color:#90b4e8;margin-bottom:6px;font-family:system-ui,sans-serif;cursor:pointer">
      <input type="checkbox" id="cb-skip-cache"> Skip cache
    </label>
    <div style="display:flex;gap:6px">
      <button id="cb-gen-btn" disabled
        style="flex:1;padding:6px 10px;background:#2563eb;color:#fff;border:none;border-radius:5px;font-size:12px;cursor:pointer;font-family:system-ui,sans-serif">
        Generate
      </button>
      <button id="cb-pdf-btn" disabled
        style="flex:1;padding:6px 10px;background:#16a34a;color:#fff;border:none;border-radius:5px;font-size:12px;cursor:pointer;font-family:system-ui,sans-serif">
        PDF
      </button>
    </div>
    <div id="cb-pdf-result" style="display:none;gap:6px;margin-top:6px"></div>
    <div style="position:relative">
      <pre id="cb-gen-log"
        style="display:none;margin-top:8px;font-size:10px;line-height:1.5;color:#e8f0fe;background:rgba(0,0,0,0.3);padding:8px;border-radius:4px;max-height:160px;overflow-y:auto;white-space:pre-wrap;font-family:Menlo,Consolas,monospace"></pre>
      <button id="cb-gen-copy"
        style="display:none;position:absolute;top:12px;right:4px;padding:2px 8px;font-size:10px;background:#2563eb;border:none;border-radius:3px;cursor:pointer;font-family:system-ui,sans-serif;color:#fff">Copy</button>
    </div>
  `,p.insertAdjacentElement("afterend",d);const s=d.querySelector("#cb-target-sel"),h=d.querySelector("#cb-model-sel"),_=d.querySelector("#cb-level-sel"),b=d.querySelector("#cb-lang-sel"),g=d.querySelector("#cb-skip-cache"),u=d.querySelector("#cb-gen-btn"),m=d.querySelector("#cb-pdf-btn"),v=d.querySelector("#cb-pdf-result"),y=d.querySelector("#cb-gen-log"),x=d.querySelector("#cb-gen-copy");function E(){e.dispatchEvent(new CustomEvent("cb:settings-change",{detail:{level:_.value,lang:b.value}}))}_.addEventListener("change",E),b.addEventListener("change",E),x.addEventListener("click",()=>{navigator.clipboard.writeText(y.textContent).then(()=>{x.textContent="Copied!",setTimeout(()=>{x.textContent="Copy"},1500)})});const i=`cb_gen_target_${a}`,f=(((M=t.__cb_RAW)==null?void 0:M.nodes)||[]).filter(k=>k.kind!=="primitive").sort((k,w)=>k.label.localeCompare(w.label)),C=sessionStorage.getItem(i),L=C&&f.some(k=>k.id===C)?C:o;f.forEach(k=>{const w=e.createElement("option");w.value=k.id,w.textContent=k.label,k.id===L&&(w.selected=!0),s.appendChild(w)}),s.value&&(u.disabled=!1,m.disabled=!1),s.addEventListener("change",()=>{s.value&&sessionStorage.setItem(i,s.value),u.disabled=!s.value,m.disabled=!s.value,m.textContent="PDF",m.style.background="#16a34a",v.style.display="none",v.innerHTML=""}),m.addEventListener("click",async()=>{const k=s.value;if(!k)return;const w=_.value,F=b.value;m.disabled=!0,m.textContent="Generating…",m.style.background="#ea580c";try{const I=`/api/pdf?domain=${encodeURIComponent(a)}&target=${encodeURIComponent(k)}&level=${encodeURIComponent(w)}&language=${encodeURIComponent(F)}`,O=await fetch(I),R=await O.json();if(!O.ok)throw new Error(R.detail||"PDF generation failed");const N=`/concept-book/domains/${a}/${R.file}`;m.textContent="PDF ✓",m.disabled=!1,v.innerHTML=`
        <a href="${N}" download
           style="flex:1;padding:6px 10px;background:#16a34a;color:#fff;border:none;border-radius:5px;font-size:12px;cursor:pointer;text-align:center;text-decoration:none;font-family:system-ui,sans-serif">
          ⬇ Download
        </a>
        <a href="${N}" target="_blank"
           style="flex:1;padding:6px 10px;background:#0369a1;color:#fff;border:none;border-radius:5px;font-size:12px;cursor:pointer;text-align:center;text-decoration:none;font-family:system-ui,sans-serif">
          ↗ Open
        </a>
      `,v.style.display="flex"}catch(I){m.textContent="Error",m.style.background="#dc2626",m.title=I.message,setTimeout(()=>{m.textContent="PDF",m.style.background="#16a34a",m.disabled=!1},3e3)}}),u.addEventListener("click",()=>{const k=s.value;if(!k)return;sessionStorage.setItem(i,k);const w=h.value,F=_.value,I=b.value,O=g.checked;u.disabled=!0,u.textContent="Generating…",u.style.background="#ea580c",y.style.display="block",x.style.display="block",y.textContent=`▶ target: ${k}  model: ${w}
`;const R=`/api/generate?domain=${encodeURIComponent(a)}&target=${encodeURIComponent(k)}&level=${encodeURIComponent(F)}&language=${encodeURIComponent(I)}&model=${encodeURIComponent(w)}${O?"&skip_cache=true":""}`,$=new t.EventSource(R);$.addEventListener("log",N=>{const{message:ie}=JSON.parse(N.data);y.textContent+=ie+`
`,y.scrollTop=y.scrollHeight}),$.addEventListener("done",()=>{$.close(),y.textContent+=`
✓ Done — reloading…`,setTimeout(()=>t.parent.location.reload(),1200)}),$.addEventListener("gen_error",N=>{$.close(),y.textContent+=`
✗ ${JSON.parse(N.data).message}`,u.disabled=!1,u.textContent="Retry",u.style.background="#dc2626"}),$.onerror=()=>{$.readyState!==t.EventSource.CLOSED&&($.close(),y.textContent+=`
✗ API not reachable.
  Run: bash scripts/start-api.sh`,u.disabled=!1,u.textContent="Retry",u.style.background="#dc2626")}})}function Ce(){return oe()}const U={claude_cli:{label:"Claude CLI",models:[{value:"claude-sonnet-4-6",label:"Sonnet 4.6"},{value:"claude-haiku-4-5-20251001",label:"Haiku 4.5"},{value:"claude-opus-4-8",label:"Opus 4.8"}]},openrouter:{label:"OpenRouter",models:[{value:"anthropic/claude-sonnet-4-6",label:"Claude Sonnet 4.6"},{value:"anthropic/claude-haiku-4-5-20251001",label:"Claude Haiku 4.5"},{value:"anthropic/claude-opus-4-8",label:"Claude Opus 4.8"},{value:"google/gemini-2.5-pro",label:"Gemini 2.5 Pro"},{value:"google/gemini-2.5-flash",label:"Gemini 2.5 Flash"},{value:"google/gemini-3.5-flash",label:"Gemini 3.5 Flash"},{value:"openai/gpt-4.1",label:"GPT-4.1"},{value:"openai/gpt-5.4-mini",label:"GPT 5.4 Mini"},{value:"openai/o3-mini",label:"o3-mini"},{value:"deepseek/deepseek-r1",label:"DeepSeek R1"},{value:"meta-llama/llama-4-maverick",label:"Llama 4 Maverick"},{value:"z-ai/glm-5.2",label:"GLM 5.2"},{value:"qwen/qwen3.5-35b-a3b",label:"Qwen 3.5 35B"},{value:"qwen/qwen3.6-35b-a3b",label:"Qwen 3.6 35B"},{value:"nvidia/nemotron-3-ultra-550b-a55b:free",label:"Nemotron 3 Ultra 550B"},{value:"moonshotai/kimi-k2.6",label:"Kimi 2.6"}]},ollama:{label:"Ollama (local)",models:null}};async function W(t,e){const a=U[t.value];if(e.innerHTML="",!a)return;let o=a.models;if(t.value==="ollama"&&!o){try{const l=await fetch("/api/settings/ollama-models");l.ok&&(o=await l.json())}catch{}if(!o||o.length===0){const l=document.createElement("option");l.value="",l.textContent="(ollama not available)",e.appendChild(l);return}U.ollama.models=o}for(const l of o){const n=document.createElement("option");n.value=l.value,n.textContent=l.label,e.appendChild(n)}}function K(t){if(t===0)return"never expires";if(t<1)return`${Math.round(t*60)} min`;if(t===1)return"1 hour";if(t<24)return`${t} hours`;const e=t/24;return Number.isInteger(e)?`${e} day${e>1?"s":""}`:`${t} hours`}async function ke(t){t.innerHTML="",t.appendChild(P());const e=document.createElement("main");e.className="cb-settings",e.innerHTML=`
    <h2>Settings</h2>
    <section class="cb-settings__section">
      <div class="cb-settings__section-title">SPL Adapter and Model Configuration</div>
      <div class="cb-settings__pair">
        <div class="cb-settings__field">
          <label class="cb-settings__label">Adapter</label>
          <select id="cb-adapter" class="cb-settings__select">
            ${Object.entries(U).map(([u,m])=>`<option value="${u}">${m.label}</option>`).join("")}
          </select>
        </div>
        <div class="cb-settings__field cb-settings__field--grow">
          <label class="cb-settings__label">Model</label>
          <select id="cb-model" class="cb-settings__select"></select>
        </div>
      </div>
      <div class="cb-settings__row" style="margin-top:16px">
        <button id="cb-settings-save" class="cb-btn">Save</button>
        <span id="cb-settings-status" class="cb-settings__status"></span>
      </div>
      <div class="cb-settings__current" id="cb-current-llm"></div>
    </section>
    <section class="cb-settings__section">
      <div class="cb-settings__section-title">SPL Execution Limits</div>
      <div class="cb-settings__pair">
        <div class="cb-settings__field">
          <label class="cb-settings__label">While Max Iterations</label>
          <input id="cb-while-max-iter" type="number" min="1" step="1" value="50"
            class="cb-settings__select" style="width:100px"
            title="SPL_WHILE_MAX_ITER — max loop iterations before abort (default 15).">
        </div>
        <div class="cb-settings__field">
          <label class="cb-settings__label">Max LLM Calls</label>
          <input id="cb-max-llm-calls" type="number" min="1" step="1" value="50"
            class="cb-settings__select" style="width:100px"
            title="SPL_MAX_LLM_CALLS — max LLM GENERATE calls per workflow run.">
        </div>
      </div>
      <div class="cb-settings__row" style="margin-top:16px">
        <button id="cb-spl-limits-save" class="cb-btn">Save</button>
        <span id="cb-spl-limits-status" class="cb-settings__status"></span>
      </div>
    </section>
    <section class="cb-settings__section">
      <div class="cb-settings__section-title">AI Semantic Compare Cache</div>
      <div class="cb-settings__pair">
        <div class="cb-settings__field">
          <label class="cb-settings__label">TTL (hours)</label>
          <input id="cb-cache-ttl" type="number" min="0" step="1" value="24"
            class="cb-settings__select" style="width:100px"
            title="How long a cached comparison result is reused. 0 = never expire.">
        </div>
        <div class="cb-settings__field" style="align-self:flex-end;padding-bottom:4px">
          <span id="cb-cache-ttl-hint" style="font-size:0.82rem;color:#6b7280"></span>
        </div>
      </div>
      <div class="cb-settings__row" style="margin-top:16px">
        <button id="cb-cache-save" class="cb-btn">Save</button>
        <span id="cb-cache-status" class="cb-settings__status"></span>
      </div>
    </section>
  `,t.appendChild(e);const a=e.querySelector("#cb-adapter"),o=e.querySelector("#cb-model"),l=e.querySelector("#cb-settings-save"),n=e.querySelector("#cb-settings-status"),r=e.querySelector("#cb-current-llm");a.addEventListener("change",()=>W(a,o)),await W(a,o);const p=e.querySelector("#cb-while-max-iter"),c=e.querySelector("#cb-max-llm-calls"),d=e.querySelector("#cb-spl-limits-save"),s=e.querySelector("#cb-spl-limits-status"),h=e.querySelector("#cb-cache-ttl"),_=e.querySelector("#cb-cache-ttl-hint"),b=e.querySelector("#cb-cache-save"),g=e.querySelector("#cb-cache-status");h.addEventListener("input",()=>{const u=Number(h.value);_.textContent=isNaN(u)||u<0?"":K(u)});try{const u=await fetch("/api/settings");if(u.ok){const m=await u.json();r.textContent=`Current: ${m.llm}`;const[v,...y]=m.llm.split(":"),x=y.join(":");U[v]&&(a.value=v,await W(a,o),[...o.options].some(i=>i.value===x)&&(o.value=x)),m.spl_while_max_iter&&(p.value=m.spl_while_max_iter),m.spl_max_llm_calls&&(c.value=m.spl_max_llm_calls);const E=Math.round(m.compare_cache_ttl/3600);h.value=E,_.textContent=K(E)}}catch{n.textContent="API not reachable — run the backend to change settings",n.style.color="#dc2626"}l.addEventListener("click",async()=>{const u=`${a.value}:${o.value}`;try{(await fetch("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({llm:u})})).ok?(r.textContent=`Current: ${u}`,n.textContent="Saved",n.style.color="#16a34a"):(n.textContent="Save failed",n.style.color="#dc2626")}catch{n.textContent="API not reachable",n.style.color="#dc2626"}setTimeout(()=>{n.textContent=""},3e3)}),d.addEventListener("click",async()=>{const u=Number(p.value),m=Number(c.value);if(!Number.isInteger(u)||u<1||!Number.isInteger(m)||m<1){s.textContent="Enter valid integers ≥ 1",s.style.color="#dc2626",setTimeout(()=>{s.textContent=""},3e3);return}try{(await fetch("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({spl_while_max_iter:u,spl_max_llm_calls:m})})).ok?(s.textContent="Saved",s.style.color="#16a34a"):(s.textContent="Save failed",s.style.color="#dc2626")}catch{s.textContent="API not reachable",s.style.color="#dc2626"}setTimeout(()=>{s.textContent=""},3e3)}),b.addEventListener("click",async()=>{const u=Number(h.value);if(isNaN(u)||u<0){g.textContent="Enter a valid number ≥ 0",g.style.color="#dc2626",setTimeout(()=>{g.textContent=""},3e3);return}const m=Math.round(u*3600);try{(await fetch("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({compare_cache_ttl:m})})).ok?(_.textContent=K(u),g.textContent="Saved",g.style.color="#16a34a"):(g.textContent="Save failed",g.style.color="#dc2626")}catch{g.textContent="API not reachable",g.style.color="#dc2626"}setTimeout(()=>{g.textContent=""},3e3)})}async function ce(t,{id:e}={}){t.innerHTML="";const a=Symbol();t._renderKey=a;let o=null,l=[];try{l=await G(),e&&(o=l.find(b=>b.id===e)??{id:e,name:e,has_book:!1,books:[],generated_concepts:[],capstone:null})}catch{}if(t._renderKey!==a)return;const n=document.createElement("div");n.style.cssText="display:flex;flex-direction:column;height:100vh;overflow:hidden",t.appendChild(n),n.appendChild(P({domainName:(o==null?void 0:o.name)||""}));const r=document.createElement("div");r.className="cb-domain-picker-bar";const p=document.createElement("span");p.className="cb-domain-picker-bar__label",p.textContent="Domain",r.appendChild(p);const c=document.createElement("select");c.className="cb-domain-picker-bar__select";const d=document.createElement("option");if(d.value="",d.textContent="Select domain…",c.appendChild(d),[...l].sort((b,g)=>b.id.localeCompare(g.id,"zh")).forEach(b=>{const g=document.createElement("option");g.value=b.id,g.textContent=b.name||b.id,b.id===e&&(g.selected=!0),c.appendChild(g)}),c.addEventListener("change",()=>{c.value&&(window.location.hash=`/domain/${encodeURIComponent(c.value)}`)}),r.appendChild(c),n.appendChild(r),!e||!o)return;if(o.source){const b=document.createElement("div");b.className="cb-attribution",b.innerHTML=`Source: <a href="${o.source.url}" target="_blank">${o.source.title}</a> by ${o.source.authors} (${o.source.license}). ${o.source.attribution}`,n.appendChild(b)}const s=document.createElement("main");s.className="cb-domain";const h=o.default_level||"intro",_=Ce();s.appendChild(ve(o,{level:h,lang:_})),n.appendChild(s)}function Ee(t){t.innerHTML="",t.appendChild(P());const e=document.createElement("main");e.className="cb-about",e.innerHTML=`
    <h1>About concept-book</h1>
    <p>
      <strong>concept-book</strong> is an open portal that lets any learner explore a knowledge
      domain through its <em>concept graph</em> — a directed acyclic graph (DAG) where nodes
      are concepts (primitive, concept, application) and edges are prerequisite relationships.
    </p>

    <h2>How to use it</h2>
    <ol>
      <li>Pick a domain from the home page</li>
      <li>Click any concept node in the interactive graph</li>
      <li>The left sidebar shows the ordered learning path — the exact sequence of concepts you must master first</li>
      <li>Read the concept-book section for each concept in the path</li>
    </ol>

    <h2>The founding use-case: Chinese Characters</h2>
    <p>
      Chinese characters share the same structure as chemical elements — a small set of
      elemental radicals (primitives) combine to form hundreds of compound characters.
      Learning the ~12 elementals unlocks the ability to decode characters by structure alone.
      The concept graph makes that derivation visible and navigable.
    </p>

    <h2>The content engine</h2>
    <p>
      All domain graphs and concept-book text are generated by
      <a href="https://github.com/digital-duck/SPL.py" target="_blank" rel="noopener">SPL.py</a>
      — a structured programming language for LLM-driven content generation with math verification.
      concept-book is the web-app layer that hosts and presents what SPL.py produces.
    </p>

    <h2>Open source</h2>
    <p>
      concept-book is open source under the Apache 2.0 license.
      Source and contribution guide at
      <a href="https://github.com/digital-duck/concept-book" target="_blank" rel="noopener">github.com/digital-duck/concept-book</a>.
    </p>
  `,t.appendChild(e)}const Le=["intro","core","college","research"],we=[{value:"",label:"— default —"},{value:"gemma3",label:"gemma3 (Ollama)"},{value:"gemma4",label:"gemma4 (Ollama)"},{value:"sonnet",label:"sonnet (Claude)"},{value:"haiku",label:"haiku (Claude)"},{value:"opus",label:"opus (Claude)"}];function Se(t){const e=t.match(/output\/([^.]+)\.([^/]+)\//);return e?{level:e[1],lang:e[2]}:{level:"college",lang:"en"}}function D(t){const e=t.match(/output\/[^/]+\/([^/]+)\/html\//);return e?e[1]:""}function Q(t){return t.replace(/^.*\//,"")}function $e(t,e,a,o,l){const n=Q(e),r=l?`${l}/`:"";return`/concept-book/domains/${t}/output/${a}.${o}/${r}html/${n}`}const q=new Map;function Te(t,e){e.forEach(a=>{const o=`/concept-book/domains/${encodeURIComponent(t)}/${a.file}`;q.set(o,!0)})}async function Me(t){if(q.has(t))return q.get(t);try{const e=await fetch(t);if(!e.ok)return q.set(t,!1),!1;const a=await e.text(),o=a.includes("spl-credit")||a.includes("Generated by");return q.set(t,o),o}catch{return q.set(t,!1),!1}}function Ne(t,e,a,o){const l=decodeURIComponent(t).replace(/^(?:concept|book)_/,"").replace(/_/g," ").replace(/\.html$/,"");return`<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;padding:48px 40px;color:#374151;background:#fafafa;min-height:100vh">
    <h2 style="color:#1e3a5f;margin:0 0 16px;font-size:1.3rem">Content Not Available</h2>
    <p style="margin:0 0 12px;font-size:0.9rem;color:#6b7280">No page exists for this combination:</p>
    <div style="background:#fff;border:1px solid #e0e3e8;border-radius:8px;padding:16px 20px;margin-bottom:24px;display:inline-block">
      <div style="margin-bottom:6px"><span style="font-weight:600;color:#374151;min-width:80px;display:inline-block">Model:</span><span style="color:#2563eb">${e||"default"}</span></div>
      <div style="margin-bottom:6px"><span style="font-weight:600;color:#374151;min-width:80px;display:inline-block">Level:</span><span style="color:#2563eb">${o}</span></div>
      <div><span style="font-weight:600;color:#374151;min-width:80px;display:inline-block">Language:</span><span style="color:#2563eb">${a}</span></div>
    </div>
    <p style="color:#6b7280;font-size:0.88rem;line-height:1.6">Please generate the concept book for <strong style="color:#1e3a5f">${l}</strong> first via the Concept-Graph page.</p>
  </body></html>`}function J(t,e,a){const o=document.createElement("select");return o.className=a,t.forEach(({value:l,label:n})=>{const r=document.createElement("option");r.value=l,r.textContent=n,l===e&&(r.selected=!0),o.appendChild(r)}),o}function qe(t,e,a){const o=document.createElement("div");o.className="cb-book-pane__controls";const l=J(we,e.model,"cb-book-pane__select");l.title="Model",l.addEventListener("change",()=>a("model",l.value)),o.appendChild(l);const n=J(Le.map(p=>({value:p,label:p.charAt(0).toUpperCase()+p.slice(1)})),e.level,"cb-book-pane__select");n.title="Level",n.addEventListener("change",()=>a("level",n.value)),o.appendChild(n);const r=J(ae.map(p=>({value:p.code,label:p.label})),e.lang,"cb-book-pane__select");return r.title="Language",r.addEventListener("change",()=>a("lang",r.value)),o.appendChild(r),o}function Ae(t,e,{onConceptClick:a}){t.innerHTML="";try{const o=e.contentDocument,l=o==null?void 0:o.querySelector("nav.toc");if(!l){t.innerHTML='<div style="color:#90b4e8;font-size:11px;padding:4px 0">No table of contents for this page.</div>';return}const n=document.createElement("div");n.style.cssText="font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;color:#90b4e8;margin-bottom:14px;font-family:system-ui,sans-serif;font-weight:700",n.textContent="Contents",t.appendChild(n);const r=l.querySelector("ol");if(r){const c=document.createElement("ol");c.style.cssText="list-style:decimal inside;padding:0;margin:0;flex:1",r.querySelectorAll("li").forEach(d=>{const s=d.querySelector("a");if(!s)return;const h=d.classList.contains("toc-target"),_=document.createElement("li");_.style.cssText=`margin-bottom:7px;font-size:.85rem;line-height:1.4;font-family:system-ui,sans-serif${h?";font-weight:700":""}`;const b=document.createElement("a");b.textContent=s.textContent,b.href="#",b.style.cssText=`text-decoration:none;color:${h?"#fff":"#a8c8f0"}`,b.addEventListener("mouseover",()=>{b.style.color="#fff"}),b.addEventListener("mouseout",()=>{b.style.color=h?"#fff":"#a8c8f0"}),b.addEventListener("click",g=>{g.preventDefault(),a(s.getAttribute("href"))}),_.appendChild(b),c.appendChild(_)}),t.appendChild(c)}if(l.querySelector(".spl-credit")){const c=document.createElement("div");c.style.cssText="margin-top:auto;padding-top:14px;border-top:1px solid rgba(255,255,255,0.15);font-size:11px;color:#90b4e8;font-family:system-ui,sans-serif",c.textContent="Generated by SPL",t.appendChild(c)}}catch{}}function He(t){try{const e=t.contentDocument;if(!e)return;const a=e.createElement("style");a.textContent="nav.toc { display: none !important; } .page { grid-template-columns: 1fr !important; } h1.book-title + section > h2:first-child { display: none !important; }",e.head.appendChild(a)}catch{}}async function Ie(){try{return(await G()).map(e=>e.id)}catch{return[]}}async function Pe(t){try{const a=(await G()).find(n=>n.id===t)??{},o=(a.books||[]).map(n=>({file:n.file,label:n.target.replace(/_/g," ").trim()||n.target,model:n.model||D(n.file)})),l=(a.generated_concepts||[]).map(n=>({file:n.file,label:n.label,model:n.model||D(n.file)}));return Te(t,[...o,...l]),{books:o,concepts:l}}catch{return{books:[],concepts:[]}}}function Oe(t,e){const a=document.createElement("nav");a.className="cb-book-nav";const o=document.createElement("div");o.className="cb-book-nav__title",o.textContent="Concept Books",a.appendChild(o);function l(y){const x=document.createElement("div");return x.className="cb-book-nav__label",x.textContent=y,x}a.appendChild(l("Domain"));const n=document.createElement("select");n.className="cb-book-nav__select",a.appendChild(n),a.appendChild(l("Model"));const r=document.createElement("select");r.className="cb-book-nav__select",r.innerHTML='<option value="">— all —</option>',a.appendChild(r),a.appendChild(l("TOC Index"));const p=document.createElement("select");p.className="cb-book-nav__select",a.appendChild(p),a.appendChild(l("Concept"));const c=document.createElement("select");c.className="cb-book-nav__select",a.appendChild(c);const d=document.createElement("button");d.textContent="Open",d.disabled=!0,d.className="cb-book-nav__open",a.appendChild(d);function s(){d.disabled=!n.value||!p.value&&!c.value}let h=[],_=[];function b(){const y=r.value,x=y?h.filter(i=>!i.model||i.model===y):h,E=y?_.filter(i=>!i.model||i.model===y):_;p.innerHTML='<option value="">Select book…</option>',c.innerHTML='<option value="">Select concept…</option>',x.forEach(i=>{const f=document.createElement("option");f.value=i.file,f.textContent=i.label,i.file===e&&(f.selected=!0),p.appendChild(f)}),E.forEach(i=>{const f=document.createElement("option");f.value=i.file,f.textContent=i.label,i.file===e&&(f.selected=!0),c.appendChild(f)}),s()}async function g(y){p.innerHTML='<option value="">Loading…</option>',c.innerHTML='<option value="">Loading…</option>',r.innerHTML='<option value="">Loading…</option>',s();const{books:x,concepts:E}=await Pe(y);h=x,_=E;const i=new Set;x.forEach(L=>{L.model&&i.add(L.model)}),E.forEach(L=>{L.model&&i.add(L.model)});const f=[...i].sort();r.innerHTML='<option value="">— all —</option>',f.forEach(L=>{const M=document.createElement("option");M.value=L,M.textContent=L,r.appendChild(M)});const C=e?D(e):"";C&&i.has(C)?r.value=C:i.has("sonnet")&&(r.value="sonnet"),b()}async function u(){n.innerHTML='<option value="">Loading…</option>',p.innerHTML='<option value="">—</option>',c.innerHTML='<option value="">—</option>',s();const y=await Ie();n.innerHTML='<option value="">Select domain…</option>',[...y].sort((x,E)=>x.localeCompare(E,"zh")).forEach(x=>{const E=document.createElement("option");E.value=x,E.textContent=x,x===t&&(E.selected=!0),n.appendChild(E)}),n.value?await g(n.value):s()}n.addEventListener("change",()=>{n.value?g(n.value):(p.innerHTML='<option value="">—</option>',c.innerHTML='<option value="">—</option>',r.innerHTML='<option value="">— all —</option>',h=[],_=[],s())}),r.addEventListener("change",b),p.addEventListener("change",()=>{p.value&&(c.value=""),s()}),c.addEventListener("change",()=>{c.value&&(p.value=""),s()}),d.addEventListener("click",()=>{const y=p.value||c.value,x=n.value;y&&x&&(window.location.hash=`/book?domain=${encodeURIComponent(x)}&file=${encodeURIComponent(y)}`)});const m=document.createElement("div");m.style.cssText="border-top:1px solid rgba(255,255,255,0.15);margin:10px 0 8px;flex-shrink:0",a.appendChild(m);const v=document.createElement("div");return v.style.cssText="flex:1;overflow-y:auto;min-height:0;display:flex;flex-direction:column",v.innerHTML='<div style="color:#90b4e8;font-size:11px;padding:4px 0">Open a book to see contents.</div>',a.appendChild(v),a.tocSection=v,u(),a}function Re(t,e){const{domain:a,file:o}=e||{};t.innerHTML="",t.style.cssText="",t.className="cb-book-page",t.appendChild(P());const l=document.createElement("div");l.style.cssText="display:flex;flex:1;overflow:hidden",t.appendChild(l);const n=Oe(a||"",o||"");l.appendChild(n);const r=document.createElement("div");if(r.style.cssText="flex:1;display:flex;overflow:hidden;min-width:0",l.appendChild(r),!a||!o)return;const p=Se(o);let c=o;const d={level:p.level,lang:p.lang,model:D(o)},s=document.createElement("div");s.style.cssText="flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0",r.appendChild(s),s.appendChild(qe(null,d,(g,u)=>{d[g]=u,b()}));const h=document.createElement("iframe");h.style.cssText="flex:1;width:100%;border:none;display:block",s.appendChild(h);let _=!1;h.addEventListener("load",()=>{var g,u;if(!_){try{const m=(u=(g=h.contentWindow)==null?void 0:g.location)==null?void 0:u.href;if(m&&!m.startsWith("about:")){const v=decodeURIComponent(m.replace(/.*\/html\//,""));v&&!v.includes("://")&&v!==Q(c)&&(c=c.replace(/[^/]+\.html$/,v))}}catch{}He(h),Ae(n.tocSection,h,{onConceptClick:m=>{var v,y;if(m){if(m.startsWith("#")){try{(y=(v=h.contentDocument)==null?void 0:v.querySelector(m))==null||y.scrollIntoView({behavior:"smooth"})}catch{}return}c=c.replace(/[^/]+\.html$/,m),b()}}})}});function b(){n.tocSection.innerHTML='<div style="color:#90b4e8;font-size:11px;padding:4px 0">Loading…</div>';const g=$e(a,c,d.level,d.lang,d.model);Me(g).then(u=>{_=!u,u?h.src=g:(h.removeAttribute("src"),h.srcdoc=Ne(Q(c),d.model,d.lang,d.level))})}b()}const H=document.getElementById("app");A("/",()=>be(H));A("/about",()=>Ee(H));A("/settings",()=>ke(H));A("/domain/:id",t=>ce(H,t));A("/graph",()=>ce(H,{}));A("/book",t=>Re(H,t));de();
