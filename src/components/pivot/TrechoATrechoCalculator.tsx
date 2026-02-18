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

interface Props {
  shared: PivotSharedData;
  onHpp?: (hpp: number, h0: number, hfTotal: number) => void;
  // pressure equation params
  a?: string;
  b?: string;
  c?: string;
  d?: string;
  fParam?: string;
  Cd?: string;
  Eem?: string;
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

export default function TrechoATrechoCalculator({ shared, onHpp }: Props) {
  const [Eem, setEem] = useState("25");
  const [Cd, setCd] = useState("0.98");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [c, setC] = useState("");
  const [d, setD] = useState("");
  const [fParam, setFParam] = useState("");
  const [modelo, setModelo] = useState("");

  const [rows, setRows] = useState<TrechoRow[]>([]);
  const [hfTotal, setHfTotal] = useState("");
  const [h0, setH0] = useState("");
  const [hpp, setHpp] = useState("");
  const [error, setError] = useState("");

  const calculate = () => {
    setError("");
    try {
      const { Rut, Clb, Lap, Tgi, efc, Tempag, rug, Qc, Hfin, Aclv, Dclv, LTs, Alts, Diu, D2s, D3s, Lseg1, Lseg2, Lseg3, diamConfig } = shared;
      const eem = parseFloat(Eem);

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
      const ceem = (Nem - 2) * eem; // comprimento entre 1° e último (Nem-1 intervalos)
      const clue = ceem + 0.5 * eem;
      const distpri = LT - clue;

      // Determine diameter for each emitter based on config
      const getDiam = (idx: number /* 1-based from end */) => {
        if (diamConfig === "1") return Diu;
        if (diamConfig === "2") {
          // Lseg1 = comprimento do primeiro segmento (from pivot)
          // emitters closer to pivot => idx high => in seg1 (Diu)
          // emitters farther => idx low => in seg2 (D2s)
          const Nest = Math.floor(Lseg1 / eem);
          return idx <= Nest ? Diu : D2s;
        }
        if (diamConfig === "3") {
          const Neut = Math.floor(Lseg3 / eem);
          const Neti = Math.floor(Lseg2 / eem);
          if (idx <= Neut) return D3s;
          if (idx <= Neut + Neti) return D2s;
          return Diu;
        }
        return Diu;
      };

      const newRows: TrechoRow[] = [];
      let somaqt = 0;
      let Hft = 0;
      let lastFt = 0;
      let lastDin = Diu;

      // Build rows from last emitter (highest number) to first (idx=1 = closest to pivot)
      // Row 1 in VBA = emitter at largest radius (cannon/spray end)
      // We'll build them in that order

      // First row: the cannon/spray at end
      const firstRi = clue + distpri;
      const firstQi = Qc;
      somaqt += firstQi;
      const firstQt = somaqt;
      const firstDi = getDiam(Nem);
      const firstV = parseFloat((353.67765 * firstQt / firstDi ** 2).toFixed(2));
      const firstNR = Math.round(mespag * firstV * firstDi / uc);
      let firstFt = 0;
      let firstHf = 0;
      if (Qc !== 0) {
        firstFt = parseFloat(colebrook(firstNR, rug, firstDi).toFixed(4));
        firstHf = parseFloat(((6.376e6) * firstFt * firstQt ** 2 * 0.5 * eem / firstDi ** 5).toFixed(6));
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
        QTrecho: firstQt.toFixed(3),
        v: firstV.toFixed(2),
        NR: firstNR.toString(),
        f: firstFt.toFixed(4),
        hf: firstHf.toFixed(6),
        Hpress: "",
      });

      // Remaining rows
      for (let i = 1; i < Nem; i++) {
        const emissorNum = Nem - i;
        const Ri = parseFloat(((emissorNum - 1) * eem + distpri + eem).toFixed(2));
        const Di = getDiam(emissorNum);
        const qi = parseFloat((2 * eem * Ri * Qb / LT ** 2).toFixed(5));
        somaqt += newRows[i - 1] ? parseFloat(newRows[i - 1].qi) : 0;
        const Qt = parseFloat((somaqt + qi).toFixed(3));
        somaqt = Qt - qi; // keep accumulation correct

        // re-accumulate properly
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

      // Calculate pressure at each emitter (from last emitter back toward pivot)
      // H[1] (last/outermost emitter) = Hfin
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

      setHfTotal(Hft.toFixed(2));
      setH0(H0val.toFixed(2));
      setHpp(HppVal.toFixed(2));
      setRows(newRows);

      onHpp?.(HppVal, H0val, Hft);
    } catch (e) {
      setError("Erro no cálculo. Verifique os dados.");
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Pressure regulator equation */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 font-body">
          Parâmetros da equação do regulador de pressão
        </label>
        <div className="grid grid-cols-6 gap-2">
          <TInput label="Modelo" value={modelo} onChange={setModelo} />
          <TInput label="a" value={a} onChange={setA} />
          <TInput label="b" value={b} onChange={setB} />
          <TInput label="c" value={c} onChange={setC} />
          <TInput label="d" value={d} onChange={setD} />
          <TInput label="f" value={fParam} onChange={setFParam} />
        </div>
      </div>

      {/* Spacing and Cd */}
      <div className="flex gap-4 items-end">
        <div className="w-40">
          <TInput label="Espaç. entre emissores (m)" value={Eem} onChange={setEem} />
        </div>
        <div className="w-32">
          <TInput label="Cd" value={Cd} onChange={setCd} />
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

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-xs font-body">
          <thead>
            <tr className="bg-muted">
              <th className="px-2 py-2 text-left text-muted-foreground font-semibold border-r border-border">1. Emissor</th>
              <th className="px-2 py-2 text-left text-muted-foreground font-semibold border-r border-border">2. Ri (m)</th>
              <th className="px-2 py-2 text-left text-muted-foreground font-semibold border-r border-border">3. Trecho (m)</th>
              <th className="px-2 py-2 text-left text-muted-foreground font-semibold border-r border-border">4. Di (mm)</th>
              <th className="px-2 py-2 text-left text-muted-foreground font-semibold border-r border-border">5. qi (m³/h)</th>
              <th className="px-2 py-2 text-left text-muted-foreground font-semibold border-r border-border">6. QTrecho (m³/h)</th>
              <th className="px-2 py-2 text-left text-muted-foreground font-semibold border-r border-border">V (m/s)</th>
              <th className="px-2 py-2 text-left text-muted-foreground font-semibold border-r border-border">NR</th>
              <th className="px-2 py-2 text-left text-muted-foreground font-semibold border-r border-border">f</th>
              <th className="px-2 py-2 text-left text-muted-foreground font-semibold border-r border-border">Hf (m)</th>
              <th className="px-2 py-2 text-left text-muted-foreground font-semibold">H (m.c.a.)</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-8 text-muted-foreground">
                  Pressione Calcular para gerar a tabela
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
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

      {/* Results footer */}
      <div className="flex gap-6 items-center pt-1">
        <ResultItem label="HfTotal (m)" value={hfTotal} />
        <ResultItem label="Ho (m)" value={h0} />
        <ResultItem label="Hpp (m)" value={hpp} highlight />
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
