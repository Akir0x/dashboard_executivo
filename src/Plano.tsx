import React from "react"
import { RiAddLine, RiAlertFill, RiCheckLine, RiSubtractLine } from "@remixicon/react"
import { Tooltip } from "./components/Tooltip"
import { cx } from "./utils/cx"
import { addDias, fmt, hoje, Iniciativa } from "./data"
import { ChipDep } from "./ChipDep"
import { conectadas, depEntre, Frente, MARCO_NOME, marcoSt, ordenarCamadas, Pront, PRONT_NOME, Programa, RISCO_NOME, segunda, semanasEntre } from "./exec"
import { COR_MARCO, Diamante, ProntIcon, RiscoBars } from "./icones"
import { corCamada, T } from "./tema"

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
const LEFT = 250
const ROW = 57
const H_MES = 22
const H_SEM = 32
const COL = 76
const AREA = 50
const RISCO = 60
const INTER = 168
const H_RODAPE = 50
const SEMANAS_JANELA = 18
const pad = (n: number) => String(n).padStart(2, "0")
const dm = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`

export interface Janela {
  inicio: Date
  fim: Date
  semanas: { ini: Date; sexta: Date; num: number }[]
  inicioPrograma: Date
}

export function calcJanela(prog: Programa, desloc: number): Janela {
  const inis = prog.iniciativas.filter((i) => i.ini).map((i) => i.ini!.getTime())
  const inicioPrograma = segunda(inis.length ? new Date(Math.min(...inis)) : hoje)
  const inicio = addDias(segunda(hoje), -14 + 7 * desloc)
  const semanas = Array.from({ length: SEMANAS_JANELA }, (_, k) => {
    const ini = addDias(inicio, 7 * k)
    return { ini, sexta: addDias(ini, 4), num: semanasEntre(inicioPrograma, ini) + 1 }
  })
  return { inicio, fim: addDias(inicio, 7 * SEMANAS_JANELA), semanas, inicioPrograma }
}

function useLargura(ref: React.RefObject<HTMLDivElement>) {
  const [w, setW] = React.useState(1400)
  React.useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver((e) => setW(e[0].contentRect.width))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [ref])
  return w
}

type ColPront = { k: string; nome: string; get: (f: Frente) => Pront; area?: boolean }

export function Plano({
  prog,
  janela,
  verDeps,
  onAbrir,
}: {
  prog: Programa
  janela: Janela
  verDeps: boolean
  onAbrir: (f: Frente) => void
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const largura = useLargura(ref)
  const [foco, setFoco] = React.useState<string | null>(null)
  const [expandido, setExpandido] = React.useState(false)

  const camadas = ordenarCamadas(prog.frentes)
  const frentes = prog.frentes
  const areas = [...new Set(frentes.flatMap((f) => f.areas.map((a) => a.nome)))]
  const cols: ColPront[] = [
    { k: "escopo", nome: "Escopo", get: (f) => f.escopo },
    { k: "prazo", nome: "Prazo", get: (f) => f.prazo },
    { k: "entreg", nome: "Entregáveis", get: (f) => f.entreg },
    { k: "recursos", nome: "Recursos", get: (f) => f.recursos },
    ...(expandido ? areas.map((a) => ({ k: "a-" + a, nome: a, area: true, get: (f: Frente) => f.areas.find((x) => x.nome === a)?.st ?? "sem" })) : []),
  ]
  const larguraPront = cols.reduce((s, c) => s + (c.area ? AREA : COL), 0)
  const RIGHT = larguraPront + RISCO + INTER
  const N = janela.semanas.length
  const TW = Math.max(N * 38, largura - LEFT - RIGHT)
  const W = LEFT + TW + RIGHT
  const SW = TW / N
  const total = janela.fim.getTime() - janela.inicio.getTime()
  const x = (d: Date) => ((d.getTime() - janela.inicio.getTime()) / total) * TW
  const dentro = (d: Date | null) => !!d && d >= janela.inicio && d < janela.fim

  const idxSemana = (d: Date | null) => (d ? janela.semanas.findIndex((s) => d >= s.ini && d < addDias(s.ini, 7)) : -1)
  // Tudo alinhado à grade de semanas: marco no centro da coluna; barras de coluna a coluna.
  const centro = (d: Date) => idxSemana(d) * SW + SW / 2
  const colIni = (d: Date) => (d < janela.inicio ? 0 : d >= janela.fim ? TW : idxSemana(d) * SW)
  const colFim = (d: Date) => (d < janela.inicio ? 0 : d >= janela.fim ? TW : (idxSemana(d) + 1) * SW)
  const semAtual = idxSemana(hoje)
  const xHoje = semAtual >= 0 ? (semAtual + 1) * SW : -1 // linha "Hoje" no fim da coluna da semana atual
  const semPrazo = idxSemana(prog.painel.prazo)

  const rel = foco ? conectadas(prog, foco) : null
  const linhaDe = new Map(frentes.map((f, k) => [f.id, k]))
  const frenteDaIni = new Map<string, string>()
  frentes.forEach((f) => f.iniciativas.forEach((i) => frenteDaIni.set(i.id, f.id)))
  const iniPorId = new Map(prog.iniciativas.map((i) => [i.id, i]))

  // Meses do cabeçalho: agrupa semanas pela sexta-feira.
  const meses: { nome: string; de: number; ate: number }[] = []
  janela.semanas.forEach((s, k) => {
    const nome = `${MESES[s.sexta.getMonth()]}${s.sexta.getFullYear() !== hoje.getFullYear() ? " " + s.sexta.getFullYear() : ""}`
    const ult = meses[meses.length - 1]
    if (ult && ult.nome === nome) ult.ate = k
    else meses.push({ nome, de: k, ate: k })
  })

  // Setas entre marcos de frentes diferentes (predecessora → sucessora).
  type Seta = { de: Iniciativa; para: Iniciativa; d: string; vermelha: boolean; fa: string; fb: string }
  const setas: Seta[] = []
  if (verDeps) {
    for (const suc of prog.iniciativas) {
      const fb = frenteDaIni.get(suc.id)
      if (!fb || !dentro(suc.fim)) continue
      for (const pid of suc.preds) {
        const pre = iniPorId.get(pid)
        const fa = frenteDaIni.get(pid)
        if (!pre || !fa || fa === fb || !dentro(pre.fim)) continue
        const x1 = centro(pre.fim!)
        const y1 = linhaDe.get(fa)! * ROW + ROW / 2
        const x2 = centro(suc.fim!)
        const y2 = linhaDe.get(fb)! * ROW + ROW / 2
        const dx = Math.max(30, Math.abs(x2 - x1) / 2)
        const vermelha = marcoSt(pre) === "atr" || !!(pre.fim && suc.ini && pre.fim >= suc.ini)
        setas.push({ de: pre, para: suc, fa, fb, vermelha, d: `M${x1 + 8},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2 - 9},${y2}` })
      }
    }
  }

  const carga = janela.semanas.map((s) => prog.iniciativas.filter((i) => i.fim && i.fim >= s.ini && i.fim < addDias(s.ini, 7)).length)
  const maxCarga = Math.max(0, ...carga)
  const pico = carga.indexOf(maxCarga)
  const H = frentes.length * ROW

  return (
    <div ref={ref} className="overflow-x-auto">
      <div style={{ width: W }} className="relative">
        {/* ---------- Cabeçalho ---------- */}
        <div className="flex">
          <div style={{ width: LEFT, height: H_MES + H_SEM }} className={cx("flex items-end px-3 pb-2", T.leftHead)}>
            Frente · liderança
          </div>
          <div style={{ width: TW }} className="relative">
            <div className="relative" style={{ height: H_MES }}>
              {meses.map((m, k) => (
                <div
                  key={m.nome + m.de}
                  className={cx("absolute top-0 flex h-full items-center justify-center overflow-hidden whitespace-nowrap border-l border-white/30", k % 2 ? T.monthHeadAlt : T.monthHead)}
                  style={{ left: m.de * SW, width: (m.ate - m.de + 1) * SW }}
                >
                  {(m.ate - m.de + 1) * SW > 60 ? m.nome : m.nome.slice(0, 3)}
                </div>
              ))}
            </div>
            <div className="relative" style={{ height: H_SEM }}>
              {janela.semanas.map((s, k) => (
                <div
                  key={k}
                  className={cx(
                    "absolute top-0 flex h-full flex-col items-center justify-center border-l border-black/5 leading-tight",
                    T.weekHead,
                    k === semAtual && T.weekNow,
                    k === semPrazo && T.weekPrazo,
                  )}
                  style={{ left: k * SW, width: SW }}
                  title={`Semana ${s.num}: ${fmt(s.ini)} a ${fmt(addDias(s.ini, 6))}`}
                >
                  <span className="font-semibold">S{s.num}</span>
                  <span className="opacity-80">{dm(s.sexta)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex" style={{ width: RIGHT }}>
            <div style={{ width: larguraPront }} className="flex flex-col">
              <div style={{ height: H_MES }} className={cx("flex items-center justify-center", T.groupHead)}>
                Prontidão
              </div>
              <div className="flex" style={{ height: H_SEM }}>
                {cols.map((c) => (
                  <div
                    key={c.k}
                    style={{ width: c.area ? AREA : COL }}
                    className={cx("flex items-center justify-center gap-0.5 text-center leading-tight", T.subHead, c.area && "bg-black/[0.03] normal-case")}
                  >
                    {c.nome}
                    {c.k === "recursos" && (
                      <button
                        type="button"
                        onClick={() => setExpandido(!expandido)}
                        className="ml-0.5 flex size-4 items-center justify-center rounded-full border border-current"
                        aria-label={expandido ? "Recolher áreas" : "Expandir áreas viabilizadoras"}
                        title={expandido ? "Recolher áreas" : "Ver áreas viabilizadoras"}
                      >
                        {expandido ? <RiSubtractLine className="size-3" /> : <RiAddLine className="size-3" />}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ width: RISCO }} className={cx("flex flex-col items-center justify-end pb-2 text-center leading-tight", T.subHead)}>
              Risco
              <span className="normal-case opacity-70">declarado</span>
            </div>
            <div style={{ width: INTER }} className={cx("flex flex-col justify-end px-2 pb-2 leading-tight", T.subHead)}>
              Interdepend.
              <span className="normal-case opacity-70">← recebe de · → entrega p/</span>
            </div>
          </div>
        </div>

        {/* ---------- Linhas ---------- */}
        <div className="relative" style={{ height: H }}>
          {/* colunas de destaque: semana atual e semana do prazo */}
          {semAtual >= 0 && <div className={cx("pointer-events-none absolute top-0", T.colNow)} style={{ left: LEFT + semAtual * SW, width: SW, height: H }} />}
          {semPrazo >= 0 && <div className={cx("pointer-events-none absolute top-0", T.colPrazo)} style={{ left: LEFT + semPrazo * SW, width: SW, height: H }} />}
          {meses.slice(1).map((m) => (
            <div key={"l" + m.de} className="pointer-events-none absolute top-0 w-px bg-black/10" style={{ left: LEFT + m.de * SW, height: H }} />
          ))}

          {frentes.map((f, k) => {
            const apagada = rel && !rel.has(f.id)
            const x1 = f.ini ? colIni(f.ini) + 3 : 0
            const x2 = f.fim ? colFim(f.fim) - 3 : 0
            const camIdx = camadas.indexOf(f.camada)
            const scIni = xHoje >= 0 ? xHoje : hoje < janela.inicio ? 0 : TW
            const scFim = f.alvo && f.alvo > hoje ? colFim(f.alvo) : Math.min(TW, scIni + 260)
            // marcos agrupados por semana: um losango por semana, com todas as macroatividades no detalhe
            const porSemana = new Map<number, Iniciativa[]>()
            f.iniciativas.filter((i) => dentro(i.fim)).forEach((i) => {
              const k = idxSemana(i.fim)
              porSemana.set(k, [...(porSemana.get(k) ?? []), i])
            })
            return (
              <div
                key={f.id}
                className={cx("absolute left-0 flex transition-opacity duration-150", T.rowBorder, apagada ? "opacity-25" : "opacity-100")}
                style={{ top: k * ROW, height: ROW, width: W }}
                onMouseEnter={() => setFoco(f.id)}
                onMouseLeave={() => setFoco(null)}
              >
                {/* frente */}
                <button
                  type="button"
                  onClick={() => onAbrir(f)}
                  style={{ width: LEFT }}
                  className={cx(
                    "flex items-center gap-3 border-l-[3px] px-3 text-left transition hover:bg-black/[0.03]",
                    f.cp ? "border-red-500" : "border-transparent",
                    foco === f.id && "bg-black/[0.03]",
                  )}
                  title="Abrir detalhe da frente"
                >
                  <span className={cx("relative flex size-7 shrink-0 items-center justify-center", T.numBadge, corCamada(camIdx))}>
                    {f.id}
                    {f.atualizado && (
                      <span className="absolute -right-1.5 -top-1.5 flex size-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white" title="Reporte atualizado">
                        <RiCheckLine className="size-2.5 text-white" />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className={cx("line-clamp-2", T.nome)}>{f.nome}</span>
                    <span className="mt-0.5 flex items-center gap-1.5">
                      <span className={cx("truncate", T.lider)}>{f.lider}</span>
                      {f.cp && <span className={T.cpTag}>CP</span>}
                    </span>
                  </span>
                </button>

                {/* linha do tempo */}
                <div className="relative" style={{ width: TW }}>
                  {f.semCrono ? (
                    <div
                      className={cx("absolute flex items-center overflow-hidden whitespace-nowrap px-3 text-xs font-semibold", T.semCrono)}
                      style={{
                        left: scIni,
                        width: Math.max(150, scFim - scIni),
                        top: ROW / 2 - 13,
                        height: 26,
                        backgroundImage: "repeating-linear-gradient(135deg, rgba(220,38,38,.09) 0 6px, transparent 6px 12px)",
                      }}
                    >
                      Sem cronograma{f.alvo ? ` · data-alvo ${pad(f.alvo.getMonth() + 1)}/${f.alvo.getFullYear()}` : ""}
                    </div>
                  ) : (
                    x2 > 0 &&
                    x1 < TW && (
                      <div
                        className={cx("absolute", T.bar, f.ini! < janela.inicio && "rounded-l-none border-l-0", f.fim! >= janela.fim && "rounded-r-none border-r-0")}
                        style={{ left: x1, width: Math.max(6, x2 - x1), top: ROW / 2 - 11, height: 22 }}
                      />
                    )
                  )}
                  {f.alvo && dentro(f.alvo) && (
                    <Tooltip asChild side="top" showArrow={false} content={`Data-alvo: ${fmt(f.alvo)}`}>
                      <span className="absolute cursor-default text-[11px] leading-none text-gray-800" style={{ left: centro(f.alvo) - 5, top: 3 }}>
                        ▼
                      </span>
                    </Tooltip>
                  )}
                  {[...porSemana.entries()].map(([k, lista]) => {
                    const ordem = { atr: 0, andamento: 1, nao: 2, conc: 3 } as const
                    const sts = lista.map((i) => marcoSt(i))
                    const st = sts.reduce((a, b) => (ordem[b] < ordem[a] ? b : a))
                    const s0 = janela.semanas[k]
                    const nomeIni = (id: string) => {
                      const o = iniPorId.get(id)
                      const fr = frenteDaIni.get(id)
                      return `${o?.macro ?? id}${fr && fr !== f.id ? ` (frente ${fr})` : ""}`
                    }
                    return (
                      <Tooltip
                        key={k}
                        asChild
                        side="top"
                        showArrow={false}
                        className="max-w-96"
                        content={
                          <div className="space-y-2">
                            <p className="text-xs opacity-80">
                              S{s0.num} · semana de {fmt(s0.ini)} · {lista.length} macroatividade{lista.length > 1 ? "s" : ""}
                            </p>
                            {lista.map((i) => (
                              <div key={i.id} className="space-y-0.5">
                                <p className="font-semibold">
                                  {i.macro} <span className="font-normal opacity-80">· {MARCO_NOME[marcoSt(i)]}</span>
                                </p>
                                <p className="opacity-90">
                                  {i.ids.length > 0 && `ID ${i.ids.join("; ")} · `}
                                  {fmt(i.ini)} a {fmt(i.fim)}
                                </p>
                                {i.preds.length > 0 && <p className="opacity-90">Depende de: {i.preds.map(nomeIni).join(", ")}</p>}
                                {i.sucs.length > 0 && <p className="opacity-90">Libera: {i.sucs.map(nomeIni).join(", ")}</p>}
                              </div>
                            ))}
                          </div>
                        }
                      >
                        <span className="absolute cursor-default" style={{ left: k * SW + SW / 2 - 9, top: ROW / 2 - 9 }}>
                          <Diamante st={st} />
                          {lista.length > 1 && (
                            <span className="absolute -right-2 -top-2 flex size-3.5 items-center justify-center rounded-full bg-gray-800 text-[9px] font-bold text-white">{lista.length}</span>
                          )}
                        </span>
                      </Tooltip>
                    )
                  })}
                </div>

                {/* prontidão */}
                {cols.map((c) => {
                  const st = c.get(f)
                  return (
                    <div key={c.k} style={{ width: c.area ? AREA : COL }} className={cx("flex items-center justify-center", c.area && "bg-black/[0.03]")}>
                      <Tooltip asChild side="top" showArrow={false} content={`${c.nome}: ${PRONT_NOME[st]}`}>
                        <span className="cursor-default">
                          <ProntIcon st={st} size={c.area ? 18 : 20} />
                        </span>
                      </Tooltip>
                    </div>
                  )
                })}

                {/* risco */}
                <div style={{ width: RISCO }} className="flex items-center justify-center gap-1">
                  <Tooltip
                    asChild
                    side="left"
                    showArrow={false}
                    className="max-w-72"
                    content={
                      <div className="space-y-1">
                        <p className="font-semibold">Risco {f.risco ? RISCO_NOME[f.risco].toLowerCase() : "não informado"}</p>
                        {f.riscoDesc && <p>{f.riscoDesc}</p>}
                        {f.motivosRisco.length > 0 && <p className="opacity-80">Sinais: {f.motivosRisco.join(", ")}</p>}
                      </div>
                    }
                  >
                    <span className="flex cursor-default items-center gap-1">
                      <RiscoBars nivel={f.risco} />
                      {f.semCrono && <RiAlertFill className="size-3.5 text-amber-500" aria-label="sem cronograma" />}
                    </span>
                  </Tooltip>
                </div>

                {/* interdependências */}
                <div style={{ width: INTER }} className="flex flex-col justify-center gap-1 px-2 text-[11px] text-gray-500">
                  <span className="flex flex-wrap items-center gap-1">
                    <span className="w-3">←</span>
                    {f.recebe.length ? f.recebe.map((id) => <ChipDep key={id} prog={prog} d={depEntre(prog, id, f.id)!} mostrar={id} />) : <span className="opacity-50">—</span>}
                  </span>
                  <span className="flex flex-wrap items-center gap-1">
                    <span className="w-3">→</span>
                    {f.entrega.length ? f.entrega.map((id) => <ChipDep key={id} prog={prog} d={depEntre(prog, f.id, id)!} mostrar={id} />) : <span className="opacity-50">—</span>}
                  </span>
                </div>
              </div>
            )
          })}

          {/* setas de dependência entre marcos */}
          <svg className="pointer-events-none absolute top-0 overflow-visible" style={{ left: LEFT }} width={TW} height={H}>
            <defs>
              <marker id="pl-seta" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,0 L8,4 L0,8 z" fill="#6b7280" />
              </marker>
              <marker id="pl-seta-r" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,0 L8,4 L0,8 z" fill="#dc2626" />
              </marker>
            </defs>
            {setas.map((s) => {
              const ativa = !rel || (rel.has(s.fa) && rel.has(s.fb) && (s.fa === foco || s.fb === foco))
              return (
                <path
                  key={s.de.id + s.para.id}
                  d={s.d}
                  fill="none"
                  stroke={s.vermelha ? "#dc2626" : "#6b7280"}
                  strokeWidth={1.4}
                  strokeDasharray={s.vermelha ? "4 3" : undefined}
                  markerEnd={`url(#${s.vermelha ? "pl-seta-r" : "pl-seta"})`}
                  opacity={ativa ? 0.9 : 0.08}
                />
              )
            })}
          </svg>

          {/* hoje */}
          {xHoje >= 0 && (
            <div className={cx("pointer-events-none absolute top-0", T.hojeLine)} style={{ left: LEFT + xHoje, height: H + H_RODAPE }}>
              <span className="absolute right-1 whitespace-nowrap rounded bg-red-500 px-1 text-[10px] font-semibold leading-4 text-white" style={{ top: H + 3 }}>
                Hoje
              </span>
            </div>
          )}
        </div>

        {/* ---------- Rodapé: carga de marcos e totais ---------- */}
        <div className="flex border-t border-black/10" style={{ height: H_RODAPE }}>
          <div style={{ width: LEFT }} className="flex flex-col justify-center px-3">
            <span className={T.painelTitulo}>Carga de marcos por semana</span>
            <span className={T.rodape}>
              {maxCarga > 0 ? `Pico: S${janela.semanas[pico].num} (${dm(janela.semanas[pico].sexta)}) · ${maxCarga} marcos` : "Sem marcos no período"}
            </span>
          </div>
          <div className="relative" style={{ width: TW }}>
            {carga.map((c, k) =>
              c ? (
                <div key={k} className="absolute bottom-2 flex flex-col items-center" style={{ left: k * SW, width: SW }}>
                  <span className="text-xs font-semibold text-gray-700">{c}</span>
                  <div className={cx("w-3/5 rounded-t-sm", k === pico ? T.cargaPico : T.cargaBar)} style={{ height: 4 + (c / maxCarga) * 20 }} />
                </div>
              ) : null,
            )}
          </div>
          {cols.map((c) => {
            const ok = frentes.filter((f) => c.get(f) === "ok").length
            const aplic = frentes.filter((f) => c.get(f) !== "na").length
            return (
              <div key={c.k} style={{ width: c.area ? AREA : COL }} className={cx("flex flex-col items-center justify-center", c.area && "bg-black/[0.03]")}>
                <span className="text-sm font-bold tabular-nums text-gray-800">
                  {ok}
                  <span className="text-xs font-normal text-gray-500">/{aplic}</span>
                </span>
                <span className="text-[10px] text-gray-500">OK</span>
              </div>
            )
          })}
          <div style={{ width: RISCO }} className="flex flex-col items-center justify-center">
            <span className="text-sm font-bold tabular-nums text-gray-800">{frentes.filter((f) => f.risco === "alto").length}</span>
            <span className="text-[10px] text-gray-500">alto</span>
          </div>
          <div style={{ width: INTER }} className="flex flex-col justify-center px-2">
            <span className="text-sm font-bold tabular-nums text-gray-800">
              {prog.deps.filter((d) => d.risco).length}
              <span className="text-xs font-normal text-gray-500">/{prog.deps.length}</span>
            </span>
            <span className="text-[10px] text-gray-500">dependências em risco</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LegendaPlano({ camadas }: { camadas: string[] }) {
  const item = "flex items-center gap-1.5"
  return (
    <div className={cx("flex flex-col gap-2", T.legenda)}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className={cx("w-20", T.groupHead)}>Prontidão</span>
        {(["ok", "parcial", "bloqueio", "sem", "na"] as Pront[]).map((s) => (
          <span key={s} className={item}>
            <ProntIcon st={s} size={16} /> {PRONT_NOME[s]}
          </span>
        ))}
        <span className="opacity-80">Escopo definido · Prazo comprometido · Entregáveis mapeados e datados · Recursos: áreas viabilizadoras (+)</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className={cx("w-20", T.groupHead)}>Roadmap</span>
        {(Object.keys(COR_MARCO) as (keyof typeof COR_MARCO)[]).map((s) => (
          <span key={s} className={item}>
            <Diamante st={s} size={10} /> {MARCO_NOME[s]}
          </span>
        ))}
        <span className={item}>
          <span className="inline-block h-3 w-6 rounded-sm border border-dashed border-red-400" style={{ backgroundImage: "repeating-linear-gradient(135deg, rgba(220,38,38,.15) 0 3px, transparent 3px 6px)" }} />
          Sem cronograma
        </span>
        <span className={item}>▼ Data-alvo</span>
        <span className={item}>
          <span className={T.cpTag}>CP</span> Caminho crítico
        </span>
        <span className={item}>
          <span className="flex size-3.5 items-center justify-center rounded-full bg-emerald-500">
            <RiCheckLine className="size-2.5 text-white" />
          </span>
          Reporte atualizado (até 7 dias)
        </span>
        <span className={item}>
          <svg width="22" height="8" aria-hidden="true">
            <path d="M0,4 H22" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>
          Dependência com marco atrasado ou conflito de datas
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className={cx("w-20", T.groupHead)}>Risco</span>
        {(["alto", "medio", "baixo"] as const).map((r) => (
          <span key={r} className={item}>
            <RiscoBars nivel={r} /> {RISCO_NOME[r]}
          </span>
        ))}
        <span className={cx("ml-4 w-24", T.groupHead)}>Interdepend.</span>
        <span className={item}>
          <span className={T.chip}>01</span> comprovada por macroatividade
        </span>
        <span className={item}>
          <span className={T.chipHip}>01</span> hipótese a validar
        </span>
        <span className={item}>
          <span className={T.chipRisco}>01</span>
          <span className={T.chipHipRisco}>01</span> em risco
        </span>
        <span className={item}>
          <span className="flex size-3 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white">!</span> não declarada
        </span>
        <span className={cx("ml-4 w-16", T.groupHead)}>Camadas</span>
        {camadas.map((c, k) => (
          <span key={c} className={item}>
            <span className={cx("size-3 rounded-sm", corCamada(k))} /> {c}
          </span>
        ))}
      </div>
    </div>
  )
}
