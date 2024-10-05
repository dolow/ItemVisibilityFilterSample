$.onStart(() => {
  // 最初は誰にも見えないようにしておく
  $.setVisiblePlayers([]);
});

$.onReceive((id, players, sender) => {
  if (id === "change_visibility") {
    // 壁の文字が見えるプレイヤーを貰ったら設定する
    $.setVisiblePlayers(players);

    // 人狼側なので誰が人狼かを文字で表示する
    let names = players.map((player) => player.userDisplayName);
    let text = names.join(" と\n") + "\nは人狼";
    
    // スクリーンの文字列を更新する
    $.subNode("Text").setText(text);
  }
});