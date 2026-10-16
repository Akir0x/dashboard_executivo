# Roadmap executivo (diretoria)

Painel executivo em **um único arquivo HTML**, irmão do dashboard de acompanhamento de iniciativas. Usa o mesmo esquema de atualização: o Power Automate lê as tabelas do Excel e embute os dados no HTML. Leia tudo antes de propor mudanças.

## Decisões já tomadas

- Público: diretoria. Pergunta central no topo (ex.: "É possível implantar o MVP até jan/27?") e **veredito do PMO**.
- **Precisa caber em um slide 16:9** (é reaproveitado em apresentação): com 8 frentes, a visão executiva cabe em 1600×900 sem rolagem. Expandir Recursos pode passar da largura (aceito). "Imprimir / PDF" gera página 16:9 (13,33×7,5 pol).
- Cabeçalho enxuto, como na foto de referência: só a pergunta; uma faixa com "Leitura para dd/mm", veredito, escala dos 3 estados e os 4 indicadores. **Não mostrar** título do fórum, prazo final em texto nem observação do PMO (removidos a pedido para ganhar espaço vertical).
- **Data da leitura = data da atualização feita pelo fluxo** (`GERADO_EM`), não um campo digitado.
- **Veredito não é calculado**: vem da `tbPainel` (Não confirmável / Com condições / Confirmado).
- **Marcos (losangos) vêm da `tbIniciativas`**, a mesma tabela do dashboard de iniciativas. Tudo fica **alinhado à grade de semanas**: o losango fica no **centro da coluna da semana** da DataFim; se houver mais de uma macroatividade na mesma semana e frente, vira **um losango só** com um número (quantidade) e o pior status (atrasado > em andamento > não iniciado > concluído). Passar o mouse no losango mostra todas as macroatividades daquela semana (nome, status, período, de quem depende e o que libera). O retângulo da frente vai da coluna da menor DataInicio até a coluna da maior DataFim.
- **Linha "Hoje"** fica no **fim da coluna da semana atual** (como na imagem de referência), com a etiqueta no rodapé.
- **Prontidão, risco e interdependências** vêm de uma tabela só, a `tbFrentes`. O resto é calculado a partir dela.
- **Pendência** = a frente tem algum item de prontidão diferente de OK (definido pela própria tabela, sem cálculo adicional).
- Roadmap **por semanas** (S1, S2… contadas a partir da primeira semana do programa), janela **móvel** de 18 semanas com navegação semana a semana e botão "Hoje". O botão "Programa completo" foi removido a pedido.
- **Dois visuais** do mesmo painel, escolhidos na compilação: `tremor` (componentes e cores padrão do Tremor, fonte Inter) e `forum` (estilo slide de comitê: cabeçalho escuro, vermelho de destaque, fonte Barlow). A escolha final entre os dois ainda está em aberto.
- Somente tema claro. Fontes embutidas no HTML (funciona sem internet).
- Dados de exemplo fictícios; não usar nomes reais de pessoas, projetos ou empresas.

## Tabelas (arquivo `roadmap_executivo_exemplo.xlsx`)

**`tbPainel`** (aba Painel, 1 linha, preenchida pelo PMO): `Pergunta`, `Veredito`, `PrazoFinal` (só usado para destacar a semana do prazo em vermelho) e os 4 indicadores opcionais `FrentesSemCronograma`, `DependenciasEmRisco`, `FrentesComPendencia`, `BloqueiosProntidao`. **Vazio = o painel calcula; preenchido ("2/8" ou "11") = o valor digitado aparece no topo.** Se só o numerador for digitado, o denominador continua calculado. As células ficam em formato Texto para o Excel não converter "2/8" em data.

**`tbFrentes`** (aba Frentes, 1 linha por frente):

| Coluna | Valores |
|---|---|
| `ID` | 01, 02… (número sem zero também funciona) |
| `Frente` | nome igual ao da coluna Frente da tbIniciativas |
| `Lider` | texto |
| `Camada` | Fundação, Motor & Sistemas, Experiência, Operação (cor do número e colunas do mapa) |
| `CaminhoCritico` | Sim/Não (tag CP e borda vermelha à esquerda) |
| `DataAlvo` | ▼ no roadmap; usada no "Sem cronograma · data-alvo" |
| `DataReporte` | ✓ verde se até 7 dias antes da data da leitura |
| `Escopo`, `Prazo`, `Entregaveis` | OK, Parcial, Bloqueio, Sem informação, **NA** (não se aplica: aparece como um traço "–", não conta como pendência nem entra no total OK/n) |
| `Rec_*` (ex.: `Rec_DS`, `Rec_CRM`, `Rec_Preco`, `Rec_ID`, `Rec_BE`) | idem; qualquer coluna que comece com `Rec_` vira área viabilizadora. "Recursos" = pior status entre elas, ignorando NA |
| `RiscoNivel` | Alto, Médio, Baixo |
| `RiscoDescricao` | texto do detalhe |
| `RecebeDe`, `EntregaPara` | IDs de frentes separados por `;` (basta um lado). É a dependência **declarada**; as macroatividades comprovam ou não |

**`tbIniciativas`** (aba Iniciativas): a mesma do dashboard de iniciativas (`ID`, `Macroatividade`, `Frente`, `DataInicio`, `DataFim`, `Predecessoras`, `Sucessoras`, `Concluida`).

- **IDs são só números** (sem prefixo). Uma macroatividade pode reunir várias atividades, então a célula de `ID` aceita **vários números separados por `;`** (ex.: `01; 50; 90`). `Predecessoras`/`Sucessoras` citam qualquer um desses números, e a ligação vai para a linha que o contém. "01" e "1" são o mesmo ID. Colunas ID, Predecessoras e Sucessoras ficam em formato Texto na planilha.
- A ligação com a frente é pelo **nome** (coluna `Frente` igual à da `tbFrentes`; acento e maiúscula não importam) ou pelo número da frente.

## Regras calculadas (`src/exec.ts`)

- **Status do marco:** Concluído (Concluida = Sim) · Atrasado (DataFim < hoje) · Em andamento (DataInicio ≤ hoje) · Não iniciado.
- **Sem cronograma:** frente sem nenhuma macroatividade com datas.
- **Frente em risco** (sinais): sem cronograma, algum Bloqueio de prontidão (inclui áreas), risco Alto ou marco atrasado.
- **Dependências entre frentes** = as declaradas na tbFrentes (RecebeDe/EntregaPara) **+** as que aparecem nas macroatividades (Predecessoras/Sucessoras da tbIniciativas ligando frentes diferentes). Cada uma tem três estados:
  - **comprovada**: há pelo menos uma macroatividade de uma frente que é predecessora de uma macroatividade da outra → chip cheio;
  - **hipótese a validar**: declarada, mas sem macroatividade que a sustente → chip tracejado;
  - **não declarada**: aparece nas macroatividades, mas não na tbFrentes → chip com "!" laranja.
- **Dependência em risco** (chip/seta vermelhos): se comprovada, quando alguma predecessora está atrasada ou a sucessora começa antes de ela terminar (conflito de datas); se hipótese, quando a frente que entrega está em risco.
- **Indicadores do topo:** frentes sem cronograma / total; dependências em risco / total (incluindo as não declaradas); frentes com pendência de prontidão / total; nº de bloqueios de prontidão.
- **Carga de marcos por semana:** nº de macroatividades com DataFim na semana; pico em destaque.
- **Setas "Ver dependências"** (plano): ligam macroatividades de frentes diferentes (Predecessoras/Sucessoras da tbIniciativas); vermelha tracejada se a predecessora está atrasada ou se a sucessora começa antes de ela terminar.

## Estrutura da tela

1. Cabeçalho: pergunta e "Atualizado em…" (só com dados do fluxo; o selo "Dados de exemplo" foi removido a pedido). Botão "PDF" pequeno, fixo no canto inferior direito.
2. Faixa única: "Leitura para dd/mm" + veredito + escala de 3 estados + 4 indicadores.
3. **Plano integrado** (visão executiva). Os controles ficam na barra do próprio bloco, **pequenos e discretos** (texto cinza, sem borda, para não competir com o conteúdo): ‹ Hoje › (semana a semana), intervalo S#–S#, "Ver dependências" e "Mapa de interdependências ›". Grade: frente (nº colorido pela camada, ✓ reporte, nome, líder, CP) · semanas agrupadas por mês (semana atual e semana do prazo destacadas, linha tracejada "Hoje") · Prontidão (Escopo, Prazo, Entregáveis, Recursos com + para expandir as áreas) · Risco (barras + ⚠ se sem cronograma) · Interdependências (← recebe de, → entrega para). Rodapé: carga de marcos por semana e totais OK/n. Passar o mouse numa frente apaga as não conectadas; clicar abre o painel de detalhe (prontidão, áreas, risco, interdependências, marcos).
4. **Mapa de interdependências** (tela separada, sem a faixa de veredito e indicadores; botão "‹ Voltar à visão executiva"), em formato de **rede no tempo**:
   - faixa-resumo: total de dependências, comprovadas, hipóteses, não declaradas, em risco;
   - raias = frentes; aparecem **todas as macroatividades** (decisão: o mapa mostra o todo), como **retângulos do período com o nome dentro** (cor da camada da frente; corta com "…" se não couber; atrasada com contorno vermelho e ícone de alarme; concluída mais clara). A raia **cresce em linhas** conforme a quantidade de macroatividades, sem sobrepor (como no primeiro roadmap). Setas do fim da predecessora ao início da sucessora: **entre frentes** em cinza escuro (clicáveis, filtram a lista) e **dentro da mesma frente** em cinza claro e fino; vermelha tracejada se atrasada ou em conflito. Raia sem nenhuma macroatividade mostra "Sem cronograma" e as hipóteses dela;
   - passar o mouse numa frente destaca as conectadas; clicar na frente ou numa seta filtra a lista; duplo clique na frente abre o detalhe;
   - lista "Dependências por par de frentes": em risco primeiro, depois hipóteses; cada par mostra o estado e as macroatividades que o formam (ou o aviso para validar com os líderes).
5. Legenda compacta (3 linhas) abaixo do plano.

## Código (`app` deste painel)

```
index.html          marcadores do fluxo (ver abaixo)
src/exec.ts         leitura das 3 tabelas e regras
src/data.ts         leitura da tbIniciativas (mesmo código do dashboard de iniciativas)
src/Plano.tsx       grade semanal + prontidão + rodapé + legenda
src/Mapa.tsx        mapa de interdependências (rede no tempo + lista por par)
src/ChipDep.tsx     chip de interdependência (comprovada, hipótese, não declarada, risco)
src/App.tsx         cabeçalho, veredito, indicadores, abas, detalhe
src/tema.ts         os dois visuais (classes por visual)
src/icones.tsx      ícones de prontidão, risco e losango
gerar_exemplo.py    gera a planilha de exemplo e src/exemplo.json
```

Compilar: `npm install` e `npm run build` → gera `dist-tremor/index.html` e `dist-forum/index.html`. Depois confirme que cada marcador aparece exatamente uma vez.

## Fluxo do Power Automate

Marcadores no `<head>` (não repetir esses textos em nenhum outro lugar do arquivo):

```js
window.PAINEL_FLUXO = /*PAINEL*/[];
window.FRENTES_FLUXO = /*FRENTES*/[];
window.DADOS_FLUXO = /*DADOS*/[];      // tbIniciativas, mesmo marcador do outro dashboard
window.GERADO_EM = "/*GERADO_EM*/";
```

Guardar duas cópias do HTML no SharePoint: o **modelo** (o HTML compilado, intocado, com os marcadores) e o **publicado** (gerado pelo fluxo). O fluxo sempre lê o modelo. Escolha um dos dois visuais como modelo (`roadmap_executivo_tremor.html` ou `roadmap_executivo_forum.html`).

1. **Gatilho:** *SharePoint → Quando um arquivo é criado ou modificado (somente propriedades)* apontando para a pasta do Excel (atualiza ao salvar a planilha), ou *Recorrência* (ex.: a cada hora).
2. **Excel Online (Business) → Listar linhas presentes em uma tabela**, três vezes, no mesmo arquivo. Renomeie as ações para bater com a expressão do passo 4:
   - `Listar_tbPainel` → tabela `tbPainel`
   - `Listar_tbFrentes` → tabela `tbFrentes`
   - `Listar_tbIniciativas` → tabela `tbIniciativas`

   Em *Configurações* de cada uma, ative a paginação (limite 5000). Opcional: *Formato DateTime = ISO 8601*. O painel também entende datas como número serial.
3. **SharePoint → Obter conteúdo do arquivo usando o caminho:** o modelo (ex.: `/Dashboard/modelo/roadmap_executivo_tremor.html`).
4. **Redigir**, renomeada para `Montar_HTML`, com o `replace` aninhado:

```
replace(replace(replace(replace(
  base64ToString(body('Obter_conteúdo_do_arquivo_usando_o_caminho')?['$content']),
  '/*PAINEL*/[]',  string(body('Listar_tbPainel')?['value'])),
  '/*FRENTES*/[]', string(body('Listar_tbFrentes')?['value'])),
  '/*DADOS*/[]',   string(body('Listar_tbIniciativas')?['value'])),
  '/*GERADO_EM*/', formatDateTime(convertFromUtc(utcNow(), 'E. South America Standard Time'), 'dd/MM/yyyy HH:mm'))
```

   Se o conteúdo vier como texto puro (sem `$content`), use `body('Obter_conteúdo_do_arquivo_usando_o_caminho')` direto, sem `base64ToString`.
5. **SharePoint → Criar arquivo:** pasta de publicação, nome `roadmap_executivo.html`, conteúdo `outputs('Montar_HTML')`. Se acusar arquivo existente, use *Atualizar arquivo* com o identificador do arquivo publicado.
6. Opcional: postar no Teams ou enviar e-mail com o link do arquivo publicado.

O `GERADO_EM` vira o "Atualizado em…" e a "Leitura para dd/mm" do topo. Conectores usados são **padrão** (Excel Online e SharePoint), sem premium.

**Limitações:** o SharePoint Online baixa arquivos `.html` em vez de abri-los, então cada pessoa abre a cópia baixada no navegador. Alguns antivírus ou políticas podem alertar sobre `.html` baixado; teste com um colega antes de divulgar.

Se a `tbFrentes` vier vazia, o painel mostra os dados de exemplo (sem selo indicando isso). Testado com a saída simulada do conector (datas como número serial, IDs sem zero à esquerda, chaves `@odata.etag`).

## Em discussão

- Qual dos dois visuais (tremor ou forum) segue.
