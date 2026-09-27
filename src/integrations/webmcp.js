
function registerAgentControls() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const ids = Object.keys(SPECIES);
  try {
    void Promise.resolve(context.registerTool({
      name: "select_owned_team",
      title: "Select owned team",
      description: "Select exactly three Pokémon from the player's party.",
      inputSchema: {
        type: "object",
        properties: { pokemon: { type: "array", items: { type: "string", enum: ids }, minItems: 3, maxItems: 3, uniqueItems: true } },
        required: ["pokemon"],
        additionalProperties: false
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const picks = input?.pokemon;
        if (!Array.isArray(picks) || picks.length !== 3 || new Set(picks).size !== 3) throw new Error("Choose exactly three different Pokémon.");
        if (picks.some(id => !SPECIES[id] || !unlocked(id))) throw new Error("One or more selected Pokémon are not owned.");
        if (battle) throw new Error("A match is already in progress.");
        selected = picks.map(id => save.pokemon.find(mon => mon.speciesId === id)?.uid).filter(Boolean);
        selectionLimit = 3;
        save.activePartyInstanceIds = [...selected];
        writeSave();
        renderRoster();
        window.PartyTray?.render();
        return { selected: selected.map(pokemonNameFor), ready: true };
      }
    })).catch(() => {});
    void Promise.resolve(context.registerTool({
      name: "set_battle_difficulty",
      title: "Set battle difficulty",
      description: "Set the AI difficulty for the next stadium match.",
      inputSchema: {
        type: "object",
        properties: { difficulty: { type: "string", enum: ["casual", "stadium", "master"] } },
        required: ["difficulty"],
        additionalProperties: false
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (battle) throw new Error("Difficulty cannot change during a match.");
        if (!DIFFICULTIES[input?.difficulty]) throw new Error("Choose casual, stadium, or master.");
        save.difficulty = input.difficulty;
        writeSave();
        renderDifficulty();
        return { difficulty: DIFFICULTIES[save.difficulty].label };
      }
    })).catch(() => {});
    void Promise.resolve(context.registerTool({
      name: "start_stadium_match",
      title: "Start stadium match",
      description: "Start a three-on-three match using the three owned Pokémon already selected.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute() {
        if (battle) throw new Error("A match is already in progress.");
        if (selected.length !== 3) throw new Error("Select exactly three Pokémon first.");
        startBattle("stadium");
        return { started: true, team: battle.player.map(mon => mon.name), opponents: battle.enemy.map(mon => mon.name) };
      }
    })).catch(() => {});
  } catch { /* WebMCP is optional and feature-detected. */ }
}

// The battle upgrade initializes the UI after registering its mechanics.

