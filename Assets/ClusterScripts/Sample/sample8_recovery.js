$.onInteract((playerHandle) => {
  // サンプルアイテムを取得する
  let sample8 = $.worldItemReference("sample8");
  // サンプルアイテムにメッセージを送る
  // 誰が触ったか関係なく全員見えるようにするのでメッセージの内容は空にする
  sample8.send("set_visible", $.getPlayersNear($.getPosition(), Infinity));
});

