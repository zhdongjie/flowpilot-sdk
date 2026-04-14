(function(g,h){typeof exports=="object"&&typeof module<"u"?module.exports=h():typeof define=="function"&&define.amd?define(h):(g=typeof globalThis<"u"?globalThis:g||self,g.FlowPilot=h())})(this,function(){"use strict";const g=(t,e)=>t.findIndex(n=>n.step===e),h=(t,e)=>!t||!e?!0:Object.keys(t).every(n=>e[n]===t[n]),H=(t,e={})=>{const n=t.steps||[];if(!n.length)return null;if(typeof e.currentStep=="number"){const r=g(n,e.currentStep);if(r>=0&&r+1<n.length){for(let l=r+1;l<n.length;l+=1){const a=n[l];if(h(a.state,e.state))return a}return null}return null}if(e.currentPage){const r=n.find(l=>l.page===e.currentPage&&h(l.state,e.state));if(r)return r}return n.find(r=>h(r.state,e.state))||n[0]||null},C=t=>t?typeof t=="string"?{selector:t,fallback:[],pages:[]}:{selector:t.selector||"",fallback:t.fallback||[],pages:t.pages||[]}:{selector:"",fallback:[],pages:[]},P=(t,e)=>{if(!t)return[];const n=C(e?e[t]:null),i=[];n.selector&&i.push(n.selector),Array.isArray(n.fallback)&&n.fallback.forEach(l=>i.push(l));const r=`[data-guide-id="${t}"]`;return i.includes(r)||i.push(r),i.filter(Boolean)},F=(t,e)=>{const n=C(e?e[t]:null);return Array.isArray(n.pages)?n.pages:[]},N=(t,e,n)=>{const i=P(t,e),r=F(t,e);if(r.length&&n&&!r.includes(n))return{element:null,selectors:i};for(const l of i){const a=document.querySelector(l);if(a)return{element:a,selectors:i}}return{element:null,selectors:i}},I=()=>{const t=document.getElementById("flowpilot-root");if(t&&t.shadowRoot)return t.shadowRoot;const e=document.createElement("div");return e.id="flowpilot-root",document.body.appendChild(e),e.attachShadow({mode:"open"})},W=t=>{const e=document.createElement("div");e.className="fp-highlight",e.style.display="none",t.appendChild(e);const n=document.createElement("div"),i=document.createElement("div"),r=document.createElement("div"),l=document.createElement("div");return[n,i,r,l].forEach(s=>{s.className="fp-mask-piece",s.style.display="none",t.appendChild(s)}),{update:s=>{if(!s||s.width<=1||s.height<=1){e.style.display="none",[n,i,r,l].forEach(b=>{b.style.display="none"});return}const c=8,d=Math.max(s.top-c,0),u=Math.max(s.left-c,0),p=Math.min(s.left+s.width+c,window.innerWidth),f=Math.min(s.top+s.height+c,window.innerHeight),w=Math.max(f-d,0);e.style.display="block",e.style.top=`${d}px`,e.style.left=`${u}px`,e.style.width=`${p-u}px`,e.style.height=`${w}px`,n.style.display="block",n.style.top="0px",n.style.left="0px",n.style.width=`${window.innerWidth}px`,n.style.height=`${d}px`,l.style.display="block",l.style.top=`${f}px`,l.style.left="0px",l.style.width=`${window.innerWidth}px`,l.style.height=`${window.innerHeight-f}px`,i.style.display="block",i.style.top=`${d}px`,i.style.left="0px",i.style.width=`${u}px`,i.style.height=`${w}px`,r.style.display="block",r.style.top=`${d}px`,r.style.left=`${p}px`,r.style.width=`${window.innerWidth-p}px`,r.style.height=`${w}px`}}},A=t=>{const e=document.createElement("div");return e.className="fp-tooltip",e.style.display="none",t.appendChild(e),{update:(i,r)=>{if(!i||!r.message){e.style.display="none",e.innerHTML="";return}e.style.display="block";const a=i.bottom+12,s=window.innerWidth-300,c=Math.max(12,Math.min(i.left,s)),d=a+120>window.innerHeight?Math.max(12,i.top-80):a;e.style.top=`${d}px`,e.style.left=`${c}px`,e.innerHTML="";const u=document.createElement("div");if(u.className="fp-tooltip-title",u.textContent=r.message||"",e.appendChild(u),r.reason){const p=document.createElement("div");p.className="fp-tooltip-reason",p.textContent=r.reason,e.appendChild(p)}if(r.showNext&&r.onNext){const p=document.createElement("button");p.className="fp-tooltip-action",p.type="button",p.textContent="我已填写，继续",p.addEventListener("click",r.onNext,{once:!0}),e.appendChild(p)}}}},D=`
:host { all: initial; }
* { box-sizing: border-box; font-family: "Noto Sans SC", sans-serif; }
.fp-highlight {
  position: fixed;
  border: 2px solid #f1b256;
  border-radius: 12px;
  box-shadow: 0 0 0 6px rgba(241, 178, 86, 0.22);
  pointer-events: none;
  z-index: 9999;
  display: none;
}
.fp-mask-piece {
  position: fixed;
  background: rgba(12, 18, 28, 0.5);
  border-radius: 0;
  pointer-events: none;
  z-index: 9998;
  display: none;
}
.fp-tooltip {
  position: fixed;
  background: #0f1b2b;
  color: #f7f9fc;
  padding: 12px 14px;
  border-radius: 12px;
  max-width: 280px;
  font-size: 12px;
  line-height: 1.5;
  pointer-events: auto;
  z-index: 10000;
  display: none;
}
.fp-tooltip-title { font-weight: 600; margin-bottom: 6px; }
.fp-tooltip-reason { opacity: 0.8; margin-bottom: 8px; }
.fp-tooltip-action {
  border: none;
  background: #f1b256;
  color: #1b1f23;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
}

.fp-chat { position: fixed; right: 24px; bottom: 24px; z-index: 10001; }
.fp-chat-fab {
  border: none;
  background: #0c5b4c;
  color: #fff;
  border-radius: 999px;
  padding: 10px 16px;
  cursor: pointer;
}
.fp-chat-panel {
  margin-top: 8px;
  background: #fff;
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 10px 24px rgba(12, 24, 40, 0.2);
  display: grid;
  gap: 8px;
  width: 400px;
}
.fp-chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #1b1f23;
}
.fp-chat-header span {
  color: #5b6574;
  font-size: 11px;
}
.fp-chat-body {
  background: #f6f7fb;
  border-radius: 10px;
  padding: 8px;
  height: 260px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.fp-chat-bubble {
  background: #fff;
  padding: 6px 8px;
  border-radius: 8px;
  font-size: 12px;
  color: #1b1f23;
  border: 1px solid #e6eaf0;
  max-width: 75%;
  width: fit-content;
  line-height: 1.4;
  word-break: break-word;
}
.fp-chat-bubble.user {
  background: #0c5b4c;
  color: #fff;
  border-color: transparent;
  align-self: flex-end;
}
.fp-chat-input-row {
  display: flex;
  gap: 6px;
}
.fp-chat-input {
  border: 1px solid #dfe4ee;
  border-radius: 8px;
  padding: 8px;
  font-size: 12px;
  flex: 1;
}
.fp-chat-send {
  border: none;
  background: #0c5b4c;
  color: #fff;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
}
`;class R{constructor(e){this.root=e;const n=document.createElement("style");n.textContent=D,this.root.appendChild(n),this.highlight=W(this.root),this.tooltip=A(this.root),this.highlight.update(null),this.tooltip.update(null,{message:"",reason:""})}render(e,n,i){if(!n){this.highlight.update(null),this.tooltip.update(null,{message:"",reason:""});return}const r=n.getBoundingClientRect();this.highlight.update(r);const l=!!(e.form&&e.form.length);this.tooltip.update(r,{message:e.action||"",reason:e.desc||"",showNext:l,onNext:i})}clear(){this.highlight.update(null),this.tooltip.update(null,{message:"",reason:""})}}const B=(t,e)=>{const n=document.createElement("div");n.className="fp-chat",t.appendChild(n);const i=document.createElement("button");i.className="fp-chat-fab",i.textContent="在线客服",n.appendChild(i);const r=document.createElement("div");r.className="fp-chat-panel",r.style.display="none",n.appendChild(r);const l=document.createElement("div");l.className="fp-chat-header",l.innerHTML="<strong>智能客服</strong><span>插件引导助手</span>",r.appendChild(l);const a=document.createElement("div");a.className="fp-chat-body",r.appendChild(a);const s=document.createElement("div");s.className="fp-chat-input-row",r.appendChild(s);const c=document.createElement("input");c.className="fp-chat-input",c.placeholder="例如：我要开卡",s.appendChild(c);const d=document.createElement("button");d.className="fp-chat-send",d.textContent="发送",s.appendChild(d);const u=(f,w)=>{const b=document.createElement("div");b.className=`fp-chat-bubble ${f}`,b.textContent=w,a.appendChild(b),a.scrollTop=a.scrollHeight},p=()=>{r.style.display=r.style.display==="none"?"block":"none"};return i.addEventListener("click",p),d.addEventListener("click",()=>{const f=c.value.trim();f&&(c.value="",u("user",f),e.onSend(f))}),{addMessage:u,panel:r}},_="0.1.0",E="__FLOWPILOT__",o={config:null,runtime:null,currentStep:null,currentIntent:"",currentStepData:null,currentElement:null,currentTarget:null,clickHandler:null,chat:null,initialized:!1},$=t=>{if(!o.config)return null;const e=Array.isArray(o.config.workflow)?o.config.workflow:[o.config.workflow];return t?e.find(n=>n.id===t)||e[0]||null:e[0]||null},k=()=>{var t;return(t=o.config)!=null&&t.getCurrentPage?o.config.getCurrentPage():window.location.pathname||""},O=()=>{var t;return(t=o.config)!=null&&t.getState?o.config.getState()||{}:{}},z=(...t)=>{var e;(e=o.config)!=null&&e.debug&&console.log("[FlowPilot]",...t)},m=t=>{var n,i;const e=t instanceof Error?t:new Error(String(t));console.error("[FlowPilot]",e),(i=(n=o.config)==null?void 0:n.onError)==null||i.call(n,e)},v=()=>{o.currentTarget&&o.clickHandler&&o.currentTarget.removeEventListener("click",o.clickHandler),o.currentTarget=null,o.clickHandler=null},y=()=>{if(!o.runtime||!o.config||!o.currentStepData)return;const{element:t}=N(o.currentStepData.highlight,o.config.mapping,k());o.currentElement=t,o.runtime.render(o.currentStepData,t,()=>{var e;return x(((e=o.currentStepData)==null?void 0:e.step)??null)}),L(o.currentStepData,t)},L=(t,e)=>{v();const n=!!(t.form&&t.form.length);if(!e||n)return;const i=()=>{x(t.step)};e.addEventListener("click",i,{once:!0}),o.currentTarget=e,o.clickHandler=i},x=t=>{var a,s,c,d;if(!o.config||!o.runtime)return;const e=$(o.currentIntent);if(!e){m(new Error("Workflow not found"));return}if(!e.steps||e.steps.length===0){m(new Error("Workflow has no steps"));return}if(typeof t=="number"&&!e.steps.some(u=>u.step===t)){m(new Error(`Step ${t} not found in workflow`));return}const n=H(e,{currentStep:t,currentPage:k(),state:O()}),i=o.currentStep;if(o.currentStep=n?n.step:null,o.currentStepData=n,!n){v(),o.currentElement=null,o.runtime.clear(),o.chat&&i!==null&&o.chat.addMessage("assistant","✅ 已完成"),(s=(a=o.config).onFinish)==null||s.call(a);return}const{element:r,selectors:l}=N(n.highlight,o.config.mapping,k());if(r||m(new Error(`Element not found for "${n.highlight}". Tried selectors: ${l.join(", ")}`)),o.currentElement=r,o.runtime.render(n,r,()=>x(n.step)),L(n,r),o.chat&&i!==n.step){const u=n.action||n.desc||"请继续完成流程。";o.chat.addMessage("assistant",u)}(d=(c=o.config).onStepChange)==null||d.call(c,n),z("step change",n)},j=t=>{if(typeof window<"u"&&window[E]){console.warn("[FlowPilot] already initialized on this page.");return}if(o.initialized){console.warn("[FlowPilot] init has already been called.");return}o.config=t;const e=I();if(o.runtime=new R(e),o.chat=B(e,{onSend:n=>S(n,!0)}),o.initialized||(window.addEventListener("scroll",y,!0),window.addEventListener("resize",y),o.initialized=!0,window[E]=!0),o.config.debug&&z("init",t),o.config.autoStart){const n=$();n?S(n.id):m(new Error("Workflow not found for autoStart"))}},S=(t,e=!1)=>{o.currentIntent=t,!e&&o.chat&&o.chat.addMessage("user",t),x(null)},G=()=>x(o.currentStep),T=()=>{var t;v(),o.currentStep=null,o.currentStepData=null,o.currentElement=null,o.currentIntent="",(t=o.runtime)==null||t.clear()},M={init:j,start:S,next:G,reset:T,destroy:()=>{T(),o.runtime&&o.runtime.clear(),o.initialized&&(window.removeEventListener("scroll",y,!0),window.removeEventListener("resize",y));const t=document.getElementById("flowpilot-root");t&&t.parentNode&&t.parentNode.removeChild(t),typeof window<"u"&&delete window[E],o.config=null,o.runtime=null,o.chat=null,o.initialized=!1},version:_};return typeof window<"u"&&(window.FlowPilot=M),M});
