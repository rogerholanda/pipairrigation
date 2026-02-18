import { useState } from "react";
import { DollarSign } from "lucide-react";

// Potências comerciais de motores (CV)
const POTENCIAS_MOTOR = [1, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 175, 200, 250, 300, 350, 400, 500];

// Tarifa Horo-sazonal
const TARIFAS_HORO = ["Verde", "Azul"];

// Bandeira tarifária
const BANDEIRAS = ["Verde", "Amarela", "Vermelha 1", "Vermelha 2"];

// Período do ano
const PERIODOS = ["Seco", "Úmido"];

interface Props {
  Qin: number;   // flow (m³/h)
  Tgi: number;   // irrigation time (h)
  PabsCV: number; // absorbed power in CV from previous tab
}

function CEInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
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

function CESelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: (string | number)[] }) {
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

export default function CustoEnergiaCalculator({ Qin, Tgi, PabsCV }: Props) {
  const [tarifaHoro, setTarifaHoro] = useState("Verde");
  const [bandeira, setBandeira] = useState("Verde");
  const [diasTrabalho, setDiasTrabalho] = useState("");
  const [precoDemandaFP, setPrecoDemandaFP] = useState("");
  const [horasForaPonta, setHorasForaPonta] = useState("");
  const [horasPonta, setHorasPonta] = useState("");
  const [potenciaComercial, setPotenciaComercial] = useState(String(POTENCIAS_MOTOR[5]));
  const [periodo, setPeriodo] = useState("Seco");
  const [tarifaPonta, setTarifaPonta] = useState("");
  const [tarifaForaPonta, setTarifaForaPonta] = useState("");
  const [tarifaBandeira, setTarifaBandeira] = useState("");

  // Results
  const [potDemanda, setPotDemanda] = useState("");
  const [potAbsorvidaKW, setPotAbsorvidaKW] = useState("");
  const [volumeBombeado, setVolumeBombeado] = useState("");
  const [energiaTotal, setEnergiaTotal] = useState("");
  const [custoEnergia, setCustoEnergia] = useState("");
  const [custoDemanda, setCustoDemanda] = useState("");
  const [custoFinal, setCustoFinal] = useState("");
  const [custoPorM3, setCustoPorM3] = useState("");
  const [custoPorMm, setCustoPorMm] = useState("");

  const [error, setError] = useState("");

  const calculate = () => {
    setError("");
    try {
      const dt = parseFloat(diasTrabalho);
      const tg = Tgi || 24;
      const pcom = parseFloat(potenciaComercial);
      const pdfp = parseFloat(precoDemandaFP) || 0;
      const hfp = parseFloat(horasForaPonta) || 0;
      const hdp = parseFloat(horasPonta) || 0;
      const tfp = parseFloat(tarifaForaPonta) || 0;
      const tarf = parseFloat(tarifaPonta) || 0;
      const pdnp = parseFloat(tarifaBandeira) || 0;

      if (isNaN(dt) || isNaN(pcom)) {
        setError("Preencha os campos: Dias de Trabalho e Potência do motor.");
        return;
      }

      // Potência demandada (kW)
      const Potd = parseFloat((pcom * 0.7355).toFixed(2));

      // Potência absorvida (kW)
      const Potab = parseFloat((PabsCV * 0.7355).toFixed(2));

      // Volume bombeado (m³)
      const Volb = parseFloat((Qin * dt * tg).toFixed(2));

      // Energia total (kWh)
      const EneTot = parseFloat((Potab * dt * tg).toFixed(2));

      // Custo de energia
      const Cfp = dt * hfp * Potab * tfp;
      const Cdp_e = dt * hdp * Potab * tarf;
      const CengVal = parseFloat((Cfp + Cdp_e).toFixed(2));

      // Número de meses
      const Nmeses = dt / 30;

      // Custo da demanda
      const Cdnp = Potd * pdnp * Nmeses;
      const Cdfp = Potd * pdfp * Nmeses;

      let CdemVal = 0;
      if (tarifaHoro === "Azul") {
        CdemVal = parseFloat((Math.max(Cdnp, Cdfp)).toFixed(2));
      } else {
        CdemVal = parseFloat((Potd * pdfp * Nmeses).toFixed(2));
      }

      const CfVal = parseFloat((CdemVal + CengVal).toFixed(2));
      const CmcVal = parseFloat((CfVal / Volb).toFixed(3));

      setPotDemanda(Potd.toFixed(2));
      setPotAbsorvidaKW(Potab.toFixed(2));
      setVolumeBombeado(Volb.toFixed(2));
      setEnergiaTotal(EneTot.toFixed(2));
      setCustoEnergia(CengVal.toFixed(2));
      setCustoDemanda(CdemVal.toFixed(2));
      setCustoFinal(CfVal.toFixed(2));
      setCustoPorM3(CmcVal.toFixed(3));
      setCustoPorMm((10 * CmcVal).toFixed(3));
    } catch {
      setError("Erro no cálculo. Verifique os dados inseridos.");
    }
  };

  return (
    <div className="p-6 space-y-5">
      <fieldset className="border border-border rounded-xl p-4 space-y-4">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 font-body">Dados</legend>
        <div className="grid grid-cols-2 gap-3">
          <CESelect label="Tarifa Horo-sazonal" value={tarifaHoro} onChange={setTarifaHoro} options={TARIFAS_HORO} />
          <CESelect label="Bandeira" value={bandeira} onChange={setBandeira} options={BANDEIRAS} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <CEInput label="Dias de Trabalho" value={diasTrabalho} onChange={setDiasTrabalho} placeholder="Ex: 120" />
          <CEInput label="Preço da Demanda FP (R$/kW)" value={precoDemandaFP} onChange={setPrecoDemandaFP} placeholder="Ex: 12.50" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <CEInput label="Horas em horário fora de ponta" value={horasForaPonta} onChange={setHorasForaPonta} placeholder="Ex: 18" />
          <CEInput label="Horas em horário de ponta" value={horasPonta} onChange={setHorasPonta} placeholder="Ex: 6" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <CESelect label="Potência do motor comercial (CV)" value={potenciaComercial} onChange={setPotenciaComercial} options={POTENCIAS_MOTOR} />
          <CESelect label="Período do ano" value={periodo} onChange={setPeriodo} options={PERIODOS} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <CEInput label="Tarifa em horário de ponta (R$/kW)" value={tarifaPonta} onChange={setTarifaPonta} placeholder="Ex: 0.85" />
          <CEInput label="Tarifa em horário fora de ponta (R$/kW)" value={tarifaForaPonta} onChange={setTarifaForaPonta} placeholder="Ex: 0.45" />
        </div>
        {tarifaHoro === "Azul" && (
          <CEInput label="Preço da Demanda NP (R$/kW)" value={tarifaBandeira} onChange={setTarifaBandeira} placeholder="Ex: 8.00" />
        )}
      </fieldset>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg font-body">⚠ {error}</div>
      )}

      <button
        onClick={calculate}
        className="w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-xl font-body flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity"
      >
        <DollarSign size={18} />
        Calcular Custo de Energia
      </button>

      {/* Results */}
      <fieldset className="border border-border rounded-xl p-4 space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 font-body">Resultados</legend>
        <div className="grid grid-cols-2 gap-3">
          <ResultCard label="Potência demanda (kW)" value={potDemanda} />
          <ResultCard label="Volume bombeado (m³)" value={volumeBombeado} />
          <ResultCard label="Potência Absorvida (kW)" value={potAbsorvidaKW} />
          <ResultCard label="Energia Total (kWh)" value={energiaTotal} />
          <ResultCard label="Custo da Energia (R$)" value={custoEnergia} />
          <ResultCard label="Custo da demanda (R$)" value={custoDemanda} />
          <ResultCard label="Custo Final da Energia (R$)" value={custoFinal} highlight />
          <ResultCard label="Custo por m³ (R$/m³)" value={custoPorM3} />
        </div>
        <ResultCard label="Custo por mm d'água (R$/mm)" value={custoPorMm} />
      </fieldset>
    </div>
  );
}
