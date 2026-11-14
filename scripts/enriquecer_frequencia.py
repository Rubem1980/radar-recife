#!/usr/bin/env python3
"""
Enriquecimento de dados: busca frequência, email, telefone e whatsapp
de cada vereador via endpoint @@vereadores/{id}?scope=frequencia
"""
import json
import re
import time
import requests

DADOS_PATH = "/home/biu/Documentos/Default Project/radar-recife/dados/dados.js"
BASE_URL = "https://e-processo.recife.pe.leg.br"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; RadarRecife/1.0; +https://github.com/Rubem1980/radar-recife)",
    "Accept": "application/json",
}

def get_json(url, params=None, tentativas=3):
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

def main():
    # Ler dados.js
    with open(DADOS_PATH, "r", encoding="utf-8") as f:
        conteudo = f.read()
    inicio = conteudo.index("{")
    fim = conteudo.rindex("}") + 1
    dados = json.loads(conteudo[inicio:fim])

    vereadores = dados.get("v", [])
    print(f"Enriquecendo {len(vereadores)} vereadores com dados de frequência...")

    for i, v in enumerate(vereadores):
        vid = v["id"]
        nome = v["nome"]
        print(f"  [{i+1}/{len(vereadores)}] {nome} (id={vid})")

        url = f"{BASE_URL}/@@vereadores/{vid}"
        params = {"scope": "frequencia", "page_frequencia": "1", "page_size": "10", "ordem_frequencia": "desc"}
        d = get_json(url, params=params)

        if d:
            # Email, telefone, whatsapp
            if d.get("email"):
                v["email"] = d["email"]
            if d.get("telefone_gabinete"):
                v["tel"] = d["telefone_gabinete"]
            if d.get("whatsapp_gabinete"):
                v["whats"] = d["whatsapp_gabinete"]

            # Dados de frequência
            freq = d.get("frequencia", {})
            resumo = freq.get("resumo", {})
            if resumo:
                v["P"] = resumo.get("presencas", 0)
                v["A"] = resumo.get("ausencias_justificadas", 0)
                v["F"] = resumo.get("faltas", 0)
                # total_sessoes pode ser usado para calcular percentual se necessário

        time.sleep(0.3)  # não sobrecarregar o servidor

    # Salvar dados.js atualizado
    conteudo_saida = f"window.RX = {json.dumps(dados, ensure_ascii=False, indent=2)};"
    with open(DADOS_PATH, "w", encoding="utf-8") as f:
        f.write(conteudo_saida)

    print(f"\n[OK] dados.js atualizado com dados de frequência")
    # Verificar alguns exemplos
    for v in vereadores[:3]:
        print(f"  {v['nome']}: P={v.get('P')}, A={v.get('A')}, F={v.get('F')}, email={v.get('email')}, tel={v.get('tel')}, whats={v.get('whats')}")

if __name__ == "__main__":
    main()
