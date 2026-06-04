import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BookOpen, Download, Calculator, Droplets, Waves, ChevronDown, Leaf, Sun, BookMarked } from "lucide-react";
import IrrigationCalculator from "@/components/IrrigationCalculator";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import heroImg from "@/assets/hero-irrigation.jpg";
import dripImg from "@/assets/drip-irrigation.jpg";
import sprinklerImg from "@/assets/sprinkler-irrigation.jpg";
import pivotImg from "@/assets/pivot-irrigation.jpg";
import pivotImg2 from "@/assets/pivot-irrigation-2.jpg";
import microImg from "@/assets/micro-sprinkler.jpg";
import exercicio9Img from "@/assets/exercicio9-layout.png";

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
    desc: "É o sistema em que a tubulação lateral é sustentada por torres com propulsão própria, que se deslocam desenvolvendo órbitas circulares em torno da torre central.",
    img: pivotImg,
    img2: pivotImg2,
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
  const [exercicio5Open, setExercicio5Open] = useState(false);
  const [exercicio6Open, setExercicio6Open] = useState(false);
  const [exercicio7Open, setExercicio7Open] = useState(false);
  const [exercicio8Open, setExercicio8Open] = useState(false);
  const [exercicio9Open, setExercicio9Open] = useState(false);
  const [exercicio10Open, setExercicio10Open] = useState(false);

  return (
    <div className="min-h-screen bg-background font-body">
      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Droplets size={22} className="text-primary" />
            <span className="font-display font-semibold text-foreground text-base leading-tight">
              Computação para Irrigação
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
            Programas Computacionais<br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg, hsl(152 80% 70%), hsl(200 80% 75%))" }}>
              para Irrigação
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
                    {(sys as any).img2 ? (
                      <div className="flex w-full h-full">
                        <img src={sys.img} alt={sys.title} className="w-1/2 h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <img src={(sys as any).img2} alt={sys.title} className="w-1/2 h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <img src={sys.img} alt={sys.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
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
                    <p className={`text-xs text-muted-foreground font-body leading-relaxed ${sys.title !== "Gotejamento" ? "text-justify" : ""}`}>{sys.desc}</p>
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
                <DropdownMenuItem className="cursor-pointer" onSelect={() => setExercicio5Open(true)}>Exercício 5</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onSelect={() => setExercicio6Open(true)}>Exercício 6</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onSelect={() => setExercicio7Open(true)}>Exercício 7</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onSelect={() => setExercicio8Open(true)}>Exercício 8</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onSelect={() => setExercicio9Open(true)}>Exercício 9</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onSelect={() => setExercicio10Open(true)}>Exercício 10</DropdownMenuItem>
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
              <span className="font-display font-semibold text-white/90">Programas Computacionais para Irrigação</span>
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

      {/* ── EXERCÍCIO 4 MODAL ── */}
      <Dialog open={exercicio4Open} onOpenChange={setExercicio4Open}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Exemplo 4.2</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground font-body leading-relaxed text-justify">
            A tubulação lateral de determinado sistema de irrigação por gotejamento possui 100 metros de comprimento. A pressão nominal do gotejador é de 13 m c.a. e produz uma vazão média de 4,0 l h⁻¹. A distância entre gotejadores na lateral é de 1,0 m. A temperatura da água é de 22°C. A variação máxima da vazão entre o primeiro e último emissor na lateral deve ser de 10%. Considerando o que diâmetro interno da tubulação de 13 mm, determine a variação da carga de pressão e da vazão para a seguinte situação topográfica: Tubulação lateral em desnível de 0,68 m e emparelhada com um trecho ascendente e outro descendente. (Utilize a calculadora Laterais emparelhadas).
          </p>
        </DialogContent>
      </Dialog>

      {/* ── EXERCÍCIO 5 MODAL ── */}
      <Dialog open={exercicio5Open} onOpenChange={setExercicio5Open}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Exemplo 4.3</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground font-body leading-relaxed text-justify">
            Dimensione a rede de distribuição do sistema de irrigação por gotejamento, de modo que a uniformidade de emissão da água seja de no mínimo 95%, a qual apresenta as seguintes características: Tubulação terciária: Comprimento da tubulação: 120 m; espaçamento entre tubulações laterais: 3,0 m, desnível descendente: 1,2 m; tubos de PVC. Tubulações laterais: Comprimento das tubulações: 60 m; desnível topográfico descendente de 0,6 m; tubos de PEBD; espaçamento entre laterais de 3,0 m; diâmetro das tubulações laterais de 13,0 mm. Gotejadores sobre linha com dimensões padrão: Vazão média do gotejador: 4,0 l h⁻¹; pressão de serviço: 10 m. Coeficiente de variação de fabricação: 0,03; espaçamento entre gotejadores de 1,0 m; três emissores por planta; equação do gotejador; temperatura da água: 20 °C. (Utilize a calculadora Subunidade).
          </p>
        </DialogContent>
      </Dialog>

      {/* ── EXERCÍCIO 6 MODAL ── */}
      <Dialog open={exercicio6Open} onOpenChange={setExercicio6Open}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Exemplo 4.4</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground font-body leading-relaxed text-justify">
            A subunidade de irrigação por gotejamento de formato trapezoidal deve ser abastecida por tubulação terciária de PVC com 50 m de comprimento e diâmetro único de 48,1 mm. As laterais serão espaçadas de 2,5 m. A primeira e última tubulação lateral possuem, nessa ordem, 25 m e 75 m de comprimento, e serão compostas por tubo gotejador com diâmetro interno de 16 mm com gotejadores espaçados de 0,5 m; a pressão de serviço do emissor é de 10 m e produz vazão média de 4,0 l h⁻¹; o valor do expoente de descarga do emissor é x = 0,48 e do coeficiente de descarga é K = 1,325. Estime o decréscimo da carga de pressão na terciária e a carga de pressão no seu início. (Utilize a calculadora Sub Trapezoidal).
          </p>
        </DialogContent>
      </Dialog>

      {/* ── EXERCÍCIO 7 MODAL ── */}
      <Dialog open={exercicio7Open} onOpenChange={setExercicio7Open}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Exemplo 4.5</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground font-body leading-relaxed text-justify">
            A subunidade de irrigação por gotejamento, de formato trapezoidal, deve ser abastecida por tubulação terciária de PVC com 50 m de comprimento e com dois diâmetros em série de 48,1 mm e 35,7 mm. As laterais serão espaçadas de 2,5 m. A primeira e última tubulação lateral possuem, nessa ordem, 25 m e 75 m de comprimento, e serão compostas por tubo gotejador com diâmetro interno de 16 mm, com gotejadores espaçados de 0,5 m; a pressão de serviço do emissor é de 10 m e produz vazão média de 4,0 l h⁻¹; o valor do expoente de descarga do emissor é x = 0,48 e do coeficiente de descarga é K = 1,325. Estime o decréscimo da carga de pressão que se produz na terciária e a carga de pressão no seu início. (Utilize a calculadora Sub Trapezoidal).
          </p>
        </DialogContent>
      </Dialog>

      {/* ── EXERCÍCIO 8 MODAL ── */}
      <Dialog open={exercicio8Open} onOpenChange={setExercicio8Open}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Exemplo 5.3</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground font-body leading-relaxed text-justify">
              A tubulação lateral de um sistema de irrigação por aspersão convencional, disposta na horizontal, possui 138 m de comprimento. Os aspersores estão espaçados de 12 m e o primeiro aspersor está a 6 m do início da lateral. A tubulação é de PVC, a temperatura da água é de 20° C. Assumir a variação máxima da vazão de 10% entre os aspersores extremos. A altura da haste do aspersor é de 1,0 m. Dimensione a tubulação com dois diâmetros. Características do aspersor selecionado:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Diâmetro dos bocais (mm)</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Coeficiente de descarga dos bocais</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Vazão nominal (m³h⁻¹)</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Pressão de serviço (m c.a.)</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Expoente x da equação (q = K Hˣ)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="px-3 py-2 text-foreground">5,0 x 2,4</td>
                    <td className="px-3 py-2 text-foreground">0,91 x 0,985</td>
                    <td className="px-3 py-2 text-foreground">1,95</td>
                    <td className="px-3 py-2 text-foreground">30</td>
                    <td className="px-3 py-2 text-foreground">0,5</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground font-body leading-relaxed text-justify">
              (Utilize a calculadora 2 Diâmetros).
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── EXERCÍCIO 9 MODAL ── */}
      <Dialog open={exercicio9Open} onOpenChange={setExercicio9Open}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg text-primary">Exercício 9 — Exemplo 5.4</DialogTitle>
            <DialogDescription className="text-muted-foreground font-body text-sm">
              Dimensionamento de tubulação lateral por aspersão convencional — Laterais emparelhadas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground font-body leading-relaxed text-justify">
              <strong>Exemplo 5.4:</strong> Um projeto de irrigação, por aspersão convencional, será montado para irrigar a cultura do feijoeiro. ETc = 6,0 mm dia⁻¹; eficiência da irrigação Efi = 85%; tempo disponível, por dia, para os eventos de irrigação: 10 horas; tubulação adutora: 40 m de comprimento; tubulação principal: 171 m de comprimento, o primeiro e o último hidrante estão a 9,0 m dos limites inicial e final da área no sentido da tubulação principal, conforme figura a seguir.
            </p>
            <div className="flex justify-center">
              <img src={exercicio9Img} alt="Layout do sistema de irrigação - Exemplo 5.4" className="max-w-full rounded-lg border border-border" />
            </div>
            <p className="text-sm text-muted-foreground font-body leading-relaxed text-justify">
              Vazão nominal do aspersor: 1,46 m³ h⁻¹; pressão de serviço: 25 m c.a.; expoente de descarga do aspersor: x = 0,5; espaçamento entre aspersores na lateral: 12 m; espaçamento entre laterais: 18 m; diâmetro de cobertura do aspersor: 25 m; diâmetro dos bocais dos aspersores: 4,6 mm x 2,5 mm; altura da haste dos aspersores: 1,0 m.
            </p>
            <p className="text-sm text-muted-foreground font-body leading-relaxed text-justify">
              <strong>Determine:</strong> O diâmetro da tubulação lateral, e os comprimentos dos ramais em aclive e em declive.
            </p>
            <p className="text-sm text-muted-foreground font-body leading-relaxed text-justify">
              (Utilize a calculadora Laterais emparelhadas).
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── EXERCÍCIO 10 MODAL ── */}
      <Dialog open={exercicio10Open} onOpenChange={setExercicio10Open}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Exercício 10 — Exemplo 6.8</DialogTitle>
            <DialogDescription>Pivô Central — Método analítico e trecho-a-trecho</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm leading-relaxed text-justify">
            <p>
              <strong>Exemplo 6.8:</strong> A tubulação lateral do sistema de irrigação pivô central com diâmetro único de 213 mm e comprimento até a última torre de 480,3 m e lance em balanço de 25 m é constituída de aço galvanizado. A lâmina d'água líquida a ser aplicada pelo sistema é de 7,2 mm e o tempo de operação é de 21 horas por dia. A eficiência da irrigação é de 90%. A vazão do aspersor final <em>spray</em> é de 4,86 m³ h⁻¹. Os emissores serão espaçados de 3,0 m. Considerou-se o coeficiente de descarga dos emissores de 0,977. A carga de pressão no último emissor é de 13 m. O desnível topográfico, uniforme, entre o ponto do pivô e a parte mais alta da área irrigada é de 2,0% e entre a parte mais baixa é de 1,2%. O comprimento do tubo de subida é de 4,0 m e a distância entre o ponto do pivô e o início da lateral é de 3,5 m. A temperatura da água é 22 °C.
            </p>
            <p>
              Determinar o decréscimo da carga de pressão e as cargas de pressão no início da lateral e no ponto do pivô pelos métodos analítico e trecho-a-trecho.
            </p>
            <p className="text-muted-foreground italic">
              (Utilize a calculadora Pivô central).
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── CALCULATOR MODAL ── */}
      <IrrigationCalculator open={calcOpen} onClose={() => setCalcOpen(false)} />
    </div>
  );
}
