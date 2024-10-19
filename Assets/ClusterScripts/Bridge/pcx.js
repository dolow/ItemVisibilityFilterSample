const playerStorageVersion = 1;
const messageId = Object.freeze({
  updateScore: "update_score",
  requestHighScore: "request_high_score",
  scoreItem: "score_item",
});

function newPlayerStorageData(bestRecord) {
  return { bestRecord, version: playerStorageVersion };
}

let scoreItem = null;

/**
 * schema
 * 
 * Request
 * updateScore = {
 *   time: number:
 * }
 * 
 * Response
 * updateScore = {
 *   highScore: number:
 * }
 * requestHighScore = {
 *   highScore: number;
 * }
 * scoreItem = {
 *   scoreItem: ItemHandle;
 * }
 */
_.onReceive((id, body, sender) => {
  switch (id) {
    case messageId.updateScore: {
      const data = _.getPlayerStorageData();

      let highScore = 1000;
      let lastScore = body.time;

      // sending record
      if (lastScore > 0) {
        if (!data || !data.bestRecord) {
          highScore = lastScore;
        } else if (data.bestRecord > lastScore) {
          highScore = lastScore;
        } else {
          highScore = data.bestRecord;
        }
      } else {
        // or initializing
        if (!data || !data.bestRecord) {
          lastScore = 1000;
          highScore = 1000;
        } else {
          lastScore = 1000;
          highScore = data.bestRecord || 1000;
        }
      }

      const newData = newPlayerStorageData(highScore);
      _.setPlayerStorageData(newData);

      if (scoreItem) {
        _.sendTo(scoreItem, messageId.updateScore, { highScore, lastScore });
      }
      break;
    }
    case messageId.requestHighScore: {
      const data = _.getPlayerStorageData();
      const highScore = (data && data.bestRecord)
        ? data.bestRecord
        : -1;
      
      sender.send(messageId.requestHighScore, { highScore });
      break;
    }
    case messageId.scoreItem: {
      scoreItem = body.scoreItem;
      break;
    }
  }
});