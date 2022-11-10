const devLog = (...message) => {
  if (!(process.env.LOG_LEVEL === "dev" || process.env.LOG_LEVEL === "raw")) {
    return;
  }
  console.log("🔍", ...message);
};

// guaranteed user-level logs are not used here

module.exports = {
  rawLog,
  devLog,
};
