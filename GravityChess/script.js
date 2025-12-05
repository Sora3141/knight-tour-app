// =================================================================
// 1. 盤面とゲームの状態定義 (左右配置)
// =================================================================

// [行][列]。黒は左側 (A, B列)、白は右側 (G, H列) に配置
const initialBoard = [
    // A   B   C   D   E   F   G   H  (列)
    ['♜', '♟', null, null, null, null, '♙', '♖'], // 8段目 (R=0)
    ['♞', '♟', null, null, null, null, '♙', '♘'], // 7段目 (R=1)
    ['♝', '♟', null, null, null, null, '♙', '♗'], // 6段目 (R=2)
    ['♛', '♟', null, null, null, null, '♙', '♕'], // 5段目 (R=3)
    ['♚', '♟', null, null, null, null, '♙', '♔'], // 4段目 (R=4)
    ['♝', '♟', null, null, null, null, '♙', '♗'], // 3段目 (R=5)
    ['♞', '♟', null, null, null, null, '♙', '♘'], // 2段目 (R=6)
    ['♜', '♟', null, null, null, null, '♙', '♖']  // 1段目 (R=7)
];

let board = JSON.parse(JSON.stringify(initialBoard)); 
let selectedSquare = null; 
let currentTurn = 'white';
const boardElement = document.getElementById('chessboard');
const turnIndicator = document.getElementById('turn-indicator');


// =================================================================
// 2. ユーティリティ関数
// =================================================================

function getPieceColor(piece) {
    if (piece === null) return null;
    return (piece === piece.toLowerCase()) ? 'black' : 'white';
}

function getPieceType(piece) {
    if (piece === null) return null;
    const type = piece.toLowerCase();
    switch (type) {
        case '♟': return 'pawn';
        case '♜': return 'rook';
        case '♞': return 'knight';
        case '♝': return 'bishop';
        case '♛': return 'queen';
        case '♚': return 'king';
        default: return null;
    }
}

function updateTurnIndicator() {
    turnIndicator.textContent = `${currentTurn === 'white' ? '白' : '黒'}のターンです`;
}


// =================================================================
// 3. 合法手判定
// =================================================================

function isTargetValid(oldR, oldC, newR, newC) {
    const movingColor = getPieceColor(board[oldR][oldC]);
    const targetColor = getPieceColor(board[newR][newC]);
    return targetColor === null || targetColor !== movingColor;
}

function checkPath(oldR, oldC, newR, newC) {
    const rDir = Math.sign(newR - oldR);
    const cDir = Math.sign(newC - oldC);
    
    let r = oldR + rDir;
    let c = oldC + cDir;

    while (r !== newR || c !== newC) {
        if (board[r][c] !== null) {
            return false;
        }
        r += rDir;
        c += cDir;
    }
    return true;
}

function isValidPawnMove(oldR, oldC, newR, newC, piece) {
    const color = getPieceColor(piece);
    // 黒は右へ (C+1)、白は左へ (C-1) が「前進」方向
    const direction = (color === 'black') ? 1 : -1; 
    const startCol = (color === 'black') ? 1 : 6;
    
    const rowDiff = Math.abs(newR - oldR);
    const colDiff = newC - oldC;

    // 1. 通常移動（前進）
    if (rowDiff === 0) {
        if (board[newR][newC] !== null) return false;

        // 1マス前進
        if (colDiff === direction) return true;

        // 2マス前進 (初期位置かつ進路が空)
        if (oldC === startCol && colDiff === 2 * direction) {
            const middleC = oldC + direction;
            if (board[newR][middleC] === null) return true;
        }
    }
    
    // 2. 駒取り（斜め前）
    if (rowDiff === 1 && colDiff === direction) {
        const target = board[newR][newC];
        if (target !== null && getPieceColor(target) !== color) {
            return true;
        }
    }
    
    return false;
}

function isValidRookMove(oldR, oldC, newR, newC) {
    if (oldC !== newC && oldR !== newR) return false;
    if (oldC === newC && oldR === newR) return false;
    return isTargetValid(oldR, oldC, newR, newC) && checkPath(oldR, oldC, newR, newC);
}

function isValidKnightMove(oldR, oldC, newR, newC) {
    const rowDiff = Math.abs(newR - oldR);
    const colDiff = Math.abs(newC - oldC);
    const isLMove = (rowDiff === 1 && colDiff === 2) || (rowDiff === 2 && colDiff === 1);
    return isLMove && isTargetValid(oldR, oldC, newR, newC);
}

function isValidBishopMove(oldR, oldC, newR, newC) {
    const rowDiff = Math.abs(newR - oldR);
    const colDiff = Math.abs(newC - oldC);
    if (rowDiff !== colDiff || rowDiff === 0) return false;
    return isTargetValid(oldR, oldC, newR, newC) && checkPath(oldR, oldC, newR, newC);
}

function isValidQueenMove(oldR, oldC, newR, newC) {
    return isValidRookMove(oldR, oldC, newR, newC) || isValidBishopMove(oldR, oldC, newR, newC);
}

function isValidKingMove(oldR, oldC, newR, newC) {
    const rowDiff = Math.abs(newR - oldR);
    const colDiff = Math.abs(newC - oldC);
    const isSingleStep = rowDiff <= 1 && colDiff <= 1 && (rowDiff !== 0 || colDiff !== 0);
    return isSingleStep && isTargetValid(oldR, oldC, newR, newC);
}

function isValidMove(oldR, oldC, newR, newC) {
    const piece = board[oldR][oldC];
    const type = getPieceType(piece);
    
    if (!type) return false;

    switch (type) {
        case 'pawn': return isValidPawnMove(oldR, oldC, newR, newC, piece);
        case 'rook': return isValidRookMove(oldR, oldC, newR, newC);
        case 'knight': return isValidKnightMove(oldR, oldC, newR, newC);
        case 'bishop': return isValidBishopMove(oldR, oldC, newR, newC);
        case 'queen': return isValidQueenMove(oldR, oldC, newR, newC);
        case 'king': return isValidKingMove(oldR, oldC, newR, newC);
        default: return false;
    }
}


// =================================================================
// 4. 盤面の描画処理
// =================================================================

function drawBoard() {
    boardElement.innerHTML = '';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const square = document.createElement('div');
            const colorClass = (r + c) % 2 === 0 ? 'light' : 'dark';
            square.classList.add('square', colorClass);
            square.dataset.row = r;
            square.dataset.col = c;
            
            const piece = board[r][c];
            if (piece) {
                const pieceElement = document.createElement('span');
                pieceElement.classList.add('piece');
                pieceElement.textContent = piece;
                square.appendChild(pieceElement);
            }

            square.addEventListener('click', handleSquareClick);
            boardElement.appendChild(square);
        }
    }
}

function highlightMoves(r, c) {
    document.querySelectorAll('.possible-move').forEach(s => s.classList.remove('possible-move'));

    for (let newR = 0; newR < 8; newR++) {
        for (let newC = 0; newC < 8; newC++) {
            if (isValidMove(r, c, newR, newC)) {
                const targetSquare = document.querySelector(`.square[data-row="${newR}"][data-col="${newC}"]`);
                if (targetSquare) {
                    targetSquare.classList.add('possible-move');
                }
            }
        }
    }
}


// =================================================================
// 5. クリック処理とゲームの流れ (動作修正)
// =================================================================

function handleSquareClick(event) {
    const clickedSquare = event.currentTarget;
    const r = parseInt(clickedSquare.dataset.row);
    const c = parseInt(clickedSquare.dataset.col);
    const piece = board[r][c];

    document.querySelectorAll('.selected').forEach(s => s.classList.remove('selected'));
    document.querySelectorAll('.possible-move').forEach(s => s.classList.remove('possible-move'));

    if (selectedSquare === null) {
        // --- A. 駒の選択 ---
        if (piece && getPieceColor(piece) === currentTurn) {
            selectedSquare = { r, c };
            clickedSquare.classList.add('selected');
            highlightMoves(r, c);
        }
    } else {
        // --- B. 移動先または別の駒の選択 ---
        
        const oldR = selectedSquare.r;
        const oldC = selectedSquare.c;

        if (oldR === r && oldC === c) {
            // 同じ駒を再度クリック -> 選択解除
            selectedSquare = null;
            return;
        }

        if (piece && getPieceColor(piece) === currentTurn) {
            // 自分の別の駒をクリック -> 選択対象変更
            selectedSquare = { r, c };
            clickedSquare.classList.add('selected');
            highlightMoves(r, c);
            return;
        }

        // --- C. 移動の実行 ---
        if (isValidMove(oldR, oldC, r, c)) {
            // 移動を実行
            board[r][c] = board[oldR][oldC]; 
            board[oldR][oldC] = null; 

            // ターンを交代
            currentTurn = (currentTurn === 'white') ? 'black' : 'white';
            updateTurnIndicator();

            // 盤面を再描画し、選択を解除
            drawBoard();
            selectedSquare = null;
        } else {
            // 不正な移動
            alert("そのマスには移動できません。");
            selectedSquare = null; 
            drawBoard(); 
        }
    }
}

// ページロード時に実行
drawBoard();
updateTurnIndicator();