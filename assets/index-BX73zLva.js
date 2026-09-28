(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const l of document.querySelectorAll('link[rel="modulepreload"]'))o(l);new MutationObserver(l=>{for(const n of l)if(n.type==="childList")for(const r of n.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&o(r)}).observe(document,{childList:!0,subtree:!0});function a(l){const n={};return l.integrity&&(n.integrity=l.integrity),l.referrerPolicy&&(n.referrerPolicy=l.referrerPolicy),l.crossOrigin==="use-credentials"?n.credentials="include":l.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function o(l){if(l.ep)return;l.ep=!0;const n=a(l);fetch(l.href,n)}})();const $={};function A(t,e){$[t]=e}function ue(t){window.location.hash=t}function Y(){var o,l,n;const t=window.location.hash.slice(1)||"/",e=t.match(/^\/domain\/([^?]+)/);if(e){(o=$["/domain/:id"])==null||o.call($,{id:decodeURIComponent(e[1])});return}const a=t.match(/^\/book(\?.*)?$/);if(a){const r=a[1]||"",b=Object.fromEntries(new URLSearchParams(r.slice(1)));(l=$["/book"])==null||l.call($,b);return}(n=$[t])==null||n.call($,{})}function me(){window.addEventListener("hashchange",Y),Y()}let j=null;async function G(){if(j)return j;const t=await fetch("/concept-book/domains/catalog.json");if(!t.ok)throw new Error(`Failed to load catalog: ${t.status}`);return j=await t.json(),j}const Z={en:{"app.title":"ConceptBook","app.tagline":"Explore knowledge through concept graphs","nav.graph":"Graph","nav.content":"Content","nav.about":"About","nav.settings":"Settings","home.subtitle":"Choose a domain to explore","home.filter.all":"All","home.filter.level":"Level","card.nodes":"nodes","card.edges":"edges","card.explore":"Explore Concept-Graph","card.read":"Read book","domain.back":"← Back","domain.openFullscreen":"Open fullscreen","about.title":"About concept-book",loading:"Loading…"}};let X=localStorage.getItem("cb-lang")||"en";function T(t){return(Z[X]||Z.en)[t]??t}function be(t){X=t,localStorage.setItem("cb-lang",t)}function le(){return X}function fe(t){const e=document.createElement("article");e.className="cb-card";const a=(t.tags||[]).map(o=>`<span class="cb-tag" data-tag="${o}">${o}</span>`).join("");return e.innerHTML=`
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
  `,e.querySelector(".js-explore").addEventListener("click",()=>{ue(`/domain/${t.id}`)}),e}const se=[{code:"en",label:"English"},{code:"zh",label:"中文 (Chinese)"},{code:"es",label:"Español (Spanish)"},{code:"fr",label:"Français (French)"},{code:"de",label:"Deutsch (German)"},{code:"ja",label:"日本語 (Japanese)"},{code:"ko",label:"한국어 (Korean)"},{code:"pt",label:"Português (Portuguese)"},{code:"ar",label:"العربية (Arabic)"},{code:"hi",label:"हिन्दी (Hindi)"}];function he(){const t=document.createElement("select");t.className="cb-lang-picker",t.title="Content language";const e=le();return se.forEach(({code:a,label:o})=>{const l=document.createElement("option");l.value=a,l.textContent=o,a===e&&(l.selected=!0),t.appendChild(l)}),t.addEventListener("change",()=>be(t.value)),t}function P({domainName:t=""}={}){const e=document.createElement("header");e.className="cb-header";const a=document.createElement("div");a.className="cb-header__top";const o=document.createElement("a");if(o.className="cb-header__logo",o.href="#/",o.textContent=T("app.title"),a.appendChild(o),t){const c=document.createElement("span");c.className="cb-header__sep",c.textContent="›",a.appendChild(c);const h=document.createElement("span");h.className="cb-header__domain",h.textContent=t,a.appendChild(h)}const l=document.createElement("span");l.className="cb-header__spacer",a.appendChild(l);const n=document.createElement("nav");n.className="cb-header__nav";const r=document.createElement("a");r.href="#/graph",r.textContent=T("nav.graph"),n.appendChild(r);const b=document.createElement("a");b.href="#/book",b.textContent=T("nav.content"),n.appendChild(b);const s=document.createElement("a");s.href="#/settings",s.textContent=T("nav.settings"),n.appendChild(s),n.appendChild(he());const p=document.createElement("a");return p.href="#/about",p.textContent=T("nav.about"),n.appendChild(p),a.appendChild(n),e.appendChild(a),e}async function ge(t){t.innerHTML="",t.appendChild(P());const e=document.createElement("main");e.className="cb-home",e.innerHTML=`<p class="cb-loading">${T("loading")}</p>`,t.appendChild(e);let a;try{a=await G()}catch(s){e.innerHTML=`<p class="cb-error">Could not load domains. ${s.message}</p>`;return}const o=[...new Set(a.flatMap(s=>s.tags))].sort(),l=["intro","core","college","research"];let n="all",r="all";function b(){let s=a;n!=="all"&&(s=s.filter(c=>c.tags.includes(n))),r!=="all"&&(s=s.filter(c=>c.default_level===r)),e.innerHTML=`
      <div class="cb-home__filters">
        <span class="cb-filter-group">
          <span class="cb-filter-label">Subject</span>
          <button class="cb-filter-btn ${n==="all"?"active":""}" data-tag="all">All</button>
          ${o.map(c=>`<button class="cb-filter-btn ${n===c?"active":""}" data-tag="${c}">${c}</button>`).join("")}
        </span>
        <span class="cb-filter-right">
          <span class="cb-filter-label">Level</span>
          <select class="cb-level-select" id="cb-level-filter">
            <option value="all" ${r==="all"?"selected":""}>All</option>
            ${l.map(c=>`<option value="${c}" ${r===c?"selected":""}>${c.charAt(0).toUpperCase()+c.slice(1)}</option>`).join("")}
          </select>
        </span>
      </div>
      <div class="cb-card-grid"></div>
    `;const p=e.querySelector(".cb-card-grid");s.forEach(c=>p.appendChild(fe(c))),e.querySelectorAll(".cb-filter-btn[data-tag]").forEach(c=>{c.addEventListener("click",()=>{n=c.dataset.tag,b()})}),e.querySelector("#cb-level-filter").addEventListener("change",c=>{r=c.target.value,b()})}b()}const ve=[{code:"en",label:"English"},{code:"zh",label:"中文"},{code:"es",label:"Español"},{code:"fr",label:"Français"},{code:"de",label:"Deutsch"},{code:"ja",label:"日本語"},{code:"ko",label:"한국어"},{code:"pt",label:"Português"},{code:"ar",label:"العربية"},{code:"hi",label:"हिन्दी"}],ye=["intro","core","college","research"];function xe(t,e){const a={};(e||[]).forEach(l=>{if(!l.name||!l.file)return;const n=a[l.name];(!n||n.model&&!l.model)&&(a[l.name]={file:l.file,model:l.model})});const o={};return Object.keys(a).forEach(l=>{o[l]=`/concept-book/domains/${t}/${a[l].file}`}),o}function _e(t,{level:e="intro",lang:a="en"}={}){const{id:o,books:l=[],generated_concepts:n=[],capstone:r}=t,b=document.createElement("div");b.className="cb-graph-viewer";const s=document.createElement("iframe");return s.className="cb-graph-viewer__frame",s.src=`/concept-book/domains/${o}/output/graph.html`,s.title=`${o} concept graph`,s.setAttribute("allowfullscreen",""),s.addEventListener("load",()=>{var p;try{const c=s.contentWindow;if(!c)return;c.eval("window.__cb_RAW = RAW; window.__cb_nodeIndex = nodeIndex"),c.__cb_CONCEPTS_BASE=`/concept-book/domains/${o}/output/${e}.${a}/html/`,c.__cb_CONCEPT_URLS=xe(o,n);const h=(((p=c.__cb_RAW)==null?void 0:p.nodes)||[]).map(f=>({id:f.id,label:f.label,kind:f.kind,tier:f.tier??0}));window.dispatchEvent(new CustomEvent("cb:graphLoaded",{detail:{concepts:h}}));const _=c.handleSelect;c.handleSelect=function(f){var u;_.call(c,f);const v=(u=c.__cb_nodeIndex)==null?void 0:u[f];v&&window.dispatchEvent(new CustomEvent("cb:nodeSelected",{detail:{nodeId:f,node:v}}))},Ce(c,s.contentDocument),ke(c,s.contentDocument,o,l,n,e,a),Ee(c,s.contentDocument,o,r,e,a,l)}catch{}}),b.appendChild(s),b.selectNode=p=>{var c,h;try{(h=(c=s.contentWindow)==null?void 0:c.selectNode)==null||h.call(c,p)}catch{}},b}function Ce(t,e){if(e.querySelector("#cb-sidebar-theme"))return;const a=e.createElement("style");a.id="cb-sidebar-theme",a.textContent=`
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
    `,o.insertAdjacentElement("beforebegin",l)}}const ee=["flex:1","min-width:0","padding:5px 6px","border:1px solid rgba(255,255,255,0.3)","border-radius:5px","background:#fff","color:#2a2a2a","font-size:12px","font-family:system-ui,sans-serif","box-sizing:border-box"].join(";"),V=["flex-shrink:0","padding:5px 10px","background:#2563eb","color:#fff","border:none","border-radius:5px","font-size:12px","cursor:pointer","font-family:system-ui,sans-serif"].join(";"),z=V+";opacity:.4;cursor:default",te="display:flex;gap:6px;align-items:center;margin-bottom:10px",ne=["font-size:10px","letter-spacing:.06em","text-transform:uppercase","color:#90b4e8","font-weight:700","margin-bottom:4px"].join(";"),ce="padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.1);flex-shrink:0;background:#1e3a5f",ie="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#90b4e8;font-weight:700;margin-bottom:8px";function oe(t){const e=t.match(/output\/([^.]+)\.([^/]+)\//);return e?{level:e[1],lang:e[2]}:{level:"?",lang:"?"}}function U(t,e,a,o=""){return o&&/output\/[^/]+\/[^/]+\/html\//.test(t)?t.replace(/output\/[^/]+\/[^/]+\/html\//,`output/${e}.${a}/${o}/html/`):t.replace(/output\/[^/]+\/html\//,`output/${e}.${a}/html/`)}function ke(t,e,a,o,l,n,r){const b=e.querySelector("#path-header");if(!b||e.querySelector("#cb-read"))return;const s=[...o].sort((i,m)=>i.target.localeCompare(m.target)),p=[...l].sort((i,m)=>i.label.localeCompare(m.label)),c="margin-top:4px;font-size:11px;color:#fca5a5;display:none";function h(i,m){const g={};return i.forEach(E=>{const L=m(E);g[L]=(g[L]||0)+1}),g}const _=h(s,i=>i.target),f=h(p,i=>i.label),v=s.length>0?`
    <div style="${ne}">TOC Index</div>
    <div style="${te}">
      <select id="cb-book-sel" style="${ee}">
        <option value="">Select book…</option>
        ${s.map(i=>{const{level:m,lang:g}=oe(i.file),E=i.target.replace(/_/g," ")+(_[i.target]>1?` [${m}.${g}, ${i.model||"legacy"}]`:"");return`<option value="${U(i.file,n,r,i.model||"")}" data-orig="${i.file}" data-model="${i.model||""}">${E}</option>`}).join("")}
      </select>
      <button id="cb-book-btn" disabled style="${z}">Open</button>
    </div>
    <div id="cb-book-warn" style="${c}"></div>
  `:"",u=p.length>0?`
    <div style="${ne}">Concept</div>
    <div style="${te}">
      <select id="cb-cpt-sel" style="${ee}">
        <option value="">Select concept…</option>
        ${p.map(i=>{const{level:m,lang:g}=oe(i.file),E=i.label+(f[i.label]>1?` [${m}.${g}, ${i.model||"legacy"}]`:"");return`<option value="${U(i.file,n,r,i.model||"")}" data-orig="${i.file}" data-model="${i.model||""}">${E}</option>`}).join("")}
      </select>
      <button id="cb-cpt-btn" disabled style="${z}">Open</button>
    </div>
    <div id="cb-cpt-warn" style="${c}"></div>
  `:"",d=e.createElement("div");d.id="cb-read",d.style.cssText=ce,d.innerHTML=`
    <div style="${ie}">Concept Books</div>
    ${v}
    ${u}
  `,b.insertAdjacentElement("afterend",d);function k(i,m){i.textContent=m,i.style.display="block"}async function x(i){try{const m=await fetch(i);if(!m.ok)return!1;const g=await m.text();return g.includes("spl-credit")||g.includes("Generated by")}catch{return!1}}function y(i,m){const g=`/concept-book/domains/${a}/${i}`;x(g).then(E=>{E?window.location.hash=`/book?domain=${a}&file=${encodeURIComponent(i)}`:k(m,"No content available for this level/language combination.")})}if(e.addEventListener("cb:settings-change",({detail:{level:i,lang:m}})=>{d.querySelectorAll("#cb-book-sel option[data-orig]").forEach(g=>{g.value=U(g.dataset.orig,i,m,g.dataset.model)}),d.querySelectorAll("#cb-cpt-sel option[data-orig]").forEach(g=>{g.value=U(g.dataset.orig,i,m,g.dataset.model)}),e.querySelector("#cb-book-warn")&&(e.querySelector("#cb-book-warn").style.display="none"),e.querySelector("#cb-cpt-warn")&&(e.querySelector("#cb-cpt-warn").style.display="none")}),s.length>0){const i=d.querySelector("#cb-book-sel"),m=d.querySelector("#cb-book-btn"),g=d.querySelector("#cb-book-warn");i.addEventListener("change",()=>{m.disabled=!i.value,m.style.cssText=i.value?V:z,g.style.display="none"}),m.addEventListener("click",()=>{i.value&&y(i.value,g)})}if(p.length>0){const i=d.querySelector("#cb-cpt-sel"),m=d.querySelector("#cb-cpt-btn"),g=d.querySelector("#cb-cpt-warn");i.addEventListener("change",()=>{m.disabled=!i.value,m.style.cssText=i.value?V:z,g.style.display="none"}),m.addEventListener("click",()=>{i.value&&y(i.value,g)})}}function Ee(t,e,a,o,l,n,r=[]){var M;const b=e.querySelector("#path-header");if(!b||e.querySelector("#cb-gen"))return;const s=["width:100%","padding:5px 8px","border:1px solid rgba(255,255,255,0.3)","border-radius:5px","background:#fff","color:#2a2a2a","font-size:12px","margin-bottom:6px","font-family:system-ui,sans-serif"].join(";"),p=e.createElement("div");p.id="cb-gen",p.style.cssText=ce,p.innerHTML=`
    <div style="${ie}">Generate Book</div>
    <select id="cb-target-sel" style="${s}">
      <option value="">Select target concept…</option>
    </select>
    <select id="cb-model-sel" style="${s}">
      <option value="gemma3">gemma3 — local (Ollama)</option>
      <option value="gemma4">gemma4 — local (Ollama)</option>
      <option value="sonnet" selected>sonnet — premium, default (Claude API)</option>
      <option value="haiku">haiku — fast, premium (Claude API)</option>
      <option value="opus">opus — best quality (Claude API)</option>
    </select>
    <div style="display:flex;gap:6px;margin-bottom:6px">
      <select id="cb-level-sel" style="flex:1;padding:5px 6px;border:1px solid rgba(255,255,255,0.3);border-radius:5px;background:#fff;color:#2a2a2a;font-size:12px;font-family:system-ui,sans-serif">
        ${ye.map(C=>`<option value="${C}" ${C===l?"selected":""}>${C.charAt(0).toUpperCase()+C.slice(1)}</option>`).join("")}
      </select>
      <select id="cb-lang-sel" style="flex:1;padding:5px 6px;border:1px solid rgba(255,255,255,0.3);border-radius:5px;background:#fff;color:#2a2a2a;font-size:12px;font-family:system-ui,sans-serif">
        ${ve.map(C=>`<option value="${C.code}" ${C.code===n?"selected":""}>${C.label}</option>`).join("")}
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
  `,b.insertAdjacentElement("afterend",p);const c=p.querySelector("#cb-target-sel"),h=p.querySelector("#cb-model-sel"),_=p.querySelector("#cb-level-sel"),f=p.querySelector("#cb-lang-sel"),v=p.querySelector("#cb-skip-cache"),u=p.querySelector("#cb-gen-btn"),d=p.querySelector("#cb-pdf-btn"),k=p.querySelector("#cb-pdf-result"),x=p.querySelector("#cb-gen-log"),y=p.querySelector("#cb-gen-copy");function i(){e.dispatchEvent(new CustomEvent("cb:settings-change",{detail:{level:_.value,lang:f.value}}))}_.addEventListener("change",i),f.addEventListener("change",i),y.addEventListener("click",()=>{navigator.clipboard.writeText(x.textContent).then(()=>{y.textContent="Copied!",setTimeout(()=>{y.textContent="Copy"},1500)})});const m=`cb_gen_target_${a}`,g=(((M=t.__cb_RAW)==null?void 0:M.nodes)||[]).filter(C=>C.kind!=="primitive").sort((C,S)=>C.label.localeCompare(S.label)),E=sessionStorage.getItem(m),L=E&&g.some(C=>C.id===E)?E:o;g.forEach(C=>{const S=e.createElement("option");S.value=C.id,S.textContent=C.label,C.id===L&&(S.selected=!0),c.appendChild(S)}),c.value&&(u.disabled=!1,d.disabled=!1),c.addEventListener("change",()=>{c.value&&sessionStorage.setItem(m,c.value),u.disabled=!c.value,d.disabled=!c.value,d.textContent="PDF",d.style.background="#16a34a",k.style.display="none",k.innerHTML=""}),d.addEventListener("click",async()=>{const C=c.value;if(!C)return;const S=_.value,F=f.value;d.disabled=!0,d.textContent="Generating…",d.style.background="#ea580c";try{const I=`/api/pdf?domain=${encodeURIComponent(a)}&target=${encodeURIComponent(C)}&level=${encodeURIComponent(S)}&language=${encodeURIComponent(F)}`,O=await fetch(I),R=await O.json();if(!O.ok)throw new Error(R.detail||"PDF generation failed");const q=`/concept-book/domains/${a}/${R.file}`;d.textContent="PDF ✓",d.disabled=!1,k.innerHTML=`
        <a href="${q}" download
           style="flex:1;padding:6px 10px;background:#16a34a;color:#fff;border:none;border-radius:5px;font-size:12px;cursor:pointer;text-align:center;text-decoration:none;font-family:system-ui,sans-serif">
          ⬇ Download
        </a>
        <a href="${q}" target="_blank"
           style="flex:1;padding:6px 10px;background:#0369a1;color:#fff;border:none;border-radius:5px;font-size:12px;cursor:pointer;text-align:center;text-decoration:none;font-family:system-ui,sans-serif">
          ↗ Open
        </a>
      `,k.style.display="flex"}catch(I){d.textContent="Error",d.style.background="#dc2626",d.title=I.message,setTimeout(()=>{d.textContent="PDF",d.style.background="#16a34a",d.disabled=!1},3e3)}}),u.addEventListener("click",()=>{const C=c.value;if(!C)return;sessionStorage.setItem(m,C);const S=h.value,F=_.value,I=f.value,O=v.checked;u.disabled=!0,u.textContent="Generating…",u.style.background="#ea580c",x.style.display="block",y.style.display="block",x.textContent=`▶ target: ${C}  model: ${S}
`;const R=`/api/generate?domain=${encodeURIComponent(a)}&target=${encodeURIComponent(C)}&level=${encodeURIComponent(F)}&language=${encodeURIComponent(I)}&model=${encodeURIComponent(S)}${O?"&skip_cache=true":""}`,w=new t.EventSource(R);w.addEventListener("log",q=>{const{message:pe}=JSON.parse(q.data);x.textContent+=pe+`
`,x.scrollTop=x.scrollHeight}),w.addEventListener("done",()=>{w.close(),x.textContent+=`
✓ Done — reloading…`,setTimeout(()=>t.parent.location.reload(),1200)}),w.addEventListener("gen_error",q=>{w.close(),x.textContent+=`
✗ ${JSON.parse(q.data).message}`,u.disabled=!1,u.textContent="Retry",u.style.background="#dc2626"}),w.onerror=()=>{w.readyState!==t.EventSource.CLOSED&&(w.close(),x.textContent+=`
✗ API not reachable.
  Run: bash scripts/start-api.sh`,u.disabled=!1,u.textContent="Retry",u.style.background="#dc2626")}})}function Le(){return le()}const D={claude_cli:{label:"Claude CLI",models:[{value:"claude-sonnet-4-6",label:"Sonnet 4.6"},{value:"claude-haiku-4-5-20251001",label:"Haiku 4.5"},{value:"claude-opus-4-8",label:"Opus 4.8"}]},openrouter:{label:"OpenRouter",models:[{value:"anthropic/claude-sonnet-4-6",label:"Claude Sonnet 4.6"},{value:"anthropic/claude-haiku-4-5-20251001",label:"Claude Haiku 4.5"},{value:"anthropic/claude-opus-4-8",label:"Claude Opus 4.8"},{value:"google/gemini-2.5-pro",label:"Gemini 2.5 Pro"},{value:"google/gemini-2.5-flash",label:"Gemini 2.5 Flash"},{value:"google/gemini-3.5-flash",label:"Gemini 3.5 Flash"},{value:"openai/gpt-4.1",label:"GPT-4.1"},{value:"openai/gpt-5.4-mini",label:"GPT 5.4 Mini"},{value:"openai/o3-mini",label:"o3-mini"},{value:"deepseek/deepseek-r1",label:"DeepSeek R1"},{value:"meta-llama/llama-4-maverick",label:"Llama 4 Maverick"},{value:"z-ai/glm-5.2",label:"GLM 5.2"},{value:"qwen/qwen3.5-35b-a3b",label:"Qwen 3.5 35B"},{value:"qwen/qwen3.6-35b-a3b",label:"Qwen 3.6 35B"},{value:"nvidia/nemotron-3-ultra-550b-a55b:free",label:"Nemotron 3 Ultra 550B"},{value:"moonshotai/kimi-k2.6",label:"Kimi 2.6"}]},ollama:{label:"Ollama (local)",models:null}};async function W(t,e){const a=D[t.value];if(e.innerHTML="",!a)return;let o=a.models;if(t.value==="ollama"&&!o){try{const l=await fetch("/api/settings/ollama-models");l.ok&&(o=await l.json())}catch{}if(!o||o.length===0){const l=document.createElement("option");l.value="",l.textContent="(ollama not available)",e.appendChild(l);return}D.ollama.models=o}for(const l of o){const n=document.createElement("option");n.value=l.value,n.textContent=l.label,e.appendChild(n)}}function K(t){if(t===0)return"never expires";if(t<1)return`${Math.round(t*60)} min`;if(t===1)return"1 hour";if(t<24)return`${t} hours`;const e=t/24;return Number.isInteger(e)?`${e} day${e>1?"s":""}`:`${t} hours`}async function Se(t){t.innerHTML="",t.appendChild(P());const e=document.createElement("main");e.className="cb-settings",e.innerHTML=`
    <h2>Settings</h2>
    <section class="cb-settings__section">
      <div class="cb-settings__section-title">SPL Adapter and Model Configuration</div>
      <div class="cb-settings__pair">
        <div class="cb-settings__field">
          <label class="cb-settings__label">Adapter</label>
          <select id="cb-adapter" class="cb-settings__select">
            ${Object.entries(D).map(([u,d])=>`<option value="${u}">${d.label}</option>`).join("")}
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
  `,t.appendChild(e);const a=e.querySelector("#cb-adapter"),o=e.querySelector("#cb-model"),l=e.querySelector("#cb-settings-save"),n=e.querySelector("#cb-settings-status"),r=e.querySelector("#cb-current-llm");a.addEventListener("change",()=>W(a,o)),await W(a,o);const b=e.querySelector("#cb-while-max-iter"),s=e.querySelector("#cb-max-llm-calls"),p=e.querySelector("#cb-spl-limits-save"),c=e.querySelector("#cb-spl-limits-status"),h=e.querySelector("#cb-cache-ttl"),_=e.querySelector("#cb-cache-ttl-hint"),f=e.querySelector("#cb-cache-save"),v=e.querySelector("#cb-cache-status");h.addEventListener("input",()=>{const u=Number(h.value);_.textContent=isNaN(u)||u<0?"":K(u)});try{const u=await fetch("/api/settings");if(u.ok){const d=await u.json();r.textContent=`Current: ${d.llm}`;const[k,...x]=d.llm.split(":"),y=x.join(":");D[k]&&(a.value=k,await W(a,o),[...o.options].some(m=>m.value===y)&&(o.value=y)),d.spl_while_max_iter&&(b.value=d.spl_while_max_iter),d.spl_max_llm_calls&&(s.value=d.spl_max_llm_calls);const i=Math.round(d.compare_cache_ttl/3600);h.value=i,_.textContent=K(i)}}catch{n.textContent="API not reachable — run the backend to change settings",n.style.color="#dc2626"}l.addEventListener("click",async()=>{const u=`${a.value}:${o.value}`;try{(await fetch("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({llm:u})})).ok?(r.textContent=`Current: ${u}`,n.textContent="Saved",n.style.color="#16a34a"):(n.textContent="Save failed",n.style.color="#dc2626")}catch{n.textContent="API not reachable",n.style.color="#dc2626"}setTimeout(()=>{n.textContent=""},3e3)}),p.addEventListener("click",async()=>{const u=Number(b.value),d=Number(s.value);if(!Number.isInteger(u)||u<1||!Number.isInteger(d)||d<1){c.textContent="Enter valid integers ≥ 1",c.style.color="#dc2626",setTimeout(()=>{c.textContent=""},3e3);return}try{(await fetch("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({spl_while_max_iter:u,spl_max_llm_calls:d})})).ok?(c.textContent="Saved",c.style.color="#16a34a"):(c.textContent="Save failed",c.style.color="#dc2626")}catch{c.textContent="API not reachable",c.style.color="#dc2626"}setTimeout(()=>{c.textContent=""},3e3)}),f.addEventListener("click",async()=>{const u=Number(h.value);if(isNaN(u)||u<0){v.textContent="Enter a valid number ≥ 0",v.style.color="#dc2626",setTimeout(()=>{v.textContent=""},3e3);return}const d=Math.round(u*3600);try{(await fetch("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({compare_cache_ttl:d})})).ok?(_.textContent=K(u),v.textContent="Saved",v.style.color="#16a34a"):(v.textContent="Save failed",v.style.color="#dc2626")}catch{v.textContent="API not reachable",v.style.color="#dc2626"}setTimeout(()=>{v.textContent=""},3e3)})}async function re(t,{id:e}={}){t.innerHTML="";const a=Symbol();t._renderKey=a;let o=null,l=[];try{l=await G(),e&&(o=l.find(f=>f.id===e)??{id:e,name:e,has_book:!1,books:[],generated_concepts:[],capstone:null})}catch{}if(t._renderKey!==a)return;const n=document.createElement("div");n.style.cssText="display:flex;flex-direction:column;height:100vh;overflow:hidden",t.appendChild(n),n.appendChild(P({domainName:(o==null?void 0:o.name)||""}));const r=document.createElement("div");r.className="cb-domain-picker-bar";const b=document.createElement("span");b.className="cb-domain-picker-bar__label",b.textContent="Domain",r.appendChild(b);const s=document.createElement("select");s.className="cb-domain-picker-bar__select";const p=document.createElement("option");if(p.value="",p.textContent="Select domain…",s.appendChild(p),[...l].sort((f,v)=>f.id.localeCompare(v.id,"zh")).forEach(f=>{const v=document.createElement("option");v.value=f.id,v.textContent=f.name||f.id,f.id===e&&(v.selected=!0),s.appendChild(v)}),s.addEventListener("change",()=>{s.value&&(window.location.hash=`/domain/${encodeURIComponent(s.value)}`)}),r.appendChild(s),n.appendChild(r),!e||!o)return;if(o.source){const f=document.createElement("div");f.className="cb-attribution",f.innerHTML=`Source: <a href="${o.source.url}" target="_blank">${o.source.title}</a> by ${o.source.authors} (${o.source.license}). ${o.source.attribution}`,n.appendChild(f)}const c=document.createElement("main");c.className="cb-domain";const h=o.default_level||"intro",_=Le();c.appendChild(_e(o,{level:h,lang:_})),n.appendChild(c)}function $e(t){t.innerHTML="",t.appendChild(P());const e=document.createElement("main");e.className="cb-about",e.innerHTML=`
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
  `,t.appendChild(e)}const we=["intro","core","college","research"],Te=[{value:"",label:"— default —"},{value:"gemma3",label:"gemma3 (Ollama)"},{value:"gemma4",label:"gemma4 (Ollama)"},{value:"sonnet",label:"sonnet (Claude)"},{value:"haiku",label:"haiku (Claude)"},{value:"opus",label:"opus (Claude)"}];function de(t){const e=t.match(/output\/([^.]+)\.([^/]+)\//);return e?{level:e[1],lang:e[2]}:{level:"college",lang:"en"}}function B(t){const e=t.match(/output\/[^/]+\/([^/]+)\/html\//);return e?e[1]:""}function Q(t){return t.replace(/^.*\//,"")}function Ne(t,e,a,o,l){const n=Q(e),r=l?`${l}/`:"";return`/concept-book/domains/${t}/output/${a}.${o}/${r}html/${n}`}const N=new Map;function Me(t,e){e.forEach(a=>{const o=`/concept-book/domains/${encodeURIComponent(t)}/${a.file}`;N.set(o,!0)})}function qe(){N.clear()}async function Ae(t){if(N.has(t))return N.get(t);try{const e=await fetch(t);if(!e.ok)return N.set(t,!1),!1;const a=await e.text(),o=a.includes("spl-credit")||a.includes("Generated by");return N.set(t,o),o}catch{return N.set(t,!1),!1}}function He(t,e,a,o){const l=decodeURIComponent(t).replace(/^(?:concept|book)_/,"").replace(/_/g," ").replace(/\.html$/,"");return`<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;padding:48px 40px;color:#374151;background:#fafafa;min-height:100vh">
    <h2 style="color:#1e3a5f;margin:0 0 16px;font-size:1.3rem">Content Not Available</h2>
    <p style="margin:0 0 12px;font-size:0.9rem;color:#6b7280">No page exists for this combination:</p>
    <div style="background:#fff;border:1px solid #e0e3e8;border-radius:8px;padding:16px 20px;margin-bottom:24px;display:inline-block">
      <div style="margin-bottom:6px"><span style="font-weight:600;color:#374151;min-width:80px;display:inline-block">Model:</span><span style="color:#2563eb">${e||"default"}</span></div>
      <div style="margin-bottom:6px"><span style="font-weight:600;color:#374151;min-width:80px;display:inline-block">Level:</span><span style="color:#2563eb">${o}</span></div>
      <div><span style="font-weight:600;color:#374151;min-width:80px;display:inline-block">Language:</span><span style="color:#2563eb">${a}</span></div>
    </div>
    <p style="color:#6b7280;font-size:0.88rem;line-height:1.6">Please generate the concept book for <strong style="color:#1e3a5f">${l}</strong> first via the Concept-Graph page.</p>
  </body></html>`}function J(t,e,a){const o=document.createElement("select");return o.className=a,t.forEach(({value:l,label:n})=>{const r=document.createElement("option");r.value=l,r.textContent=n,l===e&&(r.selected=!0),o.appendChild(r)}),o}function Ie(t,e,a,o){const l=document.createElement("div");l.className="cb-book-pane__controls";const n=J(Te,e.model,"cb-book-pane__select");n.title="Model",n.addEventListener("change",()=>a("model",n.value)),l.appendChild(n);const r=J(we.map(s=>({value:s,label:s.charAt(0).toUpperCase()+s.slice(1)})),e.level,"cb-book-pane__select");r.title="Level",r.addEventListener("change",()=>a("level",r.value)),l.appendChild(r);const b=J(se.map(s=>({value:s.code,label:s.label})),e.lang,"cb-book-pane__select");if(b.title="Language",b.addEventListener("change",()=>a("lang",b.value)),l.appendChild(b),o){const s=document.createElement("button");s.type="button",s.className="cb-book-pane__refresh",s.title="Refresh — re-check for content that just finished generating",s.textContent="🔄",s.addEventListener("click",o),l.appendChild(s)}return l}function Pe(t,e,{onConceptClick:a}){t.innerHTML="";try{const o=e.contentDocument,l=o==null?void 0:o.querySelector("nav.toc");if(!l){t.innerHTML='<div style="color:#90b4e8;font-size:11px;padding:4px 0">No table of contents for this page.</div>';return}const n=document.createElement("div");n.style.cssText="font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;color:#90b4e8;margin-bottom:14px;font-family:system-ui,sans-serif;font-weight:700",n.textContent="Contents",t.appendChild(n);const r=l.querySelector("ol");if(r){const s=document.createElement("ol");s.style.cssText="list-style:decimal inside;padding:0;margin:0;flex:1",r.querySelectorAll("li").forEach(p=>{const c=p.querySelector("a");if(!c)return;const h=p.classList.contains("toc-target"),_=document.createElement("li");_.style.cssText=`margin-bottom:7px;font-size:.85rem;line-height:1.4;font-family:system-ui,sans-serif${h?";font-weight:700":""}`;const f=document.createElement("a");f.textContent=c.textContent,f.href="#",f.style.cssText=`text-decoration:none;color:${h?"#fff":"#a8c8f0"}`,f.addEventListener("mouseover",()=>{f.style.color="#fff"}),f.addEventListener("mouseout",()=>{f.style.color=h?"#fff":"#a8c8f0"}),f.addEventListener("click",v=>{v.preventDefault(),a(c.getAttribute("href"))}),_.appendChild(f),s.appendChild(_)}),t.appendChild(s)}if(l.querySelector(".spl-credit")){const s=document.createElement("div");s.style.cssText="margin-top:auto;padding-top:14px;border-top:1px solid rgba(255,255,255,0.15);font-size:11px;color:#90b4e8;font-family:system-ui,sans-serif",s.textContent="Generated by SPL",t.appendChild(s)}}catch{}}function Oe(t){try{const e=t.contentDocument;if(!e)return;const a=e.createElement("style");a.textContent="nav.toc { display: none !important; } .page { grid-template-columns: 1fr !important; } h1.book-title + section > h2:first-child { display: none !important; }",e.head.appendChild(a)}catch{}}async function Re(){try{return(await G()).map(e=>e.id)}catch{return[]}}function ae(t,e){const a={};return t.forEach(o=>{a[e(o)]=(a[e(o)]||0)+1}),t.map(o=>{const l=e(o);if(a[l]<=1)return{...o,label:l};const{level:n,lang:r}=de(o.file);return{...o,label:`${l} [${n}.${r}, ${o.model||"legacy"}]`}})}async function je(t){try{const a=(await G()).find(n=>n.id===t)??{},o=ae((a.books||[]).map(n=>({file:n.file,model:n.model||B(n.file),target:n.target})),n=>n.target.replace(/_/g," ").trim()||n.target),l=ae((a.generated_concepts||[]).map(n=>({file:n.file,model:n.model||B(n.file),origLabel:n.label})),n=>n.origLabel);return Me(t,[...o,...l]),{books:o,concepts:l}}catch{return{books:[],concepts:[]}}}function ze(t,e){const a=document.createElement("nav");a.className="cb-book-nav";const o=document.createElement("div");o.className="cb-book-nav__title",o.textContent="Concept Books",a.appendChild(o);function l(x){const y=document.createElement("div");return y.className="cb-book-nav__label",y.textContent=x,y}a.appendChild(l("Domain"));const n=document.createElement("select");n.className="cb-book-nav__select",a.appendChild(n),a.appendChild(l("Model"));const r=document.createElement("select");r.className="cb-book-nav__select",r.innerHTML='<option value="">— all —</option>',a.appendChild(r),a.appendChild(l("TOC Index"));const b=document.createElement("select");b.className="cb-book-nav__select",a.appendChild(b),a.appendChild(l("Concept"));const s=document.createElement("select");s.className="cb-book-nav__select",a.appendChild(s);const p=document.createElement("button");p.textContent="Open",p.disabled=!0,p.className="cb-book-nav__open",a.appendChild(p);function c(){p.disabled=!n.value||!b.value&&!s.value}let h=[],_=[];function f(){const x=r.value,y=x?h.filter(m=>!m.model||m.model===x):h,i=x?_.filter(m=>!m.model||m.model===x):_;b.innerHTML='<option value="">Select book…</option>',s.innerHTML='<option value="">Select concept…</option>',y.forEach(m=>{const g=document.createElement("option");g.value=m.file,g.textContent=m.label,m.file===e&&(g.selected=!0),b.appendChild(g)}),i.forEach(m=>{const g=document.createElement("option");g.value=m.file,g.textContent=m.label,m.file===e&&(g.selected=!0),s.appendChild(g)}),c()}async function v(x){b.innerHTML='<option value="">Loading…</option>',s.innerHTML='<option value="">Loading…</option>',r.innerHTML='<option value="">Loading…</option>',c();const{books:y,concepts:i}=await je(x);h=y,_=i;const m=new Set;y.forEach(L=>{L.model&&m.add(L.model)}),i.forEach(L=>{L.model&&m.add(L.model)});const g=[...m].sort();r.innerHTML='<option value="">— all —</option>',g.forEach(L=>{const M=document.createElement("option");M.value=L,M.textContent=L,r.appendChild(M)});const E=e?B(e):"";E&&m.has(E)?r.value=E:m.has("sonnet")&&(r.value="sonnet"),f()}async function u(){n.innerHTML='<option value="">Loading…</option>',b.innerHTML='<option value="">—</option>',s.innerHTML='<option value="">—</option>',c();const x=await Re();n.innerHTML='<option value="">Select domain…</option>',[...x].sort((y,i)=>y.localeCompare(i,"zh")).forEach(y=>{const i=document.createElement("option");i.value=y,i.textContent=y,y===t&&(i.selected=!0),n.appendChild(i)}),n.value?await v(n.value):c()}n.addEventListener("change",()=>{n.value?v(n.value):(b.innerHTML='<option value="">—</option>',s.innerHTML='<option value="">—</option>',r.innerHTML='<option value="">— all —</option>',h=[],_=[],c())}),r.addEventListener("change",f),b.addEventListener("change",()=>{b.value&&(s.value=""),c()}),s.addEventListener("change",()=>{s.value&&(b.value=""),c()}),p.addEventListener("click",()=>{const x=b.value||s.value,y=n.value;x&&y&&(window.location.hash=`/book?domain=${encodeURIComponent(y)}&file=${encodeURIComponent(x)}`)});const d=document.createElement("div");d.style.cssText="border-top:1px solid rgba(255,255,255,0.15);margin:10px 0 8px;flex-shrink:0",a.appendChild(d);const k=document.createElement("div");return k.style.cssText="flex:1;overflow-y:auto;min-height:0;display:flex;flex-direction:column",k.innerHTML='<div style="color:#90b4e8;font-size:11px;padding:4px 0">Open a book to see contents.</div>',a.appendChild(k),a.tocSection=k,u(),a}function Ue(t,e){const{domain:a,file:o}=e||{};t.innerHTML="",t.style.cssText="",t.className="cb-book-page",t.appendChild(P());const l=document.createElement("div");l.style.cssText="display:flex;flex:1;overflow:hidden",t.appendChild(l);const n=ze(a||"",o||"");l.appendChild(n);const r=document.createElement("div");if(r.style.cssText="flex:1;display:flex;overflow:hidden;min-width:0",l.appendChild(r),!a||!o)return;const b=de(o);let s=o;const p={level:b.level,lang:b.lang,model:B(o)},c=document.createElement("div");c.style.cssText="flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0",r.appendChild(c),c.appendChild(Ie(null,p,(u,d)=>{p[u]=d,v()},()=>{qe(),v()}));const h=document.createElement("iframe");h.style.cssText="flex:1;width:100%;border:none;display:block",c.appendChild(h);let _=!1;const f=u=>{var d,k;if(u){if(u.startsWith("#")){try{(k=(d=h.contentDocument)==null?void 0:d.querySelector(u))==null||k.scrollIntoView({behavior:"smooth"})}catch{}return}s=s.replace(/[^/]+\.html$/,u),v()}};h.addEventListener("load",()=>{var d,k,x;if(_)return;try{const y=(k=(d=h.contentWindow)==null?void 0:d.location)==null?void 0:k.href;if(y&&!y.startsWith("about:")){const i=decodeURIComponent(y.replace(/.*\/html\//,""));i&&!i.includes("://")&&i!==Q(s)&&(s=s.replace(/[^/]+\.html$/,i))}}catch{}Oe(h);let u=!1;try{u=!!((x=h.contentDocument)!=null&&x.querySelector("nav.toc"))}catch{}u&&Pe(n.tocSection,h,{onConceptClick:f})});function v(){const u=Ne(a,s,p.level,p.lang,p.model);Ae(u).then(d=>{_=!d,d?h.src=u:(h.removeAttribute("src"),h.srcdoc=He(Q(s),p.model,p.lang,p.level))})}v()}const H=document.getElementById("app");A("/",()=>ge(H));A("/about",()=>$e(H));A("/settings",()=>Se(H));A("/domain/:id",t=>re(H,t));A("/graph",()=>re(H,{}));A("/book",t=>Ue(H,t));me();
