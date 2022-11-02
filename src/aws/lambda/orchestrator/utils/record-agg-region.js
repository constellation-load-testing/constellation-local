const { readItem, putItem } = require("./helper");

const recordAggRegion = async ({ region: newAggRegion }) => {
  try {
    // fetches the current regions
    const aggRegions = JSON.parse(await readItem("aggregator-ready-regions"));
    // if already in the list, then end function prematurely
    if (aggRegions.includes(newAggRegion)) {
      return;
    }
    // pushes to aggRegions
    aggRegions.push(newAggRegion);
    console.log({ aggRegions });
    // updates dynamodb with new region
    await putItem("aggregator-ready-regions", aggRegions);
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
  recordAggRegion,
};
