# 💬 Simulação: Propagação de Informação

**Versão 2.0**

Este projeto é uma simulação visual interativa que mostra como uma informação pode se espalhar por uma rede de pessoas conectadas. Foi desenvolvido com fins educacionais, com foco em Computação, Pensamento Computacional e Cidadania Digital.

Cada ponto representa uma pessoa, e diferentes cores indicam o estado dessa pessoa em relação à informação (se viu, repassou, ou recebeu e não repassou). A simulação permite configurar o tipo de informação, o número de pessoas, a velocidade da propagação e, opcionalmente, o efeito da educação midiática na rede.

---

## 🆕 O que mudou na v2.0

- **Três páginas em vez de uma**: uma tela de entrada, um tutorial guiado em níveis, e a simulação completa (veja [Estrutura do projeto](#-estrutura-do-projeto)).
- **Identidade visual própria**, compartilhada com o [design system de Fernanda Mascheti](https://github.com/femascheti) — tipografia, cores e componentes (botões, sliders, stepper, tooltip etc.) em vez do CSS solto original.
- **Modelo de propagação revisado**: sem sorteios invisíveis no meio da simulação — cada nó só chega a um estado final (repassou / não repassou) através de regras explícitas e visíveis.
- **Educação midiática como parâmetro opcional**, com efeito baseado em pesquisa real (não elimina o compartilhamento, reduz a chance — veja [Referência científica](#-referência-científica)).
- **Tema claro/escuro/sistema**, canvas responsivo, e navegação por teclado em todos os controles.

---

## 🧠 Objetivos Educacionais

- Compreender como informações (verdadeiras ou falsas) se espalham em redes sociais.
- Explorar conceitos de redes, estados e propagação.
- Refletir sobre o papel do indivíduo na verificação e disseminação de conteúdo.
- Visualizar o impacto de diferentes tipos de informação (texto, imagem, vídeo curto) e do letramento midiático da rede.

---

## 🗂️ Estrutura do projeto

| Página | O que é |
|---|---|
| `index.html` | Tela de entrada — escolha entre o Tutorial guiado ou ir direto pra Simulação completa. |
| `tutorial.html` | Tutorial em 4 níveis, navegação sequencial: **Nível 1** (conceito básico, clique manual nó-a-nó, você decide se cada pessoa repassa ou não), **Nível 2** (rede pequena, avança passo a passo), **Nível 3** (rede completa rodando sozinha), **Nível 4** (adiciona o peso do tipo de informação). |
| `simulacao.html` | A simulação completa, com todos os controles: número de pessoas, tipo de informação, velocidade, e educação midiática (opcional). |

CSS/JS compartilhados: `global.css` + `components.css` (design system), `style.css`/`landing.css`/`tutorial.css` (layout específico de cada página), `script.js` (motor da `simulacao.html`), `tutorial.js` (motor reutilizável dos níveis 2-4 + interação manual do nível 1).

---

## 🛠️ Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript (vanilla, sem frameworks nem build step)

---

## ▶️ Como usar

1. Clone este repositório ou baixe os arquivos.
2. Abra `index.html` em um navegador (Chrome, Edge ou Firefox).
3. Escolha **Tutorial** (recomendado na primeira vez) ou **Simulação**.
4. Na simulação completa, ajuste os parâmetros:
   - **Número de pessoas na rede**: 5 a 100 (botões +/−).
   - **Tipo de informação**: texto, imagem ou vídeo curto — cada um com peso diferente de propagação.
   - **Velocidade da animação**: controle deslizante (← mais rápido | mais lento →).
   - **Educação midiática** *(opcional — ligue o switch pra ativar)*: % da rede com letramento midiático suficiente pra reduzir bastante a chance de repassar uma informação.
5. Clique em `Iniciar` para rodar a simulação, `Resetar` pra gerar uma rede nova.

---

## 🎨 Legenda da Simulação

| Cor | Estado | O que significa |
|---|---|---|
| 🔵 Sky | não viu | Ainda não foi alcançado pela informação. |
| 🩷 Pink | recebeu | Viu a informação, ainda não decidiu o que fazer. |
| 🟠 Amber | compartilhando | Está no instante de tentar repassar pros vizinhos. |
| 🟢 Lime | repassou | Conseguiu levar a informação a pelo menos mais uma pessoa. |
| ⚪ Paper (contorno cinza) | não repassou | Recebeu a informação, mas não repassou — seja porque não tinha mais ninguém por perto pra avisar, seja (se a educação midiática estiver ativada) por ter mais letramento midiático. |

Uma seta laranja indica o caminho real que a informação percorreu (quem contou pra quem).

---

## 🔬 Referência científica

O parâmetro "Educação midiática" é inspirado em pesquisa real, mas simplificado — a simulação **não afirma** que uma pessoa com letramento midiático nunca compartilha desinformação, apenas reduz a probabilidade disso acontecer (fator de redução de 80% na chance de repassar), o que está mais alinhado com achados como:

- Huang, G., Jia, W., & Yu, W. (2024). [*Media Literacy Interventions Improve Resilience to Misinformation: A Meta-Analytic Investigation of Overall Effect and Moderating Factors*](https://journals.sagepub.com/doi/10.1177/00936502241288103). Meta-análise de 49 estudos experimentais (81.155 participantes) — intervenções de educação midiática **reduzem** o compartilhamento de desinformação (d = 1.04) e melhoram a discriminação entre conteúdo verdadeiro e falso (d = 0.76), mas não eliminam o comportamento de compartilhar.

Por ser uma simplificação pedagógica (e não um modelo epidemiológico validado), o parâmetro vem **desligado por padrão** — é preciso ativar o switch "Considerar educação midiática" pra ele entrar na conta.

---

## 📚 Possíveis usos pedagógicos

- Aulas sobre redes, algoritmos e simulações.
- Discussões sobre desinformação, fake news e comportamento em mídias digitais.
- Demonstração inicial em sala usando o **Nível 1** do tutorial (rede pequena, clique manual) antes de soltar a turma na simulação completa.
- Atividades de programação e modelagem computacional.
- Debate sobre os limites de "confiar na educação midiática" pra resolver desinformação sozinha, usando a referência científica acima como ponto de partida.

---

## ⚠️ Aviso

Este recurso é destinado exclusivamente a fins didáticos. Não utiliza nem coleta dados reais de pessoas ou redes sociais — trata-se apenas de uma simulação para fins de aprendizado.
