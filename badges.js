// Піксельні значки ачівок. Один стиль для всіх: рамка-восьмикутник 24×24 з металу за рівнем складності,
// темне поле, символ 16×16 у центрі, риски рангу знизу. Світло завжди зліва зверху, контур — 1 піксель.
// Що малювати, каже API: badge = {glyph, tier, rank} (spender: modules/achievements/badges.py).

const BADGE_COLORS = {
  o: "#1a1020",                                   // контур
  s: "#eef2f6", S: "#9aa6b8", T: "#56607a",       // сталь
  w: "#d79a5a", W: "#9a5f32", V: "#5a341c",       // дерево, шкіра
  g: "#ffe58a", G: "#e8a93a", H: "#9a5e18",       // золото
  f: "#fff6b0", F: "#ffa53a", R: "#e0482a",       // вогонь
  p: "#f6ecd0", P: "#d2bd8e", Q: "#9c8458",       // папір
  b: "#a8e4ff", B: "#4a8ad8", N: "#27467e",       // магія, скло
  k: "#f2ecdf", K: "#b3a892", J: "#6e6656",       // кістка
  r: "#d23a46", E: "#7a1a2a",                     // рубін
};

const GLYPHS = {
  sword: [
    "..............oo",
    "............osSo",
    "...........osSo.",
    "..........osSo..",
    ".........osSo...",
    "........osSo....",
    "...oo..osSo.....",
    "..oGgoosSo......",
    "..oHGgsSo.......",
    "...oHGgo........",
    "...ooWHGo.......",
    "...oWWooHo......",
    "..oWWo..oo......",
    ".ogWo...........",
    ".oGHo...........",
    "..oo............",
  ],
  flame: [
    "......o.........",
    ".....oRo........",
    ".....oRRo.......",
    "....oRFRo...o...",
    "....oRFFRo.oRo..",
    "...oRFFFRooRRo..",
    "...oRFfFFRoRFo..",
    "..oRFFffFFRRFRo.",
    "..oRFfffFFFFFRo.",
    ".oRFFfffffFFFRo.",
    ".oRFffffffffFRo.",
    ".oRFfffffffFFRo.",
    ".oRFFffffffFFRo.",
    "..oRFFffffFFRo..",
    "...ooRRFFRRoo...",
    ".....oooooo.....",
  ],
  hourglass: [
    "..oooooooooooo..",
    "..owwwwwwwwwVo..",
    "..oooooooooooo..",
    "...obGGGGGGbo...",
    "...obgGGGGGbo...",
    "....obgGGGbo....",
    ".....obgGbo.....",
    "......obGo......",
    "......obGo......",
    ".....obbGbo.....",
    "....obbbGbbo....",
    "...obbbGGGbbo...",
    "...obGGGGGGGo...",
    "..oooooooooooo..",
    "..owwwwwwwwwVo..",
    "..oooooooooooo..",
  ],
  ring: [
    "................",
    "......oooo......",
    ".....obbBNo.....",
    ".....oBbNNo.....",
    "....oggooHHo....",
    "...ogGo..oGHo...",
    "..ogGo....oGHo..",
    "..ogo......oHo..",
    "..ogo......oHo..",
    "..oGo......oHo..",
    "..oGGo....oHHo..",
    "...oGGo..oHHo...",
    "....oGGooHHo....",
    ".....oHHHHo.....",
    "......oooo......",
    "................",
  ],
  sack: [
    "................",
    ".....oo..oo.....",
    "......oWWo......",
    "......oGGo......",
    ".....owwwWo.....",
    "....owwwwWWo....",
    "...owwwwwwWWo...",
    "..owwwwwwwwWWo..",
    "..owwwgGwwwWWo..",
    ".owwwgHHGwwwWVo.",
    ".owwwwgGwwwWWVo.",
    ".owwwwwwwwwWWVo.",
    ".oWwwwwwwwWWVVo.",
    "..oWWWWWWWWVVo..",
    "...oooooooooo...",
    "................",
  ],
  scroll: [
    "................",
    "..oooooooooooo..",
    ".opppppppppppPo.",
    ".oPPPPPPPPPPPQo.",
    "..opppppppppPo..",
    "..opQQQQQQppPo..",
    "..oppppppppPPo..",
    "..opQQQQQpppPo..",
    "..oppppppppPPo..",
    "..opQQQQQQppPo..",
    "..oppppppprrPo..",
    "..opQQQQprEEro..",
    ".opppppppprEPPo.",
    ".oPPPPPPPPPPPQo.",
    "..oooooooooooo..",
    "................",
  ],
  moon: [
    "................",
    "......ooooo.....",
    "....oobbbbNo....",
    "...obbbNNoo.....",
    "..obbbNo....o...",
    "..obbNo....ogo..",
    ".obbbNo...ogfgo.",
    ".obbbNo....ogo..",
    ".obbbNo.....o...",
    ".obbbbNo........",
    "..obbbbNo.......",
    "..obbbbbNoo.....",
    "...obbbbbbNoo...",
    "....oobbbbbbNo..",
    "......oooooo....",
    "................",
  ],
  coins: [
    "................",
    "..........oooo..",
    ".........ogggHo.",
    "........ogGGGGHo",
    "........ogGHHGHo",
    "........ogGHGGHo",
    "........ogGGGGHo",
    "..oooooo.oGGGHo.",
    ".ogggggGo.oooo..",
    ".oHHHHHHo.......",
    ".ogggggGo.......",
    ".oHHHHHHo.......",
    ".ogggggGo.......",
    ".oHHHHHHo.......",
    ".ogggggGo.......",
    "..oooooo........",
  ],
  book: [
    "................",
    "..ooooooooooo...",
    "..ogrrrrrrrGoo..",
    "..orrrrrrrrrEpo.",
    "..orrgGGGGrrEpo.",
    "..orrGrrrGrrEpo.",
    "..orrGrbrGrrEpo.",
    "..orrGrrrGrrEpo.",
    "..orrgGGGGrrEpo.",
    "..orrrrrrrrrEpo.",
    "..orrrrrrrrrEpo.",
    "..orrrrrrrrrEpo.",
    "..oGrrrrrrrGEpo.",
    "..oooooooooooPo.",
    "...oppppppppPPo.",
    "....oooooooooo..",
  ],
  shield: [
    "..oooooooooooo..",
    "..osssssSSSSTo..",
    "..osBBBBNNNNTo..",
    "..osBBBgHNNNTo..",
    "..osBBgGGHNNTo..",
    "..osBBBGHNNNTo..",
    "..osBBBgHNNNTo..",
    "..osBBBGHNNNTo..",
    "..oSBBBGHNNNTo..",
    "...oSBBBNNNTo...",
    "...oSBBBNNNTo...",
    "....oSBBNNTo....",
    ".....oSBNTo.....",
    "......oSTo......",
    ".......oo.......",
    "................",
  ],
  chest: [
    "................",
    "................",
    "...oooooooooo...",
    "..owwwwwwwwwWo..",
    ".owwWwwwwwwWwWo.",
    ".oWWWWWWWWWWWVo.",
    ".oooooooooooooo.",
    ".oGwwwogGowwwHo.",
    ".oGwwwoHHowwwHo.",
    ".oGWWWooooWWWHo.",
    ".oGwwwwwwwwwwHo.",
    ".oGWWWWWWWWWWHo.",
    ".oGwwwwwwwwwwHo.",
    ".oHVVVVVVVVVVHo.",
    ".oooooooooooooo.",
    "................",
  ],
  skull: [
    "................",
    ".....oooooo.....",
    "...ookkkkkKoo...",
    "..okkkkkkkkkKo..",
    ".okkkkkkkkkkKKo.",
    ".okkkkkkkkkkKKo.",
    ".okoooookooooKo.",
    ".okoooookooooKo.",
    ".okkoookkkookKo.",
    "..okkkkoJkkkKo..",
    "...oKkkkkkkKo...",
    "...okoKoKoKoo...",
    "...okkkkkkKKo...",
    "....oooooooo....",
    "................",
    "................",
  ],
  mystery: [
    "................",
    ".....oooooo.....",
    "....obbbbbbo....",
    "...obbNoooBbo...",
    "...oboo..obbo...",
    "....o...obbNo...",
    ".......obbNo....",
    "......obbNo.....",
    "......obNo......",
    "......obNo......",
    ".......oo.......",
    "......oooo......",
    "......obNo......",
    "......oNNo......",
    ".......oo.......",
    "................",
  ],
  star: [
    "................",
    ".......oo.......",
    "......ogGo......",
    "......ogGo......",
    ".....ogggGo.....",
    "ooooooggggGooooo",
    ".ogggggggggGGHo.",
    "..ogggggggGGHo..",
    "...ogggggGGHo...",
    "...oggggGGGHo...",
    "..oggGGooGGGHo..",
    "..ogGo....oGHo..",
    ".ogGo......oHo..",
    ".ooo........ooo.",
    "................",
    "................",
  ],
};

// Матеріал рамки: світлий, середній, темний край; поле — темне й світліше в центрі; камінь (або null)
const TIERS = {
  stone:  { rim: ["#a7a79c", "#6e6e66", "#3e3e39"], field: ["#16161a", "#222228"], gem: null },
  bronze: { rim: ["#eab07a", "#b06a36", "#6b3a1f"], field: ["#24160f", "#3a271b"], gem: null },
  silver: { rim: ["#f2f5f8", "#a8b3c2", "#5b6577"], field: ["#121a28", "#1f2c44"], gem: null },
  gold:   { rim: ["#fff0a0", "#e6b32e", "#946214"], field: ["#260d12", "#45161d"], gem: "#e23a4a" },
  mythic: { rim: ["#f3d8ff", "#b06ae8", "#5b2a8c"], field: ["#100a24", "#2a1652"], gem: "#7ff0ff" },
};

const SIZE = 24;
const MID = (SIZE - 1) / 2;

function inOctagon(x, y, inset) {
  const lo = inset, hi = SIZE - 1 - inset, cut = Math.max(2, 7 - inset);
  if (x < lo || x > hi || y < lo || y > hi) return false;
  return x - lo + (y - lo) >= cut && hi - x + (y - lo) >= cut && x - lo + (hi - y) >= cut && hi - x + (hi - y) >= cut;
}

function badgePixels({ glyph, tier, rank }) {
  const t = TIERS[tier] || TIERS.bronze;
  const px = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (!inOctagon(x, y, 0)) continue;
      const lit = x + y < SIZE - 1; // світло зліва зверху
      if (!inOctagon(x, y, 1)) px[y][x] = BADGE_COLORS.o;
      else if (!inOctagon(x, y, 2)) px[y][x] = lit ? t.rim[0] : t.rim[1];
      else if (!inOctagon(x, y, 3)) px[y][x] = lit ? t.rim[1] : t.rim[2];
      else if (!inOctagon(x, y, 4)) px[y][x] = BADGE_COLORS.o;
      else {
        const d = Math.hypot(x - MID, y - MID);
        // світліше в центрі, на межі — шахове змішування, як у старих іграх
        px[y][x] = d < 5.5 || (d < 7 && (x + y) % 2 === 0) ? t.field[1] : t.field[0];
      }
    }
  }
  // на рамці зверху й з боків: заклепки (срібло) або камені 2×2 з відблиском (золото, міфрил)
  if (tier === "silver" || t.gem) {
    for (const [x, y] of [[11, 1], [1, 11], [21, 11]]) {
      const color = t.gem || t.rim[0];
      px[y][x] = t.gem ? "#ffffff" : color;
      px[y][x + 1] = color;
      px[y + 1][x] = color;
      px[y + 1][x + 1] = t.gem ? BADGE_COLORS.o : t.rim[2];
    }
  }
  const rows = GLYPHS[glyph] || GLYPHS.star;
  rows.forEach((row, gy) => [...row].forEach((ch, gx) => {
    if (ch !== ".") px[gy + 4][gx + 4] = BADGE_COLORS[ch];
  }));
  // ранг: риски на нижній частині рамки
  const pips = Math.min(rank || 0, 5);
  for (let i = 0; i < pips; i++) {
    const x = Math.round(MID - (pips - 1) + 2 * i);
    px[21][x] = "#fff6b0";
    px[22][x] = t.rim[0];
  }
  return px;
}

function badgeSvg(badge) {
  const px = badgePixels(badge);
  let rects = "";
  px.forEach((row, y) => {
    // сусідні пікселі одного кольору — одним прямокутником
    for (let x = 0; x < SIZE; ) {
      const color = row[x];
      let end = x + 1;
      while (end < SIZE && row[end] === color) end++;
      if (color) rects += `<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${color}"/>`;
      x = end;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" shape-rendering="crispEdges">${rects}</svg>`;
}
