let BOARD_ROWS = 8, BOARD_COLS = 8, board = [], currentMove = 0, currentPos = null, moveHistory = [];
const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];

const chessboardDiv = document.getElementById('chessboard');
const boardRowsInput = document.getElementById('board-rows');
const boardColsInput = document.getElementById('board-cols');
const messageElement = document.getElementById('message');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const flashOverlay = document.getElementById('flash-overlay');
const canvas = document.getElementById('path-canvas');
const ctx = canvas.getContext('2d');
const pathToggle = document.getElementById('path-toggle');
const activeKnight = document.getElementById('active-knight');

let animationStart = 0;
const ANIMATION_DURATION = 400; 
const BOARD_BORDER = 2.5; 
let isClosedTour = false; 
let rainbowHue = 0; 

function initializeBoard() {
    const r = parseInt(boardRowsInput.value, 10), c = parseInt(boardColsInput.value, 10);
    if (r < 3 || r > 12 || c < 3 || c > 12) { alert("3〜12で設定してください"); return; }
    
    flashOverlay.classList.remove('flash-fail', 'flash-success', 'flash-closed');
    flashOverlay.className = 'screen-flash';
    
    BOARD_ROWS = r; BOARD_COLS = c; currentMove = 0; currentPos = null; moveHistory = [];
    board = Array(BOARD_ROWS).fill(0).map(() => Array(BOARD_COLS).fill(0));
    isClosedTour = false;
    
    chessboardDiv.style.gridTemplateColumns = `repeat(${BOARD_COLS}, 1fr)`;
    activeKnight.style.display = 'none';
    
    createBoard();
    updateProgress();
    
    const rect = chessboardDiv.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    setTimeout(resizeCanvas, 100);
    messageElement.textContent = "SYSTEM READY.";
}

function createBoard() {
    chessboardDiv.innerHTML = '';
    for (let r = 0; r < BOARD_ROWS; r++) {
        for (let c = 0; c < BOARD_COLS; c++) {
            const sq = document.createElement('div');
            sq.className = `square ${(r + c) % 2 === 0 ? 'light-square' : 'dark-square'}`;
            sq.dataset.row = r; sq.dataset.col = c;
            sq.onclick = () => handleSquareClick(r, c);
            chessboardDiv.appendChild(sq);
        }
    }
}

function resizeCanvas() {
    const rect = chessboardDiv.getBoundingClientRect();
    if (rect.width === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); 
    drawPath();
}

function drawPath(progress = 1) {
    const rect = chessboardDiv.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    if (!pathToggle.checked || moveHistory.length < 2) return;
    
    const sw = rect.width / BOARD_COLS;
    const sh = rect.height / BOARD_ROWS;

    ctx.beginPath();
    if (isClosedTour) {
        ctx.strokeStyle = `hsl(${rainbowHue}, 100%, 60%)`;
        ctx.shadowColor = `hsl(${rainbowHue}, 100%, 60%)`;
    } else {
        ctx.strokeStyle = '#00f2ff';
        ctx.shadowColor = '#00f2ff';
    }
    
    ctx.lineWidth = isClosedTour ? 4 : 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowBlur = isClosedTour ? 15 : 5;

    for (let i = 0; i < moveHistory.length; i++) {
        const p = moveHistory[i];
        const x = (p.c + 0.5) * sw;
        const y = (p.r + 0.5) * sh;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else if (i === moveHistory.length - 1 && !isClosedTour) {
            const prev = moveHistory[i - 1];
            const px = (prev.c + 0.5) * sw;
            const py = (prev.r + 0.5) * sh;
            ctx.lineTo(px + (x - px) * progress, py + (y - py) * progress);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();

    if (isClosedTour) {
        rainbowHue = (rainbowHue + 3) % 360;
        requestAnimationFrame(() => drawPath(1));
    }
}

function animatePath() {
    if (isClosedTour) return;
    const now = performance.now();
    const elapsed = now - animationStart;
    const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    drawPath(ease);
    if (progress < 1) requestAnimationFrame(animatePath);
}

function moveKnight(r, c) {
    const totalCells = BOARD_ROWS * BOARD_COLS;
    const targetEl = document.querySelector(`[data-row='${r}'][data-col='${c}']`);
    const isClosingStep = (currentMove === totalCells && board[r][c] === 1);

    if (currentPos) {
        const [pr, pc] = currentPos;
        const pEl = document.querySelector(`[data-row='${pr}'][data-col='${pc}']`);
        if (pEl) {
            // 数字を表示
            pEl.innerHTML = `<span class="move-number">${currentMove}</span>`;
            pEl.classList.remove('current-knight');
            pEl.classList.add('visited');
        }
    }

    moveHistory.push({r, c});
    
    if (!isClosingStep) {
        currentMove++;
        board[r][c] = currentMove;
    }
    currentPos = [r, c];

    const targetX = targetEl.offsetLeft + BOARD_BORDER;
    const targetY = targetEl.offsetTop + BOARD_BORDER;

    if (currentMove === 1) {
        activeKnight.style.transition = 'none';
        activeKnight.style.display = 'flex';
        activeKnight.style.left = targetX + 'px';
        activeKnight.style.top = targetY + 'px';
        setTimeout(() => { activeKnight.style.transition = ''; }, 50);
    } else {
        activeKnight.style.left = targetX + 'px';
        activeKnight.style.top = targetY + 'px';
    }
    
    if (!isClosingStep) targetEl.classList.add('current-knight');

    animationStart = performance.now();

    if (isClosingStep) {
        setTimeout(() => {
            isClosedTour = true;
            messageElement.textContent = "🌈 CLOSED TOUR COMPLETE!";
            flashOverlay.classList.remove('flash-success');
            flashOverlay.classList.add('flash-closed');
            pathToggle.checked = true; 
            drawPath(1); 
        }, ANIMATION_DURATION);
    } else {
        requestAnimationFrame(animatePath);
    }

    updateProgress();
    if (!isClosedTour) {
        highlightPossibleMoves(r, c);
        checkGameState();
    }
}

function undoMove() {
    if (currentMove <= 1 || isClosedTour) { initializeBoard(); return; }
    
    flashOverlay.classList.remove('flash-fail', 'flash-success', 'flash-closed');
    
    const [cr, cc] = currentPos;
    board[cr][cc] = 0;
    const cEl = document.querySelector(`[data-row='${cr}'][data-col='${cc}']`);
    if (cEl) {
        cEl.innerHTML = '';
        cEl.classList.remove('current-knight', 'visited', 'closed-target');
    }

    moveHistory.pop();
    const last = moveHistory[moveHistory.length - 1];
    currentMove--;
    currentPos = [last.r, last.c];

    const pEl = document.querySelector(`[data-row='${last.r}'][data-col='${last.c}']`);
    if (pEl) {
        pEl.innerHTML = '';
        pEl.classList.remove('visited');
        pEl.classList.add('current-knight');

        activeKnight.style.transition = 'none';
        activeKnight.style.left = (pEl.offsetLeft + BOARD_BORDER) + 'px';
        activeKnight.style.top = (pEl.offsetTop + BOARD_BORDER) + 'px';
        setTimeout(() => { activeKnight.style.transition = ''; }, 10);
    }

    updateProgress();
    drawPath(1);
    highlightPossibleMoves(last.r, last.c);
    messageElement.textContent = "TARGET ACQUIRED.";
}

function highlightPossibleMoves(r, c) {
    document.querySelectorAll('.possible-move, .closed-target').forEach(e => e.classList.remove('possible-move', 'closed-target'));
    const totalCells = BOARD_ROWS * BOARD_COLS;
    
    for (const [dr, dc] of knightMoves) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS) {
            if (board[nr][nc] === 0) {
                const target = document.querySelector(`[data-row='${nr}'][data-col='${nc}']`);
                if(target) target.classList.add('possible-move');
            } else if (currentMove === totalCells && board[nr][nc] === 1) {
                const startNode = document.querySelector(`[data-row='${nr}'][data-col='${nc}']`);
                if (startNode) startNode.classList.add('closed-target');
            }
        }
    }
    
    if (document.querySelector('.closed-target')) {
        messageElement.textContent = "✨ START NODE REACHABLE. CLOSE THE TOUR!";
    }
}

function handleSquareClick(r, c) {
    if (isClosedTour) return;
    const el = document.querySelector(`[data-row='${r}'][data-col='${c}']`);
    if (currentMove === 0 || (el && (el.classList.contains('possible-move') || el.classList.contains('closed-target')))) {
        moveKnight(r, c);
    }
}

function checkGameState() {
    const totalCells = BOARD_ROWS * BOARD_COLS;
    if (currentMove === totalCells) {
        messageElement.textContent = "✨ MISSION COMPLETE. SEARCHING FOR LOOP...";
        flashOverlay.classList.add('flash-success');
        const [cr, cc] = currentPos;
        highlightPossibleMoves(cr, cc);
    } else {
        setTimeout(() => {
            const nm = document.querySelectorAll('.possible-move');
            if (nm.length === 0 && currentMove < totalCells) {
                messageElement.textContent = "⚠️ SYSTEM HALT.";
                flashOverlay.classList.add('flash-fail');
            } else if (currentMove < totalCells) {
                messageElement.textContent = "TARGET ACQUIRED.";
                flashOverlay.classList.remove('flash-fail');
            }
        }, ANIMATION_DURATION);
    }
}

function updateProgress() {
    const total = BOARD_ROWS * BOARD_COLS;
    const percent = total > 0 ? Math.floor((currentMove / total) * 100) : 0;
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `PROGRESS: ${percent}% (${currentMove}/${total})`;
}

function toggleHelp() {
    const m = document.getElementById('help-modal');
    m.style.display = (m.style.display === 'flex') ? 'none' : 'flex';
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 400));
document.addEventListener('DOMContentLoaded', initializeBoard);