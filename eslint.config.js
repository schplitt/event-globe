import schplitt from '@schplitt/eslint-config'

export default schplitt(
  {
    pnpm: true,
  },
).removeRules(['markdown-preferences/canonical-code-block-language'])
