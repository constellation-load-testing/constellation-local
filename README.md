# Development Notes

`deploy:home`

- Creates home infra
- Auto uploads `script.js` to S3 bucket

`destroy:home`

- Clears S3 and Timestream
- Destroys home infra

# Orchestrator Workflow

DynamoDB will have three items:

- `"aggregator-ready-regions"`
- `"test-completed-regions"`
- `"required-remote-regions"`

## agg-record action type

When an aggregator spins up in a region, it invokes the `orchestrator` lambda with a type (`agg-record`). The information sent by the aggreggator is `{ region }`. On the lambda side, this:

- Records the just-activated aggregator region
- Updates the test start state based on new activated region

> Records the aggregator region

```js
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
```

> then, within `agg-record`, this then determines if the state of `"test-start-state"` can be updated

```js
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
        timestamp: Date.now() + 100 * 1000, // add 100s buffer
      });
    } else {
      return; // the "test-start-state" is left at initial state of: {state: false, timestamp: ""}
    }
  } catch (e) {
    console.log(e);
  }
};
```

## test-init action type

When a test container spins up, it reaches "initial process" and it polls the lambda with an `test-init` event type. In the lambda side, this:

> asks the dynamodb for `"test-start-state"` and examines the `.state` property

```js
const confirmTestState = async () => {
  try {
    const testState = JSON.parse(await readItem("test-start-state"));
    return testState; // raw state can be sent straight back to poller
  } catch (e) {
    console.log(e);
  }
};
```

## test-end action type

When a test reaches "post-process" state, sends a signal to orchestrator lambda with a `test-end` event type to record which regions have completed testing. - **this section is to be developed further for event-driven teardown**

> records in dynamodb `test-completed-regions` with the region that has completed

```js
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
```

> experimental, event driven teardown.
> Then, after test-completed regions have been registered, we set the service desired count to zero, proof of concept required where an external function can control desired count of an external ecs service

```js
// @aws-sdk/client-ecs
// see:
// - https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ecs/classes/updateservicecommand.html
// - https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ecs/interfaces/updateservicecommandinput.html
// - https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ecs/interfaces/updateservicecommandinput.html#service
```
