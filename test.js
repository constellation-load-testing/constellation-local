"use strict";

const sleep = async (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const script = async (axiosInstance) => {
  await axiosInstance.post(
    "https://mockbin.org/bin/19b03afc-cdb8-4ddd-b545-840f10851db0",
    {
      timeStamp: Date.now(),
    }
  );
  await sleep(500);
  await axiosInstance.get(
    "https://mockbin.org/bin/19b03afc-cdb8-4ddd-b545-840f10851db0"
  );
  await sleep(500);
};
