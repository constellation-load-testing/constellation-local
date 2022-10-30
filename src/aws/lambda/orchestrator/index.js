/**
 * This is the lambda fn to orchestrate the test execution
 * This lambda interacts with dynamodb to:
 * - Record the regions with running data aggregator service
 * - Determines if and when tests can start executing
 */

const testConfirmation = () => {
  // is true 20% of the time
  const isTrue = Math.random() < 0.2;

  const response = {
    statusCode: 200,
    body: { status: isTrue },
  };

  return response;
};

exports.handler = async (event) => {
  console.log(event);

  const { type } = event;

  if (type === "test-init") {
    return testConfirmation();
  } else {
    return { statusCode: 400, body: "Bad request" };
  }
};
