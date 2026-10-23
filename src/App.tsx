import React from "react";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiEditLine,
  RiPrinterLine,
} from "@remixicon/react";
import { cx } from "./utils/cx";
import { fmt, parseData } from "./data";
import { Frente, Manual, montar, ordenarCamadas, VEREDITOS } from "./exec";
import { DetalheFrente } from "./Frente";
import { Criticidade } from "./Criticidade";
import { calcJanela, LegendaPlano, Plano } from "./Plano";
import { Mapa } from "./Mapa";
import { T } from "./tema";
import { CAIXA, TELA } from "./caixa";
import EXEMPLO from "./exemplo.json";

type Linhas = Record<string, unknown>[];
declare global {
  interface Window {
    PAINEL_FLUXO?: Linhas;
    FRENTES_FLUXO?: Linhas;
    DADOS_FLUXO?: Linhas;
    PONTOS_FLUXO?: Linhas;
    GERADO_EM?: string;
    EDITAR_URL?: string; // preenchido pelo app do Databricks, só para quem pode editar
  }
}

function carregar() {
  const temFluxo =
    Array.isArray(window.FRENTES_FLUXO) && window.FRENTES_FLUXO.length > 0;
  if (temFluxo) {
    const g = window.GERADO_EM ?? "";
    const gerado = g && !g.startsWith("/*") ? g : "";
    return {
      prog: montar(
        window.PAINEL_FLUXO ?? [],
        window.FRENTES_FLUXO!,
        window.DADOS_FLUXO ?? [],
        parseData(gerado),
        window.PONTOS_FLUXO ?? [],
      ),
      exemplo: false,
      gerado,
    };
  }
  const ex = EXEMPLO as {
    painel: Linhas;
    frentes: Linhas;
    iniciativas: Linhas;
    pontos: Linhas;
  };
  return {
    prog: montar(ex.painel, ex.frentes, ex.iniciativas, null, ex.pontos),
    exemplo: true,
    gerado: "",
  };
}

export default function App() {
  const [{ prog, exemplo, gerado }] = React.useState(carregar);
  const [aba, setAba] = React.useState<"plano" | "mapa" | "frente" | "crit">(
    "plano",
  );
  const [frenteSel, setFrenteSel] = React.useState("");
  const [verDeps, setVerDeps] = React.useState(false);
  const [verPront, setVerPront] = React.useState(false); // prontidão nasce oculta
  const [desloc, setDesloc] = React.useState(0);
  const abrirFrente = (id: string) => {
    setFrenteSel(id);
    setAba("frente");
    window.scrollTo(0, 0);
  };
  const setAberta = (f: Frente) => abrirFrente(f.id);

  const { painel, frentes, deps } = prog;
  const janela = calcJanela(prog, desloc);
  const N = frentes.length;
  // Valor digitado na aba Painel vence o calculado; só o número digitado mantém o denominador calculado.
  const kpi = (m: Manual, n: number, de: number | null, rot: string) => ({
    n: m ? m.n : n,
    de: m ? (m.de ?? de) : de,
    rot,
    manual: !!m,
  });
  const M = painel.manual;
  const roadblocks = prog.pontos.filter((p) => p.tipo !== "evolucao");
  const ativInter = new Set<string>();
  const ativRisco = new Set<string>();
  deps.forEach((d) =>
    d.macros.forEach((m) => {
      ativInter.add(m.pre.id).add(m.suc.id);
      if (m.atrasada || m.conflito) ativRisco.add(m.pre.id).add(m.suc.id);
    }),
  );
  const kpis = [
    kpi(
      M.semCrono,
      frentes.filter((f) => f.semCrono).length,
      N,
      "frentes sem cronograma",
    ),
    // 2º: roadblocks (tbPontos) Crítico ou Alto / total de roadblocks. Valor manual: coluna DependenciasEmRisco (nome mantido).
    kpi(
      M.depsRisco,
      roadblocks.filter(
        (p) => p.criticidade === "critico" || p.criticidade === "alto",
      ).length,
      roadblocks.length,
      "pontos críticos e de alto risco",
    ),
    // 3º: macroatividades em ligações entre frentes em risco (predecessora atrasada ou conflito de datas) / macroatividades com interdependência.
    // Valor manual: coluna FrentesComPendencia (nome mantido).
    kpi(
      M.pendencia,
      ativRisco.size,
      ativInter.size,
      "atividades com interdep. em risco",
    ),
    // "bloqueios de prontidão" removido a pedido (coluna BloqueiosProntidao da tbPainel fica sem uso)
  ];
  const camadas = ordenarCamadas(frentes);
  const forum = T.eyebrow.includes("Barlow");

  const dm = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  const pequeno =
    "rounded px-1.5 py-0.5 text-xs font-medium text-gray-500 hover:bg-gray-900/5 hover:text-gray-800 disabled:opacity-40 disabled:hover:bg-transparent";
  const vNome =
    VEREDITOS.find((v) => v.k === painel.veredito)?.nome ?? "Sem veredito";

  return (
    <div className={T.page}>
      <div className={T.wrap}>
        {/* ---------- Cabeçalho ---------- */}
        <header
          className={cx(
            "flex shrink-0 flex-wrap items-center justify-between gap-3",
            T.headerRule,
          )}
        >
          <h1 className={T.h1}>
            {aba === "frente"
              ? "Detalhe da frente"
              : aba === "crit"
                ? painel.tituloEvolucao || "Evoluções e roadblocks"
                : painel.pergunta || "Roadmap executivo"}
          </h1>
          <div className="flex items-center gap-4 print:hidden">
            {/* navegação entre as telas, no topo */}
            <nav className="flex items-center gap-1">
              {(
                [
                  ["plano", "Visão executiva"],
                  ["mapa", "Mapa de interdependências (WIP)"],
                  ["crit", "Evoluções e roadblocks"],
                ] as const
              ).map(([k, t]) => (
                <button
                  key={k}
                  type="button"
                  // Mapa indisponível por enquanto (WIP): botão visível, mas desativado.
                  disabled={k === "mapa"}
                  title={k === "mapa" ? "Em construção — indisponível por enquanto" : undefined}
                  onClick={() => {
                    setAba(k);
                    window.scrollTo(0, 0);
                  }}
                  className={cx(
                    "rounded-full px-3 py-1 text-sm font-semibold",
                    k === "mapa"
                      ? "cursor-not-allowed text-gray-400"
                      : aba === k
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:bg-gray-900/5 hover:text-gray-900",
                  )}
                  aria-current={aba === k ? "page" : undefined}
                >
                  {t}
                </button>
              ))}
            </nav>
            {gerado && (
              <span className="text-xs text-gray-500">
                Atualizado em {gerado}
              </span>
            )}
          </div>
        </header>

        {aba === "plano" ? (
          <>
            {/* ---------- Veredito + indicadores (uma faixa só) ---------- */}
            <section
              className={cx(
                "mt-3 flex shrink-0 flex-wrap items-center gap-x-8 gap-y-3 px-5 py-3",
                T.card,
              )}
            >
              {/* veredito: só a escala dos 3 estados, com o escolhido em destaque */}
              <div>
                <p className={cx("mb-1.5", T.leituraLabel)}>
                  Leitura para {dm(painel.leitura)}
                </p>
                <div className="flex gap-1.5" title={vNome}>
                  {VEREDITOS.map((v) => (
                    <span
                      key={v.k}
                      className={cx(
                        "rounded px-3 py-1.5 font-bold uppercase tracking-wide ring-1 ring-inset",
                        forum
                          ? "font-['Barlow_Condensed',sans-serif] text-base"
                          : "text-sm",
                        painel.veredito === v.k
                          ? T.veredito[v.k].on
                          : T.veredito[v.k].off,
                      )}
                    >
                      {v.nome}
                    </span>
                  ))}
                </div>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-x-7 gap-y-2">
                {kpis.map((k) => (
                  <div key={k.rot} className="flex items-center gap-2">
                    <span className={cx("leading-none", T.kpiNum)}>
                      {k.n}
                      {k.de !== null && (
                        <span className="text-base font-medium text-gray-400">
                          /{k.de}
                        </span>
                      )}
                    </span>
                    <span className={cx("max-w-28", T.kpiLabel)}>{k.rot}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ---------- Plano ---------- */}
            <section className={cx("mt-3", CAIXA, T.card)}>
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-black/10 px-4 py-2 print:hidden">
                <h2 className={T.painelTitulo}>
                  Plano integrado · cronograma e prontidão por frente
                </h2>
                {/* controles discretos: não competem com o conteúdo */}
                <div className="flex flex-wrap items-center gap-1 text-xs text-gray-500">
                  <button
                    type="button"
                    className={pequeno}
                    onClick={() => setDesloc(desloc - 1)}
                    aria-label="Semana anterior"
                  >
                    <RiArrowLeftSLine className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className={pequeno}
                    onClick={() => setDesloc(0)}
                    disabled={desloc === 0}
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    className={pequeno}
                    onClick={() => setDesloc(desloc + 1)}
                    aria-label="Próxima semana"
                  >
                    <RiArrowRightSLine className="size-3.5" />
                  </button>
                  <span className="px-1 tabular-nums">
                    S{janela.semanas[0].num}–S
                    {janela.semanas[janela.semanas.length - 1].num}
                  </span>
                  <span className="mx-1 h-3.5 w-px bg-black/15" />
                  <button
                    type="button"
                    className={cx(
                      pequeno,
                      verDeps && "bg-gray-900/5 text-gray-900",
                    )}
                    onClick={() => setVerDeps(!verDeps)}
                    aria-pressed={verDeps}
                  >
                    Ver dependências
                  </button>
                  <button
                    type="button"
                    className={cx(
                      pequeno,
                      verPront && "bg-gray-900/5 text-gray-900",
                    )}
                    onClick={() => setVerPront(!verPront)}
                    aria-pressed={verPront}
                  >
                    Prontidão
                  </button>
                </div>
              </div>
              <Plano
                prog={prog}
                janela={janela}
                verDeps={verDeps}
                verPront={verPront}
                setVerPront={setVerPront}
                onAbrir={setAberta}
              />
            </section>
            <footer className="mt-2 shrink-0">
              <LegendaPlano camadas={camadas} />
            </footer>
          </>
        ) : aba === "frente" ? (
          <DetalheFrente
            prog={prog}
            frenteId={frenteSel}
            setFrente={setFrenteSel}
            janela={janela}
            onVoltar={() => setAba("plano")}
          />
        ) : aba === "crit" ? (
          <Criticidade
            prog={prog}
            onVoltar={() => setAba("plano")}
            abrirFrente={abrirFrente}
          />
        ) : (
          <div className={TELA}>
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                className={cx("flex items-center gap-1", T.btn)}
                onClick={() => setAba("plano")}
              >
                <RiArrowLeftSLine className="size-4" /> Voltar à visão executiva
              </button>
              <h2 className={T.painelTitulo}>Mapa de interdependências</h2>
            </div>
            <Mapa prog={prog} onAbrir={setAberta} />
          </div>
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
  );
}
