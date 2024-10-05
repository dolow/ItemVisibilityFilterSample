$.onInteract((playerHandle) => {
  // 全プレイヤーを取得する
  let players = $.getPlayersNear($.getPosition(), Infinity);

  // プレイヤー数の半分の回数処理する
  for (let i = 0; i < Math.floor(players.length / 2); i++) {
    // ランダムなプレイヤーを抽出
    let index = Math.floor(Math.random() * players.length);
    // ランダムなプレイヤーを取り除く
    players.splice(index, 1);
  }
  // 残ったプレイヤーを対象のアイテムに渡す
  let pyui = $.worldItemReference("pyui");
  pyui.send("set_visibility", players);
});

/*
Math.floor, Math.random について

Math.floor は小数点の端数を切り捨てるための機能で、Cluster Script ではなく、Cluster Script の元になっているプログラミング言語の JavaScript であらかじめ提供されています。
Math.random は 0以上 1未満のランダムな数値を求める機能です。

--------

players.splice(index, 1);
について

splice も JavaScript であらかじめ提供されている機能で、配列から任意の要素を削除できます。
削除の開始位置と、開始位置から何個削除するかを渡して利用します。

*/