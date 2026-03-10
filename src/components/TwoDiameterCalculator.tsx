import { useState } from "react";
import { TwoDiamInputs, DadosResult, TWO_DIAM_MATERIALS } from "./twodiam/utils";
import DadosTab from "./twodiam/DadosTab";
import ProcedimentosTab from "./twodiam/ProcedimentosTab";
import TrechoTab from "./twodiam/TrechoTab";

export default function TwoDiameterCalculator() {
  const [subTab, setSubTab] = useState<'dados' | 'procedimentos' | 'trecho'>('dados');

  const [inputs, setInputs] = useState<TwoDiamInputs>({
    LT: '', Easp: '', distpri: '', qem: '',
    Tempa: '20', dq: '', Ps: '', hast: '',
    epx: '', Dsup: '72.5', Dinf: '48.1', Desn: '',
    rgd: '0.003334',
    topology: 'nivel',
    method: 'half',
  });
  const [materialIdx, setMaterialIdx] = useState(0);
  const [dadosResult, setDadosResult] = useState<DadosResult | null>(null);

  const update = (key: keyof TwoDiamInputs, val: string) => {
    setInputs(prev => ({ ...prev, [key]: val }));
  };

  const setMaterial = (idx: number) => {
    setMaterialIdx(idx);
    update('rgd', TWO_DIAM_MATERIALS[idx].roughness.toString());
  };

  const tabs = [
    { key: 'dados' as const, label: 'Dados' },
    { key: 'procedimentos' as const, label: 'Procedimentos' },
    { key: 'trecho' as const, label: 'Trecho - a - Trecho' },
  ];

  return (
    <div className="space-y-0">
      {/* Sub-tabs */}
      <div className="flex border-b border-border">
        {tabs.map(t => (
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

      {subTab === 'dados' && (
        <DadosTab
          inputs={inputs}
          materialIdx={materialIdx}
          onUpdate={update}
          onSetMaterial={setMaterial}
          onResult={setDadosResult}
          result={dadosResult}
        />
      )}
      {subTab === 'procedimentos' && (
        <ProcedimentosTab inputs={inputs} dadosResult={dadosResult} />
      )}
      {subTab === 'trecho' && (
        <TrechoTab inputs={inputs} dadosResult={dadosResult} />
      )}
    </div>
  );
}
