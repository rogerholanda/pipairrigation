import { useState } from "react";
import { Droplets, AlertTriangle, Printer } from "lucide-react";
import { printReport, br } from "@/lib/printReport";

type Orientation = "nivel" | "ascendente" | "descendente";

const LATERAL_DIAMETERS = ["5.3", "13", "13.6", "16", "20.6", "26.9", "35.7"];
const TERTIARY_DIAMETERS = ["48.1", "72.5", "97.6"];
const CONNECTION_SIZES = ["3.8", "5", "7.6"];
const CVF_OPTIONS = ["0.03", "0.05", "0.07"];

interface SubResults {
  // Lateral
  ql: number; velLat: number; reLat: number; fLat: number;
  hfLat: number; hfeqLat: number; mLat: number; fscpLat: number;
  hflcrg: number; rLat: number;
  // Terciária
  nltc: number; qtc: number; velTc: number; reTc: number; fTc: number;
  hfTc: number; hfeqTc: number; mTc: number; fscpTc: number;
  hftcor: number; rTc: number;
  // Subunidade
  hIniLatMedia: number; hIniTerc: number; hFinalTerc: number; varTerc: number;
  hIniLatAcop: number; hFinLatAcop: number; hMinLatAcop: number; varLat: number;
  hMax: number; hMin: number; varSub: number; varAdmTerc: number;
  qMax: number; qMin: number; uniformity: number;
  locMinTerc: string; locMinLat: string; situacao: string;
  projectOk: boolean;
}

// Brazilian format with fixed decimals
const fmt = (v: number, dec: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });

export default function SubunidadeCalculator() {
  const [subTab, setSubTab] = useState<"dados" | "calculos" | "analise">("dados");

  // Orientations
  const [tercOrient, setTercOrient] = useState<Orientation>("nivel");
  const [latOrient, setLatOrient] = useState<Orientation>("nivel");

  // Do Emissor
  const [qem, setQem] = useState("");
  const [cv, setCv] = useState("0.03");
  const [ps, setPs] = useState("");
  const [conex, setConex] = useState("3.8");
  const [kCoef, setKCoef] = useState("");
  const [expx, setExpx] = useState("");

  // Da Terciária
  const [dztc, setDztc] = useState("");
  const [ltc, setLtc] = useState("");
  const [distc, setDistc] = useState("");
  const [temp, setTemp] = useState("20");
  const [dtc, setDtc] = useState("48.1");
  const [materialTerc, setMaterialTerc] = useState<"PEBD" | "PVC">("PEBD");
  const [eltc, setEltc] = useState("");
  const [customRugTc, setCustomRugTc] = useState(false);
  const [rugTcVal, setRugTcVal] = useState("0.0015");

  // Da Lateral
  const [dzlat, setDzlat] = useState("");
  const [llat, setLlat] = useState("");
  const [distpri, setDistpri] = useState("");
  const [ngp, setNgp] = useState("");
  const [dlat, setDlat] = useState("26.9");
  const [vq, setVq] = useState("");
  const [eem, setEem] = useState("");
  const [customRugLat, setCustomRugLat] = useState(false);
  const [rugLatVal, setRugLatVal] = useState("0.0015");

  const [results, setResults] = useState<SubResults | null>(null);
  const [error, setError] = useState("");

  const getRoughnessTc = (mat: string) => (mat === "PEBD" ? 0.0015 : 0.003334);

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
      const Dzlat = latOrient === "nivel" ? 0 : parseFloat(dzlat);
      const Ngp = parseFloat(ngp);
      const Eem = parseFloat(eem);
      const Ltc = parseFloat(ltc);
      const Dtc = parseFloat(dtc);
      const Dztc = tercOrient === "nivel" ? 0 : parseFloat(dztc);
      const Eltc = parseFloat(eltc);
      const Tempa = parseFloat(temp);
      const Distpri = parseFloat(distpri);
      const Distc = parseFloat(distc);
      const rugLat = customRugLat ? parseFloat(rugLatVal) : 0.0015;
      const rugTc = customRugTc ? parseFloat(rugTcVal) : getRoughnessTc(materialTerc);

      const required = [Qem, Ps, K, Expx, Conex, Cv, Llat, Dlat, Dzlat, Ngp, Eem, Ltc, Dtc, Dztc, Eltc, Tempa, Distpri, Distc, rugLat, rugTc];
      if (required.some(isNaN)) {
        setError("Verifique se os dados estão corretos.");
        return;
      }

      // ===== Propriedades do fluido (VBA parity) =====
      const Kelv = Tempa + 273.16;
      const Lgu = -11.73 + 1828 / Kelv + 0.01966 * Kelv - 0.00001466 * Kelv ** 2;
      const u = parseFloat(((10 ** Lgu) / 100).toFixed(5));
      const Uc = u * 1000;
      const Fct = ((Tempa - 3.983035) ** 2) * (Tempa + 301.797) / (522528.9 * (Tempa + 69.34881));
      const mespa = parseFloat((1000 * (1 - Fct)).toFixed(2));

      // ===== CÁLCULOS PARA A LATERAL =====
      const Nel = Llat / Eem;
      // VBA: TextBox16 = Nel * qem * Ngp
      const Ql = Nel * Qem * Ngp;
      const velLat = parseFloat((Ql / (2.8274 * Dlat ** 2)).toFixed(2));
      const ReLat = parseFloat((mespa * velLat * Dlat / Uc).toFixed(0));

      let fLat: number;
      let hfLat: number;
      if (ReLat < 2000) {
        fLat = parseFloat((64 / ReLat).toFixed(4));
        hfLat = parseFloat((11.536e5 * u / mespa * Ql * Llat / (Dlat ** 4)).toFixed(3));
      } else {
        fLat = parseFloat(colebrookIter(rugLat, Dlat, ReLat).toFixed(4));
        hfLat = parseFloat((6.376 * fLat * Ql ** 2 * Llat / (Dlat ** 5)).toFixed(2));
      }

      // Decréscimo devido à conexão
      const fe = 0.25 * Conex * 19 * (Dlat ** -1.9);
      const Hfeq = parseFloat((hfLat * ((Eem + fe) / Eem)).toFixed(2));

      // m do regime de fluxo (lateral) — VBA TextBox22
      let mLat = 1.75;
      if (ReLat > 100000) mLat = 2;
      else if (ReLat > 2000) mLat = 1.75;

      // F de Christiansen e Scaloppi (lateral)
      const FchLat = parseFloat(((1 / (mLat + 1)) + (1 / (2 * Nel)) + (Math.sqrt(mLat - 1) / (6 * Nel ** 2))).toFixed(4));
      const x = Eem / Distpri;
      const FscpLat = (Nel * FchLat + x - 1) / (Nel + x - 1);

      // Decréscimo corrigido na lateral
      const Hflcrg = parseFloat((FscpLat * Hfeq).toFixed(3));

      // Relação dz/Hf na lateral
      const Rlat = parseFloat((Dzlat / Hflcrg).toFixed(2));

      // ===== CÁLCULOS PARA A TERCIÁRIA =====
      const Nltc = parseFloat((Ltc / Eltc).toFixed(2));
      const Qtc = parseFloat((Nltc * Ql).toFixed(2));
      const velTc = parseFloat((Qtc / (2.8274 * Dtc ** 2)).toFixed(2));
      const ReTc = parseFloat((mespa * velTc * Dtc / Uc).toFixed(0));

      let fTc: number;
      let hfTc: number;
      if (ReTc < 2000) {
        fTc = parseFloat((64 / ReTc).toFixed(4));
        hfTc = parseFloat((11.536e5 * u / mespa * Qtc * Ltc / (Dtc ** 4)).toFixed(3));
      } else {
        fTc = parseFloat(colebrookIter(rugTc, Dtc, ReTc).toFixed(4));
        hfTc = parseFloat((6.376 * fTc * Qtc ** 2 * Ltc / (Dtc ** 5)).toFixed(2));
      }

      // Decréscimo devido à conexão (terciária)
      const fetc = 23.04 * (Dtc ** -1.84);
      const HfeqTc = parseFloat((hfTc * ((Eltc + fetc) / Eltc)).toFixed(2));

      // m do regime de fluxo (terciária) — VBA TextBox33 (variável m compartilhada)
      let mTc = 1.75;
      if (ReTc > 100000) mTc = 2;
      else if (ReTc > 2000) mTc = 1.75;
      const m = mTc; // VBA reutiliza a mesma variável m daqui em diante

      // F de Christiansen e Scaloppi (terciária)
      const FchTc = parseFloat(((1 / (m + 1)) + (1 / (2 * Nltc)) + (Math.sqrt(m - 1) / (6 * Nltc ** 2))).toFixed(4));
      const y = Distc / Eltc;
      const FscpTc = parseFloat(((Nltc * FchTc + y - 1) / (Nltc + y - 1)).toFixed(4));

      // Decréscimo corrigido na terciária
      const Hftcor = parseFloat((FscpTc * HfeqTc).toFixed(3));

      // Relação dz/Hf na terciária
      const Rtc = parseFloat((Dztc / Hftcor).toFixed(2));

      // ===== Coeficientes i e j (VBA usa m da terciária) =====
      const ilat = parseFloat((1 - (Rlat / (m + 1)) ** (1 / m)).toFixed(3));
      const jlat = parseFloat((1 - (1 - ilat) ** (m + 1)).toFixed(4));
      const itc = parseFloat((1 - (Rtc / (m + 1)) ** (1 / m)).toFixed(3));
      const jtc = parseFloat((1 - (1 - itc) ** (m + 1)).toFixed(4));

      // ===== Distribuição das cargas de pressão na subunidade =====
      let hIniLatMedia: number, hIniTerc: number, hFinalTerc: number, varTerc: number;
      let hIniLatAcop: number, hFinLatAcop: number, hMinLatAcop: number, varLat: number;
      let hMax: number, hMin: number;
      let locMinTerc: string, locMinLat: string, situacao: string;

      const isLatNivel = latOrient === "nivel";
      const isLatAsc = latOrient === "ascendente";
      const isLatDesc = latOrient === "descendente";
      const isTcNivel = tercOrient === "nivel";
      const isTcAsc = tercOrient === "ascendente";
      const isTcDesc = tercOrient === "descendente";

      // SITUAÇÃO I: Terciária Ascendente ou em Nível
      if (isTcAsc || isTcNivel) {
        if (isLatNivel || isLatAsc) {
          // SIa
          hIniLatMedia = parseFloat((Ps + (0.733 * Hflcrg) + (0.5 * Dzlat)).toFixed(2));
          hIniTerc = parseFloat((hIniLatMedia + (0.733 * Hftcor) + (0.5 * Dztc)).toFixed(2));
          hFinalTerc = parseFloat((hIniLatMedia - (0.27 * Hftcor) - (0.5 * Dztc)).toFixed(2));
          varTerc = parseFloat((hIniTerc - hFinalTerc).toFixed(2));
          const Hintc = hIniTerc;
          hIniLatAcop = parseFloat((Hintc - Hftcor - Dztc).toFixed(2));
          hFinLatAcop = parseFloat((Hintc - Hftcor - Dztc - Hflcrg - Dzlat).toFixed(2));
          hMinLatAcop = hFinLatAcop;
          varLat = parseFloat((hIniLatAcop - hMinLatAcop).toFixed(2));
          hMax = hIniTerc;
          hMin = hMinLatAcop;
          locMinTerc = "No final da terciária";
          locMinLat = "No final da lateral";
          const tcLabel = isTcNivel ? "Horizontal" : "Ascendente";
          const latLabel = isLatNivel ? "Horizontais" : "Ascendentes";
          situacao = `Subunidade com Tubulação Terciária ${tcLabel} e Laterais ${latLabel}`;
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
          hMax = hIniTerc;
          hMin = hMinLatAcop;
          locMinTerc = "No final da terciária";
          locMinLat = `A ${ilat * Llat} m do início da lateral`;
          const tcLabel = isTcNivel ? "Horizontal" : "Ascendente";
          situacao = `Tubulações Terciária ${tcLabel} e Laterais Descendentes com dZLat <= HfLat`;
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
          hMin = hMinLatAcop;
          locMinTerc = "No final da terciária";
          locMinLat = `A ${ilat * Llat} m do início da lateral`;
          const tcLabel = isTcNivel ? "Horizontal" : "Ascendente";
          situacao = `Terciária ${tcLabel} e Laterais Descendentes com dZLat >= HfLat e HfLat >= dZLat/(m+1)`;
        } else {
          // SId: lateral descendente com HfLat <= dZLat/(m+1)
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
          hMin = hMinLatAcop;
          locMinTerc = "No final da terciária";
          const LHminlat = ilat * Llat;
          locMinLat = LHminlat <= 0 ? "No início da lateral" : `A ${LHminlat} m do início da lateral`;
          const tcLabel = isTcNivel ? "Horizontal" : "Ascendente";
          situacao = `Terciária ${tcLabel} e Laterais Descendentes com HfLat <= dZLat/(m+1)`;
        }
      }
      // SITUAÇÃO II: Terciária Descendente com dZTerc <= HfTerc
      else if (isTcDesc && Dztc <= Hftcor) {
        if (isLatNivel || isLatAsc) {
          // SIIa
          hIniLatMedia = parseFloat((Ps + (0.733 * Hflcrg) + (0.5 * Dzlat)).toFixed(2));
          hIniTerc = parseFloat((hIniLatMedia + (0.733 * Hftcor) - (0.5 * Dztc)).toFixed(2));
          hFinalTerc = parseFloat((hIniLatMedia - (0.27 * Hftcor) + (0.5 * Dztc)).toFixed(2));
          varTerc = parseFloat((hIniTerc - hFinalTerc).toFixed(2));
          const Hintc = hIniTerc;
          hIniLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc)).toFixed(2));
          hFinLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc) - Hflcrg - Dzlat).toFixed(2));
          hMinLatAcop = hFinLatAcop;
          varLat = parseFloat((hIniLatAcop - hFinLatAcop).toFixed(2));
          hMax = Hintc;
          hMin = hMinLatAcop;
          locMinTerc = `A ${itc * Ltc} m do início da terciária`;
          locMinLat = "No final da Tubulação Lateral";
          const latLabel = isLatNivel ? "Horizontais" : "Ascendentes";
          situacao = `Subunidade com Terciária descendente (dzt <= Hft) e Laterais ${latLabel}`;
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
          hMax = hIniTerc;
          hMin = hMinLatAcop;
          locMinTerc = `A ${itc * Ltc} m do início da terciária`;
          locMinLat = `A ${ilat * Llat} m do início da lateral`;
          situacao = `Subunidade com Terciária descendente (dzt <= Hft) e Laterais Descendentes (dzL <= HfL)`;
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
          hMin = hMinLatAcop;
          locMinTerc = `A ${itc * Ltc} m do início da terciária`;
          locMinLat = `A ${ilat * Llat} m do início da lateral`;
          situacao = `Terciária descendente (dzt <= Hft) e Laterais Descendentes (dzL > HfL >= dzL/(m+1))`;
        } else {
          // SIId
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
          hMin = hMinLatAcop;
          locMinTerc = `A ${itc * Ltc} m do início da terciária`;
          const LHminlat = ilat * Llat;
          locMinLat = LHminlat < 0 ? "No início da lateral" : `A ${LHminlat} m do início da lateral`;
          situacao = `Terciária descendente (dzt <= Hft) e Laterais Descendentes (HfL <= dzL/(m+1))`;
        }
      }
      // SITUAÇÃO III: Terciária Descendente com dZTerc > HfTerc >= dZTerc/(m+1)
      else if (isTcDesc && Dztc > Hftcor && Hftcor >= Dztc / (m + 1)) {
        if (isLatNivel || isLatAsc) {
          // SIIIa
          hIniLatMedia = parseFloat((Ps + (0.733 * Hflcrg) - (0.5 * Dzlat)).toFixed(2));
          hIniTerc = parseFloat((hIniLatMedia + (0.733 * Hftcor) - (0.5 * Dztc)).toFixed(2));
          hFinalTerc = parseFloat((hIniLatMedia - (0.27 * Hftcor) + (0.5 * Dztc)).toFixed(2));
          varTerc = parseFloat((hFinalTerc - hIniTerc).toFixed(2));
          const Hintc = hIniTerc;
          hIniLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc)).toFixed(2));
          hFinLatAcop = parseFloat((Hintc - (jtc * Hftcor) + (itc * Dztc) - Hflcrg - Dzlat).toFixed(2));
          hMinLatAcop = hFinLatAcop;
          varLat = parseFloat((hIniLatAcop - hMinLatAcop).toFixed(2));
          hMax = parseFloat((Hintc - Hftcor + Dztc).toFixed(2));
          hMin = hMinLatAcop;
          locMinTerc = `A ${itc * Ltc} m do início da terciária`;
          locMinLat = "No final da Tubulação Lateral";
          const latLabel = isLatNivel ? "Horizontais" : "Ascendentes";
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
          hMin = hMinLatAcop;
          locMinTerc = `A ${itc * Ltc} m do início da terciária`;
          locMinLat = `A ${ilat * Llat} m do início da lateral`;
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
          hMin = hMinLatAcop;
          locMinTerc = `A ${itc * Ltc} m do início da terciária`;
          locMinLat = `A ${ilat * Llat} m do início da lateral`;
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
          hMin = hMinLatAcop;
          locMinTerc = `A ${itc * Ltc} m do início da terciária`;
          const LHminlat = ilat * Llat;
          locMinLat = LHminlat < 0 ? "No início da lateral" : `A ${LHminlat} m do início da lateral`;
          situacao = `Terciária descendente (dzt >= Hft >= dzt/(m+1)) e Laterais Descendentes (HfL <= dzL/(m+1))`;
        }
      }
      // SITUAÇÃO IV: Terciária Descendente com HfTerc <= dZTerc/(m+1)
      else {
        if (isLatNivel || isLatAsc) {
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
          const LHmintc = itc * Ltc;
          locMinTerc = LHmintc <= 0 ? "No início da terciária" : `A ${LHmintc} m do início da terciária`;
          locMinLat = "No final da Tubulação Lateral";
          const latLabel = isLatNivel ? "Horizontais" : "Ascendentes";
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
          hMin = hMinLatAcop;
          const LHmintc = itc * Ltc;
          locMinTerc = LHmintc <= 0 ? "No início da terciária" : `A ${LHmintc} m do início da terciária`;
          locMinLat = `A ${ilat * Llat} m do início da lateral`;
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
          hMin = hMinLatAcop;
          const LHmintc = itc * Ltc;
          locMinTerc = LHmintc <= 0 ? "No início da terciária" : `A ${LHmintc} m do início da terciária`;
          locMinLat = `A ${ilat * Llat} m do início da lateral`;
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
          hMinLatAcop = Hintc;
          varLat = parseFloat((hIniLatAcop - hMinLatAcop).toFixed(2));
          hMax = parseFloat((Hintc - Hftcor + Dztc - Hflcrg + Dzlat).toFixed(2));
          hMin = hMinLatAcop;
          const LHmintc = itc * Ltc;
          locMinTerc = LHmintc <= 0 ? "No início da terciária" : `A ${LHmintc} m do início da terciária`;
          const LHminlat = ilat * Llat;
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
        ql: Ql, velLat, reLat: ReLat, fLat, hfLat, hfeqLat: Hfeq, mLat, fscpLat: FscpLat,
        hflcrg: Hflcrg, rLat: Rlat,
        nltc: Nltc, qtc: Qtc, velTc, reTc: ReTc, fTc, hfTc, hfeqTc: HfeqTc, mTc, fscpTc: FscpTc,
        hftcor: Hftcor, rTc: Rtc,
        hIniLatMedia, hIniTerc, hFinalTerc, varTerc,
        hIniLatAcop, hFinLatAcop, hMinLatAcop, varLat,
        hMax, hMin, varSub, varAdmTerc,
        qMax, qMin, uniformity,
        locMinTerc, locMinLat, situacao, projectOk,
      });

      setSubTab("calculos");
    } catch {
      setError("Verifique se os dados estão corretos.");
    }
  };

  const handlePrint = () => {
    if (!results) { alert("Calcule primeiro para gerar o relatório."); return; }
    printReport({
      calculator: "Rede de Irrigação",
      subtitle: "Projeto da Rede de Distribuição/Subunidade de Irrigação",
      sections: [
        {
          title: "1. Dados do Emissor",
          rows: [
            { label: "Vazão (L/h)", value: br(qem) },
            { label: "Coef. de variação de fabricação", value: br(cv) },
            { label: "Pressão de serviço (m)", value: br(ps) },
            { label: "Tipo de conexão (mm)", value: br(conex) },
            { label: "Coeficiente de descarga (K)", value: br(kCoef) },
            { label: "Expoente de descarga (x)", value: br(expx) },
          ],
        },
        {
          title: "2. Dados da Terciária",
          rows: [
            { label: "Orientação", value: tercOrient === "nivel" ? "Em nível" : tercOrient === "ascendente" ? "Ascendente" : "Descendente" },
            { label: "Desnível (m)", value: br(tercOrient === "nivel" ? "0" : dztc) },
            { label: "Comprimento (m)", value: br(ltc) },
            { label: "Dist. 1ª Lateral (m)", value: br(distc) },
            { label: "T. da água (°C)", value: br(temp) },
            { label: "Diâmetro (mm)", value: br(dtc) },
            { label: "Material da tubulação", value: materialTerc },
            { label: "Rugosidade do tubo (mm)", value: br(rugTcVal) },
            { label: "Espac. entre Laterais (m)", value: br(eltc) },
          ],
        },
        {
          title: "3. Dados da Lateral",
          rows: [
            { label: "Orientação", value: latOrient === "nivel" ? "Em nível" : latOrient === "ascendente" ? "Ascendente" : "Descendente" },
            { label: "Desnível (m)", value: br(latOrient === "nivel" ? "0" : dzlat) },
            { label: "Comprimento (m)", value: br(llat) },
            { label: "Dist. 1° emissor (m)", value: br(distpri) },
            { label: "N° de got./planta", value: br(ngp) },
            { label: "Diâmetro (mm)", value: br(dlat) },
            { label: "Var. da vazão (%)", value: br(vq) },
            { label: "Material do tubo", value: "PEBD" },
            { label: "Rugosidade do tubo (mm)", value: br(rugLatVal) },
            { label: "Espac. entre gotejadores (m)", value: br(eem) },
          ],
        },
        {
          title: "4. Cálculos para Lateral",
          rows: [
            { label: "Vazão no início da lateral (L/h)", value: fmt(results.ql, 2) },
            { label: "Velocidade da água (m/s)", value: fmt(results.velLat, 2) },
            { label: "Número de Reynolds", value: fmt(results.reLat, 0) },
            { label: "f (Colebrook)", value: fmt(results.fLat, 4) },
            { label: "Decréscimo de carga (m)", value: fmt(results.hfLat, 2) },
            { label: "Decréscimo de carga Eq. (m)", value: fmt(results.hfeqLat, 2) },
            { label: "m do Regime de fluxo", value: fmt(results.mLat, 2) },
            { label: "Fator de correção (F)", value: fmt(results.fscpLat, 4) },
            { label: "Decréscimo corrigido - Hf (m)", value: fmt(results.hflcrg, 3) },
            { label: "Relação DZ/Hf", value: fmt(results.rLat, 2) },
          ],
        },
        {
          title: "5. Cálculos para Terciária",
          rows: [
            { label: "Número de Laterais", value: fmt(results.nltc, 2) },
            { label: "Vazão no início da terciária (L/h)", value: fmt(results.qtc, 2) },
            { label: "Velocidade da água (m/s)", value: fmt(results.velTc, 2) },
            { label: "Número de Reynolds", value: fmt(results.reTc, 0) },
            { label: "f (Colebrook)", value: fmt(results.fTc, 4) },
            { label: "Decréscimo de carga - Hf (m)", value: fmt(results.hfTc, 2) },
            { label: "Decréscimo de carga Eq. (m)", value: fmt(results.hfeqTc, 2) },
            { label: "m do Regime de fluxo", value: fmt(results.mTc, 2) },
            { label: "Fator de correção (F)", value: fmt(results.fscpTc, 4) },
            { label: "Decréscimo corrigido - Hf (m)", value: fmt(results.hftcor, 3) },
            { label: "Relação DZ/Hf", value: fmt(results.rTc, 2) },
          ],
        },
        {
          title: "6. Distribuição das Cargas de Pressão na Subunidade",
          highlightLast: true,
          rows: [
            { label: "Pressão no início da lateral média (m)", value: fmt(results.hIniLatMedia, 2) },
            { label: "Pressão no início da terciária (m)", value: fmt(results.hIniTerc, 2) },
            { label: "Pressão no final da terciária (m)", value: fmt(results.hFinalTerc, 2) },
            { label: "Variação Pressão na terciária (m)", value: fmt(results.varTerc, 2) },
            { label: "Pressão no início da lateral acoplada no ponto de pressão mínima da terciária (m)", value: fmt(results.hIniLatAcop, 2) },
            { label: "Pressão no final da lateral acoplada no ponto de pressão mínima da terciária (m)", value: fmt(results.hFinLatAcop, 2) },
            { label: "Pressão mínima na lateral acoplada no ponto de pressão mínima da terciária (m)", value: fmt(results.hMinLatAcop, 2) },
            { label: "Var. da pressão na lateral acoplada no ponto de pressão mínima da terciária (m)", value: fmt(results.varLat, 2) },
            { label: "Pressão máxima na subunidade (m)", value: fmt(results.hMax, 2) },
            { label: "Pressão mínima na subunidade (m)", value: fmt(results.hMin, 2) },
            { label: "Variação da pressão na subunidade (m)", value: fmt(results.varSub, 2) },
            { label: "Vazão máxima na subunidade (L/h)", value: fmt(results.qMax, 3) },
            { label: "Vazão mínima na subunidade (L/h)", value: fmt(results.qMin, 3) },
            { label: "Var. da pressão admissível na terciária (m)", value: fmt(results.varAdmTerc, 2) },
            { label: "Local da pressão mínima na terciária", value: results.locMinTerc },
            { label: "Local da pressão mínima na lateral", value: results.locMinLat },
            { label: "Situação", value: results.situacao },
            { label: "Uniformidade de Emissão (%)", value: fmt(results.uniformity, 2) },
          ],
        },
      ],
    });
  };

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex border-b border-border">
        {([
          { key: "dados" as const, label: "Dados" },
          { key: "calculos" as const, label: "Cálculos" },
          { key: "analise" as const, label: "Análise da UE" },
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

      {/* ── TAB: DADOS ── */}
      {subTab === "dados" && (
        <div className="p-6 space-y-5">
          {/* Do Emissor */}
          <Section title="Do Emissor">
            <div className="grid grid-cols-2 gap-4">
              <NumInput label="Vazão (L/h)" value={qem} onChange={setQem} />
              <SelectInput label="Coef. de variação de fabricação" value={cv} onChange={setCv}
                options={CVF_OPTIONS.map(c => ({ value: c, label: c }))} />
              <NumInput label="Pressão de serviço (m)" value={ps} onChange={setPs} />
              <SelectInput label="Tipo de conexão" value={conex} onChange={setConex}
                options={CONNECTION_SIZES.map(c => ({ value: c, label: `${c} mm` }))} />
              <NumInput label="Coeficiente de descarga (K)" value={kCoef} onChange={setKCoef} />
              <NumInput label="Expoente de descarga (x)" value={expx} onChange={setExpx} />
            </div>
          </Section>

          {/* Da Terciária */}
          <Section title="Da Terciária">
            <OrientationRow value={tercOrient} onChange={(o) => { setTercOrient(o); if (o === "nivel") setDztc(""); }} />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <NumInput label="Desnível (m)" value={tercOrient === "nivel" ? "" : dztc} onChange={setDztc} disabled={tercOrient === "nivel"} />
              <NumInput label="Comprimento (m)" value={ltc} onChange={setLtc} />
              <NumInput label="Dist. 1ª Lateral (m)" value={distc} onChange={setDistc} />
              <NumInput label="T. da água (°C)" value={temp} onChange={setTemp} />
              <SelectInput label="Diâmetro (mm)" value={dtc} onChange={setDtc} editable
                options={TERTIARY_DIAMETERS.map(d => ({ value: d, label: `${d} mm` }))} />
              <SelectInput label="Material da tubulação" value={materialTerc}
                onChange={(v) => { const mat = v as "PEBD" | "PVC"; setMaterialTerc(mat); if (!customRugTc) setRugTcVal(getRoughnessTc(mat).toString()); }}
                options={[{ value: "PEBD", label: "PEBD" }, { value: "PVC", label: "PVC" }]} />
              <NumInput label="Espac. entre Laterais (m)" value={eltc} onChange={setEltc} />
              <RugInput value={rugTcVal} onChange={setRugTcVal} custom={customRugTc}
                onToggle={() => { if (customRugTc) { setCustomRugTc(false); setRugTcVal(getRoughnessTc(materialTerc).toString()); } else setCustomRugTc(true); }} />
            </div>
          </Section>

          {/* Da Lateral */}
          <Section title="Da Lateral">
            <OrientationRow value={latOrient} onChange={(o) => { setLatOrient(o); if (o === "nivel") setDzlat(""); }} />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <NumInput label="Desnível (m)" value={latOrient === "nivel" ? "" : dzlat} onChange={setDzlat} disabled={latOrient === "nivel"} />
              <NumInput label="Comprimento (m)" value={llat} onChange={setLlat} />
              <NumInput label="Dist. 1° emissor (m)" value={distpri} onChange={setDistpri} />
              <NumInput label="N° de got./planta" value={ngp} onChange={setNgp} />
              <SelectInput label="Diâmetro (mm)" value={dlat} onChange={setDlat} editable
                options={LATERAL_DIAMETERS.map(d => ({ value: d, label: `${d} mm` }))} />
              <NumInput label="Var. da vazão (%)" value={vq} onChange={setVq} />
              <SelectInput label="Material do tubo" value="PEBD" onChange={() => {}}
                options={[{ value: "PEBD", label: "PEBD" }]} />
              <RugInput value={rugLatVal} onChange={setRugLatVal} custom={customRugLat}
                onToggle={() => { if (customRugLat) { setCustomRugLat(false); setRugLatVal("0.0015"); } else setCustomRugLat(true); }} />
              <NumInput label="Espac. entre gotejadores (m)" value={eem} onChange={setEem} />
            </div>
          </Section>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg font-body flex items-center gap-2">
              <AlertTriangle size={16} /> {error}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: CÁLCULOS ── */}
      {subTab === "calculos" && (
        <div className="p-6 space-y-5">
          <div className="flex gap-2 max-w-md mx-auto">
            <button onClick={calculate}
              className="flex-1 gradient-primary text-primary-foreground font-semibold py-3 rounded-xl font-body flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity uppercase tracking-wider text-sm">
              <Droplets size={18} /> Calcular
            </button>
            <button onClick={handlePrint}
              className="px-4 py-3 rounded-xl border border-border bg-muted text-foreground font-semibold font-body flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors"
              title="Imprimir / Salvar PDF">
              <Printer size={16} />
            </button>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg font-body flex items-center gap-2">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {!results ? (
            <p className="text-sm text-muted-foreground font-body text-center py-6">
              Preencha os dados na aba "Dados" e clique em Calcular.
            </p>
          ) : (
            <>
              <Section title="Cálculos para Lateral">
                <div className="grid grid-cols-2 gap-3">
                  <ResCard label="Vazão no início da lateral (L/h)" value={fmt(results.ql, 2)} />
                  <ResCard label="Decréscimo de carga Eq. (m)" value={fmt(results.hfeqLat, 2)} />
                  <ResCard label="Velocidade da água (m/s)" value={fmt(results.velLat, 2)} />
                  <ResCard label="m do Regime de fluxo" value={fmt(results.mLat, 2)} />
                  <ResCard label="Número de Reynolds" value={fmt(results.reLat, 0)} />
                  <ResCard label="Fator de correção (F)" value={fmt(results.fscpLat, 4)} />
                  <ResCard label="f (Colebrook)" value={fmt(results.fLat, 4)} />
                  <ResCard label="Decréscimo corrigido - Hf (m)" value={fmt(results.hflcrg, 3)} highlight />
                  <ResCard label="Decréscimo de carga (m)" value={fmt(results.hfLat, 2)} />
                  <ResCard label="Relação DZ/Hf" value={fmt(results.rLat, 2)} />
                </div>
              </Section>

              <Section title="Cálculos para Terciária">
                <div className="grid grid-cols-2 gap-3">
                  <ResCard label="Número de Laterais" value={fmt(results.nltc, 2)} />
                  <ResCard label="Decréscimo de carga - Hf (m)" value={fmt(results.hfTc, 2)} />
                  <ResCard label="Vazão no início da terciária (L/h)" value={fmt(results.qtc, 2)} />
                  <ResCard label="Decréscimo de carga Eq. (m)" value={fmt(results.hfeqTc, 2)} />
                  <ResCard label="Velocidade da água (m/s)" value={fmt(results.velTc, 2)} />
                  <ResCard label="m do Regime de fluxo" value={fmt(results.mTc, 2)} />
                  <ResCard label="Número de Reynolds" value={fmt(results.reTc, 0)} />
                  <ResCard label="Fator de correção (F)" value={fmt(results.fscpTc, 4)} />
                  <ResCard label="f (Colebrook)" value={fmt(results.fTc, 4)} />
                  <ResCard label="Decréscimo corrigido - Hf (m)" value={fmt(results.hftcor, 3)} highlight />
                  <div className="hidden sm:block" />
                  <ResCard label="Relação DZ/Hf" value={fmt(results.rTc, 2)} />
                </div>
              </Section>
            </>
          )}
        </div>
      )}

      {/* ── TAB: ANÁLISE DA UE ── */}
      {subTab === "analise" && (
        <div className="p-6 space-y-5">
          {!results ? (
            <p className="text-sm text-muted-foreground font-body text-center py-8">
              Preencha os dados na aba "Dados" e clique em Calcular.
            </p>
          ) : (
            <>
              <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-primary font-body">{results.situacao}</p>
              </div>

              <Section title="Distribuição das Cargas de Pressão na Subunidade">
                <div className="grid grid-cols-2 gap-3">
                  <ResCard label="Pressão no início da lateral média (m)" value={fmt(results.hIniLatMedia, 2)} />
                  <ResCard label="Pressão no início da terciária (m)" value={fmt(results.hIniTerc, 2)} />
                  <ResCard label="Pressão no final da terciária (m)" value={fmt(results.hFinalTerc, 2)} />
                  <ResCard label="Variação Pressão na terciária (m)" value={fmt(results.varTerc, 2)} />
                </div>
                <div className="grid grid-cols-1 gap-3 mt-3">
                  <ResCard label="Pressão no início da lateral acoplada no ponto de pressão mínima da terciária (m)" value={fmt(results.hIniLatAcop, 2)} />
                  <ResCard label="Pressão no final da lateral acoplada no ponto de pressão mínima da terciária (m)" value={fmt(results.hFinLatAcop, 2)} />
                  <ResCard label="Pressão mínima na lateral acoplada no ponto de pressão mínima da terciária (m)" value={fmt(results.hMinLatAcop, 2)} />
                  <ResCard label="Var. da pressão na lateral acoplada no ponto de pressão mínima da terciária (m)" value={fmt(results.varLat, 2)} />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <ResCard label="Pressão máxima na subunidade (m)" value={fmt(results.hMax, 2)} highlight />
                  <div className="rounded-xl p-3 bg-destructive/10 border border-destructive/30">
                    <p className="text-xs font-body font-semibold text-destructive">Local da pressão mínima na terciária:</p>
                    <p className="font-semibold font-body mt-0.5 text-sm text-foreground">{results.locMinTerc}</p>
                  </div>
                  <ResCard label="Pressão mínima na subunidade (m)" value={fmt(results.hMin, 2)} highlight />
                  <div className="rounded-xl p-3 bg-destructive/10 border border-destructive/30">
                    <p className="text-xs font-body font-semibold text-destructive">Local da pressão mínima na lateral:</p>
                    <p className="font-semibold font-body mt-0.5 text-sm text-foreground">{results.locMinLat}</p>
                  </div>
                  <ResCard label="Variação da pressão na subunidade (m)" value={fmt(results.varSub, 2)} />
                  <div className="hidden sm:block" />
                  <ResCard label="Vazão máxima na subunidade (L/h)" value={fmt(results.qMax, 3)} />
                  <div className="hidden sm:block" />
                  <ResCard label="Vazão mínima na subunidade (L/h)" value={fmt(results.qMin, 3)} />
                  <ResCard label="Var. da pressão admissível na terciária (m)" value={fmt(results.varAdmTerc, 2)} />
                </div>
                <div className="equation-block px-5 py-4 mt-3">
                  <p className="text-xs text-muted-foreground font-body mb-1">Uniformidade de Emissão</p>
                  <p className="font-display text-2xl font-bold text-primary">{fmt(results.uniformity, 2)} <span className="text-base font-body font-normal">%</span></p>
                </div>
              </Section>

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-border p-4 pt-3">
      <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body px-2">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function OrientationRow({ value, onChange }: { value: Orientation; onChange: (o: Orientation) => void }) {
  const opts: { v: Orientation; l: string }[] = [
    { v: "nivel", l: "Em nível" },
    { v: "ascendente", l: "Ascendente" },
    { v: "descendente", l: "Descendente" },
  ];
  return (
    <div className="flex gap-4">
      {opts.map(o => (
        <label key={o.v} className="flex items-center gap-2 cursor-pointer text-sm font-body text-foreground">
          <input
            type="radio"
            checked={value === o.v}
            onChange={() => onChange(o.v)}
            className="accent-[hsl(var(--primary))] w-4 h-4"
          />
          {o.l}
        </label>
      ))}
    </div>
  );
}

function NumInput({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-body">{label}</label>
      <input type="number" value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        className={`w-full px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 no-spinner ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        style={{ borderColor: "hsl(var(--border))" }} />
    </div>
  );
}

function RugInput({ value, onChange, custom, onToggle }: { value: string; onChange: (v: string) => void; custom: boolean; onToggle: () => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-body">Rugosidade do tubo (mm)</label>
      <div className="flex gap-2">
        <input type="number" value={value} onChange={e => { if (custom) onChange(e.target.value); }} readOnly={!custom}
          className={`flex-1 px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 no-spinner ${!custom ? "cursor-default" : ""}`}
          style={{ borderColor: "hsl(var(--border))" }} />
        <button type="button" onClick={onToggle}
          className={`px-3 py-2 rounded-lg border text-xs font-semibold font-body transition-all ${
            custom ? "gradient-primary text-primary-foreground border-transparent" : "bg-muted text-muted-foreground border-border hover:border-primary"
          }`}>{custom ? "Lista" : "✏️"}</button>
      </div>
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
