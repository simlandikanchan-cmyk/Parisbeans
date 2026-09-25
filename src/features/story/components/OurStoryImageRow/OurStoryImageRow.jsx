import { srcSize } from '../../../../shared/assets/srcSize'
import { storyImages } from '../../../../shared/assets/images'
import './OurStoryImageRow.css'

export default function OurStoryImageRow() {
  return (
    <div className="ostory-story-img">
      <picture>
        <source
          srcSet={storyImages.phoneStoryPage}
          media="(max-width: 767px)"
          {...srcSize(storyImages.phoneStoryPage)}
        />
        <source
          srcSet={storyImages.tabletStory}
          media="(min-width: 768px) and (max-width: 1023px)"
          {...srcSize(storyImages.tabletStory)}
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