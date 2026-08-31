import * as React from 'react'

import { LearningPathSchemaDiagram } from './CommunitySchema'

import styles from './HomeWhatIsLearningPathSection.module.css'

export function HomeWhatIsLearningPathSection() {
  return (
    <section
      id='what-is-a-learning-path'
      className={styles.section}
      aria-labelledby='what-is-a-learning-path-heading'
    >
      <div className={styles.content}>
        <div className={styles.copy}>
          <h2
            id='what-is-a-learning-path-heading'
            className={styles.heading}
          >
             A new educational interface. <br/>
{' '}
            <span className={styles.headingAccent}>Learning paths.</span>
          </h2>
          <p className={styles.body}>
            {/* The interface you consume any learning content on here is called a
            Boop.
            <br />
            A boop is the list of topics a learner goes through to get to their
            learning goal. Essentially a syllabus. We add a list of resources
            to each concept and a place for you to keep your notes on that
            concept. You can see other peoples comments on each concept and you
            can work with them to curate the best possible set of resources per
            concept.
            <br /> <br /> */}

            {/* When you want to learn something, you have a goal in mind. you learn concepts in an specific order and consume resources (videos, books, etc.) to learn each of those concept. 
            You probabaly make a note to distill what you learned about that concept. 

            <br /> <br />
            We made an interface for this. Called a Boop.  
            You can make your own, for your self privately or share them with people. 
            You can open a resource list so that other people can help you crowdsource and curate the best possible set list of resources.  
            Not all resources are the same for learning a concept, by crowd sourcing you get the best set of resources for a goal. basically what a great professor does.

            <br /> <br />
            These interfaces should be more sticky than working across LLMs, youtube videos, google docs, etc. 

            We organize offical courses as boops in this boop interface too, but we lock the resources to the official course. */}
        

          Everything on coursetexts is wrapped in a learning path.<br/> When you want to learn something, you usually have a goal in mind. A learning path breaks that goal into the concepts you need to understand, puts them in a useful order, and gives you a place to collect the best resources and your notes for each one.

<br/> <br/>
You can make a learning path for yourself or publish it for others. When a path is public, <b>people can suggest resources</b>, vote on which ones are most useful, and help improve the sequence over time - essentially crowdsourcing the kind of curation a great teacher would normally do.

<br/> <br/>Instead of learning across scattered LLM chats, YouTube videos, browser tabs, and Google Docs, everything stays organized around the thing you&apos;re trying to learn. Courses can be learning paths too: we also organize university courses this way, while preserving their official readings and materials.
          </p>
        </div>

        <div className={styles.diagram}>
          <button
            type='button'
            className={styles.diagramPeek}
            aria-label='Show course preview in front of the diagram'
          >
            <img
              src='/images/home/learn-something-new-class-image.png'
              alt=''
            />
          </button>
          <div className={styles.diagramFront}>
            <LearningPathSchemaDiagram />
          </div>
        </div>
      </div>
    </section>
  )
}
