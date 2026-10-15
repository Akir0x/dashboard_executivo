// Regras do roadmap executivo: leitura de tbPainel, tbFrentes e tbIniciativas e os indicadores derivados.
import { addDias, hoje, Iniciativa, normalizar as normalizarIniciativas, parseData } from "./data"

export type Pront = "ok" | "parcial" | "bloqueio" | "sem" | "na"
export type Risco = "alto" | "medio" | "baixo" | ""
export type Veredito = "nao" | "cond" | "ok" | ""
export type MarcoSt = "conc" | "andamento" | "nao" | "atr"

export const PRONT_NOME: Record<Pront, string> = { ok: "OK", parcial: "Parcial", bloqueio: "Bloqueio", sem: "Sem informação", na: "Não se aplica" }
export const RISCO_NOME: Record<Exclude<Risco, "">, string> = { alto: "Alto", medio: "Médio", baixo: "Baixo" }
export const MARCO_NOME: Record<MarcoSt, string> = { conc: "Concluído", andamento: "Em andamento", nao: "Não iniciado", atr: "Atrasado" }
export const VEREDITOS: { k: Exclude<Veredito, "">; nome: string }[] = [
  { k: "nao", nome: "Não confirmável" },
  { k: "cond", nome: "Com condições" },
  { k: "ok", nome: "Confirmado" },
]
export const CAMADAS_ORDEM = ["Fundação", "Motor & Sistemas", "Experiência", "Operação"]
export const DIAS_REPORTE = 7

export interface Area {
  nome: string
  st: Pront
}

export interface Frente {
  id: string
  nome: string
  lider: string
  camada: string
  cp: boolean
  alvo: Date | null
  reporte: Date | null
  atualizado: boolean
  escopo: Pront
  prazo: Pront
  entreg: Pront
  areas: Area[]
  recursos: Pront
  risco: Risco
  riscoDesc: string
  recebe: string[]
  entrega: string[]
  iniciativas: Iniciativa[]
  ini: Date | null
  fim: Date | null
  semCrono: boolean
  marcosAtr: number
  bloqueios: number
  pendente: boolean
  emRisco: boolean
  motivosRisco: string[]
}

export interface Painel {
  titulo: string
  pergunta: string
  veredito: Veredito
  leitura: Date
  prazo: Date | null
  obs: string
  // Indicadores digitados na tbPainel (vazio = o painel calcula)
  manual: { semCrono: Manual; depsRisco: Manual; pendencia: Manual; bloqueios: Manual }
}

export type Manual = { n: number; de: number | null } | null

// Aceita "2/8", "2 de 8" ou só "2".
export function parseManual(v: unknown): Manual {
  const s = String(v ?? "").trim()
  if (!s) return null
  const m = s.match(/^(\d+)\s*(?:\/|de)\s*(\d+)$/i)
  if (m) return { n: +m[1], de: +m[2] }
  return /^\d+$/.test(s) ? { n: +s, de: null } : null
}

// Ligação entre duas macroatividades de frentes diferentes (Predecessoras/Sucessoras da tbIniciativas).
export interface LigacaoMacro {
  pre: Iniciativa
  suc: Iniciativa
  atrasada: boolean // a predecessora está atrasada
  conflito: boolean // a sucessora começa antes de a predecessora terminar
}

export interface Dependencia {
  de: string // frente que entrega
  para: string // frente que recebe
  declarada: boolean // está na tbFrentes (RecebeDe/EntregaPara)
  comprovada: boolean // existe ao menos uma ligação entre macroatividades das duas frentes
  macros: LigacaoMacro[]
  risco: boolean
  motivo: string
}

export interface Programa {
  painel: Painel
  frentes: Frente[]
  iniciativas: Iniciativa[]
  deps: Dependencia[]
  porId: Map<string, Frente>
}

const norm = (k: unknown) =>
  String(k ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "")

function campo(row: Record<string, unknown>, ...nomes: string[]): unknown {
  for (const k of Object.keys(row)) if (nomes.includes(norm(k))) return row[k]
  return ""
}
const txt = (v: unknown) => String(v ?? "").trim()

// IDs de frente: "1", 1 e "01" viram "01".
const idFrente = (v: unknown) => {
  const s = txt(v)
  return /^\d+$/.test(s) ? s.padStart(2, "0") : s
}
const listaIds = (v: unknown) =>
  txt(v)
    .split(/[;,|\n]+/)
    .map(idFrente)
    .filter(Boolean)

export function parsePront(v: unknown): Pront {
  const n = norm(v)
  if (!n) return "sem"
  if (["na", "naoseaplica", "naoaplicavel"].includes(n)) return "na"
  if (["ok", "sim", "s", "definido", "definida", "concluido", "concluida", "mapeado", "mapeados", "comprometido", "comprometida"].includes(n)) return "ok"
  if (n.startsWith("parc")) return "parcial"
  if (n.startsWith("bloq") || n === "nao" || n === "n") return "bloqueio"
  return "sem"
}
// Para resumir várias áreas num status só: o pior vence.
const PESO: Record<Pront, number> = { bloqueio: 3, sem: 2, parcial: 1, ok: 0, na: -1 }
// NA não conta: se tudo for NA, o resumo também é NA.
export const pior = (l: Pront[]): Pront => (l.length ? l.reduce<Pront>((a, b) => (PESO[b] > PESO[a] ? b : a), "na") : "sem")

function parseRisco(v: unknown): Risco {
  const n = norm(v)
  if (n.startsWith("alt")) return "alto"
  if (n.startsWith("med")) return "medio"
  if (n.startsWith("baix")) return "baixo"
  return ""
}
function parseVeredito(v: unknown): Veredito {
  const n = norm(v)
  if (!n) return ""
  if (n.startsWith("nao") || n.includes("naoconf")) return "nao"
  if (n.includes("cond")) return "cond"
  if (n.includes("confirm")) return "ok"
  return ""
}

export const marcoSt = (i: Iniciativa): MarcoSt => {
  if (i.concl) return "conc"
  if (i.fim && i.fim < hoje) return "atr"
  if (i.ini && i.ini <= hoje) return "andamento"
  return "nao"
}

export function montar(
  painelRows: Record<string, unknown>[],
  frentesRows: Record<string, unknown>[],
  iniRows: Record<string, unknown>[],
  leituraFluxo?: Date | null,
): Programa {
  const p = painelRows[0] ?? {}
  const painel: Painel = {
    titulo: txt(campo(p, "titulo")),
    pergunta: txt(campo(p, "pergunta")),
    veredito: parseVeredito(campo(p, "veredito")),
    // Data da leitura: a da atualização feita pelo fluxo; sem fluxo, a coluna DataLeitura (se houver) ou hoje.
    leitura: leituraFluxo ?? parseData(campo(p, "dataleitura", "leitura")) ?? hoje,
    prazo: parseData(campo(p, "prazofinal", "prazo")),
    obs: txt(campo(p, "observacaopmo", "observacao", "obs")),
    manual: {
      semCrono: parseManual(campo(p, "frentessemcronograma")),
      depsRisco: parseManual(campo(p, "dependenciasemrisco")),
      pendencia: parseManual(campo(p, "frentescompendencia", "frentescompendenciadeprontidao")),
      bloqueios: parseManual(campo(p, "bloqueiosdeprontidao", "bloqueiosprontidao")),
    },
  }

  const iniciativas = normalizarIniciativas(iniRows)
  const frentes: Frente[] = []
  for (const r of frentesRows) {
    const nome = txt(campo(r, "frente", "nome"))
    const id = idFrente(campo(r, "id", "numero"))
    if (!nome && !id) continue
    const areas: Area[] = Object.keys(r)
      .filter((k) => /^rec[_ ]/i.test(k.trim()))
      .map((k) => ({ nome: k.trim().replace(/^rec[_ ]/i, "").replace(/^Preco$/i, "Preço"), st: parsePront(r[k]) }))
    const minhas = iniciativas.filter((i) => norm(i.frente) === norm(nome) || idFrente(i.frente) === id)
    const comData = minhas.filter((i) => i.ini && i.fim)
    const reporte = parseData(campo(r, "datareporte", "reporte"))
    const escopo = parsePront(campo(r, "escopo"))
    const prazo = parsePront(campo(r, "prazo"))
    const entreg = parsePront(campo(r, "entregaveis", "entregavel"))
    const todasPront = [escopo, prazo, entreg, ...areas.map((a) => a.st)]
    frentes.push({
      id: id || nome,
      nome: nome || id,
      lider: txt(campo(r, "lider", "lideranca", "responsavel")),
      camada: txt(campo(r, "camada")) || "Sem camada",
      cp: ["sim", "s", "x", "1", "true"].includes(norm(campo(r, "caminhocritico", "cp"))),
      alvo: parseData(campo(r, "dataalvo", "alvo")),
      reporte,
      atualizado: !!reporte && reporte >= addDias(painel.leitura, -DIAS_REPORTE),
      escopo,
      prazo,
      entreg,
      areas,
      recursos: areas.length ? pior(areas.map((a) => a.st)) : "sem",
      risco: parseRisco(campo(r, "risconivel", "risco")),
      riscoDesc: txt(campo(r, "riscodescricao", "descricaorisco")),
      recebe: listaIds(campo(r, "recebede", "recebe")),
      entrega: listaIds(campo(r, "entregapara", "entrega")),
      iniciativas: minhas,
      ini: comData.length ? new Date(Math.min(...comData.map((i) => i.ini!.getTime()))) : null,
      fim: comData.length ? new Date(Math.max(...comData.map((i) => i.fim!.getTime()))) : null,
      semCrono: comData.length === 0,
      marcosAtr: minhas.filter((i) => marcoSt(i) === "atr").length,
      bloqueios: todasPront.filter((s) => s === "bloqueio").length,
      pendente: todasPront.some((s) => s !== "ok" && s !== "na"),
      emRisco: false,
      motivosRisco: [],
    })
  }

  for (const f of frentes) {
    const m: string[] = []
    if (f.semCrono) m.push("sem cronograma")
    if (f.bloqueios) m.push(`${f.bloqueios} bloqueio${f.bloqueios > 1 ? "s" : ""} de prontidão`)
    if (f.risco === "alto") m.push("risco alto")
    if (f.marcosAtr) m.push(`${f.marcosAtr} marco${f.marcosAtr > 1 ? "s" : ""} atrasado${f.marcosAtr > 1 ? "s" : ""}`)
    f.motivosRisco = m
    f.emRisco = m.length > 0
  }

  const porId = new Map(frentes.map((f) => [f.id, f]))
  // Dependências entre frentes: as declaradas na tbFrentes + as que aparecem nas macroatividades.
  const mapa = new Map<string, Dependencia>()
  const obter = (de: string, para: string) => {
    const k = de + ">" + para
    if (!mapa.has(k)) mapa.set(k, { de, para, declarada: false, comprovada: false, macros: [], risco: false, motivo: "" })
    return mapa.get(k)!
  }
  const valida = (de: string, para: string) => de !== para && porId.has(de) && porId.has(para)
  for (const f of frentes) {
    f.entrega.forEach((x) => valida(f.id, x) && (obter(f.id, x).declarada = true))
    f.recebe.forEach((x) => valida(x, f.id) && (obter(x, f.id).declarada = true))
  }
  const frenteDaIni = new Map<string, string>()
  frentes.forEach((f) => f.iniciativas.forEach((i) => frenteDaIni.set(i.id, f.id)))
  const iniPorId = new Map(iniciativas.map((i) => [i.id, i]))
  for (const suc of iniciativas) {
    for (const pid of suc.preds) {
      const pre = iniPorId.get(pid)
      const fa = frenteDaIni.get(pid)
      const fb = frenteDaIni.get(suc.id)
      if (!pre || !fa || !fb || !valida(fa, fb)) continue
      obter(fa, fb).macros.push({
        pre,
        suc,
        atrasada: marcoSt(pre) === "atr",
        conflito: !!(pre.fim && suc.ini && pre.fim >= suc.ini && !pre.concl),
      })
    }
  }
  const deps = [...mapa.values()]
  for (const d of deps) {
    d.comprovada = d.macros.length > 0
    if (d.comprovada) {
      // Comprovada: o risco vem das macroatividades.
      const atr = d.macros.filter((m) => m.atrasada).length
      const conf = d.macros.filter((m) => m.conflito).length
      d.risco = atr + conf > 0
      d.motivo = [atr && `${atr} predecessora${atr > 1 ? "s" : ""} atrasada${atr > 1 ? "s" : ""}`, conf && `${conf} conflito${conf > 1 ? "s" : ""} de datas`]
        .filter(Boolean)
        .join(", ")
    } else {
      // Só declarada (hipótese): vale a situação da frente que entrega.
      const f = porId.get(d.de)!
      d.risco = f.emRisco
      d.motivo = f.emRisco ? `frente ${f.id}: ${f.motivosRisco.join(", ")}` : ""
    }
  }
  deps.sort((a, b) => a.de.localeCompare(b.de) || a.para.localeCompare(b.para))
  // Completa as listas dos dois lados para os chips da tabela.
  for (const f of frentes) {
    f.recebe = deps.filter((d) => d.para === f.id).map((d) => d.de)
    f.entrega = deps.filter((d) => d.de === f.id).map((d) => d.para)
  }

  return { painel, frentes, iniciativas, deps, porId }
}

export const depEntre = (prog: Programa, de: string, para: string) => prog.deps.find((d) => d.de === de && d.para === para)

export const conectadas = (prog: Programa, id: string) =>
  new Set([id, ...prog.deps.filter((d) => d.de === id || d.para === id).flatMap((d) => [d.de, d.para])])

export const ordenarCamadas = (frentes: Frente[]) => {
  const vistas = [...new Set(frentes.map((f) => f.camada))]
  return [...CAMADAS_ORDEM.filter((c) => vistas.includes(c)), ...vistas.filter((c) => !CAMADAS_ORDEM.includes(c))]
}

// ----- semanas -----
export const segunda = (d: Date) => addDias(d, -((d.getDay() + 6) % 7))
export const semanasEntre = (a: Date, b: Date) => Math.round((segunda(b).getTime() - segunda(a).getTime()) / (7 * 864e5))
