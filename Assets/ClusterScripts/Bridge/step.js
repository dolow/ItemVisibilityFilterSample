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

const moveLimit = 2.0;
const maxMoveRatePerSec = 1.0;
const maxRotateDegreePerSec = 120;
const subNodeName = Object.freeze({
  stepInstance: "Instance",
})

$.onStart(() => {
  const node = getSubNode(subNodeName.stepInstance);
  const pos = node.getPosition();
  $.state.rootInitialTransform = {  
    position: $.getPosition(),
    rotation: $.getRotation(),
  };
  $.state.subNodeInitialTransform = {
    position: pos,
    rotation: node.getRotation(),
    yMax: pos.y + moveLimit,
    yMin: pos.y - moveLimit,
  };
  $.state.type = stepType.normal;
  $.state.moveDirection = 1;
  $.state.moveRate = 0.0;

  $.state.moveSpeed = 0.0;
  $.state.rotateSpeed = 0.0;
});

/**
 * schema
 * stepUpdate = {
 *   enabled: bool;
 *   visiblePlayers: PlayerHandle[];
 *   type: stepType;
 *   initialize: bool;
 * }
 */
$.onReceive((id, body, sender) => {
  switch (id) {
    case messageId.stepUpdate: {
      const node = getSubNode(subNodeName.stepInstance);

      node.setPosition($.state.subNodeInitialTransform.position);
      node.setRotation($.state.subNodeInitialTransform.rotation);
      
      const { enabled, visiblePlayers, type } = body;
      node.setEnabled(enabled);
      $.state.type = type;
      if (enabled) {
        $.setVisiblePlayers(visiblePlayers);
        if (body.initialize) {
          const direction = (Math.floor(Math.random() * 100) % 2 === 0) ? 1 : -1;
          $.state.moveSpeed = (maxMoveRatePerSec / 2) + (Math.random() * maxMoveRatePerSec / 2) * direction;
          $.state.rotateSpeed = (maxRotateDegreePerSec / 2) + (Math.random() * maxRotateDegreePerSec / 2) * direction;
        }
      }
      break;
    }
  }
});

$.onUpdate(dt => {
  $.setPosition($.state.rootInitialTransform.position);
  $.setRotation($.state.rootInitialTransform.rotation);
  
  const node = getSubNode(subNodeName.stepInstance);
  if (!node.getEnabled()) {
    return;
  }

  switch ($.state.type) {
    case stepType.normal: return;
    case stepType.move: {
      const newRate = ($.state.moveDirection > 0)
        ? Math.min($.state.moveRate + $.state.moveSpeed * dt, 1.0)
        : Math.max($.state.moveRate - $.state.moveSpeed * dt, -1.0);

      if (newRate >= 1.0) {
        $.state.moveDirection = -1;
      } else if (newRate <= -1.0) {
        $.state.moveDirection = 1;
      }

      // move by sine wave
      const relY = Math.sin(Math.PI / 2 * newRate) * moveLimit;
      $.state.moveRate = newRate;

      const pos = node.getPosition();
      node.setPosition(new Vector3(pos.x, $.state.subNodeInitialTransform.position.y + relY, pos.z));
      
      break;
    }
    case stepType.rotate: {
      const euler = node.getRotation().createEulerAngles();
      const newY = (euler.y + ($.state.rotateSpeed * dt)) % 360;
      node.setRotation(new Quaternion().setFromEulerAngles(new Vector3(euler.x, newY, euler.z)));
      break;
    }
    default: throw new Error(`invalid step type: ${$.state.type} ${$.state.type === stepType.rotate}`);
  }

});