// Dois visuais para o mesmo painel. A escolha é feita na compilação (VITE_VISUAL=tremor | forum).
export type Visual = "tremor" | "forum"
export const VISUAL: Visual = import.meta.env.VITE_VISUAL === "forum" ? "forum" : "tremor"

export interface Tema {
  page: string
  wrap: string
  eyebrow: string
  h1: string
  headerRule: string
  card: string
  kpiNum: string
  kpiLabel: string
  leituraLabel: string
  veredito: Record<"nao" | "cond" | "ok", { on: string; off: string }>
  vereditoTexto: Record<"nao" | "cond" | "ok", string>
  tabOn: string
  tabOff: string
  btn: string
  btnOn: string
  btnPrimary: string
  monthHead: string
  monthHeadAlt: string
  weekHead: string
  weekNow: string
  weekPrazo: string
  colNow: string
  colPrazo: string
  groupHead: string
  subHead: string
  leftHead: string
  rowBorder: string
  rowAlt: string
  nome: string
  lider: string
  numBadge: string
  cpTag: string
  bar: string
  semCrono: string
  hojeLine: string
  rodape: string
  legenda: string
  cargaBar: string
  cargaPico: string
  chip: string
  chipRisco: string
  chipHip: string
  chipHipRisco: string
  painelTitulo: string
}

const tremor: Tema = {
  page: "min-h-screen bg-gray-50 font-sans text-gray-900",
  wrap: "mx-auto max-w-[1600px] px-6 py-4",
  eyebrow: "text-xs font-medium text-gray-500",
  h1: "text-xl font-semibold tracking-tight text-gray-900",
  headerRule: "",
  card: "rounded-lg border border-gray-200 bg-white shadow-xs",
  kpiNum: "text-2xl font-semibold tabular-nums text-gray-900",
  kpiLabel: "text-xs leading-4 text-gray-500",
  leituraLabel: "text-xs font-medium text-gray-500",
  veredito: {
    nao: { on: "bg-red-500 text-white ring-red-500", off: "bg-white text-gray-400 ring-gray-200" },
    cond: { on: "bg-amber-500 text-white ring-amber-500", off: "bg-white text-gray-400 ring-gray-200" },
    ok: { on: "bg-emerald-500 text-white ring-emerald-500", off: "bg-white text-gray-400 ring-gray-200" },
  },
  vereditoTexto: { nao: "text-red-600", cond: "text-amber-600", ok: "text-emerald-600" },
  tabOn: "border-b-2 border-blue-500 text-blue-600",
  tabOff: "border-b-2 border-transparent text-gray-500 hover:text-gray-700",
  btn: "rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 shadow-xs hover:bg-gray-50 disabled:opacity-40",
  btnOn: "rounded-md border border-blue-500 bg-blue-50 px-2.5 py-1.5 text-sm font-medium text-blue-700 shadow-xs",
  btnPrimary: "rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-white shadow-xs hover:bg-blue-600",
  monthHead: "bg-gray-100 text-xs font-semibold text-gray-700",
  monthHeadAlt: "bg-gray-50 text-xs font-semibold text-gray-700",
  weekHead: "text-[11px] text-gray-500",
  weekNow: "bg-blue-50 text-blue-700 font-semibold",
  weekPrazo: "bg-red-500 text-white font-semibold",
  colNow: "bg-blue-50/60",
  colPrazo: "bg-red-50/70",
  groupHead: "text-[11px] font-semibold uppercase tracking-wide text-gray-500",
  subHead: "text-[11px] font-medium text-gray-500",
  leftHead: "text-xs font-semibold text-gray-500",
  rowBorder: "border-b border-gray-200",
  rowAlt: "",
  nome: "text-[13px] font-semibold leading-4 text-gray-900",
  lider: "text-xs text-gray-500",
  numBadge: "rounded-md text-xs font-semibold text-white",
  cpTag: "rounded bg-red-50 px-1 text-[10px] font-semibold text-red-600 ring-1 ring-inset ring-red-600/20",
  bar: "rounded-full border border-gray-300 bg-gray-100",
  semCrono: "rounded-md border border-dashed border-red-300 text-red-600",
  hojeLine: "border-l-2 border-dashed border-red-500",
  rodape: "text-xs text-gray-500",
  legenda: "text-xs text-gray-500",
  cargaBar: "bg-gray-300",
  cargaPico: "bg-red-500",
  chip: "rounded bg-gray-100 px-1 text-[11px] font-medium text-gray-700 tabular-nums",
  chipRisco: "rounded bg-red-50 px-1 text-[11px] font-semibold text-red-600 ring-1 ring-inset ring-red-500 tabular-nums",
  chipHip: "rounded border border-dashed border-gray-400 px-[3px] text-[11px] font-medium text-gray-500 tabular-nums",
  chipHipRisco: "rounded border border-dashed border-red-500 px-[3px] text-[11px] font-semibold text-red-600 tabular-nums",
  painelTitulo: "text-sm font-semibold text-gray-900",
}

const forum: Tema = {
  page: "min-h-screen bg-[#f3f2ee] font-['Barlow',sans-serif] text-[#1d2530]",
  wrap: "mx-auto max-w-[1600px] px-6 py-4",
  eyebrow: "font-['Barlow_Condensed',sans-serif] text-sm font-bold uppercase tracking-[0.12em] text-[#b4232a]",
  h1: "font-['Barlow',sans-serif] text-2xl font-extrabold leading-tight text-[#1d2530]",
  headerRule: "border-b-[3px] border-[#b4232a] pb-2",
  card: "rounded-sm border border-[#d9d6cf] bg-white",
  kpiNum: "font-['Barlow_Condensed',sans-serif] text-3xl font-bold tabular-nums text-[#b4232a]",
  kpiLabel: "text-xs leading-4 text-[#4b5563]",
  leituraLabel: "font-['Barlow_Condensed',sans-serif] text-xs font-bold uppercase tracking-wider text-[#6b7280]",
  veredito: {
    nao: { on: "bg-[#b4232a] text-white ring-[#b4232a]", off: "bg-[#eceae4] text-[#9ca3af] ring-transparent" },
    cond: { on: "bg-[#d99a1e] text-white ring-[#d99a1e]", off: "bg-[#eceae4] text-[#9ca3af] ring-transparent" },
    ok: { on: "bg-[#2f7d4f] text-white ring-[#2f7d4f]", off: "bg-[#eceae4] text-[#9ca3af] ring-transparent" },
  },
  vereditoTexto: { nao: "text-[#b4232a]", cond: "text-[#b7790f]", ok: "text-[#2f7d4f]" },
  tabOn: "bg-[#1d2530] text-white rounded-full",
  tabOff: "text-[#1d2530] hover:bg-[#e6e3dc] rounded-full",
  btn: "rounded-full border border-[#c9c5bc] bg-white px-3 py-1 text-sm font-semibold text-[#1d2530] hover:bg-[#ece9e2] disabled:opacity-40",
  btnOn: "rounded-full border border-[#1d2530] bg-[#1d2530] px-3 py-1 text-sm font-semibold text-white",
  btnPrimary: "rounded-md bg-[#b4232a] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#9b1d23]",
  monthHead: "bg-[#1d2530] font-['Barlow_Condensed',sans-serif] text-sm font-bold uppercase tracking-wider text-white",
  monthHeadAlt: "bg-[#2b3644] font-['Barlow_Condensed',sans-serif] text-sm font-bold uppercase tracking-wider text-white",
  weekHead: "bg-[#ebe9e3] text-[11px] font-semibold text-[#1d2530]",
  weekNow: "bg-[#ebe9e3] text-[#b4232a] font-bold",
  weekPrazo: "bg-[#b4232a] text-white font-bold",
  colNow: "bg-[#b4232a]/[0.04]",
  colPrazo: "bg-[#b4232a]/[0.07]",
  groupHead: "font-['Barlow_Condensed',sans-serif] text-xs font-bold uppercase tracking-wider text-[#6b7280]",
  subHead: "font-['Barlow_Condensed',sans-serif] text-[11px] font-bold uppercase tracking-wide text-[#4b5563]",
  leftHead: "font-['Barlow_Condensed',sans-serif] text-xs font-bold uppercase tracking-wider text-[#4b5563]",
  rowBorder: "border-b border-[#e2dfd8]",
  rowAlt: "",
  nome: "text-sm font-bold leading-4 text-[#1d2530]",
  lider: "text-xs text-[#6b7280]",
  numBadge: "rounded-md font-['Barlow_Condensed',sans-serif] text-sm font-bold text-white",
  cpTag: "rounded-sm bg-[#b4232a] px-1 text-[10px] font-bold text-white",
  bar: "rounded-sm border-[1.5px] border-[#4b5563] bg-[#e9eaec]",
  semCrono: "rounded-sm border border-dashed border-[#b4232a] text-[#b4232a]",
  hojeLine: "border-l-2 border-dashed border-[#b4232a]",
  rodape: "text-xs text-[#6b7280]",
  legenda: "text-xs text-[#4b5563]",
  cargaBar: "bg-[#8a919b]",
  cargaPico: "bg-[#b4232a]",
  chip: "rounded-sm bg-[#ebe9e3] px-1 text-[11px] font-bold text-[#1d2530] tabular-nums",
  chipRisco: "rounded-full bg-[#fbe9ea] px-1.5 text-[11px] font-bold text-[#b4232a] ring-1 ring-inset ring-[#b4232a] tabular-nums",
  chipHip: "rounded-sm border border-dashed border-[#8a919b] px-[3px] text-[11px] font-bold text-[#6b7280] tabular-nums",
  chipHipRisco: "rounded-full border border-dashed border-[#b4232a] px-[5px] text-[11px] font-bold text-[#b4232a] tabular-nums",
  painelTitulo: "font-['Barlow_Condensed',sans-serif] text-sm font-bold uppercase tracking-wider text-[#1d2530]",
}

export const T: Tema = VISUAL === "forum" ? forum : tremor

// Cor do número da frente por camada (iguais nos dois visuais).
const CORES_CAMADA = ["bg-blue-600", "bg-slate-700", "bg-violet-600", "bg-teal-600", "bg-amber-600", "bg-cyan-700"]
const CORES_CAMADA_FORUM = ["bg-[#2f5d9e]", "bg-[#1d2530]", "bg-[#6b4fa0]", "bg-[#2b7a78]", "bg-[#a86b12]", "bg-[#3d6b8a]"]
export const corCamada = (idx: number) => (VISUAL === "forum" ? CORES_CAMADA_FORUM : CORES_CAMADA)[idx % 6]
