import Link from 'next/link'
import React from 'react'

import { donate } from '@/lib/config'

import SearchDialog from './SearchDialog'

export const Header = () => {
  return (
    <div className='w-full border-b border-[#AAAEB3] bg-[var(--bg-color)] px-[3%]'>
      <div className='flex items-center justify-between w-full py-3'>
        {/* Left Section */}
        <div className='flex items-center'>
          <Link href='/'>
            <a className='flex items-center'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='25'
                viewBox='0 0 24 25'
                fill='none'
                className='w-6 h-6'
              >
                <path
                  d='M21.9 18.8375L18.0187 4.34375C17.9155 3.95963 17.6639 3.63225 17.3194 3.43358C16.9748 3.23492 16.5654 3.18125 16.1813 3.28438L13.2844 4.0625L13.1906 4.09062C13.0509 3.90732 12.8708 3.75868 12.6643 3.65625C12.4578 3.55382 12.2305 3.50035 12 3.5H9C8.73609 3.50071 8.47716 3.57191 8.25 3.70625C8.02284 3.57191 7.76391 3.50071 7.5 3.5H4.5C4.10218 3.5 3.72064 3.65804 3.43934 3.93934C3.15804 4.22064 3 4.60218 3 5V20C3 20.3978 3.15804 20.7794 3.43934 21.0607C3.72064 21.342 4.10218 21.5 4.5 21.5H7.5C7.76391 21.4993 8.02284 21.4281 8.25 21.2938C8.47716 21.4281 8.73609 21.4993 9 21.5H12C12.3978 21.5 12.7794 21.342 13.0607 21.0607C13.342 20.7794 13.5 20.3978 13.5 20V10.6625L16.1063 20.3844C16.1912 20.7047 16.3798 20.988 16.6427 21.1898C16.9056 21.3916 17.2279 21.5007 17.5594 21.5C17.6888 21.4978 17.8176 21.482 17.9437 21.4531L20.8406 20.675C21.2247 20.5718 21.5521 20.3202 21.7508 19.9756C21.9495 19.631 22.0031 19.2216 21.9 18.8375ZM16.5656 4.7375L17.1562 6.90313L14.2594 7.68125L13.6688 5.51563L16.5656 4.7375ZM12 5V16.25H9V5H12ZM7.5 5V7.25H4.5V5H7.5ZM12 20H9V17.75H12V20ZM20.4562 19.2219L17.5594 20L16.9688 17.825L19.875 17.0469L20.4562 19.2219Z'
                  fill='black'
                ></path>
              </svg>
              <h1 className='font-[tobias-med] text-lg font-bold hidden lg:block lg:ml-[4px]'>
                Coursetexts
              </h1>
              <div className='w-px h-[0.875rem] bg-gray-400 opacity-50 mx-[1rem]'></div>
            </a>
          </Link>
          <div className='flex items-center gap-4'>
            <Link href='/why'>
              <a className='text-md font-extralight font-sans hover:opacity-80'>
                Why
              </a>
            </Link>
            <a
              href={donate}
              target='_blank'
              rel='noreferrer'
              className='text-md font-extralight font-sans hover:opacity-80'
            >
              Donate
            </a>
          </div>
        </div>

        {/* Right Section: Search Dialog/Modal */}
        <SearchDialog />
      </div>
    </div>
  )
}
