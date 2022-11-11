# Development Notes

## CLI-Setup

- [ ] Pull the latest `-local` version from `main`
- [ ] Pull the latest `-src` version from `main` and build their container images and push to docker.io. See script below. NOTE: sign in to docker.io with team email: `2208team6@gmail.com` - password is in slack.

```bash
#!/bin/bash

# this stops all docker containers
docker kill $(docker ps -q)
# this removes all docker containers
docker rm $(docker ps -a -q)

# build respective docker images
## build load generator image
docker build -t constellationlt/load-generator:latest ./constellation-load-generator
docker push constellationlt/load-generator:latest

## build aggregator image
docker build -t constellationlt/data-aggregator:latest ./constellation-data-aggregator
docker push constellationlt/data-aggregator:latest
```

Within Constellation-Local

- [ ] After the images have been built, modify the asset names in the remote stack within `-local` to match the link given in docker.io. Note: this is done in two lines in the remote stack `.ts` file.
  - Go to `/constellation-local/src/aws/lib/constellation-remote-stack.ts` and search two places for `image: ecs.ContainerImage.fromRegistry("<YOUR-IMAGE>")`
- [ ] Attend to - with the CLI implementation, this does not need to be located at `/src` anymore.
  - [ ] `config.json` to ensure that you have the correct configurations for the test. IE: Home region, remote region, Duration, VUs per region
  - [ ] `script.js` to ensure that you are running the correct test script.

## CLI

> Developer Notes: As this is not YET an npm package, replace `constellation` with `node ./src/index.js` 🙏🙏
> For all commands add a `--log` flag if you want to see the raw logs

### For the lazy

- End to end: Create config.json & script.js anywhere (doesn't matter)
  - `init --config <path>` -> `run-test --script <path>` -> `teardown-all`
  - OR
  - `init --config <path>` -> `run-test --script <path>` -> `teardown-home` -> `teardown-remote`
- Only Home: Create config.json anywhere (doesn't matter)
  - `init --config <path>` -> `teardown-home`

### Requirements

- [ ] Tell user that for whichever regions they want to test from, ensure that their AWS account with allowed to run in that region for smooth deployment. See - [Managing AWS Regions](https://docs.aws.amazon.com/general/latest/gr/rande-manage.html)
- [ ] Tell user to create a json file to be used as configuration for our deployment. README of source code will tell user how to format this json file. See example format below ~
- [ ] Double check that the home region is a region that has available timestream database AWS service. This includes:
  - `us-east-1`, `us-east-2`, `us-west-2`, `ap-southeast-3`, `ap-southeast-2`, `ap-northeast-1`, `eu-central-1`, `eu-west-1`

```json
{
  "DURATION": 20000,
  "HOME_REGION": "eu-central-1",
  "REMOTE_REGIONS": {
    "ap-northeast-1": 5,
    "us-east-2": 202,
    "ca-central-1": 777,
    "eu-west-1": 5,
    "ap-northeast-3": 5
  }
}
```

### Initialization

- [ ] `constellation init --config <path>`
  - `<path>` is the relative path to the json file in question
  - Background prcesses What does this do?
    - Writes the config file as `config.json` to the correct location (in /src) for our code to read from
    - Bootstraps the required regions
    - Runs the staging bucket check (to hopefully mend bootstrapping errors)
    - Deploys home infrastructure
    - Runs home initialization (without script.js s3 upload)
  - Message to user:
    - Any appropriate status messages to the user upon deployment (can take 50-60s)
    - Now ready to run test via `run-test` command. And refer to documentation (README) on how to create the `.js` file

### Running the Test

- [ ] `constellation run-test --script <path>`

  - `<path>` is the relative path to the test script file in question
  - Whats does this do?
    - Writes the script file as `script.js` to the correct location (in /src)
    - Create s3 bucket (if needed) and uploads script.js to s3
    - Deploy remote regions (in parallel)
  - Message to user:
    - Any appropriate messages to the user while this is running (can take 200-300s)
    - Notify the user that the test is now running. And that can be visualized accordingly. Use `constellation visualize`.
    - Notify that the user is free to teardown the infrastructure at anytime with:
      - `constellation teardown-all`
      - `constellation teardown-home`
      - `constellation teardown-remote`

- [ ] `constellation visualize`

  - @jake to be completed

- [ ] `constellation <other-commands>`
  - To be discussed

### Teardown

- [ ] `constellation teardown-home`

  - Whats does this do?
    - Run home cleanup scripts (clears s3 and timestream)
    - Destroys home region
    - Note: this also teardown timestream database - therefore, data disappears
  - Notify the user that this will also delete the timestream database data

- [ ] `constellation teardown-remote`

  - Whats does this do?
    - Parallel destruction of remote region(s)

- [ ] `constellation teardown-all`
  - What does this do?
    - Parallel destruction of remote region(s)
    - Runs home cleanup scripts
    - Destroys home region
    - Done.
  - Notify the user that this will also delete the timestream database data

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
const recordAggRegion = async ({ region: newAggRegion }) => {
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

### test-reset action type

`test-reset`: has one job. To reset the dynamodb state to initial state. Will be expecting the remote regions as input. It is of type (`test-reset`). At the moment, this is for debugging purposes so we can:

- manually set remote regions for testing
- while resetting "state"

```js
// resets state stored in database, very similar to init script of dynamodb
const resetTestState = async ({ regions }) => {
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
```

# Testing orchestration

> Test on one location

- Home: `"us-west-2"`
- Region: `"us-east-1"`
