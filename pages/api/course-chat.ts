import { NextApiRequest, NextApiResponse } from 'next'

import got from 'got'

type Role = 'system' | 'user' | 'assistant'

interface ChatMessage {
  role: Role
  content: string
}

interface OpenAIChatResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY' })
  }

  const {
    messages,
    courseTitle,
    courseDescription
  }: {
    messages?: ChatMessage[]
    courseTitle?: string
    courseDescription?: string
  } = req.body || {}

  const sanitizedMessages = (messages || [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
    .map((m) => ({
      role: m.role,
      content: String(m.content || '').slice(0, 6000)
    }))
    .filter((m) => Boolean(m.content.trim()))
    .slice(-20)

  if (sanitizedMessages.length === 0) {
    return res.status(400).json({ error: 'At least one message is required' })
  }

  const systemPrompt = [
    'You are a course assistant chatbot.',
    `Course name: ${courseTitle || 'Untitled course'}`,
    `Course description: ${courseDescription || 'No description provided.'}`,
    'Your job is to answer student questions about this course topic.',
    'If a question is unrelated to the course topic, politely say so and suggest what kinds of questions you can answer.'
  ].join('\n')

  const requestMessages: ChatMessage[] = [
    {
      role: 'system',
      content: systemPrompt
    },
    ...sanitizedMessages
  ]

  try {
    const completion = await got
      .post('https://api.openai.com/v1/chat/completions', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        json: {
          model: 'gpt-4o-mini',
          temperature: 0.3,
          messages: requestMessages
        }
      })
      .json<OpenAIChatResponse>()

    const reply = completion?.choices?.[0]?.message?.content?.trim()
    if (!reply) {
      return res.status(502).json({ error: 'No response from chat model' })
    }

    return res.status(200).json({ reply })
  } catch (error: unknown) {
    const err = error as {
      message?: string
      response?: {
        statusCode?: number
      }
    }
    const statusCode = Number(err?.response?.statusCode || 500)
    const message = err?.message || 'Could not generate chat response'
    return res.status(statusCode).json({ error: message })
  }
}
