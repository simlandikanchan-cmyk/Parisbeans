import { srcSize } from '@shared/assets/srcSize'
import { storyImages } from '@shared/assets/images'
import './OurStoryImageRow.css'

export default function OurStoryImageRow() {
  return (
    <div className="ostory-story-img">
      <picture>
        {/* <source> takes no width/height — those are not valid attributes on
            it. The dimensions belong on the <img> below, which is the element
            the browser lays out. */}
        <source
          srcSet={storyImages.phoneStoryPage}
          media="(max-width: 767px)"
        />
        {/* The tablet source covers both tablet tiers. It used to stop at 1023px
            while the CSS tablet band ran to 1024px, so at exactly 1024px the
            tablet layout was active while the 1935x939 desktop source was
            served. Because the three sources have unrelated aspect ratios
            (0.949 / 1.230 / 2.061) that handed the section a 335px height drop
            on a one-pixel change — a 40% collapse — from swapping a 1.23
            landscape for a 2.06 ultrawide. Holding one source across the whole
            band makes the height scale smoothly instead. */}
        <source
          srcSet={storyImages.tabletStory}
          media="(min-width: 768px) and (max-width: 1099px)"
        />
        <img
          src={storyImages.img}
          alt="Paris Beans story image"
          loading="lazy"
          {...srcSize(storyImages.img)}
        />
      </picture>
    </div>
  )
}