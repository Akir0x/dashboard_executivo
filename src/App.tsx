import React from "react"
import { RiArrowLeftSLine, RiArrowRightSLine, RiEditLine, RiPrinterLine } from "@remixicon/react"
import { cx } from "./utils/cx"
import { fmt, parseData } from "./data"
import { Frente, Manual, montar, ordenarCamadas, VEREDITOS } from "./exec"
import { DetalheFrente } from "./Frente"
import { Criticidade } from "./Criticidade"
import { calcJanela, LegendaPlano, Plano } from "./Plano"
import { Mapa } from "./Mapa"
import { T } from "./tema"
import EXEMPLO from "./exemplo.json"

type Linhas = Record<string, unknown>[]
declare global {
  interface Window {
    PAINEL_FLUXO?: Linhas
    FRENTES_FLUXO?: Linhas
    DADOS_FLUXO?: Linhas
    PONTOS_FLUXO?: Linhas
    GERADO_EM?: string
    EDITAR_URL?: string // preenchido pelo app do Databricks, só para quem pode editar
  }
}

function carregar() {
  const temFluxo = Array.isArray(window.FRENTES_FLUXO) && window.FRENTES_FLUXO.length > 0
  if (temFluxo) {
    const g = window.GERADO_EM ?? ""
    const gerado = g && !g.startsWith("/*") ? g : ""
    return {
      prog: montar(window.PAINEL_FLUXO ?? [], window.FRENTES_FLUXO!, window.DADOS_FLUXO ?? [], parseData(gerado), window.PONTOS_FLUXO ?? []),
      exemplo: false,
      gerado,
    }
  }
  const ex = EXEMPLO as { painel: Linhas; frentes: Linhas; iniciativas: Linhas; pontos: Linhas }
  return { prog: montar(ex.painel, ex.frentes, ex.iniciativas, null, ex.pontos), exemplo: true, gerado: "" }
}

export default function App() {
  const [{ prog, exemplo, gerado }] = React.useState(carregar)
  const [aba, setAba] = React.useState<"plano" | "mapa" | "frente" | "crit">("plano")
  const [frenteSel, setFrenteSel] = React.useState("")
  const [verDeps, setVerDeps] = React.useState(false)
  const [verPront, setVerPront] = React.useState(false) // prontidão nasce oculta
  const [desloc, setDesloc] = React.useState(0)
  const abrirFrente = (id: string) => {
    setFrenteSel(id)
    setAba("frente")
    window.scrollTo(0, 0)
  }
  const setAberta = (f: Frente) => abrirFrente(f.id)

  const { painel, frentes, deps } = prog
  const janela = calcJanela(prog, desloc)
  const N = frentes.length
  // Valor digitado na aba Painel vence o calculado; só o número digitado mantém o denominador calculado.
  const kpi = (m: Manual, n: number, de: number | null, rot: string) => ({ n: m ? m.n : n, de: m ? (m.de ?? de) : de, rot, manual: !!m })
  const M = painel.manual
  const kpis = [
    kpi(M.semCrono, frentes.filter((f) => f.semCrono).length, N, "frentes sem cronograma"),
    kpi(M.depsRisco, deps.filter((d) => d.risco).length, deps.length, "dependências em risco"),
    kpi(M.pendencia, frentes.filter((f) => f.pendente).length, N, "frentes com pendência de prontidão"),
    kpi(M.bloqueios, frentes.reduce((s, f) => s + f.bloqueios, 0), null, "bloqueios de prontidão"),
  ]
  const camadas = ordenarCamadas(frentes)
  const forum = T.eyebrow.includes("Barlow")

  const dm = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`
  const pequeno = "rounded px-1.5 py-0.5 text-xs font-medium text-gray-500 hover:bg-gray-900/5 hover:text-gray-800 disabled:opacity-40 disabled:hover:bg-transparent"
  const vNome = VEREDITOS.find((v) => v.k === painel.veredito)?.nome ?? "Sem veredito"

  return (
    <div className={T.page}>
      <div className={T.wrap}>
        {/* ---------- Cabeçalho ---------- */}
        <header className={cx("flex flex-wrap items-center justify-between gap-3", T.headerRule)}>
          <h1 className={T.h1}>
            {aba === "frente"
              ? "Detalhe da frente"
              : aba === "crit"
                ? painel.tituloEvolucao || "O que avançou e o que ainda trava"
                : painel.pergunta || "Roadmap executivo"}
          </h1>
          {gerado && <span className="text-xs text-gray-500 print:hidden">Atualizado em {gerado}</span>}
        </header>

        {aba === "plano" ? (
          <>
            {/* ---------- Veredito + indicadores (uma faixa só) ---------- */}
            <section className={cx("mt-3 flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-3", T.card)}>
              <div>
                <p className={T.leituraLabel}>Leitura para {dm(painel.leitura)}</p>
                <p
                  className={cx(
                    forum ? "font-['Barlow_Condensed',sans-serif] text-3xl font-bold uppercase leading-none" : "text-2xl font-semibold leading-tight",
                    painel.veredito ? T.vereditoTexto[painel.veredito] : "text-gray-400",
                  )}
                >
                  {vNome}
                </p>
              </div>
              <div className="flex gap-1">
                {VEREDITOS.map((v) => (
                  <span
                    key={v.k}
                    className={cx(
                      "rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset",
                      painel.veredito === v.k ? T.veredito[v.k].on : T.veredito[v.k].off,
                    )}
                  >
                    {v.nome}
                  </span>
                ))}
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-x-7 gap-y-2">
                {kpis.map((k) => (
                  <div key={k.rot} className="flex items-center gap-2">
                    <span className={cx("leading-none", T.kpiNum)}>
                      {k.n}
                      {k.de !== null && <span className="text-base font-medium text-gray-400">/{k.de}</span>}
                    </span>
                    <span className={cx("max-w-28", T.kpiLabel)}>{k.rot}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ---------- Plano ---------- */}
            <section className={cx("mt-3 overflow-hidden", T.card)}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 px-4 py-2 print:hidden">
                <h2 className={T.painelTitulo}>Plano integrado · cronograma e prontidão por frente</h2>
                {/* controles discretos: não competem com o conteúdo */}
                <div className="flex flex-wrap items-center gap-1 text-xs text-gray-500">
                  <button type="button" className={pequeno} onClick={() => setDesloc(desloc - 1)} aria-label="Semana anterior">
                    <RiArrowLeftSLine className="size-3.5" />
                  </button>
                  <button type="button" className={pequeno} onClick={() => setDesloc(0)} disabled={desloc === 0}>
                    Hoje
                  </button>
                  <button type="button" className={pequeno} onClick={() => setDesloc(desloc + 1)} aria-label="Próxima semana">
                    <RiArrowRightSLine className="size-3.5" />
                  </button>
                  <span className="px-1 tabular-nums">
                    S{janela.semanas[0].num}–S{janela.semanas[janela.semanas.length - 1].num}
                  </span>
                  <span className="mx-1 h-3.5 w-px bg-black/15" />
                  <button type="button" className={cx(pequeno, verDeps && "bg-gray-900/5 text-gray-900")} onClick={() => setVerDeps(!verDeps)} aria-pressed={verDeps}>
                    Ver dependências
                  </button>
                  <button type="button" className={cx(pequeno, verPront && "bg-gray-900/5 text-gray-900")} onClick={() => setVerPront(!verPront)} aria-pressed={verPront}>
                    Prontidão
                  </button>
                  <button type="button" className={cx(pequeno, "flex items-center gap-0.5")} onClick={() => setAba("mapa")}>
                    Mapa de interdependências <RiArrowRightSLine className="size-3.5" />
                  </button>
                  <button type="button" className={cx(pequeno, "flex items-center gap-0.5")} onClick={() => setAba("crit")}>
                    Evolução e pontos críticos <RiArrowRightSLine className="size-3.5" />
                  </button>
                </div>
              </div>
              <Plano prog={prog} janela={janela} verDeps={verDeps} verPront={verPront} setVerPront={setVerPront} onAbrir={setAberta} />
            </section>
            <footer className="mt-2">
              <LegendaPlano camadas={camadas} />
            </footer>
          </>
        ) : aba === "frente" ? (
          <DetalheFrente prog={prog} frenteId={frenteSel} setFrente={setFrenteSel} janela={janela} onVoltar={() => setAba("plano")} />
        ) : aba === "crit" ? (
          <Criticidade prog={prog} onVoltar={() => setAba("plano")} abrirFrente={abrirFrente} />
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <button type="button" className={cx("flex items-center gap-1", T.btn)} onClick={() => setAba("plano")}>
                <RiArrowLeftSLine className="size-4" /> Voltar à visão executiva
              </button>
              <h2 className={T.painelTitulo}>Mapa de interdependências</h2>
            </div>
            <section className="mt-3">
              <Mapa prog={prog} onAbrir={setAberta} />
            </section>
          </>
        )}
      </div>
      <div className="fixed bottom-3 right-3 z-40 flex items-center gap-2 print:hidden">
        {window.EDITAR_URL && (
          <a
            href={window.EDITAR_URL}
            className="flex items-center gap-1 rounded-full border border-gray-300 bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-600 shadow-sm backdrop-blur hover:bg-white"
            title="Editar os dados do painel"
          >
            <RiEditLine className="size-3.5" /> Editar
          </a>
        )}
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-1 rounded-full border border-gray-300 bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-600 shadow-sm backdrop-blur hover:bg-white"
          title="Imprimir ou salvar em PDF (formato slide 16:9)"
        >
          <RiPrinterLine className="size-3.5" /> PDF
        </button>
      </div>
    </div>
  )
}
