const { readItem, putItem } = require("./helper");

const confirmTestState = async () => {
  try {
    const testState = JSON.parse(await readItem("test-start-state"));
    return testState; // raw state can be sent straight back to poller
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
  confirmTestState,
};
