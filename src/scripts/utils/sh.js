const childProcess = require("child_process");

/**
 * @param {string} command
 * @param {string} output default true, this determines if output is streamed to the console. set to false if you want to suppress output
 * @returns {Promise<undefined>} 
*/
const sh = async (cmd, output = true) => {
  return new Promise((resolve, reject) => {
    const child = childProcess.exec(cmd);
    // streams the output to the console
    if (output) {
      child.stdout.pipe(process.stdout);
      child.stderr.pipe(process.stderr);
    }

    // close and exit are used for redundancy
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(`child process closed with code ${code}`);
      }
      // console.log(`child process closed with code ${code}`);
    });

    child.on("exit", (code) => {
      resolve();
      // console.log(`child process exited with code ${code}`);
    });

    child.on("error", (err) => {
      reject(`child process exited with error ${err}`);
    });
  });
};

module.exports = {
  sh,
};
