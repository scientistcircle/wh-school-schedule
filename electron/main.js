const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let mainWindow;
let tray;

// URL untuk development (Vite)
const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';

// Fungsi membuat jendela aplikasi
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../public/logo.png'), // Ikon aplikasi
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadURL(startUrl);

  // Jika user klik X (tutup), jangan matikan aplikasi, tapi sembunyikan ke Tray
  mainWindow.on('close', function (event) {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

// Fungsi membuat ikon di Taskbar (System Tray)
function createTray() {
  // Gunakan logo Anda sebagai ikon tray
  const icon = nativeImage.createFromPath(path.join(__dirname, '../public/logo.png'));
  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Buka WH Schedule', 
      click: () => { mainWindow.show(); } 
    },
    { 
      label: 'Keluar', 
      click: () => { 
        app.isQuiting = true; 
        app.quit(); 
      } 
    }
  ]);

  tray.setToolTip('WH School Schedule');
  tray.setContextMenu(contextMenu);

  // Klik 2x pada ikon tray untuk membuka aplikasi
  tray.on('double-click', () => {
    mainWindow.show();
  });
}

// AUTO RUN SAAT LAPTOP MENYALA
function enableAutoStart() {
  app.setLoginItemSettings({
    openAtLogin: true,
    path: app.getPath('exe') // Mendaftarkan file .exe aplikasi ini ke Windows Startup
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  enableAutoStart();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});