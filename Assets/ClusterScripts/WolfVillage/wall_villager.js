$.onStart(() => {
  // 最初は誰にも見えないようにしておく
  $.setVisiblePlayers([]);
});

$.onReceive((id, players, sender) => {
  if (id === "change_visibility") {
    // 壁の文字が見えるプレイヤーを貰ったら設定する
    $.setVisiblePlayers(players);
    
    // 村人側なので自分が村人であることのみ伝える
    let text = "あなたは村人";

    // スクリーンの文字列を更新する
    $.subNode("Text").setText(text);
  }
});