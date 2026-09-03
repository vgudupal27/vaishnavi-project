/**
 * Single source of truth for the worksheet schema.
 *
 * Checkbox options are rendered from here at boot, so adding a new option is a
 * one-line change and the dashboard picks it up automatically.
 */

/** Storage keys. Bump SCHEMA_VERSION when the saved shape changes. */
export const STORAGE_KEYS = {
  events: 'asaEvents',
  outcomes: 'asaOutcomes',
  draft: 'asaDraft',
  schemaVersion: 'asaSchemaVersion',
};

export const SCHEMA_VERSION = 1;

/** Autosave interval for the in-progress worksheet, in milliseconds. */
export const AUTOSAVE_MS = 30000;

/**
 * Checkbox groups. Key = the `data-options` attribute in index.html and the
 * checkbox `name`; value = the option labels.
 */
export const CHECKBOX_OPTIONS = {
  feelings: [
    'Angry', 'Anxious', 'Scared', 'Homesick', 'Embarrassed', 'Ashamed',
    'Restless', 'Lonely', 'Overwhelmed', 'Irritated', 'Sad', 'Numb',
    'Confused', 'Hopeless',
  ],
  why: [
    { value: 'Family', label: 'My family' },
    { value: 'Children', label: 'My children' },
    { value: 'Health', label: 'My health' },
    { value: 'Mental health', label: 'My mental health' },
    'Legal issues',
    'Probation/parole',
    'Fear of overdose',
    'Tired of suffering',
    'Housing instability',
    'Relationships',
    'Employment',
    'I want peace',
    'I want my life back',
    'I want to heal',
  ],
  problem: [
    'Withdrawal symptoms', 'Anxiety/panic', 'Phone/home concerns',
    'Conflict with another client', 'Sleep issues', 'Cravings',
    'Missing family', 'Wanting nicotine/smoke break', 'Feeling trapped',
    'Transportation concerns', 'Legal concerns',
  ],
  goal: [
    'Clear mind', 'Sobriety', 'Better coping skills', 'Emotional stability',
    'Support system', 'Housing plan', 'Employment plan', 'Family repair',
    'Relapse prevention skills', 'Medication stability', 'Hope',
    'Self-respect', 'Spiritual growth', 'Better physical health',
  ],
  support: [
    'BHA Staff', 'Counselor', 'Nurse', 'Peer Recovery Specialist',
    'Family Member', 'Sponsor', 'Therapist', 'Spiritual Support',
  ],
};

/**
 * Free-text / select fields.
 * `el` is the DOM id, `key` is the property name on a saved event.
 */
export const TEXT_FIELDS = [
  { el: 'clientId', key: 'clientId' },
  { el: 'eventDate', key: 'date' },
  { el: 'staffName', key: 'staff' },
  { el: 'feelingOther', key: 'feelingOther' },
  { el: 'whatHappened', key: 'whatHappened' },
  { el: 'pastExperience', key: 'pastExperience' },
  { el: 'pastOutcome', key: 'pastOutcome' },
  { el: 'whyOther', key: 'whyOther' },
  { el: 'affectedPeople', key: 'affectedPeople' },
  { el: 'futureGoal', key: 'futureGoal' },
  { el: 'stayOneDay', key: 'stayOneDay' },
  { el: 'leaveToday', key: 'leaveToday' },
  { el: 'problemOther', key: 'problemOther' },
  { el: 'goalOther', key: 'goalOther' },
  { el: 'todayGoal', key: 'todayGoal' },
  { el: 'reason24', key: 'reason24' },
  { el: 'supportOther', key: 'supportOther' },
  { el: 'finalReflection', key: 'finalReflection' },
  { el: 'currentFeeling', key: 'currentFeeling' },
  { el: 'decision', key: 'decision' },
  { el: 'interventionResult', key: 'interventionResult' },
  { el: 'finalDisposition', key: 'finalDisposition' },
  { el: 'clientSignature', key: 'clientSignature' },
  { el: 'staffSignature', key: 'staffSignature' },
  { el: 'timeCompleted', key: 'timeCompleted' },
];

/** Checkbox group name -> saved property name. */
export const CHECKBOX_FIELDS = [
  { name: 'feelings', key: 'feelings' },
  { name: 'why', key: 'why' },
  { name: 'problem', key: 'problems' },
  { name: 'goal', key: 'goals' },
  { name: 'support', key: 'support' },
];

/** Fields cleared on "Save ASA Event" — the client stays for back-to-back entry. */
export const KEEP_AFTER_SAVE = new Set(['eventDate', 'staffName']);

/** Decisions counted as "initial retention" on the dashboard. */
export const RETENTION_DECISIONS = [
  'Stay for today and revisit tomorrow',
  'Continue treatment',
];

/** CSV export/import column order. Import maps positionally, so keep in sync. */
export const CSV_COLUMNS = [
  { header: 'Client ID', key: 'clientId', type: 'text' },
  { header: 'Date', key: 'date', type: 'text' },
  { header: 'Staff', key: 'staff', type: 'text' },
  { header: 'Feelings', key: 'feelings', otherKey: 'feelingOther', type: 'list' },
  { header: 'Why Factors', key: 'why', otherKey: 'whyOther', type: 'list' },
  { header: 'Problems', key: 'problems', otherKey: 'problemOther', type: 'list' },
  { header: 'Goals', key: 'goals', otherKey: 'goalOther', type: 'list' },
  { header: 'Decision', key: 'decision', type: 'text' },
  { header: 'Intervention Result', key: 'interventionResult', type: 'text' },
  { header: 'Final Disposition', key: 'finalDisposition', type: 'text' },
  { header: 'Final Reflection', key: 'finalReflection', type: 'text' },
];

export const LIST_SEPARATOR = '; ';
