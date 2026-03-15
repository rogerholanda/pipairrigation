export const fmt = (v: number, d: number): number => parseFloat(v.toFixed(d));
export const fmtBR = (v: number, d: number): string => v.toFixed(d).replace('.', ',');

export const PAIRED_MATERIALS = [
  { label: "PEBD", roughness: 0.0015 },
  { label: "PVC", roughness: 0.00334 },
  { label: "AZDº", roughness: 0.15 },
];

export const PAIRED_PIPE_SIZES = [5.3, 13, 13.6, 16, 20.6, 26.9, 35.7, 48.1, 72.5, 97.6];
export const PAIRED_CONEXOES = [3.8, 5.0, 7.6];

export function colebrook(rgd: number, Di: number, NR: number): number {
  let oldf = 1;
  for (let i = 0; i < 200; i++) {
    const newf = 1 / (-2 * Math.log(rgd / (3.7 * Di) + 2.51 / (NR * Math.sqrt(oldf))) * 0.434294482) ** 2;
    if (Math.abs((newf - oldf) / oldf) < 0.001) { oldf = newf; break; }
    oldf = newf;
  }
  return oldf;
}

export function calcFluidProps(Tempa: number) {
  const Kelv = Tempa + 273.16;
  const Lgu = -11.73 + 1828 / Kelv + 0.01966 * Kelv - 0.00001466 * Kelv ** 2;
  const u = fmt(10 ** Lgu / 100, 5);
  const uc = u * 1000;
  const Fct = ((Tempa - 3.983035) ** 2) * (Tempa + 301.797) / (522528.9 * (Tempa + 69.34881));
  const mespa = fmt(1000 * (1 - Fct), 2);
  const visc = u / mespa;
  return { u, uc, mespa, visc };
}

export interface PairedInputs {
  exp: string; Temp: string; conex: string; Di: string;
  Ltotal: string; Eem: string; Dist1: string; desn: string;
  qem: string; hast: string; vq: string; Rug: string; Pn: string;
  flowUnit: "m3h" | "Lh";
  materialIdx: number;
}

export interface DadosResult {
  Nem: number; Qt: number; Vel: number; Re: number; f: number;
  Hfl: number; Fa: number; Hflcor: number; m: number;
  dz: number; Vpadm: number; Hfladm: number;
}

export function NumInput({ label, value, onChange, disabled, readOnly }: {
  label: string; value: string; onChange: (v: string) => void;
  disabled?: boolean; readOnly?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-body">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        readOnly={readOnly}
        className={`w-full px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 no-spinner ${disabled || readOnly ? 'opacity-60 cursor-default' : ''}`}
        style={{ borderColor: "hsl(var(--border))" }}
      />
    </div>
  );
}

export function ResultField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl p-3 bg-muted">
      <p className="text-xs font-body text-muted-foreground">{label}</p>
      <p className="font-semibold font-body mt-0.5 text-foreground">{value}</p>
    </div>
  );
}
