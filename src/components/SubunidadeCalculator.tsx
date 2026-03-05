import { useState } from "react";
import { Droplets, AlertTriangle } from "lucide-react";

type LatOrientation = "horizontal" | "ascendente" | "descendente";
type TercOrientation = "horizontal" | "ascendente" | "descendente";

const LATERAL_DIAMETERS = [5.3, 13, 13.6, 16, 20.6, 26.9, 35.7];
const TERTIARY_DIAMETERS = [48.1, 72.5, 97.6];
const CONNECTION_SIZES = ["3.8", "5", "7.6"];
const CVF_OPTIONS = ["0.03", "0.05", "0.07"];

interface SubResults {
  // Fluid
  viscosity: number; density: number;
  // Lateral
  nel: number; ql: number; velLat: number; reLat: number; fLat: number;
  hfLat: number; hfeqLat: number; m: number; fchLat: number; fscpLat: number;
  hflcrg: number; rLat: number;
  // Tertiary
  nltc: number; qtc: number; velTc: number; reTc: number; fTc: number;
  hfTc: number; hfeqTc: number; fchTc: number; fscpTc: number;
  hftcor: number; rTc: number;
  // Subunit intermediates
  ilat: number; jlat: number; itc: number; jtc: number;
  // Subunit pressures
  hIniLatMedia: number; hIniTerc: number; hFinalTerc: number; varTerc: number;
  hIniLatAcop: number; hFinLatAcop: number;
  hMinLatAcop: number; varLat: number;
  hMax: number; hMin: number; varSub: number; varAdmTerc: number;
  // Flow & uniformity
  qMax: number; qMin: number; uniformity: number;
  // Location strings
  locMinTerc: string; locMinLat: string; situacao: string;
  // Project assessment
  projectOk: boolean;
}

export default function SubunidadeCalculator() {
  const [subTab, setSubTab] = useState<"lateral" | "terciaria" | "subunidade">("lateral");

  // Orientation options
  const [latOrient, setLatOrient] = useState<LatOrientation>("horizontal");
  const [tercOrient, setTercOrient] = useState<TercOrientation>("horizontal");

  // Material
  const [materialLat, setMaterialLat] = useState<"PEBD">("PEBD");
  const [materialTerc, setMaterialTerc] = useState<"PEBD" | "PVC">("PEBD");
  const [customRugLat, setCustomRugLat] = useState(false);
  const [rugLatVal, setRugLatVal] = useState("0.0015");
  const [customRugTc, setCustomRugTc] = useState(false);
  const [rugTcVal, setRugTcVal] = useState("0.0015");

  // Inputs
  const [qem, setQem] = useState("");
  const [ps, setPs] = useState("");
  const [kCoef, setKCoef] = useState("");
  const [expx, setExpx] = useState("");
  const [conex, setConex] = useState("3.8");
  const [cv, setCv] = useState("0.03");
  const [llat, setLlat] = useState("");
  const [dlat, setDlat] = useState("26.9");
  const [dzlat, setDzlat] = useState("0");
  const [vq, setVq] = useState("");
  const [ngp, setNgp] = useState("");
  const [eem, setEem] = useState("");
  const [ltc, setLtc] = useState("");
  const [dtc, setDtc] = useState("48.1");
  const [dztc, setDztc] = useState("0");
  const [eltc, setEltc] = useState("");
  const [temp, setTemp] = useState("20");
  const [distpri, setDistpri] = useState("");
  const [distc, setDistc] = useState("");

  const [results, setResults] = useState<SubResults | null>(null);
  const [error, setError] = useState("");

  const getRoughnessLat = () => 0.0015;
  const getRoughnessTc = (mat: string) => (mat === "PEBD" ? 0.0015 : 0.003334);

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
      const Qem = parseFloat(qem);
      const Ps = parseFloat(ps);
      const K = parseFloat(kCoef);
      const Expx = parseFloat(expx);
      const Conex = parseFloat(conex);
      const Cv = parseFloat(cv);
      const Llat = parseFloat(llat);
      const Dlat = parseFloat(dlat);
      const Dzlat = latOrient === "horizontal" ? 0 : parseFloat(dzlat);
      const Vq = parseFloat(vq);
      const Ngp = parseFloat(ngp);
      const Eem = parseFloat(eem);
      const Ltc = parseFloat(ltc);
      const Dtc = parseFloat(dtc);
      const Dztc = tercOrient === "horizontal" ? 0 : parseFloat(dztc);
      const Eltc = parseFloat(eltc);
      const Tempa = parseFloat(temp);
      const Distpri = parseFloat(distpri);
      const Distc = parseFloat(distc);
      const rugLat = customRugLat ? parseFloat(rugLatVal) : getRoughnessLat();
      const rugTc = customRugTc ? parseFloat(rugTcVal) : getRoughnessTc(materialTerc);

      const allVals = [Qem, Ps, K, Expx, Conex, Cv, Llat, Dlat, Vq, Ngp, Eem, Ltc, Dtc, Eltc, Tempa, Distpri, Distc];
      if (allVals.some(isNaN)) {
        setError("Preencha todos os campos corretamente.");
        return;
      }

      // Fluid properties (VBA: u = Format(..., "0.00000"))
      const u = parseFloat(calcViscosity(Tempa).toFixed(5));
      const Uc = u * 1000;
      const mespa = parseFloat(calcDensity(Tempa).toFixed(2));

      // ===== LATERAL =====
      const Nel = Llat / Eem;
      const Ql = Nel * Qem;
      const velLat = parseFloat((Ql / (2.8274 * Dlat ** 2)).toFixed(2));
      const ReLat = parseFloat((mespa * velLat * Dlat / Uc).toFixed(0));

      let fLat: number;
      let hfLat: number;
      if (ReLat < 2000) {
        fLat = 64 / ReLat;
        hfLat = parseFloat((11.536e5 * u / mespa * Ql * Llat / (Dlat ** 4)).toFixed(2));
      } else {
        fLat = colebrookIter(rugLat, Dlat, ReLat);
        hfLat = parseFloat((6.376 * parseFloat(fLat.toFixed(4)) * Ql ** 2 * Llat / (Dlat ** 5)).toFixed(2));
      }
      fLat = parseFloat(fLat.toFixed(4));

      // Connection equivalent
      const fe = 0.25 * Conex * 19 * (Dlat ** -1.9);
      const Hfeq = parseFloat((hfLat * ((Eem + fe) / Eem)).toFixed(2));

      // m value
      let m: number;
      if (ReLat > 100000) m = 2;
      else if (ReLat > 2000) m = 1.75;
      else m = 1.75;

      // Christiansen F & Scaloppi for lateral
      const FchLat = parseFloat(((1 / (m + 1)) + (1 / (2 * Nel)) + (Math.sqrt(m - 1) / (6 * Nel ** 2))).toFixed(4));
      const x = Eem / Distpri;
      const FscpLat = parseFloat(((Nel * FchLat + x - 1) / (Nel + x - 1)).toFixed(4));

      // Corrected head loss lateral
      const Hflcrg = parseFloat((FscpLat * Hfeq).toFixed(3));

      // dz/Hf ratio lateral
      const Rlat = parseFloat((Dzlat / Hflcrg).toFixed(2));

      // ===== TERTIARY =====
      const Nltc = parseFloat((Ltc / Eltc).toFixed(2));
      const Qtc = parseFloat((Nltc * Ql).toFixed(2));
      const velTc = parseFloat((Qtc / (2.8274 * Dtc ** 2)).toFixed(2));
      const ReTc = parseFloat((mespa * velTc * Dtc / Uc).toFixed(0));

      let fTc: number;
      let hfTc: number;
      if (ReTc < 2000) {
        fTc = 64 / ReTc;
        hfTc = parseFloat((11.536e5 * u / mespa * Qtc * Ltc / (Dtc ** 4)).toFixed(2));
      } else {
        fTc = colebrookIter(rugTc, Dtc, ReTc);
        hfTc = parseFloat((6.376 * parseFloat(fTc.toFixed(4)) * Qtc ** 2 * Ltc / (Dtc ** 5)).toFixed(2));
      }
      fTc = parseFloat(fTc.toFixed(4));

      // Connection equivalent tertiary
      const fetc = 23.04 * (Dtc ** -1.84);
      const HfeqTc = parseFloat((hfTc * ((Eltc + fetc) / Eltc)).toFixed(2));

      // m for tertiary
      let mTc: number;
      if (ReTc > 100000) mTc = 2;
      else if (ReTc > 2000) mTc = 1.75;
      else mTc = 1.75;

      // Christiansen F & Scaloppi for tertiary
      const FchTc = parseFloat(((1 / (mTc + 1)) + (1 / (2 * Nltc)) + (Math.sqrt(mTc - 1) / (6 * Nltc ** 2))).toFixed(4));
      const y = Distc / Eltc;
      const FscpTc = parseFloat(((Nltc * FchTc + y - 1) / (Nltc + y - 1)).toFixed(4));

      // Corrected head loss tertiary
      const Hftcor = parseFloat((FscpTc * HfeqTc).toFixed(3));

      // dz/Hf ratio tertiary
      const Rtc = parseFloat((Dztc / Hftcor).toFixed(2));

      // ===== SUBUNIT CALCULATIONS =====
      const ilat = parseFloat((1 - (Rlat / (m + 1)) ** (1 / m)).toFixed(3));
      const jlat = parseFloat((1 - (1 - ilat) ** (m + 1)).toFixed(4));
      const itc = parseFloat((1 - (Rtc / (mTc + 1)) ** (1 / mTc)).toFixed(3));
      const jtc = parseFloat((1 - (1 - itc) ** (mTc + 1)).toFixed(4));

      // Determine situation based on orientations and conditions
      let hIniLatMedia: number, hIniTerc: number, hFinalTerc: number, varTerc: number;
      let hIniLatAcop: number, hFinLatAcop: number, hMinLatAcop: number, varLat: number;
      let hMax: number, hMin: number;
      let locMinTerc: string, locMinLat: string, situacao: string;

      const isLatHoriz = latOrient === "horizontal";
      const isLatAsc = latOrient === "ascendente";
      const isLatDesc = latOrient === "descendente";
      const isTcHoriz = tercOrient === "horizontal";
      const isTcAsc = tercOrient === "ascendente";
      const isTcDesc = tercOrient === "descendente";

      // SITUAÇÃO I: Terciária Ascendente ou Horizontal
      if (isTcAsc || isTcHoriz) {
        if (isLatHoriz || isLatAsc) {
          // SIa
          hIniLatMedia = parseFloat((Ps + (0.733 * Hflcrg) + (0.5 * Dzlat)).toFixed(2));
          hIniTerc = parseFloat((hIniLatMedia + (0.733 * Hftcor) + (0.5 * Dztc)).toFixed(2));
          hFinalTerc = parseFloat((hIniLatMedia - (0.27 * Hftcor) - (0.5 * Dztc)).toFixed(2));
          varTerc = parseFloat((hIniTerc - hFinalTerc).toFixed(2));
          const Hintc = hIniTerc;
          hIniLatAcop = parseFloat((Hintc - Hftcor - Dztc).toFixed(2));
          hFinLatAcop = parseFloat((Hintc - Hftcor - Dztc - Hflcrg - Dzlat).toFixed(2));
          hMinLatAcop = parseFloat((Hintc - Hftcor - Dztc - Hflcrg - Dzlat).toFixed(2));
          varLat = parseFloat((hIniLatAcop - hMinLatAcop).toFixed(2));
          hMax = parseFloat(Hintc.toFixed(2));
          hMin = parseFloat(hMinLatAcop.toFixed(2));
          locMinTerc = "No final da terciária";
          locMinLat = "No final da lateral";
          const tcLabel = isTcHoriz ? "Horizontal" : "Ascendente";
          const latLabel = isLatHoriz ? "Horizontais" : "Ascendentes";
          situacao = `Terciária ${tcLabel} e Laterais ${latLabel}`;
        } else if (isLatDesc && Dzlat <= Hflcrg) {
          // SIb
          hIniLatMedia = parseFloat((Ps + (0.733 * Hflcrg) - (0.5 * Dzlat)).toFixed(2));
          hIniTerc = parseFloat((hIniLatMedia + (0.733 * Hftcor) + (0.5 * Dztc)).toFixed(2));
          hFinalTerc = parseFloat((hIniLatMedia - (0.27 * Hftcor) - (0.5 * Dztc)).toFixed(2));
          varTerc = parseFloat((hIniTerc - hFinalTerc).toFixed(2));
          const Hintc = hIniTerc;
          hIniLatAcop = parseFloat((Hintc - Hftcor - Dztc).toFixed(2));
          hFinLatAcop = parseFloat((Hintc - Hftcor - Dztc - Hflcrg + Dzlat).toFixed(2));
          hMinLatAcop = parseFloat((Hintc - Hftcor - Dztc - (jlat * Hflcrg) + (ilat * Dzlat)).toFixed(2));
          varLat = parseFloat((hIniLatAcop - hFinLatAcop).toFixed(2));
          hMax = parseFloat(Hintc.toFixed(2));
          hMin = parseFloat(hMinLatAcop.toFixed(2));
          locMinTerc = "No final da terciária";
          const LHminlat = parseFloat((ilat * Llat).toFixed(1));
          locMinLat = `A ${LHminlat} m do início da lateral`;
          const tcLabel = isTcHoriz ? "Horizontal" : "Ascendente";
          situacao = `Terciária ${tcLabel} e Laterais Descendentes com dZLat <= HfLat`;
        } else if (isLatDesc && Dzlat > Hflcrg && Hflcrg >= (Dzlat / (m + 1))) {
          // SIc
          hIniLatMedia = parseFloat((Ps + (0.733 * Hflcrg) - (0.5 * Dzlat)).toFixed(2));
          hIniTerc = parseFloat((hIniLatMedia + (0.733 * Hftcor) + (0.5 * Dztc)).toFixed(2));
          hFinalTerc = parseFloat((hIniLatMedia - (0.27 * Hftcor) - (0.5 * Dztc)).toFixed(2));
          varTerc = parseFloat((hIniTerc - hFinalTerc).toFixed(2));
          const Hintc = hIniTerc;
          hIniLatAcop = parseFloat((Hintc - Hftcor - Dztc).toFixed(2));
          hFinLatAcop = parseFloat((Hintc - Hftcor - Dztc - Hflcrg + Dzlat).toFixed(2));
          hMinLatAcop = parseFloat((Hintc - Hftcor - Dztc - (jlat * Hflcrg) + (ilat * Dzlat)).toFixed(2));
          varLat = parseFloat((hFinLatAcop - hIniLatAcop).toFixed(2));
          hMax = parseFloat((Hintc - Hflcrg + Dzlat).toFixed(2));
          hMin = parseFloat(hMinLatAcop.toFixed(2));
          locMinTerc = "No final da terciária";
          const LHminlat = parseFloat((ilat * Llat).toFixed(1));
          locMinLat = `A ${LHminlat} m do início da lateral`;
          const tcLabel = isTcHoriz ? "Horizontal" : "Ascendente";
          situacao = `Terciária ${tcLabel} e Laterais Descendentes com dZLat >= HfLat e HfLat >= dZLat/(m+1)`;
        } else {
          // SId: isLatDesc && Hflcrg <= Dzlat/(m+1)
          hIniLatMedia = parseFloat((Ps + (0.733 * Hflcrg) - (0.5 * Dzlat)).toFixed(2));
          hIniTerc = parseFloat((hIniLatMedia + (0.733 * Hftcor) + (0.5 * Dztc)).toFixed(2));
          hFinalTerc = parseFloat((hIniLatMedia - (0.27 * Hftcor) - (0.5 * Dztc)).toFixed(2));
          varTerc = parseFloat((hIniTerc - hFinalTerc).toFixed(2));
          const Hintc = hIniTerc;
          hIniLatAcop = parseFloat((Hintc - Hftcor - Dztc).toFixed(2));
          hFinLatAcop = parseFloat((Hintc - Hftcor - Dztc - Hflcrg + Dzlat).toFixed(2));
          hMinLatAcop = parseFloat((Hintc - Hftcor - Dztc).toFixed(2));
          varLat = parseFloat((hFinLatAcop - hIniLatAcop).toFixed(2));
          hMax = parseFloat((Hintc - Hflcrg + Dzlat).toFixed(2));
          hMin = parseFloat(hMinLatAcop.toFixed(2));
          locMinTerc = "No final da terciária";
          const LHminlat = parseFloat((ilat * Llat).toFixed(1));
          locMinLat = LHminlat <= 0 ? "No início da lateral" : `A ${LHminlat} m do início da lateral`;
          const tcLabel = isTcHoriz ? "Horizontal" : "Ascendente";
          situacao = `Terciária ${tcLabel} e Laterais Descendentes com HfLat <= dZLat/(m+1)`;
        }
      }
      // SITUAÇÃO II: Terciária Descendente com dZTerc <= HfTerc
      else if (isTcDesc && Dztc <= Hftcor) {
        if (isLatHoriz || isLatAsc) {
          // SIIa
          hIniLatMedia = parseFloat((Ps + (0.733 * Hflcrg) + (0.5 * Dzlat)).toFixed(2));
          hIniTerc = parseFloat((hIniLatMedia + (0.733 * Hftcor) - (0.5 * Dztc)).toFixed(2));
          hFinalTerc = parseFloat((hIniLatMedia - (0.27 * Hftcor) + (0.5 * Dztc)).toFixed(2));
          varTerc = parseFloat((hIniTerc - hFinalTerc).toFixed(2));
          const Hintc = hIniTerc;
          hIniLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc)).toFixed(2));
          hFinLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc) - Hflcrg - Dzlat).toFixed(2));
          hMinLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc) - Hflcrg - Dzlat).toFixed(2));
          varLat = parseFloat((hIniLatAcop - hFinLatAcop).toFixed(2));
          hMax = parseFloat(Hintc.toFixed(2));
          hMin = parseFloat(hMinLatAcop.toFixed(2));
          const LHmintc = parseFloat((itc * Ltc).toFixed(1));
          locMinTerc = `A ${LHmintc} m do início da terciária`;
          locMinLat = "No final da lateral";
          const latLabel = isLatHoriz ? "Horizontais" : "Ascendentes";
          situacao = `Terciária descendente (dzt <= Hft) e Laterais ${latLabel}`;
        } else if (isLatDesc && Dzlat <= Hflcrg) {
          // SIIb
          hIniLatMedia = parseFloat((Ps + (0.733 * Hflcrg) - (0.5 * Dzlat)).toFixed(2));
          hIniTerc = parseFloat((hIniLatMedia + (0.733 * Hftcor) - (0.5 * Dztc)).toFixed(2));
          hFinalTerc = parseFloat((hIniLatMedia - (0.27 * Hftcor) + (0.5 * Dztc)).toFixed(2));
          varTerc = parseFloat((hIniTerc - hFinalTerc).toFixed(2));
          const Hintc = hIniTerc;
          hIniLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc)).toFixed(2));
          hFinLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc) - Hflcrg + Dzlat).toFixed(2));
          hMinLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc) - (jlat * Hflcrg) + (ilat * Dzlat)).toFixed(2));
          varLat = parseFloat((hIniLatAcop - hFinLatAcop).toFixed(2));
          hMax = parseFloat(Hintc.toFixed(2));
          hMin = parseFloat(hMinLatAcop.toFixed(2));
          const LHmintc = parseFloat((itc * Ltc).toFixed(1));
          locMinTerc = `A ${LHmintc} m do início da terciária`;
          const LHminlat = parseFloat((ilat * Llat).toFixed(1));
          locMinLat = `A ${LHminlat} m do início da lateral`;
          situacao = `Terciária descendente (dzt <= Hft) e Laterais Descendentes (dzL <= HfL)`;
        } else if (isLatDesc && Dzlat > Hflcrg && Hflcrg >= Dzlat / (m + 1)) {
          // SIIc
          hIniLatMedia = parseFloat((Ps + (0.733 * Hflcrg) - (0.5 * Dzlat)).toFixed(2));
          hIniTerc = parseFloat((hIniLatMedia + (0.733 * Hftcor) - (0.5 * Dztc)).toFixed(2));
          hFinalTerc = parseFloat((hIniLatMedia - (0.27 * Hftcor) + (0.5 * Dztc)).toFixed(2));
          varTerc = parseFloat((hIniTerc - hFinalTerc).toFixed(2));
          const Hintc = hIniTerc;
          hIniLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc)).toFixed(2));
          hFinLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc) - Hflcrg + Dzlat).toFixed(2));
          hMinLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc) - (jlat * Hflcrg) + (ilat * Dzlat)).toFixed(2));
          varLat = parseFloat((hIniLatAcop - hMinLatAcop).toFixed(2));
          hMax = parseFloat((Hintc - Hflcrg + Dzlat).toFixed(2));
          hMin = parseFloat(hMinLatAcop.toFixed(2));
          const LHmintc = parseFloat((itc * Ltc).toFixed(1));
          locMinTerc = `A ${LHmintc} m do início da terciária`;
          const LHminlat = parseFloat((ilat * Llat).toFixed(1));
          locMinLat = `A ${LHminlat} m do início da lateral`;
          situacao = `Terciária descendente (dzt <= Hft) e Laterais Descendentes (dzL > HfL >= dzL/(m+1))`;
        } else {
          // SIId: isLatDesc && Hflcrg < Dzlat/(m+1)
          hIniLatMedia = parseFloat((Ps + (0.733 * Hflcrg) - (0.5 * Dzlat)).toFixed(2));
          hIniTerc = parseFloat((hIniLatMedia + (0.733 * Hftcor) - (0.5 * Dztc)).toFixed(2));
          hFinalTerc = parseFloat((hIniLatMedia - (0.27 * Hftcor) + (0.5 * Dztc)).toFixed(2));
          varTerc = parseFloat((hIniTerc - hFinalTerc).toFixed(2));
          const Hintc = hIniTerc;
          hIniLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc)).toFixed(2));
          hFinLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc) - Hflcrg + Dzlat).toFixed(2));
          hMinLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc)).toFixed(2));
          varLat = parseFloat((hFinLatAcop - hIniLatAcop).toFixed(2));
          hMax = parseFloat((Hintc - Hflcrg + Dzlat).toFixed(2));
          hMin = parseFloat(hMinLatAcop.toFixed(2));
          const LHmintc = parseFloat((itc * Ltc).toFixed(1));
          locMinTerc = `A ${LHmintc} m do início da terciária`;
          const LHminlat = parseFloat((ilat * Llat).toFixed(1));
          locMinLat = LHminlat < 0 ? "No início da lateral" : `A ${LHminlat} m do início da lateral`;
          situacao = `Terciária descendente (dzt <= Hft) e Laterais Descendentes (HfL <= dzL/(m+1))`;
        }
      }
      // SITUAÇÃO III: Terciária Descendente com dZTerc > HfTerc >= dZTerc/(m+1)
      else if (isTcDesc && Dztc > Hftcor && Hftcor >= Dztc / (mTc + 1)) {
        if (isLatHoriz || isLatAsc) {
          // SIIIa
          hIniLatMedia = parseFloat((Ps + (0.733 * Hflcrg) - (0.5 * Dzlat)).toFixed(2));
          hIniTerc = parseFloat((hIniLatMedia + (0.733 * Hftcor) - (0.5 * Dztc)).toFixed(2));
          hFinalTerc = parseFloat((hIniLatMedia - (0.27 * Hftcor) + (0.5 * Dztc)).toFixed(2));
          varTerc = parseFloat((hFinalTerc - hIniTerc).toFixed(2));
          const Hintc = hIniTerc;
          hIniLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc)).toFixed(2));
          hFinLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc) - Hflcrg - Dzlat).toFixed(2));
          hMinLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc) - Hflcrg - Dzlat).toFixed(2));
          varLat = parseFloat((hIniLatAcop - hMinLatAcop).toFixed(2));
          hMax = parseFloat((Hintc - Hftcor + Dztc).toFixed(2));
          hMin = parseFloat(hMinLatAcop.toFixed(2));
          const LHmintc = parseFloat((itc * Ltc).toFixed(1));
          locMinTerc = `A ${LHmintc} m do início da terciária`;
          locMinLat = "No final da lateral";
          const latLabel = isLatHoriz ? "Horizontais" : "Ascendentes";
          situacao = `Terciária descendente (dzt > HfTerc >= dZTerc/(m+1)) e Laterais ${latLabel}`;
        } else if (isLatDesc && Dzlat <= Hflcrg) {
          // SIIIb
          hIniLatMedia = parseFloat((Ps + (0.733 * Hflcrg) - (0.5 * Dzlat)).toFixed(2));
          hIniTerc = parseFloat((hIniLatMedia + (0.733 * Hftcor) - (0.5 * Dztc)).toFixed(2));
          hFinalTerc = parseFloat((hIniLatMedia - (0.27 * Hftcor) + (0.5 * Dztc)).toFixed(2));
          varTerc = parseFloat((hFinalTerc - hIniTerc).toFixed(2));
          const Hintc = hIniTerc;
          hIniLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc)).toFixed(2));
          hFinLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc) - Hflcrg + Dzlat).toFixed(2));
          hMinLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc) - (jlat * Hflcrg) + (ilat * Dzlat)).toFixed(2));
          varLat = parseFloat((hIniLatAcop - hFinLatAcop).toFixed(2));
          hMax = parseFloat((Hintc - Hftcor + Dztc).toFixed(2));
          hMin = parseFloat(hMinLatAcop.toFixed(2));
          const LHmintc = parseFloat((itc * Ltc).toFixed(1));
          locMinTerc = `A ${LHmintc} m do início da terciária`;
          const LHminlat = parseFloat((ilat * Llat).toFixed(1));
          locMinLat = `A ${LHminlat} m do início da lateral`;
          situacao = `Terciária descendente (dzt > HfTerc >= dZTerc/(m+1)) e Laterais Descendentes (dzL <= HfL)`;
        } else if (isLatDesc && Dzlat > Hflcrg && Hflcrg >= Dzlat / (m + 1)) {
          // SIIIc
          hIniLatMedia = parseFloat((Ps + (0.733 * Hflcrg) - (0.5 * Dzlat)).toFixed(2));
          hIniTerc = parseFloat((hIniLatMedia + (0.733 * Hftcor) - (0.5 * Dztc)).toFixed(2));
          hFinalTerc = parseFloat((hIniLatMedia - (0.27 * Hftcor) + (0.5 * Dztc)).toFixed(2));
          varTerc = parseFloat((hFinalTerc - hIniTerc).toFixed(2));
          const Hintc = hIniTerc;
          hIniLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc)).toFixed(2));
          hFinLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc) - Hflcrg + Dzlat).toFixed(2));
          hMinLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc) - (jlat * Hflcrg) + (ilat * Dzlat)).toFixed(2));
          varLat = parseFloat((hIniLatAcop - hMinLatAcop).toFixed(2));
          hMax = parseFloat((Hintc - Hftcor + Dztc - Hflcrg + Dzlat).toFixed(2));
          hMin = parseFloat(hMinLatAcop.toFixed(2));
          const LHmintc = parseFloat((itc * Ltc).toFixed(1));
          locMinTerc = `A ${LHmintc} m do início da terciária`;
          const LHminlat = parseFloat((ilat * Llat).toFixed(1));
          locMinLat = `A ${LHminlat} m do início da lateral`;
          situacao = `Terciária e Laterais descendentes (dzT >= HfT >= dzT/(m+1)) (dzL >= HfL >= dzL/(m+1))`;
        } else {
          // SIIId
          hIniLatMedia = parseFloat((Ps + (0.733 * Hflcrg) - (0.5 * Dzlat)).toFixed(2));
          hIniTerc = parseFloat((hIniLatMedia + (0.733 * Hftcor) - (0.5 * Dztc)).toFixed(2));
          hFinalTerc = parseFloat((hIniLatMedia - (0.27 * Hftcor) + (0.5 * Dztc)).toFixed(2));
          varTerc = parseFloat((hFinalTerc - hIniTerc).toFixed(2));
          const Hintc = hIniTerc;
          hIniLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc)).toFixed(2));
          hFinLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc) - Hflcrg + Dzlat).toFixed(2));
          hMinLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc)).toFixed(2));
          varLat = parseFloat((hFinLatAcop - hIniLatAcop).toFixed(2));
          hMax = parseFloat((Hintc - Hftcor + Dztc - Hflcrg + Dzlat).toFixed(2));
          hMin = parseFloat(hMinLatAcop.toFixed(2));
          const LHmintc = parseFloat((itc * Ltc).toFixed(1));
          locMinTerc = `A ${LHmintc} m do início da terciária`;
          const LHminlat = parseFloat((ilat * Llat).toFixed(1));
          locMinLat = LHminlat < 0 ? "No início da lateral" : `A ${LHminlat} m do início da lateral`;
          situacao = `Terciária descendente (dzt >= Hft >= dzt/(m+1)) e Laterais Descendentes (HfL <= dzL/(m+1))`;
        }
      }
      // SITUAÇÃO IV: Terciária Descendente com HfTerc <= dZTerc/(m+1)
      else {
        if (isLatHoriz || isLatAsc) {
          // SIVa
          hIniLatMedia = parseFloat((Ps + (0.733 * Hflcrg) + (0.5 * Dzlat)).toFixed(2));
          hIniTerc = parseFloat((hIniLatMedia + (0.733 * Hftcor) - (0.5 * Dztc)).toFixed(2));
          hFinalTerc = parseFloat((hIniLatMedia - (0.27 * Hftcor) + (0.5 * Dztc)).toFixed(2));
          varTerc = parseFloat((hFinalTerc - hIniTerc).toFixed(2));
          const Hintc = hIniTerc;
          hIniLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc)).toFixed(2));
          hFinLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc) - Hflcrg - Dzlat).toFixed(2));
          hMinLatAcop = parseFloat((Hintc - Hftcor + Dztc).toFixed(2));
          varLat = parseFloat((hMinLatAcop - hIniLatAcop).toFixed(2));
          hMax = parseFloat((Hintc - Hftcor + Dztc).toFixed(2));
          hMin = parseFloat((Hintc - Hflcrg - Dzlat).toFixed(2));
          const LHmintc = parseFloat((itc * Ltc).toFixed(1));
          locMinTerc = LHmintc <= 0 ? "No início da terciária" : `A ${LHmintc} m do início da terciária`;
          locMinLat = "No final da lateral";
          const latLabel = isLatHoriz ? "Horizontais" : "Ascendentes";
          situacao = `Terciária descendente (HfTerc <= dZTerc/(m+1)) e Laterais ${latLabel}`;
        } else if (isLatDesc && Dzlat <= Hflcrg) {
          // SIVb
          hIniLatMedia = parseFloat((Ps + (0.733 * Hflcrg) - (0.5 * Dzlat)).toFixed(2));
          hIniTerc = parseFloat((hIniLatMedia + (0.733 * Hftcor) - (0.5 * Dztc)).toFixed(2));
          hFinalTerc = parseFloat((hIniLatMedia - (0.27 * Hftcor) + (0.5 * Dztc)).toFixed(2));
          varTerc = parseFloat((hFinalTerc - hIniTerc).toFixed(2));
          const Hintc = hIniTerc;
          hIniLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc)).toFixed(2));
          hFinLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc) - Hflcrg + Dzlat).toFixed(2));
          hMinLatAcop = parseFloat((Hintc - (jlat * Hflcrg) + (ilat * Dzlat)).toFixed(2));
          varLat = parseFloat((hIniLatAcop - hMinLatAcop).toFixed(2));
          hMax = parseFloat((Hintc - Hftcor + Dztc).toFixed(2));
          hMin = parseFloat(hMinLatAcop.toFixed(2));
          const LHmintc = parseFloat((itc * Ltc).toFixed(1));
          locMinTerc = LHmintc <= 0 ? "No início da terciária" : `A ${LHmintc} m do início da terciária`;
          const LHminlat = parseFloat((ilat * Llat).toFixed(1));
          locMinLat = `A ${LHminlat} m do início da lateral`;
          situacao = `Terciária descendente (HfTerc <= dZTerc/(m+1)) e Laterais Descendentes (dzlat <= Hflcrg)`;
        } else if (isLatDesc && Dzlat > Hflcrg && Hflcrg >= Dzlat / (m + 1)) {
          // SIVc
          hIniLatMedia = parseFloat((Ps + (0.733 * Hflcrg) - (0.5 * Dzlat)).toFixed(2));
          hIniTerc = parseFloat((hIniLatMedia + (0.733 * Hftcor) - (0.5 * Dztc)).toFixed(2));
          hFinalTerc = parseFloat((hIniLatMedia - (0.27 * Hftcor) + (0.5 * Dztc)).toFixed(2));
          varTerc = parseFloat((hFinalTerc - hIniTerc).toFixed(2));
          const Hintc = hIniTerc;
          hIniLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc)).toFixed(2));
          hFinLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc) - Hflcrg + Dzlat).toFixed(2));
          hMinLatAcop = parseFloat((Hintc - (jlat * Hflcrg) + (ilat * Dzlat)).toFixed(2));
          varLat = parseFloat((hIniLatAcop - hMinLatAcop).toFixed(2));
          hMax = parseFloat((Hintc - Hftcor + Dztc - Hflcrg + Dzlat).toFixed(2));
          hMin = parseFloat(hMinLatAcop.toFixed(2));
          const LHmintc = parseFloat((itc * Ltc).toFixed(1));
          locMinTerc = LHmintc <= 0 ? "No início da terciária" : `A ${LHmintc} m do início da terciária`;
          const LHminlat = parseFloat((ilat * Llat).toFixed(1));
          locMinLat = `A ${LHminlat} m do início da lateral`;
          situacao = `Terciária e Laterais Descendentes (HfTerc <= dZTerc/(m+1))//(dzlat >= Hflcrg >= dzlat/(m+1))`;
        } else {
          // SIVd
          hIniLatMedia = parseFloat((Ps + (0.733 * Hflcrg) - (0.5 * Dzlat)).toFixed(2));
          hIniTerc = parseFloat((hIniLatMedia + (0.733 * Hftcor) - (0.5 * Dztc)).toFixed(2));
          hFinalTerc = parseFloat((hIniLatMedia - (0.27 * Hftcor) + (0.5 * Dztc)).toFixed(2));
          varTerc = parseFloat((hFinalTerc - hIniTerc).toFixed(2));
          const Hintc = hIniTerc;
          hIniLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc)).toFixed(2));
          hFinLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc) - Hflcrg + Dzlat).toFixed(2));
          hMinLatAcop = parseFloat(Hintc.toFixed(2));
          varLat = parseFloat((hIniLatAcop - hMinLatAcop).toFixed(2));
          hMax = parseFloat((Hintc - Hftcor + Dztc - Hflcrg + Dzlat).toFixed(2));
          hMin = parseFloat(hMinLatAcop.toFixed(2));
          const LHmintc = parseFloat((itc * Ltc).toFixed(1));
          locMinTerc = LHmintc <= 0 ? "No início da terciária" : `A ${LHmintc} m do início da terciária`;
          const LHminlat = parseFloat((ilat * Llat).toFixed(1));
          locMinLat = LHminlat <= 0 ? "No início da lateral" : `A ${LHminlat} m do início da lateral`;
          situacao = `Terciária e Laterais Descendentes (HfTerc <= dZTerc/(m+1))//(Hflcrg <= dzlat/(m+1))`;
        }
      }

      const varSub = parseFloat((hMax - hMin).toFixed(2));
      const varAdmTerc = parseFloat((varSub - varLat).toFixed(2));
      const qMax = parseFloat((K * (hMax ** Expx)).toFixed(3));
      const qMin = parseFloat((K * (hMin ** Expx)).toFixed(3));
      const uniformity = parseFloat((100 * (1 - (1.27 * Cv / Math.sqrt(Ngp))) * qMin / Qem).toFixed(2));
      const projectOk = uniformity >= 95;

      setResults({
        viscosity: parseFloat((Uc).toFixed(2)), density: mespa,
        nel: Nel, ql: Ql, velLat, reLat: ReLat, fLat,
        hfLat, hfeqLat: Hfeq, m, fchLat: FchLat, fscpLat: FscpLat,
        hflcrg: Hflcrg, rLat: Rlat,
        nltc: Nltc, qtc: Qtc, velTc, reTc: ReTc, fTc,
        hfTc, hfeqTc: HfeqTc, fchTc: FchTc, fscpTc: FscpTc,
        hftcor: Hftcor, rTc: Rtc,
        ilat, jlat, itc, jtc,
        hIniLatMedia, hIniTerc, hFinalTerc, varTerc,
        hIniLatAcop, hFinLatAcop, hMinLatAcop, varLat,
        hMax, hMin, varSub, varAdmTerc,
        qMax, qMin, uniformity,
        locMinTerc, locMinLat, situacao, projectOk,
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
          { key: "lateral" as const, label: "Lateral" },
          { key: "terciaria" as const, label: "Terciária" },
          { key: "subunidade" as const, label: "Subunidade" },
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

      {/* ── TAB: LATERAL (INPUTS) ── */}
      {subTab === "lateral" && (
        <div className="p-6 space-y-4">
          {/* Orientation: Lateral */}
          <FieldLabel label="Orientação da Lateral" />
          <div className="flex gap-2">
            {([
              { v: "horizontal" as const, l: "Horizontal" },
              { v: "ascendente" as const, l: "Ascendente" },
              { v: "descendente" as const, l: "Descendente" },
            ]).map(o => (
              <button key={o.v} onClick={() => { setLatOrient(o.v); if (o.v === "horizontal") setDzlat("0"); }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold font-body transition-all border ${
                  latOrient === o.v
                    ? "gradient-primary text-primary-foreground border-transparent shadow-md"
                    : "bg-muted text-muted-foreground border-border hover:border-primary"
                }`}>{o.l}</button>
            ))}
          </div>

          {/* Orientation: Terciária */}
          <FieldLabel label="Orientação da Terciária" />
          <div className="flex gap-2">
            {([
              { v: "horizontal" as const, l: "Horizontal" },
              { v: "ascendente" as const, l: "Ascendente" },
              { v: "descendente" as const, l: "Descendente" },
            ]).map(o => (
              <button key={o.v} onClick={() => { setTercOrient(o.v); if (o.v === "horizontal") setDztc("0"); }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold font-body transition-all border ${
                  tercOrient === o.v
                    ? "gradient-primary text-primary-foreground border-transparent shadow-md"
                    : "bg-muted text-muted-foreground border-border hover:border-primary"
                }`}>{o.l}</button>
            ))}
          </div>

          <hr className="border-border" />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Dados do Emissor</p>

          <div className="grid grid-cols-3 gap-4">
            <NumInput label="Vazão Emissor (L/h)" value={qem} onChange={setQem} hideSpinner />
            <NumInput label="Pressão Serviço (m.c.a.)" value={ps} onChange={setPs} hideSpinner />
            <NumInput label="Coeficiente K" value={kCoef} onChange={setKCoef} hideSpinner />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <NumInput label="Expoente (x)" value={expx} onChange={setExpx} hideSpinner />
            <SelectInput label="Conexão (mm)" value={conex} onChange={setConex}
              options={CONNECTION_SIZES.map(c => ({ value: c, label: `${c} mm` }))} />
            <SelectInput label="CVf" value={cv} onChange={setCv}
              options={CVF_OPTIONS.map(c => ({ value: c, label: c }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <NumInput label="Nº Emissores/Planta" value={ngp} onChange={setNgp} hideSpinner />
            <NumInput label="Variação Vazão (%)" value={vq} onChange={setVq} hideSpinner />
          </div>

          <hr className="border-border" />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Dados da Lateral</p>

          {/* Material Lateral */}
          <FieldLabel label="Material da Lateral" />
          <div className="flex gap-3">
            <button
              className="flex-1 py-2 rounded-lg text-sm font-semibold font-body gradient-primary text-primary-foreground border-transparent shadow-md border"
            >PEBD</button>
          </div>
          <div className="mt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-body">
              Rugosidade Absoluta (mm)
            </label>
            <div className="flex gap-2">
              <input type="number" value={rugLatVal}
                onChange={e => { if (customRugLat) setRugLatVal(e.target.value); }}
                readOnly={!customRugLat}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 no-spinner ${!customRugLat ? 'cursor-default' : ''}`}
                style={{ borderColor: "hsl(var(--border))" }} />
              <button type="button"
                onClick={() => { if (customRugLat) { setCustomRugLat(false); setRugLatVal("0.0015"); } else setCustomRugLat(true); }}
                className={`px-3 py-2 rounded-lg border text-xs font-semibold font-body transition-all ${
                  customRugLat ? "gradient-primary text-primary-foreground border-transparent" : "bg-muted text-muted-foreground border-border hover:border-primary"
                }`}>{customRugLat ? "Lista" : "✎"}</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <NumInput label="Comprimento Lateral (m)" value={llat} onChange={setLlat} hideSpinner />
            <SelectInput label="Diâmetro Interno (mm)" value={dlat} onChange={setDlat} editable
              options={LATERAL_DIAMETERS.map(d => ({ value: String(d), label: `${d} mm` }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <NumInput label="Espaçam. Emissores (m)" value={eem} onChange={setEem} hideSpinner />
            {latOrient !== "horizontal" && (
              <NumInput label="Desnível Lateral (m)" value={dzlat} onChange={setDzlat} hideSpinner />
            )}
          </div>
          <NumInput label="Dist. do Primeiro Emissor ao Início da Lateral (m)" value={distpri} onChange={setDistpri} hideSpinner />

          <hr className="border-border" />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Dados da Terciária</p>

          {/* Material Terciária */}
          <FieldLabel label="Material da Terciária" />
          <div className="flex gap-3">
            {(["PEBD", "PVC"] as const).map(m => (
              <button key={m} onClick={() => { setMaterialTerc(m); if (!customRugTc) setRugTcVal(getRoughnessTc(m).toString()); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold font-body transition-all border ${
                  materialTerc === m
                    ? "gradient-primary text-primary-foreground border-transparent shadow-md"
                    : "bg-muted text-muted-foreground border-border hover:border-primary"
                }`}>{m}</button>
            ))}
          </div>
          <div className="mt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-body">
              Rugosidade Absoluta (mm)
            </label>
            <div className="flex gap-2">
              <input type="number" value={rugTcVal}
                onChange={e => { if (customRugTc) setRugTcVal(e.target.value); }}
                readOnly={!customRugTc}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 no-spinner ${!customRugTc ? 'cursor-default' : ''}`}
                style={{ borderColor: "hsl(var(--border))" }} />
              <button type="button"
                onClick={() => { if (customRugTc) { setCustomRugTc(false); setRugTcVal(getRoughnessTc(materialTerc).toString()); } else setCustomRugTc(true); }}
                className={`px-3 py-2 rounded-lg border text-xs font-semibold font-body transition-all ${
                  customRugTc ? "gradient-primary text-primary-foreground border-transparent" : "bg-muted text-muted-foreground border-border hover:border-primary"
                }`}>{customRugTc ? "Lista" : "✎"}</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <NumInput label="Comprimento Terciária (m)" value={ltc} onChange={setLtc} hideSpinner />
            <SelectInput label="Diâmetro Interno (mm)" value={dtc} onChange={setDtc} editable
              options={TERTIARY_DIAMETERS.map(d => ({ value: String(d), label: `${d} mm` }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <NumInput label="Espaçam. Laterais (m)" value={eltc} onChange={setEltc} hideSpinner />
            {tercOrient !== "horizontal" && (
              <NumInput label="Desnível Terciária (m)" value={dztc} onChange={setDztc} hideSpinner />
            )}
          </div>
          <NumInput label="Dist. 1ª Lateral à Conexão (m)" value={distc} onChange={setDistc} hideSpinner />
          <NumInput label="Temperatura (°C)" value={temp} onChange={setTemp} hideSpinner />

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

      {/* ── TAB: TERCIÁRIA (RESULTS) ── */}
      {subTab === "terciaria" && (
        <div className="p-6 space-y-4">
          {!results ? (
            <p className="text-sm text-muted-foreground font-body text-center py-8">
              Preencha os dados na aba "Lateral" e clique em Calcular.
            </p>
          ) : (
            <>
              <h3 className="font-display font-semibold text-foreground text-sm">Propriedades do Fluido</h3>
              <div className="grid grid-cols-2 gap-3">
                <ResCard label="Viscosidade dinâmica" value={`${results.viscosity} × 10⁻³ N.s/m²`} />
                <ResCard label="Massa específica" value={`${results.density} kg/m³`} />
              </div>

              <h3 className="font-display font-semibold text-foreground text-sm mt-4">Lateral</h3>
              <div className="grid grid-cols-2 gap-3">
                <ResCard label="Nº Emissores (Nel)" value={String(results.nel)} />
                <ResCard label="Vazão Lateral (L/h)" value={String(results.ql)} />
                <ResCard label="Velocidade (m/s)" value={String(results.velLat)} />
                <ResCard label="Nº Reynolds" value={String(results.reLat)} />
                <ResCard label="Fator de Atrito (f)" value={String(results.fLat)} />
                <ResCard label="Hf Lateral (m)" value={String(results.hfLat)} />
                <ResCard label="Hf c/ conexão (m)" value={String(results.hfeqLat)} />
                <ResCard label="Expoente m" value={String(results.m)} />
                <ResCard label="F Christiansen" value={String(results.fchLat)} />
                <ResCard label="F Scaloppi" value={String(results.fscpLat)} />
              </div>
              <div className="equation-block px-5 py-4">
                <p className="text-xs text-muted-foreground font-body mb-1">Hf Corrigido Lateral</p>
                <p className="font-display text-2xl font-bold text-primary">{results.hflcrg} <span className="text-base font-body font-normal">m.c.a.</span></p>
              </div>
              <ResCard label="Relação dZ/Hf Lateral" value={String(results.rLat)} />

              <h3 className="font-display font-semibold text-foreground text-sm mt-4">Terciária</h3>
              <div className="grid grid-cols-2 gap-3">
                <ResCard label="Nº Laterais (Nltc)" value={String(results.nltc)} />
                <ResCard label="Vazão Terciária (L/h)" value={String(results.qtc)} />
                <ResCard label="Velocidade (m/s)" value={String(results.velTc)} />
                <ResCard label="Nº Reynolds" value={String(results.reTc)} />
                <ResCard label="Fator de Atrito (f)" value={String(results.fTc)} />
                <ResCard label="Hf Terciária (m)" value={String(results.hfTc)} />
                <ResCard label="Hf c/ conexão (m)" value={String(results.hfeqTc)} />
                <ResCard label="F Christiansen" value={String(results.fchTc)} />
                <ResCard label="F Scaloppi" value={String(results.fscpTc)} />
              </div>
              <div className="equation-block px-5 py-4">
                <p className="text-xs text-muted-foreground font-body mb-1">Hf Corrigido Terciária</p>
                <p className="font-display text-2xl font-bold text-primary">{results.hftcor} <span className="text-base font-body font-normal">m.c.a.</span></p>
              </div>
              <ResCard label="Relação dZ/Hf Terciária" value={String(results.rTc)} />
            </>
          )}
        </div>
      )}

      {/* ── TAB: SUBUNIDADE (RESULTS) ── */}
      {subTab === "subunidade" && (
        <div className="p-6 space-y-4">
          {!results ? (
            <p className="text-sm text-muted-foreground font-body text-center py-8">
              Preencha os dados na aba "Lateral" e clique em Calcular.
            </p>
          ) : (
            <>
              {/* Situation description */}
              <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-primary font-body">{results.situacao}</p>
              </div>

              <h3 className="font-display font-semibold text-foreground text-sm">Coeficientes i e j</h3>
              <div className="grid grid-cols-4 gap-3">
                <ResCard label="i (Lateral)" value={String(results.ilat)} />
                <ResCard label="j (Lateral)" value={String(results.jlat)} />
                <ResCard label="i (Terciária)" value={String(results.itc)} />
                <ResCard label="j (Terciária)" value={String(results.jtc)} />
              </div>

              <h3 className="font-display font-semibold text-foreground text-sm mt-4">Pressões na Subunidade</h3>
              <div className="grid grid-cols-2 gap-3">
                <ResCard label="H Início Lateral Média" value={`${results.hIniLatMedia} m.c.a.`} />
                <ResCard label="H Início Terciária" value={`${results.hIniTerc} m.c.a.`} />
                <ResCard label="H Final Terciária" value={`${results.hFinalTerc} m.c.a.`} />
                <ResCard label="Variação na Terciária" value={`${results.varTerc} m.c.a.`} />
                <ResCard label="H Início Lat. (ponto mín. Tc)" value={`${results.hIniLatAcop} m.c.a.`} />
                <ResCard label="H Final Lat. (ponto mín. Tc)" value={`${results.hFinLatAcop} m.c.a.`} />
                <ResCard label="H Mín. Lateral" value={`${results.hMinLatAcop} m.c.a.`} />
                <ResCard label="Variação na Lateral" value={`${results.varLat} m.c.a.`} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="equation-block px-4 py-3">
                  <p className="text-xs text-muted-foreground font-body mb-1">Pressão Máxima</p>
                  <p className="font-display text-xl font-bold text-primary">{results.hMax} <span className="text-sm font-body font-normal">m.c.a.</span></p>
                </div>
                <div className="equation-block px-4 py-3">
                  <p className="text-xs text-muted-foreground font-body mb-1">Pressão Mínima</p>
                  <p className="font-display text-xl font-bold text-primary">{results.hMin} <span className="text-sm font-body font-normal">m.c.a.</span></p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ResCard label="Variação na Subunidade" value={`${results.varSub} m.c.a.`} />
                <ResCard label="Var. Admissível Terciária" value={`${results.varAdmTerc} m.c.a.`} />
              </div>

              {/* Location of min pressures */}
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 space-y-1">
                <p className="text-xs font-body"><span className="font-semibold text-destructive">Pressão mín. Terciária:</span> <span className="text-foreground">{results.locMinTerc}</span></p>
                <p className="text-xs font-body"><span className="font-semibold text-destructive">Pressão mín. Lateral:</span> <span className="text-foreground">{results.locMinLat}</span></p>
              </div>

              <h3 className="font-display font-semibold text-foreground text-sm mt-4">Vazão e Uniformidade</h3>
              <div className="grid grid-cols-2 gap-3">
                <ResCard label="Vazão Máxima" value={`${results.qMax} L/h`} />
                <ResCard label="Vazão Mínima" value={`${results.qMin} L/h`} />
              </div>

              <div className="equation-block px-5 py-4">
                <p className="text-xs text-muted-foreground font-body mb-1">Uniformidade de Emissão</p>
                <p className="font-display text-2xl font-bold text-primary">{results.uniformity} <span className="text-base font-body font-normal">%</span></p>
              </div>

              <div className={`rounded-xl px-4 py-3 text-sm font-semibold font-body text-center ${
                results.projectOk
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "bg-destructive/10 text-destructive border border-destructive/30"
              }`}>
                {results.projectOk ? "Projeto Hidráulico adequado" : "Ajustes no Projeto serão necessários"}
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
            <input type="text" value={value} onChange={e => onChange(e.target.value)} onBlur={() => setIsEditing(false)} autoFocus
              className="w-full px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 no-spinner"
              style={{ borderColor: "hsl(var(--border))" }} />
          ) : (
            <div className="flex gap-1">
              <select value={options.some(o => o.value === value) ? value : ""} onChange={e => { if (e.target.value) onChange(e.target.value); }}
                className="flex-1 px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                style={{ borderColor: "hsl(var(--border))" }}>
                {!options.some(o => o.value === value) && <option value="" disabled>{value || "Selecione..."}</option>}
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button type="button" onClick={() => setIsEditing(true)}
                className="px-2 py-1 rounded-lg border text-xs font-body text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                style={{ borderColor: "hsl(var(--border))" }} title="Digitar valor personalizado">✏️</button>
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
