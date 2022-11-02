// create express server on port 3002
const express = require('express');
const app = express();
const port = 3002;
const cors = require('cors');
app.use(cors());
const {TimestreamQueryClient, QueryCommand} = require("@aws-sdk/client-timestream-query");
const {TimestreamWriteClient, ListTablesCommand} = require("@aws-sdk/client-timestream-write");
const writeClient = new TimestreamWriteClient({region: "us-east-1"});
const queryClient = new TimestreamQueryClient({region: "us-east-1"});
app.use(express.static(__dirname.concat('/build')));
// takes in a list of region tables and returns an object with all the formated data from each table
// this is then sent to the frontend to be displayed
async function writeData(regions) {
	const regionObject = {}
	for (let i = 0; i < regions.length; i++) {
		let region = regions[i];
		const queryString = `SELECT * FROM \"constellation-timestream-db\".\"${region}\"`;
		const response = await queryClient.send(new QueryCommand({QueryString: queryString}));
		const formatedResponse = response.Rows.map(row => {
			const [year, time] = row.Data[2].ScalarValue.split(' ');
			return {
				"year": year,
				"time": time.split('.')[0],
				"averageLatency": JSON.parse(row.Data[3].ScalarValue)[region].averageCallLatency,
				"totalErrors": JSON.parse(row.Data[3].ScalarValue)[region].totalErrors
			}
		});
		regionObject[region] = formatedResponse
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
	const regions = regionsRaw.Tables.map((region) => {
		return region.TableName
	})

	const regionObject = await writeData(regions)
	regionObject["regions"] = regions;
	res.send(regionObject);
})

// start express server on port 3002
app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`);
});
