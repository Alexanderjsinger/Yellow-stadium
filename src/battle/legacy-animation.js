
function animateAttack(side) {
  const sprite = side === "player" ? els["player-sprite"] : els["enemy-sprite"];
  sprite.classList.remove("attack-right", "attack-left");
  void sprite.offsetWidth;
  sprite.classList.add(side === "player" ? "attack-right" : "attack-left");
}

function animateHit(side) {
  const sprite = side === "player" ? els["player-sprite"] : els["enemy-sprite"];
  sprite.classList.remove("hit");
  void sprite.offsetWidth;
  sprite.classList.add("hit");
  els["effect-flash"].classList.remove("flash");
  void els["effect-flash"].offsetWidth;
  els["effect-flash"].classList.add("flash");
}

