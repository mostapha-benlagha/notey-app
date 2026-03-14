const path = require("node:path");
const { app, BrowserWindow, Menu, Tray, nativeImage } = require("electron");

const isDev = !app.isPackaged;
const devServerUrl = "http://127.0.0.1:3000/app";

let mainWindow = null;
let tray = null;
let isQuitting = false;
let trayNoticeShown = false;

function createTrayIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="20" fill="#FDF9F2"/>
      <rect x="8" y="8" width="48" height="48" rx="16" fill="#1663C7"/>
      <rect x="18" y="18" width="28" height="28" rx="8" fill="#FFFFFF"/>
      <rect x="24" y="26" width="16" height="4" rx="2" fill="#D8E9FB"/>
      <rect x="24" y="34" width="12" height="4" rx="2" fill="#D8E9FB"/>
      <circle cx="40" cy="40" r="6" fill="#1663C7"/>
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

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1520,
    height: 980,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: "#fdfaf5",
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
