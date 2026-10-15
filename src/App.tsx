import React from "react"
import { RiArrowLeftSLine, RiArrowRightSLine, RiCloseLine, RiPrinterLine } from "@remixicon/react"
import { cx } from "./utils/cx"
import { fmt, parseData } from "./data"
import { ChipDep } from "./ChipDep"
import { depEntre, Frente, Manual, MARCO_NOME, marcoSt, montar, ordenarCamadas, PRONT_NOME, RISCO_NOME, VEREDITOS } from "./exec"
import { Diamante, ProntIcon, RiscoBars } from "./icones"
import { calcJanela, LegendaPlano, Plano } from "./Plano"
import { Mapa } from "./Mapa"
import { corCamada, T } from "./tema"
import EXEMPLO from "./exemplo.json"

type Linhas = Record<string, unknown>[]
declare global {
  interface Window {
    PAINEL_FLUXO?: Linhas
    FRENTES_FLUXO?: Linhas
    DADOS_FLUXO?: Linhas
    GERADO_EM?: string
  }
}

function carregar() {
  const temFluxo = Array.isArray(window.FRENTES_FLUXO) && window.FRENTES_FLUXO.length > 0
  if (temFluxo) {
    const g = window.GERADO_EM ?? ""
    const gerado = g && !g.startsWith("/*") ? g : ""
    return {
      prog: montar(window.PAINEL_FLUXO ?? [], window.FRENTES_FLUXO!, window.DADOS_FLUXO ?? [], parseData(gerado)),
      exemplo: false,
      gerado,
    }
  }
  const ex = EXEMPLO as { painel: Linhas; frentes: Linhas; iniciativas: Linhas }
  return { prog: montar(ex.painel, ex.frentes, ex.iniciativas), exemplo: true, gerado: "" }
}

function Detalhe({ f, onFechar, prog }: { f: Frente; onFechar: () => void; prog: ReturnType<typeof montar> }) {
  React.useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar()
    window.addEventListener("keydown", esc)
    return () => window.removeEventListener("keydown", esc)
  }, [onFechar])
  const camIdx = ordenarCamadas(prog.frentes).indexOf(f.camada)
  const itens = [...f.iniciativas].sort((a, b) => (a.fim?.getTime() ?? 0) - (b.fim?.getTime() ?? 0))
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/30" onClick={onFechar} role="dialog" aria-modal="true" aria-label={`Detalhe da frente ${f.nome}`}>
      <div className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className={cx("flex size-10 shrink-0 items-center justify-center text-base", T.numBadge, corCamada(camIdx))}>{f.id}</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{f.nome}</h2>
              <p className="text-sm text-gray-500">
                {f.lider} · {f.camada}
                {f.cp && <span className={cx("ml-2", T.cpTag)}>CP</span>}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Data-alvo {fmt(f.alvo)} · último reporte {fmt(f.reporte)}
                {f.atualizado ? " (atualizado)" : " (desatualizado)"}
              </p>
            </div>
          </div>
          <button type="button" onClick={onFechar} className="rounded-md p-1 text-gray-500 hover:bg-gray-100" aria-label="Fechar">
            <RiCloseLine className="size-5" />
          </button>
        </div>

        <h3 className="mt-6 text-sm font-semibold text-gray-900">Prontidão</h3>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["Escopo", f.escopo],
            ["Prazo", f.prazo],
            ["Entregáveis", f.entreg],
            ["Recursos", f.recursos],
          ].map(([n, s]) => (
            <div key={n as string} className="flex items-center gap-2 rounded-md border border-gray-200 px-2.5 py-2">
              <ProntIcon st={s as never} size={20} />
              <span className="text-sm">
                <span className="block text-xs text-gray-500">{n as string}</span>
                {PRONT_NOME[s as keyof typeof PRONT_NOME]}
              </span>
            </div>
          ))}
        </div>
        {f.areas.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {f.areas.map((a) => (
              <span key={a.nome} className="flex items-center gap-1.5 rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-700">
                <ProntIcon st={a.st} size={16} /> {a.nome}: {PRONT_NOME[a.st]}
              </span>
            ))}
          </div>
        )}

        <h3 className="mt-6 text-sm font-semibold text-gray-900">Risco</h3>
        <div className="mt-2 flex items-start gap-3 rounded-md border border-gray-200 p-3">
          <RiscoBars nivel={f.risco} />
          <div className="text-sm">
            <p className="font-medium">{f.risco ? RISCO_NOME[f.risco] : "Não informado"}</p>
            {f.riscoDesc && <p className="text-gray-600">{f.riscoDesc}</p>}
            {f.motivosRisco.length > 0 && <p className="mt-1 text-xs text-red-600">Sinais no painel: {f.motivosRisco.join(", ")}</p>}
          </div>
        </div>

        <h3 className="mt-6 text-sm font-semibold text-gray-900">Interdependências</h3>
        <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
          {[
            ["Recebe de", f.recebe],
            ["Entrega para", f.entrega],
          ].map(([titulo, ids]) => (
            <div key={titulo as string}>
              <p className="text-xs text-gray-500">{titulo as string}</p>
              {(ids as string[]).length ? (
                <ul className="mt-1 space-y-1">
                  {(ids as string[]).map((id) => (
                    <li key={id} className="flex items-center gap-2">
                      <ChipDep prog={prog} d={(titulo === "Recebe de" ? depEntre(prog, id, f.id) : depEntre(prog, f.id, id))!} mostrar={id} />
                      <span className="text-gray-700">{prog.porId.get(id)?.nome}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-gray-400">—</p>
              )}
            </div>
          ))}
        </div>

        <h3 className="mt-6 text-sm font-semibold text-gray-900">Marcos ({itens.length})</h3>
        {itens.length ? (
          <ul className="mt-2 divide-y divide-gray-100 rounded-md border border-gray-200">
            {itens.map((i) => {
              const st = marcoSt(i)
              return (
                <li key={i.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <Diamante st={st} size={12} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-gray-900">{i.macro}</span>
                    <span className="text-xs text-gray-500">
                      {fmt(i.ini)} a {fmt(i.fim)}
                      {i.preds.length > 0 && ` · depende de ${i.preds.join(", ")}`}
                    </span>
                  </span>
                  <span className={cx("shrink-0 text-xs font-medium", st === "atr" ? "text-red-600" : "text-gray-500")}>{MARCO_NOME[st]}</span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="mt-2 rounded-md border border-dashed border-red-300 p-3 text-sm text-red-600">
            Sem cronograma na tbIniciativas{f.alvo ? ` · data-alvo ${fmt(f.alvo)}` : ""}.
          </p>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const [{ prog, exemplo, gerado }] = React.useState(carregar)
  const [aba, setAba] = React.useState<"plano" | "mapa">("plano")
  const [verDeps, setVerDeps] = React.useState(false)
  const [desloc, setDesloc] = React.useState(0)
  const [aberta, setAberta] = React.useState<Frente | null>(null)
  const fechar = React.useCallback(() => setAberta(null), [])

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
  const vNome = VEREDITOS.find((v) => v.k === painel.veredito)?.nome ?? "Sem veredito"

  return (
    <div className={T.page}>
      <div className={T.wrap}>
        {/* ---------- Cabeçalho ---------- */}
        <header className={cx("flex flex-wrap items-center justify-between gap-3", T.headerRule)}>
          <h1 className={T.h1}>{painel.pergunta || "Roadmap executivo"}</h1>
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
                <div className="flex flex-wrap items-center gap-1.5">
                  <button type="button" className={T.btn} onClick={() => setDesloc(desloc - 1)} aria-label="Semana anterior">
                    <RiArrowLeftSLine className="size-4" />
                  </button>
                  <button type="button" className={T.btn} onClick={() => setDesloc(0)} disabled={desloc === 0}>
                    Hoje
                  </button>
                  <button type="button" className={T.btn} onClick={() => setDesloc(desloc + 1)} aria-label="Próxima semana">
                    <RiArrowRightSLine className="size-4" />
                  </button>
                  <span className="px-1 text-xs text-gray-500">
                    S{janela.semanas[0].num}–S{janela.semanas[janela.semanas.length - 1].num}
                  </span>
                  <button type="button" className={verDeps ? T.btnOn : T.btn} onClick={() => setVerDeps(!verDeps)} aria-pressed={verDeps}>
                    Ver dependências
                  </button>
                  <button type="button" className={cx("flex items-center gap-1", T.btnPrimary)} onClick={() => setAba("mapa")}>
                    Mapa de interdependências <RiArrowRightSLine className="size-4" />
                  </button>
                </div>
              </div>
              <Plano prog={prog} janela={janela} verDeps={verDeps} onAbrir={setAberta} />
            </section>
            <footer className="mt-2">
              <LegendaPlano camadas={camadas} />
            </footer>
          </>
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
      <button
        type="button"
        onClick={() => window.print()}
        className="fixed bottom-3 right-3 z-40 flex items-center gap-1 rounded-full border border-gray-300 bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-600 shadow-sm backdrop-blur hover:bg-white print:hidden"
        title="Imprimir ou salvar em PDF (formato slide 16:9)"
      >
        <RiPrinterLine className="size-3.5" /> PDF
      </button>
      {aberta && <Detalhe f={aberta} onFechar={fechar} prog={prog} />}
    </div>
  )
}
