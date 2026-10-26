# Requisitos do OtimizaCV

> Situação: documento de planejamento. Nenhum requisito foi implementado até o momento.

## 1. Visão geral e escopo

O OtimizaCV é uma ferramenta web que recebe um currículo e a descrição de uma vaga, analisa como o documento tende a ser lido por sistemas de triagem automática (ATS) e devolve uma pontuação de aderência e sugestões de ajuste.

**Dentro do escopo**

- Análise de currículos em PDF, DOCX ou texto colado.
- Comparação do currículo com uma vaga informada pelo usuário.
- Relatório com pontuação, termos ausentes e alertas de formatação.

**Fora do escopo**

- Reproduzir o funcionamento de um ATS comercial específico.
- Avaliar a qualificação real do candidato.
- Reescrever o currículo automaticamente.
- Cadastro de usuários e armazenamento de currículos.

## 2. Público-alvo

Estudantes, recém-formados e trabalhadores em busca de emprego ou recolocação, com atenção especial a quem tem pouco acesso a orientação de carreira.

## 3. Requisitos funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF01 | O sistema deve aceitar o envio de currículo em PDF ou DOCX. | Alta |
| RF02 | O sistema deve aceitar o currículo como texto colado. | Alta |
| RF03 | O sistema deve receber o texto da descrição da vaga. | Alta |
| RF04 | O sistema deve extrair o texto do arquivo enviado, aplicando OCR quando o PDF for digitalizado. | Alta |
| RF05 | O sistema deve identificar as seções do currículo (dados de contato, objetivo, formação, experiência, competências, idiomas). | Média |
| RF06 | O sistema deve identificar competências técnicas (*hard skills*) e comportamentais (*soft skills*) no currículo e na vaga. | Média |
| RF07 | O sistema deve calcular uma pontuação de aderência entre currículo e vaga, de 0 a 100. | Alta |
| RF08 | O sistema deve listar os termos relevantes da vaga que não aparecem no currículo. | Alta |
| RF09 | O sistema deve alertar sobre elementos de formatação que dificultam a leitura automática (tabelas, colunas, imagens, cabeçalho e rodapé). | Média |
| RF10 | O sistema deve explicar, em linguagem simples, o motivo de cada alerta e sugestão. | Média |

## 4. Requisitos não funcionais

| ID | Requisito |
|----|-----------|
| RNF01 | **Privacidade (LGPD):** currículos devem ser processados apenas em memória e descartados ao fim da análise; nenhum dado pessoal será armazenado ou registrado em log. |
| RNF02 | **Desempenho:** a análise de um currículo de até duas páginas deve ser concluída em até 30 segundos. |
| RNF03 | **Acessibilidade:** a interface deve seguir as recomendações da WCAG 2.1 nível AA (contraste, navegação por teclado, textos alternativos). |
| RNF04 | **Responsividade:** a interface deve funcionar em celulares e computadores. |
| RNF05 | **Idioma:** a interface e as sugestões devem estar em português; a análise deve suportar inicialmente currículos e vagas em português. |
| RNF06 | **Limite de arquivo:** arquivos de até 5 MB. |
| RNF07 | **Transparência:** o relatório deve informar que a pontuação é uma estimativa e não reproduz nenhum ATS específico. |

## 5. Histórias de usuário

**HU01 — Analisar meu currículo para uma vaga**
Como candidato, quero enviar meu currículo e a descrição de uma vaga para saber o quanto meu currículo está alinhado a ela.

**HU02 — Saber o que falta**
Como candidato, quero ver quais termos da vaga não aparecem no meu currículo para decidir se devo incluí-los, caso correspondam à minha experiência.

**HU03 — Entender problemas de formatação**
Como candidato, quero saber se o layout do meu currículo atrapalha a leitura automática para corrigir antes de me candidatar.

**HU04 — Usar sem me expor**
Como candidato, quero ter a garantia de que meu currículo não será guardado para usar a ferramenta com segurança.

## 6. Critérios de aceitação

| História | Critério |
|----------|----------|
| HU01 | Dado um PDF ou DOCX válido e uma vaga com pelo menos 50 palavras, o sistema exibe uma pontuação de 0 a 100. |
| HU01 | Dado um arquivo em formato não suportado, o sistema exibe uma mensagem de erro clara, sem travar. |
| HU02 | Termos presentes na vaga e ausentes no currículo aparecem listados no relatório. |
| HU03 | Um currículo de teste com tabela de duas colunas gera pelo menos um alerta de formatação. |
| HU03 | Um PDF digitalizado (imagem) tem o texto extraído por OCR ou gera aviso de leitura parcial. |
| HU04 | Após a análise, nenhum arquivo ou texto do currículo permanece no servidor (verificado por inspeção do armazenamento e dos logs). |
