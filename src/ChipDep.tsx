import { Tooltip } from "./components/Tooltip"
import { cx } from "./utils/cx"
import { Dependencia, Programa } from "./exec"
import { T } from "./tema"

export const estiloChip = (d: Pick<Dependencia, "comprovada" | "risco">) =>
  d.comprovada ? (d.risco ? T.chipRisco : T.chip) : d.risco ? T.chipHipRisco : T.chipHip

export const rotuloDep = (d: Dependencia) =>
  !d.declarada ? "não declarada na tbFrentes" : d.comprovada ? "comprovada pelas macroatividades" : "hipótese: declarada, sem macroatividade ligada"

// Chip de interdependência: cheio = comprovada por macroatividade · tracejado = hipótese · "!" = não declarada.
export function ChipDep({ prog, d, mostrar }: { prog: Programa; d: Dependencia; mostrar: string }) {
  const outra = prog.porId.get(mostrar)
  return (
    <Tooltip
      asChild
      side="top"
      showArrow={false}
      className="max-w-80"
      content={
        <div className="space-y-0.5">
          <p className="font-semibold">
            {d.de} → {d.para} · {outra?.nome}
          </p>
          <p>{rotuloDep(d)}</p>
          {d.macros.slice(0, 4).map((m) => (
            <p key={m.pre.id + m.suc.id} className="opacity-90">
              {m.pre.macro} → {m.suc.macro}
              {m.atrasada ? " (atrasada)" : m.conflito ? " (conflito de datas)" : ""}
            </p>
          ))}
          {d.macros.length > 4 && <p className="opacity-80">+ {d.macros.length - 4} ligações</p>}
          {d.risco && <p className="font-semibold">Em risco: {d.motivo}</p>}
        </div>
      }
    >
      <span className={cx("relative inline-block min-w-[22px] cursor-default text-center", estiloChip(d))}>
        {mostrar}
        {!d.declarada && (
          <span className="absolute -right-1 -top-1.5 flex size-3 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold leading-none text-white">!</span>
        )}
      </span>
    </Tooltip>
  )
}
