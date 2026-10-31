#!/usr/bin/env node
/**
 * Scholarly clean-up of legacy author titles and honorifics.
 *
 * Separates prefixes (أ.د.، د.، الشيخ، الباحث، القاضي، م.) from author names
 * into the dedicated `honorific` field, preserving alphabetical indexing,
 * citation accuracy, and preventing duplicate merging errors.
 *
 * Usage:
 *   node scripts/clean-authors-honorifics.mjs            # Dry-run preview
 *   node scripts/clean-authors-honorifics.mjs --dry-run  # Dry-run preview
 *   node scripts/clean-authors-honorifics.mjs --apply    # Execute modifications
 */
import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const isApply = args.includes('--apply');
const dataDir = resolve(process.env.DATA_DIR || './data');
const payloadPath = process.env.DATABASE_URL?.startsWith('file:')
  ? process.env.DATABASE_URL.slice(5)
  : join(dataDir, 'payload.db');

if (!existsSync(payloadPath)) {
  console.error(`Database not found: ${payloadPath}`);
  process.exit(2);
}

const db = new DatabaseSync(payloadPath, { readOnly: !isApply });

console.log(`\n=== Author Honorifics Clean-Up Tool ===`);
console.log(`Database: ${payloadPath}`);
console.log(`Mode: ${isApply ? 'APPLY (Modifying Database)' : 'DRY-RUN (No changes saved)'}\n`);

// Fetch all Arabic author rows
const rows = db.prepare(`SELECT id, _parent_id, name, honorific FROM authors_locales WHERE _locale = 'ar' AND name IS NOT NULL ORDER BY _parent_id ASC`).all();

const rules = [
  // 1. Author 159 legacy truncation fix
  {
    condition: (r) => r._parent_id === 159 && r.name === 'أ.م.د',
    transform: () => ({ honorific: 'أ.م.د.', name: 'عبدالله عبدالرحمن بكير', note: 'Restored from article 424 metadata' }),
  },
  // 2. Author 98 editorial title fix
  {
    condition: (r) => r._parent_id === 98 && r.name.includes('رئيس التحرير'),
    transform: () => ({ honorific: 'د.', name: 'عبدالقادر باعيسى', note: 'Separated editor-in-chief title' }),
  },
  // 3. Skip Russian initials like "م.أ. رودينوف"
  {
    condition: (r) => /^م\.أ\./.test(r.name),
    transform: null, // do not touch
  },
  // 4. Standard prefixes
  {
    regex: /^(?:أ\.د\.|أ\.د|الأستاذ\s+الدكتور)\s+/u,
    honorific: 'أ.د.',
  },
  {
    regex: /^(?:أ\.م\.د\.|أ\.م\.د)\s+/u,
    honorific: 'أ.م.د.',
  },
  {
    regex: /^(?:د\.\s*|د\s+|الدكتور\s+)/u,
    honorific: 'د.',
  },
  {
    regex: /^الشيخ\s*[:/]?\s+/u,
    honorific: 'الشيخ',
  },
  {
    regex: /^الباحث\s*[:/]?\s+/u,
    honorific: 'الباحث',
  },
  {
    regex: /^القاضي\s+/u,
    honorific: 'القاضي',
  },
  {
    regex: /^السيد\s+العلامة\s+الفقيه\s+القاضي\s+المؤرخ\s+/u,
    honorific: 'السيد العلامة',
  },
  {
    regex: /^م\.\s+/u,
    honorific: 'م.',
  },
];

const changes = [];

for (const row of rows) {
  let changed = false;
  let newHonorific = row.honorific;
  let newName = row.name;
  let note = '';

  for (const rule of rules) {
    if (rule.condition && rule.condition(row)) {
      if (rule.transform) {
        const res = rule.transform(row);
        newHonorific = res.honorific;
        newName = res.name;
        note = res.note ?? '';
        changed = true;
      }
      break;
    }

    if (rule.regex && rule.regex.test(row.name)) {
      newHonorific = rule.honorific;
      newName = row.name.replace(rule.regex, '').trim();
      note = `Extracted "${rule.honorific}"`;
      changed = true;
      break;
    }
  }

  if (changed && (newName !== row.name || newHonorific !== row.honorific)) {
    changes.push({
      id: row.id,
      parentId: row._parent_id,
      oldName: row.name,
      newName,
      oldHonorific: row.honorific,
      newHonorific,
      note,
    });
  }
}

console.log(`Found ${changes.length} author records eligible for honorific extraction:\n`);

for (const c of changes) {
  console.log(`[Author #${c.parentId}]`);
  console.log(`   Old: "${c.oldName}" (honorific: ${c.oldHonorific ?? 'null'})`);
  console.log(`   New: "${c.newName}" (honorific: "${c.newHonorific}") [${c.note}]`);
}

if (isApply) {
  console.log(`\nApplying updates to database...`);
  db.exec('BEGIN TRANSACTION');
  try {
    const updateStmt = db.prepare(`UPDATE authors_locales SET name = ?, honorific = ? WHERE id = ?`);
    for (const c of changes) {
      updateStmt.run(c.newName, c.newHonorific, c.id);
    }
    db.exec('COMMIT');
    console.log(`Successfully updated ${changes.length} author records.`);
  } catch (err) {
    db.exec('ROLLBACK');
    console.error(`Failed to apply changes, rolled back:`, err);
    process.exit(1);
  }
} else {
  console.log(`\nDry-run complete. To apply changes permanently, run:`);
  console.log(`   node scripts/clean-authors-honorifics.mjs --apply\n`);
}
