const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('node:path');
let win;
app.setAppUserModelId('com.zerocycletrainer.app');
function send(state,message){if(win&&!win.isDestroyed())win.webContents.send('update-status',{state,message});}
function createWindow(){
 win=new BrowserWindow({width:1300,height:900,minWidth:840,minHeight:620,backgroundColor:'#0b1219',title:'Zero Cycle Trainer',icon:path.join(__dirname,'assets','icon.ico'),webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 win.loadFile(path.join(__dirname,'index.html'));
 win.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith('https://'))shell.openExternal(url);return {action:'deny'};});
 win.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith('file://')){event.preventDefault();if(url.startsWith('https://'))shell.openExternal(url);}});
}
autoUpdater.autoDownload=true;
autoUpdater.autoInstallOnAppQuit=false;
autoUpdater.on('checking-for-update',()=>send('checking','Söker efter uppdateringar…'));
autoUpdater.on('update-available',info=>send('available',`Version ${info.version} hittades. Laddar ner…`));
autoUpdater.on('update-not-available',()=>send('current',`Du har senaste versionen (${app.getVersion()}).`));
autoUpdater.on('download-progress',p=>send('downloading',`Laddar ner uppdatering: ${Math.round(p.percent)} %`));
autoUpdater.on('update-downloaded',info=>send('downloaded',`Version ${info.version} är klar att installeras.`));
autoUpdater.on('error',err=>send('error',`Uppdateringsfel: ${err.message}`));
ipcMain.handle('updates:check',async()=>{
 if(!app.isPackaged){send('dev','Uppdateringar kan testas i den installerade appen.');return}
 try{await autoUpdater.checkForUpdates()}catch(err){send('error',`Kunde inte kontrollera uppdateringar: ${err.message}`)}
});
ipcMain.on('updates:install',()=>{autoUpdater.quitAndInstall(false,true)});
app.whenReady().then(()=>{createWindow();win.webContents.once('did-finish-load',()=>{setTimeout(()=>{if(app.isPackaged)autoUpdater.checkForUpdates().catch(err=>send('error',err.message));},1500)});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
