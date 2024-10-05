// 初期化処理を行う
$.onStart(() => {
  // 現在このアイテムが見えているプレイヤーの配列をステートに初期化
  $.state.visiblePlayers = [];
  // 可視性を適用する
  $.setVisiblePlayers($.state.visiblePlayers);
});

$.onReceive((type, arg, sender) => {
  let visiblePlayers = $.state.visiblePlayers;

  if (type === "set_invisible") { // 見えなくして欲しいという要求が来た場合
    // ステートに保存されている現在の可視性から渡されたプレイヤーを除外する
    visiblePlayers = visiblePlayers.filter((player) => player.id !== arg.id);
  } else if (type === "set_visible") {
    // ステートに保存されている現在の可視性に渡されたプレイヤーを追加する
    visiblePlayers.push(arg);
  }

  // 可視性を適用する
  $.setVisiblePlayers(visiblePlayers);
  // 可視性をステートに保存する
  $.state.visiblePlayers = visiblePlayers;
});

/*

$.onReceive((type, arg, sender) => {
});
について

$.onReceive は、他のアイテムから send で送られたメッセージを受信するための機能です。
type, arg, sender はそれぞれメッセージの種類、メッセージの内容、メッセージを表しています。
このサンプルでは、受け取ったメッセージの種類に応じて処理を変えています。

--------

visiblePlayers = visiblePlayers.filter((player) => player.id !== arg.id);
について

filter は、配列をフィルタリングして新しい配列をつくるための機能で、ClusterScript のベースになっている JavaScript であらかじめ提供されている機能です。
配列の中身の情報一つひとつに対して for のようにループ処理が行われます。
ループ処理の中では、フィルタリングしたい情報に対して真偽値の false を返すことで配列から取り除くことができます。
このサンプルでは、真偽値として player.id !== arg.id の評価結果を直接返すような記法を用いています。
省略せずに記述すると以下のようになります。

visiblePlayers = visiblePlayers.filter((player) => {
  let result = player.id !== arg.id;
  return result;
});

--------

visiblePlayers.push(arg);
について

push は配列に新しい情報を加えたい場合に利用する、JavaScript であらかじめ提供されている機能です。
この機能は新しい配列をつくるのではなく、配列自身に新しい値を加えます。
新しい情報は配列の末尾に追加されます。

*/