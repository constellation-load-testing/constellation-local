![dark background](https://user-images.githubusercontent.com/80292641/204396033-16f9d275-2957-43d2-bf6f-a279b3b258c9.png)

Constellation is an open-source, serverless, end-to-end framework that aims to simplify the challenges of geographically distributed API load testing.

## Constellation requires:

- an [AWS account](https://portal.aws.amazon.com/gp/aws/developer/registration/index.html?nc2=h_ct&src=default)
- `npm` [installed](https://www.npmjs.com/get-npm)
- AWS CLI [installed](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) and configured
- [AWS named profile](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html)
- AWS CDK command-line tool [installed](https://docs.aws.amazon.com/cdk/latest/guide/cli.html)

## Installation

- run `npm install -g constellation-load-testing`
- run `constellation help` to see a list of available commands

## Usage

> For all commands add a `--log` flag if you want to see the raw AWS logs

### Quick Start

- Full Test Deployment: Create a configuration JSON file and a script JavaScript file
  - `constellation init --config <path>` -> `constellation run-test --script <path>` -> `constellation teardown-all`
  - OR
  - `constellation init --config <path>` -> `constellation run-test --script <path>` -> `constellation teardown-remote` -> `constellation teardown-home`
- Home Only Deployment: Create a configuration JSON file
  - `constellation init --config <path>` -> `constellation teardown-home`

### Test Setup

- [ ] Ensure that the AWS account is allowed to run in the desired regions for smooth deployment. 
  - See - [Managing AWS Regions](https://docs.aws.amazon.com/general/latest/gr/rande-manage.html)
- [ ] Create a JSON file to be used as configuration for the deployment. 
  - The JSON file requires three properties, `DURATION` (in milliseconds), `HOME_REGION`, and `REMOTE_REGIONS`
  - The `Home_REGION` must be a region that has the Timestream database AWS service available. This includes:
  - `us-east-1`, `us-east-2`, `us-west-2`, `ap-southeast-3`, `ap-southeast-2`, `ap-northeast-1`, `eu-central-1`, `eu-west-1`
  - The `REMOTE_REGIONS` value is an object with region names as properties and the number of desired Virtual Users for that region as values
  - See example format below:
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
- [ ] Create a JavaScript file to be used as the script for the Virtual Users
  - The script file is a fully functional JavaScript file with a single function export
  - Within the `script` function HTTP calls are made using an Axios instance, refer to the [Axios](https://axios-http.com/docs/intro) documentation
  - Additional functionality can be implemented for use by the `script` function
    - As an example the `sleep` function is used to pause between commands in the script
    - While calls can be made using a newly imported instance of Axios or the built in Node.js `http` module they will not be recorded to the database
  - See example format below:
```javascript
const sleep = async (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const script = async (axiosInstance) => {
  await axiosInstance.get('https://google.com');
  await sleep(1000);
};
```

### Initialization

- [ ] `constellation init --config <path>`
  - `<path>` is the relative path to the json file in question
  - What does this do?
    - Writes the config file as `config.json` to the correct location within the Constellation installation
    - AWS bootstraps the required regions
    - Runs the staging bucket check (to mend any bootstrapping errors)
    - Deploys home infrastructure
    - Runs home initialization
  - Message to user:
    - Any appropriate status messages to the user upon deployment (can take 50-60s)
    - Now ready to run test via `run-test` command. And refer to documentation (README) on how to create the `.js` file
    
![init_constellation_cropped](https://user-images.githubusercontent.com/80292641/205150068-16345c0d-91ec-4af3-8f01-7bdd4f958026.gif)

### Running the Test

- [ ] `constellation run-test --script <path>`

  - `<path>` is the relative path to the test script file in question
  - What does this do?
    - Writes the script file as `script.js` to the correct location within the Constellation installation
    - Create an S3 bucket and uploads script.js to it
    - Deploys remote regions (in parallel)
  - Message to user:
    - Any appropriate messages to the user while this is running (can take 200-300s)
    - Notify the user that the test is now running and that can be visualized accordingly using `constellation run-visualizer`.
    - Notify that the user is free to teardown the infrastructure at anytime with:
      - `constellation teardown-all`
      - `constellation teardown-home`
      - `constellation teardown-remote`

![run_test_constellation_cropped](https://user-images.githubusercontent.com/80292641/205150151-7b2cbcb8-33ff-4193-8a26-8375e1b52b7d.gif)

### Visualize Results

- [ ] `constellation run-visualizer`
  - What does this do?
    - Runs visualizer app on http://localhost:3002/ 
![run_visualizer gif](https://github.com/constellation-load-testing/constellation-visualizer/blob/main/run_visualizer.gif)

### Teardown

- [ ] `constellation teardown-remote`
  - Whats does this do?
    - Parallel destruction of remote region(s)
![remote_teardown_cropped](https://user-images.githubusercontent.com/80292641/205150254-dd042e40-68ea-4a83-9670-ae1060b8ee9c.gif)
- [ ] `constellation teardown-home`
  - Whats does this do?
    - Run home cleanup scripts (clears s3 and timestream)
    - Destroys home region
    - Note: this includes removal of the Timestream database
  - Notify the user that this will also delete the timestream database data
![home_teardown_cropped](https://user-images.githubusercontent.com/80292641/205150222-7f1ff801-f7d4-40cf-bc9d-5fb7b7bf2e30.gif)
- [ ] `constellation teardown-all`
  - What does this do?
    - Parallel destruction of remote region(s)
    - Runs home cleanup scripts
    - Destroys home region
    - Done.
  - Notify the user that this will also delete the timestream database data
![teardown_all_cropped](https://user-images.githubusercontent.com/80292641/205150283-a6868792-f647-45b9-be0d-386af78f34d8.gif)

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
