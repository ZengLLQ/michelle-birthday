import * as THREE from 'three';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const canvas = document.querySelector('#birthday-canvas');
const stage = document.querySelector('#cake-stage');
const wishButton = document.querySelector('#wish-button');
const motionButton = document.querySelector('#motion-toggle');
const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
let paused = preference.matches;
let resetCelebration = () => {};
let renderOnce = () => {};

function syncMotion() {
  document.documentElement.dataset.paused = String(paused);
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.setAttribute('aria-label', paused ? 'Play animation' : 'Pause animation');
  if (paused) resetCelebration();
  renderOnce();
}
motionButton.addEventListener('click', () => { paused = !paused; syncMotion(); });
preference.addEventListener('change', (event) => { paused = event.matches; syncMotion(); });
syncMotion();

try { createBirthday(); } catch (error) {
  document.documentElement.classList.add('scene-unavailable');
  stage.disabled = true;
  stage.setAttribute('aria-label', 'Birthday decoration');
  motionButton.hidden = true;
  console.warn('The birthday illustration could not be initialized.', error);
}

function createBirthday() {
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0xeee5fb, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, .1, 50);
  camera.position.set(5.2, 3.65, 8.8);
  camera.lookAt(0, .75, 0);
  const environment = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentMap = pmrem.fromScene(environment, .04);
  scene.environment = environmentMap.texture;
  scene.environmentIntensity = .85;
  environment.dispose();
  pmrem.dispose();
  scene.add(new THREE.AmbientLight(0xe8d9ff, 1));
  const key = new THREE.DirectionalLight(0xfff6ff, 3);
  key.position.set(-3, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -4; key.shadow.camera.right = 4;
  key.shadow.camera.top = 5; key.shadow.camera.bottom = -4;
  key.shadow.normalBias = .035; key.shadow.bias = -.0001;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xb594ff, 2);
  fill.position.set(4, 2, -4); scene.add(fill);

  const world = new THREE.Group(); scene.add(world);
  const cake = new THREE.Group(); world.add(cake);
  const lavender = material('#b997e0', .3, .12, .3);
  const icing = material('#f4eaff', .26, .03, .4);
  const cream = material('#e6d5f7', .32, .01, .25);
  const plateMat = material('#a47bd0', .22, .2, .6);
  const foil = material('#ad7fe4', .2, .62, .85);
  const paleFoil = material('#dfc9f9', .17, .48, .8);
  const purpleFoil = material('#8751be', .24, .55, .75);
  function material(color,roughness,metalness,clearcoat) {return new THREE.MeshPhysicalMaterial({color,roughness,metalness,clearcoat,clearcoatRoughness:.18});}
  function mesh(geometry, mat, parent, position=[0,0,0]) {
    const object = new THREE.Mesh(geometry,mat);
    object.position.set(...position); object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
  }
  function lathe(profile,mat,parent) { return mesh(new THREE.LatheGeometry(profile.map(([x,y])=>new THREE.Vector2(x,y)),80),mat,parent); }
  // Turned ceramic plate and softly rounded cake, all real three-dimensional meshes.
  lathe([[0,-.89],[.8,-.89],[1.31,-.86],[1.48,-.81],[1.51,-.76],[1.5,-.71],[1.43,-.68],[1.28,-.67],[0,-.67]],plateMat,cake);
  lathe([[0,-.68],[1,-.68],[1.1,-.65],[1.16,-.59],[1.18,-.49],[1.18,.39],[1.16,.5],[1.08,.55],[0,.55]],lavender,cake);
  // An ivory cap with individual flowing frosting drips, built as a smooth radial surface.
  const ringCount=15, segments=160, vertices=[], indices=[];
  const drops=[{a:.3,w:.15,d:.27},{a:1.15,w:.17,d:.32},{a:1.86,w:.13,d:.22},{a:2.65,w:.16,d:.3},{a:3.47,w:.15,d:.22},{a:4.19,w:.18,d:.35},{a:4.91,w:.16,d:.22},{a:5.61,w:.19,d:.33}];
  for(let r=0;r<=ringCount;r++) {
    const t=r/ringCount;
    for(let s=0;s<=segments;s++) {
      const angle=s/segments*Math.PI*2;
      let drip=0;
      for(const drop of drops){const diff=Math.atan2(Math.sin(angle-drop.a),Math.cos(angle-drop.a));drip+=drop.d*Math.exp(-Math.pow(diff/drop.w,2)*.55);}
      let radius, y;
      if(t<.72){radius=t/.72*1.13; y=.59+.045*(1-Math.pow(radius/1.13,4));}
      else {const edge=(t-.72)/.28; radius=1.13+.072*Math.sin(edge*Math.PI*.65); y=.59-.16*edge-drip*Math.pow(edge,2);}
      vertices.push(Math.cos(angle)*radius,y,Math.sin(angle)*radius);
      if(r<ringCount && s<segments){const a=r*(segments+1)+s,b=a+segments+1;indices.push(a,a+1,b,a+1,b+1,b);}
    }
  }
  const frostingGeometry=new THREE.BufferGeometry();
  frostingGeometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  frostingGeometry.setIndex(indices); frostingGeometry.computeVertexNormals();
  const frosting=mesh(frostingGeometry,icing,cake);frosting.material.side=THREE.DoubleSide;
  // Piped cream pearls and miniature sugar beads.
  const pearlGeometry=new THREE.SphereGeometry(.083,16,12);
  for(let i=0;i<44;i++){const angle=i/44*Math.PI*2;const pearl=mesh(pearlGeometry,cream,cake,[Math.cos(angle)*1.145,-.56,Math.sin(angle)*1.145]);pearl.scale.set(1,1.08,1);}
  for(let i=0;i<22;i++){const angle=i/22*Math.PI*2;const pearl=mesh(new THREE.SphereGeometry(.088,16,12),icing,cake,[Math.cos(angle)*.99,.63,Math.sin(angle)*.99]);pearl.scale.set(1,1.3,1);}
  const sugarMats=['#a578cd','#c7a0ea','#e4cff5'].map(c=>material(c,.33,.07,.2));
  for(let i=0;i<28;i++){const angle=i*2.399;const r=.33+Math.sqrt((i+1)/29)*.48;const sprinkle=mesh(new THREE.CapsuleGeometry(.018,.07,3,5),sugarMats[i%3],cake,[Math.cos(angle)*r,.64,Math.sin(angle)*r]);sprinkle.rotation.set(Math.PI/2,0,angle);}
  // One striped candle: the quiet centerpiece.
  const candleGroup = new THREE.Group(); cake.add(candleGroup);
  const candleMat=material('#a879d5',.3,.04,.2);
  mesh(new THREE.CylinderGeometry(.087,.087,.76,32),candleMat,candleGroup,[0,1.02,0]);
  const spiralPoints=[];
  for(let i=0;i<=180;i++){const t=i/180,a=t*Math.PI*2*4;spiralPoints.push(new THREE.Vector3(Math.cos(a)*.088,.66+t*.73,Math.sin(a)*.088));}
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spiralPoints),160,.022,6,false),cream,candleGroup);
  mesh(new THREE.CylinderGeometry(.012,.012,.09,8),new THREE.MeshBasicMaterial({color:'#5a3659'}),candleGroup,[0,1.44,0]);
  const flame=new THREE.Group(); flame.position.y=1.56; candleGroup.add(flame);
  const flameShape=mesh(new THREE.SphereGeometry(.085,20,20),new THREE.MeshBasicMaterial({color:'#ffcc84'}),flame);
  flameShape.scale.set(.75,1.8,.75);
  const flameCore=mesh(new THREE.SphereGeometry(.05,16,16),new THREE.MeshBasicMaterial({color:'#fff7d9'}),flame,[0,-.024,.027]); flameCore.scale.set(.65,1.65,.65);
  const flameLight=new THREE.PointLight('#ffd69d',.65,2);flameLight.position.set(0,1.65,0);candleGroup.add(flameLight);
  const glowCanvas=document.createElement('canvas');glowCanvas.width=64;glowCanvas.height=64;
  const gc=glowCanvas.getContext('2d'),gradient=gc.createRadialGradient(32,32,0,32,32,32);
  gradient.addColorStop(0,'rgba(255,221,159,.6)');gradient.addColorStop(.25,'rgba(255,220,161,.18)');gradient.addColorStop(1,'rgba(255,220,161,0)');gc.fillStyle=gradient;gc.fillRect(0,0,64,64);
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(glowCanvas),transparent:true,depthWrite:false}));glow.scale.set(.6,.75,1);flame.add(glow);

  // Inflated foil stars orbit the cake, with a tiny seam around each silhouette.
  function balloonStar(radius, mat, position, rotation) {
    const shape=new THREE.Shape();
    for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2===0?radius:radius*.49,x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y);}shape.closePath();
    const group=new THREE.Group();
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:true,bevelSegments:7,steps:1,bevelSize:radius*.16,bevelThickness:radius*.23,curveSegments:20});
    geometry.center();mesh(geometry,mat,group);
    group.position.set(...position);group.rotation.set(...rotation);world.add(group);
    group.userData.home=group.position.clone();return group;
  }
  const floaters=[
    balloonStar(.56,foil,[-1.48,1.76,-.65],[.1,-.25,-.26]),
    balloonStar(.36,paleFoil,[1.73,.9,-.16],[.2,.25,.22]),
    balloonStar(.2,purpleFoil,[-1.65,-.06,.35],[.1,-.2,.13])
  ];
  const beadGeometry=new THREE.SphereGeometry(.1,24,20);
  [[1.06,2.14,-.7,.85],[-.7,2.55,-1.05,.63],[1.82,-.21,.38,.75],[-1.62,.98,.05,.47]].forEach(([x,y,z,size],i)=>{const bead=mesh(beadGeometry,i%2?paleFoil:foil,world,[x,y,z]);bead.scale.setScalar(size);bead.userData.home=bead.position.clone();floaters.push(bead);});
  // Delicate three-dimensional ribbon curls.
  function ribbon(position,rotation,mat){const points=[];for(let i=0;i<=90;i++){const t=i/90;points.push(new THREE.Vector3(.11*Math.sin(t*Math.PI*3),t*.65,.08*Math.cos(t*Math.PI*3)));}const object=mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),70,.016,6,false),mat,world,position);object.rotation.set(...rotation);object.userData.home=object.position.clone();floaters.push(object);}
  ribbon([1.42,1.52,-.3],[.2,0,-.45],foil);ribbon([-1.6,.45,-.2],[0,0,.45],paleFoil);

  // Contact shadow stays soft at every screen size.
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;
  const sc=shadowCanvas.getContext('2d'),sg=sc.createRadialGradient(64,64,2,64,64,64);
  sg.addColorStop(0,'rgba(92,42,139,.3)');sg.addColorStop(.4,'rgba(103,53,145,.16)');sg.addColorStop(1,'rgba(112,59,155,0)');sc.fillStyle=sg;sc.fillRect(0,0,128,128);
  const shadow=mesh(new THREE.PlaneGeometry(5,4),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}),scene,[0,-1.2,0]);shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;shadow.receiveShadow=false;

  const confettiGroup=new THREE.Group(); scene.add(confettiGroup);
  const confettiGeometry=new THREE.PlaneGeometry(.055,.09);
  const confettiMaterials=['#9463c6','#c29ae9','#ead7ff','#fff3cf','#714195'].map(color=>new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true}));
  const confetti=[];
  for(let i=0;i<100;i++){const p=new THREE.Mesh(confettiGeometry,confettiMaterials[i%5]);p.visible=false;confettiGroup.add(p);confetti.push(p);}
  let celebrationTime=-1, elapsed=0, lastTime=0, active=true, frame=0;
  const pointer=new THREE.Vector2();const smoothPointer=new THREE.Vector2();
  function celebrate(){
    if(celebrationTime>=0)return;
    celebrationTime=0;flame.visible=false;flameLight.visible=false;
    wishButton.classList.add('celebrating');
    stage.setAttribute('aria-label','Birthday candle blown out');
    wishButton.setAttribute('aria-label','Birthday candle blown out');
    for(const p of confetti){p.visible=!paused; p.position.set((Math.random()-.5)*.45,1.6,(Math.random()-.5)*.45);p.rotation.set(Math.random()*6,Math.random()*6,Math.random()*6);p.userData.velocity=new THREE.Vector3((Math.random()-.5)*3.8,1.8+Math.random()*2.8,(Math.random()-.5)*2.8);p.userData.spin=(Math.random()-.5)*6;}
    confettiMaterials.forEach(mat=>mat.opacity=1);
    if(paused){renderer.render(scene,camera);window.setTimeout(()=>{resetCelebration();renderer.render(scene,camera);},1400);}
  }
  resetCelebration=()=>{celebrationTime=-1;flame.visible=true;flameLight.visible=true;confetti.forEach(p=>p.visible=false);wishButton.classList.remove('celebrating');stage.setAttribute('aria-label','Blow out the candle and celebrate');wishButton.setAttribute('aria-label','Blow out the candle and celebrate');};
  stage.addEventListener('click',celebrate);wishButton.addEventListener('click',celebrate);
  stage.addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;const bounds=stage.getBoundingClientRect();pointer.set((event.clientX-bounds.left)/bounds.width*2-1,(event.clientY-bounds.top)/bounds.height*2-1);});
  stage.addEventListener('pointerleave',()=>pointer.set(0,0));
  function resize(){const rect=stage.getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();renderer.render(scene,camera);}
  const observer=new ResizeObserver(resize);observer.observe(stage);resize();
  renderOnce=()=>renderer.render(scene,camera);
  function tick(time){
    if(!active)return;
    frame=requestAnimationFrame(tick);
    const delta=Math.min((time-lastTime)/1000,.035);lastTime=time;
    if(paused)return;
    elapsed+=delta;
    smoothPointer.lerp(pointer,1-Math.exp(-delta*3));
    world.rotation.y=smoothPointer.x*.16+Math.sin(elapsed*.25)*.045;
    world.rotation.x=smoothPointer.y*.07;
    cake.position.y=Math.sin(elapsed*.85)*.045;
    floaters.forEach((f,i)=>{f.position.y=f.userData.home.y+Math.sin(elapsed*.7+i*1.5)*.085;f.rotation.z+=Math.cos(elapsed*.55+i)*delta*.022;});
    flame.scale.set(1+Math.sin(elapsed*11)*.035,1+Math.sin(elapsed*7)*.055,1);flame.rotation.z=Math.sin(elapsed*5)*.07;
    if(celebrationTime>=0){celebrationTime+=delta;for(const p of confetti){p.userData.velocity.y-=delta*1.5;p.position.addScaledVector(p.userData.velocity,delta);p.rotation.x+=delta*p.userData.spin;p.rotation.z+=delta*1.7;}confettiMaterials.forEach(mat=>mat.opacity=Math.max(0,1-(celebrationTime-2.2)/1.5));if(celebrationTime>4.2)resetCelebration();}
    renderer.render(scene,camera);
  }
  document.addEventListener('visibilitychange',()=>{active=!document.hidden;if(active){lastTime=performance.now();frame=requestAnimationFrame(tick);}else cancelAnimationFrame(frame);});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();active=false;cancelAnimationFrame(frame);document.documentElement.classList.remove('scene-ready');});
  canvas.addEventListener('webglcontextrestored',()=>{active=true;lastTime=performance.now();renderOnce();document.documentElement.classList.add('scene-ready');frame=requestAnimationFrame(tick);});
  document.documentElement.classList.add('scene-ready');
  renderer.render(scene,camera);frame=requestAnimationFrame(tick);
}
