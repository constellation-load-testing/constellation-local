const rawLog = (message, logger = console.log) => {
  if (process.env.LOG_LEVEL !== "raw") return;

  logger(`📜 ${message}`);
};

const devLog = (message, logger = console.log) => {
  if (!(process.env.LOG_LEVEL === "dev" || process.env.LOG_LEVEL === "raw")) {
    return;
  }

  logger(`🔍 ${message}`);
};

// guaranteed user-level logs are not used here

module.exports = {
  rawLog,
  devLog,
};
