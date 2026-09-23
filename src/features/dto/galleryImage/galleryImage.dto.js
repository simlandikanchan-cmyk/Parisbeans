export const toGalleryImage = ({ key, alt, src, dims }) => ({
  key,
  alt,
  src,
  width: dims?.width,
  height: dims?.height,
})

export const toGalleryImageList = (items, images, dims) =>
  items.map(({ key, alt }) =>
    toGalleryImage({ key, alt, src: images?.[key], dims: dims?.[key] })
  )