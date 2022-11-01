const { readItem, putItem } = require("./helper");

// the test signal will send a bunch of information. Including ... ClusterARN, ServiceARN and region. So this input is deconstructed to { region }
const recordTestCompletedRegions = async ({ region }) => {
  try {
    // get current test completed regions
    const testCompletedRegions = JSON.parse(
      await readItem("test-completed-regions")
    );
    // see if testCompletedRegions already has this region recorded for completed testing, if so ... then end function prematurely
    if (testCompletedRegions.includes(region)) {
      return;
    }

    // otherwise, update state and put back to dynamodb
    testCompletedRegions.push(region);

    // write back to dynamodb
    await putItem("test-completed-regions", testCompletedRegions);
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
  recordTestCompletedRegions,
};
