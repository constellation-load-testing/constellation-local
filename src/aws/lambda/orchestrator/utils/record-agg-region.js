const { readItem, putItem } = require("./helper");

const recordAggRegion = async (newAggRegion) => {
  try {
    // fetches the current regions
    const aggRegions = JSON.parse(await readItem("aggregator-ready-regions"));
    // pushes to aggRegions
    aggRegions.push(newAggRegion);
    // updates dynamodb with new region
    await putItem("aggregator-ready-regions", aggRegions);
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
  recordAggRegion,
};
