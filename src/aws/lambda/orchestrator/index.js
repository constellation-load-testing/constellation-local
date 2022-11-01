/**
 * This is the lambda fn to orchestrate the test execution
 * This lambda interacts with dynamodb to:
 * - Record the regions with running data aggregator service
 * - Determines if and when tests can start executing
 * - Records the regions that have completed the test
 * DynamoDB Schema:
 * - active-regions (empty [] to start)
 * - completed-regions (empty [] to start)
 * - required-remote-regions (from user-defined config)
 */

const { confirmTestState } = require("./utils/confirm-test-state");
const { updateTestState } = require("./utils/update-test-state");
const { recordAggRegion } = require("./utils/record-agg-region");
const {
  recordTestCompletedRegions,
} = require("./utils/record-test-completed-regions");
const { resetTestState } = require("./utils/reset-test-state");

/**
 * Test confirmation - this is the polled fn that determines if a test is able to start. This function will read `aggregator-ready-regions`.
 */

const lambdaFn = async (event) => {
  console.log(event);
  const { type, region } = event;

  if (type === "test-init") {
    // test state is fetched from dynamodb
    return await confirmTestState();
  } else if (type === "agg-record") {
    // record aggregator region
    await recordAggRegion(event);
    // update test state given new aggregator region
    await updateTestState();
    return { statusCode: 200 };
  } else if (type === "test-end") {
    // record region which have completed the test
    // event will have other info, but for now, expect just the region
    await recordTestCompletedRegions(event);
    return { statusCode: 200 };
  } else if (type === "test-reset") {
    // reset test state
    await resetTestState(event);
    return { statusCode: 200 };
  } else {
    return { statusCode: 400, body: "Unrecognized event type" };
  }
};

//  module.exports = { lambdaFn }; // for testing in express
exports.handler = lambdaFn;
