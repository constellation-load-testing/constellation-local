const createOraInstance = (ora, { text, spinner }) => {
  // if process.env.LOG_LEVEL is anything but undefined, then we cannot supress any logs
  // thus return a mocked instance of ora
  if (process.env.LOG_LEVEL === "dev" || process.env.LOG_LEVEL === "raw") {
    console.log(process.env.LOG_LEVEL);
    return {
      start: () => {
        console.log("ora disabled");
        return {
          stopAndPersist: () => {},
          text: text,
        };
      },
    };
  } else {
    const oraInstance = ora({
      text: text,
      spinner: spinner,
    });

    return oraInstance;
  }
};

// chalk.hex("#fddb45")
const initMsgManipulation = (chalkFn, oraInstance) => {
  /**
   * appends a message to the current ora instance
   * @param {string} message
   */
  const appendMsg = (message) => {
    const newOraInstanceText =
      oraInstance.text + "\n" + chalkFn(`✨  ${message}`);
    // header.text = newHeader;
    return newOraInstanceText;
  };

  /**
   * replaceMsg replaces a part of the message with a new message given a supplied keyword
   * @param {string} message whole message, delimited by "\n"
   * @param {string} keyword keyword searched
   */
  const replaceMsg = (message, keyword) => {
    // split by "\n"
    const textArr = oraInstance.text.split("\n");
    let ind = textArr.length - 1;
    if (keyword) {
      // reverse is required incase that home region and remote region are the same, therefore duplicated keyword (also has other utilities)
      // need to revese the array to find the last occurence of the keyword
      // is a shallow copy to prevent mutation
      let tmpTextArr = [...textArr].reverse();
      let tmp = tmpTextArr.findIndex((txt) => txt.includes(keyword));
      // if not -1, then keyword found
      if (tmp !== -1) {
        let reverseInd = tmp;
        // transform to actual unrevesed index for ind
        ind = textArr.length - 1 - reverseInd;
      }
    }
    // replace last element with message
    textArr[ind] = chalkFn(`✨  ${message}`);
    const newOraInstanceText = textArr.join("\n");
    return newOraInstanceText;
  };

  return {
    appendMsg,
    replaceMsg,
  };
};

/**
 * intervaled message manipulation, mutates the header text!
 * @param {appendMsg} function that appends a message to the header
 * @param {replaceMsg} function that replaces a message in the header
 * @param {import("ora").Ora} oraInstance needs to be a started ora instance
 * @param {string} message message to be displayed, apends " (n%)"
 * @param {string} keyword keyword to look for when replacing specific text
 * @param {number} minMS minimum millisecond interval - expected duration
 * @param {number} maxMS maximum millisecond interval - expected duration, Keep this "wide" from minMS
 */
const intervalledMsgManipulation = ({
  appendMsg,
  replaceMsg,
  oraInstance,
  initialMessage,
  keyword,
  minMS,
  maxMS,
}) => {
  // NOTE fn side-effect - initial mutation of passed ora instance!
  oraInstance.text = appendMsg(initialMessage + " (0%)");
  // iife
  const randDurationInMS = ((min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  })(minMS, maxMS);

  const increments = 5;
  const intervalDurationInMS = randDurationInMS / (100 / increments);

  let counter = 0;
  const intervalId = setInterval(() => {
    // randomize +1 or -1
    const rand = Math.random() < 0.5 ? -1 : 1;
    // increment counter
    counter += increments + rand;
    // dont allow counter to exceed 100 - increments
    if (counter > 100 - increments) {
      counter = 100 - increments;
    }

    // previous header message is need not be observed (which decreases coupling)
    const newMessage = `${initialMessage} (${counter}%)`;
    // NOTE fn side-effect - intervalled mutation of passed ora instance!
    oraInstance.text = replaceMsg(newMessage, keyword);
  }, intervalDurationInMS);

  return intervalId;
};

module.exports = {
  createOraInstance,
  initMsgManipulation,
  intervalledMsgManipulation,
};
