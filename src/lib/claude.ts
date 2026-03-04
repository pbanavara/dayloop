import OpenAI from 'openai'

let openaiClient: OpenAI | null = null

function getOpenAIClient() {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
  }
  return openaiClient
}

export async function parseTasksFromText(rawText: string): Promise<{ title: string }[]> {
  const client = getOpenAIClient()

  const response = await client.chat.completions.create({
    model: 'gpt-5-mini',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Extract a list of tasks from the following text. Return ONLY a JSON array of objects with a "title" field. Each task should be a concise action item. Do not include any explanation, just the JSON array.

Text: "${rawText}"

Example output format:
[{"title": "Call dentist"}, {"title": "Review Q3 report"}, {"title": "Buy groceries"}]`,
      },
    ],
  })

  const text = response.choices[0]?.message?.content?.trim() ?? ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('No JSON array found in OpenAI response')
  }

  const tasks = JSON.parse(jsonMatch[0]) as { title: string }[]

  return tasks
    .filter((t) => t && typeof t.title === 'string' && t.title.trim())
    .map((t) => ({ title: t.title.trim() }))
}
