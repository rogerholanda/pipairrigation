# Irrigation Smart Design

Crie um site que seja a página de um projeto acadêmico de engenharia de sistemas de irrigação ,  feito por um professor de irrigação do colégio técnico de bom jesus , inclua imagens que remete a irrigação e equações matemáticas.  O site deve ser bonito visualmente, moderno, com cores claras. Inclua  o link para o usuário clicar para baixar o ebook em pdf  com esse conteúdo "José Orlando Piauilino Ferreira

ENGENHARIA DOS SISTEMAS

DE IRRIGAÇÃO

	Gotejamento

	Microaspersão

	Aspersão Convencional

	Pivô central

“Aquilo que observamos não é a natureza em si, mas a natureza exposta ao nosso método de questionamento”

		Werner Heisenberg (Físico e Filósofo alemão, 1958)

“A nossa ignorância ou a implausibilidade de nossas ideias jamais devem interromper as nossas especulações” 

Marcelo Gleiser (Físico brasileiro)

“A liberdade de questionamento não deve ter barreiras. Não há lugar para dogmas na ciência. O cientista é livre para perguntar qualquer questão, duvidar de qualquer afirmação, procurar por qualquer evidência e corrigir quaisquer erros.”

J. Robert Oppenheimer, 1949. Físico Americano 

                                                       que em 1942 Liderou o Projeto Manhattan.

Apresentação

A irrigação viabiliza a exploração agrícola em regiões de clima semiárido ou com veranicos, sendo uma técnica imprescindível na atividade agrícola para aumentar a produtividade e propiciar a qualidade dos produtos, desde que utilizada adequadamente. Portanto, o gerenciamento da irrigação deve ser realizado considerando-se atributos do solo, da água, da planta e do clima, para que a água seja aplicada através dos sistemas de irrigação no tempo e na quantidade certa. Para que o gerenciamento da irrigação atinja seu objetivo é necessário também que os sistemas de irrigação sejam hidraulicamente bem projetados.

Com o advento da Lei 12.787/13 (Lei da Irrigação), que institui a política nacional de irrigação, busca-se, com um de seus princípios, o uso e manejo sustentável dos solos e dos recursos hídricos destinados à irrigação (art. 3, I); sendo um dos seus objetivos a disseminação de práticas que levem ao êxito dos projetos (art. 10, III).

O objetivo dessa publicação é fornecer aos estudantes de agronomia e a engenheiros agrônomos que trabalham com projetos de irrigação, equações e programas computacionais para o dimensionamento dos sistemas de irrigação, de acordo com as exigências práticas. De modo a planificar o suprimento de água de modo programado, em quantidade e qualidade, e com isso obter crescimento econômico, garantindo a preservação ambiental e viabilizando o desenvolvimento sustentável.   

Os exercícios resolvidos e propostos nessa edição resultam do trabalho docente  realizado pelo autor durante os 31 anos de docência com a utilização de outros textos didáticos. Desse modo, a ocorrência de semelhanças com exercícios propostos por outros autores é inevitável; notadamente quando se trata de exercícios que usualmente denomina-se de clássicos. Assim sendo, pedimos desculpas pelas eventuais semelhanças.

 

O autor

IRRIGAÇÃO

	É a técnica utilizada para aplicar água em terrenos cultivados, na quantidade e tempo certo, levando em consideração particularidades do solo, da água, do clima e das plantas. Cuja finalidade é manter o solo com teor de umidade adequado para suprir as necessidades hídricas das plantas; e, com isso, proporcionar um ambiente favorável ao crescimento e desenvolvimento delas.

Conforme o artigo 2º, III da Lei 12.787/2013, que institui a política nacional de irrigação, Agricultura Irrigada é a atividade econômica que explora culturas agrícolas, florestais, ornamentais e pastagens, bem como atividades agropecuárias afins, com uso de técnicas de irrigação ou drenagem.

SOBRE O TÍTULO

	O título desse trabalho surgiu da ideia de que a irrigação é o ato de levar água às plantas, às culturas; conforme definição no primeiro parágrafo do texto supracitado. Porém, a condução e distribuição da água é realizada pelos sistemas, os quais são compostos, basicamente, por tubulações, conexões, emissores e conjunto elevatório (motobomba). Os cálculos apresentados nos seis capítulos que compõem esse trabalho são utilizados para dimensionar os componentes dos sistemas, e não a irrigação propriamente dita. Daí o título Engenharia dos Sistemas de Irrigação. 

AGRADECIMENTOS

Àquele que é o caminho, a verdade e a vida; luz do mundo; o alfa e o ômega; o filho de Deus – a ti JESUS.

Ao Professor de informática do CTBJ, Allan Jheynson Ramos Gonçalves, pela valiosa contribuição na geração dos programas executáveis que compõem esta publicação." Além disso, deve ter um botão para o usuário abrir o programa para fazer os cálculos de irrigação, quando o usuário clicar neste botão o programa deve abrir no centro da tela enquanto o site fica fosco. "Private Sub ComboBox4_Change()

If ComboBox4.Text = "PEBD" Then

   Label24.Caption = "Polietileno de Baixa Densidade"

    ComboBox3.Value = "0.0015"

   

End If

If ComboBox4.Text = "PVC" Then

   Label24.Caption = "Penta Cloreto de Vinila"

    ComboBox3.Value = "0.003334"

   

End If

If ComboBox4.Text = "AZDº" Then

   Label24.Caption = "Aço Zincado com Costura"

    ComboBox3.Value = "0.15"

   

End If

End Sub

Private Sub CommandButton1_Click()

On Error GoTo erro

Dim Q, L, NR, e, Di, f, hf, RgHid, Tempa, Kelv, Lgu, Uc, u, Fct, mespa, QT, Dint As Double

Q = Val(TextBox5.Text)

L = Val(TextBox7.Text)

e = Val(ComboBox3.Text)

Di = Val(ComboBox1.Text)

Tempa = Val(TextBox10.Text)

'viscosidade cinemática da água na lateral

    

      Kelv = Tempa + 273.16

        Lgu = (-11.73) + (1828 / Kelv) + (0.01966 * Kelv) + (-0.00001466 * (Kelv ^ 2))

          u = Format((10 ^ Lgu) / 100, "0.00000")

        Uc = u * 1000

      Label14 = "Viscosidade dinâmica: " & Uc & " x 10-³ N.s/m²"

    

'massa específica e fator de correção da temperatura FCt na lateral

     

      Fct = ((Tempa - 3.983035) ^ 2) * (Tempa + 301.797) / (522528.9 * (Tempa + 69.34881))

        mespa = Format(1000 * (1 - Fct), "0.00")

      Label15 = "  Massa específica:  " & mespa & " kg/m³"

 

'Velocidade da água na tubulação:

 'Para vazão em m³/h e diâmetro em mm

    

 If OptionButton1.Value = True Then

  

    TextBox9.Text = Format((353.67765 * Q / Di ^ 2), "0.00")

    

   End If

    

'Para vazão em L/h e diâmetro em mm

 If OptionButton2.Value = True Then

 

   TextBox9.Text = Format((Q / (2.8274 * Di ^ 2)), "0.00")

   

 End If

 

 If TextBox9.Text > 2 Then

   MsgBox "Velocidade da água na Tubulação Adutora acima do limite permitido.", vbInformation, "ATENÇAO!"

     

End If

 

'Nº de Ryenolds

  

 TextBox1.Text = Format(mespa * TextBox9.Text * Di / Uc, "0")

   

'Rugosidade hidráulica

   

TextBox8.Text = Format((TextBox1.Text ^ 0.9) * e / Di, "0.00")

If TextBox1.Text < 2000 Then

   f = 64 / TextBox1.Text

    TextBox4.Text = Format(f, "0.0000")

     Label12 = "Hagen-Poiseuille"

      TextBox6.Text = Format(11.536 * 10 ^ 5 * u / mespa * Q * L / (Di ^ 4), "0.000")

     Label22 = "Fluxo Laminar"

      

Else

     Er = 0.001

       oldf = 1

   deltaf = oldf

   

Do While Abs(deltaf / oldf) >= Er

      Newf = 1 / (-2 * Log(e / (3.7 * Di) + 2.51 / (TextBox1.Text * Sqr(oldf))) * 0.434294482) ^ 2

          deltaf = Newf - oldf

     oldf = Newf

Loop

     f = oldf

     TextBox4.Text = Format(f, "0.0000")

     Label12 = "(Colebrook)"

     

'Decréscimo da carga de pressão para a vazão em m³/h

 If OptionButton1.Value = True Then

      

    TextBox6.Text = Format(6.376 * 10 ^ 6 * TextBox4.Text * (Q ^ 2) * L / (Di ^ 5), "0.00")

                            

 End If

 

'Decréscimo da carga de pressão para a vazão em L/h

 

 If OptionButton2.Value = True Then

    

    TextBox6.Text = Format(6.376 * TextBox4.Text * (Q ^ 2) * L / (Di ^ 5), "0.00")

        

 End If

               

 End If

     

 If (TextBox1.Text > 4000) And (TextBox8.Text) <= 31 Then

   

    Label22 = "Regime Turbulento"

   

    Label9 = "&  Tubo Hidraulicamente Liso"

       

 End If

 

 If (TextBox1.Text > 4000) And (TextBox8.Text) >= 448 Then

   

    Label22 = "Regime Turbulento"

   

    Label9 = "&  Tubo Hidraulicamente Rugoso"

       

 End If

              

 If (TextBox1.Text <= 4000) And (TextBox1.Text >= 2000) Then

 

     Label22 = "Região de Transição"

 End If

 

  If (TextBox1.Text > 4000) And (TextBox8.Text > 31) And (TextBox8.Text < 448) Then

   

    Label22 = "Regime Turbulento"

   

    Label9 = "&  Tubo Hidraulicamente Misto"

       

 End If

 

 Exit Sub

erro:

 MsgBox "ATENÇÃO", vbCritical, "Verifique se os dados estão corretos"

End Sub

Private Sub OptionButton1_Click()

If OptionButton1.Value = True Then

   TextBox5.SetFocus

   

End If

End Sub

Private Sub OptionButton2_Click()

If OptionButton2.Value = True Then

   TextBox5.SetFocus

   

End If

End Sub

Private Sub UserForm_Initialize()

'Diâmetro interno de tubos de PEBD e PVC

ComboBox1.AddItem "5.3"

ComboBox1.AddItem "13"

ComboBox1.AddItem "13.6"

ComboBox1.AddItem "16"

ComboBox1.AddItem "20.6"

ComboBox1.AddItem "26.9"

ComboBox1.AddItem "35.7"

ComboBox1.AddItem "48.1"

ComboBox1.AddItem "72.5"

ComboBox1.AddItem "97.6" 'acrescentar novos diâmetros

'Rugosidade absoluta de tubos de PEBD e PVC

ComboBox3.AddItem "0.0015"

ComboBox3.AddItem "0.003334"

ComboBox3.AddItem "0.15"

'Material dos tubos

ComboBox4.AddItem "PEBD"

ComboBox4.AddItem "PVC"

ComboBox4.AddItem "AZDº"

End Sub

"

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://pipairrigation.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f3516f4c-4cf4-427e-a778-18fe3d4aa9eb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
