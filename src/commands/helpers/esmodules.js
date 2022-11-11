const esModuleMigration = async () => {
  // add the es modules here, this is temporary. For commonjs -> esmodules migration
  const ora = (await import("ora")).default;
  const chalk = (await import("chalk")).default;
  return {
    ora,
    chalk,
  };
};

module.exports = esModuleMigration;
