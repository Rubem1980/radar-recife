/**
 * Radar Recife - Aplicação frontend
 * Consome window.RX (gerado por scripts/coletar.py)
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
    modal: null,
  };

  // Cores por tipo de proposta
  const TIPO_COR = {
    b: { cls: "k-b", label: "Indicação (bairro)" },
    c: { cls: "k-c", label: "Requerimento (cobrança)" },
    h: { cls: "k-h", label: "Homenagem" },
    l: { cls: "k-l", label: "Projeto de lei" },
    o: { cls: "k-o", label: "Outros" },
  };

  // ========================================================================
  // Inicialização
  // ========================================================================

  function init(){
    montarFiltroPartido();
    render();
    inicializarBuscaBairro();
    inicializarModal();

    // Atualizar salário estimado (39 vereadores de Recife)
    const salarioMes = 16503;
    const qtd = vereadores.length || 39;
    const desde = new Date(RX.posse || "2025-01-01");
    const hoje = new Date();
    const meses = Math.max(1, (hoje.getFullYear() - desde.getFullYear()) * 12 + (hoje.getMonth() - desde.getMonth()) + 1);
    const total = salarioMes * qtd * meses;
    if(els.valorSalario) els.valorSalario.textContent = "R$ " + total.toLocaleString("pt-BR");
    if(els.total) els.total.textContent = qtd;
  }

  // ========================================================================
  // Filtro de partido
  // ========================================================================

  function montarFiltroPartido(){
    const partidos = [...new Set(vereadores.map(v => v.part).filter(Boolean))].sort();
    const sel = els.filtroPartido;
    if(!sel) return;
    partidos.forEach(p => {
      const o = document.createElement("option");
      o.value = p;
      o.textContent = p;
      sel.appendChild(o);
    });
  }

  // ========================================================================
  // Renderização dos cards
  // ========================================================================

  function render(){
    let lista = [...vereadores];

    // Filtro por partido
    const partido = els.filtroPartido ? els.filtroPartido.value : "";
    if(partido){
      lista = lista.filter(v => v.part === partido);
    }

    // Ordenação
    const ordem = els.ordenacao ? els.ordenacao.value : "nome";
    switch(ordem){
      case "nome": lista.sort((a,b) => (a.nome||"").localeCompare(b.nome||"")); break;
      case "faltas": lista.sort((a,b) => (b.F||0) - (a.F||0)); break;
      case "proposicoes": lista.sort((a,b) => (b.vs||0) - (a.vs||0)); break;
      case "homenagens": lista.sort((a,b) => (b.cat&&b.cat.h||0) - (a.cat&&a.cat.h||0)); break;
      case "pedidos": lista.sort((a,b) => (b.cat&&b.cat.b||0) - (a.cat&&a.cat.b||0)); break;
      case "nao": lista.sort((a,b) => (b.naos&&b.naos.length||0) - (a.naos&&a.naos.length||0)); break;
    }

    // Filtro por bairro/rua (se houver busca ativa)
    const termoBusca = (els.buscaBairro && els.buscaBairro.value) ? els.buscaBairro.value.trim().toLowerCase() : "";
    if(termoBusca){
      const idsRelevantes = new Set();
      bairros.forEach(item => {
        const texto = ((item.r||"") + " " + (item.b||"")).toLowerCase();
        if(texto.includes(termoBusca)){
          (item.ids||[]).forEach(id => idsRelevantes.add(id));
        }
      });
      if(idsRelevantes.size > 0){
        lista = lista.filter(v => idsRelevantes.has(Number(v.id)));
      }
      if(els.infoBairro) els.infoBairro.textContent = `Mostrando vereadores com pedidos relacionados a "${els.buscaBairro.value.trim()}".`;
    } else {
      if(els.infoBairro) els.infoBairro.textContent = "Sem nada digitado, você vê a cidade inteira.";
    }

    // Renderizar cards
    const grid = els.grid;
    if(!grid) return;
    grid.innerHTML = "";

    lista.forEach(v => {
      const card = document.createElement("article");
      card.className = "card";
      const presenca = v.P || 0;
      const ausencia = v.A || 0;
      const falta = v.F || 0;
      const totalSessoes = presenca + ausencia + falta;
      const pctPresenca = totalSessoes ? Math.round((presenca / totalSessoes) * 100) : 0;

      const cat = v.cat || {};
      const totalCat = (cat.b||0) + (cat.c||0) + (cat.h||0) + (cat.l||0) + (cat.o||0);

      card.innerHTML = `
        <div class="cab">
          <img src="fotos/${v.id}.jpg" class="foto" alt="${v.nome}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><div style="width:40px;height:40px;border-radius:50%;background:var(--soft);flex-shrink:0;display:none"></div>
          <div>
            <div class="nome">${escapeHtml(v.nome || "Sem nome")}${v.ap ? ' <span style="font-weight:400;font-size:13px;color:var(--mute)">· "' + escapeHtml(v.ap) + '"</span>' : ''}</div>
            <div class="part">${escapeHtml(v.part || "—")}</div>
            ${v.mesa ? `<div class="mesa">${escapeHtml(v.mesa)}</div>` : ""}
          </div>
        </div>
        <div class="stats">
          <div class="stat"><span class="v">${pctPresenca}%</span><span class="l">presença</span></div>
          <div class="stat"><span class="v">${totalCat}</span><span class="l">propostas</span></div>
          <div class="stat"><span class="v">${falta}</span><span class="l">faltas</span></div>
          <div class="stat"><span class="v">${v.votos||0}</span><span class="l">votos</span></div>
        </div>
        <div class="acoes">
          <button class="btn k" data-id="${v.id}" title="Ver propostas de ${v.nome}">Ver propostas</button>
          ${v.url ? `<a class="btn" href="${v.url}" target="_blank" rel="noopener" title="Ficha oficial na Câmara">Ficha oficial</a>` : `<button class="btn" disabled style="opacity:.5">—</button>`}
        </div>
      `;

      grid.appendChild(card);
    });

    // Eventos dos botões "Ver propostas"
    grid.querySelectorAll("button[data-id]").forEach(btn => {
      btn.addEventListener("click", () => abrirModalVereador(Number(btn.dataset.id)));
    });
  }

  // ========================================================================
  // Busca por bairro/rua
  // ========================================================================

  function inicializarBuscaBairro(){
    if(!els.buscaBairro) return;
    els.buscaBairro.addEventListener("input", render);
    if(els.btnLimparBairro){
      els.btnLimparBairro.addEventListener("click", () => {
        els.buscaBairro.value = "";
        render();
      });
    }
  }

  // ========================================================================
  // Modal de vereador
  // ========================================================================

  function inicializarModal(){
    // Cria modal se não existir
    let modal = document.querySelector(".modal");
    if(!modal){
      modal = document.createElement("div");
      modal.className = "modal";
      modal.innerHTML = `
        <div class="conteudo">
          <div class="cabecalho">
            <h3 id="modal-titulo">Vereador</h3>
            <button class="fechar" aria-label="Fechar">×</button>
          </div>
          <div class="corpo" id="modal-corpo"></div>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelector(".fechar").addEventListener("click", fecharModal);
      modal.addEventListener("click", e => { if(e.target === modal) fecharModal(); });
    }
    els.modal = modal;
  }

  function abrirModalVereador(id){
    const v = vereadores.find(x => Number(x.id) === id);
    if(!v) return;

    const propVereador = proposicoes.filter(p => {
      // p[6] é array de índices de vereadores envolvidos
      const ids = p[6] || [];
      return ids.includes(id);
    });

    const cat = v.cat || {};
    const corpo = els.modal.querySelector("#modal-corpo");
    els.modal.querySelector("#modal-titulo").textContent = v.nome + (v.ap ? ` "${v.ap}"` : "");
    els.modal.classList.add("aberto");

    let html = `
      <div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:16px">
        <img src="fotos/${v.id}.jpg" style="width:80px;height:80px;border-radius:50%;object-fit:cover;flex-shrink:0" alt="${v.nome}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><div style="width:80px;height:80px;border-radius:50%;background:var(--soft);flex-shrink:0;display:none"></div>
        <div style="flex:1">
          <div style="font-size:20px;font-weight:700">${escapeHtml(v.nome)}${v.ap ? ` <span style="font-weight:400;font-size:16px;color:var(--mute)">· "${escapeHtml(v.ap)}"</span>` : ''}</div>
          <div style="color:var(--mute);font-size:13px">${escapeHtml(v.part || "—")}${v.mesa ? " · " + escapeHtml(v.mesa) : ""}</div>
          ${v.email ? `<div style="margin-top:4px"><a href="mailto:${v.email}">${escapeHtml(v.email)}</a></div>` : ""}
          ${v.tel ? `<div style="margin-top:2px">${escapeHtml(v.tel)}</div>` : ""}
          ${v.whats ? `<div style="margin-top:2px"><a href="https://wa.me/55${v.whats}" target="_blank">WhatsApp</a></div>` : ""}
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-bottom:16px">
        <div class="stat" style="flex:1"><span class="v">${v.P||0}</span><span class="l">presenças</span></div>
        <div class="stat" style="flex:1"><span class="v">${v.A||0}</span><span class="l">ausências</span></div>
        <div class="stat" style="flex:1"><span class="v">${v.F||0}</span><span class="l">faltas</span></div>
        <div class="stat" style="flex:1"><span class="v">${v.votos||0}</span><span class="l">votos</span></div>
      </div>

      <div style="margin-bottom:12px"><strong>Propostas (${propVereador.length})</strong></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
        ${categoriaChip("b", cat.b||0)} ${categoriaChip("c", cat.c||0)} ${categoriaChip("h", cat.h||0)} ${categoriaChip("l", cat.l||0)} ${categoriaChip("o", cat.o||0)}
      </div>

      <div style="max-height:400px;overflow-y:auto;border:1px solid var(--hair);border-radius:10px;padding:8px">
        ${propVereador.length ? propVereador.map(renderProposicao).join("") : `<p class="mute" style="padding:12px">Nenhuma proposta encontrada para este vereador.</p>`}
      </div>

      ${v.url ? `<div style="margin-top:14px"><a href="${v.url}" target="_blank" rel="noopener" style="color:var(--b);text-decoration:none;font-size:13px">→ Ver ficha oficial na Câmara</a></div>` : ""}
    `;

    corpo.innerHTML = html;
  }

  function fecharModal(){
    if(els.modal) els.modal.classList.remove("aberto");
    if(els.modal) els.modal.querySelector("#modal-corpo").innerHTML = "";
  }

  function categoriaChip(tipo, qtd){
    const info = TIPO_COR[tipo] || { cls: "k-o", label: "Outros" };
    return `<span class="${info.cls}" style="font-size:11.5px;padding:3px 8px;border-radius:999px;background:var(--soft);border:1px solid var(--hair);color:var(--ink)">${qtd} ${info.label}</span>`;
  }

  function renderProposicao(p){
    // p = [id, tipo_numero, ementa, data, tipo, situacao, idsVereadores, aprovado, subcategoria]
    const id = p[0];
    const tipoNum = p[1] || "";
    const ementa = p[2] || "";
    const dataRaw = p[3] || "";
    const tipo = p[4] || "o";
    const situacao = p[5] || "";
    const aprovado = p[7];
    const subcategoria = p[8] || "";

    const dataFmt = formatarData(dataRaw);
    const info = TIPO_COR[tipo] || { cls: "k-o", label: "Outros" };

    let situacaoHtml = "";
    if(situacao) situacaoHtml = `<span style="font-size:11px;color:var(--mute);margin-left:6px">${escapeHtml(situacao)}</span>`;
    if(aprovado) situacaoHtml += `<span style="font-size:11px;color:var(--ok);margin-left:6px"><strong>Aprovado</strong></span>`;
    if(subcategoria) situacaoHtml += `<span style="font-size:10px;color:var(--mute);margin-left:6px">${escapeHtml(subcategoria)}</span>`;

    return `
      <div class="proposicao ${info.cls}">
        <span class="tipo ${info.cls}">${tipo}</span>
        <div class="dados">
          <div class="numero">${escapeHtml(tipoNum)}</div>
          <div class="ementa">${escapeHtml(ementa)}</div>
          <div class="meta">${dataFmt}${situacaoHtml}</div>
        </div>
        <div class="link">
          ${id ? `<a href="#" onclick="event.preventDefault();alert('Link da proposta: ${escapeHtml(id)}');" style="font-size:11px">ver detalhe</a>` : ""}
        </div>
      </div>
    `;
  }

  // ========================================================================
  // Utilitários
  // ========================================================================

  function escapeHtml(texto){
    if(texto == null) return "";
    return String(texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatarData(raw){
    if(!raw) return "";
    const s = String(raw);
    if(s.length === 8){
      return s.slice(6,8) + "/" + s.slice(4,6) + "/" + s.slice(0,4);
    }
    return s;
  }

  // Fechar modal com ESC
  document.addEventListener("keydown", e => { if(e.key === "Escape") fecharModal(); });

  // Iniciar quando o DOM estiver pronto
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
