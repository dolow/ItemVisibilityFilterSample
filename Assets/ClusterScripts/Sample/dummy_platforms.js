$.onStart(() => {
  let visiblePlayers = $.getPlayersNear($.getPosition(), Infinity);
  $.setVisiblePlayers(visiblePlayers);
});

$.onReceive((type, arg, sender) => {
  // 見えなくして欲しいという要求が来た場合
  if (type === "set_invisible") {
    // すべてのプレイヤーを取得する
    let visiblePlayers = $.getPlayersNear($.getPosition(), Infinity);

    // 見えてほしくないプレイヤーの ID を集める
    let ids = arg.map((playerHandle) => playerHandle.id);

    // 見えてほしくないプレイヤーの ID を持たないプレイヤーを残す
    visiblePlayers = visiblePlayers.filter((player) => ids.indexOf(player.id) === -1);

    // 可視性を適用する
    $.setVisiblePlayers(visiblePlayers);
  }
});