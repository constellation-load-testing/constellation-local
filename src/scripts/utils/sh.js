const childProcess = require("child_process");

const sh = async (cmd) => {
  return new Promise((resolve, reject) => {
    const child = childProcess.exec(cmd);
    // streams the output to the console
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);

    // close and exit are used for redundancy
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(`child process closed with code ${code}`);
      }
      console.log(`child process closed with code ${code}`);
    });

    child.on("exit", (code) => {
      resolve();
      console.log(`child process exited with code ${code}`);
    });

    child.on("error", (err) => {
      reject(`child process exited with error ${err}`);
    });
  });
};

module.exports = {
  sh,
};
