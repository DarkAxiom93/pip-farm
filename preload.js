// Narrow, safe bridge between the pages and the desktop shell.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pipDesktop", {
  load: () => ipcRenderer.invoke("save:load"),
  save: json => ipcRenderer.send("save:write", String(json)),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  setSettings: patch => ipcRenderer.invoke("settings:set", patch),
  notify: (title, body) => ipcRenderer.send("notify", { title, body }),
  ask: prompt => ipcRenderer.invoke("ask", String(prompt)),
  snapshot: snap => ipcRenderer.send("snapshot", snap),
  onCommand: fn => ipcRenderer.on("command", (_e, cmd) => fn(cmd)),
  appInfo: () => ipcRenderer.invoke("app:info"),
  onUpdate: fn => ipcRenderer.on("update", (_e, info) => fn(info)),
  installUpdate: () => ipcRenderer.send("update:install"),
  // used by the desktop buddies strip
  onSnapshot: fn => ipcRenderer.on("snapshot", (_e, snap) => fn(snap)),
  buddyMouse: over => ipcRenderer.send("buddy:mouse", !!over),
  buddyCommand: cmd => ipcRenderer.send("buddy:command", cmd)
});
