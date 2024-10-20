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

const SEND_INTERVAL = 0.1;

const subNodeName = Object.freeze({
  respawn: "Respawn",
});

$.onStart(() => {
  $.state.elapsedSec = 0;
  $.state.sendRetry = null;
});

$.onReceive((id, body, sender) => {
  switch (id) {
    case messageId.getChallengerSpawnPosition: {
      const spawnPosition = getSubNode(subNodeName.respawn).getGlobalPosition();
      const error = trySend(sender, messageId.getChallengerSpawnPosition, { spawnPosition });
      switch (error) {
        case errorType.none: break;
        case errorType.retriable: {
          $.state.sendRetry = {
            id: messageId.getChallengerSpawnPosition,
            receiver: sender,
            body: { spawnPosition }
          };
          break;
        }
        case errorType.unretriable: throw new Error("unknown error occured");
      }
      break;
    }
  }
});

$.onUpdate((dt) => {
  Respawn: {
    const overlaps = $.getOverlaps();
    const spawnPosition = getSubNode(subNodeName.respawn).getGlobalPosition();

    for (let i = 0; i < overlaps.length; i++) {
      if (overlaps[i].object.playerHandle) {
        overlaps[i].object.playerHandle.setPosition(spawnPosition);
        break;
      }
    }
  }

  SendRetry: {
    const retry = $.state.sendRetry;
    if (retry && retry.id) {
      const inteval = $.state.elapsedSec + dt;
      if (inteval >= SEND_INTERVAL) {
        $.state.elapsedSec = interval;
        return;
      }
      switch (trySend(retry.receiver, retry.id, retry.body)) {
        case errorType.none: $.state.sendRetry = null; break;
        case errorType.retriable: break;
        case errorType.unretriable: throw new Error("unknown error occured");
      }
    }
  }
});