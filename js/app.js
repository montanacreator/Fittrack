// Router, Theme, Modals und Aktionen
const ICONS={dashboard:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
training:'<path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>',recipes:'<path d="M5 3v8a3 3 0 003 3v7M8 3v6M11 3v8a3 3 0 01-3 3M17 21V3c-2 1-3 4-3 8h3"/>',
progress:'<path d="M3 17l6-6 4 4 8-9M15 6h6v6"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'};
const ROUTES=[['dashboard','Dashboard'],['training','Training'],['recipes','Rezepte'],['progress','Fortschritte'],['calendar','Kalender'],['settings','Einstellungen']];
const navHtml=ROUTES.map(([k,l])=>`<a href="#${k}" data-k="${k}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg><span>${l}</span></a>`).join('');
$('#nav').innerHTML=navHtml;$('#tabbar').innerHTML=navHtml;

function render(){
  document.documentElement.dataset.theme=Store.data.settings.theme;
  document.querySelectorAll('[data-k]').forEach(a=>a.classList.toggle('on',a.dataset.k===UI.view));
  $('#view').innerHTML=Views[UI.view]();renderModal();
}
function renderModal(){
  const m=$('#modal');
  if(UI.modal){m.hidden=false;m.innerHTML=`<div class="sheet">${Views[UI.modal.v](UI.modal.arg)}</div>`}else{m.hidden=true;m.innerHTML=''}
}
const open=(v,arg)=>{UI.modal={v,arg};renderModal()};
function route(){const k=location.hash.slice(1);UI.view=ROUTES.some(r=>r[0]===k)?k:'dashboard';UI.modal=null;render();scrollTo(0,0)}
function setPath(path,val){const ks=path.split('.');let o=ks[0]==='draft'?UI:Store.data;ks.slice(0,-1).forEach(k=>o=o[k]);o[ks.at(-1)]=val}
const shift=n=>{const d=new Date(UI.calDate);UI.calMode==='month'?d.setMonth(d.getMonth()+n,1):d.setDate(d.getDate()+7*n);UI.calDate=d;render()};
const D=()=>Store.data, save=()=>{Store.save();render()};

const A={
  theme(){A.setTheme({v:D().settings.theme==='dark'?'light':'dark'})},
  setTheme(e){D().settings.theme=e.v;save()},
  go(e){location.hash=e.v},
  close(){UI.modal=null;UI.draft=null;render()},
  /* Training */
  newPlan(){UI.draft={name:'',exercises:[{id:Store.uid(),name:'',sets:3,reps:10,kg:0}]};open('planEditor')},
  editPlan(e){UI.draft=structuredClone(D().plans.find(p=>p.id===e.id));open('planEditor')},
  delPlan(e){if(confirm('Plan löschen?')){D().plans=D().plans.filter(p=>p.id!==e.id);save()}},
  addEx(){UI.draft.exercises.push({id:Store.uid(),name:'',sets:3,reps:10,kg:0});renderModal()},
  delEx(e){UI.draft.exercises.splice(+e.i,1);renderModal()},
  savePlan(){const p=UI.draft;if(!p.name.trim())return alert('Bitte einen Namen eingeben.');p.exercises=p.exercises.filter(x=>x.name.trim());
    const L=D().plans,i=L.findIndex(x=>x.id===p.id);i>=0?L[i]=p:L.push({...p,id:Store.uid()});Store.save();A.close()},
  start(e){const d=D();if(d.active&&!confirm('Laufendes Training verwerfen und neues starten?'))return;const p=d.plans.find(x=>x.id===e.id);
    d.active={planId:p.id,name:p.name,start:Date.now(),exercises:p.exercises.map(x=>({name:x.name,done:false,sets:Array.from({length:x.sets},()=>({reps:x.reps,kg:x.kg,done:false}))}))};
    Store.save();location.hash==='#training'?render():location.hash='training'},
  addSet(e){const s=D().active.exercises[+e.i].sets;s.push({...(s.at(-1)||{reps:10,kg:0}),done:false});save()},
  delSet(e){D().active.exercises[+e.i].sets.splice(+e.j,1);save()},
  exDone(e){const x=D().active.exercises[+e.i];x.done=!x.done;x.sets.forEach(s=>s.done=x.done);save()},
  cancelWorkout(){if(confirm('Training verwerfen?')){D().active=null;save()}},
  finish(){const a=D().active;if(!a.exercises.some(x=>x.sets.some(s=>s.done))&&!confirm('Kein Satz abgehakt. Trotzdem beenden?'))return;
    const t=Store.today();D().sessions.push({id:Store.uid(),date:t,planId:a.planId,name:a.name,duration:Math.max(1,Math.round((Date.now()-a.start)/60000)),done:true,exercises:a.exercises.map(({name,sets})=>({name,sets}))});
    const c=D().calendar.find(x=>x.date===t&&x.planId===a.planId&&x.type==='workout');if(c)c.done=true;D().active=null;save()},
  sessionDetail(e){open('sessionDetail',e.id)},
  delSession(e){if(confirm('Einheit löschen?')){D().sessions=D().sessions.filter(s=>s.id!==e.id);UI.modal=null;save()}},
  /* Rezepte */
  cat(e){UI.cat=e.v;render()},
  newRecipe(){UI.draft={name:'',image:'',category:'Frühstück',time:'',difficulty:'',ingredients:'',steps:''};open('recipeEditor')},
  editRecipe(e){const r=structuredClone(D().recipes.find(x=>x.id===e.id));r.ingredients=r.ingredients.join('\n');r.steps=r.steps.join('\n');UI.draft=r;open('recipeEditor')},
  viewRecipe(e){open('recipeDetail',e.id)},
  fav(e){const r=D().recipes.find(x=>x.id===e.id);r.fav=!r.fav;save()},
  delRecipe(e){if(confirm('Rezept löschen?')){D().recipes=D().recipes.filter(r=>r.id!==e.id);UI.modal=null;save()}},
  saveRecipe(){const r=UI.draft;if(!r.name.trim())return alert('Bitte einen Namen eingeben.');const L=s=>String(s).split('\n').map(x=>x.trim()).filter(Boolean);
    const o={...r,ingredients:L(r.ingredients),steps:L(r.steps),fav:!!r.fav},R=D().recipes,i=R.findIndex(x=>x.id===r.id);i>=0?R[i]=o:R.push({...o,id:Store.uid()});Store.save();A.close()},
  /* Fortschritte */
  weightAdd(){const kg=+$('#wkg').value;if(!kg)return;D().weights.push({id:Store.uid(),date:$('#wdate').value||Store.today(),kg});D().weights.sort((a,b)=>a.date.localeCompare(b.date));save()},
  weightDel(e){D().weights=D().weights.filter(w=>w.id!==e.id);save()},
  recAdd(){const ex=$('#rex').value.trim(),kg=+$('#rkg').value;if(!ex||!kg)return;D().records.push({id:Store.uid(),ex,kg,date:Store.today()});save()},
  /* Kalender */
  calPrev(){shift(-1)},calNext(){shift(1)},calToday(){UI.calDate=new Date();render()},calMode(e){UI.calMode=e.v;render()},
  day(e){open('dayModal',e.date)},
  addCal(e){const p=$('#planSel')?.value;if(e.v==='workout'&&!p)return alert('Lege zuerst einen Trainingsplan an.');D().calendar.push({id:Store.uid(),date:UI.modal.arg,type:e.v,planId:e.v==='workout'?p:null,done:false});save()},
  toggleCal(e){const c=D().calendar.find(x=>x.id===e.id);c.done=!c.done;save()},
  delCal(e){D().calendar=D().calendar.filter(x=>x.id!==e.id);save()},
  /* Einstellungen */
  export(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(D(),null,2)],{type:'application/json'}));a.download=`fittrack-${Store.today()}.json`;a.click()},
  reset(){if(confirm('Wirklich alle Daten löschen? Das kann nicht rückgängig gemacht werden.')){Store.reset();save()}}
};

document.addEventListener('click',e=>{
  if(e.target.id==='modal')return A.close();
  const el=e.target.closest('[data-act]');if(el&&A[el.dataset.act])A[el.dataset.act](el.dataset);
});
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.id==='search'){UI.q=t.value;$('#grid').innerHTML=Views.recipeGrid();return}
  if(!t.dataset.bind)return;
  setPath(t.dataset.bind,t.type==='checkbox'?t.checked:t.type==='number'?(t.value===''?0:+t.value):t.value);
  if(!t.dataset.bind.startsWith('draft'))Store.save();
});
document.addEventListener('change',e=>{
  const t=e.target,f=t.files&&t.files[0];
  if(t.id==='exSel'){UI.progEx=t.value;render()}
  if(t.id==='imgFile'&&f){const r=new FileReader();r.onload=()=>{UI.draft.image=r.result;alert('Bild übernommen.')};r.readAsDataURL(f)}
  if(t.id==='importFile'&&f){const r=new FileReader();r.onload=()=>{try{Store.replace(JSON.parse(r.result));render();alert('Daten importiert.')}catch{alert('Die Datei ist keine gültige FitTrack-Sicherung.')}};r.readAsText(f)}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&UI.modal)A.close()});
setInterval(()=>{const t=$('#timer');if(t&&D().active)t.textContent=Views.elapsed(D().active)},1000);
addEventListener('hashchange',route);route();
