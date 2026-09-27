"use strict";
const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

let contextCount = 0;
class Param {
  constructor(){ this.value = 0; }
  setValueAtTime(v){ this.value=v; }
  exponentialRampToValueAtTime(v){ this.value=v; }
  setTargetAtTime(v){ this.value=v; }
  cancelScheduledValues(){}
}
class Node {
  constructor(){ this.gain=new Param(); this.frequency=new Param(); this.delayTime={value:0}; this.Q={value:0}; this.type=""; this.onended=null; }
  connect(dest){ return dest; }
  start(){}
  stop(){ if(this.onended) this.onended(); }
}
class FakeBuffer {
  constructor(len){ this.data=new Float32Array(len); }
  getChannelData(){ return this.data; }
}
class FakeAudioContext {
  constructor(){ contextCount++; this.state="running"; this.currentTime=0; this.sampleRate=44100; this.destination=new Node(); }
  createGain(){ return new Node(); }
  createDynamicsCompressor(){ const n=new Node(); n.threshold={value:0}; n.ratio={value:0}; return n; }
  createDelay(){ return new Node(); }
  createBuffer(_channels,len){ return new FakeBuffer(len); }
  createOscillator(){ return new Node(); }
  createBufferSource(){ return new Node(); }
  createBiquadFilter(){ return new Node(); }
  addEventListener(){}
  async resume(){ this.state="running"; }
  async suspend(){ this.state="suspended"; }
}

const attrs = new Map();
const button = {
  setAttribute(k,v){ attrs.set(k,String(v)); },
  getAttribute(k){ return attrs.get(k) || null; },
  querySelector(){ return {textContent:""}; },
};
const listeners = {};
const document = {
  hidden:false,
  getElementById(id){ return id === "music-toggle" ? button : null; },
  addEventListener(type,fn){ (listeners[type] ||= []).push(fn); },
};
const store = new Map();
const localStorage = { getItem:k=>store.get(k) ?? null, setItem:(k,v)=>store.set(k,String(v)) };
const flowHandlers = new Map();
const YSFlow = {
  on(name,fn){ const list=flowHandlers.get(name)||[]; list.push(fn); flowHandlers.set(name,list); },
  emit(name,payload){ for(const fn of flowHandlers.get(name)||[]) fn(payload); },
};

const context = {
  console,
  window:null,
  document,
  localStorage,
  MUSIC_KEY:"yellow-stadium-music-muted",
  AudioContext:FakeAudioContext,
  webkitAudioContext:undefined,
  YSRuntime:{battle:null},
  YSFlow,
  MOVES:{thunderbolt:{name:"THUNDERBOLT",type:"ELECTRIC",category:"SPECIAL",power:90}},
  SPECIES:{pikachu:{dex:25}},
  performance:{now:()=>Date.now()},
  SpeechSynthesisUtterance:function(){},
  setTimeout, clearTimeout, setInterval, clearInterval,
};
context.window=context;
context.window.AudioContext=FakeAudioContext;
context.window.YSRuntime=context.YSRuntime;
context.window.YSFlow=YSFlow;
context.window.MOVES=context.MOVES;
context.window.SPECIES=context.SPECIES;
context.window.speechSynthesis={cancel(){}};

const source=fs.readFileSync("src/audio/audio-manager.js","utf8");
vm.runInNewContext(source, context, {filename:"audio-manager.js"});

(async()=>{
  const A=context.window.AudioManager;
  assert(A, "AudioManager missing");
  assert.strictEqual(context.window.YSAudioV56, undefined);
  await A.start();
  await A.unlock();
  A.setScene("battle");
  A.move(context.MOVES.thunderbolt);
  A.event("critical");
  A.cry({id:"pikachu"});
  A.cheer(true);
  A.chime("pokecenter");
  assert.strictEqual(contextCount,1,"more than one AudioContext was created");
  assert.strictEqual(A.contextCount,1);
  await A.setMuted(true);
  assert.strictEqual(A.muted,true);
  await A.setMuted(false);
  assert.strictEqual(A.muted,false);
  assert.strictEqual(contextCount,1,"unmute created a second AudioContext");
  A.setScene("menu");
  A.stop();
  console.log("PASS: D1 AudioManager runtime smoke uses exactly one AudioContext");
})().catch(error=>{ console.error(error); process.exit(1); });
