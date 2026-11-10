# Protótipo do OtimizaCV

Interface de teste publicada em https://caiolw.github.io/otimizacv/app/

O protótipo roda inteiramente no navegador. O currículo não é enviado a nenhum servidor e não é armazenado, o que atende ao RNF01 (LGPD) sem precisar de back-end.

## O que já funciona

| Requisito | Situação no protótipo |
|-----------|-----------------------|
| RF01 – Envio de PDF ou DOCX | Implementado, com limite de 5 MB (RNF06) |
| RF02 – Texto colado | Implementado |
| RF03 – Descrição da vaga | Implementado, com mínimo de 50 palavras |
| RF04 – Extração e OCR | PDF com pdf.js, DOCX com mammoth.js. PDF digitalizado é lido com tesseract.js (até 3 páginas) |
| RF05 – Seções | Detecção por títulos e padrões (e-mail, telefone) |
| RF06 – Competências | Detecção por lista de termos técnicos e comportamentais |
| RF07 – Pontuação de 0 a 100 | 70% cobertura ponderada dos 25 termos-chave da vaga + 30% similaridade do cosseno |
| RF08 – Termos ausentes | Implementado |
| RF09 – Alertas de formatação | PDF: colunas, imagens, cabeçalho e rodapé. DOCX: tabelas e imagens |
| RF10 – Explicações | Cada alerta e lista traz explicação em linguagem simples |
| RNF07 – Transparência | Aviso de que a nota é uma estimativa |

## Limitações

- A comparação é léxica (frequência de termos). Sinônimos não são reconhecidos. Embeddings ficam para a versão com back-end.
- Seções e competências são reconhecidas por listas fixas, não por um modelo de NER.
- Cabeçalho e rodapé de DOCX não são analisados.
- O OCR baixa o tesseract.js e o modelo de português da CDN jsDelivr na primeira vez que é usado.

## Arquivos

- `index.html`, `estilo.css`: interface.
- `app.js`: eventos da tela e montagem do relatório.
- `extrator.js`: leitura de PDF e DOCX, OCR e detecção de formatação.
- `analisador.js`: tokenização, termos-chave, pontuação, seções e competências.
- `vendor/`: pdf.js 4.10.38 (Apache 2.0) e mammoth.js 1.8.0 (BSD-2-Clause), com as licenças.

## Executar localmente

O navegador bloqueia módulos JavaScript abertos direto do disco. Use um servidor local na raiz do repositório:

```
python -m http.server 8000
```

Depois abra http://localhost:8000/app/
