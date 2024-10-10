// 触ったら 触った人に 自分自身を見えなくする
$.onStart(() => {
  // 最初は全プレイヤー見えるようにする
  $.state.visiblePlayers = $.getPlayersNear($.getPosition(), Infinity);
});

$.onInteract((playerHandle) => {
  // 触ったプレイヤーを見えるプレイヤーから除外する
  let visiblePlayers = $.state.visiblePlayers;
  for (let i = 0; i < visiblePlayers.length; i++) {
    if (visiblePlayers[i].id === playerHandle.id) {
      visiblePlayers.splice(i, 1);
      break;
    }
  }
  // 残ったプレイヤーを見えるプレイヤーにする
  // onUpdate でも可視性を更新しているが、onInteract では即座に変更する
  $.setVisiblePlayers(visiblePlayers);
});

// この onRnreceive は可視性をもとに戻すためのサンプル用の記述
// 一度見えなくしてしまったら再びインタラクトして可視性をもとに戻すことはできないため
// 二度と見えなくても良ければこの onReceive は削除して良い
$.onReceive((type, arg, sender) => {
  if (type === "set_visible") {
    let visiblePlayers = $.getPlayersNear($.getPosition(), Infinity);
    $.setVisiblePlayers(visiblePlayers);
    $.state.visiblePlayers = visiblePlayers;
  }
});