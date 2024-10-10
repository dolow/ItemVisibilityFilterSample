$.onStart(() => {
  if (!$.isEvent()) {
    $.subNode("Text").setText("ここはイベント会場ではないので\n残念ながら何も起こりません")
  }
});
$.onInteract((playerHandle) => {
  if (!$.isEvent()) {
    return;
  }

  if (!$.state.hiddenItem) {
    $.subNode("Text").setText("まだ準備中だよ\nそう焦んなって");
    return;
  }

  if (playerHandle.getEventRole() === EventRole.Staff) {
    $.state.hiddenItem.send("activate", true);
    $.subNode("Text").setText("後ろをごらん・・・？");
  } else {
    $.subNode("Text").setText("貴様はスタッフではない");
  }
});

$.onReceive((type, body, sender) => {
  if (type === "hidden_item_is_here") {
    $.state.hiddenItem = body;
    $.subNode("Text").setText("これがスタッフルームにある\n秘密のボタンだとするじゃん？");
  }
})
