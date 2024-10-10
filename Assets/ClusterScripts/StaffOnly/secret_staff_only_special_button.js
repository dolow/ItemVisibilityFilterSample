$.onStart(() => {
  // world item reference list がまだベータなので、全アイテムに投機的に自身の存在を伝えるメッセージを送る
  $.state.broadcastItems = $.getItemsNear($.getPosition(), Infinity);
  // send 頻度制限回避の待ち時間
  $.state.interval = 0;
});

$.onInteract((playerHandle) => {
  if (playerHandle.getEventRole() === EventRole.Staff) {
    $.subNode("Text").setText("スタッフ専用のボタンを使って\nなにかが起こったことにする");
  } else {
    $.subNode("Text").setText("貴様はスタッフではない");
  }
});

$.onUpdate((deltaTime) => {
  if (!$.isEvent()) {
    // イベント会場でなければなにもしない
    return;
  }
  let broadcastItems = $.state.broadcastItems;

  // まだメッセージを送信すべきアイテムがあれば処理する
  if (broadcastItems.length > 0) {
    let interval = $.state.interval;
    interval = interval + deltaTime;

    // 十分な待ち時間が得られたらメッセージを送る
    if (interval > 0.1) {
      interval = 0;
      // 万が一メッセージ送信頻度制限に引っかかったら送信予定のアイテムは削除せずに次回に持ち越す
      try {
        broadcastItems[0].send("hidden_item_is_here", $.itemHandle);
        // try / catch で頻度制限エラー時はここの 2行は処理されないようにする
        broadcastItems.shift();
        $.state.broadcastItems = broadcastItems;
      } catch (e) {
        // エラー時は何もしない
      }

      $.state.interval = interval;
    }
  }
});

$.onReceive((type, message, sender) => {
  // スタッフルームのボタンが押されたらサブノートを有効化する
  if (type === "activate") {
    $.subNode("Button").setEnabled(true);
  }
});

