# 🧙 CURSOR PROMPT — Complete Wizard Questions + Refund Maximization Engine

## COPY EVERYTHING BELOW THIS LINE INTO CURSOR

---

## 🎯 WHAT WE ARE BUILDING

A deeply researched, comprehensive multi-step wizard that asks international students
every question needed to:
1. Accurately determine their tax situation (visa, residency, income types)
2. Find EVERY possible refund opportunity (FICA, treaties, SALT, deductions)
3. Identify all income sources including campus jobs, CPT, OPT, internships, freelance
4. Generate a maximum refund estimate with a full breakdown

This wizard is based on research from Sprintax (the #1 NRA tax software used by 250,000+
international students), IRS publications, and university tax guidance.

---

## ⚠️ CRITICAL RESEARCH FINDINGS — READ BEFORE BUILDING

### What Sprintax asks (our main competitor):
- Visa type + entry date + years in US
- Every income source separately (W-2, 1042-S, 1099, self-employment)
- Country of origin (for treaty detection)
- State(s) worked in (multi-state = multiple state returns)
- FICA withheld amounts (Box 4 + Box 6 on W-2)
- Scholarship/fellowship amounts and what they were used for
- Whether student has ITIN or SSN

### What Sprintax MISSES that we should catch:
- Blood/plasma donation income (taxable, often forgotten)
- Cryptocurrency income
- Rental income from subleasing a room
- Bank interest (NOT taxable for NRAs — students often wrongly pay this)
- Gambling winnings
- Prize money / awards from competitions
- Multiple employer FICA refunds (each employer separately)
- Prior year amended returns opportunity (if they used TurboTax wrongly)

### Key tax rules from IRS research:
- NRAs CANNOT claim standard deduction (EXCEPT Indian students under Article 21)
- NRAs CANNOT claim education credits (AOTC, Lifetime Learning Credit)
- NRAs CAN claim: SALT deduction (state/local taxes paid), charitable donations to US orgs
- NRAs CAN deduct: student loan interest (if applicable)
- Bank interest in US savings accounts = NOT taxable for NRAs (huge missed refund!)
- US source income only is taxable (foreign income is NOT taxable for NRAs)
- Multiple states worked = multiple state tax returns required

---

## 📁 FILES TO CREATE

```
components/wizard/
├── WizardProvider.tsx          ← Context + state management for all answers
├── WizardLayout.tsx            ← Wrapper with step indicator + progress bar
├── StepIndicator.tsx           ← Visual step progress
└── steps/
    ├── Step01_Welcome.tsx          ← Intro + what to expect
    ├── Step02_VisaStatus.tsx        ← Visa type + entry date
    ├── Step03_PersonalInfo.tsx      ← Country, state, years in US
    ├── Step04_ResidencyCheck.tsx    ← Substantial presence test result
    ├── Step05_IncomeOverview.tsx    ← Which income types did you have?
    ├── Step06_CampusWork.tsx        ← On-campus employment (W-2)
    ├── Step07_CPT_OPT.tsx           ← CPT/OPT/internship income
    ├── Step08_Scholarship.tsx       ← Scholarship, fellowship, stipend
    ├── Step09_FICA.tsx              ← FICA withheld check
    ├── Step10_OtherIncome.tsx       ← Freelance, 1099, rental, other
    ├── Step11_Deductions.tsx        ← State taxes, charitable, other deductions
    ├── Step12_Documents.tsx         ← What tax docs do they have?
    ├── Step13_TreatyCheck.tsx       ← Treaty benefit calculation
    └── Step14_Results.tsx           ← Full refund breakdown + forms needed

lib/
├── wizard/
│   ├── types.ts                ← All wizard TypeScript types
│   ├── residency-calculator.ts ← Substantial presence test logic
│   ├── refund-engine.ts        ← Full refund calculation
│   └── forms-determinator.ts  ← Which forms does this student need?
```

---

## 📐 TYPES — Create `lib/wizard/types.ts`

```typescript
export type VisaType = 'F1' | 'J1' | 'OPT' | 'STEM_OPT' | 'CPT' | 'J2' | 'F2' | 'H1B' | 'other'

export type EmploymentType =
  | 'campus_job'           // On-campus employment (library, lab, dining, etc.)
  | 'ta_ra'                // Teaching/Research Assistantship
  | 'cpt'                  // Curricular Practical Training (internship during school)
  | 'opt'                  // Optional Practical Training (post-graduation)
  | 'stem_opt'             // STEM OPT Extension
  | 'fellowship_work'      // Work component of a fellowship
  | 'self_employed'        // Freelance / independent contractor
  | 'none'

export interface IncomeSource {
  type: EmploymentType
  employerName: string
  annualIncome: number           // in dollars
  stateWorkedIn: string
  w2Received: boolean
  form1042sReceived: boolean
  ficaWithheld: boolean
  ficaSocialSecurityAmount: number   // Box 4 on W-2
  ficaMedicareAmount: number         // Box 6 on W-2
  federalTaxWithheld: number         // Box 2 on W-2
  stateTaxWithheld: number           // Box 17 on W-2
  months: number                     // how many months worked
}

export interface ScholarshipInfo {
  totalAmount: number
  usedForTuition: number
  usedForFees: number
  usedForBooksSupplies: number
  usedForRoomBoard: number        // TAXABLE
  usedForLivingExpenses: number   // TAXABLE
  usedForOther: number            // TAXABLE
  form1042sReceived: boolean
  fromUniversity: boolean
  fromGovernment: boolean
  fromOtherSource: boolean
}

export interface OtherIncome {
  freelance1099Amount: number
  plasmaBloodDonation: number      // taxable, often overlooked
  bankInterest: number             // NOT taxable for NRAs — refund opportunity
  cryptoGains: number
  rentalIncome: number             // subletting room etc.
  prizeAwardWinnings: number       // competition prizes, etc.
  gamblingWinnings: number
  foreignIncome: number            // NOT taxable for NRAs
}

export interface DeductionInfo {
  stateLocalTaxesPaid: number      // SALT — main NRA deduction
  charitableDonationsUS: number    // donations to US charities only
  studentLoanInterest: number
  healthSavingsAccount: number
}

export interface WizardAnswers {
  // Step 2: Visa
  visaType: VisaType
  usEntryDate: string             // ISO date string
  programEndDate: string
  hasSSN: boolean
  ssnOrItin: string

  // Step 3: Personal
  countryOfOrigin: string
  stateOfResidence: string
  dateOfBirth: string
  universityName: string
  universityState: string
  degreeLevel: 'undergraduate' | 'masters' | 'phd' | 'postdoc' | 'other'

  // Step 4: Computed
  yearsInUS: number               // calculated from entry date
  isNonResidentAlien: boolean     // result of substantial presence test
  isDualStatus: boolean           // arrived/departed mid-year

  // Step 5: Income overview
  hadAnyIncome: boolean
  incomeTypes: EmploymentType[]   // multi-select

  // Step 6-7: Employment income
  incomeSources: IncomeSource[]   // one entry per employer

  // Step 8: Scholarship
  hadScholarship: boolean
  scholarship: ScholarshipInfo

  // Step 9: FICA
  anyFicaWithheld: boolean        // summary flag
  totalFicaWithheld: number       // auto-calculated from incomeSources

  // Step 10: Other income
  otherIncome: OtherIncome

  // Step 11: Deductions
  deductions: DeductionInfo

  // Step 12: Documents
  documentsReceived: {
    w2Forms: number               // how many W-2s
    form1042s: boolean
    form1098t: boolean            // note: NRAs cannot use this
    form1099: boolean
    formW2G: boolean              // gambling winnings
  }

  // Step 13: Treaty
  treatyBenefitApplicable: boolean
  treatyBenefitAmount: number
  form8833Required: boolean

  // Meta
  taxYear: number                 // default 2024
  filedBefore: boolean
  usedTurboTaxBefore: boolean    // flag for amended return opportunity
  completedAt: string
}

// Refund calculation result
export interface RefundBreakdown {
  // Income
  totalGrossIncome: number
  taxableIncome: number
  nonTaxableIncome: number

  // Refunds
  federalTaxRefund: number
  stateTaxRefund: number
  ficaRefund: number              // social security + medicare
  treatyBenefit: number
  saltDeduction: number           // state & local taxes deducted

  // Potential bonuses
  bankInterestRefund: number      // if they paid tax on bank interest (shouldn't have)
  amendedReturnPotential: number  // if they used TurboTax before

  // Totals
  totalEstimatedRefund: number
  totalEstimatedOwed: number

  // Forms required
  formsRequired: FormRequired[]

  // Warnings
  warnings: string[]
  opportunities: RefundOpportunity[]
}

export interface FormRequired {
  formName: string                // "Form 8843"
  description: string             // "Required for all F1/J1 visa holders"
  deadline: string                // "June 15, 2025"
  isRequired: boolean
  downloadUrl: string
}

export interface RefundOpportunity {
  title: string
  amount: number
  description: string
  actionRequired: string
  priority: 'high' | 'medium' | 'low'
}
```

---

## 🧮 REFUND ENGINE — Create `lib/wizard/refund-engine.ts`

Build a pure function that takes `WizardAnswers` and returns `RefundBreakdown`.

Implement ALL of these calculations:

### 1. TAXABLE INCOME CALCULATION
```
Federal taxable income for NRA =
  Wages (W-2 income) from all employers
  + Taxable scholarship (room/board/living expenses portion ONLY)
  + Freelance/1099 income
  + Blood/plasma donation income
  + Gambling winnings
  + Prize money
  + Rental income
  - Treaty exemption amount (if applicable)
  - SALT deduction (state taxes paid, capped at $10,000)
  - Charitable donations to US organizations
  - Student loan interest
  - Scholarship used for tuition/fees/books (EXCLUDED)

NOT taxable:
  - Foreign income (income earned outside the US)
  - Bank interest in US savings/checking accounts (NRA exemption!)
  - Scholarship used for qualified education expenses
```

### 2. FICA REFUND CALCULATION
```
function calculateFICARefund(sources: IncomeSource[], visaType, yearsInUS):
  if (visaType === 'F1' || visaType === 'OPT' || visaType === 'STEM_OPT' || visaType === 'CPT')
    and yearsInUS <= 5:
    ficaRefund = sum of all ficaSocialSecurityAmount + ficaMedicareAmount across all sources
    → This is a FULL refund — student should not have paid this
  
  if (visaType === 'J1') and yearsInUS <= 2:
    ficaRefund = same calculation
  
  return ficaRefund
  // Typical range: $1,500 - $5,000 per year
```

### 3. TREATY BENEFIT CALCULATION
```
function calculateTreatyBenefit(country, visaType, yearsInUS, wages, scholarship):
  
  India (Article 21):
    - Wages exempt up to $10,000 for first 2 years
    - Scholarship fully exempt
    - BONUS: Can claim standard deduction ($14,600 for 2024) — UNIQUE to India!
    - treatyBenefit = min(wages, 10000) * taxRate + scholarship * taxRate
  
  China (Article 20):
    - Wages FULLY exempt for first 5 years (no dollar cap!)
    - Scholarship fully exempt
    - treatyBenefit = wages * taxRate + scholarship * taxRate
  
  South Korea (Article 21):
    - Wages exempt up to $2,000/year for 5 years
    - Scholarship exempt
  
  Germany (Article 20):
    - Wages exempt up to $9,000/year for first 4 years
  
  France, Japan, Netherlands, Sweden, Thailand, Philippines, Pakistan, Indonesia:
    - Various amounts — implement based on treaty data from sources.ts
  
  All others with no treaty:
    - treatyBenefit = 0
    - Add warning: "Your country ({country}) has no tax treaty with the US.
                    Standard nonresident rates apply."
```

### 4. BANK INTEREST REFUND CHECK
```
// THIS IS A HIDDEN REFUND MANY STUDENTS MISS
// US bank interest is NOT taxable for nonresident aliens
// If their bank withheld any tax on interest (shown on 1099-INT), they get it all back

function checkBankInterestRefund(otherIncome):
  if (otherIncome.bankInterest > 0):
    // Assume 30% was wrongly withheld (some banks do this for NRAs)
    return {
      opportunity: "Bank interest refund",
      amount: otherIncome.bankInterest * 0.30,
      description: "US bank interest is not taxable for nonresident aliens. 
                    If your bank withheld taxes on your interest, you can claim a full refund."
    }
```

### 5. AMENDED RETURN OPPORTUNITY
```
function checkAmendedReturnOpportunity(answers):
  if (answers.usedTurboTaxBefore && answers.isNonResidentAlien):
    return {
      opportunity: "Amend prior year returns",
      description: "You mentioned using TurboTax in previous years. TurboTax does NOT 
                    support nonresident alien returns (Form 1040-NR). If you filed 
                    Form 1040 instead of 1040-NR, you may have overpaid taxes. 
                    You can amend returns for the past 3 years using Form 1040-X.",
      priority: 'high'
    }
```

### 6. MULTI-STATE RETURN CHECK
```
function checkMultiStateReturns(incomeSources):
  const statesWorked = new Set(incomeSources.map(s => s.stateWorkedIn))
  if (statesWorked.size > 1):
    return statesWorked.map(state => ({
      form: `${state} State Tax Return`,
      description: `You worked in ${state} — you may need to file a ${state} state return`
    }))
  
  // States with NO income tax (no state return needed):
  const noTaxStates = ['TX', 'FL', 'WA', 'NV', 'WY', 'SD', 'AK', 'TN', 'NH']
  if (noTaxStates.includes(stateOfResidence)):
    add note: "Good news! {state} has no state income tax — no state return needed."
```

### 7. FORMS DETERMINATOR
```
function determineRequiredForms(answers, refundBreakdown):
  forms = []

  // ALWAYS required for F1/J1
  forms.push({
    formName: 'Form 8843',
    description: 'Required for ALL F1/J1 visa holders — even with zero income',
    deadline: answers.hadAnyIncome ? 'April 15, 2025' : 'June 15, 2025',
    isRequired: true
  })

  // Required if had any income
  if (answers.hadAnyIncome):
    forms.push({ formName: 'Form 1040-NR', deadline: 'April 15, 2025', isRequired: true })

  // FICA refund forms
  if (refundBreakdown.ficaRefund > 0):
    forms.push({ formName: 'Form 843', description: 'Claim FICA refund' })
    forms.push({ formName: 'Form 8316', description: 'Required attachment to Form 843' })

  // Treaty disclosure
  if (answers.treatyBenefitApplicable):
    forms.push({ formName: 'Form 8833', description: 'Treaty-based return position disclosure' })

  // No SSN/ITIN yet
  if (!answers.hasSSN):
    forms.push({ formName: 'Form W-7', description: 'Apply for ITIN — attach to first 1040-NR' })

  // Multiple W-2s from same employer (FICA)
  if (answers.incomeSources.length > 1):
    add note about getting W-2 from each employer

  return forms
```

---

## 🖥️ WIZARD STEPS — Build each step component:

---

### STEP 1 — `Step01_Welcome.tsx`
**Content:**
- Headline: "Let's find your maximum tax refund 💰"
- Sub: "We'll ask you ~15 simple questions. Takes about 8 minutes."
- Stats card: "Average refund for international students: **$1,200–$4,800**"
- Three icons: "✓ Free to use" "✓ Covers 65+ countries" "✓ Generates your forms"
- What you'll need: Passport/visa, W-2 forms, 1042-S form, university info
- Big orange "Let's Start →" button
- Small disclaimer: "This is for guidance only, not professional tax advice"

---

### STEP 2 — `Step02_VisaStatus.tsx`
**Questions to ask:**
```
Q1: "What visa type are you on?" (REQUIRED)
  Options as large clickable cards:
  - F-1 (Student visa) — most common
  - J-1 (Exchange visitor)
  - OPT (F-1 graduate working)
  - STEM OPT (F-1 STEM graduate — 3 year extension)
  - CPT (F-1 student doing internship during school)
  - H-1B (Specialty worker — transitioned from F-1)
  - Other

Q2: "When did you first enter the US?" (date picker)
  Helper: "This is the date on your I-94 arrival record. You can look it up at i94.cbp.dhs.gov"

Q3: "When did your current program end (or expected to end)?"
  Only show if OPT/STEM OPT selected

Q4: "Do you have a Social Security Number (SSN) or ITIN?"
  - Yes, I have an SSN
  - Yes, I have an ITIN
  - No, I have neither
  If "No": Show alert → "You'll need to apply for an ITIN using Form W-7. 
  We'll include this in your forms list."
```

**Dynamic banner after visa selection:**
- F-1: "✓ F-1 students are exempt from Social Security & Medicare (FICA) taxes for 5 years"
- J-1: "✓ J-1 students are exempt from FICA taxes for 2 years"
- OPT: "✓ OPT students on F-1 maintain FICA exemption during their first 5 years in the US"

---

### STEP 3 — `Step03_PersonalInfo.tsx`
**Questions to ask:**
```
Q1: "What is your country of origin?" (searchable dropdown of all countries)
  On selection: Check treaty database
  - If treaty exists: Show green banner → "🎉 [Country] has a US tax treaty! 
    This may significantly reduce or eliminate your tax."
  - If no treaty: Show neutral banner → "[Country] does not have a US tax treaty. 
    Standard rates apply."

Q2: "What state do you currently live in?" (dropdown)
  After selection: 
  - If no-tax state (TX, FL, WA, NV, WY, SD, AK): "✓ Great news! [State] has no 
    state income tax."

Q3: "What is your degree level?"
  - Undergraduate
  - Master's
  - PhD / Doctoral
  - Postdoctoral researcher
  - Non-degree / certificate program

Q4: "What is your university's name and state?"
  (Two fields: university name + university state dropdown)
```

---

### STEP 4 — `Step04_ResidencyCheck.tsx`
**No questions — this is a CALCULATED step based on visa + entry date**

Show the result of substantial presence test:
```
Calculate:
  yearsInUS = difference in calendar years between entryDate and Dec 31 of tax year
  
  If F1/J1 and yearsInUS <= 5 (F1) or 2 (J1):
    Status: NONRESIDENT ALIEN
    Show: Green card with explanation
    "You are a Nonresident Alien for tax purposes.
     This means you file Form 1040-NR (not the regular 1040).
     You are ONLY taxed on US-source income — foreign income is not taxed!"
  
  If F1 and yearsInUS > 5:
    Status: RESIDENT ALIEN
    Show: Yellow card with warning
    "After 5 years, you are now a Resident Alien for tax purposes.
     You file the regular Form 1040 and are taxed on worldwide income.
     You can now use TurboTax or other standard tax software."
  
  If arrived mid-year:
    Status: DUAL STATUS
    Show: Orange card
    "You arrived in the US in [year], making you a dual-status alien.
     This is more complex — you were a nonresident for part of the year 
     and may become a resident for the other part."

Also show: "Years counted: X of 5 F-1 exempt years"
Progress bar: [████░░░] 3/5 years used
```

---

### STEP 5 — `Step05_IncomeOverview.tsx`
**Questions to ask:**
```
Q1: "Did you earn any income in the US in [tax year]?" 
  - Yes, I earned income
  - No, I had no income (→ skip to Step 12)

Q2: "Which of these describe how you earned money?" (multi-select checkboxes)
  Each option has a plain-English description below it:
  
  ☐ Campus job (W-2)
    "Working on campus — library, lab assistant, dining hall, IT support, etc."
  
  ☐ Teaching/Research Assistantship (TA/RA)
    "Paid by your university to teach classes or assist with research"
  
  ☐ CPT Internship/Co-op
    "Off-campus internship during school, authorized by your DSO"
  
  ☐ OPT/STEM OPT Employment
    "Working full-time after graduation on your OPT EAD card"
  
  ☐ Fellowship or Stipend
    "Paid directly by your program, not as wages — often on Form 1042-S"
  
  ☐ Scholarship/Grant (partial/full)
    "Tuition covered + any extra funds for living expenses"
  
  ☐ Freelance / Independent Contractor (1099)
    "Gigs, consulting, writing, tutoring, web design, Upwork, Fiverr, etc."
  
  ☐ Blood or Plasma Donation
    "Many students donate plasma for extra money — this IS taxable income"
  
  ☐ Rental Income
    "Subleasing your room or apartment while you were away"
  
  ☐ Other income
    "Any other US-source income not listed above"
```

---

### STEP 6 — `Step06_CampusWork.tsx`
**Show only if campus job OR TA/RA selected in Step 5**

```
Heading: "Tell us about your on-campus work"

For EACH campus job (allow adding multiple):
  Q1: "Employer name" (e.g., "MIT Dining Services", "Stanford Libraries")
  Q2: "Total wages earned in 2024" ($)
  Q3: "State you worked in" (dropdown — important for multi-state)
  Q4: "Did you receive a W-2 from this employer?" (Yes/No)
  
  If YES to W-2:
    Q5: "Box 2 — Federal income tax withheld" ($) [label: "This is on your W-2"]
    Q6: "Box 4 — Social Security tax withheld" ($)
         If > 0: Show orange alert "⚠️ F1/J1 students should NOT pay Social Security tax!
                 You may be entitled to a refund of ${amount}"
    Q7: "Box 6 — Medicare tax withheld" ($)
         If > 0: Same alert as above
    Q8: "Box 17 — State income tax withheld" ($)

+ "Add another employer" button

Important note shown on page:
"💡 Did you work at the university bookstore, dining hall, or campus gym? 
These are all campus employment. Include them here."
```

---

### STEP 7 — `Step07_CPT_OPT.tsx`
**Show only if CPT, OPT, or STEM OPT selected in Step 5**

```
Heading: "Tell us about your internship / OPT work"

For EACH CPT/OPT employer (allow adding multiple):
  Q1: "Company/employer name" (e.g., "Google", "Amazon", "Local startup")
  Q2: "Type of work authorization"
      - CPT (internship during school)
      - OPT (post-graduation, within first 12 months)
      - STEM OPT (extension, months 13-36)
  Q3: "Total wages earned in 2024" ($)
  Q4: "State you worked in"
  Q5: "Did you work remotely or in-office?"
      (Important: determines which state's taxes apply)
  Q6: "Did you receive a W-2?" (Yes/No)
  
  If YES to W-2: (Same W-2 fields as Step 6)
  
  Q7: "How many months did you work at this job in 2024?"
      (Slider: 1-12 months)

Note on page:
"💡 For CPT/OPT: You are STILL exempt from FICA (Social Security + Medicare) taxes 
as long as you are within your first 5 F-1 calendar years in the US.
Many CPT/OPT employers incorrectly withhold FICA — check your W-2!"

"💡 If you had a summer internship AND a fall co-op, add them as separate employers."
```

---

### STEP 8 — `Step08_Scholarship.tsx`
**Show only if scholarship/fellowship selected in Step 5**

```
Heading: "Tell us about your scholarship or fellowship"

Q1: "Total scholarship/fellowship amount received in 2024" ($)
    Helper: "Include all grants, fellowships, stipends — not just tuition waiver"

Q2: "How was this money used?" (allow entering amounts for each):
    Qualified (tax-free):
      - Tuition and required fees: $______
      - Required books and supplies: $______
    
    Non-qualified (TAXABLE — must report):
      - Room and board: $______
      - Living/personal expenses (stipend): $______
      - Travel and other: $______
    
    Auto-calculate: "Taxable scholarship = ${amount}"
    If taxable > 0: Show yellow note "This portion will be reported as income on your 1040-NR"

Q3: "Did you receive a Form 1042-S from your university?"
    - Yes → "Enter the income code and amount from Box 2 of your 1042-S"
    - No → "Your school may not have sent it yet. Check your student portal."

Q4: "Who provided the scholarship?"
    - My university / school
    - US government (NSF, NIH, Fulbright, etc.)
    - Foreign government
    - Private foundation or company

Q5: "Is this scholarship covered by a tax treaty?"
    (Auto-populate based on country + treaty DB — show result)
    If treaty covers scholarship: "✓ Based on [Country]'s treaty, your scholarship 
    may be fully exempt! We'll add Form 8833 to your forms list."
```

---

### STEP 9 — `Step09_FICA.tsx`
**Show only if they had any employment income**

```
This step is a SUMMARY and education step — not collecting new data.
Data was already collected in Steps 6 and 7 via W-2 boxes.

Show a calculated summary card:

"🔍 FICA Exemption Check for [Visa Type]"

Table:
Employer 1: [Google]          FICA Withheld: $2,847  Status: ⚠️ WRONGLY WITHHELD
Employer 2: [MIT Lab]         FICA Withheld: $0       Status: ✅ Correctly exempt

Total FICA withheld: $2,847
Estimated FICA Refund: $2,847

If FICA was withheld:
  Show: "Here's what you need to do:
  1. First, contact [employer name] HR and request a FICA refund directly
  2. If they cannot refund you (company closed, etc.), we'll generate Form 843 + 8316
  3. You have up to 3 YEARS to claim this refund — even for prior tax years!"

Q: "Have you already requested a FICA refund from your employer?"
   - Yes, they refunded it → (subtract from refund total)
   - No, not yet → (include in refund calculation, add Form 843 to forms list)
   - I already filed Form 843 previously → (note this)
```

---

### STEP 10 — `Step10_OtherIncome.tsx`
**Show to everyone**

```
Heading: "Any other income to report?"

Each item is a collapsible accordion — expand only the ones that apply:

☐ Freelance / Contract work (1099-NEC or 1099-MISC)
   If checked:
   Q: "Total freelance income in 2024" ($)
   Q: "What type of work? (tutoring, coding, writing, design, etc.)"
   Q: "Did any client pay you more than $600? (you may have received a 1099)"
   Note: "If your total self-employment income exceeds $400, you must report it."

☐ Blood / Plasma Donation
   If checked:
   Q: "Approximate total received from plasma/blood donation" ($)
   Note: "Income from plasma donation centers (BioLife, CSL Plasma, etc.) is 
   taxable. You may receive a 1099-MISC or just a year-end statement."

☐ Bank interest income
   If checked:
   Q: "Total interest earned in US bank accounts" ($)
   IMPORTANT NOTE: Show this always, even if unchecked:
   "💡 US bank interest is NOT taxable for nonresident aliens! 
   If your bank withheld tax on interest (check your 1099-INT), 
   you can claim a full refund. Don't report this as income."
   Q: "Did your bank withhold any tax on your interest? (check your 1099-INT)"
   If yes → add refund opportunity

☐ Room rental / sublease income
   If checked:
   Q: "Did you sublease your room or apartment while you were away?" 
   Q: "Rental income received" ($)
   Note: "Rental income is taxable US-source income for NRAs."

☐ Cryptocurrency / NFT gains
   If checked:
   Q: "Did you sell or exchange any cryptocurrency in 2024?"
   Q: "Total gains (selling price - purchase price)" ($)
   Note: "Crypto gains from trading are taxable. Losses can offset gains."

☐ Prize money / competition winnings
   If checked:
   Q: "Source of prize (hackathon, academic competition, lottery)" ($)
   Note: "Prize money and awards are taxable income for NRAs."

☐ Foreign income
   If checked:
   Q: "Income earned OUTSIDE the US in 2024" ($)
   IMPORTANT NOTE: "✓ Foreign income is NOT taxable for nonresident aliens!
   You only pay US tax on US-source income. Do not include foreign income 
   on your US tax return."

☐ Gambling winnings
   If checked:
   Q: "Total gambling winnings" ($)
   Note: "Gambling winnings are taxable for NRAs at 30% flat rate. 
   You may receive Form W-2G."
```

---

### STEP 11 — `Step11_Deductions.tsx`
**Show to everyone**

```
Heading: "Let's find every deduction you're entitled to"

Intro note: "As a nonresident alien, you cannot claim the standard deduction 
(EXCEPT Indian students — we'll handle that automatically). 
But there are several deductions you CAN claim."

SECTION A — State & Local Taxes (SALT)
"This is the #1 deduction available to international students"

Q1: "Total state income taxes paid in 2024"
    Helper: "This is shown on your W-2 Box 17. If you had multiple jobs in 
    different states, add them all together."
    Auto-populate from W-2 data entered in previous steps.
    If auto-populated: "We calculated this from your W-2s: $[amount]. Confirm?"
    Cap reminder: "Maximum SALT deduction: $10,000"

SECTION B — Charitable Donations
Q2: "Did you donate to any US-registered charitable organizations?"
    If yes: Q: "Total donations to US charities" ($)
    Note: "Donations to foreign charities do NOT qualify. 
    Only donations to 501(c)(3) US organizations count."

SECTION C — Student Loan Interest
Q3: "Did you pay interest on student loans in 2024?"
    If yes: Q: "Total student loan interest paid" ($)
    "You may receive Form 1098-E showing this amount"
    Note: "This is available even for nonresident aliens on F-1!"

SECTION D — India Special Deduction (auto-shown for Indian students only)
If countryOfOrigin === 'India':
  Show: "🇮🇳 Special bonus for Indian students!
  Under the US-India tax treaty Article 21, you can claim the STANDARD DEDUCTION
  ($14,600 for 2024) — something other nonresident aliens CANNOT do!
  We'll automatically apply this for you."

SECTION E — Self-Employment Expenses
Show only if freelance income > 0:
Q4: "Did you have any business expenses related to your freelance work?"
    - Home office portion of rent (if you work from home): $____
    - Internet and phone (work portion): $____
    - Equipment (laptop, camera, etc.) purchased for work: $____
    - Software subscriptions for work: $____
    - Professional memberships or certifications: $____
    Total: auto-calculate
    Note: "Self-employed NRAs can deduct legitimate business expenses!"
```

---

### STEP 12 — `Step12_Documents.tsx`
**Document checklist**

```
Heading: "Let's check which tax documents you have"

Checklist with status indicators:

☐ W-2 (Wage and Tax Statement)
  "Received from your employer(s) by January 31"
  "How many W-2 forms do you have?" [number input]
  If different from number of employers entered → show warning

☐ Form 1042-S (Foreign Person's US Source Income)
  "Received from your university by March 15 — for scholarship/treaty income"
  If not received yet: "Contact your university's payroll or tax office"

☐ Form 1099-MISC or 1099-NEC
  "For freelance/contract work over $600"

☐ Form 1099-INT
  "For bank interest income. Check if any tax was withheld — you may be 
  able to reclaim it as an NRA!"

☐ Form 1098-T (Tuition Statement)
  IMPORTANT NOTE: "🚫 You CANNOT use Form 1098-T as a nonresident alien.
  Education tax credits (AOTC, Lifetime Learning) are NOT available to NRAs.
  You can ignore this form."
  (Show this note whether they check it or not)

☐ Form W-2G
  "For gambling winnings over $1,200"

☐ I-94 (Arrival/Departure Record)
  "Proves your entry date. Get yours at i94.cbp.dhs.gov"
  "You'll need this when filling Form 8843"

☐ Passport and Visa
  "Needed for ITIN application (Form W-7) if you don't have an SSN"

MISSING DOCUMENTS HELP SECTION:
"Missing a document? Here's what to do:"
- W-2 not received → "Contact your employer's HR or payroll department. 
  Deadline for employers to send W-2 is January 31."
- 1042-S not received → "Contact your university's International Student 
  Office or Tax Services department."
- ITIN needed → "Apply using Form W-7 attached to your 1040-NR"
```

---

### STEP 13 — `Step13_TreatyCheck.tsx`
**Auto-calculated treaty analysis**

```
Heading: "Checking your tax treaty benefits..."

Show animated loading for 1 second, then display results.

For each applicable treaty:

INDIA:
┌─────────────────────────────────────────────────────┐
│ 🇮🇳 US-India Tax Treaty — Article 21               │
│ Status: APPLICABLE ✓                                │
│                                                      │
│ Benefits you qualify for:                           │
│ • Wages exempt up to $10,000 (Year 1-2 only)       │
│ • All scholarship income: EXEMPT                    │
│ • BONUS: Standard deduction ($14,600) available!   │
│                                                      │
│ Tax savings estimate: $1,400                        │
│ Form required: Form 8833 (auto-generated)           │
│                                                      │
│ ⚠️ Note: You must NOT have been in the US as a     │
│ student for more than 2 years to claim wage        │
│ exemption. You've been here X years.               │
└─────────────────────────────────────────────────────┘

CHINA:
┌─────────────────────────────────────────────────────┐
│ 🇨🇳 US-China Tax Treaty — Article 20               │
│ Status: APPLICABLE ✓                                │
│                                                      │
│ Benefits you qualify for:                           │
│ • ALL wage income: FULLY EXEMPT (for 5 years)      │
│ • All scholarship income: EXEMPT                    │
│                                                      │
│ Tax savings estimate: $3,200                        │
│ Form required: Form 8833 (auto-generated)           │
│                                                      │
│ Clock: You have used X of 5 exempt years           │
│ [████░░] X/5 years                                 │
└─────────────────────────────────────────────────────┘

NO TREATY (e.g., Bangladesh, Nepal, Nigeria):
┌─────────────────────────────────────────────────────┐
│ [Country] — No Tax Treaty                          │
│                                                      │
│ [Country] does not have a tax treaty with the US.  │
│ Standard nonresident alien tax rates apply.         │
│                                                      │
│ Standard NRA tax brackets (2024):                  │
│ 10% on first $11,600                               │
│ 12% on $11,601–$47,150                             │
│ 22% on $47,151–$100,525                            │
│                                                      │
│ Your estimated federal tax owed: $XXX              │
└─────────────────────────────────────────────────────┘

Q: "Are you aware of this treaty benefit?"
   - Yes, I've already claimed this benefit
   - No, I didn't know about this! (→ flag as new refund opportunity)
   - I'm not sure (→ flag for clarification, add Form 8833 to list)
```

---

### STEP 14 — `Step14_Results.tsx`
**The big reveal — full refund breakdown**

```
This is the most important page. Make it visually impressive.

HEADER:
"🎉 Your Estimated Tax Refund"
Big animated number showing total refund

REFUND BREAKDOWN CARD:
┌──────────────────────────────────────────────────┐
│  💰 REFUND BREAKDOWN                             │
│                                                    │
│  Federal tax refund          $  1,200             │
│  State tax refund (CA)       $    450             │
│  FICA refund                 $  2,847  🔥 Don't miss this! │
│  Treaty benefit (India)      $  1,400             │
│  Bank interest refund        $     45  💡 Often missed │
│  ─────────────────────────────────────           │
│  TOTAL ESTIMATED REFUND     $  5,942             │
│                                                    │
│  (Disclaimer: Estimate based on info provided.   │
│   Actual refund depends on final tax documents)  │
└──────────────────────────────────────────────────┘

INCOME SUMMARY CARD:
Total Income Reported:    $XX,XXX
  - Wages (W-2):          $XX,XXX
  - Taxable Scholarship:  $ X,XXX
  - Freelance (1099):     $ X,XXX
  - Other:                $   XXX
Non-taxable Income:       $ X,XXX
  - Foreign income:       $ X,XXX (not taxed as NRA)
  - Bank interest:        $   XXX (NRA exemption)
  - Qualified scholarship:$ X,XXX
Taxable Income after treaty/deductions: $XX,XXX

REFUND OPPORTUNITIES SECTION:
Show each opportunity as a colored card, sorted by priority/amount:

🔴 HIGH PRIORITY — $2,847 potential refund
"FICA Refund"
Your employer withheld Social Security and Medicare taxes — but F1 students 
don't owe these! File Form 843 + 8316 to get $2,847 back.
[→ Add to my forms list]

🟡 MEDIUM PRIORITY — $1,400 potential refund  
"India Treaty Benefit not previously claimed"
You may have missed claiming the India treaty in prior years.
You can amend returns for 2021, 2022, 2023 to recover overpaid taxes.
[→ Learn how to amend]

🟢 NEW OPPORTUNITY — $45 potential refund
"Bank Interest Tax Refund"
Your bank withheld taxes on your interest — NRAs are exempt from this.
[→ Add to my return]

FORMS YOU NEED SECTION:
┌─────────────────────────────────────────────────────┐
│ 📋 FORMS TO FILE                                    │
│                                                      │
│ ✅ REQUIRED                                         │
│ Form 8843         Due: June 15, 2025               │
│ Form 1040-NR      Due: April 15, 2025              │
│                                                      │
│ 💰 FOR YOUR REFUND                                  │
│ Form 843          FICA refund claim                │
│ Form 8316         Attachment to Form 843           │
│ Form 8833         Treaty disclosure                │
│                                                      │
│ 🆔 IDENTITY                                         │
│ Form W-7          ITIN application (if needed)     │
└─────────────────────────────────────────────────────┘

DEADLINES SECTION:
📅 Key Dates:
  Jan 31: Your employer must send W-2
  Mar 15: University must send Form 1042-S
  Apr 15: File 1040-NR if you had income
  Jun 15: File Form 8843 if no income
  3 years: Time limit to amend prior returns (2021, 2022, 2023)

TWO CTA BUTTONS:
[💬 Ask TaxBuddy AI a Question]   [📥 Download My Forms]

SHARE/SAVE:
"Sign in to save your results and return later →"
```

---

## ⚠️ IMPORTANT WARNINGS TO SHOW THROUGHOUT THE WIZARD

Show these at the right steps as contextual banners:

1. **TurboTax Warning** (show if they selected H1B and years in US > 5, or resident alien):
   "⚠️ TurboTax does NOT support Form 1040-NR (the nonresident tax return). 
   If you used TurboTax while you were still a nonresident, you may have filed 
   the wrong form. You can amend prior returns."

2. **Multi-employer FICA** (show if > 1 employer):
   "💡 If multiple employers withheld FICA, you need a separate Form 843 claim 
   for each employer. We'll generate them all."

3. **State tax filing** (show at Step 11 if > 1 state worked):
   "⚠️ You worked in multiple states. You may need to file separate tax returns 
   for each state: [list states]"

4. **1098-T Warning** (show in Step 12):
   "🚫 DO NOT use Form 1098-T on your nonresident return. Education credits 
   (AOTC, Lifetime Learning Credit) are not available to nonresident aliens."

5. **Prior Year Amended Return** (show if usedTurboTaxBefore === true):
   "🔔 Important: You mentioned using TurboTax in previous years. TurboTax does 
   not support nonresident alien returns. You may be entitled to additional 
   refunds by amending your prior year returns (up to 3 years back)."

6. **Foreign Income Not Taxable** (show in Step 10):
   "✅ Reminder: As a nonresident alien, you are ONLY taxed on US-source income. 
   Income earned in your home country is NOT reported on your US tax return."

---

## 🎨 UI/UX REQUIREMENTS

1. **Progress indicator**: Show step X of 14 + estimated time remaining
2. **Save & continue later**: Save wizard state to localStorage after each step
3. **Back navigation**: Always allow going back and changing answers
4. **Tooltips**: Every tax term has a "?" icon with plain-English explanation
5. **Real-time refund counter**: Show a running refund estimate in the header
   that updates as the user answers questions
6. **Mobile-first**: All steps must work on phone screen
7. **Plain English**: Every question must be understandable by a non-tax person
8. **Validation**: All monetary inputs must accept numbers with $ formatting
9. **Auto-save**: Save to localStorage after every step
10. **Animations**: Smooth transitions between steps, celebrate on results page

---

## ✅ COMPLETION CHECKLIST

- [ ] `lib/wizard/types.ts` — all interfaces created
- [ ] `lib/wizard/residency-calculator.ts` — substantial presence test works
- [ ] `lib/wizard/refund-engine.ts` — all 7 calculations implemented
- [ ] `lib/wizard/forms-determinator.ts` — correct forms for every scenario
- [ ] `WizardProvider.tsx` — state persisted across all 14 steps
- [ ] All 14 step components built
- [ ] FICA calculation works for F1, J1, OPT, STEM OPT, CPT
- [ ] Treaty calculator covers India, China, Korea, Germany + all others
- [ ] Bank interest NRA exemption is flagged as refund opportunity
- [ ] Multi-state employment triggers multiple state returns
- [ ] TurboTax amended return opportunity detected and shown
- [ ] 1098-T warning shown (it cannot be used for NRA returns)
- [ ] Forms list is dynamically built based on answers
- [ ] Results page shows animated refund counter
- [ ] Real-time refund estimate updates in header throughout wizard
- [ ] All steps mobile-responsive
- [ ] All monetary inputs properly formatted

---

## 🚀 FIRST COMMAND

```bash
# Create WizardProvider first, then build steps in order
touch components/wizard/WizardProvider.tsx
touch lib/wizard/types.ts
touch lib/wizard/residency-calculator.ts
touch lib/wizard/refund-engine.ts
touch lib/wizard/forms-determinator.ts
```

**Start with `lib/wizard/types.ts`, then `refund-engine.ts`, then each step component in order 1-14.**
