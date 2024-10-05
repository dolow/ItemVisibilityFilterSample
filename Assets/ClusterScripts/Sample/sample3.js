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
    // 0.1秒以上経っていれば、オーバーラップしているプレイヤーに対してダミーの足場を見えなくするように要求する
    let platforms = $.worldItemReference("dummy_platforms");
    platforms.send("set_invisible", innerPlayers);

    // 経過時間をゼロからカウントし直す
    $.state.elapsedTime = 0;
  } else {
    // 経過時間を更新する
    $.state.elapsedTime = elapsedTime;
  }
});

/*
$.onStart(() => {
});
について

$.onStart は、アイテムの初期化処理を記述する場所です。
スペースが立てられた時、最初に実行されます。

--------

$.state.elapsedTime = 0;
について

$.state は、長期間覚えておきたい情報を置いておく場所です。
任意の名前をドット . でつなぐことで、その名前で情報を保存できます。
このサンプルでは、 elapsedTime という名前で数値の 0 を覚えさせています。

--------

$.onUpdate((dt) => {
});
について

onUpdate は、定期的に実行される処理を指定するための場所です。
端末やその他の環境にもよりますが、1秒間におよそ 20~60回の頻度で実行されます。
dt は前回の onUpdate からの経過時間を表す変数で、秒数を表す数値が渡されます。

--------

let overlaps = $.getOverlaps();
について

$.getOverlaps は OverlapDetectorShape コンポーネントが設定されている GameObject のコライダーに侵入したオブジェクトを取得できる機能です。
コライダーに侵入したオブジェクトとしてプレイヤーとアイテムのいずれかが検知されます。
OverlapDetectorShape コンポーネントがアタッチされている GameObject は、このスクリプトが設定されている ScriptableItem のサブノートである必要があります。
シーンヒエラルキー上で子要素になっているオブジェクトはサブノートとして扱います。

--------

let innerPlayers = [];
について

innerPlayers という名前で情報のリスト（配列）を初期化しています。
このサンプルではオーバーラップしているプレイヤーのリストを取得するつもりで innerPlayer という名前にしています。
この行の時点では誰が入っているかわからないので、空の配列を割り当てています。

--------

for (let i = 0; i < overlaps.length; i++) {
}
について

for は繰り返し処理を行うための構文です。
以下のような書き方をします。

for (初期化処理; 繰り返し条件; 1ループ終了時の処理)

このサンプルの for は以下のようになっています。

初期化処理: let i = 0
i という変数に 0 という数値を割り当てています。
i は、何回繰り返したかを覚えておくための変数として扱っています。

繰り返し条件: i < overlaps.length
繰り返した数が overlaps の長さ未満だった場合としています。
$.getOverlaps から割り当てられている overlaps は配列であるため、overlaps.length で中身の長さを取得できます。

1ループ終了時の処理: i++
i という変数に何回繰り返したかを覚えさせているので、1ループ終了したら繰り返した数を1つ増やしています。
++ は、数値が割り当てられている変数の中身を 1増やす、という構文です。

--------

if (!!overlaps[i].object.playerHandle) {
} else {
}
について

if は条件分岐をするための構文です。
条件は真偽値で判断できるものである必要があります。
真偽値とは、「はい」「いいえ」を表す情報で、スクリプト上では true, false として表現されます。
条件を満たさない場合、別の条件の処理を指定したい場合は else if を用いて記述できます。
同様に、すべての条件を満たさない場合のみ実行したい処理がある場合は else を用いて記述できます。
else if や else は必須ではありません。
以下のように if を最初に記述し、最後 else を記述します。

if (条件) {
} else if (条件) {
} else {
}

このサンプルの場合、条件として !!overlaps[i].object.playerHandle と記述しています。
overlaps 配列は配列ですが、変数名の後に角括弧 [] を記述し、角括弧の中に数値を指定することで配列の中の任意の位置の情報を取得できます。
このサンプルでは i 番目の位置の情報を取得しています。
取得した情報に対してドット . で繋いで任意の情報名（プロパティ）を記述することで、その情報が持っている情報を取得できます。
overlaps[i].object と書かれている場合は以下のようになります。

overlaps という変数配列の i 番目の情報が持っている object という名前の情報を取得

このサンプルでは更に playerHandle をドットで繋いでいるため、 object という名前の情報から更に playerHandle という名前の情報を取得していることになります。
一番左に付いている !! は、取得した情報を真偽値に変換する記述です。

*/