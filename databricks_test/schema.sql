-- ============================================================
-- Roadmap executivo no Databricks: tabelas, permissões e dados de teste
-- Rode no SQL editor, escolhendo um SQL warehouse no topo.
-- Troque catalogo.schema pelo seu catálogo e schema (Ctrl+H, "substituir tudo").
-- Rode por partes: selecione o trecho e clique em Run.
-- ============================================================

-- ------------------------------------------------------------
-- 1) TABELAS
-- ------------------------------------------------------------
-- CREATE SCHEMA IF NOT EXISTS catalogo.schema;   -- só se o schema ainda não existir

CREATE TABLE IF NOT EXISTS catalogo.schema.tbIniciativas (
  ID             STRING,
  Macroatividade STRING,
  Frente         STRING,
  DataInicio     DATE,
  DataFim        DATE,
  Predecessoras  STRING,
  Sucessoras     STRING,
  Concluida      STRING,   -- Sim / Não
  AlteradoPor    STRING,
  AlteradoEm     TIMESTAMP
);

CREATE TABLE IF NOT EXISTS catalogo.schema.tbFrentes (
  ID             STRING,
  Frente         STRING,
  Lider          STRING,
  Camada         STRING,   -- Fundação / Motor & Sistemas / Experiência / Operação
  CaminhoCritico STRING,   -- Sim / Não
  DataAlvo       DATE,
  DataReporte    DATE,
  Escopo         STRING,   -- OK / Parcial / Bloqueio / Sem informação / NA
  Prazo          STRING,
  Entregaveis    STRING,
  Rec_DS         STRING,   -- qualquer coluna Rec_* vira área viabilizadora
  Rec_CRM        STRING,
  Rec_Preco      STRING,
  Rec_ID         STRING,
  Rec_BE         STRING,
  RiscoNivel     STRING,   -- Alto / Médio / Baixo
  RiscoDescricao STRING,
  RecebeDe       STRING,
  EntregaPara    STRING,
  AlteradoPor    STRING,
  AlteradoEm     TIMESTAMP
);

CREATE TABLE IF NOT EXISTS catalogo.schema.tbPainel (
  Pergunta             STRING,
  Veredito             STRING,   -- Não confirmável / Com condições / Confirmado
  PrazoFinal           DATE,
  FrentesSemCronograma STRING,   -- opcionais: vazio = o painel calcula
  DependenciasEmRisco  STRING,
  FrentesComPendencia  STRING,
  BloqueiosProntidao   STRING,
  AlteradoPor          STRING,
  AlteradoEm           TIMESTAMP
);

-- ------------------------------------------------------------
-- 2) PERMISSÕES DO APP (escolha UMA opção e descomente: Ctrl+/ )
-- Troque `ID-DO-SERVICE-PRINCIPAL` pelo ID/client ID do service principal
-- do app (aba de autorização na página do app), mantendo as crases.
-- ------------------------------------------------------------

-- Opção A: no schema (cobre as 3 tabelas e as que você criar depois)
-- GRANT USE SCHEMA ON SCHEMA catalogo.schema TO `ID-DO-SERVICE-PRINCIPAL`;
-- GRANT SELECT, MODIFY ON SCHEMA catalogo.schema TO `ID-DO-SERVICE-PRINCIPAL`;

-- Opção B: tabela a tabela (funciona se você é dono das tabelas e do schema)
-- GRANT USE SCHEMA ON SCHEMA catalogo.schema TO `ID-DO-SERVICE-PRINCIPAL`;
-- GRANT SELECT, MODIFY ON TABLE catalogo.schema.tbIniciativas TO `ID-DO-SERVICE-PRINCIPAL`;
-- GRANT SELECT, MODIFY ON TABLE catalogo.schema.tbFrentes     TO `ID-DO-SERVICE-PRINCIPAL`;
-- GRANT SELECT, MODIFY ON TABLE catalogo.schema.tbPainel      TO `ID-DO-SERVICE-PRINCIPAL`;

-- No catálogo o app só precisa de USE CATALOG. Veja se ele já tem:
-- SHOW GRANTS ON CATALOG catalogo;
-- Se não tiver, peça ao admin: GRANT USE CATALOG ON CATALOG catalogo TO `ID-DO-SERVICE-PRINCIPAL`;

-- Conferência do que o app enxerga no schema e nas tabelas:
-- SHOW GRANTS ON SCHEMA catalogo.schema;
-- SHOW GRANTS ON TABLE catalogo.schema.tbFrentes;

-- ------------------------------------------------------------
-- 3) DADOS DE TESTE (opcional; descomente o bloco todo: selecione e Ctrl+/ )
-- Fictícios. As datas são relativas a hoje, então aparecem no roadmap.
-- Com dados nas tabelas, o painel deixa de mostrar o exemplo embutido.
-- ------------------------------------------------------------

-- INSERT INTO catalogo.schema.tbPainel
--   (Pergunta, Veredito, PrazoFinal, AlteradoPor, AlteradoEm)
-- VALUES
--   ('É possível entregar o MVP no prazo?', 'Com condições', DATE_ADD(current_date(), 120), 'teste', current_timestamp());

-- INSERT INTO catalogo.schema.tbFrentes
--   (ID, Frente, Lider, Camada, CaminhoCritico, DataAlvo, DataReporte,
--    Escopo, Prazo, Entregaveis, Rec_DS, Rec_CRM, RiscoNivel, RiscoDescricao,
--    RecebeDe, EntregaPara, AlteradoPor, AlteradoEm)
-- VALUES
--   ('01', 'Dados',       'Ana',    'Fundação',    'Sim', DATE_ADD(current_date(), 60),  DATE_ADD(current_date(), -2),
--    'OK', 'Parcial', 'OK', 'OK', 'NA', 'Médio', 'Ambiente de dados ainda em validação', '', '02', 'teste', current_timestamp()),
--   ('02', 'Plataforma',  'Bruno',  'Motor & Sistemas', 'Sim', DATE_ADD(current_date(), 90),  DATE_ADD(current_date(), -10),
--    'OK', 'OK', 'Bloqueio', 'Parcial', 'OK', 'Alto', 'Depende da frente de Dados', '01', '03', 'teste', current_timestamp()),
--   ('03', 'Experiência', 'Carla',  'Experiência', 'Não', DATE_ADD(current_date(), 110), NULL,
--    'Parcial', 'Sem informação', 'Sem informação', 'NA', 'NA', 'Baixo', '', '02', '', 'teste', current_timestamp());

-- INSERT INTO catalogo.schema.tbIniciativas
--   (ID, Macroatividade, Frente, DataInicio, DataFim, Predecessoras, Sucessoras, Concluida, AlteradoPor, AlteradoEm)
-- VALUES
--   ('1', 'Modelo de dados',      'Dados',       DATE_ADD(current_date(), -30), DATE_ADD(current_date(), 20),  '',  '2', 'Não', 'teste', current_timestamp()),
--   ('2', 'Carga inicial',        'Dados',       DATE_ADD(current_date(), 21),  DATE_ADD(current_date(), 55),  '1', '3', 'Não', 'teste', current_timestamp()),
--   ('3', 'Serviços de plataforma','Plataforma', DATE_ADD(current_date(), 10),  DATE_ADD(current_date(), 80),  '2', '4', 'Não', 'teste', current_timestamp()),
--   ('4', 'Telas principais',     'Experiência', DATE_ADD(current_date(), 60),  DATE_ADD(current_date(), 105), '3', '',  'Não', 'teste', current_timestamp());

-- Para conferir:
-- SELECT * FROM catalogo.schema.tbFrentes;

-- Para limpar os dados de teste depois (cuidado: apaga tudo das tabelas):
-- DELETE FROM catalogo.schema.tbIniciativas;
-- DELETE FROM catalogo.schema.tbFrentes;
-- DELETE FROM catalogo.schema.tbPainel;
