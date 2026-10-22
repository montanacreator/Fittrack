// Ansichten: jede Funktion liefert HTML als String
const UI={view:'dashboard',q:'',cat:'Alle',calMode:'month',calDate:new Date(),progEx:'',modal:null,draft:null};
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(i,o={day:'numeric',month:'short'})=>new Date(i+'T12:00').toLocaleDateString('de-DE',o);
const pct=(a,b)=>b?Math.min(100,Math.round(a/b*100)):0;
const bar=p=>`<div class="bar"><i style="width:${p}%"></i></div>`;
const vol=s=>s.exercises.reduce((a,e)=>a+e.sets.filter(x=>x.done).reduce((b,x)=>b+x.reps*x.kg,0),0);
const maxKg=e=>Math.max(0,...e.sets.filter(x=>x.done).map(x=>x.kg));
const CATS=['Frühstück','Mittagessen','Abendessen','Snacks'];
const head=(t,sub,btn='')=>`<header class="top"><div><h1>${t}</h1><p class="mute">${sub}</p></div>${btn}</header>`;
const field=(l,path,v,type='text',x='')=>`<label class="f"><span>${l}</span><input type="${type}" data-bind="${path}" value="${esc(v)}" ${x}></label>`;
const prs=()=>{const m={},D=Store.data;D.sessions.forEach(s=>s.exercises.forEach(e=>{const k=maxKg(e);if(k>0&&(!m[e.name]||k>=m[e.name].kg))m[e.name]={kg:k,date:s.date}}));
  D.records.forEach(r=>{if(!m[r.ex]||r.kg>m[r.ex].kg)m[r.ex]={kg:r.kg,date:r.date}});return m};

const Views={
/* ---------- Dashboard ---------- */
dashboard(){
  const d=Store.data,t=Store.today(),s=d.settings,ws=Store.iso(Store.weekStart(new Date()));
  const wk=d.sessions.filter(x=>x.date>=ws).length,mo=d.sessions.filter(x=>x.date.slice(0,7)===t.slice(0,7)).length;
  const nx=d.calendar.filter(c=>c.type==='workout'&&!c.done&&c.date>=t).sort((a,b)=>a.date.localeCompare(b.date))[0];
  const pl=nx&&d.plans.find(p=>p.id===nx.planId),rec=[...d.sessions].reverse().slice(0,5),w=d.weights.at(-1),P=Object.entries(prs()).slice(0,4);
  return head('Dashboard',fmt(t,{weekday:'long',day:'numeric',month:'long'}))+`<div class="grid">
  <section class="card span2"><h3>Nächstes Training</h3>${pl?`<div class="big">${esc(pl.name)}</div><p class="mute">${fmt(nx.date,{weekday:'long',day:'numeric',month:'long'})} · ${pl.exercises.length} Übungen</p><div class="actions"><button class="btn" data-act="start" data-id="${pl.id}">Jetzt starten</button></div>`:`<p class="mute">Kein Training geplant.</p><div class="actions"><button class="btn" data-act="go" data-v="calendar">Training planen</button></div>`}</section>
  <section class="card"><h3>Diese Woche</h3><div class="big">${wk}<small> / ${s.weeklyGoal}</small></div>${bar(pct(wk,s.weeklyGoal))}<p class="mute">Trainingseinheiten</p></section>
  <section class="card"><h3>Trainingsziele</h3><p class="row"><span>Woche</span><b>${wk}/${s.weeklyGoal}</b></p>${bar(pct(wk,s.weeklyGoal))}<p class="row"><span>Monat</span><b>${mo}/${s.monthlyGoal}</b></p>${bar(pct(mo,s.monthlyGoal))}${w?`<p class="row"><span>Körpergewicht</span><b>${w.kg} kg</b></p>`:''}</section>
  <section class="card span2"><h3>Letzte Aktivitäten</h3>${rec.map(x=>`<div class="item"><div><b>${esc(x.name)}</b><p class="mute">${fmt(x.date)} · ${x.duration} Min</p></div><span class="pill">${Math.round(vol(x))} kg Volumen</span></div>`).join('')||'<p class="mute">Noch keine Einheit abgeschlossen. Starte dein erstes Training.</p>'}</section>
  <section class="card span2"><h3>Persönliche Rekorde</h3>${P.map(([n,r])=>`<div class="item"><b>${esc(n)}</b><span class="pill">${r.kg} kg</span></div>`).join('')||'<p class="mute">Rekorde entstehen automatisch aus deinen Trainings.</p>'}</section></div>`},

/* ---------- Training ---------- */
training(){
  const d=Store.data;
  return head('Training','Pläne, Einheiten und Verlauf','<button class="btn" data-act="newPlan">+ Neuer Plan</button>')+(d.active?this.active(d.active):'')+
  `<h2>Trainingspläne</h2><div class="grid">${d.plans.map(p=>`<section class="card"><h3>${esc(p.name)}</h3><ul class="plain">${p.exercises.map(e=>`<li>${esc(e.name)} <span class="mute">${e.sets}×${e.reps}${e.kg?` · ${e.kg} kg`:''}</span></li>`).join('')}</ul><div class="actions"><button class="btn sm" data-act="start" data-id="${p.id}">Start</button><button class="btn sm ghost" data-act="editPlan" data-id="${p.id}">Bearbeiten</button><button class="btn sm ghost" data-act="delPlan" data-id="${p.id}">Löschen</button></div></section>`).join('')||'<p class="mute">Lege deinen ersten Trainingsplan an.</p>'}</div><h2>Verlauf</h2>${this.history()}`},
elapsed:a=>{const m=Math.floor((Date.now()-a.start)/1000);return Math.floor(m/60)+':'+String(m%60).padStart(2,'0')},
active(a){return `<section class="card live"><div class="row"><div><h3>${esc(a.name)}</h3><p class="mute">Läuft seit <b id="timer">${Views.elapsed(a)}</b> Min</p></div><div class="actions"><button class="btn" data-act="finish">Beenden</button><button class="btn ghost" data-act="cancelWorkout">Verwerfen</button></div></div>`+
  a.exercises.map((e,i)=>`<div class="ex ${e.done?'done':''}"><div class="row"><b>${esc(e.name)}</b><span><button class="btn sm ghost" data-act="addSet" data-i="${i}">+ Satz</button> <button class="btn sm" data-act="exDone" data-i="${i}">${e.done?'✓ Erledigt':'Erledigt'}</button></span></div>`+
  e.sets.map((s,j)=>`<div class="set"><span>${j+1}</span><input type="number" min="0" data-bind="active.exercises.${i}.sets.${j}.reps" value="${s.reps}"><em>Wdh</em><input type="number" min="0" step="0.5" data-bind="active.exercises.${i}.sets.${j}.kg" value="${s.kg}"><em>kg</em><input type="checkbox" data-bind="active.exercises.${i}.sets.${j}.done" ${s.done?'checked':''} aria-label="Satz erledigt"><button class="x" data-act="delSet" data-i="${i}" data-j="${j}" aria-label="Satz entfernen">×</button></div>`).join('')+'</div>').join('')+'</section>'},
history(){
  const all=Store.data.sessions;if(!all.length)return '<p class="mute">Noch keine abgeschlossenen Einheiten.</p>';
  return '<section class="card">'+[...all].reverse().map(s=>{const prev=all.slice(0,all.indexOf(s)).reverse().find(x=>x.planId===s.planId),dv=prev?Math.round(vol(s)-vol(prev)):null;
    return `<div class="item click" data-act="sessionDetail" data-id="${s.id}"><div><b>${esc(s.name)}</b><p class="mute">${fmt(s.date,{day:'numeric',month:'long',year:'numeric'})} · ${s.duration} Min</p></div><span class="pill">${Math.round(vol(s))} kg${dv===null?'':` (${dv>=0?'+':''}${dv})`}</span></div>`}).join('')+'</section>'},
sessionDetail(id){
  const all=Store.data.sessions,s=all.find(x=>x.id===id),prev=all.slice(0,all.indexOf(s)).reverse().find(x=>x.planId===s.planId);
  return `<h2>${esc(s.name)} · ${fmt(s.date)}</h2>${prev?`<p class="mute">Vergleich mit ${fmt(prev.date)}</p>`:''}`+s.exercises.map(e=>{const pe=prev&&prev.exercises.find(x=>x.name===e.name),k=maxKg(e),pk=pe?maxKg(pe):null;
    return `<div class="item"><div><b>${esc(e.name)}</b><p class="mute">${e.sets.filter(x=>x.done).map(x=>x.reps+'×'+x.kg).join(', ')||'keine Sätze erledigt'}</p></div><span class="pill">${k} kg${pk===null?'':` (${k-pk>=0?'+':''}${k-pk})`}</span></div>`}).join('')+
    `<div class="actions end"><button class="btn danger" data-act="delSession" data-id="${id}">Löschen</button><button class="btn" data-act="close">Schließen</button></div>`},
planEditor(){
  const p=UI.draft;
  return `<h2>${p.id?'Plan bearbeiten':'Neuer Plan'}</h2>${field('Name','draft.name',p.name)}<h3>Übungen</h3>`+p.exercises.map((e,i)=>`<div class="exrow">${field('Übung',`draft.exercises.${i}.name`,e.name)}${field('Sätze',`draft.exercises.${i}.sets`,e.sets,'number','min=1')}${field('Wdh',`draft.exercises.${i}.reps`,e.reps,'number','min=1')}${field('kg',`draft.exercises.${i}.kg`,e.kg,'number','min=0 step=0.5')}<button class="x" data-act="delEx" data-i="${i}" aria-label="Übung entfernen">×</button></div>`).join('')+
  `<button class="btn ghost" data-act="addEx">+ Übung</button><div class="actions end"><button class="btn ghost" data-act="close">Abbrechen</button><button class="btn" data-act="savePlan">Speichern</button></div>`},

/* ---------- Rezepte ---------- */
recipes(){
  return head('Rezepte','Deine Sammlung','<button class="btn" data-act="newRecipe">+ Neues Rezept</button>')+
  `<div class="toolbar"><input id="search" type="search" placeholder="Rezept oder Zutat suchen" value="${esc(UI.q)}"><div class="chips">${['Alle',...CATS,'Favoriten'].map(c=>`<button class="chip ${UI.cat===c?'on':''}" data-act="cat" data-v="${c}">${c}</button>`).join('')}</div></div><div class="grid rgrid" id="grid">${this.recipeGrid()}</div>`},
img:r=>r.image?`<div class="img" style="background-image:url('${esc(r.image)}')"></div>`:`<div class="img ph">${esc(r.name[0]||'?')}</div>`,
recipeGrid(){
  const q=UI.q.toLowerCase(),c=UI.cat;
  return Store.data.recipes.filter(r=>(c==='Alle'||(c==='Favoriten'?r.fav:r.category===c))&&(!q||r.name.toLowerCase().includes(q)||r.ingredients.some(i=>i.toLowerCase().includes(q))))
  .map(r=>`<article class="card rcard" data-act="viewRecipe" data-id="${r.id}">${Views.img(r)}<div class="rb"><div class="row"><h3>${esc(r.name)}</h3><button class="x heart ${r.fav?'on':''}" data-act="fav" data-id="${r.id}" aria-label="Favorit">${r.fav?'♥':'♡'}</button></div><p class="mute">${r.category}${r.time?` · ${r.time} Min`:''}${r.difficulty?` · ${r.difficulty}`:''}</p></div></article>`).join('')||'<p class="mute">Keine Rezepte gefunden.</p>'},
recipeDetail(id){
  const r=Store.data.recipes.find(x=>x.id===id);
  return `${Views.img(r)}<h2>${esc(r.name)}</h2><p class="mute">${r.category}${r.time?` · ${r.time} Min`:''}${r.difficulty?` · ${r.difficulty}`:''}</p><h3 style="margin-top:16px">Zutaten</h3><ul class="plain">${r.ingredients.map(i=>`<li>${esc(i)}</li>`).join('')}</ul><h3 style="margin-top:16px">Zubereitung</h3><ol>${r.steps.map(i=>`<li>${esc(i)}</li>`).join('')}</ol>
  <div class="actions"><button class="btn ghost" data-act="fav" data-id="${id}">${r.fav?'♥ Favorit':'♡ Als Favorit'}</button><button class="btn ghost" data-act="editRecipe" data-id="${id}">Bearbeiten</button><button class="btn danger" data-act="delRecipe" data-id="${id}">Löschen</button><button class="btn" data-act="close">Schließen</button></div>`},
recipeEditor(){
  const r=UI.draft;
  return `<h2>${r.id?'Rezept bearbeiten':'Neues Rezept'}</h2>${field('Name','draft.name',r.name)}<label class="f"><span>Bild hochladen (optional)</span><input type="file" id="imgFile" accept="image/*"></label>${field('oder Bild-URL','draft.image',r.image&&r.image.startsWith('data:')?'':r.image)}
  <div class="inline"><label class="f" style="flex:1"><span>Kategorie</span><select data-bind="draft.category">${CATS.map(c=>`<option ${r.category===c?'selected':''}>${c}</option>`).join('')}</select></label>${field('Zeit (Min)','draft.time',r.time,'number','min=0')}<label class="f" style="flex:1"><span>Schwierigkeit</span><select data-bind="draft.difficulty">${['','Leicht','Mittel','Schwer'].map(c=>`<option ${r.difficulty===c?'selected':''}>${c}</option>`).join('')}</select></label></div>
  <label class="f"><span>Zutaten mit Mengen (eine pro Zeile)</span><textarea data-bind="draft.ingredients">${esc(r.ingredients)}</textarea></label><label class="f"><span>Zubereitungsschritte (einer pro Zeile)</span><textarea data-bind="draft.steps">${esc(r.steps)}</textarea></label>
  <div class="actions end"><button class="btn ghost" data-act="close">Abbrechen</button><button class="btn" data-act="saveRecipe">Speichern</button></div>`},

/* ---------- Fortschritte ---------- */
progress(){
  const d=Store.data,ex=[...new Set(d.sessions.flatMap(s=>s.exercises.map(e=>e.name)))];
  if(!ex.includes(UI.progEx))UI.progEx=ex[0]||'';
  const pts=d.sessions.map(s=>{const e=s.exercises.find(e=>e.name===UI.progEx);return e&&maxKg(e)?{l:fmt(s.date),v:maxKg(e)}:null}).filter(Boolean);
  const wk=[...Array(8)].map((_,i)=>{const a=Store.weekStart(new Date());a.setDate(a.getDate()-7*(7-i));const b=new Date(a);b.setDate(b.getDate()+7);const from=Store.iso(a),to=Store.iso(b);return{l:fmt(from),v:d.sessions.filter(s=>s.date>=from&&s.date<to).length}});
  const P=Object.entries(prs()).sort((a,b)=>b[1].kg-a[1].kg);
  return head('Fortschritte','Entwicklung über die Zeit')+`<div class="grid">
  <section class="card span2"><h3>Körpergewicht (optional)</h3><div class="inline"><input id="wkg" type="number" step="0.1" placeholder="kg"><input id="wdate" type="date" value="${Store.today()}"><button class="btn" data-act="weightAdd">Eintragen</button></div>${Charts.line(d.weights.map(w=>({l:fmt(w.date),v:w.kg})),' kg')}${d.weights.slice(-3).reverse().map(w=>`<div class="item"><span>${fmt(w.date)} · <b>${w.kg} kg</b></span><button class="x" data-act="weightDel" data-id="${w.id}" aria-label="Eintrag löschen">×</button></div>`).join('')}</section>
  <section class="card span2"><h3>Trainingshäufigkeit pro Woche</h3>${Charts.bar(wk)}</section>
  <section class="card span2"><h3>Leistung vergleichen</h3>${ex.length?`<select id="exSel">${ex.map(e=>`<option ${e===UI.progEx?'selected':''}>${esc(e)}</option>`).join('')}</select><p class="mute" style="margin:8px 0">Höchstes Gewicht pro Einheit</p>${Charts.line(pts,' kg')}`:'<p class="mute">Schließe ein Training ab, um Verläufe zu sehen.</p>'}</section>
  <section class="card span2"><h3>Persönliche Rekorde</h3><div class="inline"><input id="rex" placeholder="Übung"><input id="rkg" type="number" step="0.5" placeholder="kg"><button class="btn" data-act="recAdd">Speichern</button></div>${P.map(([n,r])=>`<div class="item"><div><b>${esc(n)}</b><p class="mute">${fmt(r.date)}</p></div><span class="pill">${r.kg} kg</span></div>`).join('')||'<p class="mute">Noch keine Rekorde.</p>'}</section></div>`},

/* ---------- Kalender ---------- */
calendar(){
  const d=Store.data,c=UI.calDate,month=UI.calMode==='month',t=Store.today();let days,title;
  if(month){const s=Store.weekStart(new Date(c.getFullYear(),c.getMonth(),1));days=[...Array(42)].map((_,i)=>{const x=new Date(s);x.setDate(s.getDate()+i);return x});title=c.toLocaleDateString('de-DE',{month:'long',year:'numeric'})}
  else{const s=Store.weekStart(c);days=[...Array(7)].map((_,i)=>{const x=new Date(s);x.setDate(s.getDate()+i);return x});title=fmt(Store.iso(days[0]))+' – '+fmt(Store.iso(days[6]),{day:'numeric',month:'short',year:'numeric'})}
  const cells=days.map(x=>{const i=Store.iso(x),ev=d.calendar.filter(e=>e.date===i).map(e=>e.type==='rest'?`<span class="ev rest">Ruhetag</span>`:`<span class="ev ${e.done?'done':'planned'}">${esc((d.plans.find(p=>p.id===e.planId)||{name:'Workout'}).name)}</span>`).join('');
    const se=d.sessions.filter(s=>s.date===i&&!d.calendar.some(e=>e.date===i&&e.planId===s.planId&&e.done)).map(s=>`<span class="ev done">${esc(s.name)}</span>`).join('');
    return `<div class="cell ${month?'':'wk'} ${month&&x.getMonth()!==c.getMonth()?'off':''} ${i===t?'today':''}" data-act="day" data-date="${i}"><b>${x.getDate()}</b>${ev}${se}</div>`}).join('');
  return head('Kalender','Planen, abhaken, Ruhetage eintragen',`<div class="actions" style="margin:0"><div class="seg"><button class="${month?'on':''}" data-act="calMode" data-v="month">Monat</button><button class="${month?'':'on'}" data-act="calMode" data-v="week">Woche</button></div></div>`)+
  `<section class="card"><div class="row" style="margin-bottom:12px"><button class="btn ghost sm" data-act="calPrev" aria-label="Zurück">‹</button><h3 style="margin:0">${title}</h3><span><button class="btn ghost sm" data-act="calToday">Heute</button> <button class="btn ghost sm" data-act="calNext" aria-label="Weiter">›</button></span></div><div class="cal">${['Mo','Di','Mi','Do','Fr','Sa','So'].map(w=>`<div class="wd">${w}</div>`).join('')}${cells}</div><p class="mute" style="margin-top:12px">Ausgefüllt: erledigt · Umrandet: geplant · Gestrichelt: Ruhetag</p></section>`},
dayModal(date){
  const d=Store.data,en=d.calendar.filter(e=>e.date===date),se=d.sessions.filter(s=>s.date===date);
  return `<h2>${fmt(date,{weekday:'long',day:'numeric',month:'long'})}</h2>`+
  en.map(e=>`<div class="item"><b>${e.type==='rest'?'Ruhetag':esc((d.plans.find(p=>p.id===e.planId)||{name:'Workout'}).name)}</b><span>${e.type==='workout'?`<button class="btn sm ghost" data-act="toggleCal" data-id="${e.id}">${e.done?'✓ Erledigt':'Als erledigt markieren'}</button> `:''}<button class="x" data-act="delCal" data-id="${e.id}" aria-label="Entfernen">×</button></span></div>`).join('')+
  se.map(s=>`<div class="item"><span>${esc(s.name)}</span><span class="pill">Absolviert · ${s.duration} Min</span></div>`).join('')+
  `<h3 style="margin-top:18px">Hinzufügen</h3><div class="inline"><select id="planSel">${d.plans.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select><button class="btn" data-act="addCal" data-v="workout">Workout planen</button><button class="btn ghost" data-act="addCal" data-v="rest">Ruhetag</button></div><div class="actions end"><button class="btn" data-act="close">Schließen</button></div>`},

/* ---------- Einstellungen ---------- */
settings(){
  const d=Store.data,s=d.settings;
  return head('Einstellungen','Darstellung, Ziele und Daten')+`<div class="grid">
  <section class="card span2"><h3>Darstellung</h3><div class="seg"><button class="${s.theme==='light'?'on':''}" data-act="setTheme" data-v="light">Hell</button><button class="${s.theme==='dark'?'on':''}" data-act="setTheme" data-v="dark">Dunkel</button></div></section>
  <section class="card span2"><h3>Trainingsziele</h3>${field('Einheiten pro Woche','settings.weeklyGoal',s.weeklyGoal,'number','min=1 max=14')}${field('Einheiten pro Monat','settings.monthlyGoal',s.monthlyGoal,'number','min=1 max=60')}</section>
  <section class="card span2"><h3>Gespeicherte Daten</h3><p class="mute">${d.plans.length} Pläne · ${d.sessions.length} Einheiten · ${d.recipes.length} Rezepte · ${d.weights.length} Gewichtseinträge · ${d.calendar.length} Kalendereinträge</p><div class="actions"><button class="btn" data-act="export">Exportieren</button><label class="btn ghost">Importieren<input type="file" id="importFile" accept=".json" hidden></label><button class="btn danger" data-act="reset">Alles zurücksetzen</button></div></section></div>`}
};
