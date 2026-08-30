/**
 * Fallback / seed syllabus for /learning-path when Supabase is empty.
 * Canonical curated data lives in data/curated-courses/{slug}.json —
 * this re-exports Fluid Mechanics for the client-side fallback.
 */
import fluidMechanicsJson from '@/data/curated-courses/fluid-mechanics.json'
import {
  type CourseLearningPathData,
  type CourseLearningPathLink,
  type CourseLearningPathNode,
  type CourseLearningPathVideo,
  mergeCourseLearningPathLegacyResources
} from './course-learning-path-types'
import type { CourseResource } from '@/lib/undergraduate-degrees'

type JsonVideo = {
  title: string
  channel?: string
  durationSeconds?: number
  url?: string
  annotation?: string
  thumbnailQuery?: string
  thumbnailUrl?: string | null
}

type JsonLink = {
  title: string
  url?: string
}

type JsonNode = {
  type: 'topic' | 'subtopic' | 'concept'
  title: string
  description?: string
  videos?: JsonVideo[]
  tests?: JsonLink[]
  slides?: JsonLink[]
  children?: JsonNode[]
}

function mapVideos(videos: JsonVideo[] | undefined): CourseLearningPathVideo[] | undefined {
  if (!videos?.length) return undefined
  return videos.map((v, i) => ({
    id: `local_video_${i}_${v.title.slice(0, 24)}`,
    position: i + 1,
    title: v.title,
    channel: v.channel ?? '',
    durationSeconds: v.durationSeconds ?? 0,
    url: v.url || '#',
    thumbnailQuery: v.thumbnailQuery,
    thumbnailUrl: v.thumbnailUrl,
    annotation: v.annotation
  }))
}

function mapLinks(
  links: JsonLink[] | undefined,
  kind: 'test' | 'slide'
): CourseLearningPathLink[] | undefined {
  if (!links?.length) return undefined
  return links.map((item, i) => ({
    id: `local_${kind}_${i}_${item.title.slice(0, 24)}`,
    position: i + 1,
    title: item.title,
    url: item.url || '#'
  }))
}

function mapNode(node: JsonNode, path: string): CourseLearningPathNode {
  const videos = mapVideos(node.videos)
  const tests = mapLinks(node.tests, 'test')
  const slides = mapLinks(node.slides, 'slide')
  const topicResources = mergeCourseLearningPathLegacyResources(
    videos,
    slides,
    tests
  )
  return {
    id: `local_${path}`,
    type: node.type,
    title: node.title,
    description: node.description,
    videos,
    tests,
    slides,
    topicResources: topicResources.length ? topicResources : undefined,
    children: node.children?.map((child, i) =>
      mapNode(child, `${path}_${i}`)
    )
  }
}

const raw = fluidMechanicsJson as {
  slug: string
  title: string
  description: string
  resources?: CourseResource[]
  topics: JsonNode[]
}

/** Client fallback when DB has no Fluid Mechanics syllabus tree yet. */
export const fluidMechanicsSeedCourse: CourseLearningPathData = {
  id: 'course_fluid_mechanics',
  slug: raw.slug,
  title: raw.title,
  description: raw.description,
  resources: raw.resources,
  topics: raw.topics.map((topic, i) => mapNode(topic, `t${i}`)),
  dbBacked: false
}

/** Default slug used by /learning-path when none is specified. */
export const DEFAULT_COURSE_LEARNING_PATH_SLUG = 'fluid-mechanics'
