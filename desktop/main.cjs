const path = require("node:path");
const fs = require("node:fs");
const { app, BrowserWindow, Menu, Tray, nativeImage } = require("electron");

const isDev = !app.isPackaged;
const devServerUrl = "http://127.0.0.1:3000/app";

let mainWindow = null;
let tray = null;
let isQuitting = false;
let trayNoticeShown = false;

function getTrayIconPath() {
  return path.join(__dirname, "assets", "tray-icon.png");
}

function createTrayIcon() {
  const iconPath = getTrayIconPath();
  if (fs.existsSync(iconPath)) {
    return nativeImage.createFromPath(iconPath);
  }
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
      <rect x="32" y="32" width="960" height="960" rx="220" fill="#071942"/>
      <circle cx="320" cy="512" r="120" fill="#2F80ED"/>
      <rect x="440" y="488" width="170" height="48" rx="24" fill="#EDEDED"/>
      <circle cx="704" cy="512" r="120" fill="#84C341"/>
    </svg>
  `;
  return nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`);
}

function getRendererEntry() {
  if (isDev) {
    return devServerUrl;
  }

  return path.join(process.resourcesPath, "frontend-dist", "index.html");
}

function createTray() {
  tray = new Tray(createTrayIcon());
  tray.setToolTip("Notey");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Open Notey",
        click: () => {
          if (!mainWindow) {
            createMainWindow();
            return;
          }

          mainWindow.show();
          mainWindow.focus();
        },
      },
      {
        label: "Quit",
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]),
  );

  tray.on("click", () => {
    if (!mainWindow) {
      createMainWindow();
      return;
    }

    if (mainWindow.isVisible()) {
      mainWindow.focus();
      return;
    }

    mainWindow.show();
    mainWindow.focus();
  });
}

function getAppIconPath() {
  const pngPath = path.join(__dirname, "assets", "tray-icon.png");
  if (fs.existsSync(pngPath)) {
    return pngPath;
  }
  return path.join(__dirname, "..", "frontend", "public", "icons", "notey-app-icon.svg");
}

function createMainWindow() {
  const iconPath = getAppIconPath();
  mainWindow = new BrowserWindow({
    width: 1520,
    height: 980,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: "#fdfaf5",
    icon: iconPath,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const entry = getRendererEntry();

  if (isDev) {
    mainWindow.loadURL(entry);
  } else {
    mainWindow.loadFile(entry);
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("close", (event) => {
    if (isQuitting) {
      return;
    }

    event.preventDefault();
    mainWindow?.hide();

    if (!trayNoticeShown) {
      trayNoticeShown = true;
      tray?.displayBalloon?.({
        iconType: "info",
        title: "Notey is still running",
        content: "Notey was minimized to the system tray.",
      });
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

const singleInstanceLock = app.requestSingleInstanceLock();

if (!singleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) {
      createMainWindow();
      return;
    }

    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.focus();
  });

  app.whenReady().then(() => {
    createTray();
    createMainWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
        return;
      }

      mainWindow?.show();
    });
  });
}

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
});
