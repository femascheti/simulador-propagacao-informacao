// ---------- cores do design system (lidas ao vivo — acompanham o tema) ----------
function corToken(nome) {
    return getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
}
function coresEstado() {
    return {
        nao_viu: corToken('--sky'),
        recebido: corToken('--pink'),
        compartilhando: corToken('--amber'),
        espalhou: corToken('--lime'),
        consciente: corToken('--paper-raised'),
        conexao: corToken('--line'),
        contorno: corToken('--paper'),
        contornoParada: corToken('--ink-soft'),
        destaque: corToken('--brand-blue'),
    };
}

const conexoesPorNoPadrao = 3;
// educação midiática reduz a chance de compartilhar, não zera (pesquisa
// mostra efeito grande mas probabilístico, não uma regra absoluta)
const FATOR_REDUCAO_EDUCADO = 0.2;
const LIMITE_NOS = { min: 5, max: 100 };
const VELOCIDADE_MS = { min: 20, max: 600 };
function mapVelocidade(valorSlider) {
    return Math.round(VELOCIDADE_MS.min + (valorSlider / 100) * (VELOCIDADE_MS.max - VELOCIDADE_MS.min));
}
const perfisInformacao = {
    texto:  { receber: 0.25, compartilhar: 0.40 },
    imagem: { receber: 0.50, compartilhar: 0.55 },
    video:  { receber: 0.65, compartilhar: 0.65 },
};

// mostra um tooltip com o valor atual enquanto o slider é arrastado
function ativarTooltipSlider(input, tooltip, sufixo = '') {
    function posicionar() {
        const min = parseFloat(input.min), max = parseFloat(input.max);
        const pct = (input.value - min) / (max - min);
        const raioThumb = 8;
        const x = input.offsetLeft + raioThumb + pct * (input.offsetWidth - raioThumb * 2);
        tooltip.style.left = x + 'px';
        tooltip.textContent = input.value + sufixo;
    }
    input.addEventListener('pointerdown', () => { posicionar(); tooltip.classList.add('visible'); });
    input.addEventListener('input', posicionar);
    input.addEventListener('pointerup', () => tooltip.classList.remove('visible'));
    input.addEventListener('blur', () => tooltip.classList.remove('visible'));
}

// sorteia exatamente `percentual`% dos nós como "educados" (sem reposição,
// pra bater com o número mostrado no slider em vez de uma média aproximada)
function atribuirEducacao(nos, percentual) {
    const quantidade = Math.round(nos.length * percentual / 100);
    const indices = nos.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const educados = new Set(indices.slice(0, quantidade));
    nos.forEach((no, i) => { no.educado = educados.has(i); });
}

// ---------- motor de rede reutilizável (níveis 1, 2 e 3) ----------
function criarMotorRede({ canvas, getQuantidade, getChances, getPercentualEducado = () => 0, alturaMax = 420 }) {
    const ctx = canvas.getContext('2d');
    let nos = [], conexoes = [], caminhos = [], rodando = false;

    class No {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.estado = 'nao_viu';
            this.vizinhos = [];
            this.educado = false;
        }
        desenhar(cores) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
            ctx.fillStyle = cores[this.estado];
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = this.estado === 'consciente' ? cores.contornoParada : cores.contorno;
            ctx.stroke();
        }
    }

    function configurar() {
        const quantidadeNos = getQuantidade();
        nos = []; conexoes = []; caminhos = [];
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = Math.min(quantidadeNos * 15, alturaMax);
        for (let i = 0; i < quantidadeNos; i++) {
            const padding = 20;
            nos.push(new No(
                Math.random() * (canvas.width - 2 * padding) + padding,
                Math.random() * (canvas.height - 2 * padding) + padding
            ));
        }
        for (let i = 0; i < quantidadeNos; i++) {
            while (nos[i].vizinhos.length < conexoesPorNoPadrao) {
                let j = Math.floor(Math.random() * quantidadeNos);
                if (j !== i && !nos[i].vizinhos.includes(j)) {
                    nos[i].vizinhos.push(j);
                    nos[j].vizinhos.push(i);
                    conexoes.push([i, j]);
                }
            }
        }
        atribuirEducacao(nos, getPercentualEducado());
        nos[Math.floor(Math.random() * quantidadeNos)].estado = 'compartilhando';
        desenhar();
    }

    function desenharSeta(de, para, cores) {
        const origem = nos[de], destino = nos[para];
        const angulo = Math.atan2(destino.y - origem.y, destino.x - origem.x);
        const raio = 8;
        const inicioX = origem.x + Math.cos(angulo) * raio;
        const inicioY = origem.y + Math.sin(angulo) * raio;
        const fimX = destino.x - Math.cos(angulo) * raio;
        const fimY = destino.y - Math.sin(angulo) * raio;
        ctx.strokeStyle = cores.compartilhando;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(inicioX, inicioY);
        ctx.lineTo(fimX, fimY);
        ctx.stroke();
        const tamanhoCabeca = 6;
        ctx.beginPath();
        ctx.moveTo(fimX, fimY);
        ctx.lineTo(fimX - tamanhoCabeca * Math.cos(angulo - Math.PI / 6), fimY - tamanhoCabeca * Math.sin(angulo - Math.PI / 6));
        ctx.lineTo(fimX - tamanhoCabeca * Math.cos(angulo + Math.PI / 6), fimY - tamanhoCabeca * Math.sin(angulo + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = cores.compartilhando;
        ctx.fill();
    }

    function desenhar() {
        const cores = coresEstado();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        conexoes.forEach(([i, j]) => {
            ctx.beginPath();
            ctx.moveTo(nos[i].x, nos[i].y);
            ctx.lineTo(nos[j].x, nos[j].y);
            ctx.strokeStyle = cores.conexao;
            ctx.lineWidth = 1;
            ctx.stroke();
        });
        caminhos.forEach(([i, j]) => desenharSeta(i, j, cores));
        nos.forEach(no => no.desenhar(cores));
    }

    function passo() {
        const perfil = getChances();
        const chanceReceber = perfil.receber;
        const chanceCompartilhar = perfil.compartilhar;
        let paraCompartilhar = [];

        // cada nó "compartilhando" tenta repassar pros vizinhos uma única
        // vez; vira lime só se de fato conseguiu levar a informação a alguém
        nos.forEach((no, i) => {
            if (no.estado === 'compartilhando') {
                let conseguiu = false;
                no.vizinhos.forEach(j => {
                    if (nos[j].estado === 'nao_viu' && Math.random() < chanceReceber) {
                        nos[j].estado = 'recebido';
                        caminhos.push([i, j]);
                        conseguiu = true;
                    }
                });
                no.estado = conseguiu ? 'espalhou' : 'consciente';
            }
        });

        nos.forEach((no, i) => {
            if (no.estado === 'recebido') {
                const chance = no.educado ? chanceCompartilhar * FATOR_REDUCAO_EDUCADO : chanceCompartilhar;
                if (Math.random() < chance) paraCompartilhar.push(i);
            }
        });

        paraCompartilhar.forEach(i => { nos[i].estado = 'compartilhando'; });

        desenhar();

        return nos.some(no => no.estado === 'compartilhando') ||
            nos.some(no => no.estado === 'recebido');
    }

    function iniciarLoop(getVelocidadeMs, aoTerminar) {
        rodando = true;
        function tick() {
            if (!rodando) return;
            const continua = passo();
            if (continua) {
                setTimeout(() => { if (rodando) requestAnimationFrame(tick); }, getVelocidadeMs());
            } else {
                rodando = false;
                aoTerminar();
            }
        }
        tick();
    }
    function pararLoop() { rodando = false; }
    function resetar() { rodando = false; configurar(); }
    function resultado() {
        return {
            totalRecebeu: nos.filter(no => no.estado !== 'nao_viu').length,
            totalCompartilhou: nos.filter(no => no.estado === 'espalhou').length,
            total: nos.length,
        };
    }

    return { configurar, passo, iniciarLoop, pararLoop, resetar, resultado, estaRodando: () => rodando };
}

// ============================================================
// NÍVEL 0 — conceito, clique manual nó-a-nó
// ============================================================
function inicializarNivel0() {
    const canvas = document.getElementById('quadroNivel0');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 320;

    // "armado" é só uma seleção visual (anel + preenchimento laranja) —
    // não é mais um estado persistente do nó, pra deixar claro que
    // compartilhar é sempre uma decisão explícita (repassar/não repassar)
    let nos, conexoes, caminhos, armado, emDecisao;

    function layoutInicial() {
        const cx = canvas.width / 2, cy = canvas.height / 2;
        const raio = Math.min(canvas.width, canvas.height) / 2 - 50;
        nos = [
            { x: cx, y: cy, estado: 'recebido' },
            { x: cx, y: cy - raio, estado: 'nao_viu' },
            { x: cx + raio, y: cy + raio * 0.4, estado: 'nao_viu' },
            { x: cx, y: cy + raio, estado: 'nao_viu' },
            { x: cx - raio, y: cy + raio * 0.4, estado: 'nao_viu' },
        ];
        conexoes = [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [2, 3], [3, 4]];
        caminhos = [];
        armado = 0;
        emDecisao = null;
    }
    layoutInicial();

    function conectados(a, b) {
        return conexoes.some(([i, j]) => (i === a && j === b) || (i === b && j === a));
    }

    function desenharSetaN0(de, para, cores) {
        const origem = nos[de], destino = nos[para];
        const angulo = Math.atan2(destino.y - origem.y, destino.x - origem.x);
        const raioNo = 11;
        const inicioX = origem.x + Math.cos(angulo) * raioNo;
        const inicioY = origem.y + Math.sin(angulo) * raioNo;
        const fimX = destino.x - Math.cos(angulo) * raioNo;
        const fimY = destino.y - Math.sin(angulo) * raioNo;
        ctx.strokeStyle = cores.compartilhando;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(inicioX, inicioY);
        ctx.lineTo(fimX, fimY);
        ctx.stroke();
        const tam = 7;
        ctx.beginPath();
        ctx.moveTo(fimX, fimY);
        ctx.lineTo(fimX - tam * Math.cos(angulo - Math.PI / 6), fimY - tam * Math.sin(angulo - Math.PI / 6));
        ctx.lineTo(fimX - tam * Math.cos(angulo + Math.PI / 6), fimY - tam * Math.sin(angulo + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = cores.compartilhando;
        ctx.fill();
    }

    function desenhar() {
        const cores = coresEstado();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        conexoes.forEach(([i, j]) => {
            ctx.beginPath();
            ctx.moveTo(nos[i].x, nos[i].y);
            ctx.lineTo(nos[j].x, nos[j].y);
            ctx.strokeStyle = cores.conexao;
            ctx.lineWidth = 1;
            ctx.stroke();
        });
        caminhos.forEach(([i, j]) => desenharSetaN0(i, j, cores));
        nos.forEach((no, i) => {
            ctx.beginPath();
            ctx.arc(no.x, no.y, 11, 0, Math.PI * 2);
            ctx.fillStyle = i === armado ? cores.compartilhando : cores[no.estado];
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = no.estado === 'consciente' ? cores.contornoParada : cores.contorno;
            ctx.stroke();
            if (i === armado) {
                ctx.beginPath();
                ctx.arc(no.x, no.y, 16, 0, Math.PI * 2);
                ctx.lineWidth = 2;
                ctx.strokeStyle = cores.destaque;
                ctx.stroke();
            }
        });
    }

    const instrucaoEl = document.getElementById('instrucaoNivel0');
    const btnRepassar = document.getElementById('btnRepassarNivel0');
    const btnNaoRepassar = document.getElementById('btnNaoRepassarNivel0');

    function atualizarInstrucao() {
        if (emDecisao !== null) {
            instrucaoEl.textContent = 'Esse nó recebeu a informação. Ele vai repassar? Escolha uma opção abaixo.';
        } else if (armado !== null) {
            instrucaoEl.textContent = 'Clique num vizinho conectado por um traço pra repassar a informação pra ele.';
        } else {
            instrucaoEl.textContent = 'Clique num nó rosa ou lime pra escolher o que ele faz com a informação.';
        }
        btnRepassar.disabled = emDecisao === null;
        btnNaoRepassar.disabled = emDecisao === null;
    }
    atualizarInstrucao();

    function encontrarNo(mx, my) {
        return nos.findIndex(no => Math.hypot(no.x - mx, no.y - my) <= 16);
    }

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const escalaX = canvas.width / rect.width;
        const escalaY = canvas.height / rect.height;
        const mx = (e.clientX - rect.left) * escalaX;
        const my = (e.clientY - rect.top) * escalaY;
        const i = encontrarNo(mx, my);
        if (i === -1) { emDecisao = null; atualizarInstrucao(); desenhar(); return; }

        const no = nos[i];
        emDecisao = null; // qualquer clique cancela uma decisão pendente anterior

        if (no.estado === 'nao_viu') {
            if (armado !== null && conectados(armado, i)) {
                no.estado = 'recebido';
                caminhos.push([armado, i]);
                if (nos[armado].estado === 'recebido') nos[armado].estado = 'espalhou';
            }
        } else if (no.estado === 'recebido') {
            if (armado === i) {
                armado = null;
            } else {
                emDecisao = i;
            }
        } else if (no.estado === 'espalhou') {
            armado = (armado === i) ? null : i;
        }
        // 'consciente' (recebeu e não repassou) é terminal — clique não faz nada

        atualizarInstrucao();
        desenhar();
    });

    btnRepassar.addEventListener('click', () => {
        if (emDecisao === null) return;
        armado = emDecisao;
        emDecisao = null;
        atualizarInstrucao();
        desenhar();
    });

    btnNaoRepassar.addEventListener('click', () => {
        if (emDecisao === null) return;
        nos[emDecisao].estado = 'consciente';
        if (armado === emDecisao) armado = null;
        emDecisao = null;
        atualizarInstrucao();
        desenhar();
    });

    document.getElementById('btnReiniciarNivel0').addEventListener('click', () => {
        layoutInicial();
        atualizarInstrucao();
        desenhar();
    });

    desenhar();
}

// ============================================================
// NÍVEL 1 — rede pequena, passo a passo
// ============================================================
let motorNivel1;
function inicializarNivel1() {
    motorNivel1 = criarMotorRede({
        canvas: document.getElementById('quadroNivel1'),
        getQuantidade: () => 12,
        getChances: () => ({ receber: 0.35, compartilhar: 0.5 }),
        alturaMax: 360,
    });
    motorNivel1.configurar();

    const btnPasso = document.getElementById('btnPassoNivel1');
    const resultadoEl = document.getElementById('resultadoNivel1');

    btnPasso.addEventListener('click', () => {
        const continua = motorNivel1.passo();
        if (!continua) {
            const r = motorNivel1.resultado();
            resultadoEl.textContent = `Alcance: ${r.totalRecebeu}/${r.total} pessoas, ${r.totalCompartilhou} compartilharam.`;
            btnPasso.disabled = true;
        }
    });
    document.getElementById('btnReiniciarNivel1').addEventListener('click', () => {
        motorNivel1.resetar();
        resultadoEl.textContent = '';
        btnPasso.disabled = false;
    });
}

// ============================================================
// NÍVEL 2 — rede completa, automática (sem escolha de tipo)
// ============================================================
let motorNivel2, quantidadeNosNivel2 = 20, percentualEducadoNivel2 = 0;
function inicializarNivel2() {
    motorNivel2 = criarMotorRede({
        canvas: document.getElementById('quadroNivel2'),
        getQuantidade: () => quantidadeNosNivel2,
        getChances: () => perfisInformacao.texto,
        getPercentualEducado: () => percentualEducadoNivel2,
        alturaMax: 420,
    });
    motorNivel2.configurar();

    const inputEducacao2 = document.getElementById('educacaoNivel2');
    inputEducacao2.style.setProperty('--fill', inputEducacao2.value + '%');
    inputEducacao2.addEventListener('input', () => {
        inputEducacao2.style.setProperty('--fill', inputEducacao2.value + '%');
    });
    inputEducacao2.addEventListener('change', () => {
        percentualEducadoNivel2 = parseInt(inputEducacao2.value);
        motorNivel2.resetar();
        resultadoEl.textContent = '';
    });
    ativarTooltipSlider(inputEducacao2, document.getElementById('educacaoNivel2Tooltip'), '%');

    const educacaoNivel2SliderWrap = document.getElementById('educacaoNivel2SliderWrap');
    document.getElementById('considerarEducacaoNivel2').addEventListener('change', (e) => {
        if (e.target.checked) {
            educacaoNivel2SliderWrap.style.display = '';
            percentualEducadoNivel2 = parseInt(inputEducacao2.value);
        } else {
            educacaoNivel2SliderWrap.style.display = 'none';
            percentualEducadoNivel2 = 0;
        }
        motorNivel2.resetar();
        resultadoEl.textContent = '';
    });

    const valorEl = document.getElementById('quantidadeNosNivel2Value');
    function atualizarStepper() {
        valorEl.textContent = quantidadeNosNivel2;
        document.querySelectorAll('#quantidadeNosNivel2Stepper .stepper-btn').forEach(btn => {
            const passo = parseInt(btn.dataset.step);
            btn.disabled = (passo < 0 && quantidadeNosNivel2 <= LIMITE_NOS.min) ||
                           (passo > 0 && quantidadeNosNivel2 >= LIMITE_NOS.max);
        });
    }
    document.querySelectorAll('#quantidadeNosNivel2Stepper .stepper-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const passo = parseInt(btn.dataset.step);
            quantidadeNosNivel2 = Math.min(LIMITE_NOS.max, Math.max(LIMITE_NOS.min, quantidadeNosNivel2 + passo));
            atualizarStepper();
            motorNivel2.resetar();
            resultadoEl.textContent = '';
        });
    });
    atualizarStepper();

    const inputVelocidade = document.getElementById('velocidadeNivel2');
    let velocidadeNivel2 = mapVelocidade(parseInt(inputVelocidade.value));
    inputVelocidade.style.setProperty('--fill', inputVelocidade.value + '%');
    inputVelocidade.addEventListener('input', () => {
        velocidadeNivel2 = mapVelocidade(parseInt(inputVelocidade.value));
        inputVelocidade.style.setProperty('--fill', inputVelocidade.value + '%');
    });
    ativarTooltipSlider(inputVelocidade, document.getElementById('velocidadeNivel2Tooltip'));

    const resultadoEl = document.getElementById('resultadoNivel2');
    document.getElementById('btnIniciarNivel2').addEventListener('click', () => {
        if (motorNivel2.estaRodando()) return;
        resultadoEl.textContent = '';
        motorNivel2.iniciarLoop(() => velocidadeNivel2, () => {
            const r = motorNivel2.resultado();
            resultadoEl.textContent = `Alcance: ${r.totalRecebeu}/${r.total} pessoas, ${r.totalCompartilhou} compartilharam.`;
        });
    });
    document.getElementById('btnResetarNivel2').addEventListener('click', () => {
        motorNivel2.resetar();
        resultadoEl.textContent = '';
    });
}

// ============================================================
// NÍVEL 3 — tipos de informação
// ============================================================
let motorNivel3, quantidadeNosNivel3 = 20, tipoInformacaoNivel3 = 'texto', percentualEducadoNivel3 = 0;
function inicializarNivel3() {
    motorNivel3 = criarMotorRede({
        canvas: document.getElementById('quadroNivel3'),
        getQuantidade: () => quantidadeNosNivel3,
        getChances: () => perfisInformacao[tipoInformacaoNivel3],
        getPercentualEducado: () => percentualEducadoNivel3,
        alturaMax: 420,
    });
    motorNivel3.configurar();

    const inputEducacao3 = document.getElementById('educacaoNivel3');
    inputEducacao3.style.setProperty('--fill', inputEducacao3.value + '%');
    inputEducacao3.addEventListener('input', () => {
        inputEducacao3.style.setProperty('--fill', inputEducacao3.value + '%');
    });
    inputEducacao3.addEventListener('change', () => {
        percentualEducadoNivel3 = parseInt(inputEducacao3.value);
        motorNivel3.resetar();
        resultadoEl.textContent = '';
    });
    ativarTooltipSlider(inputEducacao3, document.getElementById('educacaoNivel3Tooltip'), '%');

    const educacaoNivel3SliderWrap = document.getElementById('educacaoNivel3SliderWrap');
    document.getElementById('considerarEducacaoNivel3').addEventListener('change', (e) => {
        if (e.target.checked) {
            educacaoNivel3SliderWrap.style.display = '';
            percentualEducadoNivel3 = parseInt(inputEducacao3.value);
        } else {
            educacaoNivel3SliderWrap.style.display = 'none';
            percentualEducadoNivel3 = 0;
        }
        motorNivel3.resetar();
        resultadoEl.textContent = '';
    });

    const resultadoEl = document.getElementById('resultadoNivel3');

    const botoesTipo = document.querySelectorAll('#tipoInformacaoNivel3Group .btn-pill');
    botoesTipo.forEach(btn => {
        btn.addEventListener('click', () => {
            botoesTipo.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tipoInformacaoNivel3 = btn.dataset.tipo;
        });
    });

    const valorEl = document.getElementById('quantidadeNosNivel3Value');
    function atualizarStepper() {
        valorEl.textContent = quantidadeNosNivel3;
        document.querySelectorAll('#quantidadeNosNivel3Stepper .stepper-btn').forEach(btn => {
            const passo = parseInt(btn.dataset.step);
            btn.disabled = (passo < 0 && quantidadeNosNivel3 <= LIMITE_NOS.min) ||
                           (passo > 0 && quantidadeNosNivel3 >= LIMITE_NOS.max);
        });
    }
    document.querySelectorAll('#quantidadeNosNivel3Stepper .stepper-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const passo = parseInt(btn.dataset.step);
            quantidadeNosNivel3 = Math.min(LIMITE_NOS.max, Math.max(LIMITE_NOS.min, quantidadeNosNivel3 + passo));
            atualizarStepper();
            motorNivel3.resetar();
            resultadoEl.textContent = '';
        });
    });
    atualizarStepper();

    const inputVelocidade = document.getElementById('velocidadeNivel3');
    let velocidadeNivel3 = mapVelocidade(parseInt(inputVelocidade.value));
    inputVelocidade.style.setProperty('--fill', inputVelocidade.value + '%');
    inputVelocidade.addEventListener('input', () => {
        velocidadeNivel3 = mapVelocidade(parseInt(inputVelocidade.value));
        inputVelocidade.style.setProperty('--fill', inputVelocidade.value + '%');
    });
    ativarTooltipSlider(inputVelocidade, document.getElementById('velocidadeNivel3Tooltip'));

    document.getElementById('btnIniciarNivel3').addEventListener('click', () => {
        if (motorNivel3.estaRodando()) return;
        resultadoEl.textContent = '';
        motorNivel3.iniciarLoop(() => velocidadeNivel3, () => {
            const r = motorNivel3.resultado();
            resultadoEl.textContent = `Alcance: ${r.totalRecebeu}/${r.total} pessoas, ${r.totalCompartilhou} compartilharam.`;
        });
    });
    document.getElementById('btnResetarNivel3').addEventListener('click', () => {
        motorNivel3.resetar();
        resultadoEl.textContent = '';
    });
}

// ============================================================
// navegação entre níveis
// ============================================================
const niveis = [0, 1, 2, 3];
let nivelAtual = 0;
const inicializado = {};
const inicializadores = { 0: inicializarNivel0, 1: inicializarNivel1, 2: inicializarNivel2, 3: inicializarNivel3 };

const dotsWrap = document.getElementById('tutorialDots');
niveis.forEach(() => {
    const dot = document.createElement('span');
    dot.className = 'carousel-dot';
    dot.style.cursor = 'default';
    dotsWrap.appendChild(dot);
});

function atualizarProgresso() {
    document.getElementById('nivelLabel').textContent = `Nível ${nivelAtual + 1} de ${niveis.length}`;
    document.querySelectorAll('#tutorialDots .carousel-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === nivelAtual);
    });
    document.getElementById('btnVoltarNivel').disabled = nivelAtual === 0;
    document.getElementById('btnProximoNivel').textContent =
        nivelAtual === niveis.length - 1 ? 'Ir pra simulação completa →' : 'Próximo nível →';
}

function mostrarNivel(n) {
    document.querySelectorAll('.nivel-painel').forEach(painel => {
        painel.classList.toggle('active', parseInt(painel.dataset.nivel) === n);
    });
    if (motorNivel2 && n !== 2) motorNivel2.pararLoop();
    if (motorNivel3 && n !== 3) motorNivel3.pararLoop();
    nivelAtual = n;
    atualizarProgresso();
    if (!inicializado[n]) {
        inicializado[n] = true;
        inicializadores[n]();
    }
}

document.getElementById('btnProximoNivel').addEventListener('click', () => {
    if (nivelAtual === niveis.length - 1) {
        window.location.href = 'simulacao.html';
    } else {
        mostrarNivel(nivelAtual + 1);
    }
});
document.getElementById('btnVoltarNivel').addEventListener('click', () => {
    if (nivelAtual > 0) mostrarNivel(nivelAtual - 1);
});

// ---------- tema (claro / escuro / sistema) ----------
(function () {
    const toggle = document.getElementById('themeToggle');
    const label = document.getElementById('themeLabel');
    const root = document.documentElement;
    const states = ['system', 'light', 'dark'];
    let stateIndex = 0;
    toggle.addEventListener('click', () => {
        stateIndex = (stateIndex + 1) % states.length;
        const s = states[stateIndex];
        if (s === 'system') { root.removeAttribute('data-theme'); label.textContent = 'tema: sistema'; }
        else { root.setAttribute('data-theme', s); label.textContent = 'tema: ' + (s === 'light' ? 'claro' : 'escuro'); }
    });
})();

// re-gera a rede do nível ativo quando a janela muda de largura
let ultimaLargura = window.innerWidth;
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const larguraAtual = window.innerWidth;
        if (Math.abs(larguraAtual - ultimaLargura) > 20) {
            ultimaLargura = larguraAtual;
            if (nivelAtual === 1 && motorNivel1) motorNivel1.resetar();
            if (nivelAtual === 2 && motorNivel2) motorNivel2.resetar();
            if (nivelAtual === 3 && motorNivel3) motorNivel3.resetar();
        }
    }, 200);
});

// inicia no nível 0
mostrarNivel(0);
