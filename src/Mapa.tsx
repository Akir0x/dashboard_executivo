import React from "react"
import { RiCloseLine } from "@remixicon/react"
import { cx } from "./utils/cx"
import { addDias, fmt, hoje, Iniciativa } from "./data"
import { conectadas, Dependencia, Frente, marcoSt, MARCO_NOME, ordenarCamadas, Programa, segunda } from "./exec"
import { ChipDep, estiloChip, rotuloDep } from "./ChipDep"
import { Diamante } from "./icones"
import { corCamada, T } from "./tema"

// Rede no tempo: raias = frentes; só entram as macroatividades ligadas a outra frente.
const LEFT = 230
const H_MES = 22
const LINHA = 30
const PADV = 8
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

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

const curto = (s: string, n = 26) => (s.length > n ? s.slice(0, n - 1) + "…" : s)
const chave = (d: Pick<Dependencia, "de" | "para">) => d.de + ">" + d.para

export function Mapa({ prog, onAbrir }: { prog: Programa; onAbrir: (f: Frente) => void }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const W = Math.max(1100, useLargura(ref))
  const [foco, setFoco] = React.useState<string | null>(null)
  const [sel, setSel] = React.useState<{ tipo: "frente" | "par"; k: string } | null>(null)
  const camadas = ordenarCamadas(prog.frentes)

  // macroatividades envolvidas em dependência entre frentes
  const ligacoes = prog.deps.flatMap((d) => d.macros.map((m) => ({ ...m, d })))
  const envolvidas = new Map<string, Iniciativa>()
  ligacoes.forEach((l) => {
    envolvidas.set(l.pre.id, l.pre)
    envolvidas.set(l.suc.id, l.suc)
  })
  const frenteDaIni = new Map<string, string>()
  prog.frentes.forEach((f) => f.iniciativas.forEach((i) => frenteDaIni.set(i.id, f.id)))

  // período: das macroatividades envolvidas (com folga) ou, sem nenhuma, das próximas 12 semanas
  const datas = [...envolvidas.values()].flatMap((i) => [i.ini, i.fim]).filter(Boolean) as Date[]
  const ini = segunda(addDias(datas.length ? new Date(Math.min(...datas.map((d) => d.getTime()))) : hoje, -7))
  const fimBase = datas.length ? new Date(Math.max(...datas.map((d) => d.getTime()))) : addDias(hoje, 84)
  const fim = addDias(segunda(fimBase), 21)
  const TW = W - LEFT
  const x = (d: Date) => ((d.getTime() - ini.getTime()) / (fim.getTime() - ini.getTime())) * TW

  // raias com empacotamento das etiquetas para não sobrepor
  type Item = { i: Iniciativa; xi: number; xf: number; linha: number; rot: string }
  const raias: { f: Frente; top: number; h: number; itens: Item[]; hipoteses: Dependencia[] }[] = []
  let y = H_MES + 18
  for (const f of prog.frentes) {
    const minhas = f.iniciativas.filter((i) => envolvidas.has(i.id) && i.fim).sort((a, b) => a.fim!.getTime() - b.fim!.getTime())
    const ocupado: number[] = []
    const itens: Item[] = minhas.map((i) => {
      const xf = x(i.fim!)
      const xi = i.ini ? x(i.ini) : xf
      const rot = curto(i.macro)
      const fimEtiqueta = xf + 12 + rot.length * 6.2
      let l = ocupado.findIndex((e) => e + 10 <= Math.min(xi, xf - 8))
      if (l < 0) {
        l = ocupado.length
        ocupado.push(0)
      }
      ocupado[l] = fimEtiqueta
      return { i, xi, xf, linha: l, rot }
    })
    const hipoteses = prog.deps.filter((d) => !d.comprovada && (d.de === f.id || d.para === f.id))
    const h = Math.max(1, ocupado.length) * LINHA + PADV * 2
    raias.push({ f, top: y, h, itens, hipoteses })
    y += h
  }
  const H = y + 6
  const pos = new Map<string, { x: number; y: number }>()
  raias.forEach((r) => r.itens.forEach((it) => pos.set(it.i.id, { x: it.xf, y: r.top + PADV + it.linha * LINHA + LINHA / 2 })))

  const meses: { x: number; nome: string }[] = []
  for (let m = new Date(ini.getFullYear(), ini.getMonth() + 1, 1); m < fim; m = new Date(m.getFullYear(), m.getMonth() + 1, 1))
    meses.push({ x: x(m), nome: `${MESES[m.getMonth()]}/${String(m.getFullYear()).slice(2)}` })
  const prazo = prog.painel.prazo

  const rel = foco ? conectadas(prog, foco) : null
  const ativaPar = (d: Dependencia) =>
    sel ? (sel.tipo === "par" ? sel.k === chave(d) : d.de === sel.k || d.para === sel.k) : foco ? d.de === foco || d.para === foco : true

  // tabela: agrupada por par de frentes; risco primeiro, depois hipóteses
  const peso = (d: Dependencia) => (d.risco ? 0 : !d.comprovada ? 1 : !d.declarada ? 2 : 3)
  const grupos = [...prog.deps]
    .filter((d) => !sel || (sel.tipo === "par" ? chave(d) === sel.k : d.de === sel.k || d.para === sel.k))
    .sort((a, b) => peso(a) - peso(b) || a.de.localeCompare(b.de))
  const resumo = {
    total: prog.deps.length,
    comprovadas: prog.deps.filter((d) => d.comprovada).length,
    hipoteses: prog.deps.filter((d) => !d.comprovada).length,
    naoDeclaradas: prog.deps.filter((d) => !d.declarada).length,
    risco: prog.deps.filter((d) => d.risco).length,
  }

  return (
    <div className="space-y-3">
      <div className={cx("flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 text-sm", T.card)}>
        <span>
          <b className="tabular-nums">{resumo.total}</b> dependências entre frentes
        </span>
        <span>
          <b className="tabular-nums">{resumo.comprovadas}</b> comprovadas por macroatividade
        </span>
        <span>
          <b className="tabular-nums">{resumo.hipoteses}</b> hipóteses a validar
        </span>
        <span>
          <b className="tabular-nums">{resumo.naoDeclaradas}</b> não declaradas na tbFrentes
        </span>
        <span className="text-red-600">
          <b className="tabular-nums">{resumo.risco}</b> em risco
        </span>
        <span className={cx("ml-auto", T.rodape)}>Clique numa frente ou numa seta para filtrar a lista abaixo</span>
      </div>

      <div className={cx("overflow-hidden", T.card)}>
        <div ref={ref} className="overflow-x-auto">
          <div className="relative" style={{ width: W, height: H }}>
            {/* eixo */}
            <div className={cx("absolute left-0 top-0 flex items-center px-3", T.leftHead)} style={{ width: LEFT, height: H_MES + 18 }}>
              Frente
            </div>
            {meses.map((m) => (
              <React.Fragment key={m.nome}>
                <span className={cx("absolute top-2 pl-1.5", T.subHead)} style={{ left: LEFT + m.x }}>
                  {m.nome}
                </span>
                <div className="absolute w-px bg-black/10" style={{ left: LEFT + m.x, top: H_MES + 10, height: H - H_MES - 10 }} />
              </React.Fragment>
            ))}
            {prazo && prazo >= ini && prazo < fim && (
              <div className={cx("absolute", T.colPrazo)} style={{ left: LEFT + x(segunda(prazo)), width: x(addDias(segunda(prazo), 7)) - x(segunda(prazo)), top: H_MES + 10, height: H - H_MES - 10 }}>
                <span className="absolute -top-0.5 left-0.5 text-[10px] font-semibold text-red-600">prazo</span>
              </div>
            )}

            {/* raias */}
            {raias.map((r, k) => {
              const apagada = rel && !rel.has(r.f.id)
              const selec = sel?.tipo === "frente" && sel.k === r.f.id
              return (
                <div
                  key={r.f.id}
                  className={cx("absolute left-0 border-t border-black/[0.07] transition-opacity", k % 2 ? "bg-black/[0.015]" : "", apagada ? "opacity-30" : "")}
                  style={{ top: r.top, height: r.h, width: W }}
                  onMouseEnter={() => setFoco(r.f.id)}
                  onMouseLeave={() => setFoco(null)}
                >
                  <button
                    type="button"
                    onClick={() => setSel(selec ? null : { tipo: "frente", k: r.f.id })}
                    onDoubleClick={() => onAbrir(r.f)}
                    className={cx("flex h-full items-center gap-2 px-3 text-left hover:bg-black/[0.03]", selec && "bg-black/[0.05]")}
                    style={{ width: LEFT }}
                    title="Clique para filtrar · duplo clique para abrir o detalhe"
                  >
                    <span className={cx("flex size-6 shrink-0 items-center justify-center text-xs", T.numBadge, corCamada(camadas.indexOf(r.f.camada)))}>{r.f.id}</span>
                    <span className="min-w-0">
                      <span className={cx("line-clamp-2", T.nome)}>{r.f.nome}</span>
                    </span>
                  </button>
                  {!r.itens.length && (
                    <span className="absolute flex items-center gap-1.5 text-xs text-gray-500" style={{ left: LEFT + 12, top: r.h / 2 - 9 }}>
                      {r.hipoteses.length ? (
                        <>
                          Sem macroatividade ligada a outra frente · hipóteses:
                          {r.hipoteses.map((d) => (
                            <span key={chave(d)} className={estiloChip(d)}>
                              {d.de}→{d.para}
                            </span>
                          ))}
                        </>
                      ) : (
                        "Sem dependências com outras frentes"
                      )}
                    </span>
                  )}
                </div>
              )
            })}

            {/* hoje */}
            {hoje >= ini && hoje < fim && (
              <div className={cx("pointer-events-none absolute", T.hojeLine)} style={{ left: LEFT + x(hoje), top: H_MES + 10, height: H - H_MES - 10 }}>
                <span className="absolute left-1 top-0 rounded bg-red-500 px-1 text-[10px] font-semibold leading-4 text-white">Hoje</span>
              </div>
            )}

            {/* setas entre macroatividades */}
            <svg className="absolute top-0 overflow-visible" style={{ left: LEFT }} width={TW} height={H}>
              <defs>
                <marker id="rd-seta" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M0,0 L8,4 L0,8 z" fill="#6b7280" />
                </marker>
                <marker id="rd-seta-r" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M0,0 L8,4 L0,8 z" fill="#dc2626" />
                </marker>
              </defs>
              {ligacoes.map((l) => {
                const a = pos.get(l.pre.id)
                const b = pos.get(l.suc.id)
                if (!a || !b) return null
                const vermelha = l.atrasada || l.conflito
                const ativa = ativaPar(l.d)
                const dx = Math.max(40, Math.abs(b.x - a.x) / 2)
                const d = `M${a.x + 8},${a.y} C${a.x + dx},${a.y} ${b.x - dx},${b.y} ${b.x - 9},${b.y}`
                return (
                  <g key={l.pre.id + l.suc.id} className="cursor-pointer" onClick={() => setSel({ tipo: "par", k: chave(l.d) })}>
                    <path d={d} fill="none" stroke="transparent" strokeWidth={12} />
                    <path
                      d={d}
                      fill="none"
                      stroke={vermelha ? "#dc2626" : "#6b7280"}
                      strokeWidth={ativa && (foco || sel) ? 2 : 1.4}
                      strokeDasharray={vermelha ? "5 3" : undefined}
                      markerEnd={`url(#${vermelha ? "rd-seta-r" : "rd-seta"})`}
                      opacity={ativa ? 0.9 : 0.08}
                    >
                      <title>
                        {l.pre.macro} → {l.suc.macro}
                        {l.atrasada ? " · predecessora atrasada" : l.conflito ? " · sucessora começa antes do fim da predecessora" : ""}
                      </title>
                    </path>
                  </g>
                )
              })}
            </svg>

            {/* macroatividades: barra fina do período + losango no fim + nome */}
            {raias.map((r) =>
              r.itens.map((it) => {
                const p = pos.get(it.i.id)!
                const st = marcoSt(it.i)
                const apagada = rel && !rel.has(r.f.id)
                return (
                  <div key={it.i.id} className={cx("pointer-events-none absolute transition-opacity", apagada ? "opacity-30" : "")} style={{ left: LEFT, top: p.y - 9, width: TW }}>
                    <div className="absolute h-1 rounded-full bg-gray-300" style={{ left: it.xi, width: Math.max(0, it.xf - it.xi), top: 7 }} />
                    <span className="absolute" style={{ left: it.xf - 9, top: 0 }} title={`${it.i.macro} · ${fmt(it.i.ini)} a ${fmt(it.i.fim)} · ${MARCO_NOME[st]}`}>
                      <Diamante st={st} />
                    </span>
                    <span className="absolute whitespace-nowrap text-xs font-medium text-gray-800" style={{ left: it.xf + 12, top: 1 }}>
                      {it.rot}
                    </span>
                  </div>
                )
              }),
            )}
          </div>
        </div>
      </div>

      {/* lista por par de frentes */}
      <div className={cx("overflow-hidden", T.card)}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 px-4 py-2.5">
          <h3 className={T.painelTitulo}>
            Dependências por par de frentes
            {sel && (sel.tipo === "frente" ? ` · frente ${sel.k}` : ` · ${sel.k.replace(">", " → ")}`)}
          </h3>
          {sel ? (
            <button type="button" className={cx("flex items-center gap-1", T.btn)} onClick={() => setSel(null)}>
              <RiCloseLine className="size-4" /> Mostrar todas
            </button>
          ) : (
            <span className={T.rodape}>Em risco primeiro, depois hipóteses a validar</span>
          )}
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {grupos.map((d) => {
            const fa = prog.porId.get(d.de)!
            const fb = prog.porId.get(d.para)!
            return (
              <div key={chave(d)} className="border-b border-black/[0.07] last:border-0">
                <div className="flex flex-wrap items-center gap-2 bg-black/[0.02] px-4 py-2 text-sm">
                  <ChipDep prog={prog} d={d} mostrar={d.de} />
                  <span className="font-semibold text-gray-900">{fa.nome}</span>
                  <span className="text-gray-400">→</span>
                  <ChipDep prog={prog} d={d} mostrar={d.para} />
                  <span className="font-semibold text-gray-900">{fb.nome}</span>
                  <span className="ml-2 text-xs text-gray-500">{rotuloDep(d)}</span>
                  {d.risco && <span className="ml-auto text-xs font-semibold text-red-600">Em risco · {d.motivo}</span>}
                </div>
                {d.macros.length ? (
                  <table className="w-full text-sm">
                    <tbody>
                      {d.macros.map((m) => (
                        <tr key={m.pre.id + m.suc.id} className="border-t border-black/[0.04]">
                          <td className="w-[34%] py-1.5 pl-12 pr-2">
                            <span className="flex items-center gap-2">
                              <Diamante st={marcoSt(m.pre)} size={10} />
                              {m.pre.macro}
                            </span>
                          </td>
                          <td className="w-[11%] px-2 tabular-nums text-gray-600">fim {fmt(m.pre.fim)}</td>
                          <td className="w-[30%] px-2">
                            <span className="flex items-center gap-2">
                              <span className="text-gray-400">→</span>
                              <Diamante st={marcoSt(m.suc)} size={10} />
                              {m.suc.macro}
                            </span>
                          </td>
                          <td className="w-[11%] px-2 tabular-nums text-gray-600">início {fmt(m.suc.ini)}</td>
                          <td className="px-4 text-right text-xs">
                            {m.atrasada ? (
                              <span className="font-semibold text-red-600">Predecessora atrasada</span>
                            ) : m.conflito ? (
                              <span className="font-semibold text-red-600">Conflito de datas</span>
                            ) : (
                              <span className="text-gray-500">OK</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="py-2 pl-12 text-sm text-gray-500">Nenhuma macroatividade liga as duas frentes. Validar com os líderes ou registrar as predecessoras na tbIniciativas.</p>
                )}
              </div>
            )
          })}
          {!grupos.length && <p className="px-4 py-4 text-sm text-gray-500">Nenhuma dependência.</p>}
        </div>
      </div>
    </div>
  )
}
