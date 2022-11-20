function sanitizeTestRows(rows) {
  return rows.map(row => {
    return [row.Data[0].ScalarValue, row.Data[1].ScalarValue];
  });
}

module.exports = sanitizeTestRows;
