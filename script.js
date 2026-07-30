const tela = document.getElementById('quadro');
const pincel = tela.getContext('2d');

const LIMITE_NOS = { min: 5, max: 100 };
let quantidadeNos = 30;
const conexoesPorNo = 3;

// peso de cada tipo de informação: quanto mais "viral" o formato,
// maior a chance de alguém receber e repassar
const perfisInformacao = {
    texto:  { receber: 0.25, compartilhar: 0.40 },
    imagem: { receber: 0.50, compartilhar: 0.55 },
    video:  { receber: 0.65, compartilhar: 0.65 },
};
let tipoInformacao = 'texto';
let chanceReceber = perfisInformacao[tipoInformacao].receber;
let chanceCompartilhar = perfisInformacao[tipoInformacao].compartilhar;
const frequenciaVerificacao = 5;

// % da rede com educação midiática — reduz a chance de compartilhar (não
// elimina; pesquisa mostra efeito grande mas probabilístico, não uma
// regra absoluta). Só entra na conta se o switch "Considerar educação
// midiática" estiver ligado — por padrão fica em 0, ou seja, sem efeito.
const FATOR_REDUCAO_EDUCADO = 0.2;
let percentualEducado = 0;

// o slider vai de 0 (mais rápido) a 100 (mais lento); mapeamos pro
// intervalo real de delay (ms) usado no setTimeout da animação
const VELOCIDADE_MS = { min: 20, max: 600 };
function mapVelocidade(valorSlider) {
    return Math.round(VELOCIDADE_MS.min + (valorSlider / 100) * (VELOCIDADE_MS.max - VELOCIDADE_MS.min));
}
let velocidade = mapVelocidade(parseInt(document.getElementById('velocidade').value));

let nos = [];
let conexoes = [];
let tempo = 0;
let rodando = false;
let caminhos = [];

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
    };
}

const quantidadeNosValueEl = document.getElementById('quantidadeNosValue');
function atualizarStepperNos() {
    quantidadeNosValueEl.textContent = quantidadeNos;
    document.querySelectorAll('#quantidadeNosStepper .stepper-btn').forEach(btn => {
        const passo = parseInt(btn.dataset.step);
        btn.disabled = (passo < 0 && quantidadeNos <= LIMITE_NOS.min) ||
                       (passo > 0 && quantidadeNos >= LIMITE_NOS.max);
    });
}
document.querySelectorAll('#quantidadeNosStepper .stepper-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const passo = parseInt(btn.dataset.step);
        quantidadeNos = Math.min(LIMITE_NOS.max, Math.max(LIMITE_NOS.min, quantidadeNos + passo));
        atualizarStepperNos();
        resetarSimulacao();
    });
});
atualizarStepperNos();

const botoesTipoInformacao = document.querySelectorAll('#tipoInformacaoGroup .btn-pill');
botoesTipoInformacao.forEach(btn => {
    btn.addEventListener('click', () => {
        botoesTipoInformacao.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        tipoInformacao = btn.dataset.tipo;
        chanceReceber = perfisInformacao[tipoInformacao].receber;
        chanceCompartilhar = perfisInformacao[tipoInformacao].compartilhar;
    });
});

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

const inputVelocidade = document.getElementById('velocidade');
function atualizarFillVelocidade() {
    inputVelocidade.style.setProperty('--fill', inputVelocidade.value + '%');
}
inputVelocidade.addEventListener('input', () => {
    velocidade = mapVelocidade(parseInt(inputVelocidade.value));
    atualizarFillVelocidade();
});
atualizarFillVelocidade();
ativarTooltipSlider(inputVelocidade, document.getElementById('velocidadeTooltip'));

const inputEducacao = document.getElementById('educacao');
const educacaoSliderWrap = document.getElementById('educacaoSliderWrap');
const considerarEducacao = document.getElementById('considerarEducacao');
inputEducacao.style.setProperty('--fill', inputEducacao.value + '%');
inputEducacao.addEventListener('input', () => {
    inputEducacao.style.setProperty('--fill', inputEducacao.value + '%');
});
inputEducacao.addEventListener('change', () => {
    percentualEducado = parseInt(inputEducacao.value);
    resetarSimulacao();
});
ativarTooltipSlider(inputEducacao, document.getElementById('educacaoTooltip'), '%');

considerarEducacao.addEventListener('change', () => {
    if (considerarEducacao.checked) {
        educacaoSliderWrap.style.display = '';
        percentualEducado = parseInt(inputEducacao.value);
    } else {
        educacaoSliderWrap.style.display = 'none';
        percentualEducado = 0;
    }
    resetarSimulacao();
});

class No {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.estado = 'nao_viu';
        this.vizinhos = [];
        this.tempoVerificacao = Math.floor(Math.random() * frequenciaVerificacao);
        this.educado = false;
    }

    desenhar(cores) {
        pincel.beginPath();
        pincel.arc(this.x, this.y, 8, 0, Math.PI * 2);
        pincel.fillStyle = cores[this.estado];
        pincel.fill();
        pincel.lineWidth = 1.5;
        pincel.strokeStyle = this.estado === 'consciente' ? cores.contornoParada : cores.contorno;
        pincel.stroke();
    }
}

function configurarRede() {
    nos = [];
    conexoes = [];
    caminhos = [];
    tela.width = tela.parentElement.clientWidth;
    const alturaCanvas = Math.min(quantidadeNos * 15, 500);
    tela.height = alturaCanvas;
    for (let i = 0; i < quantidadeNos; i++) {
        const padding = 20;
        nos.push(new No(
            Math.random() * (tela.width - 2 * padding) + padding,
            Math.random() * (tela.height - 2 * padding) + padding
        ));
    }
    for (let i = 0; i < quantidadeNos; i++) {
        while (nos[i].vizinhos.length < conexoesPorNo) {
            let j = Math.floor(Math.random() * quantidadeNos);
            if (j !== i && !nos[i].vizinhos.includes(j)) {
                nos[i].vizinhos.push(j);
                nos[j].vizinhos.push(i);
                conexoes.push([i, j]);
            }
        }
    }
    atribuirEducacao(nos, percentualEducado);
    nos[Math.floor(Math.random() * quantidadeNos)].estado = 'compartilhando';
    desenharRede();
}

// sorteia exatamente `percentual`% dos nós como "educados" (sem reposição,
// pra bater com o número exibido no slider em vez de uma média aproximada)
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

function desenharSeta(de, para, cores) {
    const origem = nos[de];
    const destino = nos[para];
    const angulo = Math.atan2(destino.y - origem.y, destino.x - origem.x);
    const raio = 8;
    const inicioX = origem.x + Math.cos(angulo) * raio;
    const inicioY = origem.y + Math.sin(angulo) * raio;
    const fimX = destino.x - Math.cos(angulo) * raio;
    const fimY = destino.y - Math.sin(angulo) * raio;

    pincel.strokeStyle = cores.compartilhando;
    pincel.lineWidth = 1.5;
    pincel.beginPath();
    pincel.moveTo(inicioX, inicioY);
    pincel.lineTo(fimX, fimY);
    pincel.stroke();

    const tamanhoCabeca = 6;
    pincel.beginPath();
    pincel.moveTo(fimX, fimY);
    pincel.lineTo(
        fimX - tamanhoCabeca * Math.cos(angulo - Math.PI / 6),
        fimY - tamanhoCabeca * Math.sin(angulo - Math.PI / 6)
    );
    pincel.lineTo(
        fimX - tamanhoCabeca * Math.cos(angulo + Math.PI / 6),
        fimY - tamanhoCabeca * Math.sin(angulo + Math.PI / 6)
    );
    pincel.closePath();
    pincel.fillStyle = cores.compartilhando;
    pincel.fill();
    pincel.lineWidth = 1;
}

function desenharRede() {
    const cores = coresEstado();
    pincel.clearRect(0, 0, tela.width, tela.height);
    conexoes.forEach(([i, j]) => {
        pincel.beginPath();
        pincel.moveTo(nos[i].x, nos[i].y);
        pincel.lineTo(nos[j].x, nos[j].y);
        pincel.strokeStyle = cores.conexao;
        pincel.lineWidth = 1;
        pincel.stroke();
    });
    caminhos.forEach(([i, j]) => desenharSeta(i, j, cores));
    nos.forEach(no => no.desenhar(cores));
}

function executarPasso() {
    if (!rodando) return;

    let paraCompartilhar = [];

    // cada nó "compartilhando" tenta repassar pros vizinhos uma única vez;
    // vira lime só se de fato conseguiu levar a informação a alguém novo
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
            // educação midiática reduz a chance de compartilhar, não zera
            const chance = no.educado ? chanceCompartilhar * FATOR_REDUCAO_EDUCADO : chanceCompartilhar;
            if (Math.random() < chance) paraCompartilhar.push(i);
        }
    });

    paraCompartilhar.forEach(i => { nos[i].estado = 'compartilhando'; });

    desenharRede();
    tempo++;

    const aindaEspalhando = nos.some(no => no.estado === 'compartilhando') ||
        nos.some(no => no.estado === 'recebido');

    if (aindaEspalhando) {
        setTimeout(() => requestAnimationFrame(executarPasso), velocidade);
    } else {
        rodando = false;
        mostrarResultado();
    }
}

function iniciarSimulacao() {
    if (!rodando) {
        rodando = true;
        executarPasso();
    }
}

function resetarSimulacao() {
    rodando = false;
    tempo = 0;
    configurarRede();
    document.getElementById('resultado').textContent = '';
}

function mostrarResultado() {
    const totalRecebeu = nos.filter(no => no.estado !== 'nao_viu').length;
    const totalCompartilhou = nos.filter(no => no.estado === 'espalhou').length;
    document.getElementById('resultado').textContent =
        `Alcance: ${totalRecebeu}/${quantidadeNos} pessoas, ${totalCompartilhou} compartilharam.`;
}

document.getElementById('btnIniciar').addEventListener('click', iniciarSimulacao);
document.getElementById('btnResetar').addEventListener('click', resetarSimulacao);

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
        if (nos.length) desenharRede();
    });
})();

// re-gera a rede quando a largura do container muda (ex: resize da janela)
let ultimaLargura = tela.parentElement.clientWidth;
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const larguraAtual = tela.parentElement.clientWidth;
        if (Math.abs(larguraAtual - ultimaLargura) > 20) {
            ultimaLargura = larguraAtual;
            resetarSimulacao();
        }
    }, 200);
});

configurarRede();
