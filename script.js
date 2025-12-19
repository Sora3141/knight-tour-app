
let BOARD_ROWS = 8, BOARD_COLS = 8, board = [], currentMove = 0, currentPos = null, moveHistory = [];
const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const chessboardDiv = document.getElementById('chessboard'), boardRowsInput = document.getElementById('board-rows'), boardColsInput = document.getElementById('board-cols');
const messageElement = document.getElementById('message'), progressBar = document.getElementById('progress-bar'), progressText = document.getElementById('progress-text'), flashOverlay = document.getElementById('flash-overlay');
const canvas = document.getElementById('path-canvas'), ctx = canvas.getContext('2d'), pathToggle = document.getElementById('path-toggle');

function initializeBoard() {
    const r = parseInt(boardRowsInput.value, 10), c = parseInt(boardColsInput.value, 10);
    if (r < 3 || r > 12 || c < 3 || c > 12) { alert("3〜12で設定してください"); return; }
    flashOverlay.className = 'screen-flash';
    BOARD_ROWS = r; BOARD_COLS = c; currentMove = 0; currentPos = null; moveHistory = [];
    board = Array(BOARD_ROWS).fill(0).map(() => Array(BOARD_COLS).fill(0));
    chessboardDiv.style.gridTemplateColumns = `repeat(${BOARD_COLS}, 1fr)`;
    chessboardDiv.style.width = 'auto'; 
    createBoard(); updateProgress();
    setTimeout(resizeCanvas, 100);
    messageElement.textContent = "SYSTEM INITIALIZED. SELECT START NODE.";
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
    canvas.width = rect.width; canvas.height = rect.height;
    drawPath();
}
function drawPath() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!pathToggle.checked || moveHistory.length < 2) return;
    ctx.beginPath(); ctx.strokeStyle = '#00f2ff'; ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.shadowBlur = 5; ctx.shadowColor = '#00f2ff';
    const sw = canvas.width / BOARD_COLS, sh = canvas.height / BOARD_ROWS;
    moveHistory.forEach((p, i) => {
        const x = (p.c + 0.5) * sw, y = (p.r + 0.5) * sh;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
}
function updateProgress() {
    const total = BOARD_ROWS * BOARD_COLS;
    const percent = total > 0 ? Math.floor((currentMove / total) * 100) : 0;
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `PROGRESS: ${percent}% (${currentMove}/${total})`;
}
function moveKnight(r, c) {
    moveHistory.push({r, c});
    if (currentPos) {
        const [pr, pc] = currentPos;
        const pEl = document.querySelector(`[data-row='${pr}'][data-col='${pc}']`);
        const ok = pEl.querySelector('.knight-icon'); if (ok) ok.remove();
        const sp = document.createElement('span'); sp.className = 'move-number'; sp.textContent = currentMove;
        pEl.appendChild(sp); pEl.classList.remove('current-knight'); pEl.classList.add('visited');
    }
    currentMove++; board[r][c] = currentMove; currentPos = [r, c];
    const el = document.querySelector(`[data-row='${r}'][data-col='${c}']`);
    el.classList.add('current-knight');
    const k = document.createElement('div'); k.className = 'knight-icon'; k.textContent = '♞'; el.appendChild(k);
    updateProgress(); drawPath(); const nm = highlightPossibleMoves(r, c);
    if (currentMove === BOARD_ROWS * BOARD_COLS) {
        messageElement.textContent = "✨ MISSION COMPLETE."; flashOverlay.classList.add('flash-success');
    } else if (nm.length === 0) {
        messageElement.textContent = "⚠️ SYSTEM HALT."; flashOverlay.classList.add('flash-fail');
    } else {
        messageElement.textContent = "TARGET ACQUIRED. SCANNING...";
    }
}
function undoMove() {
    if (currentMove <= 1) { initializeBoard(); return; }
    flashOverlay.className = 'screen-flash';
    const [cr, cc] = currentPos; board[cr][cc] = 0;
    const cEl = document.querySelector(`[data-row='${cr}'][data-col='${cc}']`);
    cEl.innerHTML = ''; cEl.classList.remove('current-knight', 'visited');
    moveHistory.pop();
    const last = moveHistory[moveHistory.length - 1];
    currentMove--; currentPos = [last.r, last.c];
    const pEl = document.querySelector(`[data-row='${last.r}'][data-col='${last.c}']`);
    pEl.innerHTML = ''; pEl.classList.remove('visited'); pEl.classList.add('current-knight');
    const k = document.createElement('div'); k.className = 'knight-icon'; k.textContent = '♞'; pEl.appendChild(k);
    updateProgress(); drawPath(); highlightPossibleMoves(last.r, last.c);
    messageElement.textContent = `RECOVERED TO STEP ${currentMove}.`;
}
function highlightPossibleMoves(r, c) {
    document.querySelectorAll('.possible-move').forEach(e => e.classList.remove('possible-move'));
    let m = [];
    for (const [dr, dc] of knightMoves) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS && board[nr][nc] === 0) {
            m.push([nr, nc]); document.querySelector(`[data-row='${nr}'][data-col='${nc}']`).classList.add('possible-move');
        }
    }
    return m;
}
function handleSquareClick(r, c) {
    const el = document.querySelector(`[data-row='${r}'][data-col='${c}']`);
    if (currentMove === 0 || el.classList.contains('possible-move')) moveKnight(r, c);
}
function toggleHelp() {
    const m = document.getElementById('help-modal');
    m.style.display = (m.style.display === 'flex') ? 'none' : 'flex';
}

window.addEventListener('resize', resizeCanvas);
document.addEventListener('DOMContentLoaded', initializeBoard);