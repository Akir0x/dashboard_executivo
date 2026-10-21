// Tela "Detalhe da frente": macroatividades com mini linha do tempo, pendências/atenção (tbPontos),
// prontidão comentada e interdependências desta frente. Abre ao clicar na frente no plano integrado.
import React from "react"
import { RiArrowLeftSLine, RiCheckLine } from "@remixicon/react"
import { cx } from "./utils/cx"
import { addDias, fmt, hoje, Iniciativa } from "./data"
import { Dependencia, Frente as TFrente, MARCO_NOME, marcoSt, MarcoSt, ordenarCamadas, Ponto, Pront, PRONT_NOME, Programa, TIPO_NOME } from "./exec"
import { COR_MARCO, Diamante, ProntIcon } from "./icones"
import { Janela } from "./Plano"
import { corCamada, T } from "./tema"

const dm = (d: Date | null) => (d ? `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}` : "—")
const semanas = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / (7 * 864e5))

export const ST_BADGE: Record<MarcoSt, string> = {
  conc: "bg-emerald-50 text-emerald-700 ring-emerald-600/25",
  andamento: "bg-amber-50 text-amber-800 ring-amber-600/30",
  nao: "bg-gray-50 text-gray-600 ring-gray-500/25",
  atr: "bg-red-50 text-red-700 ring-red-600/25",
}

// Situação da pendência em relação a hoje.
export function situacaoPrazo(p: Ponto): { txt: string; cls: string; peso: number } {
  if (!p.prazo) return { txt: "sem data", cls: "bg-red-50 text-red-700", peso: 2 }
  if (p.prazo < hoje) return { txt: "vencida", cls: "bg-red-600 text-white", peso: 0 }
  return { txt: "no prazo", cls: "bg-emerald-50 text-emerald-700", peso: 1 }
}

export function ChipFrente({ prog, id, onClick }: { prog: Programa; id: string; onClick?: () => void }) {
  const f = prog.porId.get(id)
  const cls = cx("inline-flex h-5 min-w-6 items-center justify-center rounded px-1 text-[11px] font-bold text-white", f ? corCamada(ordenarCamadas(prog.frentes).indexOf(f.camada)) : "bg-gray-400")
  return onClick ? (
    <button type="button" onClick={onClick} className={cx(cls, "hover:opacity-80")} title={f?.nome ?? id}>
      {id}
    </button>
  ) : (
    <span className={cls} title={f?.nome ?? id}>
      {id}
    </span>
  )
}

// Mini linha do tempo nas mesmas semanas do plano: período em barra fina, losango no fim, hoje e prazo.
function MiniLinha({ i, janela, prazo }: { i: Iniciativa; janela: Janela; prazo: Date | null }) {
  const W = 210
  const N = janela.semanas.length
  const SW = W / N
  const idx = (d: Date) => janela.semanas.findIndex((s) => d >= s.ini && d < addDias(s.ini, 7))
  const col = (d: Date, fim = false) => (d < janela.inicio ? 0 : d >= janela.fim ? W : (idx(d) + (fim ? 1 : 0)) * SW)
  const semHoje = idx(hoje)
  const semPrazo = prazo ? idx(prazo) : -1
  const st = marcoSt(i)
  const dentro = i.fim && i.fim >= janela.inicio && i.fim < janela.fim
  return (
    <div className="relative h-5" style={{ width: W }}>
      <div className="absolute inset-x-0 top-1/2 h-px bg-gray-200" />
      {semPrazo >= 0 && <div className="absolute inset-y-0 w-px bg-red-500" style={{ left: (semPrazo + 1) * SW }} title={`Prazo final ${fmt(prazo)}`} />}
      {semHoje >= 0 && <div className="absolute inset-y-0 border-l border-dashed border-gray-500" style={{ left: (semHoje + 1) * SW }} title="Hoje" />}
      {i.ini && i.fim && (
        <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-gray-300" style={{ left: col(i.ini), width: Math.max(2, col(i.fim, true) - col(i.ini) - SW / 2) }} />
      )}
      {i.fim && dentro && (
        <span className="absolute top-0.5" style={{ left: idx(i.fim) * SW + SW / 2 - 8 }}>
          <Diamante st={st} size={12} />
        </span>
      )}
      {i.fim && !dentro && (
        <span className="absolute top-0 text-[10px] text-gray-500" style={i.fim < janela.inicio ? { left: 0 } : { right: 0 }} title={`Fim ${fmt(i.fim)}`}>
          {i.fim < janela.inicio ? "◂" : "▸"} {dm(i.fim)}
        </span>
      )}
    </div>
  )
}

function Bloco({ titulo, extra, children, className }: { titulo: string; extra?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cx("overflow-hidden", T.card, className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-black/10 px-4 py-2">
        <h3 className={T.painelTitulo}>{titulo}</h3>
        {extra && <span className="text-[11px] text-gray-500">{extra}</span>}
      </div>
      {children}
    </section>
  )
}

function LinhaDep({ prog, f, d }: { prog: Programa; f: TFrente; d: Dependencia }) {
  const entrega = d.de === f.id
  const outra = prog.porId.get(entrega ? d.para : d.de)!
  return (
    <li className="px-4 py-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-900">
        <span className={d.comprovada ? "text-gray-900" : "text-gray-400"} title={d.comprovada ? "comprovada" : "hipótese"}>
          {d.comprovada ? "●" : "○"}
        </span>
        {entrega ? "→ entrega para" : "← recebe de"}
        <ChipFrente prog={prog} id={outra.id} />
        <span className="truncate">{outra.curto || outra.nome}</span>
        {!d.declarada && <span className="rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white" title="não declarada na tbFrentes">!</span>}
        {d.risco && <span className="ml-auto text-[10px] font-semibold text-red-600">em risco</span>}
      </p>
      {d.macros.length ? (
        <ul className="mt-1 space-y-1">
          {d.macros.map((m) => {
            const folga = m.pre.fim && m.suc.ini ? semanas(m.pre.fim, m.suc.ini) : null
            const ruim = m.atrasada || m.conflito || (folga !== null && folga < 0)
            return (
              <li key={m.pre.id + m.suc.id} className="flex items-start justify-between gap-2 text-[11px] text-gray-600">
                <span className="min-w-0">
                  <span className="font-medium text-gray-800">{m.pre.macro}</span>
                  {m.pre.ids.length > 0 && <span className="text-gray-400"> · ID {m.pre.ids.join("; ")}</span>}
                  <span className="text-gray-400"> → </span>
                  {m.suc.macro}
                </span>
                <span className={cx("shrink-0 rounded px-1.5 py-0.5 font-semibold tabular-nums", ruim ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-700")}>
                  {dm(m.pre.fim)} → {dm(m.suc.ini)}
                  {folga !== null && ` · ${folga > 0 ? "+" : ""}${folga} sem`}
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mt-0.5 text-[11px] text-gray-500">Hipótese: nenhuma macroatividade liga as duas frentes. {d.risco && d.motivo ? `(${d.motivo})` : ""}</p>
      )}
    </li>
  )
}

export function DetalheFrente({
  prog,
  frenteId,
  setFrente,
  janela,
  onVoltar,
}: {
  prog: Programa
  frenteId: string
  setFrente: (id: string) => void
  janela: Janela
  onVoltar: () => void
}) {
  const f = prog.porId.get(frenteId) ?? prog.frentes[0]
  const camadas = ordenarCamadas(prog.frentes)
  const itens = [...f.iniciativas].sort((a, b) => (a.fim?.getTime() ?? 0) - (b.fim?.getTime() ?? 0) || (a.ini?.getTime() ?? 0) - (b.ini?.getTime() ?? 0))
  const concl = itens.filter((i) => i.concl).length
  const situacao = f.semCrono ? "Sem cronograma" : concl === itens.length ? "Concluída" : f.marcosAtr ? "Com atraso" : "Em andamento"
  const corSit = f.semCrono || f.marcosAtr ? "bg-red-50 text-red-700 ring-red-600/25" : concl === itens.length ? "bg-emerald-50 text-emerald-700 ring-emerald-600/25" : "bg-amber-50 text-amber-800 ring-amber-600/30"
  const fimPlan = f.fim ?? f.alvo
  const faltam = fimPlan ? Math.max(0, Math.ceil((fimPlan.getTime() - hoje.getTime()) / (7 * 864e5))) : null
  const pend = prog.pontos
    .filter((p) => (p.tipo === "pendencia" || p.tipo === "atencao") && (p.todas || p.frentes.includes(f.id)))
    .sort((a, b) => situacaoPrazo(a).peso - situacaoPrazo(b).peso || (a.prazo?.getTime() ?? 0) - (b.prazo?.getTime() ?? 0))
  const deps = prog.deps.filter((d) => d.de === f.id || d.para === f.id).sort((a, b) => Number(b.risco) - Number(a.risco) || Number(b.de === f.id) - Number(a.de === f.id))
  const pront: [string, Pront, string][] = [
    ["Escopo", f.escopo, f.comentario.escopo],
    ["Prazo", f.prazo, f.comentario.prazo],
    ["Entregáveis", f.entreg, f.comentario.entreg],
    ["Recursos", f.recursos, f.comentario.recursos],
  ]

  return (
    <div className="mt-3 space-y-3">
      {/* navegação entre frentes */}
      <div className="flex flex-wrap items-center gap-1.5 print:hidden">
        <button type="button" className={cx("mr-2 flex items-center gap-1", T.btn)} onClick={onVoltar}>
          <RiArrowLeftSLine className="size-4" /> Voltar à visão executiva
        </button>
        {prog.frentes.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setFrente(x.id)}
            className={cx(
              "flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-3 text-sm font-medium transition",
              x.id === f.id ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
            )}
          >
            <span className={cx("relative flex size-6 items-center justify-center rounded-full text-[11px] font-bold text-white", corCamada(camadas.indexOf(x.camada)))}>
              {x.id}
              {x.atualizado && (
                <span className="absolute -right-1 -top-1 flex size-3 items-center justify-center rounded-full bg-emerald-500 ring-1 ring-white">
                  <RiCheckLine className="size-2 text-white" />
                </span>
              )}
            </span>
            {x.curto}
          </button>
        ))}
      </div>

      {/* cabeçalho da frente */}
      <section className={cx("flex flex-wrap items-start justify-between gap-4 border-l-4 px-5 py-3", T.card, f.cp ? "border-l-red-500" : "border-l-gray-300")}>
        <div className="flex items-start gap-3">
          <span className={cx("relative flex size-11 shrink-0 items-center justify-center text-lg", T.numBadge, corCamada(camadas.indexOf(f.camada)))}>
            {f.id}
            {f.atualizado && (
              <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white" title={`Reporte de ${fmt(f.reporte)}`}>
                <RiCheckLine className="size-3 text-white" />
              </span>
            )}
          </span>
          <div>
            <h2 className={cx("text-xl leading-tight", T.nome, "text-xl")}>
              {f.nome}
              {f.cp && <span className={cx("ml-2 align-middle", T.cpTag)}>CP</span>}
            </h2>
            {f.descricao && <p className="mt-0.5 text-sm text-gray-600">{f.descricao}</p>}
            <p className="mt-0.5 text-xs text-gray-500">{[f.area && `Área: ${f.area}`, f.lider && `Líder: ${f.lider}`, f.sponsor && `Sponsor: ${f.sponsor}`, f.camada].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
        <div className="text-right">
          <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", corSit)}>
            ● {situacao}
            {itens.length > 0 && ` · ${concl} de ${itens.length} macroatividades concluídas`}
          </span>
          <p className="mt-1 text-sm text-gray-600">
            {f.fim ? "Fim planejado: " : "Data-alvo: "}
            <span className="text-lg font-bold text-gray-900">{fmt(fimPlan)}</span>
          </p>
          {faltam !== null && <p className="text-xs text-gray-500">faltam ~{faltam} semana{faltam === 1 ? "" : "s"}</p>}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-3">
          {/* macroatividades */}
          <Bloco
            titulo="Macroatividades"
            extra={`linha do tempo: S${janela.semanas[0].num} (${dm(janela.semanas[0].sexta)}) a S${janela.semanas[janela.semanas.length - 1].num} · tracejado = hoje · vermelho = prazo final`}
          >
            {itens.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className={cx("border-b border-black/5 text-left", T.subHead)}>
                    <th className="px-4 py-1.5">Macroatividade</th>
                    <th className="px-2 py-1.5">Responsável</th>
                    <th className="px-2 py-1.5">Prazo</th>
                    <th className="px-2 py-1.5">Linha do tempo</th>
                    <th className="px-4 py-1.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((i) => {
                    const st = marcoSt(i)
                    return (
                      <tr key={i.id} className="border-b border-black/[0.04] last:border-0">
                        <td className="px-4 py-1.5">
                          <span className="font-semibold text-gray-900">{i.macro}</span>
                          <span className="text-xs text-gray-500">
                            {i.ids.length > 0 && ` · ID${i.ids.length > 1 ? "s" : ""} ${i.ids.join("; ")}`}
                            {` · ${dm(i.ini)} a ${dm(i.fim)}`}
                            {i.avanco !== null && !i.concl && ` · ${i.avanco}%`}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-xs text-gray-600">{i.resp || "—"}</td>
                        <td className="px-2 py-1.5 tabular-nums">{dm(i.fim)}</td>
                        <td className="px-2 py-1.5">
                          <MiniLinha i={i} janela={janela} prazo={prog.painel.prazo} />
                        </td>
                        <td className="px-4 py-1.5 text-right">
                          <span className={cx("inline-flex rounded px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset", ST_BADGE[st])}>{MARCO_NOME[st]}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <p className="m-4 rounded-md border border-dashed border-red-300 p-3 text-sm text-red-600">
                Sem cronograma na tbIniciativas{f.alvo ? ` · data-alvo ${fmt(f.alvo)}` : ""}.
              </p>
            )}
          </Bloco>

          {/* pendências e pontos de atenção */}
          <Bloco titulo="Pendências e pontos de atenção" extra={`situação em relação a ${dm(hoje)} · fonte: tbPontos`}>
            {pend.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className={cx("border-b border-black/5 text-left", T.subHead)}>
                    <th className="px-4 py-1.5">Pendência / ponto de atenção</th>
                    <th className="px-2 py-1.5">Plano de ação e responsável</th>
                    <th className="px-4 py-1.5 text-right">Data prevista</th>
                  </tr>
                </thead>
                <tbody>
                  {pend.map((p) => {
                    const s = situacaoPrazo(p)
                    return (
                      <tr key={p.n} className="border-b border-black/[0.04] align-top last:border-0">
                        <td className="w-[45%] px-4 py-1.5">
                          <span className="mr-1.5 rounded bg-gray-100 px-1 text-[10px] font-semibold uppercase text-gray-600">{TIPO_NOME[p.tipo]}</span>
                          <span className="font-semibold text-gray-900">{p.titulo}</span>
                          {p.descricao && <span className="block text-xs text-gray-600">{p.descricao}</span>}
                        </td>
                        <td className="px-2 py-1.5 text-xs text-gray-700">
                          {p.acao || "—"}
                          {p.responsavel && <span className="block font-medium text-gray-900">{p.responsavel}</span>}
                        </td>
                        <td className="whitespace-nowrap px-4 py-1.5 text-right">
                          <span className={cx("tabular-nums", !p.prazo && "italic text-red-600")}>{p.prazo ? dm(p.prazo) : p.prazoTxt || "a definir"}</span>
                          <span className={cx("ml-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold", s.cls)}>{s.txt}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <p className="px-4 py-3 text-sm text-gray-500">Nenhuma pendência ou ponto de atenção registrado para esta frente.</p>
            )}
          </Bloco>
        </div>

        <div className="space-y-3">
          {/* prontidão */}
          <Bloco titulo="Prontidão da frente" extra={f.reporte ? `reporte de ${dm(f.reporte)}` : undefined}>
            <ul className="divide-y divide-black/[0.05]">
              {pront.map(([nome, st, com]) => (
                <li key={nome} className="flex items-start gap-3 px-4 py-2">
                  <ProntIcon st={st} size={22} />
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold text-gray-900">
                      {nome} <span className="font-normal text-gray-500">· {PRONT_NOME[st]}</span>
                    </p>
                    {com && <p className="text-xs text-gray-600">{com}</p>}
                    {nome === "Recursos" && f.areas.length > 0 && (
                      <p className="mt-1 flex flex-wrap gap-x-2.5 gap-y-1 text-[11px] text-gray-700">
                        {f.areas.map((a) => (
                          <span key={a.nome} className="flex items-center gap-1" title={`${a.nome}: ${PRONT_NOME[a.st]}`}>
                            <ProntIcon st={a.st} size={14} /> {a.nome}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Bloco>

          {/* interdependências */}
          <Bloco titulo="Interdependências desta frente" extra="● comprovada · ○ hipótese · folga = início da sucessora − fim da predecessora">
            {deps.length ? (
              <ul className="divide-y divide-black/[0.05]">
                {deps.map((d) => (
                  <LinhaDep key={d.de + ">" + d.para} prog={prog} f={f} d={d} />
                ))}
              </ul>
            ) : (
              <p className="px-4 py-3 text-sm text-gray-500">Sem dependências com outras frentes.</p>
            )}
          </Bloco>
        </div>
      </div>

      <p className="text-[11px] text-gray-500 print:hidden">
        Legenda:{" "}
        {(Object.keys(COR_MARCO) as MarcoSt[]).map((s) => (
          <span key={s} className="mr-3 inline-flex items-center gap-1">
            <Diamante st={s} size={9} /> {MARCO_NOME[s]}
          </span>
        ))}
      </p>
    </div>
  )
}
