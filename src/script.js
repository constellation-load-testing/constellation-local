/**
 * This will be run in a node.js environment
 * - This just run a sleep function for 5 seconds
 * */

const axios = require("axios");
const DNS = process.env.DNS;

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const run = async () => {
  console.log("Intial sleep for 5 seconds to wait for the server to start");
  await sleep(5000);
  console.log({
    message: "Starting test-sleep, making DNS /fromscript request to",
    DNS,
  });
  const response = await axios.get(`http://${DNS}/fromscript`);
  console.log({ message: "DNS response", response: response.data });
  await sleep(5000);
  return { statusCode: 200, body: "Done" };
};

run();

// import http from "k6/http";
// import { sleep } from "k6";

// export default function () {
//   http.get("https://test.k6.io");
//   sleep(1);
// }

// // NOTE: from deployment
