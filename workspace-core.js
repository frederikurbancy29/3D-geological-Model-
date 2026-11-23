'use strict';
(() => {
  const C=GeoCore, clone=C.clone;
  const fail=m=>{throw new Error(m);};
  const uuid=()=>globalThis.crypto?.randomUUID?.()||'id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  const systems={
    LOCAL:{name:'Lokales metrisches System',family:'local',projected:true},
    'EPSG:25832':{name:'ETRS89 / UTM 32N',family:'ETRS89',projected:true,zone:32},
    'EPSG:25833':{name:'ETRS89 / UTM 33N',family:'ETRS89',projected:true,zone:33},
    'EPSG:4258':{name:'ETRS89 · Länge / Breite',family:'ETRS89',projected:false},
    'EPSG:32632':{name:'WGS 84 / UTM 32N',family:'WGS84',projected:true,zone:32},
    'EPSG:32633':{name:'WGS 84 / UTM 33N',family:'WGS84',projected:true,zone:33},
    'EPSG:4326':{name:'WGS 84 · Länge / Breite',family:'WGS84',projected:false}
  };
  proj4.defs('EPSG:4258','+proj=longlat +ellps=GRS80 +no_defs');
  for(const z of [32,33])proj4.defs('EPSG:258'+z,'+proj=utm +zone='+z+' +ellps=GRS80 +units=m +no_defs');
  const verticals={LOCAL:'Lokaler / noch offener Höhenbezug','EPSG:7837':'DHHN2016 · m NHN',ELLIPSOIDAL:'Ellipsoidische Höhe (zum Lagedatum)'};
  const kinds={terrain:'Höhenmodell',layers:'Rahmenschicht',bodies:'Geologischer Körper',paleosurfaces:'Paläorelief',boreholes:'Bohrung',gisLayers:'Geoinformationslayer',seismicProfiles:'Seismikprofil',faults:'Störungsfläche',rasterLayers:'2D-Messraster'};
  function entries(p){const out=[];if(p.terrain)out.push({key:'terrain:terrain',type:'terrain',id:'terrain',object:p.terrain});for(const type of Object.keys(kinds).filter(k=>k!=='terrain'))for(const object of p[type]||[])out.push({key:type+':'+object.id,type,id:object.id,object});return out;}
  const find=(p,key)=>entries(p).find(e=>e.key===key);
  const groupName=value=>{if(typeof value!=='string'||!value.trim()||value.trim().length>100)fail('Gruppenname: bitte 1 bis 100 Zeichen eingeben.');return value.trim();};
  const sameName=(a,b)=>a.toLocaleLowerCase('de')===b.toLocaleLowerCase('de');
  const groupObjects=p=>[...entries(p),...(p.workspace.detached||[])].map(e=>e.object);
  function ensureGroup(p,name){name=groupName(name);let g=p.workspace.groups.find(g=>sameName(g.name,name));if(!g){if(p.workspace.groups.length>=500)fail('Maximal 500 Gruppen pro Projekt.');g={id:uuid(),name,collapsed:false};p.workspace.groups.push(g);}return g;}
  function createGroup(p,name){name=groupName(name);if(p.workspace.groups.some(g=>sameName(g.name,name)))fail('Eine Gruppe mit diesem Namen ist bereits vorhanden.');return ensureGroup(p,name);}
  function renameGroup(p,id,name){name=groupName(name);const g=p.workspace.groups.find(g=>g.id===id);if(!g)fail('Gruppe nicht gefunden.');if(p.workspace.groups.some(g=>g.id!==id&&sameName(g.name,name)))fail('Eine Gruppe mit diesem Namen ist bereits vorhanden.');for(const o of groupObjects(p))if(o.workspace?.groupId===id){o.workspace.group=name;}g.name=name;return g;}
  function moveLayerToGroup(p,key,id){const e=find(p,key),g=p.workspace.groups.find(g=>g.id===id);if(!e||!g)fail('Layer oder Zielgruppe nicht gefunden.');e.object.workspace.groupId=g.id;e.object.workspace.group=g.name;}
  function assignGroupMembers(p,id,keys){const g=p.workspace.groups.find(g=>g.id===id);if(!g)fail('Gruppe nicht gefunden.');if(!Array.isArray(keys)||keys.some(k=>!find(p,k)))fail('Die Layerauswahl enthält einen unbekannten Layer.');const selected=new Set(keys),removed=entries(p).filter(e=>e.object.workspace.groupId===id&&!selected.has(e.key));const fallback=removed.length?ensureGroup(p,sameName(g.name,'Unsortierte Layer')?'Modellinhalt':'Unsortierte Layer'):null;for(const e of entries(p)){if(selected.has(e.key))moveLayerToGroup(p,e.key,id);else if(removed.some(r=>r.key===e.key))moveLayerToGroup(p,e.key,fallback.id);}}
  function removeGroup(p,id){const g=p.workspace.groups.find(g=>g.id===id);if(!g)fail('Gruppe nicht gefunden.');const members=groupObjects(p).filter(o=>o.workspace?.groupId===id),fallback=members.length?ensureGroup(p,sameName(g.name,'Unsortierte Layer')?'Modellinhalt':'Unsortierte Layer'):null;for(const o of members){o.workspace.groupId=fallback.id;o.workspace.group=fallback.name;}p.workspace.groups=p.workspace.groups.filter(g=>g.id!==id);}
  function normalize(input){
    const p=C.validate(input);
    p.reference=p.reference||{horizontal:p.metadata.synthetic&&p.metadata.crs.includes('25832')?'EPSG:25832':'LOCAL',vertical:'LOCAL',confirmed:false,epoch:'',note:p.metadata.synthetic?'Fiktive Demo-Lage und Höhen.':'Raumbezug der Altdatei noch nicht bestätigt.'};
    if(!systems[p.reference.horizontal]?.projected)fail('Das Projekt benötigt einen unterstützten metrischen Lagebezug. Geografische Koordinaten beim Import umrechnen.');
    if(!verticals[p.reference.vertical])fail('Unbekannter Höhenbezug.');
    p.workspace=p.workspace||{};p.workspace.schema=2;p.workspace.projectId=p.workspace.projectId||uuid();
    for(const key of ['measurements','history','sources','detached','bookmarks','groups','tools'])if(!Array.isArray(p.workspace[key]))p.workspace[key]=[];
    const groupIds=new Set(),groupNames=new Set();for(const g of p.workspace.groups){g.name=groupName(g.name);if(typeof g.id!=='string'||!g.id||groupIds.has(g.id)||groupNames.has(g.name.toLocaleLowerCase('de')))fail('Gruppen benötigen eindeutige IDs und Namen.');groupIds.add(g.id);groupNames.add(g.name.toLocaleLowerCase('de'));g.collapsed=g.collapsed===true;}if(p.workspace.groups.length>500)fail('Maximal 500 Gruppen pro Projekt.');
    p.workspace.revision=Number.isInteger(p.workspace.revision)?p.workspace.revision:0;
    for(const e of entries(p)){const o=e.object;o.properties=o.properties||{};o.workspace=o.workspace||{};o.workspace.group=o.workspace.group||kinds[e.type];o.workspace.status=o.workspace.status||(p.metadata.synthetic?'synthetisch':e.type==='boreholes'?'beobachtet':'interpretiert');o.workspace.source=o.workspace.source||(p.metadata.synthetic?'Erfundener Demonstrationsdatensatz':'');o.workspace.locked=o.workspace.locked===true;if(o.workspace.uncertainty_m!=null&&(!Number.isFinite(o.workspace.uncertainty_m)||o.workspace.uncertainty_m<0))fail('Lageunsicherheit muss eine nichtnegative Zahl sein.');if(e.type==='gisLayers'){for(const f of o.features){if(f.type==='Polygon')simpleRing(f.coordinates);for(const field of o.fields||[]){const v=f.properties?.[field.name];if(v!=null&&typeof v!==field.type)fail('Attribut '+field.name+': Datentyp passt nicht zur Felddefinition.');}}}}
    for(const o of groupObjects(p)){o.workspace=o.workspace||{};const g=p.workspace.groups.find(g=>g.id===o.workspace.groupId)||ensureGroup(p,o.workspace.group||'Unsortierte Layer');o.workspace.group=g.name;o.workspace.groupId=g.id;}
    if(globalThis.GeoFieldData)for(const b of p.boreholes)b.end_depth=b.end_depth??b.intervals.at(-1).to;
    if(globalThis.GeoFieldData)for(const r of p.rasterLayers||[]){if(!systems[r.sourceCRS])fail('Raster-Lagebezug wird noch nicht unterstützt: '+r.sourceCRS);for(const [i,j]of [[0,0],[r.width,0],[r.width,r.height],[0,r.height]]){const q=GeoFieldData.rasterPoint(p,r,i,j);if(r.placement==='terrain'&&C.terrainAt(p,...q)===null)fail('2D-Layer auf Gelände: Die Ausdehnung liegt außerhalb des Höhenmodells. Feste Darstellungshöhe wählen.');}}
    return p;
  }
  function transform(c,from,to,verticalFrom,verticalTo){
    if(!systems[from]||!systems[to])fail('Dieses Koordinatensystem wird noch nicht unterstützt.');
    if(verticalFrom!==verticalTo)fail('Unterschiedliche Höhenbezüge: Ohne passendes Höhenmodell wird Z nicht umgerechnet. Daten vorher fachlich transformieren.');
    if(systems[from].family!==systems[to].family)fail('Ein Wechsel des geodätischen Datums wird ohne geeignete Transformationsparameter nicht ausgeführt. WGS84 und ETRS89 werden nicht gleichgesetzt.');
    if(!Array.isArray(c)||c.length<2||!c.slice(0,2).every(Number.isFinite)||c[2]!=null&&!Number.isFinite(c[2]))fail('Ungültige Koordinate.');
    if(!systems[from].projected&&(Math.abs(c[0])>180||Math.abs(c[1])>90))fail('Länge/Breite außerhalb des gültigen Bereichs. Reihenfolge ist Länge, Breite.');
    if(from===to)return [...c];
    const geo=systems[from].projected?proj4(from,systems[from].family==='ETRS89'?'EPSG:4258':'EPSG:4326',c.slice(0,2)):c;
    if(systems[to].zone&&(geo[1]<0||geo[1]>84||Math.abs(geo[0]-(systems[to].zone*6-183))>3.000001))fail('Koordinate liegt außerhalb des regulären Gebiets dieser UTM-Zone (Nordhalbkugel, Meridian ±3°). Passende Projektzone wählen.');
    const q=proj4(from,to,c.slice(0,2));if(!q.every(Number.isFinite))fail('Projektion ist für diese Koordinate nicht gültig.');
    return [q[0],q[1],c[2]??null];
  }
  function geographic(c,ref){const sys=systems[ref.horizontal];if(!sys||sys.family==='local')fail('Für ellipsoidische Messungen ist ein bekannter Lagebezug erforderlich.');return transform(c,ref.horizontal,sys.family==='ETRS89'?'EPSG:4258':'EPSG:4326',ref.vertical,ref.vertical);}
  function geod(ref){return systems[ref.horizontal]?.family==='ETRS89'?new geodesic.Geodesic.Geodesic(6378137,1/298.257222101):geodesic.Geodesic.WGS84;}
  const distance=(a,b,three=false)=>Math.hypot(b[0]-a[0],b[1]-a[1],three?b[2]-a[2]:0);
  function requireZ(points){if(points.some(p=>!Number.isFinite(p[2])))fail('Für 3D-Messungen werden absolute Z-Höhen an allen Punkten benötigt.');}
  function area2D(points){const o=points[0];return Math.abs(points.reduce((s,a,i)=>{const b=points[(i+1)%points.length];return s+(a[0]-o[0])*(b[1]-o[1])-(b[0]-o[0])*(a[1]-o[1]);},0))/2;}
  const triangleArea=(a,b,c)=>{const u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]);return Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])/2;};
  function simpleRing(input){const cs=input.length>3&&input[0][0]===input.at(-1)[0]&&input[0][1]===input.at(-1)[1]?input.slice(0,-1):input;const sign=(a,b,c)=>{const n=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);return n===0?0:n>0?1:-1;};const on=(a,b,c)=>sign(a,b,c)===0&&c[0]>=Math.min(a[0],b[0])&&c[0]<=Math.max(a[0],b[0])&&c[1]>=Math.min(a[1],b[1])&&c[1]<=Math.max(a[1],b[1]);for(let i=0;i<cs.length;i++){const a=cs[i],b=cs[(i+1)%cs.length];if(distance(a,b)===0)fail('Polygon enthält doppelte aufeinanderfolgende Punkte.');for(let j=i+1;j<cs.length;j++){if(j===i+1||i===0&&j===cs.length-1)continue;const c=cs[j],d=cs[(j+1)%cs.length],s1=sign(a,b,c),s2=sign(a,b,d),s3=sign(c,d,a),s4=sign(c,d,b);if(s1*s2<0&&s3*s4<0||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b))fail('Polygon ist selbstschneidend oder berührt sich selbst.');}}return true;}
  function measure(points,type,ref){
    if(!Array.isArray(points)||points.some(c=>!Array.isArray(c)||!c.slice(0,2).every(Number.isFinite)))fail('Endliche X/Y-Koordinaten sind erforderlich.');
    const n=points.length;if(n<(type.includes('area')||type==='angle'?3:2))fail('Zu wenige Messpunkte.');
    let value,unit,method;
    if(type==='distance'||type==='distance3d'){
      if(type==='distance3d')requireZ(points);
      value=points.slice(1).reduce((s,b,i)=>s+distance(points[i],b,type==='distance3d'),0);unit='m';method=type==='distance3d'?'3D-Polylinie im metrischen Projektkoordinatenraum':'Ebene Polylinie im Projektgitter';
    }else if(type==='geodesic'){
      const g=geod(ref),cs=points.map(c=>geographic(c,ref));value=cs.slice(1).reduce((s,b,i)=>s+g.Inverse(cs[i][1],cs[i][0],b[1],b[0]).s12,0);unit='m';method='Ellipsoidische Geodäte · '+systems[ref.horizontal].family+' · ohne Geländehöhe';
    }else if(type==='area'||type==='area3d'){
      simpleRing(points);const ids=C.triangulate(points);if(type==='area3d')requireZ(points);
      value=type==='area'?area2D(points):ids.reduce((s,t)=>s+triangleArea(...t.map(i=>points[i])),0);unit='m²';method=type==='area'?'Horizontal projizierte Polygonfläche im Projektgitter':'3D-Fläche aus Dreiecken des angegebenen Polygonrings (kein Gelände-Drapieren)';
    }else if(type==='angle'){
      const [a,b,c]=points,u=[a[0]-b[0],a[1]-b[1]],v=[c[0]-b[0],c[1]-b[1]];if(!Math.hypot(...u)||!Math.hypot(...v))fail('Winkelarme dürfen nicht null sein.');value=Math.atan2(Math.abs(u[0]*v[1]-u[1]*v[0]),u[0]*v[0]+u[1]*v[1])*180/Math.PI;unit='°';method='Ebener Innenwinkel am zweiten Punkt (erste drei Punkte)';
    }else if(type==='bearing'){
      const [a,b]=points;if(!distance(a,b))fail('Richtung benötigt zwei verschiedene Punkte.');value=(Math.atan2(b[0]-a[0],b[1]-a[1])*180/Math.PI+360)%360;unit='°';method='Gitterazimut ab Gitternord, im Uhrzeigersinn (erste zwei Punkte)';
    }else fail('Unbekannte Messmethode.');
    return {id:uuid(),type,value,unit,method,points:clone(points),reference:clone(ref),created:new Date().toISOString(),accuracy:'Rechenergebnis; Daten- und Modellunsicherheit separat bewerten.'};
  }
  function volume(grid,top,bottom){let v=0;for(let j=0;j<grid.y.length-1;j++)for(let i=0;i<grid.x.length-1;i++){const d=(r,c)=>top[r][c]-bottom[r][c];v+=(grid.x[i+1]-grid.x[i])*(grid.y[j+1]-grid.y[j])/6*(2*d(j,i)+d(j,i+1)+2*d(j+1,i+1)+d(j+1,i));}return v;}
  function layerVolume(p,key){const e=find(p,key);if(!e)fail('Layer fehlt.');if(e.type==='bodies')return volume(e.object,e.object.top,e.object.bottom);if(e.type==='layers'){const i=p.layers.indexOf(e.object);return volume(p.terrain,i?p.layers[i-1].bottom:p.terrain.z,e.object.bottom);}fail('Volumen nur für Körper mit Ober- und Unterkante.');}
  function featurePoints(p,e,f){return (f.type==='Point'?[f.coordinates]:f.coordinates).map(c=>C.worldPoint(p,c));}
  function rotateFeature(f,params){const {dx=0,dy=0,dz=0,angle=0,cx=0,cy=0}=params;if(!Object.values({dx,dy,dz,angle,cx,cy}).every(Number.isFinite))fail('Transformationswerte müssen Zahlen sein.');const a=angle*Math.PI/180,cos=Math.cos(a),sin=Math.sin(a);const point=c=>{if(c[2]==null&&dz!==0)fail('Für Z-Verschiebung zuerst absolute Höhen festlegen.');return [cx+(c[0]-cx)*cos-(c[1]-cy)*sin+dx,cy+(c[0]-cx)*sin+(c[1]-cy)*cos+dy,c[2]==null?null:c[2]+dz];};const r=clone(f);r.coordinates=f.type==='Point'?point(f.coordinates):f.coordinates.map(point);return r;}
  function snap(p,q,tolerance){if(!Number.isFinite(tolerance)||tolerance<0)fail('Fangtoleranz muss ≥ 0 Meter sein.');let best=null;const offer=(c,source)=>{const d=distance(c,q);if(d<=tolerance&&(!best||d<best.distance))best={point:[...c],distance:d,source};};for(const b of p.boreholes)offer([b.x,b.y,b.collar_z],b.name);for(const l of p.gisLayers.filter(l=>l.visible))for(const f of l.features){const cs=featurePoints(p,null,f);cs.forEach(c=>offer(c,l.name+' · '+f.id));const pairs=cs.slice(1).map((b,i)=>[cs[i],b]);if(f.type==='Polygon')pairs.push([cs.at(-1),cs[0]]);for(const [a,b]of pairs){const dx=b[0]-a[0],dy=b[1]-a[1],t=C.clamp(((q[0]-a[0])*dx+(q[1]-a[1])*dy)/(dx*dx+dy*dy||1),0,1);offer(a.map((v,i)=>v+(b[i]-v)*t),l.name+' · Kante '+f.id);}}return best;}
  function intersectsExtent(f,extent){const [xmin,ymin,xmax,ymax]=extent,inside=c=>c[0]>=xmin&&c[0]<=xmax&&c[1]>=ymin&&c[1]<=ymax,cs=f.type==='Point'?[f.coordinates]:f.coordinates;if(cs.some(inside))return true;const segment=(a,b)=>{let lo=0,hi=1;for(let i=0;i<2;i++){const d=b[i]-a[i],min=i?ymin:xmin,max=i?ymax:xmax;if(d===0){if(a[i]<min||a[i]>max)return false;}else{let t0=(min-a[i])/d,t1=(max-a[i])/d;if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(lo>hi)return false;}}return true;};for(let i=1;i<cs.length;i++)if(segment(cs[i-1],cs[i]))return true;if(f.type==='Polygon'){if(segment(cs.at(-1),cs[0]))return true;let contains=false;for(let i=0,j=cs.length-1;i<cs.length;j=i++){const a=cs[i],b=cs[j];if((a[1]>ymin)!==(b[1]>ymin)&&xmin<(b[0]-a[0])*(ymin-a[1])/(b[1]-a[1])+a[0])contains=!contains;}return contains;}return false;}
  const featureColor=(layer,feature)=>layer.symbology?.field&&/^#[0-9a-f]{6}$/i.test(layer.symbology.categories?.[String(feature.properties?.[layer.symbology.field])]||'')?layer.symbology.categories[String(feature.properties[layer.symbology.field])]:layer.color;
  function detach(p,key){const e=find(p,key);if(!e)fail('Layer fehlt.');if(e.object.workspace?.locked)fail('Layer ist gegen Bearbeitung gesperrt.');if(e.type==='terrain'&&p.layers.length)fail('Das Höhenmodell wird von Rahmenschichten benötigt. Zuerst diese aus dem Projekt entfernen.');if(e.type==='layers'&&p.layers.indexOf(e.object)!==p.layers.length-1)fail('Rahmenschichten bilden eine geordnete Folge. Nur die unterste Schicht kann entfernt werden; andere ausblenden.');if(['layers','bodies'].includes(e.type)&&p.boreholes.some(b=>b.intervals.some(it=>it.layer_id===e.id||it.body_id===e.id)))fail('Bohrintervalle verweisen auf diesen Körper. Ausblenden oder zuerst die verknüpften Bohrungen entfernen.');p.workspace.detached.push({...clone(e),removed:new Date().toISOString()});if(e.type==='terrain')p.terrain=null;else p[e.type]=p[e.type].filter(o=>o.id!==e.id);return p;}
  function restore(p,index){const e=p.workspace.detached[index];if(!e)fail('Datensatz fehlt.');if(find(p,e.key))fail('Ein Layer mit dieser ID ist bereits vorhanden.');if(e.type==='terrain'){if(p.terrain)fail('Es gibt bereits ein Höhenmodell.');p.terrain=e.object;}else{p[e.type]=p[e.type]||[];p[e.type].push(e.object);}p.workspace.detached.splice(index,1);return normalize(p);}
  function importGeoJSON(p,input,options){
    if(!input||input.type!=='FeatureCollection'||!Array.isArray(input.features))fail('GeoJSON muss eine FeatureCollection sein.');
    if(input.features.length>20000)fail('Maximal 20.000 Objekte pro Import.');
    const {sourceCRS,sourceVertical,name='Importierter Geolayer'}=options;
    if(!systems[sourceCRS])fail('Quellkoordinatensystem auswählen.');
    if(sourceVertical!==p.reference.vertical)fail('Der Höhenbezug der Quelle stimmt nicht mit dem Projekt überein. Keine automatische Höhenumrechnung.');
    const ids=new Set(),features=input.features.map((f,i)=>{const g=f.geometry;if(!g||!['Point','LineString','Polygon'].includes(g.type))fail('Objekt '+(i+1)+': nur Point, LineString und Polygon ohne Löcher werden unterstützt.');if(g.type==='Polygon'&&g.coordinates.length!==1)fail('Polygone mit Löchern benötigen eine erweiterte Geometrieunterstützung.');const id=String(f.id??'F-'+(i+1));if(ids.has(id))fail('Doppelte Objekt-ID: '+id);ids.add(id);const tf=c=>transform(c,sourceCRS,p.reference.horizontal,sourceVertical,p.reference.vertical);const cs=g.type==='Polygon'?g.coordinates[0]:g.coordinates;return {id,type:g.type,coordinates:g.type==='Point'?tf(cs):cs.map(tf),properties:clone(f.properties||{})};});
    const next=clone(p),id='gis-'+uuid(),sourceId='source-'+uuid();next.gisLayers.push({id,name,color:'#177d82',visible:true,opacity:1,features,workspace:{group:'Eigene Geodaten',status:'beobachtet',source:options.filename||name,sourceId,locked:false}});
    next.workspace.sources.push({id:sourceId,name:options.filename||name,sourceCRS,sourceVertical,targetCRS:p.reference.horizontal,method:'Proj4js '+proj4.version+'; gleiche Datumsfamilie; X/Y = Ost/Nord oder Länge/Breite; Z unverändert',imported:new Date().toISOString(),original:clone(input)});
    return normalize(next);
  }
  function quality(p){const rows=[];if(!p.reference.confirmed)rows.push({level:'Prüfen',object:'Raumbezug',message:'Lage- und Höhenbezug sind noch nicht durch dich bestätigt.'});if(p.metadata.synthetic)rows.push({level:'Hinweis',object:'Demodaten',message:'Synthetisches Konzeptmodell. Bohrungen wurden aus den Körpern erzeugt und sind keine unabhängige Validierung.'});const sys=systems[p.reference.horizontal];for(const e of entries(p)){const o=e.object;if(!o.workspace?.source)rows.push({level:'Hinweis',object:o.name||o.id,message:'Datenquelle nicht dokumentiert.'});if(e.type==='boreholes'){const t=C.terrainAt(p,o.x,o.y);if(t!==null&&Math.abs(t-o.collar_z)>.1)rows.push({level:'Prüfen',object:o.id,message:'Bohransatz minus Gelände: '+(o.collar_z-t).toFixed(3)+' m.'});for(const it of o.intervals){const b=p.bodies?.find(b=>b.id===it.body_id);if(!b)continue;const top=C.sample(b,b.top,o.x,o.y),bot=C.sample(b,b.bottom,o.x,o.y);if(top===null){rows.push({level:'Prüfen',object:o.id,message:'Zugeordneter Körper '+b.id+' liegt außerhalb der Bohrung.'});continue;}for(const [label,z,model]of [['Oberkontakt',o.collar_z-it.from,top],['Unterkontakt',o.collar_z-it.to,bot]])if(Math.abs(z-model)>.05)rows.push({level:'Prüfen',object:o.id+' / '+b.id,message:label+': Bohrung minus Modell = '+(z-model).toFixed(3)+' m.'});}}}
    if(sys?.zone&&p.terrain){const xs=p.terrain.x;if(xs[0]<100000||xs.at(-1)>900000)rows.push({level:'Prüfen',object:'UTM-Koordinaten',message:'Unüblicher Rechtswert. Zonenkennziffern (z. B. 32…) dürfen nicht als EPSG:25832 eingelesen werden.'});}
    return rows;
  }
  function section(p,a,b,n=201){if(distance(a,b)===0)fail('Schnitt benötigt zwei verschiedene Punkte.');return Array.from({length:n},(_,i)=>{const t=i/(n-1),x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;return {distance:distance(a,b)*t,x,y,terrain:C.terrainAt(p,x,y),layers:p.layers.map(l=>C.sample(p.terrain,l.bottom,x,y)),bodies:(p.bodies||[]).map(l=>({id:l.id,top:C.sample(l,l.top,x,y),bottom:C.sample(l,l.bottom,x,y)}))};});}
  globalThis.GeoWorkspace={uuid,systems,verticals,kinds,normalize,entries,find,createGroup,renameGroup,moveLayerToGroup,assignGroupMembers,removeGroup,transform,geographic,distance,area2D,triangleArea,simpleRing,measure,volume,layerVolume,featurePoints,featureColor,intersectsExtent,rotateFeature,snap,detach,restore,importGeoJSON,quality,section};
})();
