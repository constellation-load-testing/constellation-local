const fs = require("fs").promises;
const path = require("path");
const { devLog } = require("./loggers.js");

const readWriteConfigFile = async (configPath) => {
  // get the contents of the file first from configPath
  const configFile = await fs.readFile(configPath, "utf8");
  devLog(`File fetched from: ${configPath}`);

  // write the file to appropriate path
  await fs.writeFile(
    path.join(__dirname, "../config.json"),
    configFile,
    "utf8"
  );
  devLog(
    `Config file written to: ${path.join(__dirname, "..", "config.json")}`
  );
};

module.exports = readWriteConfigFile;
