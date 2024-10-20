// shared module
const DEBUG = false;

const messageId = Object.freeze({
  stepUpdate: "step_update",
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

const barState = Object.freeze({
  disenable: 1,
  go: 2,
  wait: 3,
});

const subNodeName = Object.freeze({
  goBar: "GoBar",
  waitBar: "WaitBar",
});


/**
 * schema
 * setEnable = {
 *   barState: barState;
 * }
 */
$.onReceive((id, body, _) => {
  switch (id) {
    case messageId.setEnable: {
      switch (body.barState) {
        case barState.disenable: {
          getSubNode(subNodeName.goBar).setEnabled(false);
          getSubNode(subNodeName.waitBar).setEnabled(false);
          break;
        }
        case barState.go: {
          getSubNode(subNodeName.goBar).setEnabled(true);
          getSubNode(subNodeName.waitBar).setEnabled(false);
          $.getUnityComponent("AudioSource").play();
          break;
        }
        case barState.wait: {
          getSubNode(subNodeName.goBar).setEnabled(false);
          getSubNode(subNodeName.waitBar).setEnabled(true);
          break;
        }
      }
    }
  }
});