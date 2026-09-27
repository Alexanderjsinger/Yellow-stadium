
function showPokedex() {
  if (!save.onboardingComplete || battle) return;
  hideMainScreens();
  els["pokedex-screen"].hidden = false;
  setActiveNav("pokedex-tab");
  renderPokedex();
}

function renderPokedex() {
  els["seen-count"].textContent = save.seen.length;
  const caughtSpecies = save.caughtSpecies || save.owned;
  els["caught-count"].textContent = caughtSpecies.length;
  els["pokedex-grid"].innerHTML = "";
  Object.entries(SPECIES).sort((a, b) => a[1].dex - b[1].dex).forEach(([id, mon]) => {
    const seen = save.seen.includes(id);
    const caught = caughtSpecies.includes(id);
    const entry = document.createElement("button");
    entry.type = "button";
    entry.className = `dex-entry ${caught ? "caught" : seen ? "seen" : "unseen"}`;
    entry.dataset.pokemonId = id;
    entry.disabled = !seen;
    entry.setAttribute("aria-label", seen ? `View Pokédex notes for ${mon.name}` : `Pokédex entry ${mon.dex}, unknown`);
    entry.innerHTML = `<img alt=""><strong>#${String(mon.dex).padStart(3,"0")} ${seen ? mon.name : "?????"}</strong><small>${caught ? "CAUGHT" : seen ? "SEEN" : "UNKNOWN"}</small>`;
    setSprite(entry.querySelector("img"), id);
    if (seen) entry.addEventListener("click", () => window.PokemonDetails?.inspect(id));
    els["pokedex-grid"].appendChild(entry);
  });
}

