const fs = require('fs');
const readline = require('readline');

const dataFilePaths = ['./data/api-dev-out.log', './data/api-prod-out.log', './data/prod-api-prod-out.log'];

const Apialgo = (dataFilePath) => {
  return new Promise((resolve, reject) => {
    const logData = {
      endpointCounts: {},
      statusCounts: {},
      timeSeriesData: {},
    };

    const mir = /\[(\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2})/;

    const rl = readline.createInterface({
      input: fs.createReadStream(dataFilePath),
      crlfDelay: Infinity,
    });

    rl.on('line', (line) => {
      const match = line.match(mir);
      if (match) {
        const timestamp = match[1];
        const minute = timestamp.substring(0, 17);
        logData.timeSeriesData[minute] = logData.timeSeriesData[minute] ? logData.timeSeriesData[minute] + 1 : 1;
      }

      const endpointMatch = line.match(/"([A-Z]+) (.+?) /);
      if (endpointMatch) {
        const endpoint = endpointMatch[2];
        logData.endpointCounts[endpoint] = logData.endpointCounts[endpoint] ? logData.endpointCounts[endpoint] + 1 : 1;
      }

      const statusCodeMatch = line.match(/" (\d{3}) /);
      if (statusCodeMatch) {
        const statusCode = statusCodeMatch[1];
        logData.statusCounts[statusCode] = logData.statusCounts[statusCode] ? logData.statusCounts[statusCode] + 1 : 1;
      }
    });

    rl.on('close', () => {
      resolve(logData);
    });

    rl.on('error', (err) => {
      reject(err);
    });
  });
};

const displayFormattedTable = (data) => {
  console.log('Endpoint Counts:');
  console.table(data.endpointCounts);
  console.log('\nTime Series Data:');
  console.table(data.timeSeriesData);
  console.log('\nStatus Code Counts:');
  console.table(data.statusCounts);
};

const processLogData = async () => {
  try {
    const logDataPromises = dataFilePaths.map(Apialgo);
    const logDataArray = await Promise.all(logDataPromises);
    const mergedLogData = logDataArray.reduce((merged, data) => {
      Object.keys(data.endpointCounts).forEach((key) => {
        merged.endpointCounts[key] = (merged.endpointCounts[key] || 0) + data.endpointCounts[key];
      });
      Object.keys(data.statusCounts).forEach((key) => {
        merged.statusCounts[key] = (merged.statusCounts[key] || 0) + data.statusCounts[key];
      });
      Object.keys(data.timeSeriesData).forEach((key) => {
        merged.timeSeriesData[key] = (merged.timeSeriesData[key] || 0) + data.timeSeriesData[key];
      });
      return merged;
    }, {
      endpointCounts: {},
      statusCounts: {},
      timeSeriesData: {},
    });

    displayFormattedTable(mergedLogData);
  } catch (error) {
    console.error('Error reading log data:', error);
  }
};

processLogData();
