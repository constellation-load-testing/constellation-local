async function getOKCount(region, url, queryClient, QueryCommand) {
  const getOKCountString = `SELECT COUNT(*) FROM \"constellation-timestream-db\".\"${region}-calls\" WHERE url = '${url}' AND status < '400'`;
  const OKCountResponse = await queryClient.send(new QueryCommand({QueryString: getOKCountString}));
  const OKCount = OKCountResponse.Rows[0].Data[0].ScalarValue;
  return OKCount;
}

module.exports = getOKCount;
