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

const BRIDGE_ROWS = 20;
const BRIDGE_COLS = 8;
const SEND_QUEUE_INTERVAL_SEC = 0.1;
const STEP_UPDATE_INTERVAL_SEC = 0.167;
const STEP_SIZE = 1;

const stepTypeRate = Object.freeze({
  [stepType.unknown]: 0,
  [stepType.normal]: 80,
  [stepType.move]: 10,
  [stepType.rotate]: 10,
});

const textState = Object.freeze({
  preparing: 1,
  start: 2,
  challenging: 3,
});
const barState = Object.freeze({
  disenable: 1,
  go: 2,
  wait: 3,
});

const referenceId = Object.freeze({
  initiator: "initiator",
  goal: "goal",
  giveup: "giveup",
  challengerRespawn: "challenger_respawn",
  display: "display",
  bars: "bars",
  audioIdle: "audio_idle",
  audioChallenge: "audio_challenge",
  particleA: "particle_a",
  particleB: "particle_b",
  particleC: "particle_c",
});

const templateId = Object.freeze({
  score: "score",
});

function stepReferenceName(row, col) {
  return `step_${row}_${col}`;
}

function randomStepType() {
  const keys = Object.keys(stepTypeRate);

  let lotCount = 0;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    lotCount += stepTypeRate[key];
  }

  let sample = Math.random() * lotCount;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    sample -= stepTypeRate[key];
    if (sample <= 0) {
      return parseInt(key);
    }
  }

  $.log("randomStepType: you've reached unreachable code");
  // default
  return stepType.normal;
}

/**
 * Generate route to goal
 * @returns {Array.<number[]>} Route in two dimensional array
 */
function generateRoute() {
  const route = [];

  // First row
  const cols = new Array(BRIDGE_COLS).fill(false);
  const enabledIndex = Math.floor(Math.random() * BRIDGE_COLS);
  cols[enabledIndex] = true;
  route[0] = cols;

  let lastEnabledColIndex = enabledIndex;
  
  // Rows after second should be connected to previous row
  for (let row = 1; row < BRIDGE_ROWS; row++) {
    const cols = new Array(BRIDGE_COLS).fill(false);
    const enabledIndex = Math.floor(Math.random() * BRIDGE_COLS);
    
    // If it is not the final row, create steps between previous row and current row if their column is difference
    if (enabledIndex !== lastEnabledColIndex) {
      const bridgeCols = new Array(BRIDGE_COLS).fill(false);

      const { minIndex, maxIndex } = (lastEnabledColIndex < enabledIndex)
        ? { minIndex: lastEnabledColIndex, maxIndex: enabledIndex }
        : { minIndex: enabledIndex, maxIndex: lastEnabledColIndex };

      for (let col = minIndex; col <= maxIndex; col++) {
        bridgeCols[col] = true;
      }

      route[row++] = bridgeCols;

      if (row >= BRIDGE_ROWS) {
        break;
      }
    }

    cols[enabledIndex] = true;
    route[row] = cols;
    lastEnabledColIndex = enabledIndex;
  }

  return route;
}

function clearChallenge() {
  $.state.challenger = null;
  $.state.challengerTime = 0.0;
  $.state.updateStep = { row: 0, col: 0 };

  $.state.sendQueue = $.state.sendQueue.concat([
    {
      receiver: getWorldItemReference(referenceId.display),
      id: messageId.setText,
      body: { textState: textState.start }
    },
    {
      receiver: getWorldItemReference(referenceId.audioIdle),
      id: messageId.setEnable,
      body: { play: true }
    },
    {
      receiver: getWorldItemReference(referenceId.audioChallenge),
      id: messageId.setEnable,
      body: { play: false }
    },
  ]);
}

$.onStart(() => {
  $.state.challenger = null;
  $.state.challengerWait = -1;
  $.state.challengerTime = 0.0;
  $.state.initializedPlayers = [];
  $.state.elapsedSec = 0;
  $.state.challengerSpawnPoint = new Vector3(0, 0, 0);
  
  $.state.route = new Array(BRIDGE_ROWS).fill(new Array(BRIDGE_COLS).fill(false));
  $.state.stepTypes = new Array(BRIDGE_ROWS).fill(new Array(BRIDGE_COLS).fill(stepType.unknown));
  $.state.updateStep = { row: 0, col: 0 };

  $.state.sendQueue = [
    {
      receiver: getWorldItemReference(referenceId.challengerRespawn),
      id: messageId.getChallengerSpawnPosition,
      body: { }
    },
    {
      receiver: getWorldItemReference(referenceId.bars),
      id: messageId.setEnable,
      body: { barState: barState.disenable }
    },
    {
      receiver: getWorldItemReference(referenceId.display),
      id: messageId.setText,
      body: { textState: textState.start }
    },
  ];
});

$.onReceive((id, body, _) => {
  switch (id) {
    case messageId.getChallengerSpawnPosition: {
      $.state.challengerSpawnPoint = body.spawnPosition;
      break;
    }
    case messageId.giveup: clearChallenge(); break;
    case messageId.goal: {
      const challenger = $.state.challenger;

      $.state.sendQueue = $.state.sendQueue.concat([
        {
          receiver: $.state.challenger,
          id: pcxMessageId.updateScore,
          body: { time: $.state.challengerTime },
        },
        {
          receiver: getWorldItemReference(referenceId.particleA),
          id: messageId.setEnable,
          body: { play: true }
        },
        {
          receiver: getWorldItemReference(referenceId.particleB),
          id: messageId.setEnable,
          body: { play: true }
        },
        {
          receiver: getWorldItemReference(referenceId.particleC),
          id: messageId.setEnable,
          body: { play: true }
        },
      ]);

      clearChallenge();
      break;
    }
  }
});

$.onInteract((playerHandle) => {
  if (!!$.state.challenger && $.state.challenger.exists()) {
    return;
  }

  $.state.route = generateRoute();
  $.state.stepTypes = new Array(BRIDGE_ROWS).fill(new Array(BRIDGE_COLS).fill(stepType.unknown));
  $.state.challenger = playerHandle;
  $.state.updateStep = { row: 0, col: 0 };
  $.state.challengerWait = (BRIDGE_ROWS * BRIDGE_COLS * STEP_UPDATE_INTERVAL_SEC) / 4 * 3;

  // Move challenger to his spawn point
  playerHandle.setPosition($.state.challengerSpawnPoint);
  playerHandle.setRotation(new Quaternion().setFromEulerAngles(new Vector3(0, -90, 0)));

  $.getUnityComponent("AudioSource").play();

  const queue = $.state.sendQueue.concat([
    {
      receiver: getWorldItemReference(referenceId.display),
      id: messageId.setText,
      body: { textState: textState.challenging }
    },
    {
      receiver: getWorldItemReference(referenceId.bars),
      id: messageId.setEnable,
      body: { barState: barState.wait }
    },
    {
      receiver: getWorldItemReference(referenceId.audioIdle),
      id: messageId.setEnable,
      body: { play: false }
    },
    {
      receiver: getWorldItemReference(referenceId.audioChallenge),
      id: messageId.setEnable,
      body: { play: true }
    },
  ]);

  if ($.state.initializedPlayers.indexOf(playerHandle.id) === -1) {
    $.setPlayerScript(playerHandle);
    const scoreItem = $.createItem(new WorldItemTemplateId(templateId.score), playerHandle.getPosition().add(new Vector3(0, 5, 0)), playerHandle.getRotation());
    queue.push({
      receiver: playerHandle,
      id: pcxMessageId.scoreItem,
      body: { scoreItem }
    });
    queue.push({
      receiver: scoreItem,
      id: messageId.setEnable,
      body: { time: 0, playerHandle }
    });
    $.state.initializedPlayers = $.state.initializedPlayers.concat([playerHandle.id]);
  }

  $.state.sendQueue = queue;
});


/**
 * Update visibility of steps consequently.
 * Consumes send budget as follows.
 * 1 sec / STEP_UPDATE_INTERVAL_SEC
 * Specification of the send limitation is 10/sec as of the date this script was created.
 * https://docs.cluster.mu/script/classes/ItemHandle.html#send
 */
$.onUpdate((dt) => {
  const interval = $.state.elapsedSec + dt;
  let hasSendBudget = true;

  const challenger = $.state.challenger;

  // Send message in queue prior to step update message
  SendQueue: {
    const queue = $.state.sendQueue;
    if (queue.length <= 0) {
      break SendQueue;
    }

    if (interval < SEND_QUEUE_INTERVAL_SEC) {
      $.state.elapsedSec = interval;
      return;
    }

    $.state.elapsedSec = 0;
    const sendInfo = queue.shift();
    const error = trySend(sendInfo.receiver, sendInfo.id, sendInfo.body);
    switch (error) {
      case errorType.none:        $.state.sendQueue = queue; break;
      case errorType.retriable:   break;
      case errorType.unretriable: throw new Error("unknown error occured");
    }

    hasSendBudget = false;
  }

  UpdateStep: {
    // Returrn if it is shorter than update frequency
    if (interval < STEP_UPDATE_INTERVAL_SEC) {
      $.state.elapsedSec = interval;
      break UpdateStep;
    }

    if (challenger && !challenger.exists()) {
      clearChallenge();
      break UpdateStep;
    }

    if (!hasSendBudget) {
      break UpdateStep;
    }

    $.state.elapsedSec = 0;

    const { row, col } = $.state.updateStep;

    // Send request to change the visibility
    const step = getWorldItemReference(stepReferenceName(row, col));
    if (!step) {
      throw new Error(`step ${row}:${col} must exist`);
    }

    // Get instances of PlayerHandle other than the challenger's one
    // Always retrieve current users in the space since they are joining and leavng
    const players = $.getPlayersNear($.getPosition(), Infinity);
    const visiblePlayers = (!challenger)
      ? players
      : players.filter((player) => player.id !== challenger.id);
    
    const enabled = $.state.route[row][col];

    const stepTypes = $.state.stepTypes;
    let type = stepTypes[row][col];
    let initialize = false;
    if (type === stepType.unknown) {
      initialize = true;
      type = enabled ? randomStepType() : stepType.normal;
      stepTypes[row][col] = type;
      $.state.stepTypes = stepTypes;
    }

    const message = { type, visiblePlayers, enabled, initialize };

    if (DEBUG) {
      message.visiblePlayers = players;
    }

    const error = trySend(step, messageId.stepUpdate, message);
    switch (error) {
      case errorType.none:        break;
      case errorType.retriable:   break UpdateStep;
      case errorType.unretriable: throw new Error("unknown error occured");
    }

    $.state.updateStep = (col + 1 === BRIDGE_COLS)
      ? (row + 1 === BRIDGE_ROWS)
        ? { row: 0, col: 0 }
        : { row: row + 1, col: 0 }
      : { row, col: col + 1 };
  }

  UpdateChallengerCountDown: {
    const challengerWait = $.state.challengerWait;
    if (challengerWait < 0) {
      break UpdateChallengerCountDown;
    }

    const updatedChallengerWait = challengerWait - dt;

    if (updatedChallengerWait > 0) {
      $.state.challengerWait = updatedChallengerWait;
      break UpdateChallengerCountDown;
    }

    if (!challenger) {
      break UpdateChallengerCountDown;
    }
    if (!challenger.exists()) {
      clearChallenge();
      break UpdateChallengerCountDown;
    }

    if (!hasSendBudget) {
      break UpdateChallengerCountDown;
    }

    const error = trySend(getWorldItemReference(referenceId.bars), messageId.setEnable, { barState: barState.go });

    switch (error) {
      case errorType.none: {
        $.state.challengerWait = -1;
        $.state.challengerTime = 0.0;
        break;
      }
      case errorType.retriable: break UpdateChallengerCountDown;
      case errorType.unretriable: throw new Error("unknown error occured");
    }
  }

  UpdateChallengerTime: {
    const challenger = $.state.challenger;
    if (!challenger || !challenger.exists()) {
      break UpdateChallengerTime;
    }

    $.state.challengerTime = $.state.challengerTime + dt;
  }
});