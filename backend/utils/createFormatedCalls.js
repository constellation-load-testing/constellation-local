function createFormatedCalls(callsResponse) {
  const formatedCalls = {};
    const rawFormatedCalls = callsResponse.Rows.map((row) => {
      return {
        url: row.Data[0].ScalarValue + " " + row.Data[3].ScalarValue,
        status: row.Data[5].ScalarValue,
      }
    })
    rawFormatedCalls.forEach((call) => {
      formatedCalls[call.url] = formatedCalls[call.url] || {};
      formatedCalls[call.url][call.status] = formatedCalls[call.url][call.status] || 0;
      formatedCalls[call.url][call.status]++;
    })
  rawFormatedCalls.forEach((call) => {
    formatedCalls[call.url] = formatedCalls[call.url] || {};
    formatedCalls[call.url][call.status] = formatedCalls[call.url][call.status] || 0;
    formatedCalls[call.url][call.status]++;
  })
  return formatedCalls;
}

module.exports = createFormatedCalls;
