$.onStart(() => {
  // ステートに初期値を入れる
  $.state.addForce = false;
  $.state.grabbingPlayer = null;
  $.state.sendInterval = 0;
  $.state.visibleChanegePlayer = null;
});

$.onGrab((isGrab, isLeftHand, player) => {
  // 掴んだ場合は掴んだプレイヤー情報を保存する
  if (isGrab) {
    $.state.grabbingPlayer = player;
  } else {
    // 手放した場合は次の onPhysicsUpdate で力量を加えるように覚えておく
    $.state.addForce = true;
  }
});

$.onUpdate((dt) => {
  // send 制限用のインターバルを進める
  let interval = $.state.sendInterval;
  if (interval > 0) {
    interval = interval - dt;
  }

  // 必要なインターバル分だけ待ったら処理する
  if (interval <= 0) {
    interval = 0;

    if (!!$.state.visibleChanegePlayer) {
      // 障害物が見えるようにする
      let obstacles = $.worldItemReference("obstacles");
      obstacles.send("set_visible", $.state.visibleChanegePlayer);
      // send したら次の send までインターバルを設ける
      $.state.sendInterval = 0.1;
      // 当たっていたプレイヤー情報は削除する
      $.state.visibleChanegePlayer = null
    }
  }

  $.state.sendInterval = interval;
});

$.onPhysicsUpdate((dt) => {
  // 手放したプレイヤーが居る場合に処理する
  if ($.state.addForce && !!$.state.grabbingPlayer) {
    $.state.addForce = false;

    // 手放したプレイヤーの向いている方向に対してボールを飛ばす処理を行う

    // プレイヤーの向いている方向を取得
    let direction = $.state.grabbingPlayer.getRotation().createEulerAngles();

    // ラジアンに変換
    let radians = direction.y * Math.PI / 180;

    // X, Z 成分を求める
    let x = Math.sin(radians);
    let z = Math.cos(radians);

    // ベクトルの長さ（そこそこ重い）
    let length = 400;

    // ベクトル
    let vec = new Vector3(x * length, 0, z * length)

    // ベクトルを加えてボールを飛ばす
    $.addForce(vec);
  }
});

$.onCollide((collision) => {
  // 当たったプレイヤーを可視性を変更するプレイヤーとして保存
  // この場では可視性の変更を要求する send は行わない
  // send 制限を避けるために onUpdate で等間隔で send する
  if (!!collision.object.playerHandle) {
    $.state.visibleChanegePlayer = collision.object.playerHandle;
  }
});

/*
$.onGrab((isGrab, isLeftHand, player) => {
});
について

$.onGrab は、プレイヤーがアイテムを掴んだり話したりした時の処理を定義する場所です。
isGrab は真偽値で、真(true) の場合は掴んだ時を表し、そうでないときは手放したときを表します。
isLeftHand　は左手で掴んでいるかどうかを真偽値で表していて、player 掴むもしくは手放す操作をしたプレイヤー情報 (PlayerHandle) です。

--------

$.onPhysicsUpdate((dt) => {
});
について

$.onPhysicsUpdate は $.onUpdate と似ており、定期的に実行される処理を記述するための場所です。
onUpdate と違い、物理演算に関する処理を記述できます。
このサンプルでは手に持ったボールを飛ばす必要があるため、onPhysicsUpdate を利用しています。

--------

$.addForce(vec);
について

$.addForce はアイテム自身に物理演算上の力を加えるための機能です。
アイテムに物理演算処理を行いたい場合、MovableItem コンポーネントがアタッチされている必要があります。
$.addForce で加える力は3次元座標(Vector3)で表現されます。
このサンプルでやりたいことは、ボールに対してプレイヤーの向いている方向のベクトルを加えるということなので、プレイヤーの向いている方向からベクトルを計算します。

最初にプレイヤーの向いている方向をオイラー角で取得しています。

let direction = $.state.grabbingPlayer.getRotation().createEulerAngles();

プレイヤーの向いている方向は 3次元座標 (Vector3) で取得されますが、このうち欲しい情報は Y軸の回転のみです。
$.addForce 用のベクトルをつくるために欲しい情報は sine と cosine であるため、それらが計算できるように Y軸の回転をラジアンに変換しています。

let radians = direction.y * Math.PI / 180;

ラジアンに変換することで sine と cosine が計算できるようになるので、ここからボールを飛ばす方向の X, Z 座標を計算します。

let x = Math.sin(radians);
let z = Math.cos(radians);

計算された X, Z 座標は正規化された値であるため、それなりの距離を飛ばせるようにベクトルを加えています。

let length = 400;
let vec = new Vector3(x * length, 0, z * length)

--------

$.onCollide((collision) => {
});
について

$.onCollide は、アイテム自身が何かと衝突した時に実行される処理を記述する場所です。
collision には衝突したオブジェクトの情報が渡ってきます。

*/