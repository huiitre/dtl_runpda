import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { homedir } from 'os';
import { readFileSync, existsSync, writeFileSync } from 'fs';

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    webPreferences: {
      contextIsolation: false, // Désactiver pour simplifier
      nodeIntegration: true, // Activer Node.js dans le rendu
    },
  });

  mainWindow.loadFile(join(process.cwd(), 'config-electron', 'index.html'));

  // mainWindow.webContents.openDevTools();

  // Envoyer utils.config au rendu
  mainWindow.webContents.once('did-finish-load', () => {
    const configDir = join(homedir(), 'dtl_runpda');
    const jsonPath = join(configDir, 'config.json');

    if (existsSync(jsonPath)) {
      try {
        const config = JSON.parse(readFileSync(jsonPath, 'utf-8'));
        mainWindow.webContents.send('send-config', config); // Envoyer au rendu
      } catch (err) {
        console.error("Erreur lors de la lecture du fichier JSON :", err);
        mainWindow.webContents.send('send-config', { error: 'Invalid JSON format' });
      }
    } else {
      console.error("Fichier JSON introuvable :", jsonPath);
      mainWindow.webContents.send('send-config', { error: 'File not found' });
    }
  });
});

ipcMain.on('close-window', (event, data) => {
  const configDir = join(homedir(), 'dtl_runpda');
  const jsonPath = join(configDir, 'config.json');

  if (existsSync(jsonPath)) {
    try {
      // Lire le fichier JSON existant
      const currentConfig = JSON.parse(readFileSync(jsonPath, 'utf-8'));

      // Mettre à jour les valeurs dans le JSON
      data.forEach(({ key, value }) => {
        if (currentConfig[key] !== undefined) {
          currentConfig[key].value = value; // Modifier la propriété `value`
        }
      });

      // Écrire les modifications dans le fichier
      writeFileSync(jsonPath, JSON.stringify(currentConfig, null, 2), 'utf-8');
      console.log(`Modifications effectuées !`)

      // Optionnel : renvoyer une confirmation au rendu
      // event.sender.send('update-success', { success: true });
      if (mainWindow) mainWindow.close();
    } catch (err) {
      console.error("Erreur lors de la mise à jour du JSON :", err);
      // event.sender.send('update-success', { success: false, error: err.message });
      if (mainWindow) mainWindow.close();
    }
  } else {
    console.error("Fichier JSON introuvable :", jsonPath);
    // event.sender.send('update-success', { success: false, error: 'File not found' });
    if (mainWindow) mainWindow.close();
  }
});