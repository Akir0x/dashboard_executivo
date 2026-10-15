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
        ws.column_dimensions[chr(65 + i)].width = w
    ultima = chr(64 + len(cab))
    t = Table(displayName=tabela, ref=f"A1:{ultima}{ws.max_row}")
    t.tableStyleInfo = TableStyleInfo(name="TableStyleMedium2", showRowStripes=True)
    ws.add_table(t)
    ws.freeze_panes = "B2"
    return ws


wb = Workbook()
wb.remove(wb.active)

ws = aba(wb, "Painel", "tbPainel", PAINEL_CAB, PAINEL, [48, 18, 13, 22, 21, 21, 19], datas="C")
for col in "DEFG":
    ws[f"{col}2"].number_format = "@"  # texto: impede o Excel de transformar 2/8 em data
dv = DataValidation(type="list", formula1='"Não confirmável,Com condições,Confirmado"', allow_blank=True)
dv.add("B2:B2")
ws.add_data_validation(dv)

ws = aba(wb, "Frentes", "tbFrentes", FRENTES_CAB, FRENTES,
         [6, 32, 18, 18, 10, 12, 12, 11, 11, 11, 11, 11, 11, 11, 11, 10, 50, 16, 18], datas="FG")
pront = DataValidation(type="list", formula1='"OK,Parcial,Bloqueio,Sem informação,NA"', allow_blank=True)
pront.add("H2:O200")
ws.add_data_validation(pront)
risco = DataValidation(type="list", formula1='"Alto,Médio,Baixo"', allow_blank=True)
risco.add("P2:P200")
ws.add_data_validation(risco)
sn = DataValidation(type="list", formula1='"Sim,Não"', allow_blank=True)
sn.add("E2:E200")
ws.add_data_validation(sn)

ws = aba(wb, "Iniciativas", "tbIniciativas", INI_CAB, INICIATIVAS, [8, 34, 32, 12, 12, 16, 14, 11], datas="DE")
sn2 = DataValidation(type="list", formula1='"Sim,Não"', allow_blank=True)
sn2.add("H2:H1000")
ws.add_data_validation(sn2)

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
    ("Cada linha vira um losango na raia da frente, na DataFim. O retângulo da frente vai da menor DataInicio à maior DataFim.", False),
    ("Frente sem nenhuma iniciativa aparece como 'Sem cronograma · data-alvo'.", False),
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
}
(AQUI / "src" / "exemplo.json").write_text(json.dumps(exemplo, ensure_ascii=False, indent=1), encoding="utf-8")
print("ok", len(FRENTES), "frentes,", len(INICIATIVAS), "iniciativas")
