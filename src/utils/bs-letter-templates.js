/**
 * BS Letter Template Seed
 * 14 pre-built templates across 5 performance bands
 * All use {{placeholder}} syntax for variable substitution
 *
 * Available variables:
 * {{staffName}} {{firstName}} {{staffId}} {{branch}} {{region}} {{designation}}
 * {{reviewPeriod}} {{year}} {{periodLabel}} {{periodEnd}}
 * {{disbPct}} {{collPct}} {{disbVariance}} {{collVariance}}
 * {{verdictCode}} {{verdictLabel}} {{rmName}} {{rmTitle}} {{today}}
 */

const EP_TEMPLATES = [
  {
    band: 'E.P',
    letterType: 'APPRECIATION',
    title: 'Excellence Recognition & Appreciation Letter',
    subject: 'Branch Performance Excellence Recognition — {{reviewPeriod}} {{year}}',
    sortOrder: 1,
    openingParagraph: `We hope this letter finds you in excellent health and great spirit.\n\nIt is with great pleasure and institutional pride that we write to you today. This letter formally recognises and celebrates your branch's outstanding performance against the approved {{year}} Branch Budget for the period {{periodLabel}}.`,
    performanceInsights: `The performance figures above reflect an extraordinary level of output, discipline, and leadership at the {{branch}} Branch. Your branch has not only met but surpassed the allocated budget targets — a rare and commendable achievement within our network.`,
    mainBody: `This performance level is rated: **E.P — Exceptional Performance (Over 100%).**\n\nYour results demonstrate that exceptional leadership, combined with rigorous team accountability and relentless field execution, produces tangible and measurable impact. The {{branch}} Branch stands as a benchmark of excellence across the Inuka Africa network, and your personal contribution to this achievement is duly acknowledged at the highest level of the institution.\n\nOn behalf of Inuka Africa Leadership, Management, and the entire HR function, we extend our warmest congratulations and deepest appreciation for this sterling performance. You have made your branch, your region, and Inuka Africa proud.`,
    immediateActions: JSON.stringify([
      `Maintain the current disbursement velocity and ensure no pipeline stalls in the remaining period of {{year}}.`,
      `Drive collections efficiency with zero tolerance for avoidable arrears — protect the gains made.`,
      `Document the best practices and strategies that produced this exceptional performance for cross-branch sharing.`,
      `Continue mentoring your Loan Officers — your leadership is building the next generation of branch excellence at Inuka.`,
      `A copy of this recognition letter will be placed in your personal file and shared with the Regional Manager and COO as a formal institutional commendation.`,
    ]),
    closingParagraph: `This is a formal institutional recognition of your exceptional performance. A copy of this letter shall be filed in your personal HR file and transmitted to the COO's office. We look forward to continued excellence from you and your team.\n\nCongratulations once again, {{firstName}}. Keep leading from the front.`,
  },
  {
    band: 'E.P',
    letterType: 'COMMENDATION',
    title: 'Formal Commendation Letter',
    subject: 'Formal Commendation — Outstanding Branch Performance — {{reviewPeriod}} {{year}}',
    sortOrder: 2,
    openingParagraph: `We write to you with great satisfaction and institutional pride.\n\nThis letter serves as a formal commendation for your extraordinary performance at {{branch}} Branch for the period {{periodLabel}}. Your results reflect a standard of professional excellence that is both noteworthy and deserving of formal recognition.`,
    performanceInsights: `The above figures confirm that {{branch}} Branch has delivered performance that significantly exceeds the approved budget targets. A cumulative disbursement achievement of {{disbPct}} and collection achievement of {{collPct}} for the review period represent a level of output that places your branch among the best performing units in the Inuka Africa network.`,
    mainBody: `Performance Rating: **E.P — Exceptional Performance.**\n\nThis formal commendation is issued in recognition of your outstanding contribution to the {{region}}'s performance and to the broader institutional goals of Inuka Africa. Your ability to lead, motivate, and hold your team accountable while simultaneously delivering above-budget results speaks to the quality of leadership at your branch.\n\nThis letter is hereby entered into your permanent HR record as a formal commendation. It shall be considered in your next performance evaluation, career progression discussions, and any staff recognition processes undertaken by the institution.`,
    immediateActions: JSON.stringify([
      `Continue sustaining the exceptional performance standards that earned this commendation.`,
      `Share your team's performance culture and best practices with peer branches in the {{region}} during the next regional performance forum.`,
      `Set even more ambitious targets for the next review period and work with your RM to define stretch goals.`,
      `Ensure your Loan Officers also receive personal recognition for their contribution to this team outcome.`,
    ]),
    closingParagraph: `This commendation is duly authorised by the Regional Manager, reviewed by the COO, and approved by the HR Manager. It carries the full institutional weight of a formal recognition at Inuka Africa.\n\nWell done, {{firstName}}. This is the standard we aspire to across all branches.`,
  },
];

const GP_TEMPLATES = [
  {
    band: 'G.P',
    letterType: 'COMMENDATION',
    title: 'Performance Commendation Letter',
    subject: 'Branch Performance Commendation — {{reviewPeriod}} {{year}}',
    sortOrder: 1,
    openingParagraph: `We hope this letter finds you well.\n\nThis letter is issued to formally acknowledge your branch's solid performance against the approved {{year}} Branch Budget for the period {{periodLabel}}. Your results reflect a commendable level of professionalism, field management, and team accountability.`,
    performanceInsights: `The above performance reflects a good level of achievement against the {{year}} budget targets. A cumulative disbursement achievement of {{disbPct}} and collection achievement of {{collPct}} for the period indicates a branch that is functioning well and on a strong delivery trajectory.`,
    mainBody: `This performance level is rated: **G.P — Good Performance (80%–100%).**\n\nYou and your team have demonstrated consistent effort, strong planning, and disciplined execution during the review period. The {{branch}} Branch is performing within an acceptable range and your leadership contribution to these results is acknowledged.\n\nWhile this is a good result, we encourage you to push further. The gap between Good Performance and Exceptional Performance is bridgeable with deliberate, consistent effort. We are confident that with continued focus and tighter execution, you have the capacity to deliver Exceptional Performance in the next review period.`,
    immediateActions: JSON.stringify([
      `Accelerate disbursement conversion to push performance from {{disbPct}} into the Exceptional band (≥100%).`,
      `Enforce rigorous collections management with structured daily follow-ups and zero tolerance for avoidable arrears.`,
      `Conduct a pipeline review meeting with your team to identify all unconverted opportunities.`,
      `Set individual stretch targets for each Loan Officer and track progress daily.`,
      `Submit your {{reviewPeriod}} closure plan to the Regional Manager within 5 working days.`,
    ]),
    closingParagraph: `We commend your effort and the results delivered during this period. This letter shall be placed on your personal HR file. We look forward to your progression to Exceptional Performance in the next review cycle.\n\nKeep up the good work, {{firstName}}.`,
  },
  {
    band: 'G.P',
    letterType: 'NORMAL_FEEDBACK',
    title: 'Normal Performance Feedback Letter',
    subject: 'Branch Performance Review Feedback — {{reviewPeriod}} {{year}}',
    sortOrder: 2,
    openingParagraph: `We hope this letter finds you in good health and high spirit.\n\nThis letter presents a review of your branch's performance against the approved {{year}} Branch Budget, specifically on loan disbursements and collections, for the period {{periodLabel}}, and also sets out the expectations and required actions going forward.`,
    performanceInsights: `The above performance reflects your branch's current position relative to the {{year}} approved targets. As at {{periodEnd}}, the branch has achieved a cumulative disbursement rate of {{disbPct}} and a collection rate of {{collPct}} against the allocated budget.`,
    mainBody: `This performance level is rated: **G.P — Good Performance (80%–100%).**\n\nYour branch is performing well and largely on track with the expected delivery trajectory. Meaningful progress has been made, and the results reflect a functioning team with clear direction. However, there remain identifiable gaps between your current achievement and the full budget target that must be closed to ensure end-of-period success.\n\nWith deliberate effort, tighter pipeline management, and unrelenting follow-through on collections, the branch is well-positioned to fully deliver on its targets.`,
    immediateActions: JSON.stringify([
      `Accelerate disbursement momentum — ensure every viable pipeline case is converted without delay.`,
      `Enforce structured daily collections follow-up with clear individual accountability per Loan Officer.`,
      `Conduct a daily performance stand-up with your team to track progress against daily mini-targets.`,
      `Identify and address any specific bottlenecks preventing conversion of qualified applicants.`,
      `Provide the Regional Manager with a weekly progress update until end of period.`,
    ]),
    closingParagraph: `The expectation is that all remaining budget gaps will be fully recovered before the close of the review period, with no shortfalls carried into the next quarter.\n\nYours Faithfully,`,
  },
];

const AP_TEMPLATES = [
  {
    band: 'A.P',
    letterType: 'NORMAL_FEEDBACK',
    title: 'Normal Performance Feedback Letter',
    subject: 'Branch Performance Review Feedback — {{reviewPeriod}} {{year}}',
    sortOrder: 1,
    openingParagraph: `We hope this letter finds you in good health and high spirit.\n\nThis letter presents a review of your branch's performance against the approved {{year}} Branch Budget, specifically on loan disbursements and collections, for the period {{periodLabel}}, and also sets out the expectations and required actions going forward.`,
    performanceInsights: `The above performance reflects your branch's current position relative to the {{year}} approved targets, indicating that as at {{periodEnd}}, the branch is behind on disbursements by Kshs. {{disbVariance}} and behind on collections by Kshs. {{collVariance}} relative to the {{year}} budget.`,
    mainBody: `This performance level is rated: **A.P — Average Performance (60%–80%).**\n\nYour performance is largely on track with the expected Half-Year delivery trajectory. While meaningful progress has been made, there are still identifiable gaps that must be closed to achieve full budget alignment. The current achievement of {{disbPct}} on disbursements and {{collPct}} on collections represents effort, but is insufficient to fully deliver on the allocated budget.\n\nWith deliberate effort and tighter follow-through, the branch is well-positioned to improve its standing. We expect a measurable improvement in the next reporting period.`,
    immediateActions: JSON.stringify([
      `Accelerate disbursement momentum by unlocking all viable pipeline opportunities and ensuring high conversion rates.`,
      `Enforce rigorous collections management with structured daily follow-ups, strict accountability, and zero tolerance for avoidable arrears.`,
      `Drive individual accountability across all Loan Officers — each staff member must deliver on assigned targets without exception.`,
      `Strengthen on-ground supervision, maintaining visibility, discipline, and productivity within the branch.`,
      `Implement a time-bound recovery plan and share it with the Regional Manager within 5 working days.`,
    ]),
    closingParagraph: `It is expected that all Q2 performance deficits will be fully recovered by the end of the review period, with no shortfalls carried into the next quarter. The remaining period demands focused execution, urgency, and well-ordered leadership.\n\nYours Faithfully,`,
  },
  {
    band: 'A.P',
    letterType: 'IMPROVEMENT_GUIDANCE',
    title: 'Performance Improvement Guidance Letter',
    subject: 'Performance Improvement Guidance — {{branch}} Branch — {{reviewPeriod}} {{year}}',
    sortOrder: 2,
    openingParagraph: `We hope this letter finds you well.\n\nThis letter is issued following a detailed review of the {{branch}} Branch's performance for the period {{periodLabel}}. While we acknowledge the efforts made, the current performance position requires structured guidance and a deliberate improvement plan to ensure delivery of the full {{year}} budget.`,
    performanceInsights: `As shown in the tables above, the branch currently stands at {{disbPct}} on disbursements and {{collPct}} on collections — an Average Performance rating. The disbursement deficit stands at Kshs. {{disbVariance}} and the collection deficit at Kshs. {{collVariance}}.`,
    mainBody: `Performance Rating: **A.P — Average Performance.**\n\nAverage performance, while not a crisis, represents a significant opportunity that must not be wasted. Inuka Africa's growth targets require every branch to operate at or above budget, and sustained average performance poses a risk to the institution's overall portfolio growth.\n\nTo move from Average to Good or Exceptional Performance, we are issuing this structured guidance letter with specific, measurable targets and a defined improvement timeline. You are required to develop and implement a personal branch recovery plan that addresses the identified gaps in both disbursement and collections.`,
    immediateActions: JSON.stringify([
      `Develop a written 14-day branch recovery plan addressing both disbursement and collections gaps, and submit to the Regional Manager within 48 hours.`,
      `Conduct a full pipeline audit — identify every qualified client not yet served and develop a conversion schedule.`,
      `Implement a structured daily collections call log with documented follow-up actions for every delinquent account.`,
      `Hold individual performance accountability meetings with each Loan Officer and set daily targets.`,
      `Provide the Regional Manager with a written weekly performance update every Monday until performance improves to G.P or above.`,
      `Attend the next regional performance forum prepared to present your recovery strategy.`,
    ]),
    closingParagraph: `This letter is issued in good faith as a performance support measure. We are confident in your ability to deliver improved results when the right effort and focus is applied. Failure to demonstrate measurable improvement in the next review period may necessitate a formal caution letter.\n\nYours Faithfully,`,
  },
];

const WP_TEMPLATES = [
  {
    band: 'W.P',
    letterType: 'NORMAL_FEEDBACK',
    title: 'Normal Performance Feedback Letter',
    subject: 'Branch Performance Review Feedback — {{reviewPeriod}} {{year}}',
    sortOrder: 1,
    openingParagraph: `We hope this letter finds you in good health and high spirit.\n\nThis letter presents a review of your branch's performance against the approved {{year}} Branch Budget, specifically on loan disbursements and collections, for the period {{periodLabel}}.`,
    performanceInsights: `The above performance reflects your branch's current position indicating that as at {{periodEnd}}, the branch is behind on disbursements by Kshs. {{disbVariance}} and behind on collections by Kshs. {{collVariance}} against the {{year}} budget.`,
    mainBody: `This performance level is rated: **W.P — Weak Performance (40%–60%).**\n\nYour performance is significantly below expectations and indicates clear breakdowns in execution, follow-through, and performance management at branch level. A disbursement achievement of {{disbPct}} and collection achievement of {{collPct}} represents an unacceptable trajectory against the approved budget. The current position exposes the branch to a substantial deficit that threatens both the branch's and the region's overall performance standing.\n\nWithout immediate and intensified intervention, the likelihood of closing this gap within the remaining period is low. Urgent corrective action, stricter supervision, and full accountability across the team are non-negotiable requirements at this stage.`,
    immediateActions: JSON.stringify([
      `Implement an IMMEDIATE disbursement recovery plan — identify every viable client in the pipeline and disburse without delay.`,
      `Conduct an emergency team briefing, communicate the performance gap clearly, and set non-negotiable individual daily targets.`,
      `Enforce zero-tolerance collections protocol with daily reconciliation and immediate escalation of delinquent accounts.`,
      `Engage the Regional Manager for daily performance check-in calls until performance stabilises above 60%.`,
      `Submit a written 7-day recovery plan to the Regional Manager within 48 hours of receipt of this letter.`,
    ]),
    closingParagraph: `The expectations are clear: DELIVER the allocated budget, RECOVER all deficits, and CLOSE the period on a strong footing. Continued weak performance will necessitate formal disciplinary measures.\n\nYours Faithfully,`,
  },
  {
    band: 'W.P',
    letterType: 'CAUTION',
    title: 'Verbal Caution Letter',
    subject: 'CONFIDENTIAL: Formal Verbal Caution — Weak Branch Performance — {{reviewPeriod}} {{year}}',
    sortOrder: 2,
    openingParagraph: `We write to you on a matter of serious institutional concern.\n\nFollowing a detailed review of the {{branch}} Branch's performance for the period {{periodLabel}}, Management has concluded that the level of underperformance requires a formal verbal caution to be issued and placed on record. This letter constitutes that caution.`,
    performanceInsights: `As the performance tables above clearly demonstrate, the branch has achieved only {{disbPct}} of its disbursement target and {{collPct}} of its collection target for the review period. The cumulative disbursement deficit stands at Kshs. {{disbVariance}} and the collection deficit at Kshs. {{collVariance}}.`,
    mainBody: `Performance Rating: **W.P — Weak Performance (40%–60%).**\n\nThis level of performance is unacceptable for the {{branch}} Branch and represents a serious deviation from the standards expected of a Branch Supervisor at Inuka Africa. The patterns of underperformance identified during this review period — including failure to meet disbursement targets, inadequate collections management, and insufficient team supervision — constitute grounds for this formal caution.\n\nYou are hereby formally cautioned regarding your branch's performance. This caution is being placed on your permanent HR record. Should performance not improve to a minimum of A.P (60%) in the next review period, further disciplinary action, including a formal written warning, will be initiated without further notice.`,
    immediateActions: JSON.stringify([
      `Submit a detailed, written Performance Recovery Plan to the Regional Manager within 24 hours of receiving this letter.`,
      `Implement daily disbursement and collections reporting directly to the Regional Manager, effective immediately.`,
      `Conduct individual performance accountability meetings with every Loan Officer — document agreed targets and timelines.`,
      `All Loan Officers are to submit daily production reports to you, which you will consolidate and forward to the RM.`,
      `A formal progress review will be conducted in 30 days. At that point, performance must be at a minimum A.P level. Failure to achieve this will trigger a formal written warning.`,
    ]),
    closingParagraph: `This caution is issued in good faith but carries full institutional authority. We urge you to treat this matter with the urgency and seriousness it deserves. The institution is committed to supporting your improvement, but performance accountability is non-negotiable.\n\nYours Faithfully,`,
  },
  {
    band: 'W.P',
    letterType: 'FIRST_WARNING',
    title: '1st Written Warning Letter',
    subject: 'CONFIDENTIAL: 1st Written Warning — Unsatisfactory Branch Performance — {{reviewPeriod}} {{year}}',
    sortOrder: 3,
    openingParagraph: `We write to you on a matter of serious concern and formal disciplinary significance.\n\nThis letter constitutes a formal 1st Written Warning issued to you, {{staffName}} (IA/{{staffId}}), {{designation}} — {{branch}} Branch, following a review of your branch's performance for the period {{periodLabel}}. This warning is issued in accordance with Inuka Africa's Performance Management Policy and HR regulations.`,
    performanceInsights: `As the performance data above demonstrates, {{branch}} Branch has achieved only {{disbPct}} of its disbursement budget and {{collPct}} of its collection budget for the review period. The disbursement shortfall stands at Kshs. {{disbVariance}} and the collection shortfall at Kshs. {{collVariance}}. These figures represent a serious and sustained failure to deliver on allocated targets.`,
    mainBody: `Performance Rating: **W.P — Weak Performance.**\n\nDespite prior performance feedback and institutional support, the {{branch}} Branch's performance has remained at an unacceptable level. This constitutes a formal breach of the performance standards required of a Branch Supervisor at Inuka Africa.\n\nYou are hereby issued with a formal **1st Written Warning** for unsatisfactory performance. This warning will remain on your permanent HR record for a period of twelve (12) months from the date of this letter. Should your performance not improve to a minimum rating of A.P (60%) within the next review period, a Final Written Warning will be issued — which may ultimately lead to demotion, redeployment, or termination of employment in accordance with the Employment Act, 2007.`,
    immediateActions: JSON.stringify([
      `A formal Performance Improvement Plan (PIP) has been initiated for you, effective from the date of this letter. The PIP document will be shared with you separately within 3 working days.`,
      `You are required to sign and return a copy of this letter within 24 hours as an acknowledgment of receipt.`,
      `Weekly performance reviews will be conducted by the Regional Manager, with written progress reports submitted every Friday.`,
      `You are prohibited from taking annual leave until performance improves to a minimum A.P rating.`,
      `A formal review meeting will be held in 45 days. At that meeting, performance must demonstrate material improvement. Failure to meet the minimum A.P threshold will trigger a Final Written Warning.`,
    ]),
    closingParagraph: `You have the right to respond to this warning in writing within 5 working days of receipt, which response shall be attached to this letter on your HR file. You may also request a meeting with the HR Manager to discuss this matter.\n\nWe sincerely hope you take the necessary steps to address these performance issues and restore your branch to an acceptable standing within Inuka Africa.\n\nYours Faithfully,`,
  },
];

const UP_TEMPLATES = [
  {
    band: 'U.P',
    letterType: 'NORMAL_FEEDBACK',
    title: 'Normal Performance Feedback Letter',
    subject: 'Branch Performance Review Feedback — {{reviewPeriod}} {{year}}',
    sortOrder: 1,
    openingParagraph: `We hope this letter finds you in good health and high spirit.\n\nThis letter presents a review of your branch's performance against the approved {{year}} Branch Budget for the period {{periodLabel}}, and sets out the expectations and required corrective actions.`,
    performanceInsights: `The above performance reflects your branch's current position relative to the {{year}} approved targets, indicating that as at {{periodEnd}}, the branch is behind on disbursements by Kshs. {{disbVariance}} and behind on collections by Kshs. {{collVariance}} relative to the {{year}} budget.`,
    mainBody: `This performance level is rated: **U.P — Unacceptable Performance (Below 40%).**\n\nYour performance is critically below the required standard and represents a serious deviation from the expected delivery trajectory. A disbursement achievement of {{disbPct}} and collection achievement of {{collPct}} indicates fundamental failures in planning, execution, and oversight at branch level. The current deficit is not sustainable and places the branch in a high-risk position against the {{year}} budget. Immediate, decisive intervention is required.`,
    immediateActions: JSON.stringify([
      `Convene an immediate branch crisis meeting and communicate the severity of the performance gap to every staff member.`,
      `Submit a comprehensive written Performance Improvement Plan to the Regional Manager within 24 hours.`,
      `Implement a daily disbursement and collections reporting regime directly to the Regional Manager, effective immediately.`,
      `Each Loan Officer must produce a personal daily target tracker — no exceptions.`,
      `HR will schedule a formal review within 14 days to assess progress. Non-compliance will trigger formal disciplinary proceedings.`,
    ]),
    closingParagraph: `It is expected that all performance deficits will be fully recovered by the end of the review period, with no shortfalls carried into the next quarter. The remaining period demands focused execution, urgency, and accountable leadership.\n\nYours Faithfully,`,
  },
  {
    band: 'U.P',
    letterType: 'CAUTION',
    title: 'Written Caution Letter',
    subject: 'CONFIDENTIAL: Formal Written Caution — Unacceptable Branch Performance — {{reviewPeriod}} {{year}}',
    sortOrder: 2,
    openingParagraph: `We write to you on a matter of critical institutional concern.\n\nFollowing a thorough review of the {{branch}} Branch performance for the period {{periodLabel}}, Management has concluded that the level of underperformance is of such severity that a formal written caution must be issued. This letter constitutes that caution and shall be placed on your permanent HR record.`,
    performanceInsights: `The performance tables above reveal a critical shortfall: the branch has achieved only {{disbPct}} of its disbursement target and {{collPct}} of its collection target. The cumulative shortfalls — Kshs. {{disbVariance}} on disbursements and Kshs. {{collVariance}} on collections — represent a fundamental failure to deliver on your institutional mandate.`,
    mainBody: `Performance Rating: **U.P — Unacceptable Performance.**\n\nThis is a formal written caution issued to you, {{staffName}} (IA/{{staffId}}), in respect of the unacceptable performance level recorded at {{branch}} Branch for the period {{periodLabel}}.\n\nThe patterns of failure identified include: failure to meet disbursement targets across multiple consecutive months, inadequate collections management, failure to drive adequate team accountability, and an inability to convert the available portfolio opportunity within the branch.\n\nThis caution is issued in accordance with Inuka Africa's Performance Management Policy. Should performance not improve to a minimum of A.P (60%) within the next review cycle, a formal 1st Written Warning will be issued without further notice — which may escalate to disciplinary proceedings under the Employment Act, 2007.`,
    immediateActions: JSON.stringify([
      `A formal caution meeting will be convened within 3 working days, attended by the Regional Manager, HR Representative, and yourself. You may bring a co-worker of your choice as a witness.`,
      `Submit a written response to this caution within 5 working days, which shall be attached to your HR file.`,
      `A structured Performance Improvement Plan (PIP) will be presented to you at the caution meeting.`,
      `Daily disbursement and collections reporting to the Regional Manager commences immediately.`,
      `A formal progress review will be conducted in 30 days. At that point, performance must show material improvement to A.P or above.`,
    ]),
    closingParagraph: `You are required to sign and return the attached acknowledgment slip within 24 hours. We urge you in the strongest terms to treat this caution with the urgency and seriousness it demands. The institution remains available to support your improvement, but cannot absorb continued underperformance at this level.\n\nYours Faithfully,`,
  },
  {
    band: 'U.P',
    letterType: 'FIRST_WARNING',
    title: '1st Written Warning Letter',
    subject: 'CONFIDENTIAL: 1st Written Warning — Unacceptable Branch Performance — {{reviewPeriod}} {{year}}',
    sortOrder: 3,
    openingParagraph: `This letter is addressed to you, {{staffName}} (IA/{{staffId}}), {{designation}} — {{branch}} Branch, and constitutes a formal 1st Written Warning issued in accordance with Inuka Africa's Performance Management Policy and the Employment Act, 2007.\n\nThis action follows a detailed review of branch performance for the period {{periodLabel}} and the failure to demonstrate adequate improvement following prior performance feedback.`,
    performanceInsights: `As evidenced by the performance data above, {{branch}} Branch achieved only {{disbPct}} on disbursements and {{collPct}} on collections for the review period. The disbursement shortfall stands at Kshs. {{disbVariance}} and the collection shortfall at Kshs. {{collVariance}} — representing a critical and unacceptable performance failure.`,
    mainBody: `Performance Rating: **U.P — Unacceptable Performance.**\n\nYou are hereby issued a formal **1st Written Warning** for gross underperformance in your role as {{designation}} at {{branch}} Branch. This warning is effective from the date of this letter and will remain on your permanent HR record for twelve (12) months.\n\nThe grounds for this warning are as follows:\n1. Persistent failure to meet disbursement and collection targets across the review period.\n2. Failure to effectively manage and supervise your team of Loan Officers.\n3. Inability to implement or sustain any effective corrective action despite prior institutional feedback.\n4. Critical deficit exposure that threatens the branch and region's standing against the {{year}} budget.\n\nShould your performance fail to improve to a minimum rating of A.P (60%) within the next review period, a Final Written Warning will be issued — which may lead to demotion, redeployment, or termination of employment.`,
    immediateActions: JSON.stringify([
      `Sign and return the acknowledgment attached to this letter within 24 hours. Failure to do so within this period will be treated as a refusal to cooperate and will constitute a separate disciplinary matter.`,
      `A formal PIP meeting will be held within 3 working days, attended by the RM, HR, and yourself. You have the right to bring a co-worker witness.`,
      `You are placed on a 45-day Performance Improvement Plan (PIP), details of which will be issued separately. Compliance with all PIP requirements is mandatory.`,
      `Bi-weekly performance reviews with HR and the RM will be conducted throughout the PIP period.`,
      `Any leave requests during the PIP period require express approval from both the RM and HR.`,
      `At the conclusion of the PIP period, performance will be formally assessed. Failure to achieve the minimum A.P threshold will trigger a Final Written Warning and possible further action.`,
    ]),
    closingParagraph: `You have the right to respond to this warning in writing within 5 working days. Your response will be attached to this letter on your HR record. You may also request a formal hearing before the HR Manager.\n\nWe strongly urge you to take this warning with the utmost seriousness. The institution is bound by its duty to manage performance rigorously and will do so in strict compliance with applicable law and institutional policy.\n\nYours Faithfully,`,
  },
  {
    band: 'U.P',
    letterType: 'FINAL_WARNING',
    title: 'Final Written Warning Letter',
    subject: 'CONFIDENTIAL: Final Written Warning — Sustained Unacceptable Performance — {{reviewPeriod}} {{year}}',
    sortOrder: 4,
    openingParagraph: `This letter is addressed to you, {{staffName}} (IA/{{staffId}}), {{designation}} — {{branch}} Branch.\n\nThis constitutes a formal **FINAL WRITTEN WARNING**, issued in accordance with Inuka Africa's Performance Management Policy, the Inuka Africa Code of Conduct, and the Employment Act, 2007 (Cap. 226). This is the last formal warning before further disciplinary action — which may include demotion, redeployment, or termination of your employment — is initiated.`,
    performanceInsights: `The performance tables above confirm that despite prior institutional interventions — including performance feedback letters, a formal caution, and a 1st Written Warning — {{branch}} Branch has achieved only {{disbPct}} on disbursements and {{collPct}} on collections for the review period. The disbursement shortfall stands at Kshs. {{disbVariance}} and the collection shortfall at Kshs. {{collVariance}}.`,
    mainBody: `Performance Rating: **U.P — Unacceptable Performance.**\n\nYou are hereby issued a formal **FINAL WRITTEN WARNING** for sustained, unacceptable underperformance in your role as {{designation}} at the {{branch}} Branch of Inuka Africa Limited.\n\nThis Final Warning is issued on the following grounds:\n1. Persistent and sustained failure to meet disbursement and collection budget targets.\n2. Failure to achieve the minimum performance improvement threshold set out in your Performance Improvement Plan.\n3. Critical, ongoing deficit exposure that continues to undermine the region's portfolio performance.\n4. Demonstrated inability to effectively lead, supervise, and drive accountability within your branch team.\n\nThis Final Written Warning shall remain on your permanent HR record. **Should performance not improve to a minimum of A.P (60%) by the next formal review date, the matter will be referred to a formal disciplinary hearing — which may result in your demotion, redeployment to a lower-graded role, or termination of your contract of employment** in accordance with the Employment Act, 2007 and applicable Inuka Africa HR policies.`,
    immediateActions: JSON.stringify([
      `Sign and return the acknowledgment attached to this letter WITHIN 24 HOURS. Failure to sign will be treated as misconduct and will be so noted on your HR record.',`,
      `You are placed on an ENHANCED 30-day Final Performance Improvement Plan, the details of which are attached to this letter and form part of this warning.`,
      `Daily performance reporting to the Regional Manager and HR is MANDATORY from the date of this letter.`,
      `A formal disciplinary hearing date has been tentatively set. You will be notified in writing of the exact date and time. You have the right to be represented at this hearing.`,
      `Any leave request (other than sick leave supported by a medical certificate) will not be considered during this period.`,
      `At the conclusion of the 30-day PIP, if performance remains below A.P, the matter shall proceed to a formal disciplinary hearing without further warning.`,
    ]),
    closingParagraph: `You have the right to respond to this warning in writing within 5 working days and to request a hearing before the HR Manager and a representative of management. We urge you to exercise this right if you wish to present your case.\n\nInuka Africa takes performance management seriously and has followed due process throughout this matter. This Final Warning represents the institution's last formal intervention before disciplinary proceedings.\n\nYours Faithfully,`,
  },
  {
    band: 'U.P',
    letterType: 'PIP_PLACEMENT',
    title: 'Performance Improvement Plan (PIP) Placement Letter',
    subject: 'CONFIDENTIAL: Performance Improvement Plan — {{branch}} Branch — {{reviewPeriod}} {{year}}',
    sortOrder: 5,
    openingParagraph: `This letter is addressed to you, {{staffName}} (IA/{{staffId}}), {{designation}} — {{branch}} Branch.\n\nFollowing a formal review of your branch's performance for the period {{periodLabel}}, and pursuant to Inuka Africa's Performance Management Policy, you are hereby formally placed on a **Performance Improvement Plan (PIP)**, effective from the date of this letter. This letter serves both as formal notification of the PIP and as the PIP document itself.`,
    performanceInsights: `As the performance data above clearly indicates, {{branch}} Branch has achieved {{disbPct}} on disbursements and {{collPct}} on collections for the review period. The disbursement shortfall is Kshs. {{disbVariance}} and the collection shortfall is Kshs. {{collVariance}}. These figures indicate a performance level that is below the institutional minimum standard for continued operation in your current role without formal intervention.`,
    mainBody: `Performance Rating: **U.P — Unacceptable Performance.**\n\n**PURPOSE OF THIS PIP:**\nThe purpose of this Performance Improvement Plan is to provide you with a structured, time-bound framework to improve your branch's performance to an acceptable level. It is not a disciplinary action in itself, but failure to comply with or achieve the targets set in this PIP will constitute grounds for escalated disciplinary proceedings.\n\n**PIP DURATION:**\nThis PIP shall run for a period of **sixty (60) calendar days** from the date of this letter.\n\n**PIP TARGETS:**\nBy the end of the PIP period, {{branch}} Branch must achieve:\n- Disbursement achievement of no less than **60%** of monthly allocated budget in each remaining month.\n- Collection achievement of no less than **60%** of monthly allocated budget in each remaining month.\n- Zero unresolved delinquent accounts older than 60 days.\n\n**SUPPORT AVAILABLE:**\nThe following institutional support will be provided during the PIP period:\n- Weekly coaching sessions with the Regional Manager.\n- Access to the Inuka Africa Credit and Sales Support team for technical guidance.\n- A formal mid-point review at Day 30 to assess progress and adjust the plan if necessary.\n- HR check-in sessions bi-weekly.`,
    immediateActions: JSON.stringify([
      `Sign and return the PIP acknowledgment section of this letter within 24 hours. Your signature confirms receipt and your commitment to the PIP — it does not constitute an admission of any wrongdoing.`,
      `Submit your personal branch action plan (detailing specific steps you will take to achieve the PIP targets) to the Regional Manager within 3 working days.`,
      `Commence daily disbursement and collections reporting to the Regional Manager from Day 1 of the PIP.`,
      `Conduct individual target-setting meetings with each Loan Officer within 5 working days, with signed personal commitment forms submitted to HR.`,
      `A formal Day 30 mid-point review meeting will be held with HR and the Regional Manager. You are required to attend and present your progress.`,
      `A formal Day 60 final review will determine whether the PIP has been successfully completed. Successful completion closes this PIP. Failure will trigger further disciplinary action, which may include a 1st or Final Written Warning.`,
    ]),
    closingParagraph: `This PIP is issued in good faith as a genuine effort to support your professional recovery and to protect your continued employment at Inuka Africa. We remain committed to working with you constructively during this period.\n\nHowever, we must be transparent: failure to comply with this PIP, or failure to achieve the minimum targets by Day 60, will leave the institution with no option but to escalate to formal disciplinary proceedings in accordance with the Employment Act, 2007.\n\nWe sincerely hope this PIP produces the improvement we know you are capable of delivering.\n\nYours Faithfully,`,
  },
];

module.exports = [...EP_TEMPLATES, ...GP_TEMPLATES, ...AP_TEMPLATES, ...WP_TEMPLATES, ...UP_TEMPLATES];
