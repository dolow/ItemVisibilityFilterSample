// 触ったら その人が触るごとに見えるものが変わる
$.onStart(() => {
  // プレイヤー毎の見えるアイテムを保存する場所、最初は空
  $.state.playerVisibleItems = {};
  // メッセージ送信キュー、短時間でメッセージを送りすぎるとエラーになるため頻度を調整する
  $.state.sendQueue = [];
  // メッセージ送信の待ち時間
  $.state.sendInterval = 0;
});

$.onInteract((playerHandle) => {
  let queue = $.state.sendQueue;

  // 既に触ったプレイヤーのキューが積まれていたら何もしない
  // インタラクトを連打すると先行入力でキューが積まれすぎてしまうため、それを避ける
  for (let i = 0; i < queue.length; i++) {
    let q = queue[i];
    for (let j = 0; j < q.players.length; j++) {
      if (q.players[j].id === playerHandle.id) {
        // 何もせずここで処理終了
        return;
      }
    }
  }

  // 見えるようにするアイテムを取得して配列にする
  let items = [
    $.worldItemReference("item1"), // items[0] のように 0番で取得できる アイテム
    $.worldItemReference("item2"), // items[1] のように 1番で取得できる アイテム
    $.worldItemReference("item3")  // items[2] のように 2番で取得できる アイテム
  ];

  // 見えるアイテムのインデックスをひとつずらす
  let playerVisibleItem = $.state.playerVisibleItems[playerHandle.id];
  if (!$.state.playerVisibleItems.hasOwnProperty(playerHandle.id)) {
    // まだそのプレイヤーの見えるアイテムが登録されていなければアイテム配列の 0番目が見えるようにする
    playerVisibleItem = 0;
  } else {
    // そのプレイヤーの見えるアイテムが登録されていれば次のインデックスのアイテムが見えるようにする
    playerVisibleItem = playerVisibleItem + 1;
  }

  // 最大アイテムインデックスを越えたら0番目に戻す
  if (playerVisibleItem >= items.length) {
    playerVisibleItem = 0;
  }

  // 非表示にすべきアイテムのキューを先に詰める
  // 表示するキューを先に詰めると、同時に表示されているアイテムが一瞬 2つになってしまって見た目上不格好なため
  for (let i = 0; i < items.length; i++) {
    // 表示すべきアイテムだったらスキップ
    if (playerVisibleItem === i) {
      continue;
    }

    // 短時間でメッセージを送信しすぎるとエラーになるため、すぐにはメッセージを送らずキューイングする
    queue.push({
      message: "set_invisible",
      players: [playerHandle],
      receiver: items[i]
    });
  }

  // 表示すべきアイテムのキューを詰める
  for (let i = 0; i < items.length; i++) {
    // 非表示にすべきアイテムだったらスキップ
    if (playerVisibleItem !== i) {
      continue;
    }

    // 短時間でメッセージを送信しすぎるとエラーになるため、すぐにはメッセージを送らずキューイングする
    queue.push({
      message: "set_visible",
      players: [playerHandle],
      receiver: items[i]
    });
  }

  $.state.sendQueue = queue;

  // 更新した見えているアイテム情報を保存し直す
  let playerVisibleItems = $.state.playerVisibleItems;
  playerVisibleItems[playerHandle.id] = playerVisibleItem;
  $.state.playerVisibleItems = playerVisibleItems;
});

$.onUpdate((deltaTime) => {
  // send 待ち時間を加算する
  let sendInterval = $.state.sendInterval;
  sendInterval = sendInterval + deltaTime;

  let queue = $.state.sendQueue;

  // キューが存在し、十分に待っていたらメッセージ送信する
  if (sendInterval > 0.1 && queue.length > 0) {
    sendInterval = 0;

    let queue = $.state.sendQueue;
    let messageInfo = queue.shift();
    messageInfo.receiver.send(messageInfo.message, messageInfo.players);
    $.state.sendQueue = queue;
  }

  $.state.sendInterval = sendInterval;
});
