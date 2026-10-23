// Tudo cabe em 1600×900: a página não rola; cada caixa encolhe até caber e rola por dentro.
// CAIXA = bloco que encolhe na coluna (flex 0 1 auto); ROLA = parte de dentro que rola. No PDF tudo volta ao normal.
export const CAIXA = "flex min-h-0 flex-initial flex-col overflow-hidden print:overflow-visible"
export const ROLA = "min-h-0 flex-1 overflow-auto print:overflow-visible"
export const TELA = "mt-3 flex min-h-0 flex-1 flex-col gap-3 print:block"
