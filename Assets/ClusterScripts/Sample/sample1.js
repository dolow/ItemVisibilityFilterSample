$.onInteract((playerHandle) => {
  // 見えなくするアイテムを取得する
  let bridge = $.worldItemReference("bridge");

  // 見えなくしたいアイテムに触ったプレイヤーを渡す
  bridge.send("set_invisible", playerHandle);
});

/*
$.onInteract((playerHandle) => {
});
について

$.onInteract は、プレイヤーがそのアイテムにインタラクト（クリックやタップ）した場合に行われる処理を定義する機能です。
$.onInteract() の丸括弧の中に処理を定義します。
処理は下記のような形で定義します。

(playerHandle) => {
  ここに任意の処理を書く
}

処理の (playerHandle) の部分は、アイテムにインタラクトしたプレイヤー情報です。
任意の処理の中で playerHandle としてプレイヤー情報を利用できます。

--------

let bridge = $.worldItemReference("bridge");
について

bridge という名前の変数に、"bridge" という ID でシーンに配置されている Item の ItemHandle を割り当てています。
変数とは、何らかの情報を覚えておく場所のことで、以下のような書き方で定義できます。

let 任意の名前 = 割り当てたい情報;

例)
let number = 1;

$.worldItemReference はシーンに配置されている Item の ItemHandle を取得するための機能です。
$.worldItemReference を利用するためには、このスクリプトが設定してある ScriptableItem を持つ GameObject に WorldItemReference コンポーネントをアタッチする必要があります。
アタッチした WorldItemReference コンポーネントに、任意の ID と Item を設定することで、スクリプトから特定の Item の ItemHandle が取得できるようになります。
WorldItemReference に設定したい GameObject には Item コンポーネントがアタッチされている必要があります。

--------

bridge.send("set_invisible", playerHandle);
について

send は、任意の ItemHandle にメッセージを送るための機能で、ItemHandle を割り当てた変数から呼ぶことができます。
send は以下のような書き方で実行できます。

ItemHandleを割り当てた変数.(メッセージのID, ItemHandleに渡したい情報)

このサンプルでは、上記の　WorldItemReference から取得した ItemHandle に対してメッセージを送っています。
送信するメッセージに、誰を対象にアイテム可視性を変更すればよいかの情報を添えることでアイテムの可視性が正しく設定されます。
実際にアイテム可視性を変更しているのはメッセージ送信先のアイテムで、スクリプトとしては bridge.js で処理しています。

send の実行頻度には制限があります。
他のサンプルスクリプトでは、send を短時間で多く実行しないように制御を入れている箇所があります。
*/