// Regras de negócio do dashboard: leitura das linhas da planilha, dependências e status.

export type StatusKey = "atr" | "prox" | "ok" | "conc"

export interface Iniciativa {
  id: string // chave interna da linha (os IDs da célula juntos)
  ids: string[] // IDs das atividades que formam a macroatividade (ex.: 01; 50; 90)
  resp: string
  avanco: number | null // % de avanço (0–100), opcional
  macro: string
  frente: string
  ini: Date | null
  fim: Date | null
  concl: boolean
  preds: string[]
  sucs: string[]
  faltando: string[]
  st: StatusKey
  dias?: number
  predsAtr: string[]
  sucsAtr: string[]
  conflitos: string[]
}

export const DIAS_ENTREGA_PROXIMA = 15
const DIA = 864e5

export const STATUS: Record<
  StatusKey,
  { nome: string; chart: "red" | "amber" | "blue" | "emerald"; bg: string; barText: string; badge: "error" | "warning" | "default" | "success"; dot: string }
> = {
  atr: { nome: "Atrasada", chart: "red", bg: "bg-red-500", barText: "text-white", badge: "error", dot: "bg-red-500" },
  prox: { nome: "Entrega próxima", chart: "amber", bg: "bg-amber-500", barText: "text-white", badge: "warning", dot: "bg-amber-500" },
  ok: { nome: "No prazo", chart: "blue", bg: "bg-blue-500", barText: "text-white", badge: "default", dot: "bg-blue-500" },
  conc: { nome: "Concluída", chart: "emerald", bg: "bg-emerald-500", barText: "text-white", badge: "success", dot: "bg-emerald-500" },
}
export const ORDEM: StatusKey[] = ["atr", "prox", "ok", "conc"]

export const hoje = (() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
})()

export const addDias = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const diasEntre = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DIA)
const pad = (n: number) => String(n).padStart(2, "0")
export const fmt = (d: Date | null) => (d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : "—")
export const pct = (n: number, t: number) => (t ? Math.round((n * 100) / t) : 0)

const norm = (k: unknown) =>
  String(k).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "")

export function parseData(v: unknown): Date | null {
  if (v === null || v === undefined || v === "") return null
  if (v instanceof Date) return new Date(v.getFullYear(), v.getMonth(), v.getDate())
  if (typeof v === "number" || /^\d+(\.\d+)?$/.test(String(v).trim())) {
    // número serial do Excel (o conector do Power Automate costuma devolver assim)
    const u = new Date(Math.round((Number(v) - 25569) * DIA))
    return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate())
  }
  const s = String(v).trim()
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/) // ISO 8601
  if (m) return new Date(+m[1], +m[2] - 1, +m[3])
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/) // DD/MM/AAAA
  if (m) return new Date(+m[3], +m[2] - 1, +m[1])
  return null
}

// "30%", "30" ou 0,3 viram 30.
function parseAvanco(v: unknown): number | null {
  const s = String(v ?? "").trim().replace(",", ".").replace("%", "")
  if (!s || isNaN(Number(s))) return null
  const n = Number(s)
  return Math.round(n <= 1 && !String(v).includes("%") && s.includes(".") ? n * 100 : n)
}

const listaIds = (v: unknown) =>
  String(v ?? "")
    .split(/[;,|\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
const simNao = (v: unknown) => ["sim", "s", "yes", "y", "true", "1", "x", "concluida", "concluido", "ok"].includes(norm(v))

// Aceita variações no nome das colunas (acentos, espaços, maiúsculas).
const CAMPOS: Record<string, string[]> = {
  id: ["id", "codigo"],
  macro: ["macroatividade", "macroatividades", "atividade", "iniciativa", "nome"],
  frente: ["frente", "frentes"],
  ini: ["datainicio", "datadeinicio", "inicio"],
  fim: ["datafim", "datadefim", "fim", "datatermino", "datadetermino", "termino"],
  pred: ["predecessoras", "predecessora", "iniciativapredecessora", "iniciativaspredecessoras"],
  suc: ["sucessoras", "sucessora", "iniciativasucessora", "iniciativassucessoras"],
  concl: ["concluida", "concluido", "status"],
  resp: ["responsavel", "responsaveis", "dono"],
  avanco: ["avanco", "percentual", "percentualavanco", "avancopercentual"],
}
function campo(row: Record<string, unknown>, nome: string): unknown {
  for (const k of Object.keys(row)) if (CAMPOS[nome].includes(norm(k))) return row[k]
  return ""
}

export function normalizar(linhas: Record<string, unknown>[]): Iniciativa[] {
  const base: (Iniciativa & { predRaw: string[]; sucRaw: string[] })[] = []
  const usados = new Set<string>()
  for (const r of linhas || []) {
    // A célula de ID pode ter vários números: "01; 50; 90" (uma macroatividade com várias atividades).
    const ids = listaIds(campo(r, "id"))
    const macro = String(campo(r, "macro") ?? "").trim()
    if (!ids.length && !macro) continue
    let id = ids.join("; ") || macro
    for (let n = 2; usados.has(id); n++) id = `${ids.join("; ") || macro} #${n}`
    usados.add(id)
    base.push({
      id,
      ids,
      macro: macro || ids.join("; "),
      resp: String(campo(r, "resp") ?? "").trim(),
      avanco: parseAvanco(campo(r, "avanco")),
      frente: String(campo(r, "frente") ?? "").trim() || "Sem frente",
      ini: parseData(campo(r, "ini")),
      fim: parseData(campo(r, "fim")),
      concl: simNao(campo(r, "concl")),
      predRaw: listaIds(campo(r, "pred")),
      sucRaw: listaIds(campo(r, "suc")),
      preds: [],
      sucs: [],
      faltando: [],
      st: "ok",
      predsAtr: [],
      sucsAtr: [],
      conflitos: [],
    })
  }
  const porId = new Map(base.map((i) => [i.id, i]))
  // Cada ID de atividade aponta para a linha (macroatividade) que o contém. "01" e "1" são o mesmo ID.
  const chaveId = (v: string) => (/^\d+$/.test(v) ? String(Number(v)) : v.toLowerCase())
  const dono = new Map<string, string>()
  for (const i of base) for (const x of i.ids) if (!dono.has(chaveId(x))) dono.set(chaveId(x), i.id)
  const linhaDe = (ref: string) => dono.get(chaveId(ref)) ?? (porId.has(ref) ? ref : undefined)
  const P = new Map(base.map((i) => [i.id, new Set<string>()]))
  const S = new Map(base.map((i) => [i.id, new Set<string>()]))
  const ligar = (p: string, s: string) => {
    if (p !== s && porId.has(p) && porId.has(s)) {
      P.get(s)!.add(p)
      S.get(p)!.add(s)
    }
  }
  for (const i of base) {
    for (const ref of i.predRaw) {
      const p = linhaDe(ref)
      if (p) ligar(p, i.id)
      else i.faltando.push(ref)
    }
    for (const ref of i.sucRaw) {
      const x = linhaDe(ref)
      if (x) ligar(i.id, x)
      else i.faltando.push(ref)
    }
  }
  for (const i of base) {
    i.preds = [...P.get(i.id)!]
    i.sucs = [...S.get(i.id)!]
    if (i.concl) i.st = "conc"
    else if (!i.fim) i.st = "ok"
    else {
      const d = diasEntre(hoje, i.fim)
      i.dias = d
      i.st = d < 0 ? "atr" : d <= DIAS_ENTREGA_PROXIMA ? "prox" : "ok"
    }
  }
  for (const i of base) {
    i.predsAtr = i.concl ? [] : i.preds.filter((p) => porId.get(p)!.st === "atr")
    i.sucsAtr = i.concl ? [] : i.sucs.filter((x) => porId.get(x)!.st === "atr")
    i.conflitos = i.preds.filter((p) => {
      const a = porId.get(p)!
      return !!(a.fim && i.ini && a.fim >= i.ini)
    })
  }
  return base.map(({ predRaw: _a, sucRaw: _b, ...i }) => i)
}

export function prazoTxt(i: Iniciativa) {
  if (i.st === "conc" || i.dias === undefined) return ""
  if (i.dias < 0) return `${-i.dias} dia${i.dias === -1 ? "" : "s"} de atraso`
  if (i.dias === 0) return "vence hoje"
  if (i.dias === 1) return "amanhã"
  return `em ${i.dias} dias`
}

export const contar = (itens: Iniciativa[]) => {
  const c: Record<StatusKey, number> = { atr: 0, prox: 0, ok: 0, conc: 0 }
  itens.forEach((i) => c[i.st]++)
  return c
}
export const frentesDe = (itens: Iniciativa[]) =>
  [...new Set(itens.map((i) => i.frente))].sort((a, b) => a.localeCompare(b, "pt-BR"))
export const porFim = (a: Iniciativa, b: Iniciativa) => (a.fim?.getTime() ?? 0) - (b.fim?.getTime() ?? 0)

// Cores por frente (paleta do Tremor). A ordem segue a lista de frentes em ordem alfabética.
// "conc" é o tom mais escuro, usado para iniciativas concluídas.
export const PALETA_FRENTES = [
  // Planejada para até 10 frentes, sem tons próximos do vermelho (rosa, fúcsia, laranja),
  // para os ícones vermelhos de atraso terem contraste. Depois da 10ª, as cores se repetem.
  { bg: "bg-blue-600", conc: "bg-blue-900", dot: "bg-blue-600" },
  { bg: "bg-emerald-600", conc: "bg-emerald-900", dot: "bg-emerald-600" },
  { bg: "bg-violet-600", conc: "bg-violet-900", dot: "bg-violet-600" },
  { bg: "bg-cyan-600", conc: "bg-cyan-900", dot: "bg-cyan-600" },
  { bg: "bg-lime-700", conc: "bg-lime-950", dot: "bg-lime-700" },
  { bg: "bg-indigo-400", conc: "bg-indigo-800", dot: "bg-indigo-400" },
  { bg: "bg-teal-800", conc: "bg-teal-950", dot: "bg-teal-800" },
  { bg: "bg-slate-500", conc: "bg-slate-800", dot: "bg-slate-500" },
  { bg: "bg-yellow-700", conc: "bg-yellow-950", dot: "bg-yellow-700" },
  { bg: "bg-sky-500", conc: "bg-sky-800", dot: "bg-sky-500" },
] as const
export type CorFrente = (typeof PALETA_FRENTES)[number]

export function coresFrentes(itens: Iniciativa[]): Map<string, CorFrente> {
  return new Map(frentesDe(itens).map((f, k) => [f, PALETA_FRENTES[k % PALETA_FRENTES.length]]))
}
