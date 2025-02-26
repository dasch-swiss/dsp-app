const path = require('path');
const fs = require('fs');

/**
 * Recursively find all Nx libraries (folders containing project.json).
 */
function findNxLibraries(dir) {
  let nxLibs = [];

  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (fs.existsSync(path.join(fullPath, 'project.json'))) {
        // If a project.json is found, it's an Nx library
        nxLibs.push(path.join(fullPath, 'src/lib')); // Include only src/lib
      } else {
        // Recursively search deeper for Nx libraries
        nxLibs = nxLibs.concat(findNxLibraries(fullPath));
      }
    }
  });

  return nxLibs;
}

module.exports = { findNxLibraries };
