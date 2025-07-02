import * as React from 'react'
import { useState } from 'react'

export const Footer: React.FC = () => {
  const [requestTopic, setRequestTopic] = useState('')
  const [requestStatus, setRequestStatus] = useState<
    'success' | 'error' | null
  >(null)

  async function handleRequestSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setRequestStatus(null)

    try {
      const response = await fetch('/api/append-to-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: requestTopic })
      })

      const result = await response.json()

      if (response.ok) {
        setRequestStatus('success')
        setRequestTopic('')
      } else {
        throw new Error(result.message || 'Error appending to sheet')
      }
    } catch (error) {
      console.error(error)
      setRequestStatus('error')
    }
  }

  const MathLinks: { title: string; href: string }[] = [
    {
      title: 'Mathematical Biology-Evolutionary Dynamics',
      href: '/mathematical-biology-evolutionary-dynamics-math-242-dff30cb6404848a4bf2bf4d0ba385c46'
    },
    {
      title: 'Automorphic Forms and Arithmetic Statistics',
      href: '/automorphic-forms-and-arithmetic-statistics-math-288x-12d19a13312a8066bbd8dc21cfee3969'
    },

    {
      title: 'Vector Calculus and Linear Algebra II',
      href: '/vector-calculus-and-linear-algebra-ii-math-22b-12d19a13312a8096ad91cf37d6973355'
    },
    {
      title: 'Differential Geometry',
      href: '/differential-geometry-math230a-12d19a13312a8028b457f080d389cd06'
    },
    {
      title: 'Mathematics and the World',
      href: '/mathematics-and-the-world-math-157-12b19a13312a807ea697ffc87aab9f0d'
    },
    {
      title: 'Algebraic Geometry',
      href: '/algebraic-geometry-math137-9991b187ee4d4e66a900e4462dbd59c4'
    }
  ]

  const PhysicsLinks: { title: string; href: string }[] = [
    {
      title: 'Advanced Electromagnetism',
      href: '/advanced-electromagnetismphysics-232-d82e8352f9b24e738aa57720d06e8995'
    },
    {
      title: 'Modern Atomic and Optical Physics I',
      href: '/modern-atomic-and-optical-physics-iphysics285a-4aeba2df8c1241ae9c7703c3d1d4ab63'
    },
    {
      title: 'Frontiers in Biophysics',
      href: '/frontiers-in-biophysicschem163-153883e7e7094a2e8473b7c626b8aa58'
    }
  ]

  return (
    <>
      <footer className='w-full bg-[#0f0f10] text-white py-12 px-16 font-sans flex flex-col items-center max-[700px]:py-8 max-[700px]:px-12'>
        {/* Top section with columns */}
        <div className='w-full mb-8'>
          <div className='flex justify-between items-center w-full max-w-[1200px] mb-8 max-[700px]:flex-col max-[700px]:items-start'>
            <h2 className="text-[1.75rem] font-medium max-w-[500px] leading-[1.4] font-['Tobias'] max-[700px]:leading-[130%] max-[700px]:text-base">
              A free and open archive of
              <br /> Harvard & MIT course materials
            </h2>
            {/* Styled form for input with button */}
            <div>
              <form
                className='flex items-center overflow-hidden w-full max-w-[400px] bg-[#eeede8] rounded-lg focus:outline-none'
                onSubmit={handleRequestSubmit}
              >
                <input
                  type='text'
                  placeholder='Request a Course...'
                  className='bg-[#eeede8] rounded-lg border-none py-3 px-5 text-sm flex items-center w-full focus:outline-none text-gray-900'
                  value={requestTopic}
                  onChange={(e) => setRequestTopic(e.target.value)}
                  required
                />

                <button
                  type='submit'
                  className='bg-[#d6ceb8] py-2.5 px-4 border-none flex items-center justify-center cursor-pointer hover:bg-[#c4baa3]'
                >
                  {/* arrow icon */}
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='21'
                    height='20'
                    viewBox='0 0 21 20'
                    fill='none'
                  >
                    <path
                      d='M17.5303 10.4453L11.9053 16.0703C11.7853 16.1849 11.6259 16.2492 11.46 16.2499C11.377 16.2496 11.2949 16.2337 11.2178 16.2031C11.104 16.1553 11.007 16.0748 10.9388 15.972C10.8707 15.8691 10.8346 15.7483 10.835 15.6249V10.6249H3.33496C3.1692 10.6249 3.01023 10.5591 2.89302 10.4419C2.77581 10.3247 2.70996 10.1657 2.70996 9.99994C2.70996 9.83418 2.77581 9.67521 2.89302 9.558C3.01023 9.44079 3.1692 9.37494 3.33496 9.37494H10.835V4.37494C10.8346 4.25155 10.8707 4.1308 10.9388 4.02792C11.007 3.92504 11.104 3.84463 11.2178 3.79681C11.3332 3.75179 11.4591 3.74036 11.5807 3.76387C11.7024 3.78737 11.8149 3.84484 11.9053 3.92963L17.5303 9.55463C17.6476 9.67312 17.7135 9.83316 17.7135 9.99994C17.7135 10.1667 17.6476 10.3268 17.5303 10.4453V10.4453Z'
                      fill='#111928'
                    />
                  </svg>
                </button>
              </form>

              {/* status messages */}
              {requestStatus === 'success' && (
                <p className='text-green-300 mt-2'>
                  Your request has been submitted!
                </p>
              )}
              {requestStatus === 'error' && (
                <p className='text-red-500 mt-2'>
                  Sorry, there was an error. Please try again.
                </p>
              )}
            </div>
          </div>

          <div className='grid grid-cols-2 w-1/2 min-w-[180px] max-[700px]:w-full max-[700px]:gap-3 max-[350px]:hidden'>
            <div className='mb-2 font-light'>
              <div className='mt-6 mb-2 text-[0.8rem] text-[#D4CBAD]'>Math</div>
              {MathLinks.map((link) => (
                <a
                  key={link.title}
                  href={link.href}
                  className='text-white cursor-pointer mb-2 text-[0.76rem] font-light flex w-full pr-2.5 hover:underline'
                >
                  {link.title}
                </a>
              ))}
            </div>

            <div className='mb-2 font-light'>
              <div className='mt-6 mb-2 text-[0.8rem] text-[#D4CBAD]'>
                Physics
              </div>
              {PhysicsLinks.map((link) => (
                <a
                  key={link.title}
                  href={link.href}
                  className='text-white cursor-pointer mb-2 text-[0.76rem] font-light flex w-full pr-2.5 hover:underline'
                >
                  {link.title}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom strip with brand on left and links on right */}
        <div className='flex justify-between items-center w-full border-t border-[#333] pt-4 text-[0.9rem] max-[700px]:flex-col'>
          <div className="flex font-bold font-['Tobias'] text-lg gap-1.5 max-[700px]:self-start max-[700px]:mb-4">
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
            >
              <path
                d='M21.9 18.3373L18.0187 3.84358C17.9155 3.45947 17.6639 3.13208 17.3194 2.93341C16.9748 2.73475 16.5654 2.68108 16.1813 2.78421L13.2844 3.56233L13.1906 3.59046C13.0509 3.40715 12.8708 3.25851 12.6643 3.15608C12.4578 3.05365 12.2305 3.00018 12 2.99983H9C8.73609 3.00054 8.47716 3.07175 8.25 3.20608C8.02284 3.07175 7.76391 3.00054 7.5 2.99983H4.5C4.10218 2.99983 3.72064 3.15787 3.43934 3.43917C3.15804 3.72048 3 4.10201 3 4.49983V19.4998C3 19.8977 3.15804 20.2792 3.43934 20.5605C3.72064 20.8418 4.10218 20.9998 4.5 20.9998H7.5C7.76391 20.9991 8.02284 20.9279 8.25 20.7936C8.47716 20.9279 8.73609 20.9991 9 20.9998H12C12.3978 20.9998 12.7794 20.8418 13.0607 20.5605C13.342 20.2792 13.5 19.8977 13.5 19.4998V10.1623L16.1063 19.8842C16.1912 20.2046 16.3798 20.4878 16.6427 20.6896C16.9056 20.8915 17.2279 21.0005 17.5594 20.9998C17.6888 20.9976 17.8176 20.9819 17.9437 20.953L20.8406 20.1748C21.2247 20.0716 21.5521 19.82 21.7508 19.4754C21.9495 19.1309 22.0031 18.7215 21.9 18.3373V18.3373ZM16.5656 4.23733L17.1562 6.40296L14.2594 7.18108L13.6688 5.01546L16.5656 4.23733ZM12 4.49983V15.7498H9V4.49983H12ZM7.5 4.49983V6.74983H4.5V4.49983H7.5ZM12 19.4998H9V17.2498H12V19.4998ZM20.4562 18.7217L17.5594 19.4998L16.9688 17.3248L19.875 16.5467L20.4562 18.7217Z'
                fill='white'
              />
            </svg>
            CourseTexts
          </div>
          <div className='flex flex-row min-w-[180px] justify-end gap-4 w-full text-center max-[700px]:w-full max-[700px]:justify-between max-[700px]:gap-2 max-[700px]:text-center max-[350px]:grid max-[350px]:grid-cols-2'>
            <a
              href='https://hcb.hackclub.com/donations/start/coursetexts'
              className='text-white no-underline hover:underline'
            >
              Donate
            </a>
            <a
              href='/terms-of-service'
              className='text-white no-underline hover:underline'
            >
              Terms of Service
            </a>
            <a
              href='/privacy-policy'
              className='text-white no-underline hover:underline'
            >
              Privacy Policy
            </a>
            <a href='#' className='text-white no-underline hover:underline'>
              NCA License
            </a>
          </div>
        </div>
      </footer>
    </>
  )
}
