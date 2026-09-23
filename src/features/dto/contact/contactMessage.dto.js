export const createContactMessage = (formData) => ({
  from_name: formData.get('from_name'),
  reply_to: formData.get('reply_to'),
  message: formData.get('message'),
  newsletter: formData.get('newsletter') === 'yes',
})