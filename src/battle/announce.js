
function announce(text) {
  els.message.textContent = text;
  window.YSFlow?.emit("battle:announced", { text, battle });
}

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

