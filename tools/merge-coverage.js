const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const TEST_RESULTS_FOLDER = 'coverage';
const TEMP_FOLDER = 'coverage/.temp';
const COVERAGE_FOLDER = 'coverage';
const FINAL_JSON_COVERAGE_FILENAME = 'coverage-final.json';
const MERGED_COVERAGE_FILENAME = 'coverage-merged.json';

function mergeCoverageFilesToJson() {
  console.log('🔍 Finding coverage files...');
  clearTempFolder();
  const jsonFiles = findCoverageFiles(TEST_RESULTS_FOLDER);
  console.log(`✓ Found ${jsonFiles.length} coverage JSON files.`);

  if (jsonFiles.length === 0) {
    console.error('❌ No coverage files found. Run tests with coverage first.');
    process.exit(1);
  }

  for (const filePath of jsonFiles) {
    const targetPath = getTargetPath(filePath);
    console.log(`  Copying '${path.relative(process.cwd(), filePath)}' → '${path.relative(process.cwd(), targetPath)}'`);
    fs.copySync(filePath, targetPath);
  }

  console.log('\n📦 Merging coverage files...');
  const mergedCoveragePath = path.join(COVERAGE_FOLDER, MERGED_COVERAGE_FILENAME);
  executeCommand(`npx nyc merge ${TEMP_FOLDER} ${mergedCoveragePath}`);
  console.log(`✓ Merged coverage written to: ${mergedCoveragePath}`);
}

function createIstanbulReportFromJson() {
  console.log('\n📊 Generating coverage reports...');
  const command = `npx nyc report -t ${TEMP_FOLDER} --report-dir ${COVERAGE_FOLDER} --reporter=html --reporter=lcov --reporter=text-summary --reporter=json`;
  executeCommand(command);
  console.log('\n✅ Coverage reports generated successfully!');
  console.log(`   📄 HTML Report: open ${COVERAGE_FOLDER}/lcov-report/index.html`);
  console.log(`   📄 LCOV Report: ${COVERAGE_FOLDER}/lcov.info`);
  console.log(`   📄 JSON Report: ${COVERAGE_FOLDER}/coverage-final.json`);
}

function findCoverageFiles(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const entryPath = path.join(dir, entry);
    // Skip the temp folder and root-level coverage files (merged outputs)
    if (entry === '.temp' || entryPath === path.join(TEST_RESULTS_FOLDER, FINAL_JSON_COVERAGE_FILENAME)) {
      continue;
    }
    if (fs.statSync(entryPath).isDirectory()) {
      findCoverageFiles(entryPath, files);
    } else if (path.basename(entryPath) === FINAL_JSON_COVERAGE_FILENAME) {
      files.push(entryPath);
    }
  }
  return files;
}

function getTargetPath(filePath) {
  // Extract project name from path (e.g., coverage/libs/vre/core/config → vre-core-config)
  const relativePath = path.relative(TEST_RESULTS_FOLDER, filePath);
  const pathParts = path.dirname(relativePath).split(path.sep).filter(p => p !== '.');
  const projectName = pathParts.join('-');
  const filename = `${projectName}-${path.basename(filePath)}`;
  return path.join(TEMP_FOLDER, filename);
}

function clearTempFolder() {
  fs.emptyDirSync(TEMP_FOLDER);
}

function executeCommand(command) {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (err) {
    console.error(`❌ Error executing command: ${command}`, err.message);
    process.exit(1);
  }
}

const main = () => {
  console.log('🚀 Starting coverage merge process...\n');
  mergeCoverageFilesToJson();
  createIstanbulReportFromJson();
  console.log('\n🎉 Done! View your coverage report in the browser.');
};

main();
