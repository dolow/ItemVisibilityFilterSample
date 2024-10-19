// shared module
const DEBUG = true;

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

const auditInterval = 60;
const initializeInterval = 0.1;

const templateId = Object.freeze({
  score: "score",
});

$.onStart(() => {
  $.state.playerHandles = {};
  $.state.auditElapsedSec = 0;
  $.state.initializeElapsedSec = 0;
  $.state.initializeQueue = [];
});

$.onUpdate(dt => {
  Audit: {
    const interval = $.state.auditElapsedSec + dt;
    if (interval < auditInterval) {
      $.state.auditElapsedSec = interval;
      break Audit;
    }

    const playerHandles = $.state.playerHandles;
    const keys = Object.keys(playerHandles);

    for (let i = 0; i < keys.length; i++) {
      if (!playerHandles[keys[i]].playerHandle.exists()) {
        delete playerHandles[keys[i]];
      }
    }

    $.state.playerHandles = playerHandles;
    $.state.elapsedSec = 0;
  }

  AdddInitializePlayerQueue: {
    const overlaps = $.getOverlaps();
    const queue = $.state.initializeQueue;
    const queueLength = queue.length;
    
    for (let i = 0; i < overlaps.length; i++) {
      let playerHandle = null;
      if (overlaps[i].handle?.type === "player") {
        playerHandle = overlaps[i].handle;
      } else {
        playerHandle = overlaps[i].object.playerHandle;
      }

      if (!playerHandle) {
        continue;
      }

      if ($.state.playerHandles[playerHandle.id]) {
        continue;
      }

      let found = false;
      for (let j = 0; j < queue.length; j++) {
        if (queue[j].playerHandle.id === playerHandle.id) {
          found = true;
          break;
        }
      }

      if (!found) {
        queue.push({ step: 0, playerHandle });
      }
    }

    if (queueLength !== queue.length) {
      $.state.initializeQueue = queue;
    }
  }

  InitializeQueue: {
    const interval = $.state.initializeElapsedSec + dt;
    if (interval < initializeInterval) {
      $.state.initializeElapsedSec = interval;
      break InitializeQueue;
    }

    $.state.initializeElapsedSec = 0;

    const queue = $.state.initializeQueue;

    if (queue.length <= 0) {
      break InitializeQueue;
    }

    const playerHandle = queue[0].playerHandle;
    const playerHandles = $.state.playerHandles;

    if (queue[0].step <= 0) {
      try {
        scoreItem = $.createItem(new WorldItemTemplateId(templateId.score), playerHandle.getPosition(), playerHandle.getRotation());
        playerHandles[playerHandle.id] = { playerHandle, scoreItem };
        $.state.playerHandles = playerHandles;
        queue[0].step = 1;
        $.state.initializeQueue = queue;
      } catch(e) {
        break InitializeQueue;
      }
    }

    if (queue[0].step <= 1) {
      const scoreItem = playerHandles[playerHandle.id].scoreItem;
      const error = trySend(scoreItem, messageId.setEnable, { time: 0, playerHandle });
      if (error === errorType.none) {
        queue[0].step = 2;
        $.state.initializeQueue = queue;
      } else {
        $.state.initializeQueue = queue;
        break InitializeQueue;
      }
    }

    if (queue[0].step <= 2) {
      try {
        $.setPlayerScript(playerHandle);
        queue[0].step = 3;
        $.state.initializeQueue = queue;
      } catch (e) {
        $.state.initializeQueue = queue;
        break InitializeQueue;
      }
    }
    
    if (queue[0].step <= 3) {
      try {
        const scoreItem = playerHandles[playerHandle.id].scoreItem;
        trySend(playerHandle, pcxMessageId.scoreItem, { scoreItem });
        queue.shift();
        $.state.initializeQueue = queue;
      } catch (e) {
        $.state.initializeQueue = queue;
        break InitializeQueue;
      }
    }
  }
});