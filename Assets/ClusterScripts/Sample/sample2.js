$.onInteract((playerHandle) => {
  // 見えるようにするアイテムを取得する
  let bridge = $.worldItemReference("bridge");

  // 見えるようにしたいアイテムに触ったプレイヤーを渡す
  bridge.send("set_visible", [playerHandle]);
});
