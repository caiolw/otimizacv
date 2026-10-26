# Gestão e evolução

## 1. Etapas

| Etapa | Descrição | Situação |
|-------|-----------|----------|
| 1. Definição do problema e referencial | Delimitação do problema e do público; seleção de referências revisadas por pares. | Concluída |
| 2. Página e documentação | Página do projeto no GitHub Pages, requisitos e arquitetura proposta. | Concluída |
| 3. Protótipo de extração e pontuação | Extração de PDF e DOCX e pontuação por TF-IDF e similaridade de cosseno. | Próxima |
| 4. Reconhecimento, *embeddings* e relatório | NER de seções e competências, comparação semântica e geração de sugestões. | Planejada |
| 5. Interface de análise | Formulário de envio e tela de resultado. | Planejada |
| 6. Validação com usuários | Testes com estudantes e trabalhadores, com consentimento e sem armazenar currículos. | Planejada |

## 2. Registro de decisões

| Decisão | Motivo |
|---------|--------|
| Usar apenas referências publicadas e revisadas por pares. | Exigência da disciplina. Trabalhos disponíveis só como *preprint* (arXiv) e uma monografia de especialização foram substituídos por artigos publicados em periódicos e conferências. |
| Não armazenar currículos. | Proteção de dados pessoais e adequação à LGPD. |
| Combinar correspondência por palavras-chave e semântica. | Mostrar ao usuário tanto o que um filtro simples enxerga quanto equivalências de sentido. |
| Não prometer reproduzir um ATS específico. | Os critérios dos sistemas comerciais não são públicos; a pontuação é uma estimativa. |

## 3. Limitações conhecidas

- A pontuação é uma estimativa e não corresponde ao resultado de nenhum ATS real.
- O suporte inicial é apenas para português.
- OCR pode falhar em currículos com baixa qualidade de digitalização.
- A ferramenta avalia a legibilidade e o alinhamento do documento, não a competência do candidato.

## 4. Problemas encontrados

| Problema | Como foi tratado |
|----------|------------------|
| Parte das referências iniciais não era publicada oficialmente. | Substituídas por artigos revisados por pares sobre os mesmos temas. |

## 5. Melhorias planejadas

- Suporte a currículos e vagas em inglês.
- Comparação de um mesmo currículo com várias vagas.
- Sugestões de reescrita de trechos, sempre como sugestão e nunca de forma automática.
