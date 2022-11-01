const { readItem, putItem } = require("./helper");

// resets state stored in database, very similar to init script of dynamodb
const resetTestState = async ({ regions: remoteRegions }) => {
  try {
    // reset agg regions
    await putItem("aggregator-ready-regions", []);
    // reset completed regions
    await putItem("test-completed-regions", []);
    // reset regions to new regions
    await putItem("required-remote-regions", remoteRegions);
    // reset test start state
    await putItem("test-start-state", {
      state: false,
      timestamp: "",
    });
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
  resetTestState,
};
