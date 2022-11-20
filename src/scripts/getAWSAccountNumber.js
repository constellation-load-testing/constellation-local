const { STSClient, GetCallerIdentityCommand } = require("@aws-sdk/client-sts");

const stsClient = new STSClient({});

const getAWSAccountNumber = async () => {
  const callerIdentity = await stsClient.send(new GetCallerIdentityCommand({}));
  const accountNumber = callerIdentity.Account;
  return accountNumber;
};

module.exports = getAWSAccountNumber;
