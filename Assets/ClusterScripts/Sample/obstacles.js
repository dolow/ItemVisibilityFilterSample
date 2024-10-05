$.onStart(() => {
  $.setVisiblePlayers([]);
});

$.onReceive((type, arg, sender) => {
  // 見えるようにして欲しいという要求が来た場合
  if (type === "set_visibility") {
    // 可視性を適用する
    $.setVisiblePlayers([arg]);
  }
});