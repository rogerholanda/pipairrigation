import { useState } from "react";
import { Zap, Pencil, RotateCcw } from "lucide-react";

// K values for fittings
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

export interface PotenciaState {
  Lad: string; Dad: string; Dbrec: string; Dreg: string; Zrec: string;
  Ampc: string; Rgv: string; Vrt: string; Curv: string; Rex: string; aplg: string;
  Lsuc: string; Dsuc: string; Zgsuc: string; Dbsuc: string;
  Rgs: string; Vpc: string; Csuc: string;
  nb: string; nM: string;
  Hftadu: string; Vsuc_res: string; Vad_res: string; Hftsuc: string;
  Hmt: string; Pb: string; Pabs: string;
}

interface Props {
  Qin: number;
  Hpp: number;
  rug: number;
  Tempag: number;
  state: PotenciaState;
  onStateChange: (s: Partial<PotenciaState>) => void;
  onPabs?: (pabs: number) => void;
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
      <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} step="any"
        className="w-full px-2 py-1.5 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 no-spinner"
        style={{ borderColor: "hsl(var(--border))" }} />
    </div>
  );
}

function PBSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: (number | string)[] }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 font-body">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-2 py-1.5 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        style={{ borderColor: "hsl(var(--border))" }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function PBComboField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: number[] }) {
  const [custom, setCustom] = useState(false);
  const isPreset = !custom && options.map(String).includes(value);
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 font-body">{label}</label>
      <div className="flex gap-1">
        {custom ? (
          <input
            type="number"
            step="any"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 no-spinner"
            style={{ borderColor: "hsl(var(--border))" }}
          />
        ) : (
          <select
            value={isPreset ? value : ""}
            onChange={e => onChange(e.target.value)}
            className="w-full px-1 py-1.5 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            style={{ borderColor: "hsl(var(--border))" }}
          >
            {options.map(o => <option key={o} value={String(o)}>{o}</option>)}
          </select>
        )}
        <button
          type="button"
          onClick={() => { const next = !custom; setCustom(next); if (!next) { onChange(String(options[0])); } }}
          title={custom ? "Usar valores predefinidos" : "Digitar valor personalizado"}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          {custom ? <RotateCcw size={11} /> : <Pencil size={11} />}
        </button>
      </div>
    </div>
  );
}

function ResultBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted rounded-xl p-3">
      <p className="text-xs font-body text-muted-foreground">{label}</p>
      <p className="font-semibold font-body mt-0.5 text-foreground">{value || "—"}</p>
    </div>
  );
}

export default function PotenciaBombaCalculator({ Qin, Hpp, rug, Tempag, state, onStateChange, onPabs }: Props) {
  const [error, setError] = useState("");
  const set = (k: keyof PotenciaState, v: string) => onStateChange({ [k]: v });

  const calculate = () => {
    setError("");
    try {
      const lad = parseFloat(state.Lad);
      const dad = parseFloat(state.Dad);
      const lsuc = parseFloat(state.Lsuc);
      const dsuc = parseFloat(state.Dsuc);
      const zrec = parseFloat(state.Zrec) || 0;
      const zgsuc = parseFloat(state.Zgsuc) || 0;
      const nbN = parseFloat(state.nb);
      const nMN = parseFloat(state.nM);
      const ampc = parseFloat(state.Ampc);
      const rgv = parseFloat(state.Rgv);
      const vrt = parseFloat(state.Vrt);
      const curv = parseFloat(state.Curv);
      const rex = parseFloat(state.Rex);
      const aplgN = parseFloat(state.aplg);
      const rgs = parseFloat(state.Rgs);
      const vpc = parseFloat(state.Vpc);
      const csuc = parseFloat(state.Csuc);
      const dbrec = parseFloat(state.Dbrec);
      const dbsuc = parseFloat(state.Dbsuc);
      const dreg = parseFloat(state.Dreg);

      if ([lad, dad, lsuc, dsuc, nbN, nMN].some(isNaN)) {
        setError("Preencha todos os campos obrigatórios.");
        return;
      }

      const u = calcViscosity(Tempag);
      const uc = parseFloat((u * 1000).toFixed(2));
      const mespag = calcDensity(Tempag);

      const Vad = parseFloat((353.67765 * Qin / dad ** 2).toFixed(2));
      const NRad = Math.round(mespag * Vad * dad / uc);
      const fad = colebrook(NRad, rug, dad);
      const Hfad = parseFloat(((6.376e6) * fad * Qin ** 2 * lad / dad ** 5).toFixed(2));

      const Vbd = parseFloat((353.67765 * Qin / dbrec ** 2).toFixed(2));
      const Ver = parseFloat((353.67765 * Qin / dreg ** 2).toFixed(2));
      const Hfsad = parseFloat(((ampc * Vbd ** 2 / 19.62) + ((rgv + aplgN) * Ver ** 2 / 19.62) + (vrt + curv) * Vad ** 2 / 19.62).toFixed(4));
      const HftaduVal = parseFloat((zrec + Hfad + Hfsad).toFixed(2));

      const Vsuc = parseFloat((353.67765 * Qin / dsuc ** 2).toFixed(2));
      const NRsuc = Math.round(mespag * Vsuc * dsuc / uc);
      const fsuc = colebrook(NRsuc, rug, dsuc);
      const Hfsuc_cont = parseFloat(((6.376e6) * fsuc * Qin ** 2 * lsuc / dsuc ** 5).toFixed(2));

      const VRe = parseFloat((353.67765 * Qin / dbsuc ** 2).toFixed(2));
      const Hfsuc_sing = parseFloat(((rex * VRe ** 2 / 19.62) + (rgs + vpc + csuc) * Vsuc ** 2 / 19.62).toFixed(4));
      const HftSucVal = parseFloat((zgsuc + Hfsuc_cont + Hfsuc_sing).toFixed(2));

      const HmtVal = parseFloat((Hpp + HftaduVal + HftSucVal).toFixed(2));
      const Qms = parseFloat((Qin / 3600).toFixed(5));
      const rendb = nbN / 100;
      const PbVal = parseFloat(((mespag * 9.81 * Qms * HmtVal / 1000) / (rendb * 0.7355)).toFixed(1));
      const rendM = nMN / 100;
      const PabsVal = parseFloat((PbVal / rendM).toFixed(1));

      onStateChange({
        Hftadu: HftaduVal.toFixed(2),
        Vad_res: Vad.toFixed(2),
        Vsuc_res: Vsuc.toFixed(2),
        Hftsuc: HftSucVal.toFixed(2),
        Hmt: HmtVal.toFixed(2),
        Pb: PbVal.toFixed(1),
        Pabs: PabsVal.toFixed(1),
      });
      onPabs?.(PabsVal);
    } catch {
      setError("Erro no cálculo. Verifique os dados inseridos.");
    }
  };

  return (
    <div className="p-6 space-y-5">
      <fieldset className="border border-border rounded-xl p-4 space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 font-body">Tubulação adutora</legend>
        <div className="grid grid-cols-2 gap-3">
          <PBInput label="Comprimento (m)" value={state.Lad} onChange={v => set("Lad", v)} placeholder="Ex: 50" />
          <PBInput label="Diâmetro (mm)" value={state.Dad} onChange={v => set("Dad", v)} placeholder="Ex: 200" />
        </div>
        <div className="grid grid-cols-2 gap-3 items-end">
          <PBSelect label="Diâm. bocal de descarga da bomba (mm)" value={state.Dbrec} onChange={v => set("Dbrec", v)} options={DIAMETROS_BOCAL} />
          <PBSelect label="Diâm. do Registro (mm)" value={state.Dreg} onChange={v => set("Dreg", v)} options={DIAMETROS_BOCAL} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <PBInput label="Alt. geom. de recalque (m)" value={state.Zrec} onChange={v => set("Zrec", v)} placeholder="Ex: 5" />
        </div>
        <div className="grid grid-cols-3 gap-2 items-end">
          <PBComboField label="Ka concêntrica" value={state.Ampc} onChange={v => set("Ampc", v)} options={KA_CONCENTRICA} />
          <PBComboField label="Kv retenção" value={state.Rgv} onChange={v => set("Rgv", v)} options={KV_RETENCAO} />
          <PBComboField label="Kr gaveta" value={state.Vrt} onChange={v => set("Vrt", v)} options={KR_GAVETA} />
        </div>
        <div className="grid grid-cols-2 gap-2 items-end">
          <PBComboField label="Kcurva 90°" value={state.Curv} onChange={v => set("Curv", v)} options={K_CURVA_90} />
          <PBComboField label="Ka gradual" value={state.aplg} onChange={v => set("aplg", v)} options={KA_GRADUAL} />
        </div>
      </fieldset>

      <fieldset className="border border-border rounded-xl p-4 space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 font-body">Tubulação de sucção</legend>
        <div className="grid grid-cols-3 gap-3">
          <PBInput label="Comprimento (m)" value={state.Lsuc} onChange={v => set("Lsuc", v)} placeholder="Ex: 10" />
          <PBInput label="Diâmetro (mm)" value={state.Dsuc} onChange={v => set("Dsuc", v)} placeholder="Ex: 200" />
          <PBInput label="Alt. geom. de Sucção (m)" value={state.Zgsuc} onChange={v => set("Zgsuc", v)} placeholder="Ex: 3" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <PBSelect label="Diâm. bocal de sucção da bomba (mm)" value={state.Dbsuc} onChange={v => set("Dbsuc", v)} options={DIAMETROS_BOCAL} />
        </div>
        <div className="grid grid-cols-4 gap-2 items-end">
          <PBComboField label="Kr excêntrica" value={state.Rex} onChange={v => set("Rex", v)} options={K_EXCENTRICA} />
          <PBComboField label="Kv pé c/ crivo" value={state.Vpc} onChange={v => set("Vpc", v)} options={KV_PE_CRIVO} />
          <PBComboField label="Kr gaveta" value={state.Rgs} onChange={v => set("Rgs", v)} options={KR_GAVETA_SUC} />
          <PBComboField label="K curvas" value={state.Csuc} onChange={v => set("Csuc", v)} options={K_CURVAS_SUC} />
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <PBInput label="Rendimento da Bomba (%)" value={state.nb} onChange={v => set("nb", v)} placeholder="Ex: 75" />
        <PBInput label="Rendimento do Motor (%)" value={state.nM} onChange={v => set("nM", v)} placeholder="Ex: 95" />
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg font-body">⚠ {error}</div>
      )}

      <button onClick={calculate}
        className="w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-xl font-body flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity">
        <Zap size={18} />
        Calcular Potência da Bomba
      </button>

      <fieldset className="border border-border rounded-xl p-4 space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 font-body">Resultados</legend>
        <div className="grid grid-cols-2 gap-3">
          <ResultBox label="Altura dinâmica na sucção (m)" value={state.Hftsuc} />
          <ResultBox label="Veloc. da água na sucção (m/s)" value={state.Vsuc_res} />
          <ResultBox label="Altura dinâmica no recalque (m)" value={state.Hftadu} />
          <ResultBox label="Veloc. da água no recalque (m/s)" value={state.Vad_res} />
          <ResultBox label="Alt. manométrica total (m)" value={state.Hmt} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="equation-block rounded-xl p-3">
            <p className="text-xs font-body text-muted-foreground">Potência no eixo</p>
            <p className="font-display text-xl font-bold text-primary">{state.Pb || "—"} <span className="text-sm font-body font-normal">CV</span></p>
          </div>
          <div className="equation-block rounded-xl p-3">
            <p className="text-xs font-body text-muted-foreground">Potência absorvida</p>
            <p className="font-display text-xl font-bold text-primary">{state.Pabs || "—"} <span className="text-sm font-body font-normal">CV</span></p>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
