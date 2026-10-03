// Pip Farm desktop shell: the farm window, the desktop buddies strip, tray, saves and notifications.
const { app, BrowserWindow, Tray, Menu, ipcMain, Notification, nativeImage, screen, safeStorage, powerMonitor } = require("electron");
const path = require("path");
const fs = require("fs");

const APP_ID = "com.kush.pipfarm";
const MODEL = "claude-haiku-4-5-20251001";
const startHidden = process.argv.includes("--hidden");

app.setAppUserModelId(APP_ID);
if (!app.requestSingleInstanceLock()) { app.quit(); }

let farmWin = null, buddyWin = null, tray = null, quitting = false;
let updateReady = null; // version string once a new version has been downloaded
let lastSnapshot = null;

const dataDir = () => app.getPath("userData");
const saveFile = () => path.join(dataDir(), "farm.json");
const settingsFile = () => path.join(dataDir(), "settings.json");

// ---------- settings ----------
function readSettings() {
  try { return JSON.parse(fs.readFileSync(settingsFile(), "utf8")); } catch { return { buddy: false, autostart: false }; }
}
function writeSettings(s) {
  fs.mkdirSync(dataDir(), { recursive: true });
  fs.writeFileSync(settingsFile(), JSON.stringify(s, null, 2));
}
function getApiKey() {
  const s = readSettings();
  if (!s.keyEnc) return "";
  try {
    const buf = Buffer.from(s.keyEnc, "base64");
    return s.keyPlain ? buf.toString("utf8") : safeStorage.decryptString(buf);
  } catch { return ""; }
}
function setApiKey(key) {
  const s = readSettings();
  if (!key) { delete s.keyEnc; delete s.keyPlain; }
  else if (safeStorage.isEncryptionAvailable()) { s.keyEnc = safeStorage.encryptString(key).toString("base64"); delete s.keyPlain; }
  else { s.keyEnc = Buffer.from(key, "utf8").toString("base64"); s.keyPlain = true; }
  writeSettings(s);
}

// ---------- saves: atomic write with a backup copy ----------
function writeSave(json) {
  fs.mkdirSync(dataDir(), { recursive: true });
  const tmp = saveFile() + ".tmp";
  fs.writeFileSync(tmp, json);
  if (fs.existsSync(saveFile())) fs.copyFileSync(saveFile(), saveFile() + ".bak");
  fs.renameSync(tmp, saveFile());
}
function readSave() {
  for (const f of [saveFile(), saveFile() + ".bak"]) {
    try { const raw = fs.readFileSync(f, "utf8"); JSON.parse(raw); return raw; } catch {}
  }
  return null;
}

// ---------- windows ----------
const iconPath = () => path.join(__dirname, "build", "icon.png");

function createFarm() {
  farmWin = new BrowserWindow({
    width: 1280, height: 820, minWidth: 820, minHeight: 560,
    title: "חוות הפיפים", backgroundColor: "#16221a", icon: iconPath(),
    autoHideMenuBar: true, show: !startHidden,
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false }
  });
  farmWin.loadFile(path.join(__dirname, "renderer", "index.html"));
  farmWin.webContents.setWindowOpenHandler(({ url }) => { require("electron").shell.openExternal(url); return { action: "deny" }; });
  farmWin.on("close", e => { if (!quitting) { e.preventDefault(); farmWin.hide(); } });
}
function showFarm() { if (!farmWin) createFarm(); farmWin.show(); farmWin.focus(); }

function createBuddy() {
  if (buddyWin) return;
  const wa = screen.getPrimaryDisplay().workArea, h = 110;
  buddyWin = new BrowserWindow({
    x: wa.x, y: wa.y + wa.height - h, width: wa.width, height: h,
    transparent: true, frame: false, resizable: false, movable: false, skipTaskbar: true,
    alwaysOnTop: true, focusable: false, hasShadow: false, backgroundColor: "#00000000",
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false }
  });
  buddyWin.setAlwaysOnTop(true, "screen-saver");
  buddyWin.setIgnoreMouseEvents(true, { forward: true });
  buddyWin.loadFile(path.join(__dirname, "renderer", "buddy.html"));
  buddyWin.webContents.on("did-finish-load", () => { if (lastSnapshot) buddyWin.webContents.send("snapshot", lastSnapshot); });
  buddyWin.on("closed", () => { buddyWin = null; });
}
function destroyBuddy() { if (buddyWin) { buddyWin.destroy(); buddyWin = null; } }
function applyBuddy() { readSettings().buddy ? createBuddy() : destroyBuddy(); refreshTray(); }

function applyAutostart() {
  const on = !!readSettings().autostart;
  if (process.platform === "win32") app.setLoginItemSettings({ openAtLogin: on, args: ["--hidden"] });
}

// ---------- tray ----------
function refreshTray() {
  if (!tray) return;
  const s = readSettings();
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "לפתוח את החווה", click: showFarm },
    ...(updateReady ? [{ label: `להתקין גרסה ${updateReady} ולהפעיל מחדש`, click: installUpdate }] : []),
    { label: "חברים על שולחן העבודה", type: "checkbox", checked: !!s.buddy, click: m => { writeSettings({ ...readSettings(), buddy: m.checked }); applyBuddy(); } },
    { type: "separator" },
    { label: "יציאה", click: () => { quitting = true; app.quit(); } }
  ]));
}
function createTray() {
  const img = nativeImage.createFromPath(path.join(__dirname, "build", "tray.png"));
  tray = new Tray(img.isEmpty() ? nativeImage.createFromPath(iconPath()) : img);
  tray.setToolTip("חוות הפיפים");
  tray.on("click", showFarm);
  refreshTray();
}

// ---------- auto-update from GitHub Releases ----------
// Checks on start and every 6 hours, downloads in the background, and installs when the app quits
// (or right away if the player presses the button in the farm or the tray).
function setupUpdates() {
  if (!app.isPackaged || process.env.PIPFARM_SMOKE) return;
  let autoUpdater;
  try { ({ autoUpdater } = require("electron-updater")); } catch (e) { console.error("updater missing", e); return; }
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on("error", err => console.error("update error", err && err.message));
  autoUpdater.on("update-downloaded", info => {
    updateReady = info.version;
    refreshTray();
    if (farmWin) farmWin.webContents.send("update", { version: info.version });
    if (Notification.isSupported()) {
      const n = new Notification({ title: "גרסה חדשה לחווה", body: `גרסה ${info.version} מוכנה. היא תותקן כשתסגור את החווה, או עכשיו מההגדרות`, icon: iconPath() });
      n.on("click", showFarm); n.show();
    }
  });
  const check = () => autoUpdater.checkForUpdates().catch(err => console.error("update check failed", err && err.message));
  setTimeout(check, 15000);
  setInterval(check, 6 * 60 * 60 * 1000);
  installUpdate = () => {
    // let the farm save first, then restart into the new version
    if (farmWin) farmWin.webContents.send("command", { type: "flush" });
    setTimeout(() => { quitting = true; autoUpdater.quitAndInstall(false, true); }, 800);
  };
}
let installUpdate = () => {};

// ---------- the keeper at the computer ----------
// Every 30 s look at how long the computer has been idle. When someone comes back after 10+ minutes,
// tell the farm so the pips can greet them.
function watchPresence() {
  let away = 0;
  setInterval(() => {
    let idle = 0;
    try { idle = powerMonitor.getSystemIdleTime(); } catch { return; }
    if (idle >= 600) away = Math.max(away, idle);
    else if (away && idle < 30) { if (farmWin) farmWin.webContents.send("presence", away / 60); away = 0; }
  }, 30000);
}

// ---------- IPC from the pages ----------
ipcMain.handle("app:info", () => ({ version: app.getVersion(), updateReady }));
ipcMain.on("update:install", () => installUpdate());
ipcMain.handle("save:load", () => readSave());
ipcMain.on("save:write", (_e, json) => { try { writeSave(json); } catch (err) { console.error("save failed", err); } });
ipcMain.handle("settings:get", () => { const s = readSettings(); return { buddy: !!s.buddy, autostart: !!s.autostart, letters: s.letters !== false, hasKey: !!getApiKey() }; });
ipcMain.handle("settings:set", (_e, patch) => {
  if ("apiKey" in patch) setApiKey(String(patch.apiKey || "").trim());
  const s = readSettings();
  if ("buddy" in patch) s.buddy = !!patch.buddy;
  if ("autostart" in patch) s.autostart = !!patch.autostart;
  if ("letters" in patch) s.letters = !!patch.letters;
  writeSettings(s); applyBuddy(); applyAutostart();
  return true;
});
ipcMain.on("notify", (_e, { title, body }) => {
  if (!Notification.isSupported()) return;
  const n = new Notification({ title: String(title).slice(0, 80), body: String(body).slice(0, 200), icon: iconPath(), silent: false });
  n.on("click", showFarm);
  n.show();
});
// letters from the pips: a .txt on the desktop. The name comes from a fixed id and a short title,
// existing files are never overwritten, and only plain text is written.
ipcMain.on("letter:write", (_e, { id, title, text }) => {
  try {
    if (readSettings().letters === false) return;
    if (!/^[a-z0-9-]{1,30}$/.test(String(id))) return;
    const clean = String(title).replace(/[\\/:*?"<>|\r\n\t]/g, "").slice(0, 40).trim() || "מכתב";
    const file = path.join(app.getPath("desktop"), `מכתב מהפיפים - ${clean}.txt`);
    if (fs.existsSync(file)) return;
    const body = "\ufeff" + String(text).slice(0, 4000).replace(/\r?\n/g, "\r\n") + "\r\n";
    fs.writeFileSync(file, body, { encoding: "utf8", flag: "wx" });
  } catch (err) { console.error("letter failed", err && err.message); }
});
ipcMain.on("snapshot", (_e, snap) => { lastSnapshot = snap; if (buddyWin) buddyWin.webContents.send("snapshot", snap); });
ipcMain.on("buddy:mouse", (_e, over) => { if (buddyWin) buddyWin.setIgnoreMouseEvents(!over, { forward: true }); });
ipcMain.on("buddy:command", (_e, cmd) => {
  if (!farmWin) return;
  if (cmd.type === "open") showFarm();
  farmWin.webContents.send("command", cmd);
});
ipcMain.handle("ask", async (_e, prompt) => {
  const key = getApiKey();
  if (!key) throw new Error("no key");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: 300, messages: [{ role: "user", content: String(prompt).slice(0, 8000) }] })
  });
  if (!res.ok) throw new Error("api " + res.status);
  const data = await res.json();
  return (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
});

// ---------- lifecycle ----------
app.on("second-instance", showFarm);
app.whenReady().then(() => {
  createFarm();
  createTray();
  applyBuddy();
  applyAutostart();
  setupUpdates();
  watchPresence();
  // developer self-check: PIPFARM_SMOKE=<folder> saves screenshots of both windows and quits
  if (process.env.PIPFARM_SMOKE) {
    const out = process.env.PIPFARM_SMOKE;
    createBuddy();
    setTimeout(async () => {
      try {
        fs.writeFileSync(path.join(out, "smoke-farm.png"), (await farmWin.webContents.capturePage()).toPNG());
        if (buddyWin) fs.writeFileSync(path.join(out, "smoke-buddy.png"), (await buddyWin.webContents.capturePage()).toPNG());
        fs.writeFileSync(path.join(out, "smoke-save.txt"), String((readSave() || "").length));
        await farmWin.webContents.executeJavaScript('pipDesktop.writeLetter("hello","שלום","שורה אחת\\nשורה שתיים");pipDesktop.writeLetter("bad/../x","רע","לא אמור להיכתב")');
        await new Promise(r => setTimeout(r, 500));
        fs.writeFileSync(path.join(out, "smoke-info.txt"), await farmWin.webContents.executeJavaScript('document.getElementById("optVersion").textContent+" | desk settings shown: "+!document.getElementById("deskSettings").hidden'));
      } catch (e) { fs.writeFileSync(path.join(out, "smoke-error.txt"), String(e && e.stack || e)); }
      quitting = true; app.quit();
    }, 12000);
  }
});
app.on("before-quit", () => { quitting = true; });
app.on("window-all-closed", () => { /* keep living in the tray */ });
