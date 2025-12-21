# Speaker Import Test Fixtures

This directory contains PDF test fixtures for End-to-End testing of the speaker import matching and
updates feature.

## Current Status

### Available Fixtures

✅ **sierpc-speakers-grudzien-2025.pdf** - Real speaker list from Sierpc congregation
(December 2025)

- Source: Actual congregation speaker list
- Contains: Multiple speakers with names, phone numbers, and talk assignments
- Usage: General import workflow testing, AI extraction verification

### Required Fixtures (To Be Created)

The following test fixtures are needed to achieve complete E2E test coverage for all matching
scenarios:

#### 1. new-speakers.pdf

**Purpose:** Test creation of speakers that don't exist in database

**Required Content:**

- **Congregation:** "Żychlin" (matches seeded test organization)
- **Speakers:** 3-5 speakers with unique names not in database
  - Example: "Robert Zieliński", "Michał Adamczyk", "Krzysztof Dąbrowski"
  - Include phone numbers (9 digits)
  - Include 2-3 talk numbers per speaker (e.g., "101, 105, 108")

**Expected Test Behavior:**

- All speakers show "Nowy" (New) status badge with success/green color
- No diff information displayed
- Import creates new speaker records
- Success message: "X utworzonych" (X created)

---

#### 2. existing-speakers-updates.pdf

**Purpose:** Test update detection for speakers with changed phone/talks

**Required Content:**

- **Congregation:** "Żychlin"
- **Speakers matching seeded test data with changes:**

  **Speaker 1: Jan Kowalski**
  - Current in DB: Phone: 123-456-789, Talks: [1, 5, 12]
  - In PDF: Phone: 999-888-777, Talks: [5, 12, 15, 18]
  - Expected: Phone diff + talk diff (added: 15,18; removed: 1)

  **Speaker 2: Paweł Nowak**
  - Current in DB: Phone: 987-654-321, Talks: [3, 7, 15]
  - In PDF: Phone: 987-654-321, Talks: [7, 15, 20]
  - Expected: Talk diff only (added: 20; removed: 3)

**Expected Test Behavior:**

- Status: "Aktualizacja" (Update) with info/blue badge
- Phone diff: ~~old phone~~ new phone with strikethrough
- Talk diff: Side-by-side rows showing existing vs new talks
- Added talks highlighted in green, removed talks in red/muted
- Import updates existing records
- Success message: "X zaktualizowanych" (X updated)

---

#### 3. mixed-speakers.pdf

**Purpose:** Test mixed import with all operation types

**Required Content:**

- **Congregation:** "Żychlin"
- **Mix of speakers:**

  **2 New Speakers:**
  - "Bartosz Kowalczyk" (not in DB)
  - "Damian Szymański" (not in DB)

  **2 Speakers with Updates:**
  - "Jan Kowalski" with new phone
  - "Paweł Nowak" with new talks

  **1 Archived Speaker to Restore:**
  - "Tomasz Lewandowski" (archived in DB, same congregation)

  **1 Unchanged Speaker:**
  - "Piotr Wiśniewski" with identical phone and talks

**Expected Test Behavior:**

- Multiple status badges visible: "Nowy", "Aktualizacja", "Przywrócenie", "Bez zmian"
- Import executes mixed operations
- Success message shows all counts: "2 utworzonych, 2 zaktualizowanych, 1 przywróconych"

---

#### 4. archived-speaker-transfer.pdf

**Purpose:** Test restoration of archived speaker from different congregation

**Required Content:**

- **Congregation:** "Sierpc" (different from original)
- **Speaker:** "Tomasz Lewandowski"
  - Currently: Archived in "Żychlin" congregation in DB
  - In PDF: Active speaker in "Sierpc" congregation
  - May have phone/talk changes as well

**Expected Test Behavior:**

- Status: "Przywrócenie" (Restore) with warning/orange badge
- Congregation transfer alert displayed: "Żychlin → Sierpc"
- May also show phone/talk diffs if changed
- Import unarchives speaker and updates congregation
- Success message: "X przywróconych" (X restored)

---

#### 5. unchanged-speakers.pdf

**Purpose:** Test "nothing to import" scenario

**Required Content:**

- **Congregation:** "Żychlin"
- **Speakers:** 3-4 speakers with EXACT same data as in DB

  **Example Speakers (must match DB exactly):**
  - "Jan Kowalski" - Phone: 123-456-789, Talks: [1, 5, 12]
  - "Paweł Nowak" - Phone: 987-654-321, Talks: [3, 7, 15]
  - "Piotr Wiśniewski" - Phone: 555-666-777, Talks: [2, 8, 14, 20, 25]

**Expected Test Behavior:**

- All speakers show "Bez zmian" (No Changes) status with neutral/gray badge
- "Nothing to import" alert message visible
- Import button disabled or hidden
- No database operations performed

---

#### 6. congregation-variations.pdf

**Purpose:** Test AI congregation name matching with format variations

**Required Content:**

- **Create multiple sections or pages with different congregation name formats:**

  **Variation 1: Prefix Removal**
  - Header: "Zbór Żychlin" → Should match "Żychlin" congregation

  **Variation 2: Case Normalization**
  - Header: "ŻYCHLIN" → Should match "Żychlin" congregation

  **Variation 3: Lowercase**
  - Header: "zychlin" → Should match "Żychlin" congregation

  **Variation 4: With Diacritics**
  - Header: "Zychlin" (without ł) → Should match "Żychlin" congregation

- Include 2-3 speakers per variation to verify matching works

**Expected Test Behavior:**

- AI correctly identifies and matches congregation despite format differences
- Extracted congregation name shown: "(Wyodrębnione: [variation])"
- Congregation dropdown pre-selected with correct matched ID
- Speaker matching uses correct congregation for all variations

---

## PDF Creation Guidelines

### Format Requirements

**Layout:** Table format with columns:

- **Imię i Nazwisko** (First and Last Name)
- **Telefon** (Phone)
- **Numery wykładów** (Talk Numbers)

**Example Table:**

```
| Imię i Nazwisko    | Telefon       | Numery wykładów |
|--------------------|---------------|-----------------|
| Jan Kowalski       | 123-456-789   | 101, 102, 103   |
| Anna Nowak         | 987-654-321   | 103, 104, 105   |
| Piotr Wiśniewski   | 555-666-777   | 106, 107, 108   |
```

**Header:** Include congregation name prominently at top:

```
Zbór Żychlin
Lista Prelegentów
```

### Creation Methods

**Option 1: PDF Editor**

- Use existing `sierpc-speakers-grudzien-2025.pdf` as template
- Modify speaker names, phones, and talk numbers
- Tools: Adobe Acrobat, PDFtk, Sejda PDF Editor

**Option 2: Word/Google Docs**

- Create document with table layout
- Add congregation header
- Fill in speaker data
- Export as PDF

**Option 3: LibreOffice Calc**

- Create spreadsheet with columns
- Add formatting and header
- Export as PDF

### Validation Checklist

Before using a test fixture, verify:

- [ ] PDF is readable and not corrupted
- [ ] Congregation name is clearly visible
- [ ] Phone numbers are 9 digits (Polish format)
- [ ] Talk numbers correspond to existing public talks (1-200 range)
- [ ] Speaker names match test database expectations (for update/restore tests)
- [ ] File size is under 20MB (API limit)
- [ ] PDF renders correctly when uploaded

---

## Database Seed Data Reference

**Test Organization:**

- Name: "Żychlin"
- Slug: "zychlin"
- ID: (generated UUID in seed)

**Seeded Test Speakers (from `server/data/speakers.json`):**

- Jan Kowalski (phone: 123456789, talks: [1, 5, 12], archived: false)
- Paweł Nowak (phone: 987654321, talks: [3, 7, 15], archived: false)
- Piotr Wiśniewski (phone: 555666777, talks: [2, 8, 14, 20, 25], archived: false)
- Marcin Dąbrowski (phone: 111222333, talks: [], archived: false)
- Tomasz Lewandowski (phone: 444555666, talks: [10, 18], archived: true)
- Kamil Wójcik (phone: 777888999, talks: [4, 9, 13], archived: false)
- Andrzej Kamiński (phone: 222333444, archived: true)

**Note:** Check `server/data/speakers.json` for exact current data before creating update/unchanged
test PDFs.

---

## Running E2E Tests

**Run all speaker import tests:**

```bash
pnpm test:e2e tests/e2e/speaker-import-matching.spec.ts
```

**Run specific test:**

```bash
pnpm test:e2e tests/e2e/speaker-import-matching.spec.ts -g "displays match status badges"
```

**Run in headed mode (see browser):**

```bash
pnpm test:e2e tests/e2e/speaker-import-matching.spec.ts --headed
```

**Debug mode:**

```bash
pnpm test:e2e tests/e2e/speaker-import-matching.spec.ts --debug
```

---

## Maintenance

### When Database Schema Changes

If speaker schema changes (new fields, different relationships), update:

1. This README with new requirements
2. Test PDF fixtures to include new data
3. E2E test expectations in `speaker-import-matching.spec.ts`

### When AI Extraction Changes

If AI extraction logic changes (different parsing, new fields), verify:

1. All PDFs still extract correctly
2. Test expectations match new extraction format
3. Update tests if extraction format changes

---

## Contributing Test Fixtures

When adding new test fixtures:

1. **Create the PDF** following format guidelines above
2. **Place in this directory** with descriptive name
3. **Update this README** with fixture details
4. **Add E2E tests** in `speaker-import-matching.spec.ts`
5. **Verify tests pass** with new fixture
6. **Commit both** PDF and test updates together

---

## Troubleshooting

**Problem:** AI extraction fails on test PDF

- **Solution:** Check PDF format, ensure table structure is clear
- **Solution:** Try recreating PDF with simpler layout
- **Solution:** Check for special characters or encoding issues

**Problem:** Congregation matching fails

- **Solution:** Verify congregation name in PDF matches database
- **Solution:** Check for typos or extra whitespace
- **Solution:** Ensure test organization is seeded in database

**Problem:** Speaker matching not working

- **Solution:** Verify speaker names in PDF exactly match database (case-sensitive)
- **Solution:** Ensure congregation is correctly matched first
- **Solution:** Check that seeded test data hasn't changed

---

## Additional Resources

- **E2E Test File:** `tests/e2e/speaker-import-matching.spec.ts`
- **Requirements Spec:**
  `requirements/2025-12-15-2052-speaker-matching-updates/10-requirements-spec.md`
- **Component:** `app/components/SpeakerImportModal.vue`
- **API Endpoints:** `server/api/speakers/import`, `server/api/speakers/bulk-import.post.ts`
- **Seed Data:** `server/data/speakers.json`, `server/tasks/seed-speakers.ts`
