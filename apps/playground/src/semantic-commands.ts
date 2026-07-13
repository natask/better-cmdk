export const semanticCommands = [
  {
    value: 'cmd-issue',
    label: 'Create Linear issue',
    description: 'File defects, product problems, and broken workflow reports in the tracker.',
    aliases: ['report bug', 'bug report', 'file a defect', 'open a tracker ticket', 'log a product problem'],
    note: 'semantic hit for defect/report intent',
  },
  {
    value: 'cmd-prs',
    label: 'Open GitHub pull requests',
    description: 'Inspect pending diffs, reviewer feedback, and merge readiness.',
    aliases: ['review code', 'code review', 'inspect pending diffs', 'check reviewer feedback', 'look at merge readiness'],
    note: 'semantic hit for code review intent',
  },
  {
    value: 'cmd-deploy',
    label: 'Deploy production',
    description: 'Release the application to production for live users.',
    aliases: ['ship', 'ship app', 'publish', 'publish the live app', 'release to users', 'production release'],
    note: 'semantic hit for ship/publish intent',
  },
  {
    value: 'cmd-docs',
    label: 'Search documentation',
    description: 'Find API references, guides, and integration help.',
    aliases: ['lookup integration guide', 'find API help', 'read developer docs'],
    note: 'semantic hit for docs/help intent',
  },
  {
    value: 'cmd-theme',
    label: 'Toggle dark mode',
    description: 'Switch the interface appearance between light and dark themes.',
    aliases: ['change appearance', 'switch color theme', 'use night interface'],
    note: 'lexical and semantic hit for appearance intent',
  },
  {
    value: 'cmd-debug',
    label: 'Explain error with AI',
    description: 'Analyze stack traces, runtime failures, and broken builds.',
    aliases: ['why failed', 'fix crash', 'diagnose runtime failure', 'analyze broken build', 'explain stack trace'],
    note: 'semantic hit for failure/debug intent',
  },
  {
    value: 'cmd-cafe',
    label: 'Open Cafe menu',
    description: 'Open the cafe drink list and coffee ordering controls.',
    aliases: ['show coffee options', 'browse drink list', 'order espresso'],
    note: 'diacritic folding and semantic hit for coffee intent',
  },
]

export type SemanticCommand = (typeof semanticCommands)[number]

export default semanticCommands
