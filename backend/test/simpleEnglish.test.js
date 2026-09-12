import assert from 'node:assert/strict'
import test from 'node:test'
import { simpleEnglishRequestSchema } from '../src/controllers/simpleEnglishController.js'
import { generateSimpleEnglish, normalizeMarkdown, promptFilename } from '../src/services/simpleEnglish.js'

test('validates empty, short, valid, and oversized input', () => {
  assert.equal(simpleEnglishRequestSchema.safeParse({ input: '' }).success, false)
  assert.equal(simpleEnglishRequestSchema.safeParse({ input: 'too short' }).success, false)
  assert.equal(simpleEnglishRequestSchema.safeParse({ input: 'Build a student dashboard with placement notifications.' }).success, true)
  assert.equal(simpleEnglishRequestSchema.safeParse({ input: 'x'.repeat(50_001) }).success, false)
})

test('normalizes fenced Markdown and supplies a missing title', () => {
  assert.equal(normalizeMarkdown('```markdown\n# Campus Connect\n\n## Objective\nHelp students.\n```'), '# Campus Connect\n\n## Objective\nHelp students.')
  assert.equal(normalizeMarkdown('## Objective\nBuild the requested application.'), '# AI-Ready Prompt\n\n## Objective\nBuild the requested application.')
})

test('creates safe meaningful Markdown filenames', () => {
  assert.equal(promptFilename('# Campus Connect!\n\nPrompt'), 'campus-connect-ai-prompt.md')
  assert.equal(promptFilename('# AI-Ready Prompt\n\nPrompt'), 'simple-english-prompt.md')
})

test('sends the complete user input and returns exact Markdown', async () => {
  const input = 'Build a React app. Preserve https://example.com and `npm run build`.'
  let request
  const client = { responses: { create: async value => {
    request = value
    return { model: 'test-model', output_text: '# React Application\n\n## Requirements\n- Preserve https://example.com\n- Run `npm run build`.' }
  } } }
  const result = await generateSimpleEnglish(input, client)
  assert.equal(request.input, input)
  assert.equal(request.store, false)
  assert.match(request.instructions, /never invent requirements/i)
  assert.match(result.prompt, /https:\/\/example\.com/)
  assert.match(result.prompt, /`npm run build`/)
})

test('accepts conversational, technical, bulleted, and intentionally vague explanations without altering them before AI processing', async () => {
  const cases = [
    'I am a student and people keep missing placement emails, so I want one dashboard for students and mentors.',
    'Use React 19, Express 5, MongoDB, JWT authentication, and deploy the client to Vercel.',
    'Please include:\n- Admin login\n- Student alerts\n- A searchable company list',
    'I may want a mobile app later, but I have not decided which framework to use.',
    'Call https://api.example.com/v2 and preserve this snippet: `const ready = true`.',
  ]
  const received = []
  const client = { responses: { create: async request => {
    received.push(request.input)
    return { output_text: '# Structured Request\n\n## Requirements\n- Preserve the supplied information.' }
  } } }
  for (const input of cases) await generateSimpleEnglish(input, client)
  assert.deepEqual(received, cases)
})

test('maps rate limits and rejects invalid AI output', async () => {
  const limited = { responses: { create: async () => { throw Object.assign(new Error('limited'), { status: 429 }) } } }
  await assert.rejects(() => generateSimpleEnglish('A sufficiently detailed user explanation.', limited), error => error.status === 429 && error.expose === true)
  const invalid = { responses: { create: async () => ({ output_text: '' }) } }
  await assert.rejects(() => generateSimpleEnglish('A sufficiently detailed user explanation.', invalid), error => error.status === 502 && error.expose === true)
})
