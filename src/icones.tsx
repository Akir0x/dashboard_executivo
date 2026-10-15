import { MarcoSt, Pront, Risco } from "./exec"
import { cx } from "./utils/cx"

// Ícone de prontidão: ✓ OK, meio círculo Parcial, ✕ Bloqueio, ? Sem informação.
export function ProntIcon({ st, size = 22 }: { st: Pront; size?: number }) {
  const r = 9
  if (st === "na")
    return (
      <svg width={size} height={size} viewBox="0 0 22 22" aria-label="não se aplica" role="img">
        <path d="M7,11 H15" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  const c = { ok: "#059669", parcial: "#d97706", bloqueio: "#dc2626", sem: "#9ca3af", na: "#9ca3af" }[st]
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-label={st} role="img">
      {st === "parcial" && <path d={`M11,2 A${r},${r} 0 0,0 11,20 Z`} fill="#fbbf24" />}
      <circle cx="11" cy="11" r={r} fill={st === "parcial" ? "none" : "white"} stroke={c} strokeWidth="1.6" />
      {st === "ok" && <path d="M6.8,11.3 L9.7,14.1 L15.3,8.3" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
      {st === "bloqueio" && <path d="M7.6,7.6 L14.4,14.4 M14.4,7.6 L7.6,14.4" stroke={c} strokeWidth="1.8" strokeLinecap="round" />}
      {st === "sem" && (
        <text x="11" y="15" textAnchor="middle" fontSize="11" fontWeight="700" fill={c} fontFamily="sans-serif">
          ?
        </text>
      )}
    </svg>
  )
}

// Risco declarado: 3 barras, preenchidas conforme o nível.
export function RiscoBars({ nivel }: { nivel: Risco }) {
  const n = nivel === "alto" ? 3 : nivel === "medio" ? 2 : nivel === "baixo" ? 1 : 0
  const cor = nivel === "alto" ? "#dc2626" : nivel === "medio" ? "#d97706" : "#6b7280"
  return (
    <svg width="20" height="16" viewBox="0 0 20 16" aria-label={`risco ${nivel || "não informado"}`} role="img">
      {[0, 1, 2].map((k) => (
        <rect key={k} x={k * 7} y={10 - k * 5} width="5" height={6 + k * 5} rx="1" fill={k < n ? cor : "#d1d5db"} />
      ))}
    </svg>
  )
}

export const COR_MARCO: Record<MarcoSt, { fill: string; stroke: string }> = {
  conc: { fill: "#15803d", stroke: "#14532d" },
  andamento: { fill: "#fbbf24", stroke: "#b45309" },
  nao: { fill: "#ffffff", stroke: "#4b5563" },
  atr: { fill: "#dc2626", stroke: "#7f1d1d" },
}

export function Diamante({ st, size = 14, className }: { st: MarcoSt; size?: number; className?: string }) {
  const c = COR_MARCO[st]
  return (
    <svg width={size + 4} height={size + 4} viewBox="0 0 18 18" className={cx("overflow-visible", className)} aria-hidden="true">
      <path d="M9,1 L17,9 L9,17 L1,9 Z" fill={c.fill} stroke={c.stroke} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}
