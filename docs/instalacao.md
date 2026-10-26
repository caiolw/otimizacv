# Instalação e execução

> Situação: ainda não há código executável da ferramenta. Este documento descreve como visualizar a página do projeto e como o protótipo deverá ser executado.

## Visualizar a página do projeto

A página publicada está em: https://caiolw.github.io/otimizacv/

Para abrir localmente:

```bash
git clone https://github.com/caiolw/otimizacv.git
cd otimizacv
python -m http.server 8000
```

Depois, acesse `http://localhost:8000` no navegador. Também é possível abrir o arquivo `index.html` diretamente.

## Protótipo (previsto)

Esta seção será completada quando o protótipo existir. A execução prevista é:

**Pré-requisitos**

- Python 3.11 ou superior
- Tesseract OCR instalado no sistema, com o pacote de idioma português (`por`)

**Instalação**

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download pt_core_news_sm
```

**Execução**

```bash
uvicorn app.main:app --reload
```

**Testes**

```bash
pytest
```

**Variáveis de ambiente**

Nenhuma credencial é necessária. Se surgir alguma configuração, ela ficará em um arquivo `.env` fora do repositório, com um modelo `.env.example` sem valores reais.
