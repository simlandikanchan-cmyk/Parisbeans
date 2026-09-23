import emailjs from '@emailjs/browser'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

export async function sendContactMessage(formElement) {
  await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, formElement, { publicKey: PUBLIC_KEY })
  formElement.reset()
}