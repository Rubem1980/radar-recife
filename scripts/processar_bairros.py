#!/usr/bin/env python3
"""
Pós-processamento: detecta indicações (tipo 'b') nas proposições já coletadas
e gera o campo 'rep' (busca por bairro) no dados.js.
"""
import json
import re
import os

DADOS_PATH = "/home/biu/Documentos/Default Project/radar-recife/dados/dados.js"

def limpar_texto(texto):
    if not texto:
        return ""
    return re.sub(r"\s+", " ", str(texto)).strip()

RE_RUA = re.compile(r"(?:rua|av\.?|avenida|travessa|alameda|praça|pç\.?|largo|rodovia|estrada|via|trav\.?)\s+([^,;.\n]{3,60})", re.IGNORECASE)
RE_BAIRRO = re.compile(r"(?:bairro|distrito|região|área)\s+(?:de\s+)?([^,;.\n]{3,40})", re.IGNORECASE)
RE_BAIRRO2 = re.compile(r"(?:no|na|em)\s+o?\s*bairro\s+(?:de\s+)?([^,;.\n]{3,40})", re.IGNORECASE)

def extrair_rua_bairro(ementa):
    if not ementa:
        return None, None
    rua = None; bairro = None
    m_rua = RE_RUA.search(ementa)
    if m_rua:
        rua = limpar_texto(m_rua.group(1))
    m_bairro = RE_BAIRRO.search(ementa) or RE_BAIRRO2.search(ementa)
    if m_bairro:
        bairro = limpar_texto(m_bairro.group(1))
    return rua, bairro

def main():
    # Ler dados.js (remover 'window.RX = ' no início e ';' no final)
    with open(DADOS_PATH, "r", encoding="utf-8") as f:
        conteudo = f.read()
    # Extrair JSON
    inicio = conteudo.index("{")
    fim = conteudo.rindex("}") + 1
    dados = json.loads(conteudo[inicio:fim])

    vereadores = dados.get("v", [])
    proposicoes = dados.get("items", [])
    idx_por_id = {v["id"]: i for i, v in enumerate(vereadores)}

    # Detectar indicações tipo 'b' não mapeadas
    cont_b = 0
    for item in proposicoes:
        if item[4] == "o":
            ementa = item[2] or ""
            if re.match(r"^(indica|indicação|indicaçoes|recomenda)", ementa.strip(), re.IGNORECASE):
                item[4] = "b"
                cont_b += 1
        if item[4] == "b":
            cont_b += 1  # contar também as já existentes

    print(f"Proposições tipo 'b' (indicação): {cont_b}")

    # Agrupar por bairro/rua
    grupos = {}
    for item in proposicoes:
        if item[4] != "b":
            continue
        ementa = item[2] or ""
        rua, bairro = extrair_rua_bairro(ementa)
        if not rua and not bairro:
            continue
        chave = (rua or "", bairro or "")
        if chave not in grupos:
            grupos[chave] = {"r": rua or "", "b": bairro or "", "ids": set()}
        for idx in (item[6] or []):
            if idx < len(vereadores):
                grupos[chave]["ids"].add(int(vereadores[idx]["id"]))

    rep = []
    for (rua, bairro), g in grupos.items():
        rep.append({"r": g["r"], "b": g["b"], "ids": sorted(list(g["ids"]))})
    rep.sort(key=lambda x: len(x["ids"]), reverse=True)

    bairros = sorted(set(g["b"] for g in rep if g["b"]))
    bairrosn = [len([g for g in rep if g["b"] == b]) for b in bairros]

    dados["rep"] = rep
    dados["bairros"] = bairros
    dados["bairrosn"] = bairrosn

    # Atualizar catot
    catot = {"b": 0, "c": 0, "h": 0, "l": 0, "o": 0}
    for v in vereadores:
        for c in "bchlo":
            catot[c] = catot.get(c, 0) + v.get("cat", {}).get(c, 0)
    # Recalcular catot a partir das proposições
    catot2 = {"b": 0, "c": 0, "h": 0, "l": 0, "o": 0}
    for item in proposicoes:
        t = item[4]
        if t in catot2:
            catot2[t] += 1
    dados["catot"] = catot2

    conteudo_saida = f"window.RX = {json.dumps(dados, ensure_ascii=False, indent=2)};"
    with open(DADOS_PATH, "w", encoding="utf-8") as f:
        f.write(conteudo_saida)

    print(f"[OK] dados.js atualizado")
    print(f"     rep: {len(rep)} grupos de bairro/rua")
    print(f"     bairros: {len(bairros)}")
    print(f"     catot: {catot2}")

if __name__ == "__main__":
    main()
