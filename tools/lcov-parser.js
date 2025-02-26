const fs = require('fs');
const path = require('path');

// Input and output file paths
const inputFilePath = 'apps/dsp-app/coverage/lcov.info';

// Read the lcov.info file
fs.readFile(inputFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Modify SF paths
  const modifiedData = data
    .split('\n')
    .map(line => {
      if (line.startsWith('SF:')) {
        let filePath = line.substring(3); // Extract file path after SF:

        if (filePath.startsWith('src/')) {
          filePath = `apps/dsp-app/${filePath}`;
        } else if (filePath.startsWith('../../libs/')) {
          filePath = filePath.replace('../../libs/', 'libs/');
        }

        return `SF:${filePath}`;
      }
      return line;
    })
    .join('\n');

  // Write the modified content to a new file
  fs.writeFile(inputFilePath, modifiedData, 'utf8', err => {
    if (err) {
      console.error('Error writing file:', err);
    } else {
      console.log('lcov.info rewritten');
    }
  });
});
