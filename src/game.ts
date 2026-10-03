import * as THREE from "three";
import { BLOCKS, ITEMS, RECIPES, BlockId, ItemId } from "./data";
import { AudioSystem } from "./audio";
import { Preferences, SaveData, Saves } from "./save";
type Inv = Record<string, number>;
const key = (x: number, y: number, z: number) => `${x},${y},${z}`;
function part(color: number, sx: number, sy: number, sz: number) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz),
    new THREE.MeshLambertMaterial({ color }),
  );
  m.castShadow = false;
  return m;
}
function essie() {
  const g = new THREE.Group(),
    skin = 0x6f3f2b;
  const body = part(0x4c8ee8, 0.65, 0.8, 0.35);
  body.position.y = 1.15;
  g.add(body);
  const head = part(skin, 0.55, 0.55, 0.5);
  head.position.y = 1.85;
  g.add(head);
  for (const s of [-1, 1]) {
    const leg = part(s ? 0xf264ad : 0x4aa6e8, 0.22, 0.7, 0.25);
    leg.position.set(s * 0.18, 0.4, 0);
    g.add(leg);
    const braid = part(0x241513, 0.13, 0.65, 0.13);
    braid.position.set(s * 0.36, 1.64, 0.05);
    braid.rotation.z = s * 0.22;
    g.add(braid);
  }
  return g;
}
function rabbit() {
  const g = new THREE.Group();
  const b = part(0xf4eafa, 0.55, 0.45, 0.75);
  b.position.y = 0.35;
  g.add(b);
  const h = part(0xf4eafa, 0.48, 0.48, 0.46);
  h.position.set(0, 0.62, -0.35);
  g.add(h);
  for (const s of [-1, 1]) {
    const e = part(s < 0 ? 0xff8fc7 : 0x70cfff, 0.14, 0.55, 0.14);
    e.position.set(s * 0.14, 1, -0.35);
    g.add(e);
  }
  return g;
}
function shadowling() {
  const g = new THREE.Group();
  const b = part(0x372a58, 0.65, 0.55, 0.5);
  b.position.y = 0.4;
  g.add(b);
  for (const s of [-1, 1]) {
    const eye = part(0x8ceeff, 0.1, 0.1, 0.05);
    eye.position.set(s * 0.16, 0.5, -0.27);
    g.add(eye);
  }
  return g;
}
export class Game {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 90);
  renderer = new THREE.WebGLRenderer({
    antialias: false,
    powerPreference: "low-power",
  });
  clock = new THREE.Clock();
  player = essie();
  bun = rabbit();
  enemy = shadowling();
  outline = new THREE.Mesh(
    new THREE.BoxGeometry(1.03, 1.03, 1.03),
    new THREE.MeshBasicMaterial({ color: 0xffe0f5, wireframe: true }),
  );
  blocks = new Map<string, BlockId>();
  meshes: THREE.InstancedMesh[] = [];
  changes: Record<string, string | null> = {};
  keys = new Set<string>();
  yaw = 0;
  pitch = -0.3;
  vy = 0;
  grounded = false;
  selected = 0;
  target?: { p: THREE.Vector3; n: THREE.Vector3 };
  breakStart = 0;
  breaking = false;
  time = 0.28;
  paused = false;
  lastSave = 0;
  tutorial = 0;
  health = 10;
  mode: "adventure" | "creative";
  difficulty: "peaceful" | "gentle" | "adventure";
  name: string;
  seed: number;
  inventory: Inv;
  hotbar: ItemId[] = [
    "wood",
    "leaves",
    "stone",
    "pinkCrystal",
    "blueCrystal",
    "sand",
    "soil",
    "wand",
    "stoneTool",
  ];
  audio = new AudioSystem();
  enemyHp = 3;
  flying = false;
  lastSpace = 0;
  hitCooldown = 0;
  settings = Preferences.load();
  constructor(
    public root: HTMLElement,
    data: SaveData,
  ) {
    this.mode = data.mode;
    this.difficulty = data.difficulty;
    this.name = data.name;
    this.seed = data.seed;
    this.inventory = data.inventory;
    this.changes = data.changes;
    this.time = data.time;
    this.tutorial = data.tutorial;
    this.player.position.fromArray(data.position);
    this.setup();
  }
  setup() {
    this.renderer.setPixelRatio(
      Math.min(devicePixelRatio * this.settings.renderScale, 1.25),
    );
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.domElement.id = "game";
    this.root.innerHTML = "";
    this.root.append(this.renderer.domElement);
    this.scene.background = new THREE.Color(0x91d9e8);
    this.scene.fog = new THREE.Fog(
      0x91d9e8,
      this.settings.viewDistance * 0.55,
      this.settings.viewDistance,
    );
    this.scene.add(
      new THREE.HemisphereLight(0xbfefff, 0x5d4777, 2.2),
      new THREE.DirectionalLight(0xffe5c2, 1.4),
    );
    this.audio.volume = this.settings.sound / 10;
    this.buildWorld();
    this.scene.add(this.player, this.bun);
    this.outline.visible = false;
    this.scene.add(this.outline);
    this.bun.position.set(2, this.height(2, 2) + 1, 2);
    if (this.difficulty !== "peaceful") {
      this.scene.add(this.enemy);
      this.enemy.position.set(12, this.height(12, 10) + 1, 10);
    }
    this.makeHud();
    this.bind();
    this.loop();
    this.toast(
      this.tutorial < 3
        ? "✨ Pip is waiting! Walk to the glowing tree and collect wood."
        : "Welcome back to the Wilds!",
      4500,
    );
  }
  height(x: number, z: number) {
    return Math.floor(2 + Math.sin(x * 0.23) + Math.cos(z * 0.19) * 0.7);
  }
  buildWorld() {
    this.blocks.clear();
    const R = 18;
    for (let x = -R; x <= R; x++)
      for (let z = -R; z <= R; z++) {
        const h = this.height(x, z);
        for (let y = 0; y <= h; y++)
          this.blocks.set(
            key(x, y, z),
            y === h ? "grass" : y > h - 2 ? "soil" : "stone",
          );
        if (x * x + z * z > 24 && (x * 17 + z * 31) % 79 === 0) {
          for (let y = h + 1; y < h + 5; y++)
            this.blocks.set(key(x, y, z), "wood");
          for (let a = -2; a <= 2; a++)
            for (let b = -1; b <= 2; b++)
              for (let c = -2; c <= 2; c++)
                if (Math.abs(a) + Math.abs(c) + Math.abs(b) < 5)
                  this.blocks.set(key(x + a, h + 4 + b, z + c), "leaves");
        }
        if ((x * 23 + z * 11) % 191 === 0)
          this.blocks.set(
            key(x, h + 1, z),
            x % 2 ? "pinkCrystal" : "blueCrystal",
          );
      }
    for (const [k, v] of Object.entries(this.changes)) {
      if (v) this.blocks.set(k, v as BlockId);
      else this.blocks.delete(k);
    }
    this.remesh();
  }
  remesh() {
    for (const m of this.meshes) this.scene.remove(m);
    this.meshes = [];
    const grouped = {} as Record<BlockId, THREE.Matrix4[]>;
    for (const b of Object.keys(BLOCKS) as BlockId[]) grouped[b] = [];
    const mat = new THREE.Matrix4();
    for (const [k, b] of this.blocks) {
      const [x, y, z] = k.split(",").map(Number);
      let visible = false;
      for (const [a, c, d] of [
        [1, 0, 0],
        [-1, 0, 0],
        [0, 1, 0],
        [0, -1, 0],
        [0, 0, 1],
        [0, 0, -1],
      ])
        if (!this.blocks.has(key(x + a, y + c, z + d))) {
          visible = true;
          break;
        }
      if (visible) grouped[b].push(mat.clone().makeTranslation(x, y, z));
    }
    for (const b of Object.keys(grouped) as BlockId[]) {
      const arr = grouped[b];
      if (!arr.length) continue;
      const material = new THREE.MeshLambertMaterial({
        color: BLOCKS[b].color,
        transparent: b === "water",
        opacity: b === "water" ? 0.65 : 1,
      });
      const im = new THREE.InstancedMesh(
        new THREE.BoxGeometry(1, 1, 1),
        material,
        arr.length,
      );
      arr.forEach((m, i) => im.setMatrixAt(i, m));
      im.userData.block = b;
      this.scene.add(im);
      this.meshes.push(im);
    }
  }
  makeHud() {
    const h = document.createElement("div");
    h.id = "hud";
    h.innerHTML = `<div class="top"><div class="pill"><b>${this.name}</b><br><span id="day">Daylight</span></div><div class="pill hearts" id="hearts"></div></div><div class="crosshair">✦</div><div id="toast" class="toast hidden"></div><div id="breakbar" class="hidden"><i></i></div><div class="hotbar" id="hotbar"></div>`;
    this.root.append(h);
    this.root.insertAdjacentHTML(
      "beforeend",
      '<div class="night" id="night"></div>',
    );
    this.updateHud();
  }
  updateHud() {
    const hb = document.querySelector("#hotbar")!;
    hb.innerHTML = this.hotbar
      .map(
        (id, i) =>
          `<div class="slot ${i === this.selected ? "sel" : ""}"><em>${i + 1}</em>${ITEMS[id].icon}<small>${this.mode === "creative" ? "∞" : this.inventory[id] || 0}</small></div>`,
      )
      .join("");
    document.querySelector("#hearts")!.textContent =
      this.mode === "creative"
        ? "✨ Creative"
        : `${"♥".repeat(Math.ceil(this.health / 2))}${"♡".repeat(5 - Math.ceil(this.health / 2))}`;
    document.querySelector("#day")!.textContent =
      this.time > 0.7
        ? "Night is here"
        : this.time > 0.58
          ? "Night is coming…"
          : "Bright day";
  }
  bind() {
    addEventListener("resize", () => {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
    });
    addEventListener("keydown", (e) => {
      if (e.code === "Escape") {
        this.pause();
        return;
      }
      if (e.code === "KeyE") {
        this.inventoryUI();
        return;
      }
      if (e.code === "KeyR") {
        this.yaw = 0;
        this.pitch = -0.3;
      }
      if (/^Digit[1-9]$/.test(e.code)) {
        this.selected = +e.code.at(-1)! - 1;
        this.updateHud();
      }
      if (e.code === "Space" && this.mode === "creative") {
        if (performance.now() - this.lastSpace < 350)
          this.flying = !this.flying;
        this.lastSpace = performance.now();
      }
      if (e.code === "KeyF") this.action(false);
      if (e.code === "KeyG") this.action(true);
      this.keys.add(e.code);
    });
    addEventListener("keyup", (e) => this.keys.delete(e.code));
    this.renderer.domElement.addEventListener("click", () =>
      this.renderer.domElement.requestPointerLock(),
    );
    this.renderer.domElement.addEventListener("mousedown", (e: MouseEvent) => {
      if (e.button === 0) {
        this.breaking = true;
        this.breakStart = performance.now();
      } else if (e.button === 2) this.action(true);
    });
    addEventListener("mouseup", () => {
      this.breaking = false;
      (document.querySelector("#breakbar") as HTMLElement)?.classList.add(
        "hidden",
      );
    });
    this.renderer.domElement.addEventListener(
      "contextmenu",
      (e: MouseEvent) => {
        e.preventDefault();
        this.action(true);
      },
    );
    addEventListener("mousemove", (e) => {
      if (document.pointerLockElement === this.renderer.domElement) {
        const speed = this.settings.sensitivity * 0.0005;
        this.yaw -= e.movementX * speed;
        this.pitch = Math.max(
          -1.1,
          Math.min(
            0.45,
            this.pitch + e.movementY * speed * (this.settings.invertY ? 1 : -1),
          ),
        );
      }
    });
    addEventListener("wheel", (e: WheelEvent) => {
      this.selected = (this.selected + (e.deltaY > 0 ? 1 : 8)) % 9;
      this.updateHud();
    });
    addEventListener("blur", () => {
      this.paused = true;
      this.pause(true);
    });
  }
  action(place: boolean) {
    if (this.paused) return;
    if (!place && this.attackEnemy()) return;
    if (!this.target) return;
    if (place) {
      const id = this.hotbar[this.selected];
      if (!(id in BLOCKS)) return this.toast("Choose a block to place");
      const p = this.target.p.clone().add(this.target.n);
      if (p.distanceTo(this.player.position) < 1.4)
        return this.toast("Too close to Essie!");
      if (this.mode === "adventure" && !this.inventory[id])
        return this.toast(`Find more ${ITEMS[id].name}`);
      this.blocks.set(key(p.x, p.y, p.z), id as BlockId);
      this.changes[key(p.x, p.y, p.z)] = id;
      if (this.mode === "adventure") this.inventory[id]--;
      this.audio.ping(520);
      this.remesh();
      this.updateHud();
    } else {
      const k = key(this.target.p.x, this.target.p.y, this.target.p.z),
        b = this.blocks.get(k);
      if (!b) return;
      this.blocks.delete(k);
      this.changes[k] = null;
      if (this.mode === "adventure") {
        const d = BLOCKS[b].drop || b;
        this.inventory[d] = (this.inventory[d] || 0) + 1;
      }
      this.audio.ping(260);
      this.remesh();
      this.updateHud();
      if (this.tutorial < 2 && b === "wood") {
        this.tutorial = 2;
        this.toast("Lovely! Press E and craft Wood Planks ✨", 4000);
      }
    }
  }
  attackEnemy() {
    if (
      !this.enemy.parent ||
      this.enemy.position.distanceTo(this.player.position) > 4
    )
      return false;
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    const toward = this.enemy.position
      .clone()
      .sub(this.camera.position)
      .normalize();
    if (forward.dot(toward) < 0.94) return false;
    this.enemyHp -= this.hotbar[this.selected] === "wand" ? 2 : 1;
    this.audio.ping(180);
    (this.enemy.children[0] as THREE.Mesh).material =
      new THREE.MeshLambertMaterial({ color: 0xff8dde });
    setTimeout(() => {
      if (this.enemy.parent)
        (this.enemy.children[0] as THREE.Mesh).material =
          new THREE.MeshLambertMaterial({ color: 0x372a58 });
    }, 120);
    if (this.enemyHp <= 0) {
      this.scene.remove(this.enemy);
      this.inventory.blueCrystal = (this.inventory.blueCrystal || 0) + 1;
      this.toast("The Shadowling became a sparkle! Blue Crystal found ✨");
      this.updateHud();
      setTimeout(() => {
        if (this.difficulty !== "peaceful") {
          this.enemyHp = 3;
          this.enemy.position.set(-12, this.height(-12, 11) + 1, 11);
          this.scene.add(this.enemy);
        }
      }, 12000);
    }
    return true;
  }
  raycast() {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    ray.far = 6;
    const hits = ray.intersectObjects(this.meshes);
    if (!hits.length) {
      this.target = undefined;
      this.outline.visible = false;
      return;
    }
    const q = hits[0];
    if (q.instanceId == null || !q.face) return;
    const m = new THREE.Matrix4();
    (q.object as THREE.InstancedMesh).getMatrixAt(q.instanceId, m);
    const p = new THREE.Vector3().setFromMatrixPosition(m);
    this.target = { p, n: q.face.normal.clone() };
    this.outline.position.copy(p);
    this.outline.visible = true;
  }
  collides(p: THREE.Vector3) {
    for (const ox of [-0.28, 0.28])
      for (const oz of [-0.28, 0.28])
        for (const oy of [0, 0.8, 1.6]) {
          const id = this.blocks.get(
            key(
              Math.round(p.x + ox),
              Math.round(p.y + oy),
              Math.round(p.z + oz),
            ),
          );
          if (id && BLOCKS[id].solid) return true;
        }
    return false;
  }
  move(dt: number) {
    let x = 0,
      z = 0;
    if (this.keys.has("KeyW")) z -= 1;
    if (this.keys.has("KeyS")) z += 1;
    if (this.keys.has("KeyA")) x -= 1;
    if (this.keys.has("KeyD")) x += 1;
    const v = new THREE.Vector3(x, 0, z)
        .normalize()
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw),
      run = this.keys.has("ShiftLeft") ? 6.5 : 4;
    if (v.lengthSq()) this.player.rotation.y = Math.atan2(v.x, v.z);
    const next = this.player.position.clone();
    next.x += v.x * run * dt;
    if (!this.collides(next)) this.player.position.x = next.x;
    next.copy(this.player.position);
    next.z += v.z * run * dt;
    if (!this.collides(next)) this.player.position.z = next.z;
    if (this.flying) {
      next.copy(this.player.position);
      next.y +=
        (this.keys.has("Space") ? 4 : 0) * dt -
        (this.keys.has("ShiftLeft") ? 4 : 0) * dt;
      if (!this.collides(next)) this.player.position.y = next.y;
    } else {
      this.vy -= 15 * dt;
      if (this.keys.has("Space") && this.grounded) {
        this.vy = 7;
        this.grounded = false;
      }
      next.copy(this.player.position);
      next.y += this.vy * dt;
      if (this.collides(next)) {
        if (this.vy < 0) this.grounded = true;
        this.vy = 0;
      } else {
        this.player.position.y = next.y;
        this.grounded = false;
      }
      if (this.player.position.y < 0.5) this.defeat();
    }
  }
  entities(dt: number) {
    const d = this.bun.position.distanceTo(this.player.position);
    if (d > 10)
      this.bun.position
        .copy(this.player.position)
        .add(new THREE.Vector3(2, 0, 2));
    else if (d > 2.5) this.bun.position.lerp(this.player.position, 0.7 * dt);
    this.bun.position.y =
      this.height(
        Math.round(this.bun.position.x),
        Math.round(this.bun.position.z),
      ) + 1;
    this.bun.rotation.y += dt * 0.5;
    if (this.enemy.parent) {
      const ed = this.enemy.position.distanceTo(this.player.position);
      const noticeDistance = this.time > 0.65 ? 12 : 8;
      if (ed < noticeDistance) {
        this.enemy.position.lerp(
          this.player.position,
          (this.difficulty === "gentle" ? 0.08 : 0.13) * dt,
        );
        if (ed < 1.2 && this.mode === "adventure") {
          this.health = Math.max(
            0,
            this.health - dt * (this.difficulty === "gentle" ? 0.35 : 0.7),
          );
          if (this.health <= 0) this.defeat();
        }
      } else {
        // A tiny deterministic wander avoids pathfinding allocations on low-end devices.
        this.enemy.position.x += Math.sin(this.time * 80) * dt * 0.35;
        this.enemy.position.z += Math.cos(this.time * 67) * dt * 0.35;
      }
      this.enemy.position.y =
        this.height(
          Math.round(this.enemy.position.x),
          Math.round(this.enemy.position.z),
        ) + 1;
    }
    if (this.player.position.length() < 5 && this.health < 10)
      this.health = Math.min(10, this.health + dt * 0.35);
  }
  defeat() {
    this.player.position.set(0, this.height(0, 0) + 1.5, 0);
    this.health = 10;
    this.toast(
      "You are safe at the sanctuary. Pip kept your treasures! 💗",
      5000,
    );
  }
  inventoryUI() {
    this.paused = true;
    document.exitPointerLock();
    const p = document.createElement("div");
    p.className = "panel";
    p.innerHTML = `<button class="secondary close">Close ×</button><h1>Adventure Pack</h1><p>${
      Object.entries(this.inventory)
        .filter(([, n]) => n)
        .map(
          ([i, n]) =>
            `${ITEMS[i as ItemId]?.icon || ""} ${ITEMS[i as ItemId]?.name}: <b>${n}</b>`,
        )
        .join(" · ") || "Collect treasures in the Wilds!"
    }</p><h2>Craft something magical</h2><div class="recipes">${RECIPES.map(
      (r, i) =>
        `<div class="recipe"><h3>${ITEMS[r.out].icon} ${ITEMS[r.out].name}</h3><p>${Object.entries(
          r.needs,
        )
          .map(([id, n]) => `${n} ${ITEMS[id as ItemId].name}`)
          .join(
            " + ",
          )}</p><button class="primary" data-r="${i}">Craft</button></div>`,
    ).join("")}</div>`;
    this.root.append(p);
    p.querySelector(".close")!.addEventListener("click", () => {
      p.remove();
      this.paused = false;
    });
    p.querySelectorAll("[data-r]").forEach((b) =>
      b.addEventListener("click", () => {
        const r = RECIPES[+(b as HTMLElement).dataset.r!];
        if (
          Object.entries(r.needs).some(
            ([id, n]) => (this.inventory[id] || 0) < n,
          )
        )
          return this.toast("Not enough ingredients yet — keep exploring!");
        for (const [id, n] of Object.entries(r.needs)) this.inventory[id] -= n;
        this.inventory[r.out] = (this.inventory[r.out] || 0) + r.n;
        if (this.tutorial === 2 && r.out === "planks") {
          this.tutorial = 3;
          this.toast("You made your first item! Pip is very proud 💗", 4000);
        }
        this.audio.ping(760, 0.15);
        this.toast(`Crafted ${ITEMS[r.out].name}! ✨`);
        this.updateHud();
      }),
    );
  }
  pause(auto = false) {
    if (document.querySelector(".panel")) return;
    this.paused = true;
    document.exitPointerLock();
    const p = document.createElement("div");
    p.className = "panel";
    p.innerHTML = `<h1>${auto ? "Adventure paused" : "Paused"}</h1><p>WASD move · Space jump · Shift run · F break · G place · E pack · R camera</p><div class="menu"><button class="primary" id="resume">Keep Playing</button><button class="secondary" id="save">Save & Return to Title</button></div>`;
    this.root.append(p);
    p.querySelector("#resume")!.addEventListener("click", () => {
      p.remove();
      this.paused = false;
    });
    p.querySelector("#save")!.addEventListener("click", () => {
      this.save();
      location.reload();
    });
  }
  toast(s: string, ms = 2200) {
    const t = document.querySelector("#toast");
    if (!t) return;
    t.textContent = s;
    t.classList.remove("hidden");
    setTimeout(() => t.classList.add("hidden"), ms);
  }
  save() {
    Saves.save({
      version: 1,
      name: this.name,
      seed: this.seed,
      mode: this.mode,
      difficulty: this.difficulty,
      position: this.player.position.toArray() as [number, number, number],
      time: this.time,
      inventory: this.inventory,
      changes: this.changes,
      tutorial: this.tutorial,
    });
  }
  loop = () => {
    requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (!this.paused) {
      this.move(dt);
      this.entities(dt);
      this.time = (this.time + dt / 240) % 1;
      const night = Math.max(0, (this.time - 0.55) * 2.3);
      (document.querySelector("#night") as HTMLElement).style.opacity = String(
        Math.min(0.55, night),
      );
      this.scene.background = new THREE.Color().lerpColors(
        new THREE.Color(0x91d9e8),
        new THREE.Color(0x171631),
        Math.min(1, night * 1.5),
      );
      this.raycast();
      if (this.breaking && this.target) {
        const duration = this.mode === "creative" ? 120 : 650,
          progress = Math.min(
            1,
            (performance.now() - this.breakStart) / duration,
          ),
          bar = document.querySelector("#breakbar") as HTMLElement;
        bar.classList.remove("hidden");
        (bar.firstElementChild as HTMLElement).style.width =
          `${progress * 100}%`;
        if (progress >= 1) {
          this.action(false);
          this.breakStart = performance.now();
        }
      }
      if (performance.now() - this.lastSave > 15000) {
        this.save();
        this.lastSave = performance.now();
      }
      this.updateHud();
      const focus = this.player.position
        .clone()
        .add(new THREE.Vector3(0, 1.3, 0));
      const off = new THREE.Vector3(
          Math.sin(this.yaw) * Math.cos(this.pitch),
          Math.sin(this.pitch),
          Math.cos(this.yaw) * Math.cos(this.pitch),
        ).multiplyScalar(6),
        desired = focus.clone().add(off),
        cameraRay = new THREE.Raycaster(focus, off.clone().normalize(), 0.2, 6),
        obstruction = cameraRay.intersectObjects(this.meshes)[0];
      if (obstruction)
        desired
          .copy(focus)
          .add(
            off
              .normalize()
              .multiplyScalar(Math.max(0.7, obstruction.distance - 0.3)),
          );
      this.camera.position.lerp(
        desired,
        this.settings.reducedMotion ? 1 : 0.15,
      );
      this.camera.lookAt(focus);
    }
    this.renderer.render(this.scene, this.camera);
  };
}
