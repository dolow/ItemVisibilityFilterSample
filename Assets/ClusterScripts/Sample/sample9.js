// 触ったら 1秒後に なにかが見えなくなる
$.onStart(() => {
  // プレイヤー毎の待ち時間リストの初期化、最初は空
  $.state.playerWaitTimes = {};
});

$.onInteract((playerHandle) => {
  let playerWaitTimes = $.state.playerWaitTimes;
  
  // まだそのプレイヤーの待ち時間が設定されていなければプレイヤーに待ち時間を設定する
  // この if 文を外せば、プレイヤーに待ち時間が設定されていたとしても待ち時間をリセットする
  if (!playerWaitTimes[playerHandle.id]) {
    // PlayerHandle の ID に、PlayerHandle そのものと待ち時間を紐つける
    playerWaitTimes[playerHandle.id] = {
      playerHandle: playerHandle,
      interval: 1.0
    };
    $.state.playerWaitTimes = playerWaitTimes;
  }
});

$.onUpdate((deltaTime) => {
  // 最終的に可視性を変えたいプレイヤーのリスト、空で初期化
  let visibilityChangePlayers = [];

  // 各プレイヤーの待ち時間からフレームでの経過時間 (deltaTime) を減算する
  let playerWaitTimes = $.state.playerWaitTimes;
  let ids = Object.keys(playerWaitTimes);
  for (let i = 0; i < ids.length; i++) {
    let id = ids[i];
    let playerWaitTime = playerWaitTimes[id];
    playerWaitTime.interval = playerWaitTime.interval - deltaTime;
    // 減算結果が 0秒を下回ったら十分待っていることになる
    if (playerWaitTime.interval <= 0) {
      // 可視性を変えるプレイヤーとしてリストに追加
      visibilityChangePlayers.push(playerWaitTime.playerHandle)
      // 待ち時間のあるプレイヤー一覧から削除
      delete playerWaitTimes[id];
    } else {
      playerWaitTimes[id] = playerWaitTime;
    }
  }

  $.state.playerWaitTimes = playerWaitTimes;

  // 可視性を更新するプレイヤーがいればメッセージ送信
  if (visibilityChangePlayers.length > 0) {
    let target = $.worldItemReference("target");
    target.send("set_invisible", visibilityChangePlayers);
  }
});

