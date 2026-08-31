import { NextApiRequest, NextApiResponse } from 'next'
import got from 'got'

import {
  buildLearningPathFillUserPrompt,
  extractJsonObject,
  LEARNING_PATH_FILL_RESPONSE_SCHEMA,
  LEARNING_PATH_FILL_SYSTEM_PROMPT,
  normalizeFilledLearningPath,
  type FilledLearningPath
} from '@/lib/learning-path-fill'

type GeminiPart = {
  text?: string
}

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[]
    }
    finishReason?: string
  }>
  promptFeedback?: {
    blockReason?: string
  }
  error?: {
    message?: string
  }
}

function readGoal(body: unknown) {
  if (!body || typeof body !== 'object') return ''
  const goal = (body as { goal?: unknown }).goal
  return typeof goal === 'string' ? goal.trim() : ''
}

function textFromGemini(data: GeminiGenerateContentResponse) {
  const parts = data.candidates?.[0]?.content?.parts ?? []
  return parts
    .map((part) => (typeof part.text === 'string' ? part.text : ''))
    .join('')
    .trim()
}

function publicGeminiError(statusCode: number) {
  if (statusCode === 429) {
    return 'The model is busy. Try again in a moment.'
  }
  if (statusCode === 401 || statusCode === 403) {
    return 'Gemini rejected the API key. Check GEMINI_API_KEY.'
  }
  if (statusCode === 404) {
    return 'Gemini model not found. Set GEMINI_MODEL to a model your key can use.'
  }
  return 'Could not fill this learning path.'
}

function statusFromGotError(error: unknown) {
  const err = error as { response?: { statusCode?: number } }
  return Number(err?.response?.statusCode || 0)
}

async function generateFill(
  apiKey: string,
  model: string,
  goal: string,
  withSchema: boolean
) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent`

  return got
    .post(url, {
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      json: {
        systemInstruction: {
          parts: [{ text: LEARNING_PATH_FILL_SYSTEM_PROMPT }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: buildLearningPathFillUserPrompt(goal) }]
          }
        ],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
          ...(withSchema
            ? { responseSchema: LEARNING_PATH_FILL_RESPONSE_SCHEMA }
            : {})
        }
      },
      timeout: { request: 45000 }
    })
    .json<GeminiGenerateContentResponse>()
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FilledLearningPath | { error: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const goal = readGoal(req.body).slice(0, 800)
  if (!goal) {
    return res.status(400).json({ error: 'A goal is required' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY' })
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

  try {
    let completion: GeminiGenerateContentResponse
    try {
      completion = await generateFill(apiKey, model, goal, true)
    } catch (error: unknown) {
      if (statusFromGotError(error) !== 400) throw error
      completion = await generateFill(apiKey, model, goal, false)
    }

    if (completion.promptFeedback?.blockReason) {
      return res.status(502).json({ error: 'The model blocked this goal.' })
    }

    const rawText = textFromGemini(completion)
    if (!rawText) {
      return res.status(502).json({ error: 'No response from the model.' })
    }

    const filled = normalizeFilledLearningPath(extractJsonObject(rawText))
    if (!filled) {
      return res
        .status(502)
        .json({ error: 'Could not read a path outline from the model.' })
    }

    return res.status(200).json(filled)
  } catch (error: unknown) {
    console.error('[fill-learning-path]', error)
    const statusCode = statusFromGotError(error) || 500
    return res.status(statusCode >= 400 ? statusCode : 500).json({
      error: publicGeminiError(statusCode)
    })
  }
}
