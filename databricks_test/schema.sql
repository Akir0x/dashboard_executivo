-- Rode no SQL editor do Databricks. Troque catalogo.schema pelo seu catálogo e schema.
-- CREATE CATALOG / SCHEMA só se ainda não existirem e você tiver permissão.
-- CREATE SCHEMA IF NOT EXISTS catalogo.schema;

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

-- Permissões para o app. Troque pelo nome do service principal do app
-- (aparece na aba "Authorization" da página do app).
-- GRANT USE CATALOG ON CATALOG catalogo TO `service-principal-do-app`;
-- GRANT USE SCHEMA  ON SCHEMA  catalogo.schema TO `service-principal-do-app`;
-- GRANT SELECT, MODIFY ON TABLE catalogo.schema.tbIniciativas TO `service-principal-do-app`;
-- GRANT SELECT, MODIFY ON TABLE catalogo.schema.tbFrentes     TO `service-principal-do-app`;
-- GRANT SELECT, MODIFY ON TABLE catalogo.schema.tbPainel      TO `service-principal-do-app`;
