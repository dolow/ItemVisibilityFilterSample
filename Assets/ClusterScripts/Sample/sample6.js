$.onInteract((playerHandle) => {
  // 全プレイヤーを取得
  let players = $.getPlayersNear($.getPosition(), Infinity);

  // ランダムなプレイヤーを抽出
  let index = Math.floor(Math.random() * players.length);

  // 対象のアイテムに抽出したプレイヤーを渡す
  let obstacles = $.worldItemReference("obstacles");
  obstacles.send("set_visibility", players[index]);
});

/*
let players = $.getPlayersNear($.getPosition(), Infinity);
について

$.getPlayersNear は、このアイテムの近くにいるプレイヤーを取得するための機能で、以下のように利用します。

$.getPlayersNear(プレイヤーを探す原点, 原点から探す距離);

このサンプルでは近くというよりもすべてのプレイヤーを取得したいので、原点から探す距離を指定する箇所に Infinity として無限距離を検索するようにしています。
*/