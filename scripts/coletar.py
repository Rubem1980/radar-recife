#!/usr/bin/env python3
"""
Radar Recife - Script de coleta de dados da Câmara Municipal de Recife

Este script coleta dados oficiais do SAPL da Câmara de Recife
(e-processo.recife.pe.leg.br) e gera o arquivo dados.js consumido
pelo site estático.

Endpoints utilizados:
- @@vereadores?op=init        -> lista de vereadores da legislatura
- materias_legislativas_json -> proposições filtradas por autor/ano/tipo

Execução:
    pip install requests
    python3 scripts/coletar.py
"""

import json
import re
import time
import requests
from datetime import date

# ============================================================================
# CONFIGURAÇÃO - CÂMARA MUNICIPAL DO RECIFE (SAPL / e-processo)
# ============================================================================

BASE_URL = "https://e-processo.recife.pe.leg.br"

# Endpoints da API SAPL v6.4
URL_VERADORES = f"{BASE_URL}/@@vereadores?op=init&num_legislatura_sel=19"
URL_MATERIAS = f"{BASE_URL}/materias_legislativas_json"

DATA_POSSE = "2025-01-01"   # posse da 19ª legislatura
ANOS_COLETA = [2025, 2026]  # anos da legislatura atual

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; RadarRecife/1.0; +https://github.com/seu-usuario/radar-recife)",
    "Accept": "application/json",
}

# Mapeamento de tipo SAPL -> categoria do Radar
# b=indicação(bairro), c=requerimento(cobrança), h=homenagem,
# l=projeto de lei, o=outros
TIPO_PARA_CAT = {
    "2": "o",   # Projeto de Resolução
    "3": "c",   # Requerimento
    "6": "o",   # Projeto de Decreto Legislativo
    "10": "l",  # Projeto de Lei Ordinária
    "11": "l",  # Projeto de Lei do Executivo
    "14": "l",  # Projeto de Emenda à Lei Orgânica
    "15": "o",  # Emenda a Projeto de Lei do Executivo
    "23": "o",  # Proposta de Revisão à Lei Orgânica
    "27": "o",  # Veto
    "28": "l",  # Projeto de Lei Complementar
    "30": "o",  # Aditamento a Parecer
}

# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================

def get_json(url, params=None, tentativas=3):
    """Faz requisição GET e retorna JSON ou None em caso de erro."""
    for t in range(tentativas):
        try:
            r = requests.get(url, headers=HEADERS, params=params, timeout=30)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            print(f"  [ERRO] {url} (tentativa {t+1}/{tentativas}): {e}")
            if t < tentativas - 1:
                time.sleep(2)
    return None

def limpar_texto(texto):
    """Remove espaços extras e quebras de linha."""
    if not texto:
        return ""
    return re.sub(r"\s+", " ", str(texto)).strip()

def data_para_yyyymmdd(data_str):
    """Converte 'dd/mm/yyyy' para 'yyyymmdd'."""
    if not data_str:
        return ""
    m = re.search(r"(\d{2})/(\d{2})/(\d{4})", str(data_str))
    if m:
        return m.group(3) + m.group(2) + m.group(1)
    return ""

# ============================================================================
# COLETA DE VEREADORES
# ============================================================================

def coletar_vereadores():
    """Retorna lista de dicionários com dados dos vereadores da 19ª legislatura."""
    print("1. Coletando vereadores...")
    dados = get_json(URL_VERADORES)
    if not dados or "grupos" not in dados:
        print("   [AVISO] Não foi possível carregar a lista de vereadores.")
        return []

    titulares = dados["grupos"].get("titulares", [])
    suplentes = dados["grupos"].get("suplentes", [])
    todos = titulares + suplentes

    vereadores = []
    for v in todos:
        vid = str(v.get("id", ""))
        partido = limpar_texto(v.get("partido_sigla", ""))
        nome = limpar_texto(v.get("title") or v.get("nom_parlamentar") or v.get("nom_completo", ""))
        foto = v.get("url_foto", "")
        link = v.get("parlamentar_href", "")

        vereador = {
            "id": vid,
            "nome": nome,
            "ap": "",  # apelido não disponível no SAPL
            "part": partido,
            "votos": 0,
            "ini": DATA_POSSE,
            "mesa": "",
            "email": "",
            "tel": "",
            "whats": "",
            "vs": 0,   # presenças (não disponível via API pública direta)
            "A": 0,    # ausências
            "F": 0,    # faltas
            "naos": [],  # votos contra/vetos
            "cat": {"b": 0, "c": 0, "h": 0, "l": 0, "o": 0},
            "url": link,
            "foto": foto,
        }
        vereadores.append(vereador)
        print(f"   -> {nome} ({partido})")

    print(f"   Total: {len(vereadores)} vereadores")
    return vereadores

# ============================================================================
# COLETA DE PROPOSIÇÕES
# ============================================================================

def coletar_proposicoes(vereadores):
    """
    Coleta proposições de cada vereador nos anos configurados.
    Retorna lista de itens no formato do Radar PTlândia:
    [id, tipo_numero, ementa, data_YYYYMMDD, tipo, situacao, [indices_vereadores], aprovado, subcategoria]
    """
    print("2. Coletando proposições...")

    # Índice: id do vereador -> índice na lista `v`
    idx_por_id = {v["id"]: i for i, v in enumerate(vereadores)}

    items = []
    item_ordem = 0

    for v in vereadores:
        vid = v["id"]
        nome = v["nome"]
        print(f"   -> {nome} (id={vid})")

        for ano in ANOS_COLETA:
            for tipo_sapl in sorted(TIPO_PARA_CAT.keys(), key=int):
                params = {
                    "ano": str(ano),
                    "tipo": tipo_sapl,
                    "cod_autor": vid,
                    "pagina": "1",
                    "itens_por_pagina": "200",
                }
                dados = get_json(URL_MATERIAS, params=params)
                if not dados or "data" not in dados:
                    continue

                lista = dados["data"]
                if not isinstance(lista, list) or len(lista) == 0:
                    continue

                print(f"      ano={ano} tipo={tipo_sapl}: {len(lista)} materias")

                for m in lista:
                    cod = m.get("cod_materia")
                    sgl = m.get("sgl_tipo_materia", "")
                    num = m.get("num_ident_basica", "")
                    ano_mat = m.get("ano_ident_basica", "")
                    ementa = limpar_texto(m.get("txt_ementa", ""))
                    data_raw = m.get("dat_apresentacao", "")
                    situacao = ""
                    ult = m.get("ult_tramitacao") or {}
                    if ult.get("des_status"):
                        situacao = limpar_texto(ult["des_status"])
                    aprovado = "Aprovado" if (situacao and "aprovado" in situacao.lower()) else ""

                    tipo_cat = TIPO_PARA_CAT.get(tipo_sapl, "o")
                    tipo_numero = f"{sgl} {num}/{ano_mat}" if sgl and num else str(cod)

                    item = [
                        cod,                                    # 0: id
                        tipo_numero,                            # 1: tipo + número
                        ementa,                                 # 2: ementa
                        data_para_yyyymmdd(data_raw),           # 3: data yyyymmdd
                        tipo_cat,                               # 4: tipo (b,c,h,l,o)
                        situacao,                               # 5: situação
                        [idx_por_id[vid]],                      # 6: índices dos vereadores
                        1 if aprovado else 0,                   # 7: aprovado (1/0)
                        "",                                     # 8: subcategoria
                    ]
                    items.append(item)
                    item_ordem += 1

                # Pausa curta para não sobrecarregar o servidor
                time.sleep(0.3)

    print(f"   Total de proposições coletadas: {len(items)}")
    return items

# ============================================================================
# GERAÇÃO DO ARQUIVO dados.js
# ============================================================================

def gerar_dados_js(vereadores, proposicoes, saida="src/dados/dados.js"):
    """Gera o arquivo dados.js com todos os dados."""
    hoje = date.today().isoformat()

    # Calcular totais de categorias por vereador
    for item in proposicoes:
        vid_idx = item[6]
        tipo_cat = item[4]
        if vid_idx and len(vid_idx) > 0:
            idx = vid_idx[0]
            if idx < len(vereadores):
                v = vereadores[idx]
                cat = v.get("cat", {"b": 0, "c": 0, "h": 0, "l": 0, "o": 0})
                cat[tipo_cat] = cat.get(tipo_cat, 0) + 1

    # Totais globais
    catot = {"b": 0, "c": 0, "h": 0, "l": 0, "o": 0}
    for v in vereadores:
        for c in "bchlo":
            catot[c] = catot.get(c, 0) + v.get("cat", {}).get(c, 0)

    dados = {
        "ger": hoje,
        "gerh": hoje + "T00:00-03:00",
        "posse": DATA_POSSE,
        "rep": [],
        "ult": hoje,
        "sess": [],
        "semreg": [],
        "nvot": 0,
        "unan": 0,
        "v": vereadores,
        "items": proposicoes,
        "catot": catot,
        "bairros": [],
        "bairrosn": [],
        "sal": {"v": 16503, "lei": "Subsídio vigente", "u": ""},
    }

    conteudo = f"window.RX = {json.dumps(dados, ensure_ascii=False, indent=2)};"

    with open(saida, "w", encoding="utf-8") as f:
        f.write(conteudo)

    print(f"\n[OK] Arquivo gerado: {saida}")
    print(f"     Vereadores: {len(vereadores)}")
    print(f"     Proposições: {len(proposicoes)}")
    print(f"     Categorias: {catot}")

# ============================================================================
# MAIN
# ============================================================================

def main():
    print("=== Radar Recife - Coletor de Dados (SAPL Recife) ===\n")
    vereadores = coletar_vereadores()
    if not vereadores:
        print("\n[ERRO] Nenhum vereador coletado. Verifique a conexão com o SAPL.")
        return

    proposicoes = coletar_proposicoes(vereadores)
    gerar_dados_js(vereadores, proposicoes)
    print("\n=== Concluído ===")

if __name__ == "__main__":
    main()
