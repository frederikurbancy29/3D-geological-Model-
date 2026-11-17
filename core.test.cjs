const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
for(const name of ['core.js','renderer.js'])vm.runInThisContext(fs.readFileSync(path.join(__dirname,name),'utf8'));
const C=GeoCore;

test('demo and template have valid, ordered layer volumes and absolute borehole heights',()=>{
  const p=C.demo();assert.equal(p.boreholes.length,9);assert.equal(p.layers.length,4);assert.equal(p.gisLayers.length,4);assert.equal(p.terrain.x.length,25);
  const b=p.boreholes[0];assert.ok(b.collar_z-b.intervals.at(-1).to<0);assert.ok(C.bounds(p).min[2]<-180);assert.deepEqual(C.validate(p),p);assert.doesNotThrow(()=>C.validate(C.template()));
});
test('all CSV categories round-trip through an initially empty project',()=>{
  const original=C.demo();let p=C.empty();for(const kind of ['terrain','layers','bores','gis'])p=C.importCSV(C.exportCSV(original,kind),kind,p);
  assert.deepEqual(p.terrain.z,original.terrain.z);assert.deepEqual(p.layers.map(l=>l.bottom),original.layers.map(l=>l.bottom));assert.deepEqual(p.boreholes,original.boreholes);assert.deepEqual(p.gisLayers.map(l=>l.features),original.gisLayers.map(l=>l.features));assert.equal(p.metadata.synthetic,false);
});
test('German decimal commas, BOM, quoted delimiters and CRLF work',()=>{
  const p=C.importCSV('\uFEFFx;y;z\r\n0;0;10,5\r\n100;0;11,5\r\n0;100;12,5\r\n100;100;13,5\r\n','terrain',C.empty());assert.equal(p.terrain.z[1][1],13.5);
  const table=C.parseCSV('name;z\r\n"Sand; feiner Sand";"1,5"\r\n');assert.equal(table.rows[0].name,'Sand; feiner Sand');
});
test('invalid grid imports are rejected without mutating current data',()=>{
  const p=C.demo(),before=JSON.stringify(p);assert.throws(()=>C.importCSV('x;y;z\n0;0;1\n1;0;2\n0;1;3','terrain',p),/unvollständig/);assert.equal(JSON.stringify(p),before);
  assert.throws(()=>C.importCSV('x;y;z\n0;0;1\n0;0;2\n1;1;3\n1;0;4','terrain',C.empty()),/Doppelter/);
});
test('crossed horizons, overlapping intervals and unknown IDs are rejected',()=>{
  let p=C.template();p.layers[1].bottom[0][0]=100;assert.throws(()=>C.validate(p),/Unterkante/);
  p=C.template();p.boreholes[0].intervals[1].from=20;assert.throws(()=>C.validate(p),/überlappende/);
  p=C.template();p.boreholes[0].intervals[0].layer_id='missing';assert.throws(()=>C.validate(p),/unbekannte/);
});
test('append rejects duplicate IDs; new IDs add independent GIS layers',()=>{
  const p=C.template(),csv=C.exportCSV(p,'gis');assert.throws(()=>C.importCSV(csv,'gis',p,'append'),/doppelte ID/);
  const added=C.importCSV(csv.replaceAll('line-1','line-2'),'gis',p,'append');assert.equal(added.gisLayers.length,2);
});
test('draped GIS geometry must stay inside terrain or provide an absolute Z',()=>{
  const p=C.template();p.gisLayers[0].features[0].coordinates[0][0]=-1;assert.throws(()=>C.validate(p),/außerhalb/);p.gisLayers[0].features[0].coordinates[0][2]=120;assert.doesNotThrow(()=>C.validate(p));
});
test('concave polygons triangulate without filling their indentation',()=>{
  const ring=[[0,0],[4,0],[4,4],[2,2],[0,4]],tri=C.triangulate(ring);const area=tri.reduce((sum,ids)=>{const [a,b,c]=ids.map(i=>ring[i]);return sum+Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2;},0);assert.equal(area,12);assert.equal(tri.length,3);assert.throws(()=>C.triangulate([[0,0],[2,2],[0,2],[2,0]]),/gültige/);
});
test('project serialization preserves view and individual visibility; empty stays empty',()=>{
  const p=C.demo();p.view.cut=27;p.view.exaggeration=2.4;p.layers[1].visible=false;p.boreholes[2].visible=false;const restored=C.validate(JSON.parse(JSON.stringify(p)));assert.equal(restored.view.cut,27);assert.equal(restored.view.exaggeration,2.4);assert.equal(restored.layers[1].visible,false);assert.equal(restored.boreholes[2].visible,false);assert.equal(C.bounds(C.validate(C.empty())).empty,true);
});
test('ray picking and inverse camera transform return consistent metric coordinates',()=>{
  const M=GeoMath;assert.equal(M.rayTriangle([.2,.2,1],[0,0,-1],[0,0,0],[1,0,0],[0,1,0]),1);assert.equal(M.rayTriangle([2,2,1],[0,0,-1],[0,0,0],[1,0,0],[0,1,0]),null);
  const m=M.multiply(M.perspective(1.4),M.lookAt([1,1,2],[0,0,0])),inv=M.inverse(m),v=[.1,.2,.3,1],got=M.transform(inv,M.transform(m,v));got.forEach((n,i)=>assert.ok(Math.abs(n-v[i])<1e-5));
});
function fakeRenderer(){const noop=()=>{},gl=new Proxy({getShaderParameter:()=>true,getProgramParameter:()=>true,createShader:()=>({}),createProgram:()=>({}),createBuffer:()=>({}),getAttribLocation:()=>0,getUniformLocation:()=>({})},{get:(o,k)=>k in o?o[k]:(typeof k==='string'&&k===k.toUpperCase()?1:noop)});global.devicePixelRatio=1;global.requestAnimationFrame=()=>1;global.ResizeObserver=class{observe(){}};const canvas={getContext:()=>gl,parentElement:{getBoundingClientRect:()=>({width:1000,height:650})},addEventListener:noop},labels={getContext:()=>({})};return new GeoRenderer(canvas,labels);}
test('scene meshes update on clipping and individual layer/bores visibility',()=>{
  const r=fakeRenderer(),p=C.demo();p.view.cut=0;r.setProject(p);assert.equal(r.meshes.filter(m=>m.kind==='bore').length,9);assert.equal(r.meshes.filter(m=>m.kind==='layer').length,4);for(const m of r.meshes)assert.ok(m.data.every(Number.isFinite));
  p.view.cut=50;p.layers[1].visible=false;p.boreholes[7].visible=false;r.setProject(p);assert.equal(r.meshes.filter(m=>m.kind==='layer').length,3);assert.equal(r.meshes.some(m=>m.kind==='bore'&&m.id==='B-01'),false);assert.equal(r.meshes.some(m=>m.kind==='bore'&&m.id==='B-08'),false);const front=p.terrain.y[0]+450;for(const m of r.meshes.filter(m=>m.kind==='layer'))for(let i=0;i<m.data.length;i+=9)assert.ok(r.world([m.data[i],m.data[i+1],m.data[i+2]])[1]>=front-.001);
  r.setProject(C.empty());assert.equal(r.meshes.length,0);
});
