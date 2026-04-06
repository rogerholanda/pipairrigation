import { useState } from "react";
import { Droplets, AlertTriangle } from "lucide-react";

const LATERAL_DIAMETERS = [5.3, 13, 13.6, 16, 20.6, 26.9];
const TERTIARY_DIAMETERS = [35.7, 48.1, 72.5, 97.6];
const CONNECTION_SIZES = [
  { value: "3.8", label: "3.8 mm — Gotejador FT" },
  { value: "5", label: "5.0 mm — Gotejador FT" },
  { value: "7.6", label: "7.6 mm — Gotejador FT" },
  { value: "0.23", label: "0.23 mm — Tubo gotejador" },
];
const CVF_OPTIONS = ["0.03", "0.05", "0.07", "0.08"];

interface Results {
  viscosity: number; density: number;
  qLat1: number; qLatu: number; vel: number; nr: number; f: number;
  nte: number; fch: number; fa: number; leq: number;
  hflat: number; hiL: number; vh: number; hfmax: number;
  nLat: number; qt: number; sf: number; ft: number; frC: number;
  hfT: number; hfTerc: number;
  hf1s?: number; hf2s?: number; hfdm?: number;
  // Extra 2-diameter intermediate values
  qseg2?: number; Qes2?: number; Sf2s?: number; f2sKeller?: number;
  Fch2s?: number; Fr2s?: number; ft2s?: number; ftDm?: number;
  hfComD1?: number; hfComD2?: number;
  hTerc: number; hmins: number; vhs: number; vhTerc: number;
  qmin: number; uniformity: number;
  warning?: string;
  isTwoDiam?: boolean;
}

export default function LocalizedCalculator() {
  const [subTab, setSubTab] = useState<"lateral" | "terciaria" | "subunidade">("lateral");

  // Inputs
  const [materialLat, setMaterialLat] = useState<"PEBD" | "PVC">("PEBD");
  const [materialTerc, setMaterialTerc] = useState<"PEBD" | "PVC">("PEBD");
  const [customRoughnessLat, setCustomRoughnessLat] = useState(false);
  const [roughnessLat, setRoughnessLat] = useState("0.0015");
  const [llat1, setLlat1] = useState("");
  const [llatu, setLlatu] = useState("");
  const [di, setDi] = useState("26.9");
  const [conex, setConex] = useState("3.8");
  const [eem, setEem] = useState("");
  const [qem, setQem] = useState("");
  const [psem, setPsem] = useState("");
  const [temp, setTemp] = useState("20");
  const [lterc, setLterc] = useState("");
  const [elat, setElat] = useState("");
  const [dseg1, setDseg1] = useState("35.7");
  const [dseg2, setDseg2] = useState("35.7");
  const [nep, setNep] = useState("");
  const [cvf, setCvf] = useState("0.03");
  const [expVal, setExpVal] = useState("");
  const [cdk, setCdk] = useState("");
  const [vq, setVq] = useState("");
  const [tercOption, setTercOption] = useState<"1" | "2">("1");

  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState("");

  const getRoughness = (mat: string) => (mat === "PEBD" ? 0.0015 : 0.003334);

  const calcViscosity = (T: number) => {
    const K = T + 273.16;
    const Lgu = -11.73 + 1828 / K + 0.01966 * K - 0.00001466 * K ** 2;
    return (10 ** Lgu) / 100;
  };

  const calcDensity = (T: number) => {
    const Fct = ((T - 3.983035) ** 2) * (T + 301.797) / (522528.9 * (T + 69.34881));
    return 1000 * (1 - Fct);
  };

  const colebrookIter = (rug: number, diam: number, re: number) => {
    let oldf = 1;
    for (let i = 0; i < 200; i++) {
      const newf = 1 / (-2 * Math.log10(rug / (3.7 * diam) + 2.51 / (re * Math.sqrt(oldf)))) ** 2;
      if (Math.abs((newf - oldf) / oldf) < 0.001) { oldf = newf; break; }
      oldf = newf;
    }
    return oldf;
  };

  const calculate = () => {
    setError("");
    try {
      const Llat1 = parseFloat(llat1);
      const Llatu = parseFloat(llatu);
      const Di = parseFloat(di);
      const Conex = parseFloat(conex);
      const Eem = parseFloat(eem);
      const Qem = parseFloat(qem);
      const PSem = parseFloat(psem);
      const Tempa = parseFloat(temp);
      const Lterc = parseFloat(lterc);
      const Elat = parseFloat(elat);
      const Dseg1 = parseFloat(dseg1);
      const Dseg2V = parseFloat(dseg2);
      const Nep = parseFloat(nep);
      const Cvf = parseFloat(cvf);
      const Exp = parseFloat(expVal);
      const Cdk = parseFloat(cdk);
      const Vq = parseFloat(vq);
      const rugLat = customRoughnessLat ? parseFloat(roughnessLat) : getRoughness(materialLat);
      const eT = getRoughness(materialTerc);

      if ([Llat1, Llatu, Di, Conex, Eem, Qem, PSem, Tempa, Lterc, Elat, Dseg1, Nep, Cvf, Exp, Cdk, Vq].some(isNaN)) {
        setError("Preencha todos os campos corretamente.");
        return;
      }

      const u = calcViscosity(Tempa);
      const Uc = u * 1000;
      const mespa = parseFloat(calcDensity(Tempa).toFixed(2));

      // VH e Hfmax
      const VH = parseFloat((1 - (1 - Vq / 100) ** (1 / Exp)).toFixed(2));
      const Hfmax = parseFloat((PSem * VH / (1 - 0.73 * VH)).toFixed(2));

      // Vazões nas laterais
      const QLat1 = parseFloat(((Llat1 / Eem) * Qem).toFixed(2));
      const QLatu = parseFloat(((Llatu / Eem) * Qem).toFixed(2));

      // Velocidade na última lateral
      const vel = parseFloat((QLatu / (2.8274 * Di ** 2)).toFixed(2));

      // Reynolds
      const NR = parseFloat((mespa * vel * Di / Uc).toFixed(0));

      // Fator de atrito
      let f: number;
      if (NR < 2000) {
        f = 64 / NR;
      } else {
        f = colebrookIter(rugLat, Di, NR);
      }
      f = parseFloat(f.toFixed(4));

      // Emissores
      const Nte = parseFloat((Llatu / Eem).toFixed(2));

      // Christiansen F
      const Fch = parseFloat((1 / 2.75 + 1 / (2 * Nte) + Math.sqrt(0.75) / (6 * Nte ** 2)).toFixed(3));

      // Scaloppi Fa
      const Fa = parseFloat(((Fch * Nte + 1 - 1) / (Nte + 1 - 1)).toFixed(3));

      // Comprimento equivalente
      let Leq: number;
      if (Conex === 0.23) {
        Leq = parseFloat((Llatu * ((Eem + 0.23) / Eem)).toFixed(2));
      } else {
        const fe = parseFloat((0.25 * Conex * 19 * Di ** (-1.9)).toFixed(4));
        Leq = parseFloat((Llatu * ((Eem + fe) / Eem)).toFixed(2));
      }

      // Perda de carga na lateral
      const Hflat = parseFloat((6.376 * f * QLatu ** 2 * Leq * Fa / Di ** 5).toFixed(2));

      let warning: string | undefined;
      if (Hflat > Hfmax) {
        warning = "Diâmetro da Tubulação Lateral Inadequado!";
      }

      // Carga de pressão no início da lateral
      const HiL = parseFloat((PSem + 0.73 * Hflat).toFixed(2));

      // === TERCIÁRIA ===
      const NLat = parseFloat((Lterc / Elat).toFixed(1));
      const QT = parseFloat((((QLat1 + QLatu) / 2) * NLat).toFixed(2));
      const Sf = parseFloat((2 * QLatu / (QLat1 + QLatu)).toFixed(3));

      const velt = parseFloat((QT / (2.8274 * Dseg1 ** 2)).toFixed(2));
      const NRt = parseFloat((mespa * velt * Dseg1 / Uc).toFixed(0));

      // Fator de atrito terciária (VBA usa Di na rugosidade)
      const ft = parseFloat(colebrookIter(eT, Di, NRt).toFixed(4));

      const Fcht = parseFloat((1 / 2.75 + 1 / (2 * NLat) + Math.sqrt(0.75) / (6 * NLat ** 2)).toFixed(3));
      const Fs = parseFloat((0.38 * Sf ** 1.25 + 0.62).toFixed(3));
      const FrC = parseFloat((Fcht * Fs).toFixed(3));

      const HfT = parseFloat((6.376 * ft * QT ** 2 * Lterc * FrC / Dseg1 ** 5).toFixed(3));

      let HfTerc: number;
      let hf1s: number | undefined;
      let hf2sVal: number | undefined;
      let hfdmVal: number | undefined;

      const extraTwoDiam: Partial<Results> = {};

      if (tercOption === "1") {
        HfTerc = parseFloat(HfT.toFixed(2));
      } else {
        if (isNaN(Dseg2V)) {
          setError("Preencha o diâmetro do 2º segmento.");
          return;
        }

        const Ni = parseFloat(((NLat / 2) + 1).toFixed(1));
        const qseg2 = parseFloat((QLat1 * (NLat - Ni) / (NLat - 1) + QLatu * (Ni - 1) / (NLat - 1)).toFixed(2));
        const Qes2 = parseFloat((((qseg2 + QLatu) / 2) * (NLat - Ni + 1)).toFixed(2));

        const Sf2s = parseFloat((2 * QLatu / (qseg2 + QLatu)).toFixed(3));
        const f2sKeller = parseFloat((0.38 * Sf2s ** 1.25 + 0.62).toFixed(3));
        const Nl2s = parseFloat((NLat / 2).toFixed(1));
        const Fch2s = parseFloat((1 / 2.75 + 1 / (2 * Nl2s) + Math.sqrt(0.75) / (6 * Nl2s ** 2)).toFixed(4));
        const Fr2s = parseFloat((Fch2s * f2sKeller).toFixed(4));

        const ve2s = parseFloat((Qes2 / (2.8274 * Dseg1 ** 2)).toFixed(2));
        const NR2s = parseFloat((mespa * ve2s * Dseg1 / Uc).toFixed(0));
        const f2s = parseFloat(colebrookIter(eT, Dseg1, NR2s).toFixed(4));

        const LT2s = parseFloat((Lterc / 2).toFixed(1));
        const Hf2s = parseFloat((6.376 * f2s * Qes2 ** 2 * LT2s * Fr2s / Dseg1 ** 5).toFixed(2));

        const vedm = parseFloat((Qes2 / (2.8274 * Dseg2V ** 2)).toFixed(2));
        const NRdm = parseFloat((mespa * vedm * Dseg2V / Uc).toFixed(0));
        const fdm = parseFloat(colebrookIter(eT, Dseg2V, NRdm).toFixed(4));
        const Hfdm = parseFloat((6.376 * fdm * Qes2 ** 2 * LT2s * Fr2s / Dseg2V ** 5).toFixed(3));

        hf1s = HfT - Hf2s;
        hf2sVal = Hf2s;
        hfdmVal = Hfdm;
        HfTerc = parseFloat((hf1s + Hfdm).toFixed(2));

        // Store extra intermediates for display
        Object.assign(extraTwoDiam, {
          qseg2, Qes2, Sf2s, f2sKeller, Fch2s: Fch2s, Fr2s,
          ft2s: f2s, ftDm: fdm, hfComD1: Hf2s, hfComD2: Hfdm,
        });
      }

      // === SUBUNIDADE ===
      const HTerc = HiL + HfTerc;
      const Hmins = HTerc - HfTerc - Hflat;
      const VHs = HTerc - Hmins;
      const VHterc = VHs - Hflat;
      const qminVal = parseFloat((Cdk * Hmins ** Exp).toFixed(2));
      const uniformity = parseFloat((100 * ((1 - 1.27 * Cvf / Math.sqrt(Nep)) * qminVal / Qem)).toFixed(2));

      setResults({
        viscosity: parseFloat(Uc.toFixed(2)), density: mespa,
        qLat1: QLat1, qLatu: QLatu, vel, nr: NR, f,
        nte: Nte, fch: Fch, fa: Fa, leq: Leq,
        hflat: Hflat, hiL: HiL, vh: VH, hfmax: Hfmax,
        nLat: NLat, qt: QT, sf: Sf, ft, frC: FrC,
        hfT: HfT, hfTerc: HfTerc,
        hf1s, hf2s: hf2sVal, hfdm: hfdmVal,
        ...extraTwoDiam,
        isTwoDiam: tercOption === "2",
        hTerc: HTerc, hmins: Hmins, vhs: VHs, vhTerc: VHterc,
        qmin: qminVal, uniformity, warning,
      });

      setSubTab("terciaria");
    } catch {
      setError("Erro no cálculo. Verifique os dados inseridos.");
    }
  };

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex border-b border-border">
        {([
          { key: "lateral" as const, label: "Dados" },
          { key: "terciaria" as const, label: "Cálculos" },
          { key: "subunidade" as const, label: "Cálculos Complementares" },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={`flex-1 py-2.5 text-xs font-semibold font-body transition-colors border-b-2 ${
              subTab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: LATERAL ── */}
      {subTab === "lateral" && (
        <div className="p-6 space-y-4">
          {/* Material Lateral */}
          <FieldLabel label="Material da Lateral" />
          <div className="flex gap-3">
            {(["PEBD", "PVC"] as const).map(m => (
              <button key={m} onClick={() => { setMaterialLat(m); if (!customRoughnessLat) setRoughnessLat(getRoughness(m).toString()); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold font-body transition-all border ${
                  materialLat === m
                    ? "gradient-primary text-primary-foreground border-transparent shadow-md"
                    : "bg-muted text-muted-foreground border-border hover:border-primary"
                }`}>{m}</button>
            ))}
          </div>
          <div className="mt-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-body">
              Rugosidade Absoluta (mm)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={roughnessLat}
                onChange={e => { if (customRoughnessLat) setRoughnessLat(e.target.value); }}
                readOnly={!customRoughnessLat}
                placeholder="Ex: 0.0015"
                className={`flex-1 px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 no-spinner ${!customRoughnessLat ? 'cursor-default' : ''}`}
                style={{ borderColor: "hsl(var(--border))" }}
              />
              <button
                type="button"
                onClick={() => {
                  if (customRoughnessLat) {
                    setCustomRoughnessLat(false);
                    setRoughnessLat(getRoughness(materialLat).toString());
                  } else {
                    setCustomRoughnessLat(true);
                  }
                }}
                className={`px-3 py-2 rounded-lg border text-xs font-semibold font-body transition-all ${
                  customRoughnessLat
                    ? "gradient-primary text-primary-foreground border-transparent"
                    : "bg-muted text-muted-foreground border-border hover:border-primary"
                }`}
                title={customRoughnessLat ? "Usar valores pré-definidos" : "Digitar valor personalizado"}
              >
                {customRoughnessLat ? "Lista" : "✎"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <NumInput label="Compr. 1ª Lateral (m)" value={llat1} onChange={setLlat1} hideSpinner />
            <NumInput label="Compr. Última Lateral (m)" value={llatu} onChange={setLlatu} hideSpinner />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SelectInput label="Diâmetro Interno (mm)" value={di} onChange={setDi} editable
              options={LATERAL_DIAMETERS.map(d => ({ value: String(d), label: `${d} mm` }))} />
            <SelectInput label="Conexão Emissor" value={conex} onChange={setConex} editable
              options={CONNECTION_SIZES.map(c => ({ value: c.value, label: c.label }))} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <NumInput label="Espaçam. Emissores (m)" value={eem} onChange={setEem} hideSpinner />
            <NumInput label="Vazão Emissor (L/h)" value={qem} onChange={setQem} hideSpinner />
            <NumInput label="Pressão Serviço (m.c.a.)" value={psem} onChange={setPsem} hideSpinner />
          </div>

          <NumInput label="Temperatura (°C)" value={temp} onChange={setTemp} hideSpinner />

          <hr className="border-border" />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Dados da Terciária</p>

          {/* Material Terciária */}
          <FieldLabel label="Material da Terciária" />
          <div className="flex gap-3">
            {(["PEBD", "PVC"] as const).map(m => (
              <button key={m} onClick={() => setMaterialTerc(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold font-body transition-all border ${
                  materialTerc === m
                    ? "gradient-primary text-primary-foreground border-transparent shadow-md"
                    : "bg-muted text-muted-foreground border-border hover:border-primary"
                }`}>{m}</button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <NumInput label="Compr. Terciária (m)" value={lterc} onChange={setLterc} hideSpinner />
            <NumInput label="Espaçam. Laterais (m)" value={elat} onChange={setElat} hideSpinner />
          </div>

          {/* Opção 1 ou 2 diâmetros */}
          <FieldLabel label="Diâmetros na Terciária" />
          <div className="flex gap-3">
            {([{ v: "1" as const, l: "1 Diâmetro" }, { v: "2" as const, l: "2 Diâmetros" }]).map(o => (
              <button key={o.v} onClick={() => setTercOption(o.v)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold font-body transition-all border ${
                  tercOption === o.v
                    ? "gradient-primary text-primary-foreground border-transparent shadow-md"
                    : "bg-muted text-muted-foreground border-border hover:border-primary"
                }`}>{o.l}</button>
            ))}
          </div>

          <div className={`grid ${tercOption === "2" ? "grid-cols-2" : "grid-cols-1"} gap-4`}>
            <SelectInput label="Diâm. 1º Segmento (mm)" value={dseg1} onChange={setDseg1} editable
              options={TERTIARY_DIAMETERS.map(d => ({ value: String(d), label: `${d} mm` }))} />
            {tercOption === "2" && (
              <SelectInput label="Diâm. 2º Segmento (mm)" value={dseg2} onChange={setDseg2}
                options={TERTIARY_DIAMETERS.map(d => ({ value: String(d), label: `${d} mm` }))} editable />
            )}
          </div>

          <hr className="border-border" />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Uniformidade</p>

          <div className="grid grid-cols-2 gap-4">
            <NumInput label="Expoente (x)" value={expVal} onChange={setExpVal} hideSpinner />
            <NumInput label="Coef. Descarga (Cd·k)" value={cdk} onChange={setCdk} hideSpinner />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <NumInput label="Variação Vazão (%)" value={vq} onChange={setVq} hideSpinner />
            <NumInput label="Nº Emissores/Planta" value={nep} onChange={setNep} hideSpinner />
            <SelectInput label="CVf" value={cvf} onChange={setCvf} editable
              options={CVF_OPTIONS.map(c => ({ value: c, label: c }))} />
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg font-body flex items-center gap-2">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <button onClick={calculate}
            className="w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-xl font-body flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity">
            <Droplets size={18} /> Calcular
          </button>
        </div>
      )}

      {/* ── TAB: TERCIÁRIA ── */}
      {subTab === "terciaria" && (
        <div className="p-6 space-y-4">
          {!results ? (
            <p className="text-sm text-muted-foreground font-body text-center py-8">
              Preencha os dados na aba "Lateral" e clique em Calcular.
            </p>
          ) : (
            <>
              {results.warning && (
                <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg font-body flex items-center gap-2">
                  <AlertTriangle size={16} /> {results.warning}
                </div>
              )}

              <h3 className="font-display font-semibold text-foreground text-sm">Propriedades do Fluido</h3>
              <div className="grid grid-cols-2 gap-3">
                <ResCard label="Viscosidade dinâmica" value={`${results.viscosity} × 10⁻³ N.s/m²`} />
                <ResCard label="Massa específica" value={`${results.density} kg/m³`} />
              </div>

              <h3 className="font-display font-semibold text-foreground text-sm mt-4">Lateral</h3>
              <div className="grid grid-cols-2 gap-3">
                <ResCard label="Vazão 1ª Lateral" value={`${results.qLat1} L/h`} />
                <ResCard label="Vazão Última Lateral" value={`${results.qLatu} L/h`} />
                <ResCard label="Velocidade" value={`${results.vel} m/s`} />
                <ResCard label="Nº Reynolds" value={String(results.nr)} />
                <ResCard label="Fator de Atrito (f)" value={String(results.f)} />
                <ResCard label="Nº Emissores (Nte)" value={String(results.nte)} />
                <ResCard label="F Christiansen" value={String(results.fch)} />
                <ResCard label="Fa Scaloppi" value={String(results.fa)} />
                <ResCard label="Compr. Equivalente" value={`${results.leq} m`} />
                <ResCard label="VH" value={String(results.vh)} />
              </div>

              <div className="equation-block px-5 py-4">
                <p className="text-xs text-muted-foreground font-body mb-1">Perda de Carga na Lateral (hf)</p>
                <p className="font-display text-2xl font-bold text-primary">{results.hflat} <span className="text-base font-body font-normal">m.c.a.</span></p>
              </div>
              <div className="equation-block px-5 py-4">
                <p className="text-xs text-muted-foreground font-body mb-1">Hf máximo permitido</p>
                <p className="font-display text-lg font-bold text-primary">{results.hfmax} <span className="text-base font-body font-normal">m.c.a.</span></p>
              </div>
              <ResCard label="Carga Pressão Início Lateral (HiL)" value={`${results.hiL} m.c.a.`} highlight />

              <h3 className="font-display font-semibold text-foreground text-sm mt-4">
                {results.isTwoDiam
                  ? "Decréscimo de Carga no compr. Total da Terciária com Diâmetro maior"
                  : "Terciária"}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <ResCard label="Número de Laterais" value={String(results.nLat)} />
                <ResCard label="Fator de atrito (f)" value={String(results.ft)} />
                <ResCard label="Vazão na entrada da Terciária (L/h)" value={`${results.qt}`} />
                <ResCard label="Fator F' (Keller)" value={String(results.frC)} />
                <ResCard label="Fator de forma (Sf-I)" value={String(results.sf)} />
                <ResCard label="Hf na Terciária (m)" value={`${results.hfT.toFixed(3)}`} />
              </div>

              {results.isTwoDiam && results.hf1s !== undefined && (
                <>
                  <h3 className="font-display font-semibold text-foreground text-sm mt-4">
                    Decréscimo de carga no 2º segmento da Terciária
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <ResCard label="Vazão na 1ª Lateral do 2º seg. (L/h)" value={`${results.qseg2}`} />
                    <ResCard label="Fator de atrito (f) p/ D1" value={`${results.ft2s}`} />
                    <ResCard label="Vazão no 2º seg. da terciária (L/h)" value={`${results.Qes2}`} />
                    <ResCard label="Hf com D1 maior (m)" value={`${results.hfComD1?.toFixed(2)}`} />
                    <ResCard label="Fator de forma (Sf-II)" value={`${results.Sf2s}`} />
                    <ResCard label="Fator de atrito (f) p/ D2" value={`${results.ftDm}`} />
                    <ResCard label="Fator F' (Keller)" value={`${results.Fr2s}`} />
                    <ResCard label="Hf com D2 menor (m)" value={`${results.hfComD2?.toFixed(3)}`} />
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="equation-block px-4 py-3 text-center">
                      <p className="text-xs text-muted-foreground font-body mb-1">Hf 1º seg. (m)</p>
                      <p className="font-display text-lg font-bold text-primary">{results.hf1s.toFixed(2)}</p>
                    </div>
                    <div className="equation-block px-4 py-3 text-center">
                      <p className="text-xs text-muted-foreground font-body mb-1">Hf 2º seg. (m)</p>
                      <p className="font-display text-lg font-bold text-primary">{results.hfdm?.toFixed(3)}</p>
                    </div>
                    <div className="equation-block px-4 py-3 text-center">
                      <p className="text-xs text-muted-foreground font-body mb-1">Hf Total (m)</p>
                      <p className="font-display text-lg font-bold text-primary">{results.hfTerc}</p>
                    </div>
                  </div>
                </>
              )}

              {!results.isTwoDiam && (
                <div className="equation-block px-5 py-4">
                  <p className="text-xs text-muted-foreground font-body mb-1">Decréscimo Total na Terciária</p>
                  <p className="font-display text-2xl font-bold text-primary">{results.hfTerc} <span className="text-base font-body font-normal">m.c.a.</span></p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── TAB: SUBUNIDADE ── */}
      {subTab === "subunidade" && (
        <div className="p-6 space-y-4">
          {!results ? (
            <p className="text-sm text-muted-foreground font-body text-center py-8">
              Preencha os dados na aba "Lateral" e clique em Calcular.
            </p>
          ) : (
            <>
              <h3 className="font-display font-semibold text-foreground text-sm">Pressões na Subunidade</h3>
              <div className="grid grid-cols-2 gap-3">
                <ResCard label="Carga Pressão Máxima" value={`${results.hTerc.toFixed(2)} m.c.a.`} highlight />
                <ResCard label="Carga Pressão Mínima" value={`${results.hmins.toFixed(2)} m.c.a.`} />
                <ResCard label="Variação Carga Pressão" value={`${results.vhs.toFixed(2)} m.c.a.`} />
                <ResCard label="Var. Admissível Terciária" value={`${results.vhTerc.toFixed(2)} m.c.a.`} />
              </div>

              <h3 className="font-display font-semibold text-foreground text-sm mt-4">Vazão e Uniformidade</h3>
              <div className="grid grid-cols-2 gap-3">
                <ResCard label="Vazão Mínima (qmin)" value={`${results.qmin} L/h`} />
              </div>

              <div className="equation-block px-5 py-4">
                <p className="text-xs text-muted-foreground font-body mb-1">Uniformidade de Aplicação</p>
                <p className="font-display text-2xl font-bold text-primary">{results.uniformity} <span className="text-base font-body font-normal">%</span></p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Helper components ── */

function FieldLabel({ label }: { label: string }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 font-body">
      {label}
    </label>
  );
}

function NumInput({ label, value, onChange, placeholder, hideSpinner }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hideSpinner?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-body">{label}</label>
      <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground ${hideSpinner ? "no-spinner" : ""}`}
        style={{ borderColor: "hsl(var(--border))" }} />
    </div>
  );
}

function SelectInput({ label, value, onChange, options, editable }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; editable?: boolean }) {
  const [isEditing, setIsEditing] = useState(false);

  if (editable) {
    return (
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-body">{label}</label>
        <div className="relative">
          {isEditing ? (
            <input
              type="text"
              value={value}
              onChange={e => onChange(e.target.value)}
              onBlur={() => setIsEditing(false)}
              autoFocus
              className="w-full px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 no-spinner"
              style={{ borderColor: "hsl(var(--border))" }}
            />
          ) : (
            <div className="flex gap-1">
              <select
                value={options.some(o => o.value === value) ? value : ""}
                onChange={e => { if (e.target.value) onChange(e.target.value); }}
                className="flex-1 px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                style={{ borderColor: "hsl(var(--border))" }}
              >
                {!options.some(o => o.value === value) && (
                  <option value="" disabled>{value || "Selecione..."}</option>
                )}
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-2 py-1 rounded-lg border text-xs font-body text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                style={{ borderColor: "hsl(var(--border))" }}
                title="Digitar valor personalizado"
              >
                ✏️
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-body">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        style={{ borderColor: "hsl(var(--border))" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function ResCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? "equation-block" : "bg-muted"}`}>
      <p className="text-xs font-body text-muted-foreground">{label}</p>
      <p className={`font-semibold font-body mt-0.5 text-sm ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
