// shared module
const DEBUG = false;

const messageId = Object.freeze({
  stepInitialize: "step_initialize",
  goal: "goal",
  giveup: "giveup",
  getChallengerSpawnPosition: "get_challenger_spawn_position",
  setText: "set_text",
  setEnable: "set_enable",
});

const errorType = Object.freeze({
  none: 0,
  retriable: 1,
  unretriable: 2,
});

const stepType = Object.freeze({
  unknown: 0,
  normal: 1,
  move: 2,
  rotate: 3
});

function getWorldItemReference(referenceName) {
  const ref = $.worldItemReference(referenceName);
  if (!ref.exists()) {
    throw new Error(`world item reference "${referenceName}" must exist`);
  }
  return ref;
}

function getSubNode(subNodeName) {
  const node = $.subNode(subNodeName);
  if (node.getEnabled() === undefined) {
    throw new Error(`subNode "${subNodeName}" must exist`);
  }
  return node
}

function trySend(itemHandle, id, message) {
  try {
    itemHandle.send(id, message);
  } catch (e) {
    $.log(`[${id}]${e}`);
    return (e.rateLimitExceeded)
      ? errorType.retriable
      : errorType.unretriable;
  }
  return errorType.none;
}

// body

const subNodeName = Object.freeze({
  scoreText: "ScoreText",
  achievementText: "AchievementText",
});

function getAchievement(time) {
  if (time < 10.0)  return "神";
  if (time < 30.0)  return "心眼ランナー";
  if (time < 60.0)  return "イキっていいよ";
  if (time < 90.0)  return "パイセンと呼べ";
  if (time < 120.0) return "やりこみ勢";
  if (time < 180.0) return "一人前";
  if (time < 240.0) return "上を目指せる";
  return "完走";
}

$.onStart(() => {
  $.state.player = null;
  $.state.timeReceived = false;
});

/**
 * schema
 * any = {
 *   time: number;
 *   playerHandle: PlayerHandle;
 * }
 */
$.onReceive((id, body, _) => {
  if (!body.time) {
    return;
  }

  const achievement = getAchievement(body.time);
  const timeText = (body.time >= 1000) ? "999.0+" : body.time.toFixed(2); 
  getSubNode(subNodeName.scoreText).setText(timeText);
  getSubNode(subNodeName.achievementText).setText(achievement);
  $.state.player = body.playerHandle;
  $.state.timeReceived = true;
});

$.onUpdate(dt => {
  if (!$.state.timeReceived) {
    return;
  }
  const player = $.state.player;
  if (!player || !player.exists()) {
    $.destroy();
    return;
  }

  const pos = player.getHumanoidBonePosition(HumanoidBone.Head).add(new Vector3(0, 0.5, 0));
  const playerEuler = player.getRotation().createEulerAngles();
  const euler = $.getRotation().createEulerAngles();
  
  $.setPosition(pos);
  $.setRotation(new Quaternion().setFromEulerAngles(new Vector3(euler.x, (playerEuler.y + 180) % 360, euler.z)));
});