"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "../..");

class FakeClassList {
  constructor(){ this.values = new Set(); }
  add(...names){ names.filter(Boolean).forEach(name => this.values.add(name)); }
  remove(...names){ names.forEach(name => this.values.delete(name)); }
  contains(name){ return this.values.has(name); }
  toggle(name, force){
    if (force === true) { this.values.add(name); return true; }
    if (force === false) { this.values.delete(name); return false; }
    if (this.values.has(name)) { this.values.delete(name); return false; }
    this.values.add(name); return true;
  }
}

class FakeElement {
  constructor(id = "", ownerDocument = null){
    this.id = id;
    this.ownerDocument = ownerDocument;
    this.hidden = false;
    this.disabled = false;
    this.checked = false;
    this.value = "";
    this.type = "";
    this.title = "";
    this.textContent = "";
    this._innerHTML = "";
    this.dataset = {};
    this.children = [];
    this.parentElement = null;
    this.className = "";
    this.classList = new FakeClassList();
    this.attributes = new Map();
    this.listeners = new Map();
    this.style = {
      width: "", background: "", left: "", top: "", display: "", gridTemplateColumns: "",
      setProperty: (key, value) => { this.style[key] = value; },
      removeProperty: key => { delete this.style[key]; },
    };
  }
  set innerHTML(value){ this._innerHTML = String(value ?? ""); }
  get innerHTML(){ return this._innerHTML; }
  appendChild(child){ if (child) { child.parentElement = this; this.children.push(child); } return child; }
  append(...children){ children.forEach(child => this.appendChild(child)); }
  prepend(...children){ children.reverse().forEach(child => { if (child) { child.parentElement=this; this.children.unshift(child); } }); }
  replaceChildren(...children){ this.children = []; this.append(...children); }
  replaceWith(node){ if (!this.parentElement) return; const i=this.parentElement.children.indexOf(this); if(i>=0){this.parentElement.children[i]=node;node.parentElement=this.parentElement;} }
  insertBefore(node, before){
    node.parentElement = this;
    const i = before ? this.children.indexOf(before) : -1;
    if (i >= 0) this.children.splice(i, 0, node); else this.children.push(node);
    return node;
  }
  remove(){ if(!this.parentElement)return; const i=this.parentElement.children.indexOf(this); if(i>=0)this.parentElement.children.splice(i,1); this.parentElement=null; }
  cloneNode(){ const copy=new FakeElement(this.id,this.ownerDocument); copy.hidden=this.hidden; copy.className=this.className; copy.dataset={...this.dataset}; copy._innerHTML=this._innerHTML; return copy; }
  addEventListener(type, fn){ const list=this.listeners.get(type)||[]; list.push(fn); this.listeners.set(type,list); }
  removeEventListener(type, fn){ const list=this.listeners.get(type)||[]; this.listeners.set(type,list.filter(x=>x!==fn)); }
  dispatchEvent(event){ for(const fn of this.listeners.get(event?.type)||[]) fn.call(this,event); return true; }
  click(){ this.dispatchEvent({type:"click",target:this,currentTarget:this,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}); if(typeof this.onclick==="function") this.onclick({target:this,currentTarget:this,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}); }
  setAttribute(key, value){ this.attributes.set(key,String(value)); if(key==="id"){this.id=String(value); this.ownerDocument?._register(this);} }
  getAttribute(key){ return this.attributes.get(key) ?? null; }
  removeAttribute(key){ this.attributes.delete(key); }
  querySelector(selector){
    if (selector?.startsWith("#")) return this.ownerDocument?.getElementById(selector.slice(1)) || null;
    if (selector === "img") return new FakeElement("", this.ownerDocument);
    if (selector === "button") return this.children.find(x => x.type === "button") || new FakeElement("", this.ownerDocument);
    if (selector?.includes("[data-companion-id]")) return null;
    return new FakeElement("", this.ownerDocument);
  }
  querySelectorAll(){ return []; }
  closest(){ return this; }
  focus(){}
  scrollIntoView(){}
}

class FakeDocument {
  constructor(){
    this.elements = new Map();
    this.listeners = new Map();
    this.hidden = false;
    this.readyState = "complete";
    this.body = new FakeElement("body", this);
    this.documentElement = new FakeElement("html", this);
    this._primeTemplateIds();
  }
  _primeTemplateIds(){
    const template = fs.readFileSync(path.join(ROOT, "src/template.html"), "utf8");
    for (const match of template.matchAll(/\bid=["']([^"']+)["']/g)) this.getElementById(match[1]);
    for (const id of ["pokecenter-screen","pc-ball-table","pc-start","pc-timing-stage","pc-back","pc-heal-fill","pc-meter-label","pc-target","pc-perfect","pc-pulse","pc-rating","pc-attempts","pc-machine-readout","pc-game","pc-status","pc-prompt","pc-footer-copy","pc-greeting","pc-copy","app-content","kanto-markers"]) this.getElementById(id);
  }
  _register(el){ if(el?.id) this.elements.set(el.id,el); return el; }
  createElement(){ return new FakeElement("",this); }
  createDocumentFragment(){ return new FakeElement("",this); }
  getElementById(id){ if(!this.elements.has(id)) this.elements.set(id,new FakeElement(id,this)); return this.elements.get(id); }
  querySelectorAll(selector){
    if(selector === "[id]") return [...this.elements.values()];
    if(selector?.includes('input[name="difficulty"]')) return [];
    return [];
  }
  querySelector(selector){ if(selector?.startsWith("#")) return this.getElementById(selector.slice(1)); return new FakeElement("",this); }
  addEventListener(type,fn){ const list=this.listeners.get(type)||[]; list.push(fn); this.listeners.set(type,list); }
  removeEventListener(type,fn){ const list=this.listeners.get(type)||[]; this.listeners.set(type,list.filter(x=>x!==fn)); }
}

function createStorage(initial = {}){
  const store = new Map(Object.entries(initial).map(([k,v]) => [k,String(v)]));
  return {
    getItem:k => store.has(k) ? store.get(k) : null,
    setItem:(k,v) => store.set(k,String(v)),
    removeItem:k => store.delete(k),
    clear:()=>store.clear(),
    dump:()=>Object.fromEntries(store),
  };
}

function createHarness({ seed = 0x5eed1234, storage = {} } = {}){
  const document = new FakeDocument();
  const localStorage = createStorage(storage);
  const sandbox = {
    console,
    document,
    localStorage,
    navigator:{ vibrate(){ return true; }, storage:{persist:async()=>true} },
    location:{reload(){}},
    performance:{now:()=>1000},
    requestAnimationFrame:()=>1,
    cancelAnimationFrame(){},
    setTimeout:(fn)=>{ if(typeof fn==="function") fn(); return 1; },
    clearTimeout(){},
    setInterval:()=>1,
    clearInterval(){},
    queueMicrotask:fn=>fn(),
    confirm:()=>true,
    Blob:class {},
    URL:{createObjectURL:()=>"blob:test",revokeObjectURL(){}},
    Image:class { set src(_v){ if(this.onload)this.onload(); } },
    SpeechSynthesisUtterance:function(){},
  };
  sandbox.window = sandbox;
  sandbox.window.scrollTo = ()=>{};
  sandbox.window.matchMedia = ()=>({matches:false,addEventListener(){},removeEventListener(){}});
  sandbox.window.speechSynthesis = {cancel(){},speak(){}};
  const context = vm.createContext(sandbox);
  vm.runInContext(`
    let __ysTestSeed = ${Number(seed) >>> 0};
    function __setSeed(value){ __ysTestSeed = (Number(value) >>> 0) || 1; }
    Math.random = function(){
      __ysTestSeed |= 0;
      __ysTestSeed = (__ysTestSeed + 0x6D2B79F5) | 0;
      let t = __ysTestSeed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  `, context);
  return {
    context, document, localStorage,
    load(rel){ const source=fs.readFileSync(path.join(ROOT,rel),"utf8"); return vm.runInContext(source,context,{filename:rel}); },
    run(code){ return vm.runInContext(code,context); },
    json(code){ return JSON.parse(vm.runInContext(`JSON.stringify(${code})`,context)); },
    setSeed(value){ vm.runInContext(`__setSeed(${Number(value) >>> 0})`,context); },
  };
}

function loadCore(h){
  [
    "src/data/gen1-species.js",
    "src/data/moves.js",
    "src/data/evolution-stones.js",
    "src/core/ys-flow.js",
    "src/core/constants.js",
    "src/core/pokemon-records.js",
    "src/core/save.js",
    "src/core/runtime-state.js",
    "src/core/progression.js",
  ].forEach(file => h.load(file));
  h.run(`
    function hideMainScreens(){}
    function setActiveNav(){}
    function setSprite(){}
    function spriteUrl(id){ return 'assets/'+id+'.png'; }
    function renderApp(){}
    function showCollection(){}
    function announce(text){ window.__announcements ||= []; window.__announcements.push(String(text)); }
    function delay(){ return Promise.resolve(); }
    function animateAttack(){}
    function animateHit(){}
    function updateBattleUI(){}
    function renderPostgame(){}
    window.AudioManager = {setScene(){},unlock(){return Promise.resolve(true)},chime(){}};
    window.BattlePresentationDirector = {ready(){}};
  `);
  return h;
}

module.exports = { ROOT, FakeDocument, FakeElement, createHarness, loadCore };
