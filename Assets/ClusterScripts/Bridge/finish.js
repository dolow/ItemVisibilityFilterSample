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

const SEND_INTERVAL = 0.1;

const referenceId = Object.freeze({
  initiator: "initiator",
  goal: "goal",
});

$.onStart(() => {
  $.state.elapsedSec = 0;
  $.state.sendRetry = null;
});

$.onInteract((playerHandle) => {
  const id = ($.id === getWorldItemReference(referenceId.goal).id)
    ? messageId.goal
    : messageId.giveup;


  $.getUnityComponent("AudioSource").play();

  const initiator = getWorldItemReference(referenceId.initiator);
  switch (trySend(initiator, id, { })) {
    case errorType.none: playerHandle.respawn(); break;
    case errorType.retriable: {
      $.state.sendRetry = {
        id,
        receiver: initiator,
        body: {
          playerHandle,
        }
      };
      break;
    }
    case errorType.unretriable: throw new Error("unknown error occured");
  }
});

$.onUpdate(dt => {
  const retry = $.state.sendRetry;
  if (retry && retry.id) {
    const inteval = $.state.elapsedSec + dt;
    if (inteval >= SEND_INTERVAL) {
      $.state.elapsedSec = interval;
      return;
    }
    switch (trySend(retry.receiver, retry.id, retry.body)) {
      case errorType.none:{
        $.state.sendRetry = null;
        retry.body.playerHandle.respawn();
        break;
      }
      case errorType.retriable: break;
      case errorType.unretriable: throw new Error("unknown error occured");
    }
  }
});
