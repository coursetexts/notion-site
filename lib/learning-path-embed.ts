import { type FeatureExtractionPipeline, pipeline } from '@xenova/transformers'
import { createHash } from 'crypto'

import { expandCatalogQueryForEmbedding } from '@/lib/catalog-search'

export const LEARNING_PATH_EMBED_MODEL = 'Xenova/bge-small-en-v1.5'
export const LEARNING_PATH_EMBED_DIM = 384
const QUERY_PREFIX = 'Represent this sentence for searching relevant passages: '

let extractor: FeatureExtractionPipeline | null = null

async function embed(text: string): Promise<number[]> {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', LEARNING_PATH_EMBED_MODEL)
  }
  const output = await extractor(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data as Float32Array)
}

export function learningPathEmbeddingHash(embeddingText: string): string {
  return createHash('sha256')
    .update(`${LEARNING_PATH_EMBED_MODEL}\n${embeddingText}`)
    .digest('hex')
}

export function embedLearningPathText(embeddingText: string) {
  return embed(embeddingText)
}

export function embedLearningPathQuery(query: string) {
  return embed(`${QUERY_PREFIX}${expandCatalogQueryForEmbedding(query)}`)
}
