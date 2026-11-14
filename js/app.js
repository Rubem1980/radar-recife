/**
 * Radar Recife - Aplicação frontend
 * Consome window.RX (gerado por scripts/coletar.py)
 * Layout adaptado do radarptlandia.org
 */

(function(){
  const RX = window.RX || {};
  const vereadores = RX.v || [];
  const proposicoes = RX.items || [];
  const bairros = RX.rep || [];

  const els = {
    grid: document.getElementById("grid-vereadores"),
    total: document.getElementById("total-vereadores"),
    filtroPartido: document.getElementById("filtro-partido"),
    ordenacao: document.getElementById("ordenacao"),
    buscaBairro: document.getElementById("busca-bairro"),
    btnLimparBairro: document.getElementById("btn-limpar-bairro"),
    infoBairro: document.getElementById("info-bairro"),
    valorSalario: document.getElementById("valor-salario"),
    live: document.getElementById("live"),
    livet: document.getElementById("livet"),
    stats: document.getElementById("stats"),
    sheet: document.getElementById("sheet"),
    shTop: document.getElementById("sh-top"),
    shI: document.getElementById("sh-i"),
    shT: document.getElementById("sh-t"),
    shS: document.getElementById("sh-s"),
    shF: document.getElementById("sh-f"),
    shB: document.getElementById("sh-b"),
    shX: document.getElementById("sh-x"),
    veil: document.getElementById("veil"),
    cats: document.getElementById("cats"),
    split: document.getElementById("split"),
    hsub: document.getElementById("hsub"),
    reps: document.getElementById("reps"),
    chips: document.getElementById("bl"),
    bq: document.getElementById("busca-bairro"),
    bres: document.getElementById("bres"),
  };

  const CAT = {
    b: { label: "Pedidos de melhoria nos bairros", desc: "Tapar buraco, podar árvore, trocar lâmpada, pintar lombada.", icon: "pin", short: "Pedido" },
    c: { label: "Perguntas e cobranças", desc: "Pedidos de explicação à Prefeitura e apelos a outros órgãos.", icon: "ask", short: "Cobrança" },
    h: { label: "Homenagens", desc: "Parabéns, votos de pesar, título de cidadão, nome de rua e datas comemorativas.", icon: "medal", short: "Homenagem" },
    l: { label: "Propostas de lei", desc: "Projetos que criam regra, programa ou obrigação na cidade.", icon: "law", short: "Proposta de lei" },
    o: { label: "Outros", desc: "Notas de apoio ou repúdio e regras internas da Câmara.", icon: "dots", short: "Outro" },
  };
  const ORDER = ["b", "c", "h", "l", "o"];

  const ICON = {
    pin:'<path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    ask:'<path d="M21 12a8 8 0 01-11.8 7L4 20l1.2-4.4A8 8 0 1121 12z"/><path d="M9.8 9.5a2.3 2.3 0 114 1.6c-.7.6-1.3 1-1.3 1.9"/><path d="M12.5 16h.01"/>',
    medal:'<circle cx="12" cy="14" r="5"/><path d="M9 9.5L6.5 3h4L12 6.5 13.5 3h4L15 9.5"/>',
    law:'<path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4M10 12h6M10 16h6"/>',
    dots:'<circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/>',
    sign:'<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
  };

  function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
  function nf(n){return Number(n).toLocaleString("pt-BR")}
  function norm(s){return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}
  function initAv(i){const w=(vereadores[i].ap||vereadores[i].nome).split(/\s+/).filter(x=>!/^(da|de|do|dos|das)$/i.test(x));return (w[0][0]+(w.length>1?w[w.length-1][0]:'')).toUpperCase()}
  vereadores.forEach((v,i)=>{v.in=initAv(i); v.cat=v.cat||{}});

  function svg(p,s=22){return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`}

  // ========================================================================
  // Inicialização
  // ========================================================================

  function init(){
    montarFiltroPartido();
    renderStats();
    render();
    renderCategorias();
    inicializarBuscaBairro();
    inicializarSheet();
    atualizarSalario();
  }

  function atualizarSalario(){
    const salarioMes = 16503;
    const qtd = vereadores.length || 39;
    const desde = new Date(RX.posse || "2025-01-01");
    const hoje = new Date();
    const meses = Math.max(1,(hoje.getFullYear()-desde.getFullYear())*12+(hoje.getMonth()-desde.getMonth())+1);
    const total = salarioMes*qtd*meses;
    if(els.valorSalario) els.valorSalario.textContent = "R$ "+total.toLocaleString("pt-BR");
    if(els.total) els.total.textContent = qtd;
  }

  function renderStats(){
    const cat = vereadores.reduce((s,v)=>{const c=v.cat||{}; s.b=(s.b||0)+(c.b||0); s.c=(s.c||0)+(c.c||0); s.h=(s.h||0)+(c.h||0); s.l=(s.l||0)+(c.l||0); return s},{});
    const total = Object.values(cat).reduce((a,b)=>a+b,0);
    const stats = [
      {k:"", n:proposicoes.length, l:"propostas até agora"},
      {k:"k-b", n:cat.b||0, l:"pedidos nos bairros até agora"},
      {k:"k-h", n:cat.h||0, l:"homenagens até agora"},
      {k:"k-l", n:cat.l||0, l:"propostas de lei até agora"},
    ];
    if(els.stats) els.stats.innerHTML = stats.map((st,i)=>
      `<div class="stat ${st.k}"><b class="${st.k?'k':''}" id="st${i}">${nf(st.n)}</b><span>${st.l}</span></div>`).join("");
    stats.forEach((st,i)=>{const el=document.getElementById("st"+i); if(el){el.textContent=nf(st.n)}});
  }

  // ========================================================================
  // Filtro de partido
  // ========================================================================

  function montarFiltroPartido(){
    const partidos = [...new Set(vereadores.map(v=>v.part).filter(Boolean))].sort();
    const sel = els.filtroPartido;
    if(!sel) return;
    partidos.forEach(p=>{
      const o = document.createElement("option");
      o.value = p; o.textContent = p;
      sel.appendChild(o);
    });
  }

  // ========================================================================
  // Categorias (homenagem ou trabalho)
  // ========================================================================

  function renderCategorias(){
    const catCount = {};
    ORDER.forEach(c=>{catCount[c]=0});
    vereadores.forEach(v=>{const c=v.cat||{}; ORDER.forEach(k=>{catCount[k]=(catCount[k]||0)+(c[k]||0)})});
    const total = ORDER.reduce((s,c)=>s+(catCount[c]||0),0);
    if(els.hsub) els.hsub.textContent = "São "+nf(total)+" propostas até agora, e a conta sobe toda semana. Toque em um grupo para ler cada uma.";
    if(els.split) els.split.innerHTML = ORDER.map(c=>`<i class="k-${c}" style="flex:${catCount[c]||0} 1 0"></i>`).join("");
    if(els.cats) els.cats.innerHTML = ORDER.map(c=>
      `<button class="cat k-${c}" type="button" data-c="${c}">
        <span class="ci">${svg(ICON[CAT[c].icon],26)}</span>
        <span class="cv num">${nf(catCount[c]||0)}</span>
        <span class="cn">${CAT[c].label} <span class="now">até agora</span></span>
        <span class="cd">${CAT[c].desc}</span>
        <span class="go">Ver todas →</span>
       </button>`).join("");
    if(els.cats){
      els.cats.addEventListener("click",e=>{
        const b=e.target.closest('[data-c]'); if(b) openCat(b.dataset.c,null);
      });
    }
  }

  // ========================================================================
  // Renderização dos crachás
  // ========================================================================

  function render(){
    let lista = [...vereadores];
    const partido = els.filtroPartido ? els.filtroPartido.value : "";
    if(partido) lista = lista.filter(v=>v.part===partido);

    const ordem = els.ordenacao ? els.ordenacao.value : "nome";
    switch(ordem){
      case "nome": lista.sort((a,b)=>(a.ap||a.nome).localeCompare(b.ap||b.nome,"pt")); break;
      case "faltas": lista.sort((a,b)=>(b.F||0)-(a.F||0)); break;
      case "proposicoes": lista.sort((a,b)=>(b.cat&&b.cat.l||0)-(a.cat&&a.cat.l||0)); break;
      case "homenagens": lista.sort((a,b)=>(b.cat&&b.cat.h||0)-(a.cat&&a.cat.h||0)); break;
      case "pedidos": lista.sort((a,b)=>(b.cat&&b.cat.b||0)-(a.cat&&a.cat.b||0)); break;
      case "nao": lista.sort((a,b)=>(b.naos&&b.naos.length||0)-(a.naos&&a.naos.length||0)); break;
    }

    const termoBusca = (els.bq && els.bq.value) ? els.bq.value.trim().toLowerCase() : "";
    if(termoBusca){
      const idsRelevantes = new Set();
      bairros.forEach(item=>{
        const texto = ((item.r||"")+" "+(item.b||"")).toLowerCase();
        if(texto.includes(termoBusca)){ (item.ids||[]).forEach(id=>idsRelevantes.add(id)); }
      });
      if(idsRelevantes.size>0) lista = lista.filter(v=>idsRelevantes.has(Number(v.id)));
      if(els.infoBairro) els.infoBairro.textContent = `Mostrando vereadores com pedidos relacionados a "${els.bq.value.trim()}".`;
    } else {
      if(els.infoBairro) els.infoBairro.textContent = "Sem nada digitado, você vê a cidade inteira.";
    }

    const grid = els.grid;
    if(!grid) return;
    grid.innerHTML = "";

    const totVot = RX.nvot || 0; const totUnan = RX.unan || 0;
    const pct = totVot ? Math.floor(totUnan/totVot*100) : 0;
    const pEl = document.getElementById("conta");
    if(pEl) pEl.textContent = "Até agora, em "+pct+" de cada 100 votações todos votaram igual. Toque nos números do crachá para ver os detalhes.";

    lista.forEach((v,i)=>{
      const idx = vereadores.indexOf(v);
      const t = (v.P||0)+(v.A||0)+(v.F||0);
      const h = (idx*47+12)%360;
      const tint = `hsl(${h} 85% 94%)`; const deep = `hsl(${h} 55% 30%)`;
      const pctPres = t ? Math.round((v.P||0)/t*100) : 0;
      const C = 2*Math.PI*30;
      const seg = (n,col,off)=> n?`<circle cx="38" cy="38" r="30" fill="none" stroke="${col}" stroke-width="9" stroke-dasharray="${n/t*C} ${C}" stroke-dashoffset="${-off/t*C}" transform="rotate(-90 38 38)"/>`:"";
      const ring = `<div class="ring"><svg width="76" height="76" viewBox="0 0 76 76" role="img" aria-label="${v.P} presenças em ${t} sessões"><circle cx="38" cy="38" r="30" fill="none" stroke="#eef1f4" stroke-width="9"/>${seg(v.P||0,"#0f1720",0)}${seg(v.A||0,"#e0a23a",v.P||0)}${seg(v.F||0,"#d23a2e",(v.P||0)+(v.A||0))}</svg><b class="num">${pctPres}%</b></div>`;
      const cat = v.cat||{};
      const bars = ORDER.map(c=>v.cat[c]?`<i class="k-${c}" style="flex:${v.cat[c]} 1 0"></i>`:"").join("");
      const picks = ORDER.map(c=>`<button class="pick k-${c} num" type="button" data-v="${idx}" data-c="${c}" ${v.cat[c]?"":"disabled"}><i></i><span>${CAT[c].short}</span><b>${nf(v.cat[c]||0)}</b><span class="ar" aria-hidden="true">›</span></button>`).join("");
      const foto = `<img class="pho" src="/radar-recife/fotos/${v.id}.jpg" alt="Foto de ${esc(v.ap)}" loading="lazy" onerror="this.src='${esc(v.foto||"")}';this.onerror=function(){this.style.display='none';this.parentElement.querySelector('.pho-placeholder').style.display='flex'}">`+`<div class="pho pho-placeholder" style="display:none">${v.in}</div>`;
      const mesaPill = v.mesa?`<span class="pill r">${esc(v.mesa)} da Câmara</span>`:"";
      const cargoPill = v.ini>'2025-01-01'?`<span class="pill r">No cargo desde ${formatarData(v.ini.replace(/-/g,''))}</span>`:"";
      const vs = v.vs||0; const vnva = (v.vn||0)+(v.va||0);

      const card = `<article class="badge" style="--tint:${tint};--deep:${deep}">
        <div class="bh"><div class="slot" aria-hidden="true"></div>
          <div class="idr">${foto}<div><h3>${esc(v.ap)}</h3><p class="civil">${esc(v.nome||"Sem nome")}</p></div></div>
          <div class="tags"><span class="pill">${esc(v.part||"—")}</span>${mesaPill}${cargoPill}</div>
        </div>
        <div class="bb">
          <div class="pres">${ring}<p><b class="num">${v.P||0} de ${t}</b> sessões até agora<small class="num">${v.A||0} ${v.A===1?"ausência justificada":"ausências justificadas"} · <b class="${v.F?'bad':''}">${v.F||0} ${v.F===1?"falta":"faltas"}</b></small></p></div>
          <div class="mini num"><div><b>R$ ${nf(16503)}</b><span>salário por mês</span></div><div><b>${nf(v.votos||0)}</b><span>votos em 2024</span></div></div>
          <div><p class="h3">O que propôs até agora</p>
            <div class="bar5" aria-hidden="true">${bars}</div>
            ${picks}
          </div>
          <div><p class="h3">Como votou até agora</p>
            <div class="vote num"><div><b>${nf(vs)}</b><span>vezes sim</span></div><div class="n"><b>${nf(vnva)}</b><span>${vnva?"não ou abstenção":"vezes não"}</span></div></div>
            ${v.mesa==="Presidente"?'<p class="mute" style="font-size:13.5px;margin:8px 0 0">O presidente quase nunca vota.</p>':''}
            ${v.naos&&v.naos.length?`<p style="margin:10px 0 0"><button class="lnk" type="button" data-n="${idx}">Ver quando não votou sim →</button></p>`:''}
          </div>
          <p class="foot"><a href="${esc(v.url||"#")}" target="_blank" rel="noopener">Ficha oficial na Câmara, com foto e contato ↗</a></p>
        </div>
      </article>`;
      grid.innerHTML += card;
    });

    const contaEl = document.getElementById("conta");
    if(contaEl) contaEl.textContent = lista.length===vereadores.length?`Mostrando os ${vereadores.length} vereadores.`:`Mostrando ${lista.length} de ${vereadores.length} vereadores.`;

    grid.addEventListener("click",e=>{
      const p = e.target.closest('.pick'); if(p&&!p.disabled){openCat(p.dataset.c,+p.dataset.v);return}
      const n = e.target.closest('[data-n]'); if(n) openNaos(+n.dataset.n);
    });
  }

  // ========================================================================
  // Busca por bairro/rua
  // ========================================================================

  function inicializarBuscaBairro(){
    if(!els.bq) return;
    if(RX.bairros){
      els.chips.innerHTML = RX.bairros.map(b=>`<option value="${esc(b)}"></option>`).join("");
    }
    els.bq.addEventListener("input", render);
    if(els.btnLimparBairro){
      els.btnLimparBairro.addEventListener("click",()=>{
        els.bq.value=""; render();
      });
    }
  }

  // ========================================================================
  // Sheet / Modal
  // ========================================================================

  function inicializarSheet(){
    els.shX.addEventListener("click", closeSheet);
    els.veil.addEventListener("click", closeSheet);
    document.addEventListener("keydown",e=>{ if(e.key==="Escape" && els.sheet.classList.contains("on")) closeSheet(); });
  }

  function openSheet(k,icon,title,sub){
    els.shTop.className = "sh-top k-"+k;
    els.shI.innerHTML = svg(ICON[icon],24);
    els.shT.textContent = title;
    els.shS.textContent = sub||"";
    els.shF.innerHTML = ""; els.shF.style.display = "none";
    els.shB.innerHTML = ""; els.shB.scrollTop = 0;
    els.sheet.classList.add("on"); els.veil.classList.add("on");
    document.body.style.overflow = "hidden";
    els.shX.focus();
  }
  function closeSheet(){
    els.sheet.classList.remove("on"); els.veil.classList.remove("on");
    document.body.style.overflow = "";
  }

  function openCat(c,vi){
    const all = proposicoes.filter(it=>{
      const ids = it[6]||[];
      return it[4]===c && (vi==null || ids.includes(vi));
    });
    openSheet(c,CAT[c].icon,CAT[c].label, `${nf(all.length)} ${vi==null?"de todos os vereadores":"de "+(vereadores[vi]?vereadores[vi].ap:"")} até agora`);
    const draw = ()=>{
      const items = vi==null?all:all.filter(it=>{const ids=it[6]||[];return ids.includes(vi)});
      els.shB.innerHTML = `<ul class="items">${items.map(it=>itemHTML(it,true)).join('')}</ul>`;
      if(items.length>4){
        const btn = document.createElement("button");
        btn.className = "more"; btn.type = "button";
        btn.textContent = `Mostrar mais ${Math.min(4,items.length-4)} de ${nf(items.length-4)}`;
        let n=4;
        btn.addEventListener("click",()=>{
          els.shB.querySelector(".items").insertAdjacentHTML("beforeend", items.slice(n,n+4).map(it=>itemHTML(it,true)).join(""));
          n+=4;
          if(n>=items.length) btn.remove();
          else btn.textContent = `Mostrar mais ${Math.min(4,items.length-n)} de ${nf(items.length-n)}`;
        });
        els.shB.appendChild(btn);
      }
    };
    draw();
  }

  function itemHTML(it,showAut){
    const c = it[4]; const t = CAT[c];
    const icon = ICON[t.icon] || ICON.dots;
    const who = showAut?`<span class="who">`+(it[6].slice(0,3).map(a=>{
      const avStyle = `background:hsl(${(a*47+12)%360} 80% 92%);color:hsl(${(a*47+12)%360} 55% 28%)`;
      return `<span class="av" style="${avStyle}" aria-hidden="true">${vereadores[a]?vereadores[a].in:"?"}</span><span class="n">${esc(vereadores[a]?vereadores[a].ap:"")}</span>`;
    }).join(""))+(it[6].length>3?`<span class="mute">+${it[6].length-3}</span>`:"")+`</span>`:'<span></span>';
    const dataFmt = formatarData(it[3]);
    return `<li class="it k-${c}"><span class="ic">${svg(icon)}</span><div>
      <p class="tx">${esc(it[2]||"")}</p>
      <div class="mt"><span class="lab">${t.short}</span><span>${dataFmt}</span><span>·</span><span>${esc(it[1]||"")}</span></div>
      <div class="ft">${who}</div></div></li>`;
  }

  function openNaos(vi){
    const v = vereadores[vi];
    if(!v) return;
    openSheet("o","sign",`Quando ${esc(v.ap)} não votou “sim”`, `${v.naos.length} votações até agora`);
    const html = v.naos.map(n=>`<li class="it k-o"><span class="ic">${svg(ICON.sign||ICON.dots)}</span><div>
      <p class="tx">${esc(n.e||"")}</p>
      <div class="mt"><span class="stt no">${n.v==="nao"?"Votou não":"Absteve-se"}</span><span>${formatarData(n.d.replace(/-/g,""))}</span><span>·</span><span>${esc(n.t||"")}</span></div>
      <div class="ft"><span class="mute">Proposta de: ${esc(n.a||"")}</span></div></div></li>`).join("");
    els.shB.innerHTML = `<ul class="items">${html}</ul>`;
  }

  function formatarData(raw){
    if(!raw) return "";
    const s = String(raw);
    if(s.length===8) return `${s.slice(6,8)}/${s.slice(4,6)}/${s.slice(0,4)}`;
    return s;
  }

  // Iniciar quando o DOM estiver pronto
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
