
const tela = document.getElementById('quadro');
const pincel = tela.getContext('2d');

let quantidadeNos = parseInt(document.getElementById('quantidadeNos').value);
const conexoesPorNo = 3;
let chanceReceber = 0.3;
let chanceCompartilhar = 0.5;
const frequenciaVerificacao = 5;
const chanceDuvidar = 0.5;
const chanceAprender = 0.4;
let velocidade = parseInt(document.getElementById('velocidade').value);

let nos = [];
let conexoes = [];
let tempo = 0;
let rodando = false;

document.getElementById('quantidadeNos').addEventListener('change', () => {
    quantidadeNos = parseInt(document.getElementById('quantidadeNos').value);
    resetarSimulacao();
});

document.getElementById('tipoInformacao').addEventListener('change', () => {
    const tipo = document.getElementById('tipoInformacao').value;
    if (tipo === 'viral') {
        chanceReceber = 0.6;
        chanceCompartilhar = 0.6;
    } else {
        chanceReceber = 0.3;
        chanceCompartilhar = 0.5;
    }
});

document.getElementById('velocidade').addEventListener('input', () => {
    velocidade = parseInt(document.getElementById('velocidade').value);
});

class No {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.estado = 'nao_viu';
        this.vizinhos = [];
        this.tempoVerificacao = Math.floor(Math.random() * frequenciaVerificacao);
        this.jaCompartilhou = false;
    }

    desenhar() {
        pincel.beginPath();
        pincel.arc(this.x, this.y, 10, 0, Math.PI * 2);
        let cor = 'blue';
        if (this.estado === 'recebido') cor = 'red';
        else if (this.estado === 'compartilhando') cor = 'orange';
        else if (this.estado === 'consciente') cor = 'purple';
        pincel.fillStyle = cor;
        pincel.fill();
        pincel.stroke();
    }
}

function configurarRede() {
    nos = [];
    conexoes = [];
    const alturaCanvas = Math.min(quantidadeNos * 15, 700);
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
    nos[Math.floor(Math.random() * quantidadeNos)].estado = 'compartilhando';
    desenharRede();
}

function desenharRede() {
    pincel.clearRect(0, 0, tela.width, tela.height);
    conexoes.forEach(([i, j]) => {
        pincel.beginPath();
        pincel.moveTo(nos[i].x, nos[i].y);
        pincel.lineTo(nos[j].x, nos[j].y);
        pincel.strokeStyle = '#ccc';
        pincel.stroke();
    });
    nos.forEach(no => no.desenhar());
}

function executarPasso() {
    if (!rodando) return;

    let paraCompartilhar = [];
    let paraAprender = [];

    nos.forEach((no, i) => {
        if (no.estado === 'compartilhando') {
            let compartilhou = false;
            no.vizinhos.forEach(j => {
                if (nos[j].estado === 'nao_viu' && Math.random() < chanceReceber) {
                    nos[j].estado = 'recebido';
                    compartilhou = true;
                }
            });

            if (Math.random() < chanceDuvidar) {
                if (Math.random() < chanceAprender) {
                    paraAprender.push(i);
                } else {
                    no.estado = 'recebido';
                }
            } else {
                no.estado = 'recebido';
            }
        }
    });

    nos.forEach((no, i) => {
        if (no.estado === 'recebido' && !no.jaCompartilhou && Math.random() < chanceCompartilhar) {
            paraCompartilhar.push(i);
        }
    });

    paraCompartilhar.forEach(i => {
        nos[i].estado = 'compartilhando';
        nos[i].jaCompartilhou = true;
    });
    paraAprender.forEach(i => nos[i].estado = 'consciente');

    desenharRede();
    tempo++;

    const aindaEspalhando = nos.some(no => no.estado === 'compartilhando') ||
        nos.some(no => no.estado === 'recebido' && !no.jaCompartilhou);

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
    const totalCompartilhou = nos.filter(no => no.jaCompartilhou).length;
    document.getElementById('resultado').textContent =
        `Alcance: ${totalRecebeu}/${quantidadeNos} pessoas, ${totalCompartilhou} compartilharam.`;
}

configurarRede();