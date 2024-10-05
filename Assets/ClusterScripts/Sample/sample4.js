$.onStart(() => {
  // 可視性の更新頻度を調整するための経過時間を保存する
  $.state.elapsedTime = 0;
});

$.onUpdate((dt) => {
  // オーバーラップしているプレイヤーを取得
  let overlaps = $.getOverlaps();
  let innerPlayers = [];
  for (let i = 0; i < overlaps.length; i++) {
    if (!!overlaps[i].object.playerHandle) {
      innerPlayers.push(overlaps[i].object.playerHandle);
    }
  }

  // 前回の入っているかどうかの判定から 0.1秒以上経っているか確認する (send 制限対応)
  let elapsedTime = $.state.elapsedTime + dt;

  if (elapsedTime > 0.1) {
    // 0.1秒以上経っていれば、オーバーラップしているプレイヤーに対して隠された足場を見えるように要求する
    let platforms = $.worldItemReference("hidden_platforms");
    platforms.send("set_visible", innerPlayers);

    // 経過時間をゼロからカウントし直す
    $.state.elapsedTime = 0;
  } else {
    // 経過時間を更新する
    $.state.elapsedTime = elapsedTime;
  }
});