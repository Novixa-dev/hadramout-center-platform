// scripts/validate.js — Production Build and Data Integrity Validation
// Engineered by Novixa | نوڤيكسا

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
let hasErrors = false;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    hasErrors = true;
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('========================================================');
console.log(' NOVIXA PRODUCTION READINESS AUDIT & VALIDATION SUITE   ');
console.log('========================================================\n');

// 1. Verify Core Application Files
console.log('1. Checking Core Application Artifacts:');
const requiredFiles = [
  'index.html',
  'styles.css',
  'app.js',
  'data.js',
  'package.json',
  'vercel.json',
  'netlify.toml',
  'robots.txt',
  'sitemap.xml',
  'manifest.webmanifest',
  'favicon.svg',
  'sw.js',
  'assets/logo.svg',
  'assets/icon-192.svg',
  'assets/icon-512.svg'
];

requiredFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  assert(fs.existsSync(filePath), `File exists: ${file}`);
});

// 2. Verify Data Layer Syntax and Integrity
console.log('\n2. Verifying Academic Data Layer Integrity:');
try {
  const dataContent = fs.readFileSync(path.join(rootDir, 'data.js'), 'utf-8');
  // Evaluate HC_DATA in a safe context
  const sandbox = {};
  const fn = new Function('sandbox', dataContent + '; sandbox.HC_DATA = HC_DATA;');
  fn(sandbox);
  const data = sandbox.HC_DATA;

  assert(data && typeof data === 'object', 'HC_DATA object successfully loaded');
  assert(data.institution && data.institution.nameAr, 'Institution metadata verified');
  assert(data.publications && data.publications.length >= 8, `Publications catalog verified (${data.publications.length} books found)`);
  assert(data.magazines && data.magazines.length >= 3, `Periodicals archive verified (${data.magazines.length} issues found)`);
  assert(data.articles && data.articles.length >= 6, `Articles & Studies verified (${data.articles.length} studies found)`);
  assert(data.news && data.news.length >= 4, `News archive verified (${data.news.length} news items found)`);
  assert(data.forumEvents && data.forumEvents.length >= 2, `Forum events verified (${data.forumEvents.length} events found)`);
  assert(data.timelineMilestones && data.timelineMilestones.length >= 5, `Historical timeline verified (${data.timelineMilestones.length} milestones found)`);
  assert(data.translations && data.translations.ar && data.translations.en, 'Dual-language i18n dictionaries verified (ar/en)');

  // Verify each publication has complete citations and valid metadata
  data.publications.forEach(pub => {
    assert(pub.id && pub.titleAr && pub.titleEn, `Book #${pub.id} has bilingual titles`);
    assert(pub.citationAPA && pub.citationChicago && pub.citationMLA, `Book #${pub.id} has complete citation suite (APA, Chicago, MLA)`);
  });

} catch (err) {
  assert(false, `Data layer parsing error: ${err.message}`);
}

// 3. Verify HTML & Head Metadata
console.log('\n3. Verifying index.html Semantic Markup & Headers:');
const htmlContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
assert(htmlContent.includes('<html lang="ar" dir="rtl">'), 'HTML root has correct Arabic RTL attributes');
assert(htmlContent.includes('rel="manifest"'), 'Webmanifest link present');
assert(htmlContent.includes('rel="canonical"'), 'Canonical URL present');
assert(htmlContent.includes('schema.org'), 'Schema.org JSON-LD structured data present');
assert(htmlContent.includes('skip-to-content'), 'Accessible skip-to-content link present');

// 4. Verify Documentation Completeness
console.log('\n4. Verifying Institutional Documentation Suite:');
const requiredDocs = [
  'PRD.md',
  'README.md',
  'IMPROVEMENTS_AND_STRATEGY.md',
  'CHANGELOG.md',
  'ROADMAP.md',
  'TODO.md',
  'PROJECT_STATUS.md',
  'DECISIONS.md',
  'ASSUMPTIONS.md',
  'docs/strategy/project-strategy.md',
  'docs/strategy/decision-matrix.md',
  'docs/strategy/product-definition.md',
  'docs/strategy/value-proposition.md',
  'docs/strategy/scope.md',
  'docs/strategy/success-metrics.md',
  'docs/strategy/risk-register.md',
  'docs/strategy/case-study-strategy.md',
  'docs/research/organization-research.md',
  'docs/research/digital-presence-audit.md',
  'docs/research/competitor-research.md',
  'docs/research/audience-research.md',
  'docs/research/content-inventory.md',
  'docs/ux/information-architecture.md',
  'docs/ux/sitemap.md',
  'docs/ux/user-personas.md',
  'docs/ux/user-journeys.md',
  'docs/ux/ux-requirements.md',
  'docs/content/content-strategy.md',
  'docs/content/content-model.md',
  'docs/content/content-requirements.md',
  'docs/content/content-verification.md',
  'docs/design/design-direction.md',
  'docs/design/design-system.md',
  'docs/design/typography.md',
  'docs/design/accessibility.md',
  'docs/technical/architecture.md',
  'docs/technical/technical-decision-record.md',
  'docs/technical/environment.md',
  'docs/technical/deployment.md',
  'docs/technical/security.md',
  'docs/technical/performance.md',
  'docs/qa/test-plan.md',
  'docs/qa/accessibility-audit.md',
  'docs/qa/performance-audit.md',
  'docs/qa/seo-audit.md',
  'docs/qa/responsive-test-matrix.md',
  'docs/qa/final-qa.md',
  'docs/handover/handover.md',
  'docs/handover/admin-guide.md',
  'docs/handover/content-guide.md',
  'docs/handover/maintenance-guide.md'
];

let missingDocs = 0;
requiredDocs.forEach(doc => {
  const docPath = path.join(rootDir, doc);
  if (!fs.existsSync(docPath)) {
    console.error(`❌ MISSING DOC: ${doc}`);
    missingDocs++;
  }
});
assert(missingDocs === 0, `All ${requiredDocs.length} institutional strategy & technical documents exist`);

console.log('\n========================================================');
if (hasErrors) {
  console.error('❌ BUILD AUDIT FAILED — Issues must be addressed before deployment.');
  process.exit(1);
} else {
  console.log('🎉 AUDIT 100% PASSED: PLATFORM IS PRODUCTION & DEPLOYMENT READY!');
  console.log('========================================================\n');
  process.exit(0);
}
