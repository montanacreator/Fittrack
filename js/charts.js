// Einfache SVG-Diagramme ohne Abhängigkeiten
const Charts={
  line(pts,unit=''){
    if(pts.length<2)return '<p class="mute">Für ein Diagramm werden mindestens zwei Einträge benötigt.</p>';
    const W=600,H=220,p=34,vs=pts.map(x=>x.v),mn=Math.min(...vs),mx=Math.max(...vs),r=(mx-mn)||1;
    const X=i=>p+i*(W-2*p)/(pts.length-1),Y=v=>H-p-(v-mn)/r*(H-2*p);
    const d=pts.map((q,i)=>(i?'L':'M')+X(i)+' '+Y(q.v)).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>`+
      pts.map((q,i)=>`<circle cx="${X(i)}" cy="${Y(q.v)}" r="4.5" fill="currentColor"><title>${q.l}: ${q.v}${unit}</title></circle>`).join('')+
      `<text x="${p}" y="${H-8}" class="ax">${pts[0].l}</text><text x="${W-p}" y="${H-8}" text-anchor="end" class="ax">${pts.at(-1).l}</text>`+
      `<text x="${p}" y="16" class="ax">Max ${mx}${unit}</text><text x="${W-p}" y="16" text-anchor="end" class="ax">Min ${mn}${unit}</text></svg>`;
  },
  bar(pts){
    const W=600,H=200,p=30,mx=Math.max(1,...pts.map(x=>x.v)),bw=(W-2*p)/pts.length;
    return `<svg class="chart" viewBox="0 0 ${W} ${H}">`+pts.map((q,i)=>{
      const h=q.v/mx*(H-2*p-14),cx=p+i*bw+bw/2;
      return `<rect x="${p+i*bw+8}" y="${H-p-h}" width="${bw-16}" height="${Math.max(h,2)}" rx="6" fill="currentColor" opacity="${q.v?1:.2}"/>`+
        `<text x="${cx}" y="${H-p-h-6}" text-anchor="middle" class="ax">${q.v}</text><text x="${cx}" y="${H-8}" text-anchor="middle" class="ax">${q.l}</text>`}).join('')+'</svg>';
  }
};
