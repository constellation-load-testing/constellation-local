![asset2copy-modified](https://user-images.githubusercontent.com/80292641/207950581-5621692f-e251-48ca-a8dd-ec7c539971f2.png)

> Constellation is an open-source, serverless, end-to-end framework that aims to simplify the challenges of geographically distributed API load testing.

# Demo

![init_constellation_cropped](https://user-images.githubusercontent.com/80292641/205150068-16345c0d-91ec-4af3-8f01-7bdd4f958026.gif)

# Constellation requires:

- an [AWS account](https://portal.aws.amazon.com/gp/aws/developer/registration/index.html?nc2=h_ct&src=default)
- `npm` [installed](https://www.npmjs.com/get-npm)
- AWS CLI [installed](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) and configured
- [AWS named profile](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html)
- AWS CDK command-line tool [installed](https://docs.aws.amazon.com/cdk/latest/guide/cli.html)

# Installation

- run `npm i -g constellation-load-testing`
- run `constellation help` to see a list of available commands

# Quick Start

```bash
# <path> references path to configuration
$ constellation init --config <path>

# <path> references path to test script
$ constellation run-test --script <path>

# view test results
$ constellation run-visualizer

# teardown all provisioned infrastructure
$ constellation teardown-all
```

- For the config file contents, see the [config](#configuration-file) section.
- For the script file contents, see the [scripting](#scripting) section.

# Commands

<!-- commands -->

- [`constellation check`](#constellation-check)
- [`constellation init`](#constellation-init)
- [`constellation run-test`](#constellation-run-test)
- [`constellation run-visualizer`](#constellation-run-visualizer)
- [`constellation teardown-all`](#constellation-teardown-all)
- [`constellation teardown-home`](#constellation-teardown-home)
- [`constellation teardown-remote`](#constellation-teardown-remote)

## `constellation check`

An optional command which validates your AWS account against the required environments the Constellation Infrastructure is to be deployed on.

In the background, Constellation's automated deployment heavily relies on the AWS CDK. This can be a source of issues when an AWS account is choosing to deploy to regions that have not yet been [bootstrapped](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html) in the past.

Prior to deploying to specific region(s), it is best to ensure that the AWS account has access to that specific region. See [Managing AWS Regions](https://docs.aws.amazon.com/general/latest/gr/rande-manage.html) for more details.

```
USAGE
  $ constellation check --config <path>

EXAMPLE
  $ constellation check --config ./config.json

NOTE
  RECOMMENDED on first usage of Constellation OR deployment to new regions
```

See the [config](#configuration-file) section to see how the configuration file should be formatted.

## `constellation init`

Validates the user configuration file and deploys the home infrastructure.

```
USAGE
  $ constellation init --config <path>

EXAMPLE
  $ constellation init --config ./config.json

NOTE
  Must be run prior to the `run-test` command
```

![init_constellation_cropped](https://user-images.githubusercontent.com/80292641/205150068-16345c0d-91ec-4af3-8f01-7bdd4f958026.gif)

## `constellation run-test`

Deploys the remote infrastructure and conducts geo-distributed load testing with the targeted test script

```
USAGE
  $ constellation run-test --script <path>

EXAMPLE
  $ constellation run-test --script ./script.js

NOTE
  Must be run after the `init` command
```

![run_test_constellation_cropped](https://user-images.githubusercontent.com/80292641/205150151-7b2cbcb8-33ff-4193-8a26-8375e1b52b7d.gif)

## `constellation run-visualizer`

Displays your test results in localhost:3002

```
USAGE
  $ constellation run-visualizer
```

![run_visualizer gif](https://github.com/constellation-load-testing/constellation-visualizer/blob/main/run_visualizer.gif)

## `constellation teardown-all`

Tearsdown all the deployed infrastructure used for the test.

```
USAGE
  $ constellation teardown-all

NOTE
  Can be run at anytime during the deployment stage. 
  This will remove the timestream database storing test-results (if any). 
  Run `teardown-remote` to selectively remove remote infrastructure only.
```

![teardown_all_cropped](https://user-images.githubusercontent.com/80292641/205150283-a6868792-f647-45b9-be0d-386af78f34d8.gif)

## `constellation teardown-remote`

Specifically tears down remote region infrastructure only

```
USAGE
  $ constellation teardown-remote

NOTE
  Used to minimize deployed infrastructure following a test while preserving test-results stored at the database.
  Remote containers are automatically stopped after testing, remote regions will not generate cost even if this command is not run.  
```

![remote_teardown_cropped](https://user-images.githubusercontent.com/80292641/205150254-dd042e40-68ea-4a83-9670-ae1060b8ee9c.gif)

## `constellation teardown-home`

Specifically teardown home region infrastructure only. Useful when only the [constellation init](#constellation-init) command has been run. Note that this will remove the timestream database storing test results (if any).

```
USAGE
  $ constellation teardown-home

NOTE
  Used to teardown home region only.
```

![home_teardown_cropped](https://user-images.githubusercontent.com/80292641/205150222-7f1ff801-f7d4-40cf-bc9d-5fb7b7bf2e30.gif)

# Configuration file

## Example

> Within a .json file

```json
{
  "DURATION": 20000,
  "HOME_REGION": "eu-central-1",
  "REMOTE_REGIONS": {
    "ap-northeast-1": 5000,
    "us-east-2": 2020,
    "ca-central-1": 777,
    "eu-west-1": 50,
    "ap-northeast-3": 190
  }
}
```

## Details

The configuration file is written in JSON format and consists of three section:

- `"DURATION"` - duration of test (in ms)
- `"HOME_REGION"` - location of home infrastructure. See [HOME_REGION](#home_region) section for valid entries.
- `"REMOTE_REGIONS"` - remote regions involved in the test and the associated number of virtual users for each region. See [REMOTE_REGIONS](#remote_regions) section for valid entries.

> Tip: Use the [`constellation check`](#constellation-check) command to quickly check the validity of your configuration file.

### HOME_REGION

The `HOME_REGION` must be a region that has the Timestream database AWS service available.

**As of Decemeber 2022 this includes**:
|||||
|--|--|--|--|
|`us-east-1`|`us-east-2`|`us-west-2`|`ap-southeast-3`|
|`ap-southeast-2`|`ap-northeast-1`|`eu-central-1`|`eu-west-1`|

> See [Timestream Pricing](https://aws.amazon.com/timestream/pricing/) for a current list of available regions.

### REMOTE_REGIONS

The `REMOTE_REGION` contains key-value pairs. Keys are valid AWS regions and values are the number of virtual users desired from each region.

Example:

```json
{
  ...
  "REMOTE_REGIONS": {
    // region: vu-count
    "ap-northeast-1": 5000,
    "us-east-2": 2020,
    "ca-central-1": 777,
    "eu-west-1": 50,
    "ap-northeast-3": 190
  }
}
```

# Scripting

## Example

```js
const sleep = async (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

// representative user behavior
export const script = async (axiosInstance) => {
  await axiosInstance.get("https://openlibrary.org/works/OL45883W.json");
  await sleep(5000); // 5s sleep

  await axiosInstance.get("https://openlibrary.org/isbn/9780140328721.json");
  await sleep(2000); // 2s sleep
};
```

## Details

The script file is a JavaScript file with a single function export **named** `script`. This function has a single argument which is an instance of Axios.

Contellation load generation uses Axios to faciliate the HTTP API calls. As such, any axios methods can be used to reflect user behavior in the test script (ie: `.get`, `.post`, `.put`, etc). See the [Axios documentation](https://axios-http.com/docs/intro) for more details.

Furthermore, the test script is essentially just a nodejs script. As such, user-defined functions can be freely used in the test script to aid in translating user behavior to raw API calls. 

> WARNING: Computation heavy functions should not be implemented here as they will block the load generators thread. Follow testing best practices of strictly defining actions. Take, for example, a test involving making a request, processing the response, then making another request based on the processed results. Do not perform the processing within the script, instead strictly define what the processed data should be and use that to make the second request.

> Note: If any other fetching API is used apart from the parameter passed to the script (ie: `fetch`, or a new instance of `axios`), they will be executed but the responses will not be captured.

## Comprehensive Example:

In this example, we demonstrate that the user can use Promise methods to reflect user behavior.

```javascript
const sleep = async (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const script = async (axiosInstance) => {
  // user navigates to google
  await axiosInstance.get("https://google.com");
  // search simulated to take 1s
  await sleep(1000);

  // reaches page and user waits until the two resources have been fetched
  const p1 = await axiosInstance.get(
    "https://covers.openlibrary.org/b/id/6121771-S.jpg"
  );
  const p2 = await axiosInstance.get(
    "https://openlibrary.org/works/OL45883W.json"
  );

  await Promise.allSettled([p1, p2]);

  // more api calls for user behavior
};
```


