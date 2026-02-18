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

interface TrechoRow {
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
  Hpress: string;
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

export default function TrechoATrechoCalculator({ shared, state, onStateChange, onHpp }: Props) {
  const [error, setError] = useState("");

  const set = (k: keyof TrechoState, v: string) => onStateChange({ [k]: v });

  const calculate = () => {
    setError("");
    try {
      const { Rut, Clb, Lap, Tgi, efc, Tempag, rug, Qc, Hfin, Aclv, LTs, Alts, Diu, D2s, D3s, Lseg1, Lseg3, diamConfig } = shared;
      const eem = parseFloat(state.Eem);

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

      const Nem = Math.floor(LT / eem) + 1;
      const ceem = (Nem - 2) * eem;
      const clue = ceem + 0.5 * eem;
      const distpri = LT - clue;

      const getDiam = (idx: number) => {
        if (diamConfig === "1") return Diu;
        if (diamConfig === "2") {
          const Nest = Math.floor(Lseg1 / eem);
          return idx <= Nest ? Diu : D2s;
        }
        if (diamConfig === "3") {
          const Neut = Math.floor(Lseg3 / eem);
          const Neti = Math.floor(shared.Lseg2 / eem);
          if (idx <= Neut) return D3s;
          if (idx <= Neut + Neti) return D2s;
          return Diu;
        }
        return Diu;
      };

      const newRows: TrechoRow[] = [];
      let Hft = 0;
      let lastFt = 0;
      let lastDin = Diu;

      const firstRi = clue + distpri;
      const firstQi = Qc;
      const firstDi = getDiam(Nem);
      const firstV = parseFloat((353.67765 * firstQi / firstDi ** 2).toFixed(2));
      const firstNR = Math.round(mespag * firstV * firstDi / uc);
      let firstFt = 0;
      let firstHf = 0;
      if (Qc !== 0) {
        firstFt = parseFloat(colebrook(firstNR, rug, firstDi).toFixed(4));
        firstHf = parseFloat(((6.376e6) * firstFt * firstQi ** 2 * 0.5 * eem / firstDi ** 5).toFixed(6));
      }
      Hft += firstHf;
      lastFt = firstFt;
      lastDin = firstDi;

      newRows.push({
        emissor: Nem,
        Ri: firstRi.toFixed(2),
        trecho: `${Nem - 1}-Final`,
        Di: firstDi.toFixed(0),
        qi: firstQi.toFixed(5),
        QTrecho: firstQi.toFixed(3),
        v: firstV.toFixed(2),
        NR: firstNR.toString(),
        f: firstFt.toFixed(4),
        hf: firstHf.toFixed(6),
        Hpress: "",
      });

      for (let i = 1; i < Nem; i++) {
        const emissorNum = Nem - i;
        const Ri = parseFloat(((emissorNum - 1) * eem + distpri + eem).toFixed(2));
        const Di = getDiam(emissorNum);
        const qi = parseFloat((2 * eem * Ri * Qb / LT ** 2).toFixed(5));

        const accQt = parseFloat((
          newRows.slice(0, i).reduce((acc, r) => acc + parseFloat(r.qi), 0) + qi
        ).toFixed(3));

        const v = parseFloat((353.67765 * accQt / Di ** 2).toFixed(2));
        const NR = Math.round(mespag * v * Di / uc);
        const ft = parseFloat(colebrook(NR, rug, Di).toFixed(4));
        const hf = parseFloat(((6.376e6) * ft * accQt ** 2 * eem / Di ** 5).toFixed(6));

        Hft += hf;
        lastFt = ft;
        lastDin = Di;

        newRows.push({
          emissor: emissorNum,
          Ri: Ri.toFixed(2),
          trecho: `${emissorNum - 1}-${emissorNum}`,
          Di: Di.toFixed(0),
          qi: qi.toFixed(5),
          QTrecho: accQt.toFixed(3),
          v: v.toFixed(2),
          NR: NR.toString(),
          f: ft.toFixed(4),
          hf: hf.toFixed(6),
          Hpress: "",
        });
      }

      const Desac = eem * Aclv / 100;
      newRows[0].Hpress = Hfin.toFixed(2);
      for (let i = 1; i < newRows.length; i++) {
        const prevH = parseFloat(newRows[i - 1].Hpress);
        const prevHf = parseFloat(newRows[i - 1].hf);
        const Hrow = parseFloat((Desac + prevH + prevHf).toFixed(2));
        newRows[i].Hpress = Hrow.toFixed(2);
      }

      const lastRow = newRows[newRows.length - 1];
      const H0val = parseFloat((parseFloat(lastRow.Hpress) + parseFloat(lastRow.hf) + Desac).toFixed(2));
      const Hfunit = parseFloat(((6.376e6) * lastFt * Qinic ** 2 * LTs / lastDin ** 5).toFixed(2));
      const HppVal = parseFloat((H0val + Hfunit + Alts).toFixed(2));

      onStateChange({
        rows: newRows,
        hfTotal: Hft.toFixed(2),
        h0: H0val.toFixed(2),
        hpp: HppVal.toFixed(2),
      });

      onHpp?.(HppVal, H0val, Hft);
    } catch {
      setError("Erro no cálculo. Verifique os dados.");
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 font-body">
          Parâmetros da equação do regulador de pressão
        </label>
        <div className="grid grid-cols-6 gap-2">
          <TInput label="Modelo" value={state.modelo} onChange={v => set("modelo", v)} />
          <TInput label="a" value={state.a} onChange={v => set("a", v)} />
          <TInput label="b" value={state.b} onChange={v => set("b", v)} />
          <TInput label="c" value={state.c} onChange={v => set("c", v)} />
          <TInput label="d" value={state.d} onChange={v => set("d", v)} />
          <TInput label="f" value={state.fParam} onChange={v => set("fParam", v)} />
        </div>
      </div>

      <div className="flex gap-4 items-end">
        <div className="w-40">
          <TInput label="Espaç. entre emissores (m)" value={state.Eem} onChange={v => set("Eem", v)} />
        </div>
        <div className="w-32">
          <TInput label="Cd" value={state.Cd} onChange={v => set("Cd", v)} />
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
        <table className="w-full text-xs font-body">
          <thead>
            <tr className="bg-muted">
              <th className="px-2 py-2 text-left text-muted-foreground font-semibold border-r border-border">Emissor</th>
              <th className="px-2 py-2 text-left text-muted-foreground font-semibold border-r border-border">Ri (m)</th>
              <th className="px-2 py-2 text-left text-muted-foreground font-semibold border-r border-border">Trecho</th>
              <th className="px-2 py-2 text-left text-muted-foreground font-semibold border-r border-border">Di (mm)</th>
              <th className="px-2 py-2 text-left text-muted-foreground font-semibold border-r border-border">qi (m³/h)</th>
              <th className="px-2 py-2 text-left text-muted-foreground font-semibold border-r border-border">QTrecho (m³/h)</th>
              <th className="px-2 py-2 text-left text-muted-foreground font-semibold border-r border-border">V (m/s)</th>
              <th className="px-2 py-2 text-left text-muted-foreground font-semibold border-r border-border">NR</th>
              <th className="px-2 py-2 text-left text-muted-foreground font-semibold border-r border-border">f</th>
              <th className="px-2 py-2 text-left text-muted-foreground font-semibold border-r border-border">Hf (m)</th>
              <th className="px-2 py-2 text-left text-muted-foreground font-semibold">H (m.c.a.)</th>
            </tr>
          </thead>
          <tbody>
            {state.rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-8 text-muted-foreground">
                  Pressione Calcular para gerar a tabela
                </td>
              </tr>
            ) : (
              state.rows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                  <td className="px-2 py-1.5 border-r border-border text-foreground">{row.emissor}</td>
                  <td className="px-2 py-1.5 border-r border-border text-foreground">{row.Ri}</td>
                  <td className="px-2 py-1.5 border-r border-border text-foreground">{row.trecho}</td>
                  <td className="px-2 py-1.5 border-r border-border text-foreground">{row.Di}</td>
                  <td className="px-2 py-1.5 border-r border-border text-foreground">{row.qi}</td>
                  <td className="px-2 py-1.5 border-r border-border text-foreground">{row.QTrecho}</td>
                  <td className="px-2 py-1.5 border-r border-border text-foreground">{row.v}</td>
                  <td className="px-2 py-1.5 border-r border-border text-foreground">{row.NR}</td>
                  <td className="px-2 py-1.5 border-r border-border text-foreground">{row.f}</td>
                  <td className="px-2 py-1.5 border-r border-border text-foreground">{row.hf}</td>
                  <td className="px-2 py-1.5 text-primary font-semibold">{row.Hpress}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex gap-6 items-center pt-1">
        <ResultItem label="HfTotal (m)" value={state.hfTotal} />
        <ResultItem label="Ho (m)" value={state.h0} />
        <ResultItem label="Hpp (m)" value={state.hpp} highlight />
      </div>
    </div>
  );
}

function TInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 font-body">{label}</label>
      <input
        type="number"
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
