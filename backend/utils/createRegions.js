function createRegions(regionsRaw) {
  const regionsWithDuplicates = regionsRaw.Tables.map((region) => {
    return region.TableName.split(/(\-calls|-tests)/)[0]
  })
  return ((regions) => {
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
}

module.exports = createRegions;
