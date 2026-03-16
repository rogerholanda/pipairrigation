import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Download, Calculator, Droplets, Waves, ChevronDown, Leaf, Sun, BookMarked } from "lucide-react";
import IrrigationCalculator from "@/components/IrrigationCalculator";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import heroImg from "@/assets/hero-irrigation.jpg";
import dripImg from "@/assets/drip-irrigation.jpg";
import sprinklerImg from "@/assets/sprinkler-irrigation.jpg";
import pivotImg from "@/assets/pivot-irrigation.jpg";
import microImg from "@/assets/micro-sprinkler.jpg";

const PDF_PLACEHOLDER_URL = "#download-ebook";

const quotes = [
  {
    text: "Aquilo que observamos não é a natureza em si, mas a natureza exposta ao nosso método de questionamento.",
    author: "Werner Heisenberg",
    role: "",
  },
  {
    text: "A nossa ignorância ou a implausibilidade de nossas ideias jamais devem interromper as nossas especulações.",
    author: "Marcelo Gleiser",
    role: "",
  },
  {
    text: "A liberdade de questionamento não deve ter barreiras. Não há lugar para dogmas na ciência.",
    author: "J. Robert Oppenheimer",
    role: "",
  },
];

const irrigationTypes = [
  {
    title: "Gotejamento",
    desc: "Aplica água diretamente na zona radicular das plantas, com alta eficiência e mínima evaporação. Ideal para culturas de alto valor econômico.",
    img: dripImg,
    icon: Droplets,
    efficiency: "90–95%",
  },
  {
    title: "Microaspersão",
    desc: "Distribui água em pequenas áreas circulares próximas às plantas. Excelente para fruticultura e cultivos em espaçamentos maiores.",
    img: microImg,
    icon: Waves,
    efficiency: "85–90%",
  },
  {
    title: "Aspersão Convencional",
    desc: "Simula a chuva natural, aplicando água acima das culturas por meio de aspersores rotativos ou fixos. Versátil e amplamente utilizada.",
    img: sprinklerImg,
    icon: Sun,
    efficiency: "75–85%",
  },
  {
    title: "Pivô Central",
    desc: "Sistema de grande porte que gira em torno de um ponto central, irrigando áreas circulares de hectares. Alta automação e cobertura.",
    img: pivotImg,
    icon: Leaf,
    efficiency: "80–90%",
  },
];


export default function Index() {
  const [calcOpen, setCalcOpen] = useState(false);
  const [exercicio1Open, setExercicio1Open] = useState(false);
  const [exercicio2Open, setExercicio2Open] = useState(false);
  const [exercicio3Open, setExercicio3Open] = useState(false);
  const [exercicio4Open, setExercicio4Open] = useState(false);

  return (
    <div className="min-h-screen bg-background font-body">
      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Droplets size={22} className="text-primary" />
            <span className="font-display font-semibold text-foreground text-base leading-tight">
              Eng. Sistemas de Irrigação
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-body text-muted-foreground">
            <a href="#sobre" className="hover:text-primary transition-colors">Sobre</a>
            <a href="#sistemas" className="hover:text-primary transition-colors">Sistemas</a>
            
            <a href="#autor" className="hover:text-primary transition-colors">Autor</a>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCalcOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-secondary/10 text-secondary text-sm font-semibold hover:bg-secondary/20 transition-colors"
            >
              <Calculator size={15} />
              Calculadora
            </button>
            <a
              href={PDF_PLACEHOLDER_URL}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
            >
              <Download size={15} />
              E-book
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <img src={heroImg} alt="Sistemas de irrigação agrícola" className="absolute inset-0 w-full h-full object-cover" />
        <div className="gradient-hero absolute inset-0" />
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto animate-fade-up">
          <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm border border-primary/30 text-primary-foreground px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
            <BookMarked size={14} />
            José Orlando Piauilino Ferreira
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
            Engenharia dos<br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg, hsl(152 80% 70%), hsl(200 80% 75%))" }}>
              Sistemas de Irrigação
            </span>
          </h1>
          <p className="text-white/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-body font-light">
            Gotejamento · Microaspersão · Aspersão Convencional · Pivô Central
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href={PDF_PLACEHOLDER_URL}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-elegant hover:opacity-90 transition-opacity text-base"
            >
              <Download size={18} />
              Baixar E-book em PDF
            </a>
            <button
              onClick={() => setCalcOpen(true)}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white/15 backdrop-blur-sm text-white border border-white/30 font-semibold hover:bg-white/25 transition-colors text-base"
            >
              <Calculator size={18} />
              Abrir Calculadora
            </button>
          </div>
        </div>
        <a href="#sobre" className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/60 animate-bounce">
          <ChevronDown size={32} />
        </a>
      </section>

      {/* ── QUOTES ── */}
      <section className="py-16 gradient-section">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {quotes.map((q, i) => (
              <blockquote key={i} className="gradient-card rounded-2xl p-6 shadow-card border border-border">
                <p className="text-foreground/80 font-body text-sm leading-relaxed italic mb-4 text-justify">
                  "{q.text}"
                </p>
                <footer>
                  <cite className="font-display font-semibold text-primary not-italic block">{q.author}</cite>
                  <span className="text-xs text-muted-foreground font-body">{q.role}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOBRE / APRESENTAÇÃO ── */}
      <section id="sobre" className="py-20 bg-card">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-primary font-body">Apresentação</span>
              <h2 className="font-display text-4xl font-bold text-foreground mt-2 mb-6 leading-tight">
                Irrigação como Ciência e Prática
              </h2>
              <div className="space-y-4 text-muted-foreground font-body text-sm leading-relaxed text-justify">
                <p>
                  A irrigação viabiliza a exploração agrícola em regiões de clima semiárido ou com veranicos, sendo uma técnica imprescindível na atividade agrícola para aumentar a produtividade e propiciar a qualidade dos produtos, desde que utilizada adequadamente.
                </p>
                <p>
                  O gerenciamento da irrigação deve ser realizado considerando atributos do <strong className="text-foreground">solo, da água, da planta e do clima</strong>, para que a água seja aplicada no tempo e na quantidade certa.
                </p>
                <p>
                  Com o advento da <strong className="text-foreground">Lei 12.787/13 (Lei da Irrigação)</strong>, busca-se o uso e manejo sustentável dos solos e dos recursos hídricos destinados à irrigação, visando crescimento econômico com preservação ambiental.
                </p>
              </div>
              <div className="mt-8 flex gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-primary-muted rounded-lg px-4 py-2 text-sm font-body font-semibold text-primary">
                  <Leaf size={14} /> 31 anos de docência
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SISTEMAS DE IRRIGAÇÃO ── */}
      <section id="sistemas" className="py-20 gradient-section">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary font-body">Tecnologias</span>
            <h2 className="font-display text-4xl font-bold text-foreground mt-2">Sistemas de Irrigação</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm font-body">
              Cada sistema possui características hidráulicas distintas, exigindo dimensionamento específico para maximizar eficiência e sustentabilidade.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {irrigationTypes.map((sys) => {
              const Icon = sys.icon;
              return (
                <div key={sys.title} className="bg-card rounded-2xl overflow-hidden shadow-card border border-border group hover:-translate-y-1 transition-transform duration-300">
                  <div className="relative h-44 overflow-hidden">
                    <img src={sys.img} alt={sys.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 gradient-hero opacity-40" />
                    <div className="absolute top-3 right-3 bg-primary/90 text-primary-foreground text-xs font-bold font-body px-2.5 py-1 rounded-full">
                      {sys.efficiency}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={16} className="text-primary" />
                      <h3 className="font-display font-semibold text-foreground">{sys.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground font-body leading-relaxed">{sys.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>


      {/* ── CALCULADORA CTA ── */}
      <section className="py-16 gradient-primary">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Calculator size={40} className="mx-auto mb-4 text-primary-foreground/80" />
          <h2 className="font-display text-3xl font-bold text-primary-foreground mb-4">
            Programa Computacional para Projeto Hidráulico
          </h2>
          <p className="text-primary-foreground/80 font-body text-sm mb-8 max-w-xl mx-auto leading-relaxed">
            Calcula, principalmente, o decréscimo da carga de pressão em tubulações de irrigação com intuito de proporcionar o funcionamento eficiente dos sistemas de irrigação.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => setCalcOpen(true)}
              className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-8 py-3.5 rounded-xl hover:bg-white/90 transition-colors shadow-elegant text-base"
            >
              <Calculator size={18} />
              Abrir Calculadora
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-primary-foreground font-semibold px-8 py-3.5 rounded-xl border border-white/30 hover:bg-white/30 transition-colors text-base"
                >
                  <BookOpen size={18} />
                  Exercícios
                  <ChevronDown size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-card border border-border shadow-lg z-50">
                <DropdownMenuItem className="cursor-pointer" onSelect={() => setExercicio1Open(true)}>Exercício 1</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onSelect={() => setExercicio2Open(true)}>Exercício 2</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onSelect={() => setExercicio3Open(true)}>Exercício 3</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onSelect={() => setExercicio4Open(true)}>Exercício 4</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </section>

      {/* ── DOWNLOAD EBOOK ── */}
      <section id="autor" className="py-20 gradient-section">
        <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-3xl mx-auto">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-primary font-body">O Autor</span>
              <h2 className="font-display text-3xl font-bold text-foreground mt-2 mb-4">
                Prof. José Orlando Piauilino Ferreira
              </h2>
              <p className="text-muted-foreground font-body text-sm leading-relaxed mb-6 text-justify">
                Engenheiro Agrônomo, graduado pela <strong className="text-foreground">Universidade Federal Rural de Pernambuco (UFRPE)</strong>. Mestre em Agronomia – Área de concentração: Irrigação e Drenagem – <strong className="text-foreground">Escola Superior de Agricultura "Luiz de Queiroz" (ESALQ – USP)</strong>. Doutor em Agronomia – Área de concentração: Produção Vegetal – <strong className="text-foreground">Universidade Estadual de São Paulo "Júlio de Mesquita" (UNESP – Jaboticabal/SP)</strong>. É professor titular, aposentado, do <strong className="text-foreground">Colégio Técnico de Bom Jesus – PI</strong>, vinculado à Universidade Federal do Piauí (UFPI). Durante o período de docência ministrou as disciplinas de Irrigação, Agrometeorologia, Informática Aplicada à Agronomia e Educação e Legislação ambiental.
              </p>
              <blockquote className="border-l-4 pl-4 italic text-sm text-muted-foreground font-body" style={{ borderColor: "hsl(var(--primary))" }}>
                "Àquele que é o caminho, a verdade e a vida – a ti JESUS."
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-foreground text-background py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Droplets size={20} className="text-primary" style={{ color: "hsl(152 55% 55%)" }} />
              <span className="font-display font-semibold text-white/90">Engenharia dos Sistemas de Irrigação</span>
            </div>
            <div className="text-center">
              <p className="text-white/50 text-xs font-body">
                Eng° Agrº Prof. Dr José Orlando Piauilino Ferreira
              </p>
              <p className="text-white/30 text-xs font-body">
                Colégio Técnico de Bom Jesus – PI
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* ── EXERCÍCIO 1 MODAL ── */}
      <Dialog open={exercicio1Open} onOpenChange={setExercicio1Open}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Exemplo 1.10</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground font-body leading-relaxed text-justify">
            Numa tubulação de PVC com 100 m de comprimento e diâmetro interno de 72,5 mm a água escoa à taxa de 25,2 m³ h⁻¹ e temperatura de 20° C. Sendo a rugosidade absoluta da superfície interna do tubo de 0,003334 mm. Determine o fator de atrito e o decréscimo da carga de pressão. (Utilize a calculadora Colebrook).
          </p>
        </DialogContent>
      </Dialog>

      {/* ── EXERCÍCIO 2 MODAL ── */}
      <Dialog open={exercicio2Open} onOpenChange={setExercicio2Open}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Exemplo 1.21</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground font-body leading-relaxed text-justify">
            A água a 20 °C será transportada de um grande reservatório para um canal de irrigação por meio de uma tubulação de PVC cujo comprimento é de 200 m. A vazão desejada é de 20 m³·h⁻¹. A diferença de nível, ΔZ, entre os pontos 1 e 2 é de 5,0 m. O início e o final da tubulação estão a 1,0 m da superfície da água nos reservatórios. Conforme esquematizado na Figura 1.32. Determine o diâmetro comercial da tubulação, o decréscimo da carga de pressão. (Utilize a calculadora Diâmetro).
          </p>
        </DialogContent>
      </Dialog>

      {/* ── EXERCÍCIO 3 MODAL ── */}
      <Dialog open={exercicio3Open} onOpenChange={setExercicio3Open}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Exemplo 3.2</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground font-body leading-relaxed text-justify">
            A água a 20 °C deve ser bombeada à taxa de 210 m³·h⁻¹. A tubulação que interliga o reservatório à bomba é de PVC (ε = 0,003334 mm), com diâmetro interno de 250 mm e comprimento de 12 m; e possui uma válvula de pé com crivo, uma curva de 90° e uma redução excêntrica (250 × 125 mm). A tubulação de recalque, também de PVC, possui diâmetro interno de 200 mm e 272,8 m de comprimento, além de uma ampliação concêntrica (100 × 200 mm), um registro de gaveta, uma válvula de retenção e uma curva de 90°. As alturas estáticas de sucção e de recalque são, nessa ordem, de 2,0 metros e 10 metros. Pede-se: determinar as pressões nas secções de entrada e saída da bomba, a carga e potência da bomba com tubulação de recalque, descarregando livremente num canal de irrigação. (Utilize a calculadora Bombeamento).
          </p>
        </DialogContent>
      </Dialog>

      {/* ── CALCULATOR MODAL ── */}
      <IrrigationCalculator open={calcOpen} onClose={() => setCalcOpen(false)} />
    </div>
  );
}
