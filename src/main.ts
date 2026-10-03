import "./style.css";
import { Game } from "./game";
import { Preferences, Saves, SaveData } from "./save";

const app = document.querySelector("#app") as HTMLElement;
const shell = (content: string) => {
  app.innerHTML = `<main class="screen"><div class="forest"></div><section class="card">${content}</section></main>`;
};
const back = () =>
  document.querySelector("#back")?.addEventListener("click", title);

function title(): void {
  shell(
    `<h1 class="logo"><span>ESSIE'S</span><b>ENCHANTED WILDS</b></h1><div class="title-char">👧🏾 ✨ 🐇</div><p>Restore colour and magic to a world made of wonder.</p><div class="menu"><button class="primary" id="play">Play a New World</button><button class="primary" id="continue" ${Saves.has() ? "" : "disabled"}>Continue</button><div class="row"><button class="secondary" id="settings">Settings</button><button class="secondary" id="help">How to Play</button></div></div>`,
  );
  document.querySelector("#play")!.addEventListener("click", newWorld);
  document.querySelector("#continue")!.addEventListener("click", async () => {
    const save = await Saves.load();
    if (save) new Game(app, save);
  });
  document.querySelector("#settings")!.addEventListener("click", settings);
  document.querySelector("#help")!.addEventListener("click", help);
}

function newWorld(): void {
  shell(
    `<h1>Create Your Wild</h1><label>World name<input id="name" value="Essie's Sparklewood"></label><label>Play style<select id="mode"><option value="adventure">Adventure — collect and craft</option><option value="creative">Creative — build and fly</option></select></label><label>Difficulty<select id="difficulty"><option value="peaceful">Peaceful</option><option value="gentle" selected>Gentle</option><option value="adventure">Adventure</option></select></label><div class="menu"><button class="primary" id="begin">Begin Adventure</button><button class="secondary" id="back">Back</button></div>`,
  );
  back();
  document.querySelector("#begin")!.addEventListener("click", () => {
    const mode = (document.querySelector("#mode") as HTMLSelectElement)
      .value as SaveData["mode"];
    const difficulty = (
      document.querySelector("#difficulty") as HTMLSelectElement
    ).value as SaveData["difficulty"];
    new Game(app, {
      version: 1,
      name:
        (document.querySelector("#name") as HTMLInputElement).value ||
        "Essie's Wild",
      seed: Date.now(),
      mode,
      difficulty,
      position: [0, 5, 0],
      time: 0.28,
      inventory: mode === "creative" ? {} : { leaves: 2 },
      changes: {},
      tutorial: 0,
    });
  });
}

function help(): void {
  shell(
    `<h1>How to Play</h1><div class="help"><p><b>WASD</b> move · <b>Space</b> jump · <b>Shift</b> run</p><p><b>Mouse / trackpad</b> look · <b>R</b> recenter camera</p><p><b>Hold left click or F</b> break / attack<br><b>Right click or G</b> place / use</p><p><b>E</b> Adventure Pack & crafting · <b>1–9 / wheel</b> select</p><p>In Creative, double-tap Space to fly. Space rises and Shift descends.</p><p class="notice">Follow Pip 🐇, collect wood, craft, build, and keep the Wilds glowing!</p></div><button class="secondary" id="back">Back</button>`,
  );
  back();
}

function settings(): void {
  const value = Preferences.load();
  shell(
    `<h1>Settings</h1><label>Graphics<select id="gfx">${["Very Low", "Low", "Medium"].map((x) => `<option ${x === value.graphics ? "selected" : ""}>${x}</option>`).join("")}</select></label><label>View distance <output id="vdOut">${value.viewDistance}</output><input id="vd" type="range" min="14" max="36" value="${value.viewDistance}"></label><label>Render scale<input id="scale" type="range" min="50" max="100" value="${value.renderScale * 100}"></label><label>Camera sensitivity<input id="sensitivity" type="range" min="1" max="10" value="${value.sensitivity}"></label><label>Music volume<input id="music" type="range" min="0" max="10" value="${value.music}"></label><label>Sound volume<input id="sound" type="range" min="0" max="10" value="${value.sound}"></label><label><span><input id="invert" type="checkbox" ${value.invertY ? "checked" : ""}> Invert vertical camera</span></label><label><span><input id="motion" type="checkbox" ${value.reducedMotion ? "checked" : ""}> Reduced camera motion</span></label><div class="row"><button class="primary" id="full">Fullscreen</button><button class="secondary" id="back">Save & Done</button></div>`,
  );
  const range = (id: string) =>
    +(document.querySelector(`#${id}`) as HTMLInputElement).value;
  document.querySelector("#vd")!.addEventListener("input", (e) => {
    document.querySelector("#vdOut")!.textContent = (
      e.target as HTMLInputElement
    ).value;
  });
  document
    .querySelector("#full")!
    .addEventListener("click", () =>
      document.documentElement.requestFullscreen(),
    );
  document.querySelector("#back")!.addEventListener("click", () => {
    Preferences.save({
      graphics: (document.querySelector("#gfx") as HTMLSelectElement)
        .value as typeof value.graphics,
      viewDistance: range("vd"),
      renderScale: range("scale") / 100,
      sensitivity: range("sensitivity"),
      music: range("music"),
      sound: range("sound"),
      invertY: (document.querySelector("#invert") as HTMLInputElement).checked,
      reducedMotion: (document.querySelector("#motion") as HTMLInputElement)
        .checked,
    });
    title();
  });
}

title();
