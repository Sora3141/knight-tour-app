let BOARD_ROWS = 8;
let BOARD_COLS = 8;
let board = [];
let currentMove = 0;
let currentPos = null;

// ナイトの移動パターン (8方向)
const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
];

const chessboardDiv = document.getElementById('chessboard');
const boardRowsInput = document.getElementById('board-rows');
const boardColsInput = document.getElementById('board-cols');
const messageElement = document.getElementById('message');

// --- 関数定義 ---

// 盤面サイズを初期化し、新しい盤面を生成する
function initializeBoard() {
    const rows = parseInt(boardRowsInput.value, 10);
    const cols = parseInt(boardColsInput.value, 10);
    
    // サイズのバリデーション
    if (rows < 3 || rows > 12 || isNaN(rows) || cols < 3 || cols > 12 || isNaN(cols)) {
        alert("行数と列数はそれぞれ3から12の間で設定してください。");
        boardRowsInput.value = BOARD_ROWS; 
        boardColsInput.value = BOARD_COLS; 
        return;
    }
    
    BOARD_ROWS = rows;
    BOARD_COLS = cols;
    currentMove = 0;
    currentPos = null;
    
    // board配列を初期化
    board = Array(BOARD_ROWS).fill(0).map(() => Array(BOARD_COLS).fill(0));
    
    // CSS Gridのテンプレートを動的に設定
    chessboardDiv.style.gridTemplateColumns = `repeat(${BOARD_COLS}, 60px)`; // 列数
    chessboardDiv.style.gridTemplateRows = `repeat(${BOARD_ROWS}, 60px)`;   // 行数
    
    createBoard(); // 盤面をHTMLに生成
    messageElement.textContent = "クリックして開始位置を選択してください。";
}

// 盤をHTMLに生成する
function createBoard() {
    chessboardDiv.innerHTML = '';
    for (let r = 0; r < BOARD_ROWS; r++) {
        for (let c = 0; c < BOARD_COLS; c++) {
            const square = document.createElement('div');
            square.classList.add('square');
            // 色分けロジック (r+cが偶数なら明るい、奇数なら濃い)
            square.classList.add((r + c) % 2 === 0 ? 'light-square' : 'dark-square');
            square.dataset.row = r;
            square.dataset.col = c;
            square.addEventListener('click', () => handleSquareClick(r, c));
            chessboardDiv.appendChild(square);
        }
    }
}

// マスが盤内にあるか、かつ未訪問かチェック
function isValidMove(r, c) {
    return r >= 0 && r < BOARD_ROWS && 
           c >= 0 && c < BOARD_COLS && 
           board[r][c] === 0;
}

// 可能な移動先を計算し、ハイライトする
function highlightPossibleMoves(r, c) {
    // 既存のハイライトを削除
    document.querySelectorAll('.possible-move').forEach(el => el.classList.remove('possible-move'));

    let possibleMoves = [];
    for (const [dr, dc] of knightMoves) {
        const newR = r + dr;
        const newC = c + dc;

        if (isValidMove(newR, newC)) {
            possibleMoves.push([newR, newC]);
            // HTML要素をハイライト
            const squareEl = document.querySelector(`[data-row='${newR}'][data-col='${newC}']`);
            if (squareEl) {
                squareEl.classList.add('possible-move');
            }
        }
    }
    return possibleMoves;
}

// ナイトの移動処理
function moveKnight(r, c) {
    // 移動前の現在地マスから 'current-knight' クラスを削除
    if (currentPos) {
        const prevR = currentPos[0];
        const prevC = currentPos[1];
        const prevSquareEl = document.querySelector(`[data-row='${prevR}'][data-col='${prevC}']`);
        if (prevSquareEl) {
            // 前のマスは単なる「訪問済み」になる
            prevSquareEl.classList.remove('current-knight'); 
            
            // ナイト駒を削除 (CSSで非表示だが、要素は削除)
            const prevKnight = prevSquareEl.querySelector('.knight-piece');
            if (prevKnight) prevKnight.remove();
        }
    }

    currentMove++;
    board[r][c] = currentMove;
    currentPos = [r, c];

    // 現在のマスを更新
    const currentSquareEl = document.querySelector(`[data-row='${r}'][data-col='${c}']`);
    if (currentSquareEl) {
        // 訪問済みと現在地の両方を付与
        currentSquareEl.classList.add('visited'); 
        currentSquareEl.classList.add('current-knight');
        
        // ナイトの駒（♞）の生成ロジックは削除します (手数表示のみに注力するため)。

        // 手数表示を更新
        let moveNumber = currentSquareEl.querySelector('.move-number');
        if (!moveNumber) {
             moveNumber = document.createElement('span');
             moveNumber.classList.add('move-number');
             currentSquareEl.appendChild(moveNumber);
        }
        moveNumber.textContent = currentMove;
    }

    // 次の可能な移動先をハイライト
    const nextMoves = highlightPossibleMoves(r, c);

    // ゲームの終了判定
    const totalSquares = BOARD_ROWS * BOARD_COLS;
    if (currentMove === totalSquares) {
        messageElement.textContent = `✨クリア！${currentMove}手で全てを巡りました！`;
        document.querySelectorAll('.possible-move').forEach(el => el.classList.remove('possible-move'));
    } else if (nextMoves.length === 0) {
        messageElement.textContent = `ゲームオーバー！${currentMove}手で止まってしまいました。リセットしてください。`;
    } else {
        messageElement.textContent = `現在 ${currentMove} 手目。次はどこへ移動しますか？`;
    }
}

// マスクリック時のハンドラー
function handleSquareClick(r, c) {
    if (currentMove === 0) {
        // 初手: どこでも開始可能
        moveKnight(r, c);
        return;
    }

    if (currentPos === null) {
        messageElement.textContent = "最初に「新しい盤面で開始」ボタンを押してください。";
        return;
    }
    
    // 2手目以降の場合: 移動可能先かをチェック
    const isPossible = document.querySelector(`[data-row='${r}'][data-col='${c}']`).classList.contains('possible-move');

    if (isPossible) {
        moveKnight(r, c);
    } else if (board[r][c] === 0) {
        // 未訪問だが、移動ルールを満たさない場合
        messageElement.textContent = "そこには移動できません。ナイトは「L字型」に動く必要があります。";
    }
    // 訪問済みのマスをクリックしても何もしない
}

// 盤面をリセットする (サイズは維持)
function resetBoard() {
    if (BOARD_ROWS === 0 || BOARD_COLS === 0) {
        messageElement.textContent = "最初に「新しい盤面で開始」ボタンを押してください。";
        return;
    }
    
    currentMove = 0;
    currentPos = null;
    
    // board配列をリセット
    board = Array(BOARD_ROWS).fill(0).map(() => Array(BOARD_COLS).fill(0));
    
    // HTML要素をリセット
    document.querySelectorAll('.square').forEach(el => {
        el.innerHTML = ''; // 手数表示をクリア
        el.classList.remove('current-knight', 'possible-move', 'visited');
    });

    messageElement.textContent = "クリックして開始位置を選択してください。";
}


// --- アプリケーションの開始 ---
// 初期読み込み時の処理
document.addEventListener('DOMContentLoaded', () => {
    // ページロード時はデフォルトのサイズで初期化
    initializeBoard(); 
});