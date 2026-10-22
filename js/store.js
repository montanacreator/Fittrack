// Datenhaltung in localStorage + Datumshelfer
const Store=(()=>{
  const KEY='fittrack:v1';
  const uid=()=>Math.random().toString(36).slice(2,9);
  const iso=d=>{const x=new Date(d);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')};
  const today=()=>iso(new Date());
  const weekStart=d=>{const x=new Date(d);x.setHours(12,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x};
  const seed=()=>({
    settings:{theme:matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light',weeklyGoal:3,monthlyGoal:12},
    plans:[
      {id:uid(),name:'Push Day',exercises:[{id:uid(),name:'Bankdrücken',sets:3,reps:8,kg:60},{id:uid(),name:'Schulterdrücken',sets:3,reps:10,kg:30},{id:uid(),name:'Trizeps-Dips',sets:3,reps:12,kg:0}]},
      {id:uid(),name:'Beine',exercises:[{id:uid(),name:'Kniebeugen',sets:4,reps:8,kg:80},{id:uid(),name:'Rumänisches Kreuzheben',sets:3,reps:10,kg:70}]}],
    recipes:[
      {id:uid(),name:'Overnight Oats',image:'',category:'Frühstück',time:10,difficulty:'Leicht',fav:false,ingredients:['60 g Haferflocken','150 ml Milch','100 g Joghurt','1 EL Honig','Beeren'],steps:['Alles in einem Glas verrühren.','Über Nacht kühl stellen.','Mit Beeren servieren.']},
      {id:uid(),name:'Hähnchen-Reis-Bowl',image:'',category:'Mittagessen',time:30,difficulty:'Mittel',fav:true,ingredients:['200 g Hähnchenbrust','150 g Reis','1 Paprika','1 Avocado','2 EL Sojasauce'],steps:['Reis kochen.','Hähnchen und Paprika anbraten.','Alles in einer Schale anrichten.']}],
    sessions:[],weights:[],records:[],calendar:[],active:null});
  let data=load();
  function load(){try{return Object.assign(seed(),JSON.parse(localStorage.getItem(KEY)))}catch{return seed()}}
  const save=()=>localStorage.setItem(KEY,JSON.stringify(data));
  return{uid,iso,today,weekStart,save,get data(){return data},
    replace(d){data=Object.assign(seed(),d);save()},reset(){localStorage.removeItem(KEY);data=seed();save()}};
})();
