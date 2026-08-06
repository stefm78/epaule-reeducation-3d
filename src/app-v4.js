import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const EXERCISES = [
  {
    id: 'supine',
    title: 'Rotation externe allongée en 90/90',
    category: 'Coiffe des rotateurs · Base',
    summary: 'Contrôle actif de la rotation externe, sans chercher la fin d’amplitude et sans déplacer les coudes.',
    steps: [
      'S’allonger avec le haut du dos confortablement soutenu.',
      'Placer les bras ouverts et les coudes fléchis à environ 90°.',
      'Descendre les avant-bras lentement dans une amplitude confortable.',
      'Revenir sans décoller les coudes ni cambrer le thorax.'
    ],
    cues: ['Respiration libre.', 'Coudes stables.', 'Aucune douleur vive ni compensation du tronc.'],
    dose: [2, 8, 'Selon prescription'],
    muscles: [['Infra-épineux', 3], ['Petit rond', 3], ['Coiffe', 2], ['Stabilisateurs scapulaires', 1]]
  },
  {
    id: 'reach',
    title: 'Projection contrôlée du bras vers l’avant',
    category: 'Contrôle scapulo-huméral · Base',
    summary: 'Depuis la quadrupédie, allonger le bras gauche sans haussement d’épaule ni rotation du bassin.',
    steps: [
      'Placer les mains sous les épaules et les genoux sous les hanches.',
      'Garder le cou long et le tronc stable.',
      'Allonger le bras gauche progressivement dans l’axe du corps.',
      'Revenir lentement sous l’épaule.'
    ],
    cues: ['Bassin horizontal.', 'Épaule loin de l’oreille.', 'Mouvement lent et continu.'],
    dose: [2, 8, 'Sans charge puis progression'],
    muscles: [['Dentelé antérieur', 3], ['Deltoïde antérieur', 2], ['Trapèze inférieur', 2], ['Coiffe', 2]]
  },
  {
    id: 'airplane',
    title: 'L’avion en quadrupédie',
    category: 'Contrôle scapulaire · Base',
    summary: 'Lever le bras gauche latéralement avec une amplitude maîtrisée, sans ouvrir le bassin.',
    steps: [
      'Stabiliser la quadrupédie et rentrer légèrement le menton.',
      'Décoller la main gauche sans déplacer le tronc.',
      'Lever le bras latéralement comme une aile, coude souple.',
      'Revenir lentement à l’appui.'
    ],
    cues: ['Bassin parallèle au sol.', 'Pas de haussement d’épaule.', 'Amplitude limitée par la qualité du contrôle.'],
    dose: [2, 8, 'Sans charge puis progression'],
    muscles: [['Deltoïde postérieur', 3], ['Trapèze moyen', 2], ['Rhomboïdes', 2], ['Coiffe', 2]]
  },
  {
    id: 'row',
    title: 'Tirage puis extension du triceps',
    category: 'Chaîne postérieure · Intermédiaire',
    summary: 'Associer un tirage contrôlé du coude à une extension du bras, sans rotation du tronc.',
    steps: [
      'Stabiliser les trois appuis au sol.',
      'Ramener le coude gauche près du tronc.',
      'Maintenir le bras sans avancer l’épaule.',
      'Tendre l’avant-bras vers l’arrière puis revenir lentement.'
    ],
    cues: ['Dos neutre.', 'Pas d’élan.', 'Charge compatible avec une omoplate stable.'],
    dose: [2, 8, 'Selon prescription'],
    muscles: [['Triceps', 3], ['Rhomboïdes', 3], ['Trapèze moyen', 2], ['Deltoïde postérieur', 2]]
  },
  {
    id: 'rotate',
    title: 'Rotation externe bras relevé',
    category: 'Coiffe en élévation · Intermédiaire',
    summary: 'Faire pivoter l’avant-bras autour d’un humérus stable, sans forcer l’amplitude.',
    steps: [
      'Stabiliser le tronc en quadrupédie.',
      'Élever le coude gauche à une hauteur confortable.',
      'Faire pivoter l’avant-bras vers le haut.',
      'Redescendre lentement sans laisser tomber le coude.'
    ],
    cues: ['Humérus stable.', 'Épaule basse.', 'Arrêt avant toute compensation du thorax.'],
    dose: [2, 8, 'Selon prescription'],
    muscles: [['Infra-épineux', 3], ['Petit rond', 3], ['Coiffe', 2], ['Trapèze inférieur', 1]]
  },
  {
    id: 'shift',
    title: 'Transferts de poids droite–gauche',
    category: 'Appui fermé · Progression',
    summary: 'Transférer progressivement la charge d’une main vers l’autre en gardant le tronc solidaire.',
    steps: [
      'Choisir l’appui sur les genoux ou sur les pointes de pieds.',
      'Aligner le tronc et stabiliser les omoplates.',
      'Déplacer lentement le thorax vers une main.',
      'Revenir au centre puis transférer vers l’autre côté.'
    ],
    cues: ['Mains fixes.', 'Amplitude progressive.', 'Pas d’effondrement de l’épaule gauche.'],
    dose: [2, 8, 'Poids du corps'],
    muscles: [['Dentelé antérieur', 3], ['Coiffe', 3], ['Trapèze', 2], ['Tronc', 2]],
    push: true
  },
  {
    id: 'clap',
    title: 'Pompe dynamique',
    category: 'Pliométrie · Avancé',
    summary: 'Exercice à forte demande mécanique, proposé seulement après validation clinique explicite.',
    steps: [
      'Choisir la variante sur les genoux ou sur les pointes de pieds.',
      'Descendre avec les coudes souples et les omoplates contrôlées.',
      'Repousser rapidement pour alléger brièvement les mains.',
      'Réceptionner avec les coudes fléchis puis stabiliser.'
    ],
    cues: ['Aucune douleur.', 'Réception silencieuse.', 'Arrêter si l’épaule perd son contrôle.'],
    dose: [2, 5, 'Après validation du kiné'],
    muscles: [['Triceps', 3], ['Pectoral', 3], ['Dentelé antérieur', 2], ['Coiffe', 2]],
    push: true,
    advanced: true
  },
  {
    id: 'dive',
    title: 'Pompe plongeante arrière–avant',
    category: 'Amplitude en charge · Avancé',
    summary: 'Trajectoire continue en appui, à conserver seulement si elle correspond à l’objectif clinique fixé par le kiné.',
    steps: [
      'Choisir l’appui sur les genoux ou sur les pointes de pieds.',
      'Reculer légèrement les épaules en gardant les mains fixes.',
      'Descendre le thorax et le menton près du sol sans rupture.',
      'Faire progresser les épaules au-delà des mains.',
      'Repousser puis revenir par la même trajectoire contrôlée.'
    ],
    cues: ['Trajectoire continue.', 'Quatre appuis stables.', 'Aucune douleur ni pincement antérieur.'],
    dose: [2, 6, 'Après validation du kiné'],
    muscles: [['Dentelé antérieur', 3], ['Triceps', 3], ['Pectoral', 2], ['Coiffe', 2]],
    push: true,
    advanced: true
  }
];

const PRUDENT_SEQUENCE = EXERCISES.map((exercise, index) => exercise.advanced ? null : index).filter(index => index !== null);
const $ = selector => document.querySelector(selector);
const ui = {
  list: $('#exerciseList'), title: $('#title'), num: $('#num'), category: $('#category'), level: $('#level'),
  summary: $('#summary'), steps: $('#steps'), cues: $('#cues'), chips: $('#chips'), sets: $('#sets'),
  reps: $('#reps'), load: $('#load'), play: $('#play'), speed: $('#speed'), timeline: $('#timeline'),
  phase: $('#phase'), time: $('#time'), muscles: $('#muscles'), sequence: $('#sequence'),
  supportControl: $('#supportControl'), supportButtons: [...document.querySelectorAll('[data-support]')],
  supportNote: $('#supportNote')
};

let current = 0, t = 0, playing = true, autoSequence = false, sequencePosition = 0;
let showMuscles = false, ready = false, last = performance.now(), supportMode = 'knees';

const host = $('#viewer'), scene = new THREE.Scene();
scene.background = new THREE.Color(0xcadbd7); scene.fog = new THREE.Fog(0xcadbd7, 6, 11);
const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 30); camera.position.set(4.5, 2.35, 0.8);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05; host.prepend(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.62, 0.55); controls.enableDamping = true; controls.enablePan = false;
controls.minDistance = 2.8; controls.maxDistance = 6.2; controls.minPolarAngle = 0.42;
controls.maxPolarAngle = 1.48; controls.rotateSpeed = 0.55; controls.zoomSpeed = 0.65;

scene.add(new THREE.HemisphereLight(0xf5fffd, 0x36514c, 2.3));
const key = new THREE.DirectionalLight(0xffffff, 3.2); key.position.set(3, 5, 2); key.castShadow = true; scene.add(key);
const rim = new THREE.DirectionalLight(0x9eeadd, 1.8); rim.position.set(-3, 2, -3); scene.add(rim);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshStandardMaterial({ color: 0x9eb5b0, roughness: 0.92 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
const pivot = new THREE.Group(); scene.add(pivot); let model; const bones = {}, rest = new Map();
const overlayGroup = new THREE.Group(); scene.add(overlayGroup); const overlay = {};
[['shoulder',0xe93c2d,.105],['arm',0xe93c2d,.082],['chest',0xf18a34,.095],['scapula',0xf2c54e,.09]].forEach(([name,color,radius])=>{
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(radius,24,16),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.28,depthWrite:false,blending:THREE.AdditiveBlending}));
  overlay[name]=mesh; overlayGroup.add(mesh);
});
const V=(x,y,z)=>new THREE.Vector3(x,y,z),q0=new THREE.Quaternion(),q1=new THREE.Quaternion(),q2=new THREE.Quaternion(),v0=new THREE.Vector3(),v1=new THREE.Vector3();
const followBox=new THREE.Box3(),followCenter=new THREE.Vector3(),followDelta=new THREE.Vector3();
function wp(name){return bones[name]?.getWorldPosition(new THREE.Vector3())??new THREE.Vector3()}
function resetPose(){if(!model)return;for(const [name,value] of rest){const bone=bones[name];bone.position.copy(value.position);bone.quaternion.copy(value.quaternion);bone.scale.copy(value.scale)}pivot.position.set(0,0,0);pivot.rotation.set(0,0,0);pivot.scale.setScalar(1);model.updateMatrixWorld(true)}
function aim(name,childName,target){const bone=bones[name],child=bones[childName];if(!bone||!child)return;bone.updateWorldMatrix(true,false);child.updateWorldMatrix(true,false);const bonePosition=bone.getWorldPosition(v0),childPosition=child.getWorldPosition(v1);const from=childPosition.clone().sub(bonePosition).normalize(),to=target.clone().sub(bonePosition).normalize();if(from.lengthSq()<.5||to.lengthSq()<.5)return;const delta=q0.setFromUnitVectors(from,to),world=bone.getWorldQuaternion(q1),parentInverse=bone.parent.getWorldQuaternion(q2).invert();bone.quaternion.copy(parentInverse.multiply(delta.multiply(world)));bone.updateWorldMatrix(true,true)}
function support({y=.72,z=0,x=0,bend=.08,left=null,base='knees',handLift=0,handX=.27}){resetPose();pivot.rotation.x=Math.PI/2;pivot.position.set(x,y+(base==='toes'?.08:0),z);model.updateMatrixWorld(true);const shoulderLeft=wp('upperarm_l'),shoulderRight=wp('upperarm_r'),hipLeft=wp('thigh_l'),hipRight=wp('thigh_r');const handLeft=V(handX,.025+handLift,1.66),handRight=V(-handX,.025+handLift,1.66);const elbowLeft=shoulderLeft.clone().lerp(handLeft,.52).add(V(.16*bend,.05,0)),elbowRight=shoulderRight.clone().lerp(handRight,.52).add(V(-.16*bend,.05,0));if(left){aim('upperarm_l','lowerarm_l',left.elbow);aim('lowerarm_l','hand_l',left.wrist)}else{aim('upperarm_l','lowerarm_l',elbowLeft);aim('lowerarm_l','hand_l',handLeft);aim('hand_l','middle_01_l',handLeft.clone().add(V(0,0,.22)))}aim('upperarm_r','lowerarm_r',elbowRight);aim('lowerarm_r','hand_r',handRight);aim('hand_r','middle_01_r',handRight.clone().add(V(0,0,.22)));if(base==='knees'){const kneeLeft=V(hipLeft.x,.045,.82),kneeRight=V(hipRight.x,.045,.82),ankleLeft=V(hipLeft.x,.055,.30),ankleRight=V(hipRight.x,.055,.30);aim('thigh_l','calf_l',kneeLeft);aim('calf_l','foot_l',ankleLeft);aim('thigh_r','calf_r',kneeRight);aim('calf_r','foot_r',ankleRight);aim('foot_l','ball_l',ankleLeft.clone().add(V(0,-.01,-.18)));aim('foot_r','ball_r',ankleRight.clone().add(V(0,-.01,-.18)))}else{const kneeLeft=V(hipLeft.x,.28,.34),kneeRight=V(hipRight.x,.28,.34),ankleLeft=V(hipLeft.x,.12,-.20),ankleRight=V(hipRight.x,.12,-.20),toeLeft=V(hipLeft.x,.025,-.49),toeRight=V(hipRight.x,.025,-.49);aim('thigh_l','calf_l',kneeLeft);aim('calf_l','foot_l',ankleLeft);aim('foot_l','ball_l',toeLeft);aim('thigh_r','calf_r',kneeRight);aim('calf_r','foot_r',ankleRight);aim('foot_r','ball_r',toeRight)}model.updateMatrixWorld(true)}
function leanTorso(amount){if(!amount)return;model.updateMatrixWorld(true);let point=wp('spine_01');aim('spine_01','spine_02',point.clone().add(V(0,-.13*amount,.20*amount)));model.updateMatrixWorld(true);point=wp('spine_02');aim('spine_02','spine_03',point.clone().add(V(0,-.11*amount,.22*amount)));model.updateMatrixWorld(true)}
function groundHands(bend=.5){model.updateMatrixWorld(true);const shoulderLeft=wp('upperarm_l'),shoulderRight=wp('upperarm_r'),handLeft=V(.27,.025,1.66),handRight=V(-.27,.025,1.66),elbowLeft=shoulderLeft.clone().lerp(handLeft,.52).add(V(.16*bend,.05,0)),elbowRight=shoulderRight.clone().lerp(handRight,.52).add(V(-.16*bend,.05,0));aim('upperarm_l','lowerarm_l',elbowLeft);aim('lowerarm_l','hand_l',handLeft);aim('hand_l','middle_01_l',handLeft.clone().add(V(0,0,.22)));aim('upperarm_r','lowerarm_r',elbowRight);aim('lowerarm_r','hand_r',handRight);aim('hand_r','middle_01_r',handRight.clone().add(V(0,0,.22)));model.updateMatrixWorld(true)}
function supine(rotation){resetPose();pivot.rotation.x=-Math.PI/2;pivot.position.set(0,.18,-.1);model.updateMatrixWorld(true);for(const side of ['l','r']){const sign=side==='l'?1:-1,shoulder=wp(`upperarm_${side}`),elbow=V(sign*.76,.25,shoulder.z),wrist=V(sign*.76,.25+.5*(1-rotation),shoulder.z-.34*rotation);aim(`upperarm_${side}`,`lowerarm_${side}`,elbow);aim(`lowerarm_${side}`,`hand_${side}`,wrist)}model.updateMatrixWorld(true)}
function periodicCatmull(values,position){const count=values.length,scaled=((position%1)+1)%1*count,index=Math.floor(scaled),local=scaled-index,p0=values[(index-1+count)%count],p1=values[index%count],p2=values[(index+1)%count],p3=values[(index+2)%count],local2=local*local,local3=local2*local;return .5*(2*p1+(-p0+p2)*local+(2*p0-5*p1+4*p2-p3)*local2+(-p0+3*p1-3*p2+p3)*local3)}
const DIVE_CURVE={y:[.72,.67,.58,.54,.57,.68,.73,.72],z:[-.08,-.07,-.02,.08,.16,.15,.05,-.04],bend:[.08,.30,.68,.78,.66,.24,.10,.08],lean:[.05,.22,.66,1,.92,.50,.16,.07]};
function pose(exercise,position){const wave=(1-Math.cos(position*Math.PI*2))/2;if(exercise.id==='supine'){supine(wave)}else if(exercise.id==='reach'){resetPose();pivot.rotation.x=Math.PI/2;pivot.position.set(0,.72,0);model.updateMatrixWorld(true);const shoulder=wp('upperarm_l'),sign=shoulder.x>0?1:-1,elbow=shoulder.clone().add(V(.04*sign,.02,.38*wave)),wrist=shoulder.clone().add(V(.05*sign,.04,.82*wave));support({left:{elbow,wrist},bend:.08,base:'knees'})}else if(exercise.id==='airplane'){resetPose();pivot.rotation.x=Math.PI/2;pivot.position.set(0,.72,0);model.updateMatrixWorld(true);const shoulder=wp('upperarm_l'),sign=shoulder.x>0?1:-1,elbow=shoulder.clone().add(V(.42*sign,.08*wave,.02)),wrist=shoulder.clone().add(V(.82*sign,.10*wave,.04));support({left:{elbow,wrist},bend:.08,base:'knees'})}else if(exercise.id==='row'){resetPose();pivot.rotation.x=Math.PI/2;pivot.position.set(0,.72,0);model.updateMatrixWorld(true);const shoulder=wp('upperarm_l'),sign=shoulder.x>0?1:-1;if(position<.52){const amount=(1-Math.cos(position/.52*Math.PI))/2;support({left:{elbow:shoulder.clone().add(V(.26*sign,.18*amount,-.12)),wrist:shoulder.clone().add(V(.12*sign,-.08+.22*amount,-.20))},bend:.1,base:'knees'})}else{const amount=(1-Math.cos((position-.52)/.48*Math.PI))/2;support({left:{elbow:shoulder.clone().add(V(.26*sign,.18,-.12)),wrist:shoulder.clone().add(V(.12*sign,.11,-.20-.62*amount))},bend:.1,base:'knees'})}}else if(exercise.id==='rotate'){resetPose();pivot.rotation.x=Math.PI/2;pivot.position.set(0,.72,0);model.updateMatrixWorld(true);const shoulder=wp('upperarm_l'),sign=shoulder.x>0?1:-1,elbow=shoulder.clone().add(V(.48*sign,.03,.02)),wrist=elbow.clone().add(V(0,.08+.48*wave,.28*(1-wave)));support({left:{elbow,wrist},bend:.1,base:'knees'})}else if(exercise.id==='shift'){support({x:Math.sin(position*Math.PI*2)*.18,bend:.14,base:supportMode})}else if(exercise.id==='clap'){let y=.74,bend=.08,handLift=0,handX=.27;if(position<.30){const amount=(1-Math.cos(position/.30*Math.PI))/2;y=.74-.30*amount;bend=.08+.58*amount}else if(position<.50){const amount=(1-Math.cos((position-.30)/.20*Math.PI))/2;y=.44+.37*amount;bend=.66*(1-amount);handLift=.14*amount;handX=.27-.20*amount}else if(position<.68){const amount=(1-Math.cos((position-.50)/.18*Math.PI))/2;y=.81-.07*amount;bend=.10*amount;handLift=.14*(1-amount);handX=.07+.20*amount}else{const amount=(1-Math.cos((position-.68)/.32*Math.PI))/2;bend=.10*(1-amount)}support({y,bend,handLift,handX,base:supportMode})}else if(exercise.id==='dive'){const y=periodicCatmull(DIVE_CURVE.y,position),z=periodicCatmull(DIVE_CURVE.z,position),bend=THREE.MathUtils.clamp(periodicCatmull(DIVE_CURVE.bend,position),.06,.82),lean=THREE.MathUtils.clamp(periodicCatmull(DIVE_CURVE.lean,position),0,1.05);support({y,z,bend,base:supportMode});leanTorso(lean);groundHands(bend)}updateOverlays(exercise)}
function updateOverlays(exercise){if(!ready)return;overlayGroup.visible=showMuscles;const shoulder=wp('upperarm_l'),elbow=wp('lowerarm_l'),clavicle=wp('clavicle_l'),spine=wp('spine_03');overlay.shoulder.position.copy(shoulder);overlay.arm.position.copy(shoulder).lerp(elbow,.55);overlay.chest.position.copy(clavicle).add(V(-.06,-.06,.04));overlay.scapula.position.copy(spine).add(V(.16,.05,.05));const map={supine:[1,.8,.4,.8],reach:[1,.45,.7,1],airplane:[1,.55,.4,.9],row:[.75,1,.45,1],rotate:[1,.7,.35,.9],shift:[1,.65,.8,1],clap:[1,1,1,1],dive:[1,1,1,1]}[exercise.id],shapes=[[1.10,.52,.95],[.52,1.35,.52],[1.30,.40,.95],[1.18,.36,1.20]];Object.values(overlay).forEach((mesh,index)=>mesh.scale.set(shapes[index][0]*map[index],shapes[index][1]*map[index],shapes[index][2]*map[index]))}
function currentModelCenter(target=new THREE.Vector3()){if(!ready||!model)return target.set(0,.62,.55);followBox.setFromObject(model).getCenter(target);target.y=THREE.MathUtils.clamp(target.y,.32,1.12);return target}
function followModel(immediate=false){if(!ready)return;currentModelCenter(followCenter);followDelta.copy(followCenter).sub(controls.target).multiplyScalar(immediate?1:.14);controls.target.add(followDelta);camera.position.add(followDelta)}
function frameCurrent(){const id=EXERCISES[current].id;if(id==='supine'){camera.position.set(4.7,2.75,-.35);controls.target.set(0,.42,-.25)}else if(id==='airplane'){camera.position.set(1.25,2.25,-4.25);controls.target.set(0,.58,.62)}else if(id==='dive'||id==='clap'||id==='shift'){camera.position.set(4.8,2.25,.85);controls.target.set(0,.55,.58)}else{camera.position.set(4.25,2.15,.85);controls.target.set(0,.58,.72)}followModel(true);controls.update()}
function renderInfo(){const exercise=EXERCISES[current];ui.list.innerHTML=EXERCISES.map((item,index)=>`<button class="exercise ${index===current?'active':''}" data-n="${index}"><span class="n">${String(index+1).padStart(2,'0')}</span><span><strong>${item.title}</strong><small>${item.category}${item.advanced?' · validation requise':''}</small></span></button>`).join('');ui.list.querySelectorAll('button').forEach(button=>button.onclick=()=>{current=Number(button.dataset.n);t=0;renderInfo()});ui.num.textContent=String(current+1).padStart(2,'0');ui.title.textContent=exercise.title;ui.category.textContent=exercise.category;ui.level.textContent=exercise.advanced?'Avancé — hors séquence prudente':'Séquence prudente';ui.level.classList.toggle('advanced',Boolean(exercise.advanced));ui.summary.textContent=exercise.summary;ui.steps.innerHTML=exercise.steps.map(step=>`<li>${step}</li>`).join('');ui.cues.innerHTML=exercise.cues.map(cue=>`<li>${cue}</li>`).join('');ui.chips.innerHTML=exercise.muscles.map(([name,level])=>`<span class="chip ${level===3?'p':level===2?'s':'t'}">${name}</span>`).join('');[ui.sets.value,ui.reps.value,ui.load.value]=exercise.dose;ui.supportControl.hidden=!exercise.push;ui.supportButtons.forEach(button=>button.classList.toggle('active',button.dataset.support===supportMode));ui.supportNote.textContent=supportMode==='knees'?'Charge réduite : progression avant la variante sur les pieds.':'Charge supérieure : uniquement si le contrôle reste strict.';frameCurrent()}
function phaseLabel(exercise,position){if(exercise.id==='dive'){if(position<.18)return'Recul contrôlé';if(position<.42)return'Descente continue';if(position<.64)return'Passage vers l’avant';if(position<.84)return'Repoussée';return'Retour continu'}if(exercise.id==='clap'){if(position<.30)return'Descente';if(position<.52)return'Poussée dynamique';if(position<.68)return'Réception';return'Stabilisation'}if(position<.12)return'Position initiale';if(position<.42)return'Mise en mouvement';if(position<.72)return'Phase active';return'Retour contrôlé'}
function diagnostics(){const center=currentModelCenter(new THREE.Vector3()),jointNames=['upperarm_l','hand_l','upperarm_r','hand_r','calf_l','foot_l','ball_l','calf_r','foot_r','ball_r'],joints={};for(const name of jointNames)joints[name]=wp(name).toArray();return{ready,exercise:EXERCISES[current].id,supportMode,camera:{panEnabled:controls.enablePan,target:controls.target.toArray(),center:center.toArray(),distanceToCenter:controls.target.distanceTo(center),distance:camera.position.distanceTo(controls.target)},joints}}
window.__APP_DIAGNOSTICS__=diagnostics;
function loadModel(){const neutralTexture=new THREE.TextureLoader().load('assets/quaternius/fullbody/T_Neutral_Male.png');neutralTexture.flipY=false;neutralTexture.colorSpace=THREE.SRGBColorSpace;new GLTFLoader().load('assets/quaternius/fullbody/Superhero_Male_FullBody.gltf',gltf=>{model=gltf.scene;model.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;object.frustumCulled=false;if(object.material?.name?.toLowerCase().includes('superhero')){object.material=object.material.clone();object.material.map=neutralTexture;object.material.normalMap=null;object.material.roughness=.92;object.material.metalness=0;object.material.needsUpdate=true}}if(object.isBone)bones[object.name]=object});pivot.add(model);let box=new THREE.Box3().setFromObject(model),height=box.max.y-box.min.y;const scale=2/height;model.scale.set(scale*.84,scale,scale*.90);model.updateMatrixWorld(true);box.setFromObject(model);model.position.x-=(box.min.x+box.max.x)/2;model.position.y-=box.min.y;model.position.z-=(box.min.z+box.max.z)/2;model.updateMatrixWorld(true);for(const [name,bone] of Object.entries(bones))rest.set(name,{position:bone.position.clone(),quaternion:bone.quaternion.clone(),scale:bone.scale.clone()});ready=true;$('#loader').remove();document.documentElement.dataset.ready='true';pose(EXERCISES[current],t);frameCurrent()},undefined,error=>{$('#loader').textContent='Échec du chargement du modèle neutre';console.error(error)})}
function resize(){const rect=host.getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix()}new ResizeObserver(resize).observe(host);resize();
ui.play.onclick=()=>{playing=!playing;ui.play.textContent=playing?'Pause':'Lecture'};ui.timeline.oninput=()=>{t=Number(ui.timeline.value)/1000;playing=false;ui.play.textContent='Lecture'};ui.muscles.onclick=()=>{showMuscles=!showMuscles;ui.muscles.classList.toggle('active',showMuscles)};ui.sequence.onclick=()=>{autoSequence=!autoSequence;sequencePosition=Math.max(0,PRUDENT_SEQUENCE.indexOf(current));if(autoSequence&&EXERCISES[current].advanced){sequencePosition=0;current=PRUDENT_SEQUENCE[0];t=0;renderInfo()}ui.sequence.textContent=autoSequence?'Arrêter':'Séquence prudente'};ui.supportButtons.forEach(button=>button.onclick=()=>{supportMode=button.dataset.support;ui.supportButtons.forEach(item=>item.classList.toggle('active',item===button));ui.supportNote.textContent=supportMode==='knees'?'Charge réduite : progression avant la variante sur les pieds.':'Charge supérieure : uniquement si le contrôle reste strict.'});
document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>{const view=button.dataset.view,center=currentModelCenter(new THREE.Vector3());controls.target.copy(center);if(view==='left')camera.position.copy(center).add(V(4.2,1.55,0));if(view==='front')camera.position.copy(center).add(V(0,1.65,-4.2));if(view==='back')camera.position.copy(center).add(V(0,1.65,4.2));controls.update()});$('#resetView').onclick=frameCurrent;
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(playing){t+=dt*(Number(ui.speed.value)||1)/5;if(t>=1){t%=1;if(autoSequence){sequencePosition=(sequencePosition+1)%PRUDENT_SEQUENCE.length;current=PRUDENT_SEQUENCE[sequencePosition];renderInfo()}}ui.timeline.value=String(t*1000)}if(ready){pose(EXERCISES[current],t);followModel(false)}ui.phase.textContent=phaseLabel(EXERCISES[current],t);ui.time.textContent=`${(t*5).toFixed(1).replace('.',',')} s`;controls.update();renderer.render(scene,camera);requestAnimationFrame(loop)}
renderInfo();loadModel();requestAnimationFrame(loop);
