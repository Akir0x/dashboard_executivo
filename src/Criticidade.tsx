// Tela "Evoluções e roadblocks": alimentada pela tbPontos (preenchida à mão).
// Evolução = evoluções; Risco e Atenção = roadblocks por criticidade.
import React from "react";
import { RiArrowLeftSLine, RiCheckboxCircleFill } from "@remixicon/react";
import { cx } from "./utils/cx";
import { hoje } from "./data";
import { Criticidade as TCrit, CRIT_NOME, Ponto, Programa } from "./exec";
import { ChipFrente } from "./Frente";
import { T } from "./tema";
import { CAIXA, ROLA } from "./caixa";

const dm = (d: Date | null) =>
  d
    ? `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`
    : "";
const ORDEM: TCrit[] = ["critico", "alto", "medio", "baixo", ""];
const COR: Record<TCrit, { borda: string; badge: string }> = {
  critico: { borda: "border-t-red-600", badge: "bg-red-600 text-white" },
  alto: { borda: "border-t-amber-500", badge: "bg-amber-500 text-white" },
  medio: { borda: "border-t-slate-500", badge: "bg-slate-600 text-white" },
  baixo: { borda: "border-t-gray-300", badge: "bg-gray-200 text-gray-700" },
  "": { borda: "border-t-gray-300", badge: "bg-gray-100 text-gray-600" },
};

function Frentes({
  prog,
  p,
  abrir,
}: {
  prog: Programa;
  p: Ponto;
  abrir: (id: string) => void;
}) {
  if (p.todas)
    return (
      <span className="rounded bg-gray-800 px-1.5 text-[10px] font-bold uppercase text-white">
        Todas
      </span>
    );
  return (
    <span className="flex flex-wrap gap-1">
      {p.frentes.map((id) => (
        <ChipFrente
          key={id}
          prog={prog}
          id={id}
          onClick={prog.porId.has(id) ? () => abrir(id) : undefined}
        />
      ))}
    </span>
  );
}

function Cartoes({
  prog,
  abrirFrente,
}: {
  prog: Programa;
  abrirFrente: (id: string) => void;
}) {
  const evol = prog.pontos.filter((p) => p.tipo === "evolucao");
  const crit = prog.pontos
    .filter((p) => p.tipo !== "evolucao") // roadblocks = Risco, Atenção e Pendência
    .sort(
      (a, b) =>
        ORDEM.indexOf(a.criticidade) - ORDEM.indexOf(b.criticidade) ||
        (a.prazo?.getTime() ?? Infinity) - (b.prazo?.getTime() ?? Infinity),
    );
  const contagem = ORDEM.filter((c) => c)
    .map((c) => ({ c, n: crit.filter((p) => p.criticidade === c).length }))
    .filter((x) => x.n);

  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3 print:block print:space-y-3">
      {/* evolução */}
      <section className={cx(CAIXA, "max-h-[45%] print:max-h-none", T.card)}>
        <div className="flex shrink-0 flex-wrap items-baseline justify-between gap-2 border-b border-black/10 px-4 py-2">
          <h3 className={T.painelTitulo}>Evoluções</h3>
          <span className="text-[11px] text-gray-500">
            {evol.length} atualizaç{evol.length === 1 ? "ão" : "ões"}
          </span>
        </div>
        {evol.length ? (
          <div className={cx(ROLA, "grid grid-cols-1 content-start gap-3 p-3 md:grid-cols-2 xl:grid-cols-4")}>
            {evol.map((p) => (
              <article
                key={p.n}
                className="rounded-md border border-black/10 border-l-4 border-l-emerald-500 bg-white px-3 py-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                    <RiCheckboxCircleFill className="size-4 shrink-0 text-emerald-600" />
                    {p.titulo}
                  </p>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <Frentes prog={prog} p={p} abrir={abrirFrente} />
                    {(p.data || p.prazo) && (
                      <span className="text-[11px] tabular-nums text-gray-500">
                        {dm(p.data ?? p.prazo)}
                      </span>
                    )}
                  </span>
                </div>
                <p className="mt-1 line-clamp-4 text-xs text-gray-600">
                  {p.descricao}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="px-4 py-3 text-sm text-gray-500">
            Nenhuma evolução registrada (Tipo = Evolução na tbPontos).
          </p>
        )}
      </section>

      {/* pontos críticos */}
      <section className={cx(CAIXA, "min-h-[260px] flex-1 basis-0", T.card)}>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-black/10 px-4 py-2">
          <h3 className={T.painelTitulo}>Roadblocks</h3>
          <span className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
            {contagem.map(({ c, n }) => (
              <span
                key={c}
                className={cx(
                  "rounded-full px-2 py-0.5 font-semibold",
                  COR[c].badge,
                )}
              >
                {n} {CRIT_NOME[c as Exclude<TCrit, "">].toLowerCase()}
                {n > 1 ? "s" : ""}
              </span>
            ))}
            <span className="ml-1">
              cada ponto com a decisão necessária, dono e prazo
            </span>
          </span>
        </div>
        {crit.length ? (
          <div className={cx(ROLA, "grid grid-cols-1 content-start gap-3 p-3 md:grid-cols-2 xl:grid-cols-4")}>
            {crit.map((p) => {
              const vencido = p.prazo && p.prazo < hoje;
              return (
                <article
                  key={p.n}
                  className={cx(
                    "flex flex-col rounded-md border border-black/10 border-t-4 bg-white px-3 py-2",
                    COR[p.criticidade].borda,
                  )}
                >
                  {p.criticidade ? (
                    <>
                      <span
                        className={cx(
                          "self-start rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          COR[p.criticidade].badge,
                        )}
                      >
                        {nomeCrit(p)}
                      </span>
                      <span className="mt-1 self-start">
                        <TipoTag p={p} />
                      </span>
                    </>
                  ) : (
                    <span className="self-start">
                      <TipoTag p={p} />
                    </span>
                  )}
                  <h4 className="mt-1.5 text-sm font-bold leading-snug text-gray-900">
                    {p.titulo}
                  </h4>
                  {p.descricao && (
                    <p className="mt-1 text-xs text-gray-600">
                      <span className="mr-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                        Hoje
                      </span>
                      {p.descricao}
                    </p>
                  )}
                  {p.acao && (
                    <p className="mt-1 text-xs text-gray-800">
                      <span className="mr-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                        Decidir
                      </span>
                      {p.acao}
                    </p>
                  )}
                  <div className="mt-auto space-y-1 pt-2 text-[11px] text-gray-600">
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>
                        Dono:{" "}
                        <b className="text-gray-900">
                          {p.responsavel || "a definir"}
                        </b>
                      </span>
                      <span>
                        Prazo:{" "}
                        <b
                          className={cx(
                            "tabular-nums",
                            vencido || !p.prazo
                              ? "text-red-600"
                              : "text-gray-900",
                          )}
                        >
                          {p.prazo ? dm(p.prazo) : p.prazoTxt || "a definir"}
                          {vencido && " (vencido)"}
                        </b>
                      </span>
                    </p>
                    <p className="flex items-center justify-between gap-2">
                      <span>Frentes:</span>
                      <Frentes prog={prog} p={p} abrir={abrirFrente} />
                    </p>
                    {p.fonte && (
                      <p className="text-[10px] text-gray-400">
                        Fonte: {p.fonte}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="px-4 py-3 text-sm text-gray-500">
            Nenhum roadblock registrado (Tipo = Risco ou Atenção na tbPontos).
          </p>
        )}
      </section>
    </div>
  );
}

// ---------------- versão principal: lista de evolução + tabela de decisões ----------------

const ordenarCrit = (ps: Ponto[]) =>
  ps
    .filter((p) => p.tipo !== "evolucao") // roadblocks = Risco, Atenção e Pendência
    .sort(
      (a, b) =>
        ORDEM.indexOf(a.criticidade) - ORDEM.indexOf(b.criticidade) ||
        (a.prazo?.getTime() ?? Infinity) - (b.prazo?.getTime() ?? Infinity),
    );

const FAIXA: Record<TCrit, string> = {
  critico: "bg-red-600",
  alto: "bg-amber-500",
  medio: "bg-slate-500",
  baixo: "bg-gray-300",
  "": "bg-gray-300",
};
const nomeCrit = (p: Ponto) =>
  p.criticidade ? CRIT_NOME[p.criticidade] : TIPO_CURTO[p.tipo];

// Tipo do roadblock: etiqueta com contorno, cor própria por tipo (Pendência em azul-ardósia, tracejada).
const TIPO_CURTO: Record<Ponto["tipo"], string> = {
  evolucao: "Evolução",
  risco: "Risco",
  atencao: "Atenção",
  pendencia: "Pendência",
};
const TIPO_COR: Record<Ponto["tipo"], string> = {
  evolucao: "border-emerald-500 text-emerald-700",
  risco: "border-red-500 text-red-700",
  atencao: "border-amber-500 text-amber-700",
  pendencia: "border-dashed border-sky-600 text-sky-700",
};
export function TipoTag({ p }: { p: Ponto }) {
  return (
    <span
      className={cx(
        "inline-block rounded border bg-white px-1.5 py-px text-[10px] font-bold uppercase tracking-wide",
        TIPO_COR[p.tipo],
      )}
    >
      {TIPO_CURTO[p.tipo]}
    </span>
  );
}
function ContTipos({ crit }: { crit: Ponto[] }) {
  const n = (t: Ponto["tipo"]) => crit.filter((p) => p.tipo === t).length;
  const itens = [
    [n("risco"), "risco", "riscos"],
    [n("atencao"), "atenção", "atenções"],
    [n("pendencia"), "pendência", "pendências"],
  ].filter((x) => x[0]) as [number, string, string][];
  return (
    <span className="text-[11px] text-gray-500">
      {itens.map(([q, um, v]) => `${q} ${q > 1 ? v : um}`).join(" · ")}
    </span>
  );
}

function ListaEvolucao({
  prog,
  abrir,
  compacta,
}: {
  prog: Programa;
  abrir: (id: string) => void;
  compacta?: boolean;
}) {
  const evol = prog.pontos.filter((p) => p.tipo === "evolucao");
  if (!evol.length)
    return (
      <p className="px-4 py-3 text-sm text-gray-500">
        Nenhuma evolução registrada.
      </p>
    );
  return (
    <ul className="divide-y divide-black/5">
      {evol.map((p) => (
        <li
          key={p.n}
          className={cx("flex gap-3", compacta ? "px-4 py-2.5" : "px-6 py-3.5")}
        >
          <RiCheckboxCircleFill
            className={cx(
              "shrink-0 text-emerald-600",
              compacta ? "mt-0.5 size-5" : "mt-0.5 size-6",
            )}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <p
                className={cx(
                  "font-semibold text-gray-900",
                  compacta
                    ? "text-[15px] leading-snug"
                    : "text-lg leading-snug",
                )}
              >
                {p.titulo}
              </p>
              <span className="flex shrink-0 items-center gap-2 pt-0.5">
                <Frentes prog={prog} p={p} abrir={abrir} />
                {!compacta && (p.data || p.prazo) && (
                  <span className="text-xs tabular-nums text-gray-500">
                    {dm(p.data ?? p.prazo)}
                  </span>
                )}
              </span>
            </div>
            {p.descricao && (
              <p
                className={cx(
                  "text-gray-600",
                  compacta
                    ? "mt-0.5 line-clamp-2 text-[13px] leading-snug"
                    : "mt-1 text-[15px]",
                )}
              >
                {p.descricao}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function TabelaDecisoes({
  prog,
  pontos,
  abrir,
  grande,
}: {
  prog: Programa;
  pontos: Ponto[];
  abrir: (id: string) => void;
  grande?: boolean;
}) {
  const th =
    "px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500";
  const td = cx(
    "px-3 align-top",
    grande ? "py-3 text-[15px]" : "py-2.5 text-[13px]",
  );
  return (
    <table className="w-full border-collapse">
      <thead className="sticky top-0 z-10 border-b border-black/10 bg-gray-50 print:static">
        <tr>
          <th className={cx(th, "w-24")}>Nível · tipo</th>
          <th className={th}>Ponto · situação hoje</th>
          <th className={th}>Decisão / plano de ação</th>
          <th className={cx(th, "w-36")}>Dono</th>
          <th className={cx(th, "w-24")}>Prazo</th>
          <th className={cx(th, "w-28")}>Frentes</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-black/5">
        {pontos.map((p) => {
          const vencido = p.prazo && p.prazo < hoje;
          return (
            <tr
              key={p.n}
              className={cx(p.criticidade === "critico" && "bg-red-50/60")}
            >
              <td className={cx(td, "relative pl-4")}>
                <span
                  className={cx(
                    "absolute inset-y-0 left-0 w-1.5",
                    FAIXA[p.criticidade],
                  )}
                />
                {p.criticidade ? (
                  <>
                    <span
                      className={cx(
                        "inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        COR[p.criticidade].badge,
                      )}
                    >
                      {nomeCrit(p)}
                    </span>
                    <span className="mt-1 block">
                      <TipoTag p={p} />
                    </span>
                  </>
                ) : (
                  <TipoTag p={p} />
                )}
              </td>
              <td className={td}>
                <p
                  className={cx(
                    "font-bold leading-snug text-gray-900",
                    grande && "text-base",
                  )}
                >
                  {p.titulo}
                </p>
                {p.descricao && (
                  <p className="mt-0.5 leading-snug text-gray-600">
                    {p.descricao}
                  </p>
                )}
              </td>
              <td className={cx(td, "font-medium leading-snug text-gray-900")}>
                {p.acao || <span className="text-gray-400">a definir</span>}
              </td>
              <td className={cx(td, "text-gray-800")}>
                {p.responsavel || (
                  <span className="font-semibold text-red-600">a definir</span>
                )}
              </td>
              <td
                className={cx(
                  td,
                  "tabular-nums font-semibold",
                  vencido || !p.prazo ? "text-red-600" : "text-gray-900",
                )}
              >
                {p.prazo ? dm(p.prazo) : p.prazoTxt || "a definir"}
                {vencido && (
                  <span className="block text-[11px] font-medium">vencido</span>
                )}
              </td>
              <td className={td}>
                <Frentes prog={prog} p={p} abrir={abrir} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Contadores({ crit }: { crit: Ponto[] }) {
  return (
    <span className="flex items-center gap-1.5 text-xs">
      {ORDEM.filter((c) => c)
        .map((c) => ({ c, n: crit.filter((p) => p.criticidade === c).length }))
        .filter((x) => x.n)
        .map(({ c, n }) => (
          <span
            key={c}
            className={cx(
              "rounded-full px-2 py-0.5 font-semibold",
              COR[c].badge,
            )}
          >
            {n} {CRIT_NOME[c as Exclude<TCrit, "">].toLowerCase()}
            {n > 1 ? "s" : ""}
          </span>
        ))}
    </span>
  );
}

// Um slide só: evolução em coluna estreita, decisões (Crítico e Alto) em tabela, demais numa linha.
function UmSlide({
  prog,
  abrir,
}: {
  prog: Programa;
  abrir: (id: string) => void;
}) {
  const crit = ordenarCrit(prog.pontos);
  // Sem corte por criticidade (a pedido): todos os roadblocks entram na tabela, ordenados por criticidade e prazo.
  return (
    <div className="mt-3 grid min-h-0 flex-1 grid-cols-[380px_1fr] grid-rows-[minmax(0,1fr)] items-start gap-3 print:block">
      <section className={cx(CAIXA, "max-h-full", T.card)}>
        <div className="shrink-0 border-b border-black/10 px-4 py-2.5">
          <h3 className={T.painelTitulo}>Evoluções</h3>
        </div>
        <div className={ROLA}>
          <ListaEvolucao prog={prog} abrir={abrir} compacta />
        </div>
      </section>
      <section className={cx(CAIXA, "max-h-full print:mt-3", T.card)}>
        <div className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-2.5">
          <h3 className={T.painelTitulo}>Roadblocks · decisões necessárias</h3>
          <span className="flex items-center gap-3">
            <ContTipos crit={crit} />
            <Contadores crit={crit} />
          </span>
        </div>
        <div className={ROLA}>
          <TabelaDecisoes prog={prog} pontos={crit} abrir={abrir} />
        </div>
      </section>
    </div>
  );
}

export function Criticidade({
  prog,
  onVoltar,
  abrirFrente,
}: {
  prog: Programa;
  onVoltar: () => void;
  abrirFrente: (id: string) => void;
}) {
  // Principal: um slide (evolução em lista + tabela de decisões). A versão original em cartões fica num botão.
  const [cartoes, setCartoes] = React.useState(false);
  const [frente, setFrente] = React.useState(""); // "" = todas; pontos marcados "Todas" aparecem em qualquer filtro
  const [dono, setDono] = React.useState(""); // "" = todos; filtro pelo nome do responsável (coluna Responsavel)
  const donos = [
    ...new Set(prog.pontos.map((p) => p.responsavel).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const progF: Programa =
    frente || dono
      ? {
          ...prog,
          pontos: prog.pontos.filter(
            (p) =>
              (!frente || p.todas || p.frentes.includes(frente)) &&
              (!dono || p.responsavel === dono),
          ),
        }
      : prog;
  const sel = (ativo: string) =>
    cx(
      "rounded border bg-white px-2 py-1 text-sm font-medium text-gray-800",
      ativo ? "border-gray-800" : "border-gray-300",
    );
  return (
    <div className="flex min-h-0 flex-1 flex-col print:block">
      <div className="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-2 print:hidden">
        <button
          type="button"
          className={cx("flex items-center gap-1", T.btn)}
          onClick={onVoltar}
        >
          <RiArrowLeftSLine className="size-4" /> Voltar à visão executiva
        </button>
        <span className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-gray-500">
            Frente
            <select
              value={frente}
              onChange={(e) => setFrente(e.target.value)}
              className={cx(
                "rounded border bg-white px-2 py-1 text-sm font-medium text-gray-800",
                frente ? "border-gray-800" : "border-gray-300",
              )}
            >
              <option value="">Todas as frentes</option>
              {prog.frentes.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.id} · {f.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-gray-500">
            Dono
            <select
              value={dono}
              onChange={(e) => setDono(e.target.value)}
              className={sel(dono)}
            >
              <option value="">Todos</option>
              {donos.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setCartoes(!cartoes)}
            className="rounded px-1.5 py-0.5 text-xs font-medium text-gray-500 hover:bg-gray-900/5 hover:text-gray-800"
          >
            {cartoes ? "Ver em tabela (1 slide)" : "Ver em cartões"}
          </button>
        </span>
      </div>
      {prog.pontos.length === 0 && (
        <p className="mt-2 shrink-0 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 print:hidden">
          {prog.pontosLidos === 0
            ? "Nenhuma linha da tbPontos chegou ao painel. Confira se o fluxo tem a ação Listar_tbPontos e o replace do marcador PONTOS no Montar_HTML, e se o modelo é a versão nova do HTML."
            : `${prog.pontosLidos} linha(s) da tbPontos chegaram, mas nenhuma tem Titulo ou Descricao preenchidos (confira os nomes das colunas).`}
        </p>
      )}
      {(frente || dono) && (
        <p className="mt-2 shrink-0 text-sm text-gray-600 print:mt-1">
          Filtrado:{" "}
          {frente && (
            <>
              <b className="text-gray-900">
                {prog.porId.get(frente)?.nome ?? frente}
              </b>{" "}
              (inclui os itens marcados como Todas)
            </>
          )}
          {frente && dono && " · "}
          {dono && (
            <>
              dono <b className="text-gray-900">{dono}</b>
            </>
          )}
        </p>
      )}
      {cartoes ? (
        <Cartoes prog={progF} abrirFrente={abrirFrente} />
      ) : (
        <UmSlide prog={progF} abrir={abrirFrente} />
      )}
    </div>
  );
}
