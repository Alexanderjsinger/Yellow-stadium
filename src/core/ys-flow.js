
"use strict";
(() => {
  const handlers = new Map();
  function on(event, handler, priority = 0) {
    if (typeof handler !== "function") return () => {};
    const list = handlers.get(event) || [];
    const entry = { handler, priority };
    list.push(entry);
    list.sort((a, b) => b.priority - a.priority);
    handlers.set(event, list);
    return () => {
      const current = handlers.get(event) || [];
      const index = current.indexOf(entry);
      if (index >= 0) current.splice(index, 1);
    };
  }
  function emit(event, payload = {}) {
    const list = [...(handlers.get(event) || [])];
    for (const { handler } of list) {
      try { handler(payload); }
      catch (error) { console.warn(`Yellow Stadium lifecycle hook failed: ${event}`, error); }
    }
  }
  async function emitAsync(event, payload = {}) {
    const list = [...(handlers.get(event) || [])];
    for (const { handler } of list) {
      try { await handler(payload); }
      catch (error) { console.warn(`Yellow Stadium async lifecycle hook failed: ${event}`, error); }
    }
  }
  window.YSFlow = Object.freeze({ on, emit, emitAsync });
})();

