function aggregateTests(testsResponse, aggTime) {
  const formatedTests = [];
  let testsTracker = {
    total: 0,
    cummulative: 0
  };
  let trackedMilliseconds;
  testsResponse.Rows.forEach((row, i) => {
    let millisecStamp = Date.parse(row.Data[2].ScalarValue)
    let timeToFormat = new Date(trackedMilliseconds);
    if (!trackedMilliseconds) {
      trackedMilliseconds = millisecStamp;
      testsTracker.total += 1;
      testsTracker.cummulative += row.Data[3].ScalarValue;
    } else if (millisecStamp >= trackedMilliseconds + (1000 * aggTime)) {
      formatedTests.push({
        time: `${timeToFormat.getHours()}:${timeToFormat.getMinutes()}:${timeToFormat.getSeconds() < 10 ? "0" + String(timeToFormat.getSeconds()): timeToFormat.getSeconds()}`,
        runtime: testsTracker.cummulative / testsTracker.total
      });
      trackedMilliseconds = millisecStamp;
      testsTracker.total += 1;
      testsTracker.cummulative += Number(row.Data[3].ScalarValue);
    } else if (i+1 === testsResponse.Rows.length) {
      formatedTests.push({
        time: `${timeToFormat.getHours()}:${timeToFormat.getMinutes()}:${timeToFormat.getSeconds() < 10 ? "0" + String(timeToFormat.getSeconds()): timeToFormat.getSeconds()}`,
        runtime: testsTracker.cummulative / testsTracker.total
      });
      testsTracker = {
        total: 0,
        cummulative: 0
      };
    } 
  })
  return formatedTests;
}

module.exports = aggregateTests;
