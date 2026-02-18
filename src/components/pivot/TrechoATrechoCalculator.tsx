import { useState } from "react";
import { Waves } from "lucide-react";

interface PivotSharedData {
  Rut: number;
  Clb: number;
  Lap: number;
  Tgi: number;
  efc: number;
  Tempag: number;
  rug: number;
  Qc: number;
  Hfin: number;
  Aclv: number;
  Dclv: number;
  LTs: number;
  Alts: number;
  Diu: number;
  D2s: number;
  D3s: number;
  Lseg1: number;
  Lseg2: number;
  Lseg3: number;
  diamConfig: "1" | "2" | "3";
}

export interface TrechoRow {
  emissor: number;
  Ri: string;
  trecho: string;
  Di: string;
  qi: string;
  QTrecho: string;
  v: string;
  NR: string;
  f: string;
  hf: string;
  // Aclive / declive
  Aclive: string;
  HiAclive: string;
  Declive: string;
  HiDeclive: string;
  HiNivel: string;
  // Pressão na saída do RP
  HsAclive: string;
  HsDeclive: string;
  HsNivel: string;
  HsMedia: string;
  // Diâmetro calculado e lâmina
  DiCalc: string;
  LapEmissor: string;
  [key: string]: string | number;
}

export interface TrechoState {
  Eem: string;
  Cd: string;
  a: string;
  b: string;
  c: string;
  d: string;
  fParam: string;
  modelo: string;
  rows: TrechoRow[];
  hfTotal: string;
  h0: string;
  hpp: string;
}

interface Props {
  shared: PivotSharedData;
  state: TrechoState;
  onStateChange: (s: Partial<TrechoState>) => void;
  onHpp?: (hpp: number, h0: number, hfTotal: number) => void;
}

const ln = Math.log;

function calcViscosity(Tempa: number) {
  const Tkelv = Tempa + 273.16;
  const Lgu = -11.73 + 1828 / Tkelv + 0.01966 * Tkelv - 0.00001466 * Tkelv ** 2;
  return parseFloat(((10 ** Lgu) / 100).toFixed(5));
}
function calcDensity(Tempa: number) {
  const Fct = ((Tempa - 3.983035) ** 2) * (Tempa + 301.797) / (522528.9 * (Tempa + 69.34881));
  return parseFloat((1000 * (1 - Fct)).toFixed(2));
}
function colebrook(NR: number, rug: number, D: number): number {
  if (NR <= 0) return 0;
  let oldf = 1;
  for (let i = 0; i < 1000; i++) {
    const newf = 1 / (-2 * ln(rug / (3.7 * D) + 2.51 / (NR * Math.sqrt(oldf))) * 0.434294482) ** 2;
    const delta = newf - oldf;
    oldf = newf;
    if (Math.abs(delta / Math.abs(newf)) < 0.001) break;
  }
  return oldf;
}

// Pressão na saída do regulador de pressão
function calcHsRP(qi: number, Hi: number, a: number, b: number, c: number, d: number, e: number): number {
  const x = a + b * qi;
  const y = 1 + Math.exp(d - Hi) / e;
  return parseFloat((((x + (c / y)) * 10) * 0.1019).toFixed(2));
}

export default function TrechoATrechoCalculator({ shared, state, onStateChange, onHpp }: Props) {
  const [error, setError] = useState("");

  const set = (k: keyof TrechoState, v: string) => onStateChange({ [k]: v });

  const calculate = () => {
    setError("");
    try {
      const { Rut, Clb, Lap, Tgi, efc, Tempag, rug, Qc, Hfin, Aclv, Dclv, LTs, Alts, Diu, D2s, D3s, Lseg1, Lseg2, Lseg3, diamConfig } = shared;
      const eem = parseFloat(state.Eem);
      const Cd = parseFloat(state.Cd) || 0;
      const aP = parseFloat(state.a) || 0;
      const bP = parseFloat(state.b) || 0;
      const cP = parseFloat(state.c) || 0;
      const dP = parseFloat(state.d) || 0;
      const eP = parseFloat(state.fParam) || 0;

      if ([Rut, Clb, Lap, Tgi, efc, Tempag, rug, eem].some(v => isNaN(v) || v <= 0)) {
        setError("Verifique se todos os dados da aba Dados estão preenchidos corretamente.");
        return;
      }

      const u = calcViscosity(Tempag);
      const uc = parseFloat((u * 1000).toFixed(2));
      const mespag = calcDensity(Tempag);
      const efir = parseFloat((efc / 100).toFixed(2));

      const LT = Rut + Clb;
      const Acb = parseFloat((3.14159 * LT ** 2 / 10000).toFixed(2));
      const Qb = parseFloat((10 * Acb * Lap / (efir * Tgi)).toFixed(2));
      const Qinic = Qb + Qc;

      // VBA: Nem = Int(LT/Eem) + 1
      const Nem = Math.floor(LT / eem) + 1;
      // VBA: ceem = (Nem-1)*Eem  (not Nem-2 as before)
      const ceem = (Nem - 1) * eem;
      const clue = ceem + 0.5 * eem;
      const distpri = LT - clue;

      // Leq for Lap calculation
      const gr = Qc / Qinic;
      const Leq = LT / (1 - gr) ** 0.5;

      // Determine diameter per row index (1-based, row 1 = last/outermost emissor)
      // In the VBA: first row = emissor Nem (outermost), last row = emissor 1 (innermost)
      // getDiam: given the row index (1-based), what diameter?
      const getDiam = (emissorNum: number): number => {
        if (diamConfig === "1") return Diu;
        if (diamConfig === "2") {
          // Nest = Lseg2/Eem  (VBA line 706: Nest = Format(Lseg2/Eem))
          const Nest = Math.floor(Lseg1 / eem); // emissores no trecho final (D2s)
          return emissorNum <= Nest ? D2s : Diu;
        }
        if (diamConfig === "3") {
          const Neut = Math.floor(Lseg3 / eem);
          const Neti = Math.floor(Lseg2 / eem);
          if (emissorNum <= Neut) return D3s;
          if (emissorNum <= Neut + Neti) return D2s;
          return Diu;
        }
        return Diu;
      };

      // Build rows: VBA fills row by row from outermost (Nem) to innermost (1)
      // Row index i in VBA (1-based): 
      //   i=1: emissor=Nem, Ri=clue+distpri, trecho="Nem-1-Final", qi=Qc
      //   i=2..Nem: emissor=Nem-i+1, Ri=(Nem-i)*Eem+distpri+Eem
      
      const newRows: TrechoRow[] = [];
      let somaqt = 0;
      let Hft = 0;
      let lastFt = 0;
      let lastDin = Diu;

      // --- First row (outermost emissor = Nem) ---
      const firstEmissor = Nem;
      const firstRi = clue + distpri;
      const firstDi = getDiam(firstEmissor);
      const firstQi = Qc;
      somaqt += firstQi;
      const firstQt = parseFloat(somaqt.toFixed(3));

      let firstFt = 0;
      let firstHf = 0;
      if (Qc !== 0) {
        const firstV = parseFloat((353.67765 * firstQt / firstDi ** 2).toFixed(2));
        const firstNR = Math.floor(mespag * firstV * firstDi / uc);
        firstFt = parseFloat(colebrook(firstNR, rug, firstDi).toFixed(4));
        firstHf = parseFloat(((6.376e6) * firstFt * firstQt ** 2 * 0.5 * eem / firstDi ** 5).toFixed(6));
        lastFt = firstFt;
        lastDin = firstDi;
        Hft += firstHf;
        newRows.push({
          emissor: firstEmissor,
          Ri: firstRi.toFixed(2),
          trecho: `${firstEmissor - 1}-Final`,
          Di: firstDi.toFixed(0),
          qi: firstQi.toFixed(5),
          QTrecho: firstQt.toFixed(3),
          v: firstV.toFixed(2),
          NR: firstNR.toString(),
          f: firstFt.toFixed(4),
          hf: firstHf.toFixed(6),
          Aclive: "", HiAclive: "", Declive: "", HiDeclive: "", HiNivel: "",
          HsAclive: "", HsDeclive: "", HsNivel: "", HsMedia: "", DiCalc: "", LapEmissor: "",
        });
      } else {
        newRows.push({
          emissor: firstEmissor,
          Ri: firstRi.toFixed(2),
          trecho: `${firstEmissor - 1}-Final`,
          Di: firstDi.toFixed(0),
          qi: firstQi.toFixed(5),
          QTrecho: firstQt.toFixed(3),
          v: "0.00",
          NR: "0",
          f: "0.0000",
          hf: "0.000000",
          Aclive: "", HiAclive: "", Declive: "", HiDeclive: "", HiNivel: "",
          HsAclive: "", HsDeclive: "", HsNivel: "", HsMedia: "", DiCalc: "", LapEmissor: "",
        });
      }

      // --- Remaining rows (Nem-1 down to 1) ---
      // VBA loop: For i=1 To Nem (where Nem decrements)
      // Row i+1 has: emissor=Nem-i, Ri=(Nem-i-1)*Eem+distpri+Eem = (Nem-i)*Eem - Eem + distpri + Eem = (Nem-i)*Eem+distpri
      const Ntem = Nem; // total rows
      somaqt = 0; // VBA resets somaqt=0 in the Do Until loop
      Hft = 0;
      newRows.length = 0; // rebuild from scratch following VBA Do Until loop

      // Reset and rebuild properly following VBA exactly
      // VBA: first fills Ntem rows with Ri, Trecho, Aclive, Declive only (no qi/v/f/hf yet)
      // Then fills qi, QTrecho, v, NR, f, hf in the second for loop

      // Simpler: build sequentially matching VBA output
      const allRows: TrechoRow[] = [];

      // Row 1 (first added): emissor = original Nem value
      const origNem = Nem;
      allRows.push({
        emissor: origNem,
        Ri: (clue + distpri).toFixed(2),
        trecho: `${origNem - 1}-Final`,
        Di: getDiam(origNem).toFixed(0),
        qi: Qc.toFixed(5),
        QTrecho: "",
        v: "", NR: "", f: "", hf: "",
        Aclive: (0.5 * eem * Aclv / 100).toFixed(3),
        HiAclive: "", Declive: (0.5 * eem * Dclv / 100).toFixed(3),
        HiDeclive: "", HiNivel: "",
        HsAclive: "", HsDeclive: "", HsNivel: "", HsMedia: "", DiCalc: "", LapEmissor: "",
      });

      // Rows 2..Ntem
      for (let i = 1; i < origNem; i++) {
        const emissorNum = origNem - i;
        const RiNum = ((emissorNum - 1) * eem + distpri + eem);
        allRows.push({
          emissor: emissorNum,
          Ri: RiNum.toFixed(2),
          trecho: `${emissorNum - 1}-${emissorNum}`,
          Di: getDiam(emissorNum).toFixed(0),
          qi: "",
          QTrecho: "",
          v: "", NR: "", f: "", hf: "",
          Aclive: (eem * Aclv / 100).toFixed(3),
          HiAclive: "", Declive: (eem * Dclv / 100).toFixed(3),
          HiDeclive: "", HiNivel: "",
          HsAclive: "", HsDeclive: "", HsNivel: "", HsMedia: "", DiCalc: "", LapEmissor: "",
        });
      }

      // Now fill qi, QTrecho, v, NR, f, hf according to diamConfig
      // VBA fills these in loops depending on diamConfig
      // For simplicity (and since the structure is the same), we do a unified calculation:
      
      somaqt = 0;
      let HftTotal = 0;

      // Row index 0 (outermost): qi = Qc, then rows 1..Ntem-1: qi from formula
      // qi for row i+1 (VBA): 2*Eem*Ri*Qb/LT^2
      for (let i = 0; i < allRows.length; i++) {
        const row = allRows[i];
        let qi: number;
        if (i === 0) {
          qi = Qc;
        } else {
          qi = parseFloat((2 * eem * parseFloat(row.Ri as string) * Qb / LT ** 2).toFixed(5));
        }
        row.qi = qi.toFixed(5);

        // VBA accumulates somaqt differently for first row vs rest
        if (i === 0) {
          somaqt = qi;
        } else {
          somaqt = parseFloat((somaqt + qi).toFixed(3));
        }
        const Qt = parseFloat(somaqt.toFixed(3));
        row.QTrecho = Qt.toFixed(3);

        const Di = parseFloat(row.Di);
        const v = parseFloat((353.67765 * Qt / Di ** 2).toFixed(2));
        const NR = Math.floor(mespag * v * Di / uc);

        let ft = 0;
        let hf = 0;
        if (i === 0 && Qc === 0) {
          ft = 0;
          hf = 0;
        } else {
          ft = parseFloat(colebrook(NR, rug, Di).toFixed(4));
          const L = i === 0 ? 0.5 * eem : eem;
          hf = parseFloat(((6.376e6) * ft * Qt ** 2 * L / Di ** 5).toFixed(6));
        }

        row.v = v.toFixed(2);
        row.NR = NR.toString();
        row.f = ft.toFixed(4);
        row.hf = hf.toFixed(6);
        HftTotal += hf;
        lastFt = ft;
        lastDin = Di;
      }

      // --- Hi Aclive (SubItems(11)) ---
      // VBA: row[0].HiAclive = Hfin; row[i].HiAclive = Desac + row[i-1].HiAclive + row[i-1].hf
      const Desac = parseFloat((eem * Aclv / 100).toFixed(3));
      allRows[0].HiAclive = Hfin.toFixed(2);
      for (let i = 1; i < allRows.length; i++) {
        const prevH = parseFloat(allRows[i - 1].HiAclive);
        const prevHf = parseFloat(allRows[i - 1].hf);
        const desacI = parseFloat(allRows[i].Aclive);
        allRows[i].HiAclive = parseFloat((desacI + prevH + prevHf).toFixed(2)).toFixed(2);
      }

      // H0 (pressure at pivot start)
      const lastRow = allRows[allRows.length - 1];
      const H0val = parseFloat((parseFloat(lastRow.HiAclive) + parseFloat(lastRow.hf) + Desac).toFixed(2));

      // Hpp
      const Hfunit = parseFloat(((6.376e6) * lastFt * Qinic ** 2 * LTs / lastDin ** 5).toFixed(6));
      const HppVal = parseFloat((H0val + Hfunit + Alts).toFixed(2));

      // --- Hi Declive (SubItems(13)) ---
      // VBA: row[Ntem-1].HiDeclive = H0 - row[Ntem-1].hf + Declv
      //      row[i-1].HiDeclive = row[i].HiDeclive - row[i].hf + Declv  (i from Ntem down to 2)
      const Declv = parseFloat((eem * Dclv / 100).toFixed(3));
      allRows[allRows.length - 1].HiDeclive = parseFloat((H0val - parseFloat(lastRow.hf) + Declv).toFixed(2)).toFixed(2);
      for (let i = allRows.length - 1; i >= 1; i--) {
        allRows[i - 1].HiDeclive = parseFloat((parseFloat(allRows[i].HiDeclive) - parseFloat(allRows[i].hf) + Declv).toFixed(2)).toFixed(2);
      }

      // --- Hi Nível (SubItems(14)) ---
      // VBA: row[Ntem-1].HiNivel = H0 - row[Ntem-1].hf
      //      row[i-1].HiNivel = row[i].HiNivel - row[i].hf
      allRows[allRows.length - 1].HiNivel = parseFloat((H0val - parseFloat(lastRow.hf)).toFixed(2)).toFixed(2);
      for (let i = allRows.length - 1; i >= 1; i--) {
        allRows[i - 1].HiNivel = parseFloat((parseFloat(allRows[i].HiNivel) - parseFloat(allRows[i].hf)).toFixed(2)).toFixed(2);
      }

      // --- Hs no RP (pressão na saída do regulador) ---
      // VBA formula: x = a + b*qi; y = 1 + Exp(d - HiAclive) / e
      // HsAclive = ((x + c/y) * 10) * 0.1019
      // Similar for Declive (using HiDeclive) and Nível (using HiNivel)
      // HsMedia = (HsAclive + HsDeclive + HsNivel) / 3
      // DiCalc = 8.9357 * sqrt(qi / (Cd * HsMedia^0.5))
      // LapEmissor = qi * Tgi * 1000 / (2*pi*Ri*Eem)  [except first which uses Leq]
      const hasRP = eP !== 0 && (aP !== 0 || bP !== 0 || cP !== 0 || dP !== 0);

      for (let i = 0; i < allRows.length; i++) {
        const row = allRows[i];
        const qi = parseFloat(row.qi);
        const HiAclive = parseFloat(row.HiAclive);
        const HiDeclive = parseFloat(row.HiDeclive);
        const HiNivel = parseFloat(row.HiNivel);
        const Ri = parseFloat(row.Ri as string);

        if (Qc === 0 || !hasRP) {
          row.HsAclive = "0.00";
          row.HsDeclive = "0.00";
          row.HsNivel = "0.00";
          row.HsMedia = "0.00";
          row.DiCalc = "0.00";
        } else {
          const Hsac = calcHsRP(qi, HiAclive, aP, bP, cP, dP, eP);
          const Hsdec = calcHsRP(qi, HiDeclive, aP, bP, cP, dP, eP);
          const Hsniv = calcHsRP(qi, HiNivel, aP, bP, cP, dP, eP);
          const HsMedia = parseFloat(((Hsac + Hsdec + Hsniv) / 3).toFixed(2));
          row.HsAclive = Hsac.toFixed(2);
          row.HsDeclive = Hsdec.toFixed(2);
          row.HsNivel = Hsniv.toFixed(2);
          row.HsMedia = HsMedia.toFixed(2);

          if (Cd > 0 && HsMedia > 0) {
            const Raiz = Math.sqrt(qi / (Cd * HsMedia ** 0.5));
            row.DiCalc = (8.9357 * Raiz).toFixed(2);
          } else {
            row.DiCalc = "0.00";
          }
        }

        // Lâmina aplicada por emissor
        if (i === 0) {
          // First emissor (outermost / canhão) uses Leq area
          const aiem = 3.14159 * (Leq ** 2 - LT ** 2);
          if (aiem > 0 && Qc !== 0) {
            row.LapEmissor = parseFloat((qi * Tgi * 1000 / aiem).toFixed(2)).toFixed(2);
          } else {
            row.LapEmissor = "0.00";
          }
        } else {
          const aiem = 2 * 3.14159 * Ri * eem;
          row.LapEmissor = aiem > 0 ? parseFloat((qi * Tgi * 1000 / aiem).toFixed(2)).toFixed(2) : "0.00";
        }

        // Convert Ri to string for display
        row.Ri = (Ri as number).toFixed(2);
      }

      onStateChange({
        rows: allRows,
        hfTotal: HftTotal.toFixed(2),
        h0: H0val.toFixed(2),
        hpp: HppVal.toFixed(2),
      });

      onHpp?.(HppVal, H0val, HftTotal);
    } catch (err) {
      console.error(err);
      setError("Erro no cálculo. Verifique os dados.");
    }
  };

  // Column groups for horizontal scroll display
  const cols = [
    { key: "emissor", label: "1. Emissor" },
    { key: "Ri", label: "2. Ri (m)" },
    { key: "trecho", label: "3. Trecho" },
    { key: "Di", label: "4. Di (mm)" },
    { key: "qi", label: "5. qi (m³/h)" },
    { key: "QTrecho", label: "6. QTrecho (m³/h)" },
    { key: "v", label: "7. Vel. (m/s)" },
    { key: "NR", label: "8. NR" },
    { key: "f", label: "9. f (Colebrook)" },
    { key: "hf", label: "10. Hf Trecho (m)" },
    { key: "Aclive", label: "11. Aclive (m)" },
    { key: "HiAclive", label: "12. Hi Aclive (m)" },
    { key: "Declive", label: "13. Declive (m)" },
    { key: "HiDeclive", label: "14. Hi Declive (m)" },
    { key: "HiNivel", label: "15. Hi Nível (m)" },
    { key: "HsAclive", label: "16. Hs no RP (m) Aclive" },
    { key: "HsDeclive", label: "17. Hs no RP (m) Declive" },
    { key: "HsNivel", label: "18. Hs no RP (m) Nível" },
    { key: "HsMedia", label: "19. Hs no RP (m) Média" },
    { key: "DiCalc", label: "20. Di calc. (mm)" },
    { key: "LapEmissor", label: "21. Lap (mm)" },
  ] as const;

  return (
    <div className="p-6 space-y-5">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 font-body">
          Parâmetros da equação do regulador de pressão
        </label>
        <div className="grid grid-cols-7 gap-2">
          <TInput label="Modelo" value={state.modelo} onChange={v => set("modelo", v)} isText />
          <TInput label="a" value={state.a} onChange={v => set("a", v)} />
          <TInput label="b" value={state.b} onChange={v => set("b", v)} />
          <TInput label="c" value={state.c} onChange={v => set("c", v)} />
          <TInput label="d" value={state.d} onChange={v => set("d", v)} />
          <TInput label="f (e)" value={state.fParam} onChange={v => set("fParam", v)} />
          <TInput label="Cd" value={state.Cd} onChange={v => set("Cd", v)} />
        </div>
      </div>

      <div className="flex gap-4 items-end">
        <div className="w-48">
          <TInput label="Espaç. entre emissores (m)" value={state.Eem} onChange={v => set("Eem", v)} />
        </div>
        <button
          onClick={calculate}
          className="gradient-primary text-primary-foreground font-semibold px-6 py-2 rounded-xl font-body flex items-center gap-2 shadow-md hover:opacity-90 transition-opacity"
        >
          <Waves size={16} />
          Calcular
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg font-body">
          ⚠ {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="text-xs font-body" style={{ minWidth: "2400px" }}>
          <thead>
            <tr className="bg-muted">
              {cols.map((col, idx) => (
                <th
                  key={col.key}
                  className={`px-2 py-2 text-left text-muted-foreground font-semibold whitespace-nowrap ${idx < cols.length - 1 ? "border-r border-border" : ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.rows.length === 0 ? (
              <tr>
                <td colSpan={cols.length} className="text-center py-8 text-muted-foreground">
                  Pressione Calcular para gerar a tabela
                </td>
              </tr>
            ) : (
              state.rows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                  {cols.map((col, idx) => {
                    const val = col.key === "emissor" ? row.emissor : (row as Record<string, unknown>)[col.key];
                    const isHighlight = col.key === "HiAclive" || col.key === "HsMedia";
                    return (
                      <td
                        key={col.key}
                        className={`px-2 py-1.5 ${idx < cols.length - 1 ? "border-r border-border" : ""} ${isHighlight ? "text-primary font-semibold" : "text-foreground"}`}
                      >
                        {String(val ?? "—")}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-6 items-center pt-1">
        <ResultItem label="HfTotal (m)" value={state.hfTotal} />
        <ResultItem label="Ho (m)" value={state.h0} />
        <ResultItem label="Hpp (m)" value={state.hpp} highlight />
      </div>
    </div>
  );
}

function TInput({ label, value, onChange, isText }: { label: string; value: string; onChange: (v: string) => void; isText?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 font-body">{label}</label>
      <input
        type={isText ? "text" : "number"}
        value={value}
        onChange={e => onChange(e.target.value)}
        step="any"
        className="w-full px-2 py-1.5 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        style={{ borderColor: "hsl(var(--border))" }}
      />
    </div>
  );
}

function ResultItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm font-semibold font-body ${highlight ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
      <div className={`px-3 py-1 rounded-lg border text-sm font-body font-semibold ${highlight ? "equation-block text-primary" : "bg-muted text-foreground border-border"}`}>
        {value || "—"}
      </div>
    </div>
  );
}
