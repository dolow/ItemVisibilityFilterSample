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

const textState = Object.freeze({
  preparing: 1,
  start: 2,
  challenging: 3,
});

const texts = Object.freeze({
  preparing: "Preparing...",
  start: "Start Challenge",
  challenging: "Challenging",
});

const subNodeName = Object.freeze({
  text: "Text",
});

/**
 * schema
 * setText = {
 *   textState: textState;
 * }
 */
$.onReceive((id, body, _) => {
  if (id === messageId.setText) {
    const node = getSubNode(subNodeName.text);
    switch (body.textState) {
      case textState.preparing:   node.setText(texts.preparing);   break;
      case textState.start:       node.setText(texts.start);       break;
      case textState.challenging: node.setText(texts.challenging); break;
    }
  }
});