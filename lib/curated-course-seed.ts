/**
 * Fallback / seed syllabus for /curated-course when Supabase is empty.
 * Canonical curated data lives in data/curated-courses/{slug}.json —
 * this re-exports Fluid Mechanics for the client-side fallback.
 */
import fluidMechanicsJson from '@/data/curated-courses/fluid-mechanics.json'
import type {
  CuratedCourseData,
  CuratedCourseNode,
  CuratedCourseVideo
} from './curated-course-types'
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

type JsonNode = {
  type: 'topic' | 'subtopic' | 'concept'
  title: string
  description?: string
  videos?: JsonVideo[]
  children?: JsonNode[]
}

function mapVideos(videos: JsonVideo[] | undefined): CuratedCourseVideo[] | undefined {
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

function mapNode(node: JsonNode, path: string): CuratedCourseNode {
  return {
    id: `local_${path}`,
    type: node.type,
    title: node.title,
    description: node.description,
    videos: mapVideos(node.videos),
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
export const fluidMechanicsSeedCourse: CuratedCourseData = {
  id: 'course_fluid_mechanics',
  slug: raw.slug,
  title: raw.title,
  description: raw.description,
  resources: raw.resources,
  topics: raw.topics.map((topic, i) => mapNode(topic, `t${i}`)),
  dbBacked: false
}

/** Default slug used by /curated-course when none is specified. */
export const DEFAULT_CURATED_COURSE_SLUG = 'fluid-mechanics'
