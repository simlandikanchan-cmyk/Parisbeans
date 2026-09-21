import { srcSize } from '../data/siteData'
import './OurStoryImageRow.css'

export default function OurStoryImageRow() {
  return (
    <div className="ostory-story-img">
      <img
        src="/images/story/img.webp"
        alt="Paris Beans story image"
        loading="lazy"
        {...srcSize('/images/story/img.webp')}
      />
    </div>
  )
}