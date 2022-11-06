import * as config from '../../config.json';

/**
 * This function will require straight from config, this function outputs VU count and desired count per region
 * @param region string
 * @returns {vu: number, desiredCount: number}
 */
export const getVUAndDesiredCountByRegion = (region: keyof typeof config.REMOTE_REGIONS): { VU: number, desiredCount: number } => {
  const MAX_VU_PER_CONTAINER = 200;
  const regionVU = config.REMOTE_REGIONS[region];

  // first case: MAX_VU_PER_CONTAINER >= regionVU, thus all VU will be in one container
  if (MAX_VU_PER_CONTAINER >= regionVU) {
    return {
      VU: regionVU,
      desiredCount: 1,
    };
  }

  // second case: MAX_VU_PER_CONTAINER < regionVU, thus we need to split VU EVENLY into multiple containers, will result in minor VU error
  const desiredCount = Math.ceil(regionVU / MAX_VU_PER_CONTAINER);
  const specificVU = Math.ceil(regionVU / desiredCount);

  return {
    VU: specificVU,
    desiredCount: desiredCount
  }
}
