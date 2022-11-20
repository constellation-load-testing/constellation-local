const getOKCount = require('./getOKCount');
const getErrorCount = require('./getErrorCount');

async function createFormatedCalls(region, queryClient, QueryCommand) {
  const formatedCalls = {};
  const getUrlsString = `SELECT DISTINCT url FROM \"constellation-timestream-db\".\"${region}-calls\"`;
  const urlsResponse = await queryClient.send(new QueryCommand({QueryString: getUrlsString}));
  const urls = urlsResponse.Rows.map((row) => row.Data[0].ScalarValue);
  try {
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const OKCount = await getOKCount(region, url, queryClient, QueryCommand);
      const errorCount = await getErrorCount(region, url, queryClient, QueryCommand);
      formatedCalls[url] = {
        ok: OKCount,
        error: errorCount,
      }
    }
  } catch(err) {
    if (err.name === "ThrottlingException") {
      console.log("ThrottlingException");
      await new Promise(r => setTimeout(r, 1000));
      formatedCalls = await createFormatedCalls(region, queryClient, QueryCommand);
    }
    console.log(err);
  }
  return formatedCalls;
}

module.exports = createFormatedCalls;
