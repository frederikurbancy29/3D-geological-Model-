'use strict';
(() => {
  // Full project records stay in IndexedDB. localStorage contains no new project data.
  const LEGACY='geolab-3d-project-v1';
  class Store {
    constructor(){this.db=null;this.memory=new Map();this.active=null;this.persistent=false;this.tail=Promise.resolve();}
    async open(){try{this.db=await new Promise((resolve,reject)=>{const r=indexedDB.open('geolab-workspace',1);r.onupgradeneeded=()=>{r.result.createObjectStore('projects',{keyPath:'id'});r.result.createObjectStore('settings');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});this.persistent=true;}catch(e){this.persistent=false;}
      let all=await this.list();let active=await this.setting('active');
      if(!all.length){let p;try{const old=localStorage.getItem(LEGACY);if(old)p=GeoWorkspace.normalize(JSON.parse(old));}catch(e){this.migrationError='Altes Projekt nicht lesbar. Die ursprüngliche Browserablage bleibt erhalten.';}p=p||GeoWorkspace.normalize(GeoCore.demo());await this.save(p);active=p.workspace.projectId;await this.setting('active',active);all=await this.list();}
      this.active=all.some(p=>p.id===active)?active:all[0].id;return (await this.get(this.active)).project;
    }
    transaction(name,mode,fn){return new Promise((resolve,reject)=>{const tx=this.db.transaction(name,mode),r=fn(tx.objectStore(name));let result;r.onsuccess=()=>{result=r.result;};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error||r.error);tx.onabort=()=>reject(tx.error||new Error('Speichern abgebrochen.'));});}
    async setting(key,value){if(!this.db){if(value!==undefined)this[key]=value;return this[key];}return this.transaction('settings',value===undefined?'readonly':'readwrite',s=>value===undefined?s.get(key):s.put(value,key));}
    async list(){const rows=this.db?await this.transaction('projects','readonly',s=>s.getAll()):[...this.memory.values()];return rows.map(({project,...meta})=>meta).sort((a,b)=>b.updated.localeCompare(a.updated));}
    async get(id){return this.db?this.transaction('projects','readonly',s=>s.get(id)):this.memory.get(id);}
    save(project){const copy=GeoCore.clone(project),record={id:copy.workspace.projectId,name:copy.metadata.name,archived:!!copy.workspace.archived,updated:new Date().toISOString(),project:copy};const write=async()=>{if(this.db)await this.transaction('projects','readwrite',s=>s.put(record));else this.memory.set(record.id,record);return record;};const task=this.tail.then(write);this.tail=task.catch(()=>{});return task;}
    async activate(id){await this.tail;const row=await this.get(id);if(!row)throw new Error('Projekt nicht gefunden.');this.active=id;await this.setting('active',id);return GeoWorkspace.normalize(row.project);}
  }
  globalThis.GeoProjectStore=new Store();
})();
