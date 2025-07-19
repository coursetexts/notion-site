import Link from 'next/link'
import React from 'react'
import { FormEvent, useState } from 'react'

import type { SearchResults } from 'notion-types'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { rootNotionPageId } from '@/lib/config'
import { searchNotion } from '@/lib/search-notion'

import { SearchIcon } from './custom-icons'

export default function SearchDialog() {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (query) {
      const results = await searchNotion({
        query,
        ancestorId: rootNotionPageId
      })
      setSearchResults(results)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className='border border-gray-400/50 py-1 px-3 rounded-md flex items-center gap-2 text-sm
              cursor-pointer hover:bg-black/3 transition-colors duration-200
              w-fit sm:w-36 md:w-40 lg:w-44 xl:w-48'
        >
          <SearchIcon />
          <span className=''>Search</span>
        </button>
      </DialogTrigger>
      <DialogContent className='bg-[var(--bg-color)]'>
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className='space-y-8'>
          <Input
            placeholder='Search for a course'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

        {searchResults && (
          <div className='flex flex-col gap-2 mt-4'>
            {searchResults.results.map((result) => {
              const url = `/${result.id}`
              const id = result.id

              let text = ''
              if (result.highlight) {
                // If result has both text and title, prefer title
                if (result.highlight.text && result.highlight.pathText) {
                  // if result.highlight.pathText exists,
                  // we can assert that title exists and is incorrectly typed
                  text = (result.highlight as any).title
                } else if (result.highlight.text) {
                  text = result.highlight.text
                } else if (result.highlight.pathText) {
                  text = (result.highlight as any).title
                }
              }

              // The returned text has the searched terms wrapped in custom tags
              // we replaced those tags with strong/bold tags
              const resultBoldedText = text.replace(
                /<gzkNfoUU>(.*?)<\/gzkNfoUU>/g,
                '<strong>$1</strong>'
              )

              return (
                <Link
                  href={url}
                  key={id}
                  className='block p-2 -mx-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700'
                >
                  <a>
                    <span
                      className='font-medium'
                      dangerouslySetInnerHTML={{ __html: resultBoldedText }}
                    ></span>
                  </a>
                </Link>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
