// HTMLファイル内の「actionButton」というIDを持つ要素（ボタン）を取得
const button = document.getElementById('actionButton');

// HTMLファイル内の「messageOutput」というIDを持つ要素（メッセージ表示エリア）を取得
const output = document.getElementById('messageOutput');

// ボタンがクリックされたときに実行される関数を登録
button.addEventListener('click', function() {
    // outputエリアのHTMLコンテンツを書き換える
    output.innerHTML = '✨ ボタンが押されました！JavaScriptが動作しています！ ✨';

    // ボタンのテキストも変更する
    button.textContent = 'ありがとう！';
});