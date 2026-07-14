# 🎓 UWU-NEXUS සම්පූර්ණ මාර්ගෝපදේශය
## Part 7: GPA Calculator — Smart Grade System (Database සම්පූර්ණයෙන්)

---

## 🎓 GPA Calculator කියන්නේ මොකක්ද?

Student ගේ **Degree Curriculum** auto-load කරලා grades enter කළාම **GPA automatically calculate** කරන system.

```
Student login → GPA page open
    ↓
Email decode → degree = "IIT"
    ↓
IIT curriculum database ගෙන් load
    ↓
Year 1 Sem 1, Year 1 Sem 2 ... Year 4 Sem 2 modules
    ↓
Student → grade dropdowns fill
    ↓
Save → GPA live calculate → Class show ✅
```

**Available degrees:** IIT, CST, MRT, SCT (Faculty of Applied Sciences only)

---

## 🗄️ DATABASE TABLES — සම්පූර්ණ විස්තර

GPA Calculator ට **5 tables** use වෙනවා. හැම table ගෙ exact structure real data සමඟ.

---

### TABLE 1: `degrees` — Degree Programmes

**Purpose:** University ඇතුළේ ඇති degree programmes list.

```sql
DESCRIBE degrees;
```

| Field | Type | Null | Key | Description |
|-------|------|------|-----|-------------|
| `id` | int unsigned | NO | PRI | Auto ID |
| `degree_code` | varchar(10) | NO | UNI | "IIT", "MRT-MPT" |
| `degree_name` | varchar(200) | NO | | Full degree name |
| `total_credits_required` | decimal(6,2) | NO | | Default: 120.00 |
| `duration_years` | int | NO | | Default: 4 |

**Real Data ඇතුළේ ඇති degree programmes:**

| degree_code | degree_name |
|-------------|-------------|
| `IIT` | B.Sc. Honours in Industrial Information Technology |
| `CST` | B.Sc. Honours in Computer Science and Technology |
| `MRT-MPT` | B.Sc. Honours in Mineral Resources (Mineral Processing) |
| `MRT-WST` | B.Sc. Honours in Mineral Resources (Water Science) |
| `SCT-FEB` | B.Sc. Honours in Science and Technology (Food Engineering) |
| `SCT-MEC` | B.Sc. Honours in Science and Technology (Mechatronics) |
| `SCT-MST` | B.Sc. Honours in Science and Technology (Material Science) |

> ⚠️ MRT සහ SCT **split** වෙනවා — ඒ specialization (3rd year ඉඳන්) ගෙන්.
> Year 1-2: common curriculum → Year 3-4: specialization ගෙ curriculum

---

### TABLE 2: `curriculum_groups` — Subject Groups per Semester

**Purpose:** Degree ගෙ හැම semester ඇතුළේ modules **group** කරලා ඇත.

```sql
DESCRIBE curriculum_groups;
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Auto ID |
| `degree_id` | int | → degrees.id (ඒ group කෝ degree ගෙ?) |
| `academic_year` | tinyint | 1, 2, 3, 4 |
| `semester` | tinyint | 1 or 2 |
| `group_type` | enum | CORE / ESD / BGE / ELECTIVE / OPTIONAL / BASKET |
| `group_name` | varchar | "Core Course Units", "ESD & BGE Course Units" |
| `min_credits_required` | decimal | Minimum credits (BASKET groups ට) |

**Real data — IIT degree (degree_id=1) ගෙ groups:**

```
id | degree_id | year | sem | group_type | group_name
---+-----------+------+-----+------------+---------------------------
1  |     1     |  1   |  1  |   ESD      | ESD & BGE Course Units
2  |     1     |  1   |  1  |   CORE     | Core Course Units
3  |     1     |  1   |  2  |   ESD      | ESD & BGE Course Units
4  |     1     |  1   |  2  |   CORE     | Core Course Units
5  |     1     |  2   |  1  |   ESD      | ESD & BGE Course Units
6  |     1     |  2   |  1  |   CORE     | Core Course Units
...
```

**Group Types:**

| group_type | Meaning |
|-----------|---------|
| `CORE` | Degree-specific compulsory subjects |
| `ESD` | English, Skills Development subjects |
| `BGE` | Basic General Education subjects |
| `ELECTIVE` | ඔයා choose කරන subjects |
| `OPTIONAL` | Optional subjects pool |
| `BASKET` | Minimum credits achieve කරන subjects pool |

---

### TABLE 3: `modules` — Subject Modules

**Purpose:** University ඇතුළේ ඇති **සියලු subjects** list.

```sql
DESCRIBE modules;
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Auto ID |
| `module_code` | varchar(20) | "IIT 211-3", "ESD 121-2" |
| `module_name` | varchar(255) | "Introduction to Programming" |
| `credits` | decimal(4,1) | 3.0, 2.0, 1.0 |
| `is_gpa` | tinyint | 1=GPA count, 0=Non-GPA |

**Real data — first 10 modules:**

```
id | module_code  | module_name                      | credits | is_gpa
---+--------------+----------------------------------+---------+-------
1  | ESD 121-2    | English Language Level I         |   2.0   |   1
2  | ESD 122-2    | English Language Level II        |   2.0   |   1
3  | ESD 221-2    | English Language Level III       |   2.0   |   1
4  | ESD 311-1    | Communication Skills II          |   1.0   |   1
5  | ESD 111-1    | Communication Skills I           |   1.0   |   1
6  | ESD 141-2    | Quantitative Reasoning           |   2.0   |   1
7  | ESD 103-2    | Information Technology           |   2.0   |   1
8  | ESD 151-1    | Sinhala Language I (non-GPA)     |   1.0   |   0  ← GPA නෑ
9  | ESD 161-1    | Tamil Language I (non-GPA)       |   1.0   |   0  ← GPA නෑ
10 | ESD 152-1    | Sinhala Language II (non-GPA)    |   1.0   |   0  ← GPA නෑ
```

> 💡 `is_gpa = 0` subjects (Sinhala, Tamil) — pass/fail ව count, GPA ට add **වෙන්නේ නෑ**!

---

### TABLE 4: `curriculum_modules` — Subjects in Each Group

**Purpose:** `curriculum_groups` ↔ `modules` **linking table** (many-to-many).

```sql
DESCRIBE curriculum_modules;
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Auto ID |
| `group_id` | int | → curriculum_groups.id |
| `module_id` | int | → modules.id |
| `is_mandatory` | tinyint | 1=compulsory, 0=optional |

**Example — Group 2 (IIT Year 1 Sem 1 CORE) ඇතුළේ:**

```
group_id | module_id | is_mandatory
---------+-----------+-------------
    2    |    15     |      1       ← IIT 111-3 (Compulsory)
    2    |    16     |      1       ← IIT 112-3 (Compulsory)
    2    |    17     |      1       ← IIT 113-2 (Compulsory)
```

---

### TABLE 5: `user_grades` — Student ගේ Grades

**Purpose:** Student ගෙ grades save කරන table. Repeat subjects handle කරනවා.

```sql
DESCRIBE user_grades;
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Auto ID |
| `user_id` | int | → users.id |
| `module_id` | int | → modules.id |
| `academic_year` | tinyint | 1, 2, 3, 4 |
| `semester` | tinyint | 1 or 2 |
| `grade` | varchar(3) | "A+", "B", "C-", "E" |
| `gpv` | decimal(4,2) | 4.00, 3.00, 1.70, 0.00 |
| `attempt_number` | tinyint | 1st attempt, 2nd attempt... |
| `is_best_grade` | tinyint | 1=best grade (GPA ට use) |
| `created_at` | timestamp | Grade save කළ time |

**Example — Student 7 ගේ grades:**

```
user_id | module_id | grade | gpv  | attempt | is_best
--------+-----------+-------+------+---------+--------
   7    |    15     |  B+   | 3.30 |    1    |    1   ← Best grade
   7    |    16     |   E   | 0.00 |    1    |    0   ← Failed (not best)
   7    |    16     |   C   | 2.00 |    2    |    1   ← Repeat, now best
   7    |    17     |  A-   | 3.70 |    1    |    1
```

> 💡 **Repeat Subject Logic:**
> Student fail කළොත් (E grade) → repeat කළාම new attempt save.
> **Best grade** `is_best_grade=1` → GPA calculation ට use.

---

## 🔗 Tables ගේ Relationships (JOIN Structure)

```
degrees (id=1, degree_code='IIT')
    │
    └─ curriculum_groups (degree_id=1)
           │  (Year 1, Sem 1, CORE)
           │  (Year 1, Sem 1, ESD)
           │  ...
           │
           └─ curriculum_modules (group_id=2)
                   │
                   └─ modules (id=15, code='IIT 111-3', credits=3.0)
                               ↕
                         user_grades (user_id=7, module_id=15, grade='B+')
```

**The mega SQL query** (get_gpa.php ඇතුළේ):

```sql
SELECT
    cg.id AS group_id,
    cg.academic_year,
    cg.semester,
    cg.group_type,
    cg.group_name,
    cg.min_credits_required,
    m.id AS module_id,
    m.module_code,
    m.module_name,
    m.credits,
    m.is_gpa,
    cm.is_mandatory
FROM curriculum_groups cg
JOIN curriculum_modules cm ON cm.group_id = cg.id
JOIN modules m             ON m.id = cm.module_id
WHERE cg.degree_id = 1           -- IIT degree
ORDER BY cg.academic_year, cg.semester, cg.group_type, m.module_code
```

---

## 🔄 GPA Calculator Full Flow

### STEP 1: Page Load

```typescript
// Cookie ගෙන් user ID + role ගන්නවා
const myId = parseCookie("uwu_user_id");
const myRole = parseCookie("uwu_role");

// Curriculum load
loadCurriculum();
```

### STEP 2: Curriculum Load — `get_gpa.php`

```
GET /api/backend/get_gpa.php?user_id=7
         ↓
PHP:
  1. User ගේ degree code ගන්නවා (email ගෙන් → "IIT")
  2. MRT/SCT ද? → specialization check
  3. degrees table ගෙන් degree record ගන්නවා
  4. curriculum_groups + curriculum_modules + modules JOIN query
  5. user_grades ගෙන් saved grades ගන්නවා
  6. Curriculum structured JSON return
         ↓
{
  "curriculum": {
    "1": {                     ← Year 1
      "1": {                   ← Semester 1
        "2": {                 ← Group ID 2
          "group_type": "CORE",
          "modules": [
            {module_id:15, module_code:"IIT 111-3", credits:3.0, grade:"B+"},
            {module_id:16, module_code:"IIT 112-3", credits:3.0, grade:"E"},
            ...
          ]
        }
      }
    }
  },
  "gpa_summary": {current_gpa: 3.25, degree_class: "Upper Second"},
  "user_info": {degree_code:"IIT", enrollment_number:"UWU/IIT/23/068"}
}
```

### STEP 3: Frontend Structure Build

```typescript
// Nested structure: curriculum[year][semester][groupId]
const curriculum: Curriculum = {
  "1": {          // Year 1
    "1": {        // Semester 1
      "2": { group_type:"CORE", modules:[...] },
      "1": { group_type:"ESD",  modules:[...] }
    },
    "2": {        // Semester 2
      ...
    }
  },
  "2": { ... },
  "3": { ... },
  "4": { ... }
}
```

### STEP 4: Grade Dropdown Select

```typescript
// localGrades state — module_id → grade
const [localGrades, setLocalGrades] = useState<Record<number, string>>({});

// User → dropdown select "B+" for module 15
setLocalGrades(prev => ({ ...prev, [15]: "B+" }));
// → {15: "B+", 16: "E", 17: "A-"}
```

### STEP 5: Live GPA Calculation

```typescript
// computeGPA() — hැම grade change ට live calculate
function computeGPA(curriculum, localGrades) {
  let totalW = 0;  // Weighted sum (credits × GPV)
  let totalC = 0;  // Total GPA credits

  for (const year of Object.values(curriculum))
    for (const sem of Object.values(year))
      for (const group of Object.values(sem))
        for (const module of group.modules) {
          const grade = localGrades[module.module_id];

          if (grade && module.is_gpa === 1) {
            // is_gpa = 1 subjects only!
            totalW += module.credits * GPV_MAP[grade];
            totalC += module.credits;
          }
        }

  return totalC > 0 ? Math.round((totalW / totalC) * 100) / 100 : 0;
}

// Example:
// IIT 111-3 (3 credits) → B+ (3.30) → 3 × 3.30 = 9.90
// IIT 112-3 (3 credits) → C  (2.00) → 3 × 2.00 = 6.00
// ESD 121-2 (2 credits) → A  (4.00) → 2 × 4.00 = 8.00
//                                      ---------------
// totalW = 23.90, totalC = 8
// GPA = 23.90 / 8 = 2.99 (rounded)
```

### STEP 6: Degree Class Determine

```typescript
function classFromGPA(gpa) {
  if (gpa >= 3.70) return "First Class";
  if (gpa >= 3.30) return "Upper Second";
  if (gpa >= 3.00) return "Lower Second";
  if (gpa >= 2.00) return "Third Class";
  if (gpa > 0)    return "Below Minimum";
  return "Not Enough Data";
}
```

**GPA → Class Table:**

| GPA Range | Degree Class |
|-----------|-------------|
| 3.70 – 4.00 | 🥇 First Class |
| 3.30 – 3.69 | 🥈 Upper Second |
| 3.00 – 3.29 | 🥉 Lower Second |
| 2.00 – 2.99 | Third Class |
| < 2.00 | Below Minimum |
| 0.00 | Not Enough Data |

### STEP 7: Save Grades — `save_grades.php`

```typescript
// "Save" button click
await fetch('/api/backend/save_grades.php', {
  method: "POST",
  body: JSON.stringify({
    user_id: 7,
    grades: [
      { module_id: 15, academic_year: 1, semester: 1, grade: "B+", gpv: 3.30 },
      { module_id: 16, academic_year: 1, semester: 1, grade: "E",  gpv: 0.00 },
      { module_id: 17, academic_year: 1, semester: 1, grade: "A-", gpv: 3.70 },
    ]
  })
});
```

**PHP save logic:**

```php
foreach ($grades as $entry) {
  $existing = // Check existing grade for this module

  if (!$existing) {
    // First time → INSERT (attempt_number=1, is_best_grade=1)
    INSERT INTO user_grades (user_id, module_id, grade, gpv, attempt_number=1, is_best_grade=1)

  } else if ($existing['gpv'] >= 2.00) {
    // Passing grade → simple correction
    UPDATE user_grades SET grade=?, gpv=? WHERE id=?

  } else {
    // Failed (gpv < 2.00) → Repeat attempt
    // Mark old as NOT best
    UPDATE user_grades SET is_best_grade=0 WHERE id=old_id
    // Insert new attempt as best
    INSERT INTO user_grades (... attempt_number=2, is_best_grade=1)
  }
}
```

---

## 🔀 Specialization System (MRT / SCT)

**MRT** degree ඇතුළේ Year 3-4 **2 tracks**:
- `MRT-MPT` — Mineral Processing Technology
- `MRT-WST` — Water Science and Technology

**SCT** degree ඇතුළේ Year 3-4 **3 tracks**:
- `SCT-FEB` — Food Engineering and Bioprocess Technology
- `SCT-MEC` — Mechatronics
- `SCT-MST` — Material Science and Technology

```
PHP Logic (get_gpa.php):

User degree = "MRT", specialization = NULL?
  → needs_specialization = true
  → Load MRT-MPT as proxy (Year 1-2 only, they're identical)
  → Frontend shows "Select Specialization" prompt

User selects "MPT":
  → POST /set_specialization.php {user_id, spec: "MPT"}
  → UPDATE users SET specialization = 'MPT' WHERE id = 7
  → Reload curriculum → full MRT-MPT loaded ✅
```

---

## 👑 Admin Preview Mode (Superadmin)

SuperAdmin → GPA page ඇතුළේ any degree preview කරන්නට:

```
Dropdown: [IIT] [CST] [MRT-MPT] [MRT-WST] [SCT-FEB] ...

SuperAdmin → "CST" select
  → GET /get_gpa.php?user_id=1&degree_override=CST
  → CST curriculum load (grades empty — preview mode)
```

---

## 🖥️ Level Tabs UI (Year 1-4)

GPA page ඇතුළේ **Tab buttons**:

```
[Level 100] [Level 200] [Level 300] [Level 400]
  (Year 1)   (Year 2)   (Year 3)   (Year 4)

State:
const [activeLevel, setActiveLevel] = useState("1");

Show modules:
{activeLevel === "1" && <Year1Modules />}
{activeLevel === "2" && <Year2Modules />}
...
```

---

## 📌 Part 7 Summary — ඔයා ඉගෙනගත්ත දේ

**Database Tables:**
- ✅ `degrees` — 7 degree programmes (IIT, CST, MRT-MPT, MRT-WST, SCT-x3)
- ✅ `curriculum_groups` — Year/Sem/GroupType ව modules organize
- ✅ `modules` — සියලු subjects (module_code, credits, is_gpa)
- ✅ `curriculum_modules` — Groups ↔ Modules linking (many-to-many)
- ✅ `user_grades` — Student grades (attempt system, is_best_grade)

**GPA System:**
- ✅ Email → degree code auto decode (signup දීම)
- ✅ Mega JOIN query — 3 tables JOIN ව curriculum structure
- ✅ GPA formula: `Σ(credits × GPV) ÷ Σ(credits)` — is_gpa=1 only
- ✅ Repeat subject — best grade use (failed → repeat → new attempt)
- ✅ Specialization — MRT/SCT Year 3 ඉඳන් split

---

## ➡️ ඊළඟ Part (Part 8) ගැන Preview

**Part 8: Info Hub & Admin Panel — Content Management + Full Admin Powers**

- Info Hub items (lecturers, hotlines, procedures)
- Admin panel tabs (Events, Tickets, Marketplace, Users, GPA)
- Role management (promote/demote users)
- User management (view, delete)

---

*📝 UWU-NEXUS Project Guide | Part 7 of 10*
