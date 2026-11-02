import { PresetCase } from '../types';
import { createSyntheticDemoWav } from '../utils/audioUtils';

export const PRESET_CASES: PresetCase[] = [
  {
    id: 'internship-training-fee',
    title: 'Pay-to-Train "Assured Stipend" Internship',
    category: 'Internship Offer',
    riskType: 'CRITICAL SCAM',
    description: 'HR asks for ₹4,999 registration kit deposit via UPI from a personal Gmail ID.',
    sourceType: 'Internship Offer Letter',
    inputText: `OFFER LETTER: APEX GLOBAL TECH SOLUTIONS
Date: October 2026
Candidate Name: Rohit Sharma
Position: Associate Full Stack Developer Intern (Remote)

Dear Rohit,
We are pleased to inform you that you have been selected for a 3-month stipend-backed internship at Apex Global Tech Solutions. Stipend will be INR 28,000 per month upon completion of orientation.

IMPORTANT NEXT STEP:
To confirm your seat in the batch, you are required to deposit a refundable "Security & Training Infrastructure Kit Fee" of INR 4,999/- within 24 hours. Failure to deposit within 24 hours will result in automatic cancellation of your internship offer.

Payment Instructions:
Pay via Google Pay / PhonePe to UPI ID: apex.hr.verify@oksbi
After payment, send the screenshot of your transaction receipt to our HR Coordinator at apextech.careers2026@gmail.com with subject "FEE CONFIRMATION - ROHIT".

Note: This fee will be 100% reimbursed in your 3rd month salary disbursement.
Warm Regards,
Pooja Malhotra | Talent Acquisition Team`
  },
  {
    id: 'employment-bond-degree-hostage',
    title: '2-Year Bond & Degree Certificate Confiscation',
    category: 'Job Contract',
    riskType: 'HIGH RISK TRAP',
    description: 'Contract requires surrendering original marksheets & ₹2.5 Lakh penalty for early exit.',
    sourceType: 'Job Contract Agreement',
    inputText: `CONFIDENTIAL EMPLOYMENT AGREEMENT & SERVICE BOND
Between: CloudMatrix Systems Pvt Ltd & Candidate

Clause 3.2 (Original Educational Credentials):
The Employee shall surrender all original educational documents, including 10th marksheet, 12th marksheet, and B.Tech / B.E. Degree Certificate and Consolidated Marksheets, to the Company HR at the time of joining. These original certificates shall remain in the sole physical custody of the Company for the entire duration of employment.

Clause 7.4 (Mandatory 24-Month Lock-in Period & Liquidated Damages):
The Employee agrees to a mandatory lock-in period of twenty-four (24) consecutive months starting from the date of joining. In the event the Employee resigns, discontinues, or terminates employment prior to completing 24 months, the Employee shall be liable to pay liquidated damages of INR 2,50,000 (Rupees Two Lakhs Fifty Thousand) plus 18% GST immediately. The Company reserves the unilateral right to withhold relieving letters, experience letters, and original educational certificates until full payment is received.

Clause 9.1 (Unilateral Termination):
The Company reserves the right to terminate the Employee's service at any given time without assigning any reason or notice period.`
  },
  {
    id: 'predatory-pg-lease',
    title: 'Hostel/PG Lease: 12-Hour Eviction & Forfeited Deposit',
    category: 'PG/Rental Agreement',
    riskType: 'HIGH RISK TRAP',
    description: 'Non-refundable deposit of ₹45,000 with arbitrary eviction and tenant liable for all structural repairs.',
    sourceType: 'PG/Rental Agreement',
    inputText: `STUDENT PG RESIDENCY RULES & TENANCY UNDERTAKING
Premises: Room 302, GreenView Luxury Student PG, Bengaluru

1. Security Deposit:
The Resident shall deposit a sum of INR 45,000/- as Security Deposit. This security deposit is strictly NON-REFUNDABLE under any circumstances, including early departure, semester completion, or mutual termination.

2. Access & Privacy:
The PG Management and Landlord reserve the unrestricted right to enter and inspect the resident's room at any time of day or night without prior notice or consent.

3. Eviction & Termination:
The Landlord reserves the absolute authority to terminate the residency with 12 hours verbal notice without assigning cause. In such case, the resident must vacate premises immediately and forfeits all pre-paid rent and deposits.

4. Maintenance & Structural Charges:
The resident agrees to bear full financial liability for all external painting, elevator maintenance, and building structural repairs incurred during the academic year.`
  },
  {
    id: 'campus-placement-phishing',
    title: 'Spoofed Placement Cell Circular Asking for UPI PIN',
    category: 'WhatsApp/Email Notice',
    riskType: 'CRITICAL SCAM',
    description: 'Urgent email notice asking for Aadhaar, Bank Details, and UPI PIN on an unverified domain.',
    sourceType: 'WhatsApp/Email Notice',
    inputText: `From: University Campus Placements Drive <placements-circular@univ-portal-exam2026.tk>
To: student-broadcast@univ.edu
Subject: URGENT: Mandatory Fast-Track Pool Placement Drive for Microsoft & Google (Batch 2026/2027)

ATTENTION ALL ENGINEERING & MCA STUDENTS:

The Training & Placement Cell has received an exclusive pool recruitment drive for Microsoft & Google with an annual package of 18 LPA - 42 LPA.

Deadline is TODAY at 23:59 IST. All eligible students who fail to register through the official portal will be permanently debarred from all upcoming campus recruitment drives for the current academic year.

Register immediately via the verified student verification portal:
http://univ-campus-auth.tk/placement-login/apply

Required Registration Verification:
1. College Roll No & Full Name
2. Aadhaar Card Photo (Front & Back)
3. Active Bank Account Number & IFSC
4. UPI ID and 4/6 digit UPI verification PIN for automatic stipend crediting test.

Do NOT reply to this email. Directly click the link above to secure your slot.`
  },
  {
    id: 'edtech-dark-pattern-subscription',
    title: 'EdTech "Free Scholarship" Hidden ₹12,999/mo Auto-Debit',
    category: 'Checkout/Subscription Page',
    riskType: 'CRITICAL SCAM',
    description: 'Fake countdown timer with hidden recurring credit card auto-debit and impossible cancellation terms.',
    sourceType: 'Checkout/Subscription Page',
    inputText: `SCREENSHOT TEXT: CodeMaster SuperScholarship Pro Checkout
[LIMITED SEAT OFFER - 00:02:47 MINUTES REMAINING]
"Congratulations! You won a 100% Free Merit Scholarship for Full-Stack AI Mastery Bootcamp (Worth ₹65,000)!"

[Button: CLAIM MY 100% FREE SCHOLARSHIP NOW]

Fine print below button (light grey text #E0E0E0 on white background):
*By clicking 'CLAIM MY 100% FREE SCHOLARSHIP NOW', you authorize an initial $1 verification hold and agree that upon expiration of the 48-hour promotional evaluation period, your payment card will be automatically charged a recurring subscription fee of INR 12,999 + GST every 30 days. No refunds will be provided under any circumstances. To cancel, subscriber must send a notarized physical letter via registered postal mail to our parent holding corporation in Delaware, USA at least 30 business days prior to renewal.

[X] Checkbox pre-selected: "I confirm I want to fast-track my career. If you uncheck this, you acknowledge that you are giving up on your professional future and will remain unemployable."`
  },
  {
    id: 'spoofed-internship-portal',
    title: 'Spoofed Placement Portal & Disposable Domain',
    category: 'Phishing Link / Portal',
    riskType: 'CRITICAL SCAM',
    description: 'Impersonates national hiring portal using .top TLD, asking for UPI payment on unencrypted gateway.',
    sourceType: 'Web Link / Portal Scan',
    inputText: `Target Link: https://internshala-verify-hiring.top/candidate-login
Domain: internshala-verify-hiring.top
Protocol: HTTPS (Let's Encrypt disposable SSL certificate)
Detected Webpage Text:
"OFFICIAL CAMPUS RECRUITMENT DRIVE 2026 - FINAL ROUND SELECTION
Congratulations! You have been shortlisted for direct placement at Tier-1 MNCs (Google, Microsoft, TCS).
To proceed to the online interview room, you must complete your Identity Card generation fee of ₹1,499.
Submit your Aadhaar number, College Roll Number, and scan the QR code below via PhonePe / GPay.
Timer: Only 08:42 minutes left before your candidate slot expires!"`
  },
  {
    id: 'recruiter-call-laptop-deposit',
    title: 'Recruiter Call: ₹3,500 Software & Kit Fee Trap',
    category: 'Recruiter Phone Call / Audio',
    riskType: 'CRITICAL SCAM',
    description: 'Audio phone call from an alleged HR demanding an immediate ₹3,500 UPI transfer for a remote software internship.',
    sourceType: 'Phone Call Audio Recording',
    sampleAudioName: 'telephonic_hr_3500fee_scam.wav',
    sampleAudioDuration: 38,
    sampleAudioBase64: createSyntheticDemoWav(3, 440),
    inputText: `[RECORDED PHONE CALL WITH ALLEGED RECRUITER - DURATION: 0:38]
[Caller/HR]: "Hello Rahul? This is Pooja from TechGlobal Careers Talent Acquisition. We reviewed your resume from the campus drive and you are shortlisted for our 3-month Python Full Stack Internship with ₹25,000 monthly stipend."
[Student]: "Hello ma'am! That is great, when does the orientation start?"
[Caller/HR]: "Orientation is this Monday. However, our IT policy mandates that you must activate your developer workbench license and remote asset security kit today. The registration fee is INR 3,500, fully refundable with your first stipend."
[Student]: "Can I deduct this from my first month stipend instead?"
[Caller/HR]: "No, candidate verification cannot proceed without this. You must transfer via PhonePe/GPay to our accounts coordinator at 9876543210@paytm right now while on this call. Only 2 slots are left in your college batch, so send the screenshot within 15 minutes or your seat will be cancelled."`
  },
  {
    id: 'whatsapp-voice-note-stipend-scam',
    title: 'WhatsApp Voice Note: Instant ₹30k Direct Selection',
    category: 'Recruiter Phone Call / Audio',
    riskType: 'CRITICAL SCAM',
    description: 'Voice note claiming direct selection with zero interview, pressuring candidate to pay ₹1,999 before 5 PM.',
    sourceType: 'WhatsApp Voice Note',
    sampleAudioName: 'whatsapp_voicenote_1999_internship.wav',
    sampleAudioDuration: 24,
    sampleAudioBase64: createSyntheticDemoWav(2, 520),
    inputText: `[WHATSAPP AUDIO VOICE NOTE - DURATION: 0:24]
[Caller/HR]: "Hi Sneha, this is Vikram from MNC Placement Cell. Congratulations, your profile was selected for our premium remote software development internship! You will be getting ₹30,000 fixed stipend every month. No technical rounds or coding test needed! You just need to pay ₹1,999 towards your student portal credentials and ID card generation. Scan the QR code sent below on this chat and pay before 5 PM today to lock in your offer letter."`
  },
  {
    id: 'legitimate-internship-offer',
    title: 'Legitimate Fair Internship Offer Letter',
    category: 'Internship Offer',
    riskType: 'SAFE',
    description: 'Corporate domain email, zero upfront fees, company equipment provided, fair 14-day notice.',
    sourceType: 'Internship Offer Letter',
    inputText: `OFFER LETTER: TechVanguard Solutions Pvt Ltd
Date: October 15, 2026
To: Priya Nair
Subject: Offer of Internship - Front-End Engineering Intern

Dear Priya,
Following your technical interview and code pairing session, we are pleased to offer you an internship as Front-End Engineering Intern with TechVanguard Solutions Pvt Ltd.

Key Terms:
1. Duration: 3 months (November 1, 2026 to January 31, 2027), full-time remote.
2. Stipend: INR 35,000 per month, disbursed on the last working day of each calendar month directly into your bank account.
3. Equipment: A company-managed MacBook Air will be dispatched to your address at no cost to you.
4. Fees & Charges: TechVanguard DOES NOT charge any training, orientation, or documentation fee at any stage.
5. Notice & Termination: Either party may terminate this internship agreement by providing fourteen (14) days written notice.
6. Intellectual Property: You retain full ownership of all personal side projects and open-source contributions created outside your assigned working hours.
7. Original Certificates: TechVanguard does not hold original educational certificates. Only self-attested digital copies are required for identity verification.

Please sign and return the duplicate copy of this letter to careers@techvanguard.io.
Sincerely,
Anand Verma | Head of Engineering`
  }
];

export const STUDENT_RIGHTS_GUIDE = [
  {
    title: 'Retention of Original Certificates is Illegal',
    authority: 'UGC & Ministry of Education Guidelines',
    summary: 'No university, college, employer, or recruitment agency has the legal authority to withhold or retain your original academic degrees, diplomas, or marksheets.',
    keyPoints: [
      'UGC Notification explicitly forbids institutions from retaining original certificates beyond physical verification.',
      'Employers holding original documents constitute unlawful coercion and restriction of personal liberty under Article 21 and Section 27 of the Indian Contract Act.',
      'Always offer self-attested copies or DigiLocker verified digital credentials.'
    ]
  },
  {
    title: 'Internship "Training / Registration Fees" are Predatory Scams',
    authority: 'Ministry of Labour & Consumer Protection Act 2019',
    summary: 'A legitimate employer pays you for your work. You NEVER have to pay money to get an internship, work on projects, or receive an offer letter.',
    keyPoints: [
      'Any company asking for "laptop security deposit", "training fee", "certificate registration fee", or "seat booking charge" is running a fee scam.',
      'Promises of "fee refund in the 3rd month salary" are classic bait-and-switch tactics—scammers routinely vanish after collecting the initial payment.',
      'Legitimate firms cover all internal onboarding and tooling costs.'
    ]
  },
  {
    title: 'Employment Bonds & Unreasonable Exit Penalties',
    authority: 'Section 27, Indian Contract Act 1872',
    summary: 'Agreements in restraint of trade, profession, or business are void. Massive punitive bonds designed to trap freshers are legally unenforceable.',
    keyPoints: [
      'Courts have repeatedly ruled that employers can only claim reasonable actual expenses incurred specifically on documented specialized training, not punitive damages.',
      'A bond demanding ₹1-3 Lakhs from a fresher making ₹20-30k/month is considered unconscionable and in terrorum.',
      'Companies cannot withhold experience letters or PF transfer as retaliation.'
    ]
  },
  {
    title: 'Tenant Rights in Student PGs & Hostels',
    authority: 'Model Tenancy Act & State Rent Control Acts',
    summary: 'Landlords cannot arbitrarily forfeit security deposits, impose 12-hour evictions, or trespass into rented premises without prior notice.',
    keyPoints: [
      'Security deposits must be refunded upon move-out after adjusting for legitimate, agreed-upon dues.',
      'Eviction requires proper written statutory notice (typically 30 days). Arbitrary immediate lockouts are illegal.',
      'Landlords cannot charge students for structural repairs or normal wear and tear.'
    ]
  },
  {
    title: 'Deceptive Dark Patterns & Confirmshaming',
    authority: 'Central Consumer Protection Authority (CCPA) Guidelines 2023',
    summary: 'E-commerce and EdTech platforms are prohibited by law from using manipulative UI tricks to trap consumers.',
    keyPoints: [
      'False Urgency (fake countdown timers indicating "Only 2 seats left")',
      'Basket Sneaking and Auto-Renewals without explicit upfront recurring payment consent',
      'Confirmshaming (manipulative options like "No, I don\'t want to succeed")',
      'Forced Bundling and Obstruction (making cancellation deliberately difficult or requiring physical postal letters).'
    ]
  }
];
