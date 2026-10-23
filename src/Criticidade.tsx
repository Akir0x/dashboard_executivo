// Tela "Evoluções e roadblocks": alimentada pela tbPontos (preenchida à mão).
// Evolução = evoluções; Risco e Atenção = roadblocks por criticidade.
import React from "react"
import { RiArrowLeftSLine, RiCheckboxCircleFill } from "@remixicon/react"
import { cx } from "./utils/cx"
import { hoje } from "./data"
import { Criticidade as TCrit, CRIT_NOME, Ponto, Programa } from "./exec"
import { ChipFrente } from "./Frente"
import { T } from "./tema"

const dm = (d: Date | null) => (d ? `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}` : "")
const ORDEM: TCrit[] = ["critico", "alto", "medio", "baixo", ""]
const COR: Record<TCrit, { borda: string; badge: string }> = {
  critico: { borda: "border-t-red-600", badge: "bg-red-600 text-white" },
  alto: { borda: "border-t-amber-500", badge: "bg-amber-500 text-white" },
  medio: { borda: "border-t-slate-500", badge: "bg-slate-600 text-white" },
  baixo: { borda: "border-t-gray-300", badge: "bg-gray-200 text-gray-700" },
  "": { borda: "border-t-gray-300", badge: "bg-gray-100 text-gray-600" },
}

function Frentes({ prog, p, abrir }: { prog: Programa; p: Ponto; abrir: (id: string) => void }) {
  if (p.todas) return <span className="rounded bg-gray-800 px-1.5 text-[10px] font-bold uppercase text-white">Todas</span>
  return (
    <span className="flex flex-wrap gap-1">
      {p.frentes.map((id) => (
        <ChipFrente key={id} prog={prog} id={id} onClick={prog.porId.has(id) ? () => abrir(id) : undefined} />
      ))}
    </span>
  )
}

function Cartoes({ prog, abrirFrente }: { prog: Programa; abrirFrente: (id: string) => void }) {
  const evol = prog.pontos.filter((p) => p.tipo === "evolucao")
  const crit = prog.pontos
    .filter((p) => p.tipo === "risco" || p.tipo === "atencao")
    .sort((a, b) => ORDEM.indexOf(a.criticidade) - ORDEM.indexOf(b.criticidade) || (a.prazo?.getTime() ?? Infinity) - (b.prazo?.getTime() ?? Infinity))
  const contagem = ORDEM.filter((c) => c).map((c) => ({ c, n: crit.filter((p) => p.criticidade === c).length })).filter((x) => x.n)

  return (
    <div className="mt-3 space-y-3">

      {/* evolução */}
      <section className={cx("overflow-hidden", T.card)}>
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-black/10 px-4 py-2">
          <h3 className={T.painelTitulo}>Evoluções</h3>
          <span className="text-[11px] text-gray-500">{evol.length} atualizaç{evol.length === 1 ? "ão" : "ões"}</span>
        </div>
        {evol.length ? (
          <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2 xl:grid-cols-4">
            {evol.map((p) => (
              <article key={p.n} className="rounded-md border border-black/10 border-l-4 border-l-emerald-500 bg-white px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                    <RiCheckboxCircleFill className="size-4 shrink-0 text-emerald-600" />
                    {p.titulo}
                  </p>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <Frentes prog={prog} p={p} abrir={abrirFrente} />
                    {(p.data || p.prazo) && <span className="text-[11px] tabular-nums text-gray-500">{dm(p.data ?? p.prazo)}</span>}
                  </span>
                </div>
                <p className="mt-1 line-clamp-4 text-xs text-gray-600">{p.descricao}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="px-4 py-3 text-sm text-gray-500">Nenhuma evolução registrada (Tipo = Evolução na tbPontos).</p>
        )}
      </section>

      {/* pontos críticos */}
      <section className={cx("overflow-hidden", T.card)}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 px-4 py-2">
          <h3 className={T.painelTitulo}>Roadblocks</h3>
          <span className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
            {contagem.map(({ c, n }) => (
              <span key={c} className={cx("rounded-full px-2 py-0.5 font-semibold", COR[c].badge)}>
                {n} {CRIT_NOME[c as Exclude<TCrit, "">].toLowerCase()}
                {n > 1 ? "s" : ""}
              </span>
            ))}
            <span className="ml-1">cada ponto com a decisão necessária, dono e prazo</span>
          </span>
        </div>
        {crit.length ? (
          <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2 xl:grid-cols-4">
            {crit.map((p) => {
              const vencido = p.prazo && p.prazo < hoje
              return (
                <article key={p.n} className={cx("flex flex-col rounded-md border border-black/10 border-t-4 bg-white px-3 py-2", COR[p.criticidade].borda)}>
                  <span className={cx("self-start rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", COR[p.criticidade].badge)}>
                    {p.criticidade ? CRIT_NOME[p.criticidade] : p.tipo === "atencao" ? "Atenção" : "Risco"}
                  </span>
                  <h4 className="mt-1.5 text-sm font-bold leading-snug text-gray-900">{p.titulo}</h4>
                  {p.descricao && (
                    <p className="mt-1 text-xs text-gray-600">
                      <span className="mr-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">Hoje</span>
                      {p.descricao}
                    </p>
                  )}
                  {p.acao && (
                    <p className="mt-1 text-xs text-gray-800">
                      <span className="mr-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">Decidir</span>
                      {p.acao}
                    </p>
                  )}
                  <div className="mt-auto space-y-1 pt-2 text-[11px] text-gray-600">
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>
                        Dono: <b className="text-gray-900">{p.responsavel || "a definir"}</b>
                      </span>
                      <span>
                        Prazo:{" "}
                        <b className={cx("tabular-nums", vencido || !p.prazo ? "text-red-600" : "text-gray-900")}>
                          {p.prazo ? dm(p.prazo) : p.prazoTxt || "a definir"}
                          {vencido && " (vencido)"}
                        </b>
                      </span>
                    </p>
                    <p className="flex items-center justify-between gap-2">
                      <span>Frentes:</span>
                      <Frentes prog={prog} p={p} abrir={abrirFrente} />
                    </p>
                    {p.fonte && <p className="text-[10px] text-gray-400">Fonte: {p.fonte}</p>}
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <p className="px-4 py-3 text-sm text-gray-500">Nenhum roadblock registrado (Tipo = Risco ou Atenção na tbPontos).</p>
        )}
      </section>
    </div>
  )
}

// ---------------- versão principal: lista de evolução + tabela de decisões ----------------

const ordenarCrit = (ps: Ponto[]) =>
  ps
    .filter((p) => p.tipo === "risco" || p.tipo === "atencao")
    .sort((a, b) => ORDEM.indexOf(a.criticidade) - ORDEM.indexOf(b.criticidade) || (a.prazo?.getTime() ?? Infinity) - (b.prazo?.getTime() ?? Infinity))

const FAIXA: Record<TCrit, string> = { critico: "bg-red-600", alto: "bg-amber-500", medio: "bg-slate-500", baixo: "bg-gray-300", "": "bg-gray-300" }
const nomeCrit = (p: Ponto) => (p.criticidade ? CRIT_NOME[p.criticidade] : p.tipo === "atencao" ? "Atenção" : "Risco")

function ListaEvolucao({ prog, abrir, compacta }: { prog: Programa; abrir: (id: string) => void; compacta?: boolean }) {
  const evol = prog.pontos.filter((p) => p.tipo === "evolucao")
  if (!evol.length) return <p className="px-4 py-3 text-sm text-gray-500">Nenhuma evolução registrada.</p>
  return (
    <ul className="divide-y divide-black/5">
      {evol.map((p) => (
        <li key={p.n} className={cx("flex gap-3", compacta ? "px-4 py-2.5" : "px-6 py-3.5")}>
          <RiCheckboxCircleFill className={cx("shrink-0 text-emerald-600", compacta ? "mt-0.5 size-5" : "mt-0.5 size-6")} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <p className={cx("font-semibold text-gray-900", compacta ? "text-[15px] leading-snug" : "text-lg leading-snug")}>{p.titulo}</p>
              <span className="flex shrink-0 items-center gap-2 pt-0.5">
                <Frentes prog={prog} p={p} abrir={abrir} />
                {!compacta && (p.data || p.prazo) && <span className="text-xs tabular-nums text-gray-500">{dm(p.data ?? p.prazo)}</span>}
              </span>
            </div>
            {p.descricao && <p className={cx("text-gray-600", compacta ? "mt-0.5 line-clamp-2 text-[13px] leading-snug" : "mt-1 text-[15px]")}>{p.descricao}</p>}
          </div>
        </li>
      ))}
    </ul>
  )
}

function TabelaDecisoes({ prog, pontos, abrir, grande }: { prog: Programa; pontos: Ponto[]; abrir: (id: string) => void; grande?: boolean }) {
  const th = "px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500"
  const td = cx("px-3 align-top", grande ? "py-3 text-[15px]" : "py-2.5 text-[13px]")
  return (
    <table className="w-full border-collapse">
      <thead className="border-b border-black/10 bg-black/[0.02]">
        <tr>
          <th className={cx(th, "w-24")}>Nível</th>
          <th className={th}>Ponto · situação hoje</th>
          <th className={th}>Decisão pedida</th>
          <th className={cx(th, "w-36")}>Dono</th>
          <th className={cx(th, "w-24")}>Prazo</th>
          <th className={cx(th, "w-28")}>Frentes</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-black/5">
        {pontos.map((p) => {
          const vencido = p.prazo && p.prazo < hoje
          return (
            <tr key={p.n} className={cx(p.criticidade === "critico" && "bg-red-50/60")}>
              <td className={cx(td, "relative pl-4")}>
                <span className={cx("absolute inset-y-0 left-0 w-1.5", FAIXA[p.criticidade])} />
                <span className={cx("inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", COR[p.criticidade].badge)}>{nomeCrit(p)}</span>
              </td>
              <td className={td}>
                <p className={cx("font-bold leading-snug text-gray-900", grande && "text-base")}>{p.titulo}</p>
                {p.descricao && <p className="mt-0.5 leading-snug text-gray-600">{p.descricao}</p>}
              </td>
              <td className={cx(td, "font-medium leading-snug text-gray-900")}>{p.acao || <span className="text-gray-400">a definir</span>}</td>
              <td className={cx(td, "text-gray-800")}>{p.responsavel || <span className="font-semibold text-red-600">a definir</span>}</td>
              <td className={cx(td, "tabular-nums font-semibold", vencido || !p.prazo ? "text-red-600" : "text-gray-900")}>
                {p.prazo ? dm(p.prazo) : p.prazoTxt || "a definir"}
                {vencido && <span className="block text-[11px] font-medium">vencido</span>}
              </td>
              <td className={td}>
                <Frentes prog={prog} p={p} abrir={abrir} />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function Contadores({ crit }: { crit: Ponto[] }) {
  return (
    <span className="flex items-center gap-1.5 text-xs">
      {ORDEM.filter((c) => c)
        .map((c) => ({ c, n: crit.filter((p) => p.criticidade === c).length }))
        .filter((x) => x.n)
        .map(({ c, n }) => (
          <span key={c} className={cx("rounded-full px-2 py-0.5 font-semibold", COR[c].badge)}>
            {n} {CRIT_NOME[c as Exclude<TCrit, "">].toLowerCase()}
            {n > 1 ? "s" : ""}
          </span>
        ))}
    </span>
  )
}

// Um slide só: evolução em coluna estreita, decisões (Crítico e Alto) em tabela, demais numa linha.
function UmSlide({ prog, abrir }: { prog: Programa; abrir: (id: string) => void }) {
  const crit = ordenarCrit(prog.pontos)
  const topo = crit.filter((p) => p.criticidade === "critico" || p.criticidade === "alto")
  const resto = crit.filter((p) => !topo.includes(p))
  return (
    <div className="mt-3 grid grid-cols-[380px_1fr] gap-3">
      <section className={cx("overflow-hidden", T.card)}>
        <div className="border-b border-black/10 px-4 py-2.5">
          <h3 className={T.painelTitulo}>Evoluções</h3>
        </div>
        <ListaEvolucao prog={prog} abrir={abrir} compacta />
      </section>
      <section className={cx("flex flex-col overflow-hidden", T.card)}>
        <div className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-2.5">
          <h3 className={T.painelTitulo}>Roadblocks · decisões necessárias</h3>
          <Contadores crit={crit} />
        </div>
        <TabelaDecisoes prog={prog} pontos={topo} abrir={abrir} />
        {resto.length > 0 && (
          <p className="mt-auto border-t border-black/10 px-4 py-2 text-[13px] text-gray-600">
            <b className="text-gray-800">
              + {resto.length} roadblock{resto.length > 1 ? "s" : ""} de menor criticidade:
            </b>{" "}
            {resto.map((p) => p.titulo).join(" · ")}
          </p>
        )}
      </section>
    </div>
  )
}

export function Criticidade({ prog, onVoltar, abrirFrente }: { prog: Programa; onVoltar: () => void; abrirFrente: (id: string) => void }) {
  // Principal: um slide (evolução em lista + tabela de decisões). A versão original em cartões fica num botão.
  const [cartoes, setCartoes] = React.useState(false)
  return (
    <div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <button type="button" className={cx("flex items-center gap-1", T.btn)} onClick={onVoltar}>
          <RiArrowLeftSLine className="size-4" /> Voltar à visão executiva
        </button>
        <button
          type="button"
          onClick={() => setCartoes(!cartoes)}
          className="rounded px-1.5 py-0.5 text-xs font-medium text-gray-500 hover:bg-gray-900/5 hover:text-gray-800"
        >
          {cartoes ? "Ver em tabela (1 slide)" : "Ver em cartões"}
        </button>
      </div>
      {cartoes ? <Cartoes prog={prog} abrirFrente={abrirFrente} /> : <UmSlide prog={prog} abrir={abrirFrente} />}
    </div>
  )
}
