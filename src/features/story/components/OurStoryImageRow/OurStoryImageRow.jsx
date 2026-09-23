import { srcSize } from '../../../../shared/assets/srcSize'
import { storyImages } from '../../../../shared/assets/images'
import './OurStoryImageRow.css'

export default function OurStoryImageRow() {
  return (
    <div className="ostory-story-img">
      <img
        src={storyImages.img}
        alt="Paris Beans story image"
        loading="lazy"
        {...srcSize(storyImages.img)}
      />
    </div>
  )
}