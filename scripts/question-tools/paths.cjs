const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..');
const publicRoot = path.join(projectRoot, 'public');

/** Active question corpora JSON — skip backups, audits, and fix artifacts. */
function isQuestionJsonFile(name) {
  if (!name.endsWith('.json')) return false;
  if (name.includes('.backup')) return false;
  if (name.includes('.pending-fix')) return false;
  if (name.includes('.audit')) return false;
  if (name.includes('.fix-report')) return false;
  if (name.includes('.manual-spelling')) return false;
  if (name.endsWith('.report.json')) return false;
  return true;
}

module.exports = { projectRoot, publicRoot, isQuestionJsonFile };
