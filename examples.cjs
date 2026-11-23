const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
global.window=globalThis;
for(const f of ['vendor/proj4.js','vendor/geographiclib-geodesic.js'])vm.runInThisContext(fs.readFileSync(path.join(__dirname,f),'utf8'));
vm.runInThisContext(fs.readFileSync(path.join(__dirname,'core.js'),'utf8'));
vm.runInThisContext(fs.readFileSync(path.join(__dirname,'sedimentary.js'),'utf8'));
vm.runInThisContext(fs.readFileSync(path.join(__dirname,'seismic.js'),'utf8'));
vm.runInThisContext(fs.readFileSync(path.join(__dirname,'landscape.js'),'utf8'));
vm.runInThisContext(fs.readFileSync(path.join(__dirname,'intrusion.js'),'utf8'));
const destination=path.join(__dirname,'dist','vorlagen');
fs.mkdirSync(destination,{recursive:true});
vm.runInThisContext(fs.readFileSync(path.join(__dirname,'workspace-core.js'),'utf8'));
for(const f of ['field-data.js','field-formats.js'])vm.runInThisContext(fs.readFileSync(path.join(__dirname,f),'utf8'));
global.XLSX=require('./vendor/sheetjs.js');global.GeoTIFF=require('./vendor/geotiff.js');
const p=GeoWorkspace.normalize(GeoCore.template());
fs.writeFileSync(path.join(destination,'projektvorlage.geolab.json'),JSON.stringify(p,null,2));
fs.writeFileSync(path.join(destination,'demoprojekt.geolab.json'),JSON.stringify(GeoWorkspace.normalize(GeoCore.demo()),null,2));
fs.writeFileSync(path.join(destination,'leeres-projekt.geolab.json'),JSON.stringify(GeoWorkspace.normalize(GeoCore.empty()),null,2));
for(const [kind,name]of [['bodies','05-lokale-koerper.csv'],['paleo','06-palaeorelief.csv']])fs.writeFileSync(path.join(destination,name),GeoCore.exportCSV(p,kind));
for(const [kind,name]of [['terrain','01-gelaende.csv'],['layers','02-schichten.csv'],['bores','03-bohrungen.csv'],['gis','04-geolayer.csv']])fs.writeFileSync(path.join(destination,name),GeoCore.exportCSV(p,kind));
console.log('Generated editable JSON and CSV examples.');

const fault={...p,faults:[{id:"F-01",name:"Beispielflaeche",color:"#b95149",coordinates:[[30,0,60],[30,200,60],[110,200,-100],[110,0,-100]]}]};
fs.writeFileSync(path.join(destination,"07-stoerungsflaechen.csv"),GeoCore.exportCSV(fault,"faults"));

// Small interchangeable observations and scalar raster in the LOCAL template frame.
const bore=p.boreholes[0],bid='IMPORT-01';
const collars=[['borehole_id','name','x','y','collar_z','end_depth_m'],[bid,'Synthetische Importbohrung',bore.x,bore.y,bore.collar_z,Math.max(...bore.intervals.map(it=>it.to))]];
const intervals=[['borehole_id','from_m','to_m','lithology','layer_id','body_id'],...bore.intervals.map(it=>[bid,it.from,it.to,it.lithology||it.layer_id,it.layer_id||'',it.body_id||''])];
const csv=rows=>rows.map(row=>row.map(v=>GeoCore.csvCell?GeoCore.csvCell(v):'"'+String(v).replaceAll('"','""')+'"').join(';')).join('\n')+'\n';
fs.writeFileSync(path.join(destination,'08-bohransatzpunkte.csv'),csv(collars));
fs.writeFileSync(path.join(destination,'09-bohrintervalle.csv'),csv(intervals));
const workbook=XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook,XLSX.utils.aoa_to_sheet(collars),'Ansatzpunkte');
XLSX.utils.book_append_sheet(workbook,XLSX.utils.aoa_to_sheet(intervals),'Intervalle');
fs.writeFileSync(path.join(destination,'10-bohrdaten.xlsx'),Buffer.from(XLSX.write(workbook,{type:'array',bookType:'xlsx'})));
const xs=p.terrain.x,ys=p.terrain.y,width=8,height=6,dx=(xs.at(-1)-xs[0])/width,dy=(ys.at(-1)-ys[0])/height;
const values=Array.from({length:height},(_,j)=>Array.from({length:width},(_,i)=>i===0&&j===0?null:Math.round(65*Math.exp(-((i-2)**2+(j-2)**2)/3)-45*Math.exp(-((i-5)**2+(j-3)**2)/2))));
const raster={id:'import-magnetik',name:'Synthetische Messwerte ohne physikalischen Bezug',kind:'numeric',width,height,values,transform:[xs[0],dx,0,ys.at(-1),0,-dy],sourceCRS:'LOCAL',quantity:'Magnetikanomalie (synthetisch)',unit:'nT',placement:'plane',z:100,palette:'diverging',show2D:true,show3D:false};
fs.writeFileSync(path.join(destination,'11-magnetik-raster.json'),JSON.stringify(raster,null,2));
// ESRI ASCII uses square cells; use a square-cell subset of the template area.
const cell=Math.min(dx,dy),asc=['ncols '+width,'nrows '+height,'xllcorner '+xs[0],'yllcorner '+ys[0],'cellsize '+cell,'NODATA_value -9999',...values.map(row=>row.map(v=>v===null?-9999:v).join(' '))].join('\n')+'\n';
fs.writeFileSync(path.join(destination,'12-magnetik.asc'),asc);
const xyz=[['x','y','value'],...values.flatMap((row,j)=>row.map((v,i)=>[xs[0]+(i+.5)*dx,ys.at(-1)-(j+.5)*dy,v===null?'':v]))];
fs.writeFileSync(path.join(destination,'13-magnetik-xyz.csv'),csv(xyz));
const tiff=GeoTIFF.writeArrayBuffer(new Float32Array(values.flat().map(v=>v===null?-9999:v)),{width,height,BitsPerSample:[32],SampleFormat:[3],SamplesPerPixel:1,ModelPixelScale:[dx,dy,0],ModelTiepoint:[0,0,0,xs[0],ys.at(-1),0],GTRasterTypeGeoKey:1,GDAL_NODATA:'-9999'});
fs.writeFileSync(path.join(destination,'14-magnetik.tif'),Buffer.from(tiff));
console.log('Generated bore workbook and numeric raster examples (LOCAL, synthetic).');
