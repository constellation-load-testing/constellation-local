const { readItem, putItem } = require("./helper");

const updateTestState = async () => {
  try {
    // for guard clause, need to see if "test-start-state" already has a true state. If so, then skip rest of function
    const testState = JSON.parse(await readItem("test-start-state"));
    if (testState.state === true) {
      return;
    }

    // get all aggregated regions
    const aggRegions = JSON.parse(await readItem("aggregator-ready-regions"));
    // get all require remote regions
    const reqRemRegions = JSON.parse(await readItem("required-remote-regions"));
    // compare contents of aggregator-ready-regions and required-remote-regions. reqRemRegions will have more unique regions, therefore will be the caller of `.every`
    const isValid = reqRemRegions.every((region) =>
      aggRegions.includes(region)
    );

    // if true, update "test-start-state", else do nothing
    if (isValid) {
      await putItem("test-start-state", {
        state: true,
        timestamp: Date.now() + 50 * 1000, // add 50s buffer
      });
    } else {
      return; // the "test-start-state" is left at initial state of: {state: false, timestamp: ""}
    }
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
  updateTestState,
};
