import { useState } from "react";
import { Zap } from "lucide-react";

// K values for fittings (from VBA ComboBox defaults)
const KA_CONCENTRICA = [0.3, 0.5, 0.8];
const KV_RETENCAO = [0.2, 0.5, 1.0];
const KR_GAVETA = [3.0, 5.0, 8.0];
const K_CURVA_90 = [0.4, 0.7, 1.0];
const KA_GRADUAL = [0.1, 0.2, 0.3];
const K_EXCENTRICA = [0.2, 0.3, 0.5];
const KV_PE_CRIVO = [5.0, 7.0, 10.0];
const KR_GAVETA_SUC = [0.2, 0.5, 1.0];
const K_CURVAS_SUC = [0.4, 0.7, 1.0];

const DIAMETROS_BOCAL = [100, 125, 150, 168, 200, 218, 250, 273, 300, 350];

interface Props {
  Qin: number;   // flow from dados tab (m³/h)
  Hpp: number;   // pressure at pivot from analytical method
  rug: number;
  Tempag: number;
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
  if (NR <= 0 || D <= 0) return 0;
  let oldf = 1;
  for (let i = 0; i < 1000; i++) {
    const newf = 1 / (-2 * ln(rug / (3.7 * D) + 2.51 / (NR * Math.sqrt(oldf))) * 0.434294482) ** 2;
    const delta = newf - oldf;
    oldf = newf;
    if (Math.abs(delta / Math.abs(newf)) < 0.001) break;
  }
  return oldf;
}

function PBInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 font-body">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        step="any"
        className="w-full px-2 py-1.5 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        style={{ borderColor: "hsl(var(--border))" }}
      />
    </div>
  );
}

function PBSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: (number | string)[] }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 font-body">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-2 py-1.5 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        style={{ borderColor: "hsl(var(--border))" }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ResultBox({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="bg-muted rounded-xl p-3">
      <p className="text-xs font-body text-muted-foreground">{label}</p>
      <p className="font-semibold font-body mt-0.5 text-foreground">{value || "—"} {unit && <span className="text-xs text-muted-foreground">{unit}</span>}</p>
    </div>
  );
}

export default function PotenciaBombaCalculator({ Qin, Hpp, rug, Tempag }: Props) {
  // Adutora
  const [Lad, setLad] = useState("");
  const [Dad, setDad] = useState("");
  const [Dbrec, setDbrec] = useState(String(DIAMETROS_BOCAL[2]));
  const [Dreg, setDreg] = useState(String(DIAMETROS_BOCAL[2]));
  const [Zrec, setZrec] = useState("");
  const [Ampc, setAmpc] = useState("0.3");
  const [Rgv, setRgv] = useState("0.2");
  const [Vrt, setVrt] = useState("3");
  const [Curv, setCurv] = useState("0.4");
  const [Rex, setRex] = useState("0.2");
  const [aplg, setAplg] = useState("0.1");

  // Sucção
  const [Lsuc, setLsuc] = useState("");
  const [Dsuc, setDsuc] = useState("");
  const [Zgsuc, setZgsuc] = useState("");
  const [Dbsuc, setDbsuc] = useState(String(DIAMETROS_BOCAL[2]));
  const [Rgs, setRgs] = useState("0.2");
  const [Vpc, setVpc] = useState("5.0");
  const [Csuc, setCsuc] = useState("0.4");

  // Rendimentos
  const [nb, setNb] = useState("");
  const [nM, setNM] = useState("");

  // Results
  const [Hftadu, setHftadu] = useState("");
  const [Vsuc_res, setVsucRes] = useState("");
  const [Vad_res, setVadRes] = useState("");
  const [Hftsuc, setHftsuc] = useState("");
  const [Hmt, setHmt] = useState("");
  const [Pb, setPb] = useState("");
  const [Pabs, setPabs] = useState("");
  const [error, setError] = useState("");

  const calculate = () => {
    setError("");
    try {
      const lad = parseFloat(Lad);
      const dad = parseFloat(Dad);
      const lsuc = parseFloat(Lsuc);
      const dsuc = parseFloat(Dsuc);
      const zrec = parseFloat(Zrec) || 0;
      const zgsuc = parseFloat(Zgsuc) || 0;
      const nbN = parseFloat(nb);
      const nMN = parseFloat(nM);
      const ampc = parseFloat(Ampc);
      const rgv = parseFloat(Rgv);
      const vrt = parseFloat(Vrt);
      const curv = parseFloat(Curv);
      const rex = parseFloat(Rex);
      const aplgN = parseFloat(aplg);
      const rgs = parseFloat(Rgs);
      const vpc = parseFloat(Vpc);
      const csuc = parseFloat(Csuc);
      const dbrec = parseFloat(Dbrec);
      const dbsuc = parseFloat(Dbsuc);
      const dreg = parseFloat(Dreg);

      if ([lad, dad, lsuc, dsuc, nbN, nMN].some(isNaN)) {
        setError("Preencha todos os campos obrigatórios.");
        return;
      }

      const Qad = Qin;
      const u = calcViscosity(Tempag);
      const uc = parseFloat((u * 1000).toFixed(2));
      const mespag = calcDensity(Tempag);

      // Adutora
      const Vad = parseFloat((353.67765 * Qad / dad ** 2).toFixed(2));
      const NRad = Math.round(mespag * Vad * dad / uc);
      const fad = colebrook(NRad, rug, dad);
      const Hfad = parseFloat(((6.376e6) * fad * Qad ** 2 * lad / dad ** 5).toFixed(2));

      const Vbd = parseFloat((353.67765 * Qad / dbrec ** 2).toFixed(2));
      const Ver = parseFloat((353.67765 * Qad / dreg ** 2).toFixed(2));
      const Hfsad = parseFloat(((ampc * Vbd ** 2 / 19.62) + ((rgv + aplgN) * Ver ** 2 / 19.62) + (vrt + curv) * Vad ** 2 / 19.62).toFixed(4));

      const HftaduVal = parseFloat((zrec + Hfad + Hfsad).toFixed(2));

      // Sucção
      const Vsuc = parseFloat((353.67765 * Qad / dsuc ** 2).toFixed(2));
      const NRsuc = Math.round(mespag * Vsuc * dsuc / uc);
      const fsuc = colebrook(NRsuc, rug, dsuc);
      const Hfsuc_cont = parseFloat(((6.376e6) * fsuc * Qad ** 2 * lsuc / dsuc ** 5).toFixed(2));

      const VRe = parseFloat((353.67765 * Qad / dbsuc ** 2).toFixed(2));
      const Hfsuc_sing = parseFloat(((rex * VRe ** 2 / 19.62) + (rgs + vpc + csuc) * Vsuc ** 2 / 19.62).toFixed(4));

      const HftSucVal = parseFloat((zgsuc + Hfsuc_cont + Hfsuc_sing).toFixed(2));

      // Pump
      const HmtVal = parseFloat((Hpp + HftaduVal + HftSucVal).toFixed(2));
      const Qms = parseFloat((Qad / 3600).toFixed(5));
      const rendb = nbN / 100;
      const PbVal = parseFloat(((mespag * 9.81 * Qms * HmtVal / 1000) / (rendb * 0.7355)).toFixed(1));
      const rendM = nMN / 100;
      const PabsVal = parseFloat((PbVal / rendM).toFixed(1));

      setHftadu(HftaduVal.toFixed(2));
      setVadRes(Vad.toFixed(2));
      setVsucRes(Vsuc.toFixed(2));
      setHftsuc(HftSucVal.toFixed(2));
      setHmt(HmtVal.toFixed(2));
      setPb(PbVal.toFixed(1));
      setPabs(PabsVal.toFixed(1));
    } catch {
      setError("Erro no cálculo. Verifique os dados inseridos.");
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Adutora */}
      <fieldset className="border border-border rounded-xl p-4 space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 font-body">Tubulação adutora</legend>
        <div className="grid grid-cols-2 gap-3">
          <PBInput label="Comprimento (m)" value={Lad} onChange={setLad} placeholder="Ex: 50" />
          <PBInput label="Diâmetro (mm)" value={Dad} onChange={setDad} placeholder="Ex: 200" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <PBSelect label="Diâm. bocal de descarga da bomba (mm)" value={Dbrec} onChange={setDbrec} options={DIAMETROS_BOCAL} />
          <PBSelect label="Diâm. do Registro (mm)" value={Dreg} onChange={setDreg} options={DIAMETROS_BOCAL} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <PBInput label="Alt. geom. de recalque (m)" value={Zrec} onChange={setZrec} placeholder="Ex: 5" />
        </div>
        <div className="grid grid-cols-5 gap-2">
          <PBSelect label="Ka concêntrica" value={Ampc} onChange={setAmpc} options={KA_CONCENTRICA} />
          <PBSelect label="Kv retenção" value={Rgv} onChange={setRgv} options={KV_RETENCAO} />
          <PBSelect label="Kr gaveta" value={Vrt} onChange={setVrt} options={KR_GAVETA} />
          <PBSelect label="Kcurva 90°" value={Curv} onChange={setCurv} options={K_CURVA_90} />
          <PBSelect label="Ka gradual" value={aplg} onChange={setAplg} options={KA_GRADUAL} />
        </div>
      </fieldset>

      {/* Sucção */}
      <fieldset className="border border-border rounded-xl p-4 space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 font-body">Tubulação de sucção</legend>
        <div className="grid grid-cols-3 gap-3">
          <PBInput label="Comprimento (m)" value={Lsuc} onChange={setLsuc} placeholder="Ex: 10" />
          <PBInput label="Diâmetro (mm)" value={Dsuc} onChange={setDsuc} placeholder="Ex: 200" />
          <PBInput label="Alt. geom. de Sucção (m)" value={Zgsuc} onChange={setZgsuc} placeholder="Ex: 3" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <PBSelect label="Diâm. bocal de sucção da bomba (mm)" value={Dbsuc} onChange={setDbsuc} options={DIAMETROS_BOCAL} />
        </div>
        <div className="grid grid-cols-4 gap-2">
          <PBSelect label="Kr excêntrica" value={Rex} onChange={setRex} options={K_EXCENTRICA} />
          <PBSelect label="Kv pé c/ crivo" value={Vpc} onChange={setVpc} options={KV_PE_CRIVO} />
          <PBSelect label="Kr gaveta" value={Rgs} onChange={setRgs} options={KR_GAVETA_SUC} />
          <PBSelect label="K curvas" value={Csuc} onChange={setCsuc} options={K_CURVAS_SUC} />
        </div>
      </fieldset>

      {/* Rendimentos */}
      <div className="grid grid-cols-2 gap-4">
        <PBInput label="Rendimento da Bomba (%)" value={nb} onChange={setNb} placeholder="Ex: 75" />
        <PBInput label="Rendimento do Motor (%)" value={nM} onChange={setNM} placeholder="Ex: 95" />
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg font-body">⚠ {error}</div>
      )}

      <button
        onClick={calculate}
        className="w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-xl font-body flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity"
      >
        <Zap size={18} />
        Calcular Potência da Bomba
      </button>

      {/* Results */}
      <fieldset className="border border-border rounded-xl p-4 space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 font-body">Cálculos</legend>
        <div className="grid grid-cols-2 gap-3">
          <ResultBox label="Altura dinâmica na sucção (m)" value={Hftsuc} />
          <ResultBox label="Veloc. da água na sucção (m/s)" value={Vsuc_res} />
          <ResultBox label="Altura dinâmica no recalque (m)" value={Hftadu} />
          <ResultBox label="Veloc. da água no recalque (m/s)" value={Vad_res} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ResultBox label="Alt. manométrica (m)" value={Hmt} />
          <div />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="equation-block rounded-xl p-3">
            <p className="text-xs font-body text-muted-foreground">Potência: No eixo</p>
            <p className="font-display text-xl font-bold text-primary">{Pb || "—"} <span className="text-sm font-body font-normal">CV</span></p>
          </div>
          <div className="equation-block rounded-xl p-3">
            <p className="text-xs font-body text-muted-foreground">Potência Absorvida</p>
            <p className="font-display text-xl font-bold text-primary">{Pabs || "—"} <span className="text-sm font-body font-normal">CV</span></p>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
