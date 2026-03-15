import { useState } from "react";
import { PairedInputs, DadosResult } from "./paired/utils";
import DadosTab from "./paired/DadosTab";
import EmparelhamentoTab, { EmparResult } from "./paired/EmparelhamentoTab";
import DistCargasTab from "./paired/DistCargasTab";

const defaultInputs: PairedInputs = {
  exp: "0.5", Temp: "20", conex: "5.0", Di: "72.5",
  Ltotal: "276", Eem: "12", Dist1: "6", desn: "1.2",
  qem: "1.533", hast: "1", vq: "10", Rug: "0.00334", Pn: "26.25",
  flowUnit: "m3h", materialIdx: 1,
};

export default function PairedLateralsCalculator() {
  const [inputs, setInputs] = useState<PairedInputs>(defaultInputs);
  const [dadosResult, setDadosResult] = useState<DadosResult | null>(null);
  const [emparResult, setEmparResult] = useState<EmparResult | null>(null);
  const [activeTab, setActiveTab] = useState<"dados" | "empar" | "dist">("dados");

  const tabs = [
    { key: "dados" as const, label: "Dados" },
    { key: "empar" as const, label: "Emparelhamento" },
    { key: "dist" as const, label: "Dist. das Cargas de Pressão" },
  ];

  return (
    <div>
      <div className="flex border-b border-border">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2.5 text-xs font-semibold font-body transition-colors border-b-2 ${
              activeTab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "dados" && (
        <DadosTab inputs={inputs} setInputs={setInputs} onResult={setDadosResult} />
      )}
      {activeTab === "empar" && (
        <EmparelhamentoTab inputs={inputs} dadosResult={dadosResult} onResult={setEmparResult} />
      )}
      {activeTab === "dist" && (
        <DistCargasTab dadosResult={dadosResult} emparResult={emparResult} />
      )}
    </div>
  );
}
