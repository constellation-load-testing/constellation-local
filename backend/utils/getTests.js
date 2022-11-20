const sanitizeTestRows = require("./sanitizeTestRows");

async function getTests(region, queryClient, QueryCommand) {
  let testsResponse;
  const rowCountQuery = `SELECT COUNT(*) FROM \"constellation-timestream-db\".\"${region}-tests\"`;
  const rowCountResponse = await queryClient.send(new QueryCommand({QueryString: rowCountQuery}));
  const countNumber = Number(rowCountResponse.Rows[0].Data[0].ScalarValue);
  try {
    if (countNumber <= 10000) {
      let getTestsString = `SELECT time, measure_value::double FROM \"constellation-timestream-db\".\"${region}-tests\" ORDER BY time ASC LIMIT 10000`;
      testsResponse = await queryClient.send(new QueryCommand({QueryString: getTestsString}));
    } else {
      const modulo = Math.ceil(countNumber / 10000);
      let getTestsString = `SELECT time, measure_value::double FROM \"constellation-timestream-db\".\"${region}-tests\" WHERE cast(test_id as int) % ${modulo} = 0 ORDER BY time ASC LIMIT 10000`;
      testsResponse = await queryClient.send(new QueryCommand({QueryString: getTestsString}));
    }
  } catch(err) {
    if (err.name === "ThrottlingException") {
      console.log("ThrottlingException");
      await new Promise(r => setTimeout(r, 1000));
      testsResponse = await getTests(region, queryClient, QueryCommand);
    }
  }
  return sanitizeTestRows(testsResponse.Rows);
}

module.exports = getTests;
