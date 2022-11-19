async function getErrorCount(region, url, queryClient, QueryCommand) {
  const getErrorCountString = `SELECT COUNT(*) FROM \"constellation-timestream-db\".\"${region}-calls\" WHERE url = '${url}' AND status >= '400'`;
  const errorCountResponse = await queryClient.send(new QueryCommand({QueryString: getErrorCountString}));
  const errorCount = errorCountResponse.Rows[0].Data[0].ScalarValue;
  return errorCount;
}

module.exports = getErrorCount;
