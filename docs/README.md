# Radar Recife

Projeto independente de fiscalização da Câmara Municipal do Recife, inspirado no
[Radar PTlândia](https://radarptlandia.org/) (Hortolândia-SP).

## O que faz

Mostra, vereador por vereador, o que cada um fez desde a posse (jan/2025):
- Presenças, ausências e faltas nas sessões
- Propostas: indicações (bairro), requerimentos (cobrança), homenagens, projetos de lei, vetos, moções
- Pedidos repetidos por bairro/rua
- Salário estimado dos vereadores
- Links para as fichas oficiais na Câmara

## Como funciona

É um **site estático** (HTML/CSS/JS) que consome um único arquivo `dados.js` gerado por um script de coleta (Python) que lê o **SAPL oficial da Câmara de Recife** (`e-processo.recife.pe.leg.br`). Nada é digitado à mão.

## Estrutura

```
radar-recife/
├── docs/
│   └── README.md           <- este arquivo
├── scripts/
│   └── coletar.py          <- scraper da Câmara de Recife (SAPL)
└── src/
    ├── index.html          <- página principal
    ├── css/
    │   └── style.css
    ├── js/
    │   └── app.js
    ├── img/
    │   ├── logo.png
    │   └── favicon.png
    ├── fotos/              <- fotos dos vereadores (<id>.jpg)
    └── dados/
        └── dados.js        <- gerado pelo script de coleta
```

## Como usar

### 1. Ver o site com dados reais (já coletados)

Os dados de 40 vereadores e 23.496 proposições já foram coletados e estão em `src/dados/dados.js`.

```bash
cd radar-recife/src
python3 -m http.server 8000
# acesse: http://localhost:8000/index.html
```

Ou use a extensão "Live Server" do VS Code, ou qualquer serviço de hospedagem estática (GitHub Pages, Netlify, Vercel).

### 2. Coletar/atualizar dados reais

O SAPL da Câmara de Recife está em `https://e-processo.recife.pe.leg.br/`. Os endpoints já estão configurados em `scripts/coletar.py`:

- `@@vereadores?op=init` → lista de vereadores da 19ª legislatura
- `materias_legislativas_json?ano=XXXX&tipo=YY&cod_autor=ZZZ` → proposições

```bash
pip install requests
python3 scripts/coletar.py
```

Isso gera/atualiza `src/dados/dados.js`.

### 3. Hospedar (grátis)

- **GitHub Pages**: suba o repositório e ative o GitHub Pages na pasta `src`.
- **Netlify Drop / Vercel**: arraste a pasta `src` e publique.

## Dados coletados (19ª legislatura 2025-2028)

- 40 vereadores
- Proposições de 2025 e 2026 (todos os tipos: PL, REQ, IND, VET, etc.)
- Fotos dos vereadores em `src/fotos/`

## Licença

Projeto independente, sem vínculo com a Câmara Municipal do Recife, Prefeitura ou partido político.
