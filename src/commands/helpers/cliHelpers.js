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
  const appendMsg = (message) => {
    const newOraInstanceText =
      oraInstance.text + "\n" + chalkFn(`✨  ${message}`);
    // header.text = newHeader;
    return newOraInstanceText;
  };

  const replaceMsg = (message) => {
    // split by "\n"
    const textArr = oraInstance.text.split("\n");
    // replace last element with message
    textArr[textArr.length - 1] = chalkFn(`✨  ${message}`);
    const newOraInstanceText = textArr.join("\n");
    return newOraInstanceText;
  };

  return {
    appendMsg,
    replaceMsg,
  };
};

module.exports = {
  createOraInstance,
  initMsgManipulation,
};
