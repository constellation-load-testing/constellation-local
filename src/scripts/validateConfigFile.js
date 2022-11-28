const AWS_REMOTE_REGIONS = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "af-south-1",
  "ap-east-1",
  "ap-south-1",
  "ap-south-2",
  "ap-southeast-3",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-3",
  "ap-northeast-2",
  "ap-northeast-1",
  "ca-central-1",
  "eu-central-2",
  "eu-central-1",
  "eu-west-3",
  "eu-west-2",
  "eu-west-1",
  "eu-north-1",
  "eu-south-2",
  "eu-south-1",
  "me-south-1",
  "me-central-1",
  "sa-east-1",
];

// controlled by timestream regions
const AWS_HOME_REGIONS = [
  "us-east-1",
  "us-east-2",
  "us-west-2",
  "ap-southeast-2",
  "ap-northeast-1",
  "eu-central-1",
  "eu-west-1",
];

/**
 * @object config file json body
 * @returns object: {isValid, message} - {true, ""} if config file is valid - ie: no msg, {false, msg} otherwise
 */
const validateConfigFile = (config) => {
  // check if all L1 properties are present on the config file
  const { isValid: areL1KeysValid } = validateConfigL1Keys(config);
  if (!areL1KeysValid) {
    return validateConfigL1Keys(config);
  }

  // check if duration is valid
  const { isValid: isDurationValid } = validateDuration(config);
  if (!isDurationValid) {
    return validateDuration(config);
  }

  // check if home region is valid
  const { isValid: isHomeRegionValid } = validateHomeRegion(config);
  if (!isHomeRegionValid) {
    return validateHomeRegion(config);
  }

  // check if remote region is valid
  const { isValid: areRemoteRegionsValid } = validateRemoteRegions(config);
  if (!areRemoteRegionsValid) {
    return validateRemoteRegions(config);
  }

  // END
  return { isValid: true, message: "" };
};

const validateConfigL1Keys = (config) => {
  const { HOME_REGION, REMOTE_REGIONS, DURATION } = config;
  let message = "";

  if (HOME_REGION === undefined) {
    message = 'Config file must have a "HOME_REGION" entry';
  } else if (REMOTE_REGIONS === undefined) {
    message = 'Config file must have "REMOTE_REGIONS" entry';
  } else if (DURATION === undefined) {
    message = 'Config file must have a "DURATION" entry';
  }

  return { isValid: message === "", message };
};

const validateDuration = (config) => {
  const { DURATION } = config;
  let message = "";

  // see if value is >=1000 (must be atleast 1000ms(1s) test)
  if (DURATION < 1000) {
    message = `Config file must have a duration greater than 1000ms (1 second)`;
  }

  return { isValid: message === "", message };
};

const validateHomeRegion = (config) => {
  const { HOME_REGION } = config;
  let message = "";

  // Home region must be included in AWS_HOME_REGIONS
  if (!AWS_HOME_REGIONS.includes(HOME_REGION)) {
    const validHomeRegionsString = AWS_HOME_REGIONS.join(", ");
    message = `Config file specifies \"HOME_REGION\" which cannot deploy all components, please choose from one of the following:\n    :: ${validHomeRegionsString}`;
  }

  return { isValid: message === "", message };
};

const validateRemoteRegions = (config) => {
  const { REMOTE_REGIONS } = config;

  const remoteRegionsArr = Object.keys(REMOTE_REGIONS);
  // -- check for non-zero remote region length
  if (remoteRegionsArr.length === 0) {
    return {
      isValid: false,
      message: `Config file must have at least one remote region`,
    };
  }

  // -- check for non-repeating
  const setRemoteRegionsArr = Array.from(new Set(remoteRegionsArr));
  if (remoteRegionsArr.length !== setRemoteRegionsArr.length) {
    const message = `Config file contains repeated remote regions`;
    return { isValid: false, message };
  }

  // -- check all regions valid
  const invalidRegions = remoteRegionsArr.filter((region) => {
    return !AWS_REMOTE_REGIONS.includes(region);
  });
  if (invalidRegions.length !== 0) {
    const invalidRegionsStr = invalidRegions.join(", ");
    const message = `Config file contains invalid remote regions entered: ${invalidRegionsStr}`;
    return { isValid: false, message };
  }

  // -- check for >0 VUs
  const zeroVURemoteRegions = Object.entries(REMOTE_REGIONS)
    .filter((keyValPair) => {
      const [_, numVU] = keyValPair;
      return numVU <= 0;
    })
    .map((pair) => pair[0]);
  if (zeroVURemoteRegions.length !== 0) {
    const zeroVURemoteRegionsStr = zeroVURemoteRegions.join(", ");
    const message = `Config file contains remote regions with 0 or less VUs: ${zeroVURemoteRegionsStr}`;
    return { isValid: false, message };
  }

  // else, all OK
  return { isValid: true, message: "" };
};

module.exports = validateConfigFile;
