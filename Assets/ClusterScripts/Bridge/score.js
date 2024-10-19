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

const pcxMessageId = Object.freeze({
  updateScore: "update_score",
  scoreItem: "score_item",
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

function trySend(handle, id, message) {
  try {
    handle.send(id, message);
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
  lastScoreText: "LastScoreText",
  highScoreText: "HighScoreText",
  achievementText: "AchievementText",

  pull: "Pull",
  lastScore: "LastScore",
  achievement: "Achievement",
  highScore: "HighScore",
});

const defaultAchievement = "ランナー";
const achievements = {
  10: "神",
  30: "心眼ランナー",
  60: "イキれるレベル",
  90: "パイセンと呼べ",
  120: "やりこみ勢",
  180: "一人前",
  240: "上を目指せる",
};

function getAchievement(time) {
  const keys = Object.keys(achievements);
  for (let i = 0; i < keys.length; i++) {
    if (time < parseInt(keys[i])) {
      return achievements[keys[i]];
    }
  }
  return defaultAchievement;
}

$.onStart(() => {
  $.state.player = null;
  $.state.timeReceived = false;
});

$.onInteract(ph => {
  const pull = getSubNode(subNodeName.pull);
  const folded = pull.getEnabled();
  pull.setEnabled(!folded);
  getSubNode(subNodeName.lastScore).setEnabled(folded);
  getSubNode(subNodeName.highScore).setEnabled(folded);
  getSubNode(subNodeName.achievement).setEnabled(folded);
});

/**
 * schema
 * setEnable = {
 *   time: number;
 *   playerHandle: PlayerHandle;
 * }
 * updateScore = {
 *   highScore: number;
 *   lastScore: number;
 * }
 */
$.onReceive((id, body, _) => {
  switch (id) {
    case messageId.setEnable: {
      $.state.player = body.playerHandle;
      $.state.timeReceived = true;

      body.playerHandle.send(pcxMessageId.updateScore, { time: body.time });
      break;
    }
    case pcxMessageId.updateScore: {
      const achievement = getAchievement(body.highScore);
      const lastScoreText = (body.lastScore >= 1000) ? "999.0+" : body.lastScore.toFixed(2);
      const highScoreText = (body.highScore >= 1000) ? "999.0+" : body.highScore.toFixed(2);
      getSubNode(subNodeName.lastScoreText).setText(lastScoreText);
      getSubNode(subNodeName.highScoreText).setText(highScoreText);
      getSubNode(subNodeName.achievementText).setText(achievement);
      break;
    }
  }
}, { item: true, player: true });

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