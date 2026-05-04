import { useState } from "react";
import { DollarSign } from "lucide-react";

// Potências comerciais de motores (CV)
const POTENCIAS_MOTOR = [1, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 175, 200, 250, 300, 350, 400, 500];
const TARIFAS_HORO = ["Verde", "Azul"];
const BANDEIRAS = ["Verde", "Amarela", "Vermelha 1", "Vermelha 2"];
const PERIODOS = ["Seco", "Úmido"];

export interface CustoState {
  tarifaHoro: string; bandeira: string;
  diasTrabalho: string; precoDemandaFP: string;
  horasForaPonta: string; horasPonta: string;
  potenciaComercial: string; periodo: string;
  tarifaPonta: string; tarifaForaPonta: string; tarifaBandeira: string;
  potDemanda: string; potAbsorvidaKW: string; volumeBombeado: string;
  energiaTotal: string; custoEnergia: string; custoDemanda: string;
  custoFinal: string; custoPorM3: string; custoPorMm: string;
}

interface Props {
  Qin: number;
  Tgi: number;
  PabsCV: number;
  state: CustoState;
  onStateChange: (s: Partial<CustoState>) => void;
}

function CEInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 font-body">{label}</label>
      <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} step="any"
        className="w-full px-2 py-1.5 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 no-spinner"
        style={{ borderColor: "hsl(var(--border))" }} />
    </div>
  );
}

function CESelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: (string | number)[] }) {
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

function ResultCard({ label, value, unit, highlight }: { label: string; value: string; unit?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? "equation-block" : "bg-muted"}`}>
      <p className="text-xs font-body text-muted-foreground">{label}</p>
      <p className={`font-semibold font-body mt-0.5 ${highlight ? "text-primary" : "text-foreground"}`}>
        {value || "—"} {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}

export default function CustoEnergiaCalculator({ Qin, Tgi, PabsCV, state, onStateChange }: Props) {
  const [error, setError] = useState("");
  const set = (k: keyof CustoState, v: string) => onStateChange({ [k]: v });

  const calculate = () => {
    setError("");
    try {
      const dt = parseFloat(state.diasTrabalho);
      const tg = Tgi || 24;
      const pcom = parseFloat(state.potenciaComercial);
      const pdfp = parseFloat(state.precoDemandaFP) || 0;
      const hfp = parseFloat(state.horasForaPonta) || 0;
      const hdp = parseFloat(state.horasPonta) || 0;
      const tfp = parseFloat(state.tarifaForaPonta) || 0;
      const tarf = parseFloat(state.tarifaPonta) || 0;
      const pdnp = parseFloat(state.tarifaBandeira) || 0;

      if (isNaN(dt) || isNaN(pcom)) {
        setError("Preencha os campos: Dias de Trabalho e Potência do motor.");
        return;
      }

      const Potd = parseFloat((pcom * 0.7355).toFixed(2));
      const Potab = parseFloat((PabsCV * 0.7355).toFixed(2));
      const Volb = parseFloat((Qin * dt * tg).toFixed(2));
      const EneTot = parseFloat((Potab * dt * tg).toFixed(2));
      const Cfp = dt * hfp * Potab * tfp;
      const Cdp_e = dt * hdp * Potab * tarf;
      const CengVal = parseFloat((Cfp + Cdp_e).toFixed(2));
      const Nmeses = dt / 30;
      const Cdnp = Potd * pdnp * Nmeses;
      const Cdfp = Potd * pdfp * Nmeses;

      let CdemVal = 0;
      if (state.tarifaHoro === "Azul") {
        CdemVal = parseFloat((Math.max(Cdnp, Cdfp)).toFixed(2));
      } else {
        CdemVal = parseFloat((Potd * pdfp * Nmeses).toFixed(2));
      }

      const CfVal = parseFloat((CdemVal + CengVal).toFixed(2));
      const CmcVal = parseFloat((CfVal / Volb).toFixed(3));

      onStateChange({
        potDemanda: Potd.toFixed(2),
        potAbsorvidaKW: Potab.toFixed(2),
        volumeBombeado: Volb.toFixed(2),
        energiaTotal: EneTot.toFixed(2),
        custoEnergia: CengVal.toFixed(2),
        custoDemanda: CdemVal.toFixed(2),
        custoFinal: CfVal.toFixed(2),
        custoPorM3: CmcVal.toFixed(3),
        custoPorMm: (10 * CmcVal).toFixed(3),
      });
    } catch {
      setError("Erro no cálculo. Verifique os dados inseridos.");
    }
  };

  return (
    <div className="p-6 space-y-5">
      <fieldset className="border border-border rounded-xl p-4 space-y-4">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 font-body">Dados</legend>
        <div className="grid grid-cols-2 gap-3">
          <CESelect label="Tarifa Horo-sazonal" value={state.tarifaHoro} onChange={v => set("tarifaHoro", v)} options={TARIFAS_HORO} />
          <CESelect label="Bandeira" value={state.bandeira} onChange={v => set("bandeira", v)} options={BANDEIRAS} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <CEInput label="Dias de Trabalho" value={state.diasTrabalho} onChange={v => set("diasTrabalho", v)} placeholder="Ex: 120" />
          <CEInput label="Preço da Demanda FP (R$/kW)" value={state.precoDemandaFP} onChange={v => set("precoDemandaFP", v)} placeholder="Ex: 12.50" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <CEInput label="Horas em horário fora de ponta" value={state.horasForaPonta} onChange={v => set("horasForaPonta", v)} placeholder="Ex: 18" />
          <CEInput label="Preço da Demanda NP (R$/kW)" value={state.tarifaBandeira} onChange={v => set("tarifaBandeira", v)} placeholder="Ex: 44.28" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <CEInput label="Horas em horário de ponta" value={state.horasPonta} onChange={v => set("horasPonta", v)} placeholder="Ex: 6" />
          <CESelect label="Potência do motor comercial (CV)" value={state.potenciaComercial} onChange={v => set("potenciaComercial", v)} options={POTENCIAS_MOTOR} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <CEInput label="Tarifa em horário de ponta (R$/kW)" value={state.tarifaPonta} onChange={v => set("tarifaPonta", v)} placeholder="Ex: 0.85" />
          <CESelect label="Período do ano" value={state.periodo} onChange={v => set("periodo", v)} options={PERIODOS} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <CEInput label="Tarifa em horário fora de ponta (R$/kW)" value={state.tarifaForaPonta} onChange={v => set("tarifaForaPonta", v)} placeholder="Ex: 0.45" />
          <div />
        </div>
      </fieldset>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg font-body">⚠ {error}</div>
      )}

      <button onClick={calculate}
        className="w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-xl font-body flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity">
        <DollarSign size={18} />
        Calcular Custo de Energia
      </button>

      <fieldset className="border border-border rounded-xl p-4 space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 font-body">Resultados</legend>
        <div className="grid grid-cols-2 gap-3">
          <ResultCard label="Potência demanda (kW)" value={state.potDemanda} />
          <ResultCard label="Volume bombeado (m³)" value={state.volumeBombeado} />
          <ResultCard label="Potência Absorvida (kW)" value={state.potAbsorvidaKW} />
          <ResultCard label="Energia Total (kWh)" value={state.energiaTotal} />
          <ResultCard label="Custo da Energia (R$)" value={state.custoEnergia} />
          <ResultCard label="Custo da demanda (R$)" value={state.custoDemanda} />
          <ResultCard label="Custo Final da Energia (R$)" value={state.custoFinal} highlight />
          <ResultCard label="Custo por m³ (R$/m³)" value={state.custoPorM3} />
        </div>
        <ResultCard label="Custo por mm d'água (R$/mm)" value={state.custoPorMm} />
      </fieldset>
    </div>
  );
}
