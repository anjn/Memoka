"use strict";var M=Object.defineProperty;var v=(n,t,e)=>t in n?M(n,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):n[t]=e;var u=(n,t,e)=>(v(n,typeof t!="symbol"?t+"":t,e),e);Object.defineProperty(exports,Symbol.toStringTag,{value:"Module"});const a=require("electron"),x=require("node:module"),C=require("node:url"),d=require("node:path"),j=require("better-sqlite3"),D=require("path"),h=require("fs");var E=typeof document<"u"?document.currentScript:null;const i=[];for(let n=0;n<256;++n)i.push((n+256).toString(16).slice(1));function k(n,t=0){return(i[n[t+0]]+i[n[t+1]]+i[n[t+2]]+i[n[t+3]]+"-"+i[n[t+4]]+i[n[t+5]]+"-"+i[n[t+6]]+i[n[t+7]]+"-"+i[n[t+8]]+i[n[t+9]]+"-"+i[n[t+10]]+i[n[t+11]]+i[n[t+12]]+i[n[t+13]]+i[n[t+14]]+i[n[t+15]]).toLowerCase()}let S;const V=new Uint8Array(16);function q(){if(!S){if(typeof crypto>"u"||!crypto.getRandomValues)throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");S=crypto.getRandomValues.bind(crypto)}return S(V)}const $=typeof crypto<"u"&&crypto.randomUUID&&crypto.randomUUID.bind(crypto),A={randomUUID:$};function L(n,t,e){var o;if(A.randomUUID&&!t&&!n)return A.randomUUID();n=n||{};const r=n.random??((o=n.rng)==null?void 0:o.call(n))??q();if(r.length<16)throw new Error("Random bytes length must be >= 16");if(r[6]=r[6]&15|64,r[8]=r[8]&63|128,t){if(e=e||0,e<0||e+16>t.length)throw new RangeError(`UUID byte range ${e}:${e+15} is out of buffer bounds`);for(let s=0;s<16;++s)t[e+s]=r[s];return t}return k(r)}const l=class l{constructor(){u(this,"db");const t=D.join(a.app.getPath("userData"),"memoka.db");this.db=new j(t),this.init()}static getInstance(){return l.instance||(l.instance=new l),l.instance}init(){this.db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS note_tags (
        note_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        PRIMARY KEY (note_id, tag_id),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );
    `)}getDb(){return this.db}close(){this.db.close()}};u(l,"instance");let N=l;class U{constructor(){u(this,"db",N.getInstance().getDb())}findAll(){return this.db.prepare(`
      SELECT id, title, content, created_at as createdAt, updated_at as updatedAt
      FROM notes
      ORDER BY updated_at DESC
    `).all().map(r=>{const o=this.getTagsForNote(r.id);return{...r,tags:o}})}findById(t){const r=this.db.prepare(`
      SELECT id, title, content, created_at as createdAt, updated_at as updatedAt
      FROM notes
      WHERE id = ?
    `).get(t);if(!r)return null;const o=this.getTagsForNote(t);return{...r,tags:o}}create(t){const e=L(),r=Date.now();return this.db.prepare(`
      INSERT INTO notes (id, title, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(e,t.title,t.content,r,r),this.saveTags(e,t.tags),{id:e,title:t.title,content:t.content,createdAt:new Date(r),updatedAt:new Date(r),tags:t.tags}}update(t,e){const r=this.findById(t);if(!r)return null;const o=Date.now(),s={...r,...e,updatedAt:new Date(o)};return this.db.prepare(`
      UPDATE notes
      SET title = ?, content = ?, updated_at = ?
      WHERE id = ?
    `).run(s.title,s.content,o,t),e.tags&&this.saveTags(t,e.tags),s}delete(t){return this.db.prepare("DELETE FROM notes WHERE id = ?").run(t).changes>0}getTagsForNote(t){return this.db.prepare(`
      SELECT t.name
      FROM tags t
      JOIN note_tags nt ON t.id = nt.tag_id
      WHERE nt.note_id = ?
    `).all(t).map(o=>o.name)}saveTags(t,e){if(this.db.prepare("DELETE FROM note_tags WHERE note_id = ?").run(t),e.length===0)return;const o=this.db.prepare("INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)"),s=this.db.prepare("INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)");this.db.transaction(p=>{for(const T of p){const f=L();o.run(f,T);const F=this.db.prepare("SELECT id FROM tags WHERE name = ?").get(T);s.run(t,F.id)}})(e)}}const I=class I{static async readFile(t){try{return await h.promises.readFile(t,"utf-8")}catch(e){throw console.error("Error reading file:",e),e}}static async writeFile(t,e){try{const r=D.dirname(t);await h.promises.mkdir(r,{recursive:!0}),await h.promises.writeFile(t,e,"utf-8")}catch(r){throw console.error("Error writing file:",r),r}}static async deleteFile(t){try{await h.promises.unlink(t)}catch(e){throw console.error("Error deleting file:",e),e}}static async listFiles(t){try{return await h.promises.readdir(t)}catch(e){throw console.error("Error listing files:",e),e}}static getAppDataPath(t=""){return D.join(I.userDataPath,t)}};u(I,"userDataPath",a.app.getPath("userData"));let w=I;class B{constructor(){u(this,"noteRepository",new U)}async exportNotes(t){const e=this.noteRepository.findAll(),r=JSON.stringify(e,null,2);await w.writeFile(t,r)}async importNotes(t){const e=await w.readFile(t),r=JSON.parse(e),o=[];for(const s of r){const c=this.noteRepository.create(s);o.push(c)}return o}async exportNoteAsMarkdown(t,e){const r=this.convertNoteToMarkdown(t);await w.writeFile(e,r)}convertNoteToMarkdown(t){const e=`# ${t.title}

`,r=t.tags.length>0?`Tags: ${t.tags.join(", ")}

`:"",o=t.content;return`${e}${r}${o}`}}const g=new U,_=new B;function W(){a.ipcMain.handle("notes:getAll",async()=>{try{return g.findAll()}catch(n){throw console.error("Error getting all notes:",n),n}}),a.ipcMain.handle("notes:getById",async(n,t)=>{try{return g.findById(t)}catch(e){throw console.error(`Error getting note by id ${t}:`,e),e}}),a.ipcMain.handle("notes:create",async(n,t)=>{try{return g.create(t)}catch(e){throw console.error("Error creating note:",e),e}}),a.ipcMain.handle("notes:update",async(n,t,e)=>{try{return g.update(t,e)}catch(r){throw console.error(`Error updating note ${t}:`,r),r}}),a.ipcMain.handle("notes:delete",async(n,t)=>{try{return g.delete(t)}catch(e){throw console.error(`Error deleting note ${t}:`,e),e}}),a.ipcMain.handle("notes:export",async()=>{try{const{filePath:n}=await a.dialog.showSaveDialog({title:"Export Notes",defaultPath:"memoka-notes.json",filters:[{name:"JSON Files",extensions:["json"]}]});return n?(await _.exportNotes(n),!0):!1}catch(n){throw console.error("Error exporting notes:",n),n}}),a.ipcMain.handle("notes:import",async()=>{try{const{filePaths:n}=await a.dialog.showOpenDialog({title:"Import Notes",filters:[{name:"JSON Files",extensions:["json"]}],properties:["openFile"]});return n.length===0?[]:await _.importNotes(n[0])}catch(n){throw console.error("Error importing notes:",n),n}}),a.ipcMain.handle("notes:exportAsMarkdown",async(n,t)=>{try{const{filePath:e}=await a.dialog.showSaveDialog({title:"Export Note as Markdown",defaultPath:`${t.title}.md`,filters:[{name:"Markdown Files",extensions:["md"]}]});return e?(await _.exportNoteAsMarkdown(t,e),!0):!1}catch(e){throw console.error("Error exporting note as markdown:",e),e}}),a.ipcMain.handle("notes:importMarkdown",async()=>{try{const{filePaths:n}=await a.dialog.showOpenDialog({title:"Import Markdown",filters:[{name:"Markdown Files",extensions:["md"]}],properties:["openFile","multiSelections"]});if(n.length===0)return[];const t=[],e=require("fs"),r=require("path"),{markdownToHtml:o}=require("../../renderer/utils/markdownUtils");for(const s of n){const c=e.readFileSync(s,"utf-8"),p=r.basename(s,".md"),T=o(c),f=g.create({title:p,content:T,tags:["imported"]});t.push(f)}return t}catch(n){throw console.error("Error importing markdown:",n),n}}),a.ipcMain.handle("notes:uploadImage",async()=>{try{const{app:n}=require("electron"),t=require("fs"),e=require("path"),{filePaths:r}=await a.dialog.showOpenDialog({title:"Upload Image",filters:[{name:"Images",extensions:["jpg","jpeg","png","gif","svg"]}],properties:["openFile"]});if(r.length===0)return null;const o=r[0],s=e.basename(o),c=e.join(n.getPath("userData"),"images");await t.promises.mkdir(c,{recursive:!0});const p=e.join(c,s);return await t.promises.copyFile(o,p),{filePath:`file://${p}`,fileName:s}}catch(n){throw console.error("Error uploading image:",n),n}})}x.createRequire(typeof document>"u"?require("url").pathToFileURL(__filename).href:E&&E.tagName.toUpperCase()==="SCRIPT"&&E.src||new URL("main.js",document.baseURI).href);const b=d.dirname(C.fileURLToPath(typeof document>"u"?require("url").pathToFileURL(__filename).href:E&&E.tagName.toUpperCase()==="SCRIPT"&&E.src||new URL("main.js",document.baseURI).href));process.env.APP_ROOT=d.join(b,"..");const y=process.env.VITE_DEV_SERVER_URL,X=d.join(process.env.APP_ROOT,"dist-electron"),O=d.join(process.env.APP_ROOT,"dist");process.env.VITE_PUBLIC=y?d.join(process.env.APP_ROOT,"public"):O;let m,R=null;function P(){m=new a.BrowserWindow({icon:d.join(process.env.VITE_PUBLIC,"electron-vite.svg"),width:1200,height:800,webPreferences:{preload:d.join(b,"preload.mjs"),nodeIntegration:!1,contextIsolation:!0}}),y?(m.loadURL(y),m.webContents.openDevTools()):m.loadFile(d.join(O,"index.html"))}function H(){R=N.getInstance(),W()}a.app.on("window-all-closed",()=>{process.platform!=="darwin"&&(R&&(R.close(),R=null),a.app.quit(),m=null)});a.app.on("activate",()=>{a.BrowserWindow.getAllWindows().length===0&&P()});a.app.whenReady().then(()=>{H(),P()});exports.MAIN_DIST=X;exports.RENDERER_DIST=O;exports.VITE_DEV_SERVER_URL=y;
