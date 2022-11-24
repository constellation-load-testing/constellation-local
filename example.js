"use strict";

const sleep = async (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const script = async (axiosInstance) => {
  await axiosInstance.get("https://api.publicapis.org/health");
  await sleep(2000);
  await axiosInstance.get("https://api.publicapis.org/health");
  await sleep(2000);
};
