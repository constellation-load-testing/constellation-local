// create express server on port 3002
const express = require('express');
const app = express();
const port = 3002;
const cors = require('cors');
const HOME_REGION = require('../../src/config.json').HOME_REGION;
app.use(cors());
const {TimestreamQueryClient, QueryCommand} = require("@aws-sdk/client-timestream-query");
const {TimestreamWriteClient, ListTablesCommand} = require("@aws-sdk/client-timestream-write");
const writeClient = new TimestreamWriteClient({region: HOME_REGION});
const queryClient = new TimestreamQueryClient({region: HOME_REGION});
app.use(express.static(__dirname.concat('/build')));
// takes in a list of region tables and returns an object with all the formated data from each table
// this is then sent to the frontend to be displayed
async function writeData(regions) {
	const regionObject = {}
	for (let i = 0; i < regions.length; i++) {
		let region = regions[i];
		const getTests = `SELECT * FROM \"constellation-timestream-db\".\"${region}-tests\" ORDER BY time ASC`;
		const getCalls = `SELECT * FROM \"constellation-timestream-db\".\"${region}-calls\" ORDER BY time DESC`;
		const testsResponse = await queryClient.send(new QueryCommand({QueryString: getTests}));
		const callsResponse = await queryClient.send(new QueryCommand({QueryString: getCalls}));
    const formatedTests = [];
    let testsTracker = {
      total: 0,
      cumulative: 0
    };
    let trackedMilliseconds;
    testsResponse.Rows.forEach((row, i) => {
      let millisecStamp = Date.parse(row.Data[2].ScalarValue)
      let timeToFormat = new Date(trackedMilliseconds);
      if (!trackedMilliseconds) {
        trackedMilliseconds = millisecStamp;
        testsTracker.total += 1;
        testsTracker.cumulative += row.Data[3].ScalarValue;
      } else if (millisecStamp >= trackedMilliseconds + 1000) {
        formatedTests.push({
          time: `${timeToFormat.getHours()}:${timeToFormat.getMinutes()}:${timeToFormat.getSeconds() < 10 ? "0" + String(timeToFormat.getSeconds()): timeToFormat.getSeconds()}`,
          runtime: testsTracker.cumulative / testsTracker.total
        });
        trackedMilliseconds = millisecStamp;
        testsTracker.total += 1;
        testsTracker.cumulative += Number(row.Data[3].ScalarValue);
        console.log(`${testsTracker.cumulative / testsTracker.total}`)
      } else if (i+1 === testsResponse.Rows.length) {
        formatedTests.push({
          time: `${timeToFormat.getHours()}:${timeToFormat.getMinutes()}:${timeToFormat.getSeconds() < 10 ? "0" + String(timeToFormat.getSeconds()): timeToFormat.getSeconds()}`,
          runtime: testsTracker.cumulative / testsTracker.total
        });
        testsTracker = {
          total: 0,
          cumulative: 0
        };
      } 
    })
    const rawFormatedCalls = callsResponse.Rows.map((row) => {
      return {
        url: row.Data[0].ScalarValue + " " + row.Data[3].ScalarValue,
        status: row.Data[5].ScalarValue,
      }
    })
    const formatedCalls = {};
    rawFormatedCalls.forEach((call) => {
      formatedCalls[call.url] = formatedCalls[call.url] || {};
      formatedCalls[call.url][call.status] = formatedCalls[call.url][call.status] || 0;
      formatedCalls[call.url][call.status]++;
    })
    regionObject[region] = {
      tests: formatedTests,
      calls: formatedCalls,
    }
  }
  return regionObject
}



// server static files
app.get('/', (req, res) => {
  res.sendFile('../build/index.html');
});

// create a GET route
app.get('/data', async (req, res) => {
  const params = {
    DatabaseName: "constellation-timestream-db",
  };
  const command = new ListTablesCommand(params);

  const regionsRaw = await writeClient.send(command)
  const regionsWithDuplicates = regionsRaw.Tables.map((region) => {
    return region.TableName.split(/(\-calls|-tests)/)[0]
  })
  const regions = ((regions) => {
    const seen = {};
    const cleanedRegions = [];
    regions.forEach((region) => {
      if (!seen[region]) {
        cleanedRegions.push(region);
        seen[region] = true;
      }
    });
    return cleanedRegions;
  })(regionsWithDuplicates)

  const regionObject = await writeData(regions)
  regionObject["regions"] = regions;
  res.send(regionObject);
})

// start express server on port 3002
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
