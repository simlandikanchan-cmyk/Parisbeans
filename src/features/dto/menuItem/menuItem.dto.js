export const toMenuItem = ({ title, image, price }) => ({
  id: title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, ''),
  title,
  image,
  price,
})

export const toMenuItems = (items) => items.map(toMenuItem)

export const toCafeCards = (titles, prices, items) =>
  titles.map((title) => ({
    title,
    price: prices[title],
    image: items.find((item) => item.title === title)?.image,
  }))