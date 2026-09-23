import { contact } from '../../../shared/models/siteData'

export const toLegalDocument = ({ eyebrow, title, lede, sections }) => ({
  eyebrow,
  title,
  lede,
  sections: sections.map(({ id, num, title }) => ({ id, num, title })),
  contact: {
    email: contact.email,
    phone: contact.phone,
  },
})