// not tested
$.onInteract((playerHandle) => {
  // インタラクトした時点プレイヤー
  let unassignedPlayers = $.getPlayersNear($.getPosition(), Infinity);

  // 4人以上いない場合は遊べないものとする
  if (unassignedPlayers.length < 4) {
    return;
  }

  let villagers = [];
  let wolves = [];

  // 必要な人狼の数だけ村人グループから人狼グループに割り当てる
  // このサンプルではゲームバランスは無視して必ず 2人を人狼に設定する
  for (let wolfNeedCount = 2; wolfNeedCount > 0; wolfNeedCount--) {
    // 村人の配列のランダムな位置を抽出する
    let index = Math.floor(Math.random() * unassignedPlayers.length);
    // 抽出された位置にいる村人を人狼グループに加える
    wolves.push(unassignedPlayers[index]);
    // 人狼になった村人を村人グループから削除する
    unassignedPlayers.splice(index, 1);
  }

  // WorldItemReference コンポーネントに登録してある壁の文字列のアイテムを取得する
  const wallWolf = $.worldItemReference("wall_wolf");
  const wallVillager = $.worldItemReference("wall_villager");

  // それぞれの壁の文字が見えるプレイヤーを渡して変えるように要求する
  wallWolf.send("change_visibility", wolves);
  wallVillager.send("change_visibility", villagers);
});