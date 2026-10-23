"""Gera a planilha de exemplo (dados fictícios) do roadmap executivo e o src/exemplo.json do app.

Tabelas:
  tbPainel      1 linha  · preenchida pelo PMO (pergunta, veredito, prazo final)
  tbFrentes     1 linha por frente · prontidão, risco, interdependências
  tbIniciativas 1 linha por macroatividade · é a MESMA tabela do dashboard de iniciativas;
                cada linha vira um losango (marco) na raia da sua frente
"""
import json
from datetime import date
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.table import Table, TableStyleInfo
from openpyxl.utils import get_column_letter

AQUI = Path(__file__).parent
D = date

PAINEL_CAB = ["Pergunta", "Veredito", "PrazoFinal", "FrentesSemCronograma", "DependenciasEmRisco", "FrentesComPendencia", "BloqueiosProntidao"]
# Indicadores vazios = o painel calcula. Para fixar um valor, digite "2/8" ou só "2".
PAINEL = [("É possível implantar o MVP até jan/27?", "Não confirmável", D(2027, 1, 29), None, None, None, None)]

FRENTES_CAB = [
    "ID", "Frente", "Lider", "Camada", "CaminhoCritico", "DataAlvo", "DataReporte",
    "Escopo", "Prazo", "Entregaveis",
    "Rec_DS", "Rec_CRM", "Rec_Preco", "Rec_ID", "Rec_BE",
    "RiscoNivel", "RiscoDescricao", "RecebeDe", "EntregaPara",
]
FRENTES = [
    ("01", "Base de dados de clientes", "Ana Ribeiro", "Fundação", "Sim", D(2026, 11, 27), D(2026, 10, 14),
     "Parcial", "Parcial", "Parcial", "OK", "OK", "NA", "OK", "OK",
     "Médio", "Volume de dados maior que o previsto pode atrasar a validação.", "", "02"),
    ("02", "Motor de regras", "Carlos Mendes", "Motor & Sistemas", "Sim", D(2026, 12, 4), D(2026, 10, 14),
     "Parcial", "Parcial", "OK", "OK", "Parcial", "Parcial", "OK", "OK",
     "Baixo", "Regras de exceção ainda em discussão com a área de preço.", "01", "04; 05; 06; 07"),
    ("03", "Novo portfólio de serviços", "Julia Prado", "Motor & Sistemas", "Não", D(2027, 1, 8), D(2026, 10, 14),
     "OK", "OK", "OK", "Bloqueio", "OK", "OK", "OK", "NA",
     "Baixo", "Time de dados sem alocação confirmada para a carga.", "", "05; 06; 07"),
    ("04", "Integração com parceiro externo", "Rafael Lima", "Motor & Sistemas", "Não", D(2026, 12, 31), D(2026, 9, 30),
     "Bloqueio", "Bloqueio", "Bloqueio", "Sem informação", "Sem informação", "Bloqueio", "Sem informação", "Bloqueio",
     "Médio", "Parceiro ainda não confirmou cronograma nem equipe.", "02", "08"),
    ("05", "Adaptação do sistema de cobrança", "Beatriz Alves", "Motor & Sistemas", "Sim", D(2027, 1, 29), D(2026, 10, 14),
     "OK", "Parcial", "OK", "OK", "OK", "OK", "OK", "OK",
     "Médio", "Janela de congelamento de fim de ano reduz o tempo de testes.", "02; 03", "08"),
    ("06", "Experiência do cliente", "Diego Martins", "Experiência", "Sim", D(2026, 12, 23), D(2026, 9, 30),
     "Parcial", "Parcial", "Parcial", "OK", "OK", "OK", "OK", "OK",
     "Alto", "Depende das definições do motor de regras para fechar as telas.", "02; 03", "08"),
    ("07", "Experiência do atendente", "Diego Martins", "Experiência", "Sim", D(2026, 12, 23), D(2026, 9, 30),
     "Parcial", "Parcial", "Parcial", "Parcial", "OK", "Parcial", "OK", "OK",
     "Alto", "Treinamento da rede concorre com outras campanhas no período.", "02; 03", "08"),
    ("08", "Gestão e conciliação", "Fernanda Rocha", "Operação", "Não", D(2027, 1, 29), D(2026, 9, 30),
     "Bloqueio", "Bloqueio", "Bloqueio", "Bloqueio", "Sem informação", "Sem informação", "Sem informação", "Bloqueio",
     "Médio", "Sem dono definido para a conciliação financeira.", "04; 05; 06; 07", ""),
]

INI_CAB = ["ID", "Macroatividade", "Frente", "DataInicio", "DataFim", "Predecessoras", "Sucessoras", "Concluida"]
INICIATIVAS = [
    ("M01", "Mapeamento das fontes", "Base de dados de clientes", D(2026, 9, 28), D(2026, 10, 2), "", "", "Sim"),
    ("M02", "Carga inicial", "Base de dados de clientes", D(2026, 10, 5), D(2026, 10, 9), "M01", "", "Sim"),
    ("M03", "Validação da base", "Base de dados de clientes", D(2026, 10, 12), D(2026, 10, 23), "M02", "", "Não"),
    ("M04", "Regras de cálculo", "Motor de regras", D(2026, 10, 13), D(2026, 10, 30), "M03", "", "Não"),
    ("M05", "Parametrização", "Motor de regras", D(2026, 11, 2), D(2026, 11, 27), "M04", "", "Não"),
    ("M06", "Homologação do motor", "Motor de regras", D(2026, 11, 30), D(2026, 12, 4), "M05", "", "Não"),
    ("M07", "Desenho do portfólio", "Novo portfólio de serviços", D(2026, 9, 28), D(2026, 10, 30), "", "", "Não"),
    ("M08", "Aprovação comercial", "Novo portfólio de serviços", D(2026, 11, 2), D(2026, 12, 4), "M07", "", "Não"),
    ("M09", "Carga do portfólio", "Novo portfólio de serviços", D(2026, 12, 7), D(2027, 1, 8), "M08", "", "Não"),
    ("M10", "Especificação", "Adaptação do sistema de cobrança", D(2026, 10, 13), D(2026, 10, 23), "", "", "Não"),
    ("M11", "Desenvolvimento", "Adaptação do sistema de cobrança", D(2026, 11, 2), D(2026, 11, 13), "M10; M04", "", "Não"),
    ("M12", "Testes integrados", "Adaptação do sistema de cobrança", D(2026, 11, 30), D(2026, 12, 11), "M11; M05", "", "Não"),
    ("M13", "Piloto", "Adaptação do sistema de cobrança", D(2026, 12, 14), D(2026, 12, 31), "M12", "", "Não"),
    ("M14", "Implantação", "Adaptação do sistema de cobrança", D(2027, 1, 11), D(2027, 1, 29), "M13; M09", "", "Não"),
    ("M15", "Pesquisa com clientes", "Experiência do cliente", D(2026, 9, 28), D(2026, 10, 2), "", "", "Sim"),
    ("M16", "Protótipo navegável", "Experiência do cliente", D(2026, 10, 5), D(2026, 10, 9), "M15", "", "Sim"),
    ("M17", "Jornada validada", "Experiência do cliente", D(2026, 10, 5), D(2026, 10, 14), "M16", "", "Não"),
    ("M18", "Telas finais", "Experiência do cliente", D(2026, 10, 19), D(2026, 10, 23), "M17", "", "Não"),
    ("M19", "Lançamento para clientes", "Experiência do cliente", D(2026, 12, 7), D(2026, 12, 23), "M18; M06", "", "Não"),
    ("M20", "Mapeamento do atendimento", "Experiência do atendente", D(2026, 10, 5), D(2026, 10, 9), "", "", "Sim"),
    ("M21", "Roteiro de atendimento", "Experiência do atendente", D(2026, 10, 12), D(2026, 10, 23), "M20; M02", "", "Não"),
    ("M22", "Treinamento da rede", "Experiência do atendente", D(2026, 12, 14), D(2026, 12, 23), "M21; M06; M17", "", "Não"),
]


# IDs são só números. Uma macroatividade pode reunir várias atividades: a célula de ID aceita
# vários números separados por ";" (ex.: "120; 121; 122"). Predecessoras/Sucessoras citam
# qualquer um desses números.
_IDS = {f"M{n:02d}": str(n * 10) for n in range(1, 23)}
_IDS.update({"M05": "50; 51", "M12": "120; 121; 122", "M19": "190; 191", "M09": "90; 91"})
_REF = {k: v.split("; ")[-1] for k, v in _IDS.items()}  # referência usa um dos números da macroatividade
INICIATIVAS = [
    (_IDS[i], m, f, a, b, "; ".join(_REF[x.strip()] for x in pr.split(";") if x.strip()), su, c)
    for (i, m, f, a, b, pr, su, c) in INICIATIVAS
]

# ---------- campos do detalhe e da tela de evolução/criticidade ----------
PAINEL_CAB = PAINEL_CAB + ["TituloEvolucao"]
PAINEL = [PAINEL[0] + ("Evoluções e roadblocks",)]

_DETALHE = {  # ID da frente: (NomeCurto, Descricao, Area, Sponsor, EscopoComentario, PrazoComentario, EntregaveisComentario, RecursosComentario)
    "01": ("Dados", "Validação das fontes de dados de clientes e disponibilização para o motor.", "Dados", "Marcos Vieira",
           "Fontes principais validadas; faltam 2 bases secundárias.", "Validação vence em 23/10; consolidação em 27/11.", "5 macroatividades com datas; 2 concluídas.", "Todas as áreas alocadas."),
    "02": ("Motor", "Motor de regras que calcula a elegibilidade e o benefício.", "Tecnologia", "Marcos Vieira",
           "Regras de exceção em discussão.", "Depende da base validada (frente 01).", "Entregáveis mapeados e datados.", "CRM e Preço com alocação parcial."),
    "03": ("Portfólio", "Definição do novo portfólio de serviços e sua carga nos sistemas.", "Produtos", "Luísa Campos",
           "Escopo fechado.", "Data final comprometida.", "Entregáveis mapeados.", "Time de dados sem alocação confirmada."),
    "04": ("Parceiro", "Integração com parceiro externo para informar elegibilidade.", "Parcerias", "Luísa Campos",
           "Escopo mínimo ainda não acordado com o parceiro.", "Sem cronograma do parceiro.", "Requisitos em levantamento.", "Equipe do parceiro não confirmada."),
    "05": ("Cobrança", "Adaptação do sistema de cobrança para aplicar o novo benefício.", "Tecnologia", "Marcos Vieira",
           "Escopo fechado.", "Janela de congelamento reduz testes.", "Entregáveis mapeados.", "Áreas alocadas."),
    "06": ("Cliente", "Jornada e comunicação do benefício para o cliente.", "Canais", "Paula Moraes",
           "Canal do MVP em decisão.", "Lançamento depende do motor.", "Telas finais em andamento.", "Áreas alocadas."),
    "07": ("Atendente", "Ferramentas e treinamento da rede de atendimento.", "Canais", "Paula Moraes",
           "Escopo mínimo em aberto.", "Treinamento concorre com campanhas.", "Roteiro em andamento.", "Preço com alocação parcial."),
    "08": ("Conciliação", "Gestão e conciliação financeira do benefício.", "Operações", "Paula Moraes",
           "Sem dono definido.", "Sem cronograma.", "Sem entregáveis mapeados.", "Áreas não confirmadas."),
}
FRENTES_CAB = FRENTES_CAB + ["NomeCurto", "Descricao", "Area", "Sponsor", "EscopoComentario", "PrazoComentario", "EntregaveisComentario", "RecursosComentario"]
FRENTES = [l + _DETALHE[l[0]] for l in FRENTES]

_RESP = {
    "Base de dados de clientes": "Dados · Engenharia", "Motor de regras": "Tecnologia · Motor", "Novo portfólio de serviços": "Produtos",
    "Adaptação do sistema de cobrança": "Tecnologia · Cobrança", "Experiência do cliente": "Canais · UX", "Experiência do atendente": "Canais · Rede",
}
_AVANCO = {"Validação da base": "60%", "Regras de cálculo": "30%", "Desenho do portfólio": "80%", "Especificação": "50%", "Jornada validada": "70%", "Roteiro de atendimento": "40%"}
INI_CAB = INI_CAB + ["Responsavel", "Avanco"]
INICIATIVAS = [l + (_RESP.get(l[2], ""), "100%" if l[7] == "Sim" else _AVANCO.get(l[1], "")) for l in INICIATIVAS]

PONTOS_CAB = ["Tipo", "Titulo", "Descricao", "Acao", "Frente", "Responsavel", "Prazo", "Criticidade", "Data", "Fonte"]
PONTOS = [
    ("Evolução", "Governança e visão integrada", "Rotina de acompanhamento 3x por semana e fórum quinzenal; macroatividades padronizadas por frente.", "", "Todas", "PMO", None, "", D(2026, 10, 16), "Reunião de acompanhamento"),
    ("Evolução", "Base de clientes", "Fontes principais validadas; faltam 2 bases secundárias.", "", "01", "Ana Ribeiro", None, "", D(2026, 10, 16), ""),
    ("Evolução", "Motor de regras", "Arquitetura definida; ingestão passa a depender da base validada.", "", "02", "Carlos Mendes", None, "", D(2026, 10, 14), ""),
    ("Evolução", "Portfólio", "Pesquisa de nomes concluída, sem fechamento; comissão em 03/11.", "", "03", "Julia Prado", None, "", D(2026, 10, 15), ""),
    ("Evolução", "Cliente e atendente", "Proposta de canal mínimo apresentada; escopo do atendente em discussão.", "", "06; 07", "Diego Martins", None, "", D(2026, 10, 16), ""),
    ("Evolução", "Gestão e conciliação", "Frente passou a ter uma única atividade, ainda sem responsável.", "", "08", "Fernanda Rocha", None, "", D(2026, 10, 16), ""),
    ("Risco", "Canal do MVP: decisão hoje", "Proposta de canal mínimo com cobertura parcial da carteira; canal alternativo exige esforço maior.", "Decidir entre canal mínimo ou condicionar o alternativo à análise de esforço.", "03; 06; 07", "Diego Martins", D(2026, 10, 16), "Crítico", None, "Reunião de 16/10"),
    ("Risco", "Parceiro sem previsibilidade", "Macroatividades do parceiro sem datas; requisitos fecham em 30/10.", "Fixar escopo mínimo e responsáveis; entregar requisitos e esforço até 30/10.", "04; 02; 08", "Rafael Lima", D(2026, 10, 30), "Crítico", None, ""),
    ("Risco", "Mensagens 2 e 3 sem dono", "Só a primeira mensagem tem esforço confirmado; as demais dependem do motor.", "Definir quem constrói as mensagens 2 e 3 e o responsável pelo front.", "06; 02; 05", "Beatriz Alves", D(2026, 10, 21), "Alto", None, ""),
    ("Risco", "Nome do portfólio trava 8 atividades", "Campo obrigatório sem fechamento; trava comissão, materiais e ofertas.", "Fechar o nome e levar à comissão.", "03; 02; 06; 07", "Julia Prado", D(2026, 10, 31), "Alto", None, ""),
    ("Risco", "Calendários motor × cobrança", "Cobrança homologa em dezembro e depende da base no ambiente de dados.", "Alinhar arquitetura, data de apuração e agenda de testes integrados.", "02; 05", "Carlos Mendes", D(2026, 10, 30), "Médio", None, ""),
    ("Atenção", "Qualidade de 2 bases secundárias", "Aderência caiu para 50–60%; tratado como ponto de atenção, não bloqueio.", "Investigar a mudança de regra com Engenharia e Produtos.", "01", "Ana Ribeiro", D(2026, 10, 23), "Médio", None, ""),
    ("Pendência", "Consolidar bases de investimento", "Consolidação exige esforço técnico elevado, sem prazo de refatoração.", "Engenharia estrutura a visão consolidada e o monitoramento de carga.", "01", "Engenharia", D(2026, 11, 26), "", None, ""),
    ("Pendência", "Regra de elegibilidade não fechada", "Regra pode exigir débito técnico se não for aprovada antes da rotina.", "Aprovar a regra antes da rotina de elegibilidade.", "01; 02", "Ana Ribeiro", "a definir", "Alto", None, ""),
    ("Pendência", "Escopo mínimo do atendente", "Escopo segue em aberto e a capacidade da equipe não foi estimada.", "Fechar o mínimo e priorizar a capacidade.", "07", "Diego Martins", D(2026, 10, 19), "", None, ""),
]

fonte = Font(name="Arial", size=10)
negrito = Font(name="Arial", size=10, bold=True, color="FFFFFF")


def aba(wb, titulo, tabela, cab, linhas, larguras, datas=()):
    ws = wb.create_sheet(titulo)
    ws.append(cab)
    for l in linhas:
        ws.append(list(l))
    for row in ws.iter_rows():
        for c in row:
            c.font = fonte
            c.alignment = Alignment(vertical="top", wrap_text=isinstance(c.value, str) and len(c.value) > 40)
    for c in ws[1]:
        c.font = negrito
    for col in datas:
        for r in range(2, ws.max_row + 1):
            ws[f"{col}{r}"].number_format = "DD/MM/YYYY"
    for i, w in enumerate(larguras):
        ws.column_dimensions[get_column_letter(i + 1)].width = w
    ultima = get_column_letter(len(cab))
    t = Table(displayName=tabela, ref=f"A1:{ultima}{ws.max_row}")
    t.tableStyleInfo = TableStyleInfo(name="TableStyleMedium2", showRowStripes=True)
    ws.add_table(t)
    ws.freeze_panes = "B2"
    return ws


wb = Workbook()
wb.remove(wb.active)

ws = aba(wb, "Painel", "tbPainel", PAINEL_CAB, PAINEL, [48, 18, 13, 22, 21, 21, 19, 56], datas="C")
for col in "DEFG":
    ws[f"{col}2"].number_format = "@"  # texto: impede o Excel de transformar 2/8 em data
dv = DataValidation(type="list", formula1='"Não confirmável,Com condições,Confirmado"', allow_blank=True)
dv.add("B2:B2")
ws.add_data_validation(dv)

ws = aba(wb, "Frentes", "tbFrentes", FRENTES_CAB, FRENTES,
         [6, 32, 18, 18, 10, 12, 12, 11, 11, 11, 11, 11, 11, 11, 11, 10, 50, 16, 18, 14, 50, 14, 16, 40, 40, 40, 40], datas="FG")
pront = DataValidation(type="list", formula1='"OK,Parcial,Bloqueio,Sem informação,NA"', allow_blank=True)
pront.add("H2:O200")
ws.add_data_validation(pront)
risco = DataValidation(type="list", formula1='"Alto,Médio,Baixo"', allow_blank=True)
risco.add("P2:P200")
ws.add_data_validation(risco)
sn = DataValidation(type="list", formula1='"Sim,Não"', allow_blank=True)
sn.add("E2:E200")
ws.add_data_validation(sn)

ws = aba(wb, "Iniciativas", "tbIniciativas", INI_CAB, INICIATIVAS, [16, 34, 32, 12, 12, 16, 14, 11, 24, 10], datas="DE")
for r in range(2, ws.max_row + 1):
    for col in "AFG":
        ws[f"{col}{r}"].number_format = "@"  # texto: preserva "01; 50; 90"
sn2 = DataValidation(type="list", formula1='"Sim,Não"', allow_blank=True)
sn2.add("H2:H1000")
ws.add_data_validation(sn2)

ws = aba(wb, "Pontos", "tbPontos", PONTOS_CAB, PONTOS, [12, 38, 60, 50, 16, 18, 12, 12, 12, 24], datas="GI")
tp = DataValidation(type="list", formula1='"Evolução,Pendência,Atenção,Risco"', allow_blank=True)
tp.add("A2:A500")
ws.add_data_validation(tp)
cr = DataValidation(type="list", formula1='"Crítico,Alto,Médio,Baixo"', allow_blank=True)
cr.add("H2:H500")
ws.add_data_validation(cr)
for r in range(2, ws.max_row + 1):
    ws[f"E{r}"].number_format = "@"

ins = wb.create_sheet("Instruções")
textos = [
    ("Roadmap executivo — como preencher", True),
    ("", False),
    ("tbPainel (aba Painel) — 1 linha, preenchida pelo PMO", True),
    ("Pergunta: aparece no topo. Veredito: Não confirmável, Com condições ou Confirmado (o painel não calcula; é decisão do PMO).", False),
    ("PrazoFinal: semana destacada em vermelho no roadmap. A data da leitura é a da atualização feita pelo fluxo.", False),
    ("FrentesSemCronograma, DependenciasEmRisco, FrentesComPendencia, BloqueiosProntidao: deixe vazio para o painel calcular, ou digite o número que deve aparecer (ex.: 2/8 ou 11). As células estão em formato Texto para o Excel não transformar 2/8 em data.", False),
    ("", False),
    ("tbFrentes (aba Frentes) — 1 linha por frente", True),
    ("ID: número da frente (01, 02…). Frente: nome igual ao usado na coluna Frente da tbIniciativas.", False),
    ("Camada: Fundação, Motor & Sistemas, Experiência ou Operação (define a cor do número e as colunas do mapa).", False),
    ("CaminhoCritico: Sim/Não. DataAlvo: data-alvo da frente (▼). DataReporte: data do último reporte (✓ se até 7 dias antes da atualização).", False),
    ("Escopo, Prazo, Entregaveis e Rec_*: OK, Parcial, Bloqueio, Sem informação ou NA (não se aplica, aparece como um traço). Qualquer coluna que comece com Rec_ vira uma área viabilizadora em Recursos.", False),
    ("RiscoNivel: Alto, Médio ou Baixo. RiscoDescricao: aparece no detalhe da frente.", False),
    ("RecebeDe / EntregaPara: IDs de frentes separados por ponto e vírgula. Basta preencher um dos lados.", False),
    ("A dependência declarada é comprovada quando alguma macroatividade de uma frente é predecessora de uma macroatividade da outra (tbIniciativas). Sem essa ligação, ela aparece como hipótese a validar.", False),
    ("", False),
    ("tbIniciativas (aba Iniciativas) — mesma tabela do dashboard de iniciativas", True),
    ("ID: um ou mais números separados por ponto e vírgula (ex.: 01; 50; 90) — uma macroatividade pode reunir várias atividades. Predecessoras/Sucessoras citam esses números.", False),
    ("Cada linha vira um losango na raia da frente, na DataFim. O retângulo da frente vai da menor DataInicio à maior DataFim.", False),
    ("Frente sem nenhuma iniciativa aparece como 'Sem cronograma · data-alvo'.", False),
    ("", False),
    ("tbPontos (aba Pontos) — preenchida à mão", True),
    ("Tipo: Evolução (bloco Evoluções); Risco, Atenção e Pendência viram roadblocks (com etiqueta do tipo). Pendência e Atenção também aparecem no detalhe da frente. Na tabela de roadblocks entram os de Criticidade Crítico ou Alto; os demais vão para o rodapé.", False),
    ("Titulo e Descricao: o que aconteceu / qual é o risco. Acao: plano de ação ou decisão necessária. Frente: IDs separados por ; ou 'Todas'.", False),
    ("Responsavel e Prazo (data ou texto como 'a definir'). Criticidade: Crítico, Alto, Médio ou Baixo (agrupa os cartões). Data: data da evolução. Fonte: opcional.", False),
    ("", False),
    ("Campos opcionais do detalhe: na tbFrentes, NomeCurto, Descricao, Area, Sponsor e os comentários de prontidão; na tbIniciativas, Responsavel e Avanco (%). Vazio = a tela só não mostra.", False),
    ("Status da macroatividade pelo Avanco (%): 100% = Concluído; abaixo de 100% com DataFim vencida = Atrasado; 1% a 99% = Em andamento; 0% = Não iniciado. Com Avanco vazio, vale a coluna Concluida e as datas.", False),
    ("", False),
    ("Calculado pelo painel (não preencher): frentes sem cronograma, dependências em risco, frentes com pendência, bloqueios de prontidão, status dos marcos e carga de marcos por semana.", True),
    ("Dependência em risco: se comprovada, quando alguma predecessora está atrasada ou a sucessora começa antes de ela terminar; se hipótese, quando a frente que entrega está sem cronograma, tem Bloqueio, risco Alto ou marco atrasado.", False),
    ("", False),
    ("Não renomeie as tabelas nem as colunas: o fluxo do Power Automate depende delas. Dados desta planilha são fictícios.", True),
]
for i, (t, b) in enumerate(textos, start=1):
    c = ins.cell(row=i, column=1, value=t)
    c.font = Font(name="Arial", size=10, bold=b)
    c.alignment = Alignment(wrap_text=True, vertical="top")
ins.column_dimensions["A"].width = 120

wb.save(AQUI / "roadmap_executivo_exemplo.xlsx")


def para_json(cab, linhas):
    out = []
    for l in linhas:
        out.append({k: (v.isoformat() if isinstance(v, date) else v) for k, v in zip(cab, l)})
    return out


exemplo = {
    "painel": para_json(PAINEL_CAB, PAINEL),
    "frentes": para_json(FRENTES_CAB, FRENTES),
    "iniciativas": para_json(INI_CAB, INICIATIVAS),
    "pontos": para_json(PONTOS_CAB, PONTOS),
}
(AQUI / "src" / "exemplo.json").write_text(json.dumps(exemplo, ensure_ascii=False, indent=1), encoding="utf-8")
print("ok", len(FRENTES), "frentes,", len(INICIATIVAS), "iniciativas")
