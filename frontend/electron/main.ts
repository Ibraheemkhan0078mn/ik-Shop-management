import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { cwd } from 'node:process'
import { autoUpdater } from 'electron-updater'
import { readFileSync } from 'node:fs'
import http from 'node:http'


const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Get app version from package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json')
const appVersion = JSON.parse(readFileSync(packageJsonPath, 'utf-8')).version

// ---- Force 1:1 DPI scaling ----
app.commandLine.appendSwitch("high-dpi-support", "1")
app.commandLine.appendSwitch("force-device-scale-factor", "1")

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST












function initAutoUpdater() {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = false // We'll install automatically when downloaded

  autoUpdater.on('update-available', () => {
    console.log('📦 Update available, downloading automatically...')
    win?.webContents.send('update-status', { status: 'available' })
    // Auto-download when update is available
    autoUpdater.downloadUpdate()
  })

  autoUpdater.on('update-not-available', () => {
    console.log('✅ No updates available')
    win?.webContents.send('update-status', { status: 'not-available' })
  })

  autoUpdater.on('download-progress', (progress) => {
    console.log(`⬇️ Downloading update: ${Math.floor(progress.percent)}%`)
    win?.webContents.send('update-status', { status: 'downloading', percent: Math.floor(progress.percent) })
  })

  autoUpdater.on('update-downloaded', () => {
    console.log('✅ Update downloaded, installing automatically...')
    win?.webContents.send('update-status', { status: 'downloaded' })
    // Auto-install when download is complete
    setTimeout(() => {
      autoUpdater.quitAndInstall()
    }, 2000) // Small delay to allow UI to show status
  })

  autoUpdater.on('error', (err) => {
    console.error('❌ Auto-updater error:', err.message)
    win?.webContents.send('update-status', { status: 'error', message: err.message })
  })
}









let win: BrowserWindow | null
let serverProcess: ReturnType<typeof spawn> | null = null
let startupRetryInterval: NodeJS.Timeout | null = null
let healthCheckInterval: NodeJS.Timeout | null = null
const BACKEND_PORT = 5001
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`

// Function to check if backend is running
function isBackendRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`${BACKEND_URL}/health`, (res) => {
      resolve(res.statusCode === 200)
      req.destroy()
    })
    req.on('error', () => resolve(false))
    req.setTimeout(2000, () => {
      req.destroy()
      resolve(false)
    })
  })
}

// Function to start backend server with retry logic
function startBackendServer() {
  if (serverProcess) return

  const entry = app.isPackaged
    ? path.join(process.resourcesPath, "backend.exe")
    : path.join(cwd(), "src", "backend.exe")

  serverProcess = spawn(entry, [], {
    cwd: path.dirname(entry),
    stdio: "inherit",
    shell: false,
    windowsHide: true
  })

  serverProcess.on("error", (err) => {
    console.error("❌ Failed to start backend:", err.message)
    serverProcess = null
  })

  serverProcess.on("exit", (code) => {
    console.warn("⚠️ Backend exited with code:", code)
    serverProcess = null
  })
}

// Function to start backend with retry interval
function startBackendWithRetry() {
  // Clear any existing retry interval
  if (startupRetryInterval) {
    clearInterval(startupRetryInterval)
    startupRetryInterval = null
  }

  // Try to start backend immediately
  startBackendServer()

  // Set up retry interval - check every 10 seconds
  startupRetryInterval = setInterval(async () => {
    const running = await isBackendRunning()
    if (running) {
      console.log("✅ Backend is running, stopping retry interval")
      clearInterval(startupRetryInterval!)
      startupRetryInterval = null
    } else {
      console.log("⚠️ Backend not running, attempting to start...")
      startBackendServer()
    }
  }, 10000) // 10 seconds
}

// Function to start health check interval (every 5 minutes)
function startHealthCheckInterval() {
  // Clear any existing health check interval
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval)
    healthCheckInterval = null
  }

  healthCheckInterval = setInterval(async () => {
    const running = await isBackendRunning()
    if (!running) {
      console.log("⚠️ Health check failed - backend is not running, restarting...")
      startBackendWithRetry()
    } else {
      console.log("� Health check passed - backend is running")
    }
  }, 300000) // 5 minutes (300000 ms)
}

// Function to cleanup intervals
function cleanupIntervals() {
  if (startupRetryInterval) {
    clearInterval(startupRetryInterval)
    startupRetryInterval = null
  }
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval)
    healthCheckInterval = null
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1500,
    height: 800,
    title: `SSI SOFT v${appVersion}`,
    icon: path.join(__dirname, '../public/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
      allowRunningInsecureContent: true
    },
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.setZoomFactor(1.0)
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

app.whenReady().then(() => {
  startBackendWithRetry() // Start backend with retry logic
  startHealthCheckInterval() // Start 5-minute health check interval
  createWindow()
  if (app.isPackaged) {
    initAutoUpdater()
    autoUpdater.checkForUpdates()
  }
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('before-quit', () => {
  cleanupIntervals()
  if (serverProcess) {
    serverProcess.kill()
    serverProcess = null
  }
})

app.on('window-all-closed', () => {
  cleanupIntervals()
  if (serverProcess) {
    serverProcess.kill()
    serverProcess = null
  }
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

ipcMain.handle("folder-picker", async () => {
  const result = await dialog.showOpenDialog({ properties: ["openDirectory"] })
  if (!result) return
  return result.filePaths[0]
})

ipcMain.handle('check-for-updates', async () => {
  try {
    const updateCheckResult = await autoUpdater.checkForUpdates()
    if (updateCheckResult && updateCheckResult !== null) {
      // Auto-download when update is found via manual check
      console.log('📦 Manual check found update, downloading automatically...')
      autoUpdater.downloadUpdate()
    }
    return {
      success: true,
      updateAvailable: updateCheckResult !== null,
      version: updateCheckResult?.updateInfo?.version || null,
      releaseNotes: updateCheckResult?.updateInfo?.releaseNotes || null
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
})

ipcMain.handle('download-update', async () => {
  autoUpdater.autoDownload = true
  autoUpdater.downloadUpdate()
})

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall()
})

ipcMain.handle('get-app-version', () => {
  return appVersion
})

// Zoom handlers
ipcMain.handle('set-zoom', async (_event, zoomLevel: number) => {
  if (win) {
    win.webContents.setZoomFactor(zoomLevel)
    return { success: true, zoomLevel }
  }
  return { success: false, error: 'No window available' }
})

ipcMain.handle('get-zoom', async () => {
  if (win) {
    return { success: true, zoomLevel: win.webContents.getZoomFactor() }
  }
  return { success: false, error: 'No window available' }
})












// import { app, BrowserWindow, ipcMain, dialog } from 'electron'
// import { fileURLToPath } from 'node:url'
// import path from 'node:path'
// import { spawn } from 'node:child_process'
// import { cwd } from 'node:process'
// import { autoUpdater } from 'electron-updater'
// import { existsSync } from 'node:fs'


// const __dirname = path.dirname(fileURLToPath(import.meta.url))

// // ---- Force 1:1 DPI scaling ----
// app.commandLine.appendSwitch("high-dpi-support", "1")
// app.commandLine.appendSwitch("force-device-scale-factor", "1")

// process.env.APP_ROOT = path.join(__dirname, '..')

// export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
// export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
// export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

// process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST












// function initAutoUpdater() {
//   autoUpdater.autoDownload = true
//   autoUpdater.autoInstallOnAppQuit = true

//   autoUpdater.on('update-available', () => {
//     win?.webContents.send('update-status', { status: 'available' })
//   })

//   autoUpdater.on('update-not-available', () => {
//     win?.webContents.send('update-status', { status: 'not-available' })
//   })

//   autoUpdater.on('download-progress', (progress) => {
//     win?.webContents.send('update-status', { status: 'downloading', percent: Math.floor(progress.percent) })
//   })

//   autoUpdater.on('update-downloaded', () => {
//     win?.webContents.send('update-status', { status: 'downloaded' })
//   })

//   autoUpdater.on('error', (err) => {
//     win?.webContents.send('update-status', { status: 'error', message: err.message })
//   })
// }









// let win: BrowserWindow | null
// let serverProcess: ReturnType<typeof spawn> | null = null

// function startBackendServer() {
//   if (serverProcess) return

//   const entry = app.isPackaged
//     ? path.join(process.resourcesPath, "backend.exe")
//     : path.join(cwd(), "..", "..", "backend", "index.js")

//   // Check if backend exists before trying to spawn
//   if (!existsSync(entry)) {
//     console.warn("⚠️ Backend not found at:", entry)
//     return
//   }

//   serverProcess = spawn("node", [entry], {
//     cwd: path.dirname(entry),
//     stdio: "inherit",
//     shell: false,
//     windowsHide: true
//   })

//   serverProcess.on("error", (err) => {
//     console.error("❌ Failed to start backend:", err.message)
//   })

//   serverProcess.on("exit", (code) => {
//     console.warn("⚠️ Backend exited with code:", code)
//     serverProcess = null
//   })
// }

// function createWindow() {
//   win = new BrowserWindow({
//     width: 1500,
//     height: 800,
//     icon: path.join(__dirname, '../public/icon.ico'),
//     webPreferences: {
//       preload: path.join(__dirname, 'preload.js'),
//       contextIsolation: true,
//       nodeIntegration: false,
//       webSecurity: false
//     },
//   })

//   win.webContents.on('did-finish-load', () => {
//     win?.webContents.setZoomFactor(1.0)
//     win?.webContents.send('main-process-message', (new Date).toLocaleString())
//   })

//   if (VITE_DEV_SERVER_URL) {
//     win.loadURL(VITE_DEV_SERVER_URL)
//   } else {
//     win.loadFile(path.join(RENDERER_DIST, 'index.html'))
//   }
// }

// app.whenReady().then(() => {
//   startBackendServer()
//   createWindow()
//   if (app.isPackaged) {
//     initAutoUpdater()
//     autoUpdater.checkForUpdates()
//   }
//   app.on('activate', () => {
//     if (BrowserWindow.getAllWindows().length === 0) {
//       createWindow()
//     }
//   })
// })

// app.on('before-quit', () => {
//   if (serverProcess) {
//     serverProcess.kill()
//     serverProcess = null
//   }
// })

// app.on('window-all-closed', () => {
//   if (serverProcess) {
//     serverProcess.kill()
//     serverProcess = null
//   }
//   if (process.platform !== 'darwin') {
//     app.quit()
//     win = null
//   }
// })

// ipcMain.handle("folder-picker", async () => {
//   const result = await dialog.showOpenDialog({ properties: ["openDirectory"] })
//   if (!result) return
//   return result.filePaths[0]
// })






// ipcMain.handle('install-update', () => {
//   autoUpdater.quitAndInstall()
// })




