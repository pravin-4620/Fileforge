import { z } from 'zod'
import { generateSimpleEnglish } from '../services/simpleEnglish.js'

const maxInputCharacters = Math.max(1000, Number(process.env.SIMPLE_ENGLISH_MAX_INPUT_CHARS || 50_000))
export const simpleEnglishRequestSchema = z.object({
  input: z.string({ required_error: 'Please enter some information before generating a prompt.' })
    .trim()
    .min(20, 'Please add a little more detail before generating a prompt.')
    .max(maxInputCharacters, `Your explanation is too long. Keep it under ${maxInputCharacters.toLocaleString()} characters.`),
})

export async function createSimpleEnglishPrompt(req, res) {
  const { input } = simpleEnglishRequestSchema.parse(req.body)
  const result = await generateSimpleEnglish(input)
  res.json({ success: true, prompt: result.prompt, filename: result.filename, model: result.model, fallback: result.fallback })
}
