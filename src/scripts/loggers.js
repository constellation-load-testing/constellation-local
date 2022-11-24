const devLog = (...message) => {
  if (!(process.env.LOG_LEVEL === "dev" || process.env.LOG_LEVEL === "raw")) {
    return;
  }
  console.log("🔍", ...message);
};

module.exports = {
  devLog,
};
