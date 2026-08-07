import db from './db.js';

const jurisdictions = [
  { id: 'UG', name: 'Uganda' },
  { id: 'IN', name: 'India' },
];

// Core legal rules database. This is the "intellectual core" of the project —
// each rule maps to a real statute/regulation. check_type 'deterministic' rules
// are evaluated in code against clause metadata; 'llm' rules need language
// interpretation and go through the ambiguity layer.
const rules = [
  {
    id: 'deposit_001',
    jurisdiction_id: 'UG',
    clause_type: 'deposit',
    description: 'Security deposit exceeds legally reasonable amount',
    what_it_prohibits: 'Landlords demanding excessive security deposits beyond customary limits (commonly capped at rent for a few months in tenancy guidance).',
    severity: 'critical',
    legal_reference: 'Landlord and Tenant Act, 2022 (Uganda) - deposit provisions',
    check_type: 'deterministic',
    check_config: JSON.stringify({ field: 'deposit_months', max: 3 }),
    last_verified: '2025-01-01',
    source_url: 'https://ulii.org/'
  },
  {
    id: 'deposit_002',
    jurisdiction_id: 'UG',
    clause_type: 'deposit',
    description: 'Clause states deposit is non-refundable under any circumstances',
    what_it_prohibits: 'Blanket non-refundable deposit clauses that do not account for lawful deductions only (damage beyond normal wear and tear, unpaid rent).',
    severity: 'critical',
    legal_reference: 'Landlord and Tenant Act, 2022 (Uganda)',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://ulii.org/'
  },
  {
    id: 'entry_001',
    jurisdiction_id: 'UG',
    clause_type: 'entry_rights',
    description: 'Landlord may enter without notice',
    what_it_prohibits: 'Clauses allowing landlord entry at any time without reasonable prior notice to the tenant, violating quiet enjoyment.',
    severity: 'moderate',
    legal_reference: 'Landlord and Tenant Act, 2022 (Uganda) - quiet enjoyment provisions',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://ulii.org/'
  },
  {
    id: 'notice_001',
    jurisdiction_id: 'UG',
    clause_type: 'notice_period',
    description: 'Notice period for termination shorter than statutory minimum',
    what_it_prohibits: 'Termination notice periods shorter than the statutory minimum (commonly one full rental period).',
    severity: 'critical',
    legal_reference: 'Landlord and Tenant Act, 2022 (Uganda)',
    check_type: 'deterministic',
    check_config: JSON.stringify({ field: 'notice_days', min: 30 }),
    last_verified: '2025-01-01',
    source_url: 'https://ulii.org/'
  },
  {
    id: 'repairs_001',
    jurisdiction_id: 'UG',
    clause_type: 'repairs',
    description: 'Tenant made solely responsible for structural repairs',
    what_it_prohibits: 'Shifting landlord\'s structural repair obligations entirely onto the tenant.',
    severity: 'moderate',
    legal_reference: 'Landlord and Tenant Act, 2022 (Uganda) - repair obligations',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://ulii.org/'
  },
  {
    id: 'eviction_001',
    jurisdiction_id: 'UG',
    clause_type: 'eviction',
    description: 'Self-help eviction clause (lockout/utility shutoff without court order)',
    what_it_prohibits: 'Clauses permitting the landlord to lock out the tenant or cut utilities without a court order.',
    severity: 'critical',
    legal_reference: 'Landlord and Tenant Act, 2022 (Uganda) - lawful eviction procedure',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://ulii.org/'
  },
  {
    id: 'increase_001',
    jurisdiction_id: 'UG',
    clause_type: 'rent_increase',
    description: 'Rent increase allowed with less than statutory notice',
    what_it_prohibits: 'Rent increases taking effect with less than the statutory notice period.',
    severity: 'moderate',
    legal_reference: 'Landlord and Tenant Act, 2022 (Uganda)',
    check_type: 'deterministic',
    check_config: JSON.stringify({ field: 'rent_increase_notice_days', min: 90 }),
    last_verified: '2025-01-01',
    source_url: 'https://ulii.org/'
  },
  {
    id: 'discrimination_001',
    jurisdiction_id: 'UG',
    clause_type: 'discrimination',
    description: 'Discriminatory tenancy conditions',
    what_it_prohibits: 'Clauses imposing different terms based on protected characteristics.',
    severity: 'critical',
    legal_reference: 'Constitution of Uganda, Art. 21 (equality and non-discrimination)',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://ulii.org/'
  },


  // ============================================================
  // INDIA — Comprehensive Ruleset
  // Sources:
  //   • Constitution of India (Articles 14, 15, 19, 21, 300A)
  //   • Model Tenancy Act, 2021 (MTA)
  //   • Transfer of Property Act, 1882 (TPA)
  //   • Indian Contract Act, 1872 (ICA)
  //   • Consumer Protection Act, 2019 (CPA)
  //   • Real Estate (Regulation and Development) Act, 2016 (RERA)
  //   • State Rent Control Acts (Delhi, Maharashtra, Karnataka, etc.)
  //   • Information Technology Act, 2000 (ITA) — for privacy clauses
  // ============================================================

  // --- Deposit ---
  {
    id: 'in_deposit_001',
    jurisdiction_id: 'IN',
    clause_type: 'deposit',
    description: 'Security deposit exceeds 2 months rent (residential)',
    what_it_prohibits: 'Security deposits above 2 months rent for residential premises under the Model Tenancy Act. Some states like Maharashtra and Karnataka allow higher deposits by practice, but the MTA cap is 2 months.',
    severity: 'moderate',
    legal_reference: 'Model Tenancy Act, 2021, Section 10(1)',
    check_type: 'deterministic',
    check_config: JSON.stringify({ field: 'deposit_months', max: 2 }),
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },
  {
    id: 'in_deposit_002',
    jurisdiction_id: 'IN',
    clause_type: 'deposit',
    description: 'Deposit stated as non-refundable under any circumstances',
    what_it_prohibits: 'Blanket non-refundable deposit clauses. The landlord must refund the deposit minus lawful deductions (unpaid rent, documented damage beyond normal wear and tear) within one month of vacation.',
    severity: 'critical',
    legal_reference: 'Model Tenancy Act, 2021, Section 10(3); Indian Contract Act, 1872, Section 74',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },
  {
    id: 'in_deposit_003',
    jurisdiction_id: 'IN',
    clause_type: 'deposit',
    description: 'Landlord can forfeit deposit for any lease violation without adjudication',
    what_it_prohibits: 'Automatic forfeiture clauses that let the landlord pocket the entire deposit for any breach without a dispute resolution process violate natural justice principles and the Model Tenancy Act.',
    severity: 'critical',
    legal_reference: 'Model Tenancy Act, 2021, Section 10; Indian Contract Act, 1872, Section 74',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },
  {
    id: 'in_deposit_004',
    jurisdiction_id: 'IN',
    clause_type: 'deposit',
    description: 'Landlord charges additional hidden fees disguised as deposit',
    what_it_prohibits: 'Clauses requiring "registration fees", "society fees", "parking deposits", or other charges at the start of tenancy that effectively increase the security deposit beyond legal limits.',
    severity: 'moderate',
    legal_reference: 'Model Tenancy Act, 2021, Section 10; Consumer Protection Act, 2019',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },

  // --- Entry Rights ---
  {
    id: 'in_entry_001',
    jurisdiction_id: 'IN',
    clause_type: 'entry_rights',
    description: 'Landlord may enter without 24 hours written notice',
    what_it_prohibits: 'Clauses allowing landlord entry without at least 24 hours prior written notice, except in a genuine emergency. Violates the tenant\'s right to quiet enjoyment and privacy under Article 21.',
    severity: 'moderate',
    legal_reference: 'Model Tenancy Act, 2021, Section 21; Constitution of India, Article 21 (right to privacy — K.S. Puttaswamy v. UoI, 2017)',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },
  {
    id: 'in_entry_002',
    jurisdiction_id: 'IN',
    clause_type: 'entry_rights',
    description: 'Landlord may enter at any time for inspection without restriction',
    what_it_prohibits: 'Blanket right-of-entry clauses with no time restriction violate the tenant\'s constitutional right to privacy in their home.',
    severity: 'critical',
    legal_reference: 'Constitution of India, Article 21; Model Tenancy Act, 2021, Section 21',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },

  // --- Notice Period ---
  {
    id: 'in_notice_001',
    jurisdiction_id: 'IN',
    clause_type: 'notice_period',
    description: 'Termination notice period shorter than 1 month',
    what_it_prohibits: 'Termination notice periods shorter than one month, which is the common statutory minimum under most state Rent Control Acts and the Model Tenancy Act.',
    severity: 'critical',
    legal_reference: 'Model Tenancy Act, 2021, Section 19; Delhi Rent Control Act, 1958; Maharashtra Rent Control Act, 1999',
    check_type: 'deterministic',
    check_config: JSON.stringify({ field: 'notice_days', min: 30 }),
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },
  {
    id: 'in_notice_002',
    jurisdiction_id: 'IN',
    clause_type: 'notice_period',
    description: 'Notice period is asymmetric — landlord gets shorter notice than tenant',
    what_it_prohibits: 'Clauses where the tenant must give more notice to vacate than the landlord must give to terminate the tenancy. This creates an unfair imbalance and may violate Article 14 (equality before law).',
    severity: 'moderate',
    legal_reference: 'Constitution of India, Article 14; Model Tenancy Act, 2021, Section 19',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },
  {
    id: 'in_notice_003',
    jurisdiction_id: 'IN',
    clause_type: 'notice_period',
    description: 'Landlord can terminate tenancy without any stated reason',
    what_it_prohibits: 'Clauses permitting termination at landlord\'s sole discretion without specifying valid grounds. Under the MTA, eviction must be for enumerated grounds (non-payment, misuse, etc.).',
    severity: 'critical',
    legal_reference: 'Model Tenancy Act, 2021, Sections 21-22; Transfer of Property Act, 1882, Section 106',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },

  // --- Repairs ---
  {
    id: 'in_repairs_001',
    jurisdiction_id: 'IN',
    clause_type: 'repairs',
    description: 'Tenant made solely responsible for all structural repairs',
    what_it_prohibits: 'Shifting the landlord\'s statutory obligation to maintain structural soundness (roof, walls, plumbing infrastructure, electrical wiring) entirely onto the tenant.',
    severity: 'moderate',
    legal_reference: 'Model Tenancy Act, 2021, Section 14; Transfer of Property Act, 1882, Section 108(e)',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },
  {
    id: 'in_repairs_002',
    jurisdiction_id: 'IN',
    clause_type: 'repairs',
    description: 'Landlord has no obligation to restore habitability after disaster/damage',
    what_it_prohibits: 'Clauses absolving the landlord from restoring the property to a habitable condition after fire, flood, or structural damage beyond tenant\'s control.',
    severity: 'critical',
    legal_reference: 'Transfer of Property Act, 1882, Section 108(e); Model Tenancy Act, 2021, Section 14',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },
  {
    id: 'in_repairs_003',
    jurisdiction_id: 'IN',
    clause_type: 'repairs',
    description: 'Tenant responsible for "wear and tear" deductions without objective standard',
    what_it_prohibits: 'Vague clauses holding tenants financially responsible for "normal wear and tear" — which is legally the landlord\'s responsibility and cannot be deducted from the deposit.',
    severity: 'moderate',
    legal_reference: 'Model Tenancy Act, 2021, Section 10(3); Transfer of Property Act, 1882, Section 108',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },

  // --- Eviction ---
  {
    id: 'in_eviction_001',
    jurisdiction_id: 'IN',
    clause_type: 'eviction',
    description: 'Self-help eviction (lockout/utility shutoff without Rent Court order)',
    what_it_prohibits: 'Clauses permitting the landlord to lock out the tenant, remove belongings, or cut utilities without a Rent Court/Rent Authority order. This constitutes forcible dispossession — a criminal offence.',
    severity: 'critical',
    legal_reference: 'Model Tenancy Act, 2021, Sections 23-24; IPC Section 441 (criminal trespass); Constitution of India, Article 300A (right to property)',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },
  {
    id: 'in_eviction_002',
    jurisdiction_id: 'IN',
    clause_type: 'eviction',
    description: 'Clause allows eviction for minor or subjective lease breaches',
    what_it_prohibits: 'Disproportionate eviction clauses triggered by minor infractions (e.g. one day late rent, guest staying overnight) without a cure period. The MTA requires a written notice and opportunity to remedy before eviction.',
    severity: 'critical',
    legal_reference: 'Model Tenancy Act, 2021, Section 21; natural justice principles',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },

  // --- Rent Increase ---
  {
    id: 'in_increase_001',
    jurisdiction_id: 'IN',
    clause_type: 'rent_increase',
    description: 'Rent increase with less than 3 months written notice',
    what_it_prohibits: 'Rent increases taking effect with less than 3 months\' written notice to the tenant.',
    severity: 'moderate',
    legal_reference: 'Model Tenancy Act, 2021, Section 9',
    check_type: 'deterministic',
    check_config: JSON.stringify({ field: 'rent_increase_notice_days', min: 90 }),
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },
  {
    id: 'in_increase_002',
    jurisdiction_id: 'IN',
    clause_type: 'rent_increase',
    description: 'Landlord can increase rent arbitrarily without a stated cap or formula',
    what_it_prohibits: 'Clauses giving the landlord uncapped, unilateral discretion to raise rent at any time by any amount. Should be linked to an index (CPI) or a fixed percentage cap.',
    severity: 'moderate',
    legal_reference: 'Model Tenancy Act, 2021, Section 9; state Rent Control Acts',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },
  {
    id: 'in_increase_003',
    jurisdiction_id: 'IN',
    clause_type: 'rent_increase',
    description: 'Retroactive rent increase applied to past rent already paid',
    what_it_prohibits: 'Any clause purporting to apply a rent revision retrospectively to periods already paid.',
    severity: 'critical',
    legal_reference: 'Indian Contract Act, 1872, Section 10; Model Tenancy Act, 2021',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },

  // --- Discrimination ---
  {
    id: 'in_discrimination_001',
    jurisdiction_id: 'IN',
    clause_type: 'discrimination',
    description: 'Discriminatory tenancy conditions based on protected characteristics',
    what_it_prohibits: 'Clauses imposing different terms or outright refusing tenancy based on religion, caste, sex, place of birth, or other protected characteristics.',
    severity: 'critical',
    legal_reference: 'Constitution of India, Articles 14, 15 & 17; Scheduled Castes and Scheduled Tribes (Prevention of Atrocities) Act, 1989',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },
  {
    id: 'in_discrimination_002',
    jurisdiction_id: 'IN',
    clause_type: 'discrimination',
    description: 'Clause restricts dietary practices or lifestyle based on religion/community',
    what_it_prohibits: 'Clauses prohibiting tenants from consuming certain foods, observing religious practices, or hosting religious gatherings in a manner that targets specific communities.',
    severity: 'critical',
    legal_reference: 'Constitution of India, Articles 15, 25 (freedom of religion) & 21 (right to life with dignity)',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },
  {
    id: 'in_discrimination_003',
    jurisdiction_id: 'IN',
    clause_type: 'discrimination',
    description: 'Clause prohibits female tenants from having guests after a curfew',
    what_it_prohibits: 'Gender-based guest restrictions or curfew clauses that apply only to women violate Articles 14 and 15 (equality and non-discrimination on grounds of sex).',
    severity: 'critical',
    legal_reference: 'Constitution of India, Articles 14, 15 & 21',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },

  // --- Penalty / Late Fees ---
  {
    id: 'in_penalty_001',
    jurisdiction_id: 'IN',
    clause_type: 'penalty',
    description: 'Late payment penalty is disproportionate / constitutes a penalty in law',
    what_it_prohibits: 'Late fee clauses where the penalty is grossly excessive compared to the actual loss (e.g. 10%+ of monthly rent per day late). Indian courts routinely reduce such penalty clauses under Section 74 of the Indian Contract Act.',
    severity: 'moderate',
    legal_reference: 'Indian Contract Act, 1872, Section 74; Fateh Chand v. Balkishan Das (SC, 1963)',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://indiankanoon.org/'
  },
  {
    id: 'in_penalty_002',
    jurisdiction_id: 'IN',
    clause_type: 'penalty',
    description: 'Compound interest on overdue rent or charges',
    what_it_prohibits: 'Clauses charging compound interest on overdue rent amounts. Indian courts treat this as an unreasonable penalty clause.',
    severity: 'moderate',
    legal_reference: 'Indian Contract Act, 1872, Section 74',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://indiankanoon.org/'
  },
  {
    id: 'in_penalty_003',
    jurisdiction_id: 'IN',
    clause_type: 'penalty',
    description: 'Tenant liable for penalties even when breach is caused by landlord',
    what_it_prohibits: 'Penalty clauses that do not carve out situations where the tenant\'s default is directly caused by the landlord\'s failure (e.g. utility outage caused by landlord non-payment).',
    severity: 'moderate',
    legal_reference: 'Indian Contract Act, 1872, Sections 39 & 55',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://indiankanoon.org/'
  },

  // --- Subletting ---
  {
    id: 'in_subletting_001',
    jurisdiction_id: 'IN',
    clause_type: 'subletting',
    description: 'Absolute ban on subletting with severe penalty / automatic termination',
    what_it_prohibits: 'Clauses imposing automatic tenancy termination or criminal complaint for any subletting without distinguishing between commercial subletting and housing a family member. Disproportionate response.',
    severity: 'minor',
    legal_reference: 'Transfer of Property Act, 1882, Section 108(j); Model Tenancy Act, 2021',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },

  // --- Utilities ---
  {
    id: 'in_utilities_001',
    jurisdiction_id: 'IN',
    clause_type: 'utilities',
    description: 'Landlord charges utilities above actual metered rate',
    what_it_prohibits: 'Clauses allowing the landlord to charge electricity or water at rates above the DISCOM/water board tariff. Sub-metering at above-tariff rates is illegal under the Electricity Act, 2003.',
    severity: 'critical',
    legal_reference: 'Electricity Act, 2003, Section 163; CEA (Installation and Operation of Meters) Regulations; Consumer Protection Act, 2019',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://cercind.gov.in/'
  },
  {
    id: 'in_utilities_002',
    jurisdiction_id: 'IN',
    clause_type: 'utilities',
    description: 'Landlord can disconnect utilities as a remedy for non-payment of rent',
    what_it_prohibits: 'Clauses permitting disconnection of electricity, water, or gas as a method of debt recovery for unpaid rent. This is illegal self-help eviction in disguise.',
    severity: 'critical',
    legal_reference: 'Model Tenancy Act, 2021, Section 23; Electricity Act, 2003; IPC Section 441',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },
  {
    id: 'in_utilities_003',
    jurisdiction_id: 'IN',
    clause_type: 'utilities',
    description: 'Maintenance charges are undefined or can be revised arbitrarily',
    what_it_prohibits: 'Society maintenance or common area charges billed to the tenant without a fixed amount or auditable formula, allowing the landlord to inflate bills at will.',
    severity: 'minor',
    legal_reference: 'Consumer Protection Act, 2019; Model Tenancy Act, 2021',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },

  // --- Arbitration ---
  {
    id: 'in_arbitration_001',
    jurisdiction_id: 'IN',
    clause_type: 'arbitration',
    description: 'Dispute resolution clause ousts jurisdiction of Rent Authority / civil courts',
    what_it_prohibits: 'Mandatory private arbitration clauses that attempt to remove the tenant\'s right to approach the Rent Authority, Rent Court, or consumer forum. These forums are statutory and cannot be contractually excluded.',
    severity: 'critical',
    legal_reference: 'Model Tenancy Act, 2021, Sections 30-38 (Rent Authority & Rent Court); Consumer Protection Act, 2019; Arbitration & Conciliation Act, 1996, Section 8',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },
  {
    id: 'in_arbitration_002',
    jurisdiction_id: 'IN',
    clause_type: 'arbitration',
    description: 'Arbitrator is appointed solely by landlord',
    what_it_prohibits: 'Clauses where the landlord alone appoints the sole arbitrator, creating an obvious bias. The Arbitration and Conciliation Act requires a mutually agreed or court-appointed arbitrator.',
    severity: 'moderate',
    legal_reference: 'Arbitration and Conciliation Act, 1996, Section 11; TRF Ltd. v. Energo Engg (SC, 2017)',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://indiankanoon.org/'
  },

  // --- Privacy / Surveillance ---
  {
    id: 'in_privacy_001',
    jurisdiction_id: 'IN',
    clause_type: 'privacy',
    description: 'CCTV/surveillance inside rented premises without tenant consent',
    what_it_prohibits: 'Clauses permitting the landlord to install or retain CCTV cameras inside the rented home (bedrooms, bathrooms, living spaces) violate the constitutionally protected right to privacy.',
    severity: 'critical',
    legal_reference: 'Constitution of India, Article 21 (K.S. Puttaswamy v. UoI, 2017); Information Technology Act, 2000, Section 66E',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://indiankanoon.org/'
  },
  {
    id: 'in_privacy_002',
    jurisdiction_id: 'IN',
    clause_type: 'privacy',
    description: 'Landlord can photograph/video the interior without tenant consent',
    what_it_prohibits: 'Clauses permitting the landlord to photograph or record the interior of the rented premises (e.g. for re-listing) without the tenant\'s explicit consent during occupancy.',
    severity: 'moderate',
    legal_reference: 'Constitution of India, Article 21; Information Technology Act, 2000',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://indiankanoon.org/'
  },

  // --- Abandonment ---
  {
    id: 'in_abandonment_001',
    jurisdiction_id: 'IN',
    clause_type: 'abandonment',
    description: 'Tenant deemed to have abandoned premises after a very short absence',
    what_it_prohibits: 'Clauses declaring abandonment and permitting the landlord to retake possession if the tenant is absent for a short period (e.g. 7–15 days) without considering that the tenant may be hospitalised, travelling, etc.',
    severity: 'critical',
    legal_reference: 'Model Tenancy Act, 2021; Transfer of Property Act, 1882, Section 108; Constitution of India, Article 300A',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },

  // --- Waiver of Rights ---
  {
    id: 'in_waiver_001',
    jurisdiction_id: 'IN',
    clause_type: 'waiver',
    description: 'Tenant required to waive statutory rights under Rent Control Acts',
    what_it_prohibits: 'Clauses where the tenant pre-emptively waives rights granted by statute (e.g. right to approach Rent Authority, right to refund of deposit, right to habitable premises). Statutory rights cannot be waived by contract.',
    severity: 'critical',
    legal_reference: 'Indian Contract Act, 1872, Section 23; Model Tenancy Act, 2021; Constitution of India, Article 13',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://indiankanoon.org/'
  },
  {
    id: 'in_waiver_002',
    jurisdiction_id: 'IN',
    clause_type: 'waiver',
    description: 'Tenant acknowledges property is in perfect condition without inspection',
    what_it_prohibits: 'Clauses requiring the tenant to sign that the property is in perfect condition "as seen" before they have had the opportunity to inspect it, effectively waiving future repair claims.',
    severity: 'moderate',
    legal_reference: 'Indian Contract Act, 1872, Section 17 (misrepresentation); Model Tenancy Act, 2021, Section 11',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },

  // --- Indemnity ---
  {
    id: 'in_indemnity_001',
    jurisdiction_id: 'IN',
    clause_type: 'indemnity',
    description: 'Tenant made liable for all landlord\'s legal costs including cases landlord loses',
    what_it_prohibits: 'Overbroad indemnity clauses holding the tenant responsible for ALL of the landlord\'s legal fees and losses, including situations arising from the landlord\'s own negligence or wrongful acts.',
    severity: 'critical',
    legal_reference: 'Indian Contract Act, 1872, Sections 124-125 (indemnity); Section 23 (void against public policy)',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://indiankanoon.org/'
  },
  {
    id: 'in_indemnity_002',
    jurisdiction_id: 'IN',
    clause_type: 'indemnity',
    description: 'Tenant indemnifies landlord for landlord\'s own structural negligence',
    what_it_prohibits: 'Clauses requiring the tenant to indemnify the landlord for injuries or property damage caused by the landlord\'s own failure to maintain the structure (e.g. ceiling collapse, electrical fire from faulty wiring).',
    severity: 'critical',
    legal_reference: 'Indian Contract Act, 1872, Section 23; Transfer of Property Act, 1882, Section 108(e)',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://indiankanoon.org/'
  },

  // --- Unilateral Modification ---
  {
    id: 'in_modification_001',
    jurisdiction_id: 'IN',
    clause_type: 'modification',
    description: 'Landlord can unilaterally amend lease terms without tenant consent',
    what_it_prohibits: 'Clauses that allow the landlord to change lease terms (rent, rules, restrictions) at will by giving notice, without requiring the tenant\'s agreement. Binding contracts require mutual consent to vary.',
    severity: 'critical',
    legal_reference: 'Indian Contract Act, 1872, Section 62 (novation); Section 10 (valid contracts require free consent)',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://indiankanoon.org/'
  },
  {
    id: 'in_modification_002',
    jurisdiction_id: 'IN',
    clause_type: 'modification',
    description: 'Landlord can add house rules and bylaws at any time that become binding',
    what_it_prohibits: 'Clauses incorporating "house rules" by reference and allowing the landlord to change those rules unilaterally. New rules imposed after signing are not binding on the tenant without fresh consent.',
    severity: 'moderate',
    legal_reference: 'Indian Contract Act, 1872, Sections 10 & 62',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://indiankanoon.org/'
  },

  // --- Suspicious / Predatory Clauses (not strictly illegal but unfair) ---
  {
    id: 'in_suspicious_001',
    jurisdiction_id: 'IN',
    clause_type: 'suspicious_clause',
    description: 'Vague "material breach" definition at landlord\'s sole discretion',
    what_it_prohibits: 'Clauses where the landlord alone decides what constitutes a "material breach" or "violation" — with no objective standard — giving unchecked power to terminate the tenancy.',
    severity: 'moderate',
    legal_reference: 'Indian Contract Act, 1872, Section 10 (free consent & certainty); natural justice',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://indiankanoon.org/'
  },
  {
    id: 'in_suspicious_002',
    jurisdiction_id: 'IN',
    clause_type: 'suspicious_clause',
    description: 'Clause requires police verification / Aadhaar submission beyond legal requirement',
    what_it_prohibits: 'Clauses demanding copies of Aadhaar, PAN, or other identity documents beyond what local police verification rules require, or requiring the tenant to bear the cost of the landlord\'s legal compliance obligations.',
    severity: 'minor',
    legal_reference: 'Aadhaar (Targeted Delivery) Act, 2016, Section 7; Personal Data Protection considerations; Constitution of India, Article 21',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://uidai.gov.in/'
  },
  {
    id: 'in_suspicious_003',
    jurisdiction_id: 'IN',
    clause_type: 'suspicious_clause',
    description: 'Clause restricts tenant from displaying religious symbols or decor',
    what_it_prohibits: 'Restrictions on religious décor (idols, prayer items, rangoli) or symbols inside the rented unit that go beyond reasonable structural/damage concerns. May indicate discriminatory intent.',
    severity: 'moderate',
    legal_reference: 'Constitution of India, Articles 25 & 26 (freedom of religion); Article 21 (right to dignity)',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://indiankanoon.org/'
  },
  {
    id: 'in_suspicious_004',
    jurisdiction_id: 'IN',
    clause_type: 'suspicious_clause',
    description: 'Tenant must seek written permission for any visitor staying overnight',
    what_it_prohibits: 'Overly restrictive guest policies requiring written landlord approval for any overnight guest, including immediate family. While landlords can set reasonable guest policies, requiring approval for all overnight visitors infringes on privacy and personal liberty.',
    severity: 'minor',
    legal_reference: 'Constitution of India, Articles 19(1)(d) (freedom of movement) & 21 (personal liberty)',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://indiankanoon.org/'
  },
  {
    id: 'in_suspicious_005',
    jurisdiction_id: 'IN',
    clause_type: 'suspicious_clause',
    description: 'Clause imposes blanket liability for all damage regardless of tenant fault',
    what_it_prohibits: 'Catch-all damage clauses holding the tenant liable for all damage to the property including normal aging, structural deterioration, or pre-existing conditions — without a move-in inspection report.',
    severity: 'moderate',
    legal_reference: 'Indian Contract Act, 1872, Section 23; Model Tenancy Act, 2021, Section 11 (move-in/out reports)',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://mohua.gov.in/'
  },
  {
    id: 'in_suspicious_006',
    jurisdiction_id: 'IN',
    clause_type: 'suspicious_clause',
    description: 'Automatic lease renewal that converts to higher-rate tenancy',
    what_it_prohibits: 'Clauses where failure to give notice triggers automatic renewal at a significantly higher rent (e.g. 2x monthly rate) — a predatory "holdover penalty" trap not disclosed prominently.',
    severity: 'moderate',
    legal_reference: 'Indian Contract Act, 1872, Sections 10 & 14 (free consent, undue influence); Consumer Protection Act, 2019',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://indiankanoon.org/'
  },
  {
    id: 'in_suspicious_007',
    jurisdiction_id: 'IN',
    clause_type: 'suspicious_clause',
    description: 'Tenant bears all stamp duty / registration costs unilaterally',
    what_it_prohibits: 'Clauses requiring the tenant alone to bear all stamp duty and registration charges. Under most state laws, these costs are shared between landlord and tenant.',
    severity: 'minor',
    legal_reference: 'Indian Stamp Act, 1899; Registration Act, 1908; respective state stamp duty rules',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://indiankanoon.org/'
  },
  {
    id: 'in_suspicious_008',
    jurisdiction_id: 'IN',
    clause_type: 'suspicious_clause',
    description: 'No-claim clause — tenant agrees not to make any future claims against landlord',
    what_it_prohibits: 'Broad pre-emptive no-claim clauses that try to bar the tenant from ever filing any complaint or claim against the landlord — void as against public policy and Article 13 of the Constitution.',
    severity: 'critical',
    legal_reference: 'Indian Contract Act, 1872, Section 23; Constitution of India, Article 13',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://indiankanoon.org/'
  },
  {
    id: 'in_suspicious_009',
    jurisdiction_id: 'IN',
    clause_type: 'general',
    description: 'Entire agreement clause that nullifies pre-contract promises to fix defects',
    what_it_prohibits: 'Entire-agreement / merger clauses that override pre-signing verbal promises (e.g. "we will fix the AC before you move in"). These clauses are enforceable generally, but are suspicious when used to evade representations made during negotiation.',
    severity: 'minor',
    legal_reference: 'Indian Contract Act, 1872, Section 92; Indian Evidence Act, 1872, Section 91',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://indiankanoon.org/'
  },
  {
    id: 'in_suspicious_010',
    jurisdiction_id: 'IN',
    clause_type: 'general',
    description: 'Clause written in a language the tenant does not understand, without translation',
    what_it_prohibits: 'Lease agreements written entirely in English or a regional language the tenant does not comprehend, with a clause that the tenant "has understood" all terms — may vitiate free consent.',
    severity: 'moderate',
    legal_reference: 'Indian Contract Act, 1872, Section 14 (free consent); Section 18 (misrepresentation)',
    check_type: 'llm',
    check_config: null,
    last_verified: '2025-01-01',
    source_url: 'https://indiankanoon.org/'
  },
];

const insertJ = db.prepare('INSERT OR REPLACE INTO jurisdictions (id, name) VALUES (?, ?)');
for (const j of jurisdictions) insertJ.run(j.id, j.name);

const insertR = db.prepare(`INSERT OR REPLACE INTO rules
  (id, jurisdiction_id, clause_type, description, what_it_prohibits, severity, legal_reference, check_type, check_config, last_verified, source_url)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
for (const r of rules) {
  insertR.run(
    r.id, r.jurisdiction_id, r.clause_type, r.description, r.what_it_prohibits,
    r.severity, r.legal_reference, r.check_type, r.check_config, r.last_verified, r.source_url
  );
}

console.log(`Seeded ${jurisdictions.length} jurisdiction(s) and ${rules.length} rule(s).`);
