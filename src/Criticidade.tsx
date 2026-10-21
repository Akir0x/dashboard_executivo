// Tela "Evolução e pontos críticos": alimentada pela tbPontos (preenchida à mão).
// Evolução = cartões "o que avançou"; Risco e Atenção = cartões de pontos críticos por criticidade.
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

export function Criticidade({ prog, onVoltar, abrirFrente }: { prog: Programa; onVoltar: () => void; abrirFrente: (id: string) => void }) {
  const evol = prog.pontos.filter((p) => p.tipo === "evolucao")
  const crit = prog.pontos
    .filter((p) => p.tipo === "risco" || p.tipo === "atencao")
    .sort((a, b) => ORDEM.indexOf(a.criticidade) - ORDEM.indexOf(b.criticidade) || (a.prazo?.getTime() ?? Infinity) - (b.prazo?.getTime() ?? Infinity))
  const contagem = ORDEM.filter((c) => c).map((c) => ({ c, n: crit.filter((p) => p.criticidade === c).length })).filter((x) => x.n)

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <button type="button" className={cx("flex items-center gap-1", T.btn)} onClick={onVoltar}>
          <RiArrowLeftSLine className="size-4" /> Voltar à visão executiva
        </button>
        <span className="text-xs text-gray-500">Fonte: tbPontos · posição em {dm(prog.painel.leitura)}</span>
      </div>

      {/* evolução */}
      <section className={cx("overflow-hidden", T.card)}>
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-black/10 px-4 py-2">
          <h3 className={T.painelTitulo}>Evolução</h3>
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
          <h3 className={T.painelTitulo}>Pontos críticos de risco e atenção</h3>
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
          <p className="px-4 py-3 text-sm text-gray-500">Nenhum ponto crítico registrado (Tipo = Risco ou Atenção na tbPontos).</p>
        )}
      </section>
    </div>
  )
}
