
function levelFor(ref) {
  const id = speciesIdFor(ref);
  return levelFromExperience(id, experienceFor(ref));
}

function unlocked(id) {
  return save.owned.includes(id);
}

function renderRecord() {
  els.wins.textContent = save.wins;
  els.streak.textContent = save.streak;
  els.coins.textContent = save.coins.toLocaleString();
  els["shop-coins"].textContent = save.coins.toLocaleString();
  els["collection-count"].textContent = save.pokemon.length;
  if (els["trainer-name"]) els["trainer-name"].textContent = (save.playerProfile?.first || "ROOKIE").toUpperCase();
}

function renderDifficulty() {
  document.querySelectorAll('input[name="difficulty"]').forEach(input => {
    input.checked = input.value === save.difficulty;
  });
}

function calculatedStats(id, level) {
  const mon = SPECIES[id];
  const keys = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"];
  return Object.fromEntries(mon.stats.map((base, index) => {
    const ev = mon.evs[index] || 0;
    if (index === 0) return [keys[index], Math.floor(((2 * base + 31 + Math.floor(ev / 4)) * level) / 100) + level + 10];
    const raw = Math.floor(((2 * base + 31 + Math.floor(ev / 4)) * level) / 100) + 5;
    const nature = mon.nature[1] === keys[index] ? 1.1 : mon.nature[2] === keys[index] ? .9 : 1;
    return [keys[index], Math.floor(raw * nature)];
  }));
}

