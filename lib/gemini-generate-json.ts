import got from 'got'

import { extractJsonObject } from '@/lib/learning-path-fill'

type GeminiPart = { text?: string }

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] }
    finishReason?: string
  }>
  promptFeedback?: { blockReason?: string }
  error?: { message?: string }
}

function textFromGemini(data: GeminiGenerateContentResponse) {
  const parts = data.candidates?.[0]?.content?.parts ?? []
  return parts
    .map((part) => (typeof part.text === 'string' ? part.text : ''))
    .join('')
    .trim()
}

export async function generateGeminiJson(input: {
  apiKey: string
  model: string
  systemPrompt: string
  userPrompt: string
  responseSchema?: Record<string, unknown>
  temperature?: number
  maxOutputTokens?: number
}): Promise<unknown> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    input.model
  )}:generateContent`

  const withSchema = Boolean(input.responseSchema)
  const post = (useSchema: boolean, disableThinking: boolean) =>
    got
      .post(url, {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': input.apiKey
        },
        json: {
          systemInstruction: {
            parts: [{ text: input.systemPrompt }]
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: input.userPrompt }]
            }
          ],
          generationConfig: {
            temperature: input.temperature ?? 0.2,
            maxOutputTokens: input.maxOutputTokens ?? 1024,
            responseMimeType: 'application/json',
            ...(disableThinking ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
            ...(useSchema && input.responseSchema
              ? { responseSchema: input.responseSchema }
              : {})
          }
        },
        timeout: { request: 30000 }
      })
      .json<GeminiGenerateContentResponse>()

  let completion: GeminiGenerateContentResponse
  try {
    completion = await post(withSchema, true)
  } catch (error: unknown) {
    const status = Number(
      (error as { response?: { statusCode?: number } })?.response?.statusCode ||
        0
    )
    if (status !== 400) throw error
    try {
      completion = await post(withSchema, false)
    } catch (retryError: unknown) {
      const retryStatus = Number(
        (retryError as { response?: { statusCode?: number } })?.response
          ?.statusCode || 0
      )
      if (!withSchema || retryStatus !== 400) throw retryError
      completion = await post(false, false)
    }
  }

  if (completion.promptFeedback?.blockReason) {
    throw new Error(`Gemini blocked this item (${completion.promptFeedback.blockReason})`)
  }
  if (completion.error?.message) {
    throw new Error(completion.error.message)
  }
  const raw = textFromGemini(completion)
  if (!raw) {
    const reason = completion.candidates?.[0]?.finishReason || 'unknown'
    throw new Error(`Gemini returned an empty response (${reason})`)
  }
  return extractJsonObject(raw)
}
