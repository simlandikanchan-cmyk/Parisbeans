import './Legal.css'

export default function PrivacyPolicy() {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <header className="legal-hero">
          <span className="legal-eyebrow">Privacy Policy</span>
          <h1 className="legal-title">
            Your Privacy, <em>Respected.</em>
          </h1>
          <p className="legal-lede">
            At Paris Beans — the café corner inside Hair Rap by Yoyo — we treat
            the information you share with us with care, transparency and
            respect. This policy explains what we collect, why, and the choices
            you have.
          </p>
          <p className="legal-meta">
            Last updated <span>January 2026</span>
          </p>
        </header>

        <section className="legal-section">
          <div className="legal-section-top">
            <span className="legal-num">01</span>
            <h2 className="legal-h2">Information We Collect</h2>
          </div>
          <p>
            We collect only what we need to serve you better:
          </p>
          <ul className="legal-list">
            <li>Information you give us directly, such as your name, email address or phone number when you contact us, book a table or leave a message.</li>
            <li>Information gathered automatically, such as how you browse the site, which pages you visit and anonymised usage patterns.</li>
            <li>Small pieces of data stored on your device to remember your preferences and keep the site running smoothly.</li>
          </ul>
        </section>

        <section className="legal-section">
          <div className="legal-section-top">
            <span className="legal-num">02</span>
            <h2 className="legal-h2">How We Use Your Information</h2>
          </div>
          <p>
            We use your information to respond to your enquiries, confirm
            reservations and WhatsApp messages, remember your choices, and
            improve the Paris Beans experience. We do not sell your personal
            information to anyone, ever.
          </p>
        </section>

        <section className="legal-section">
          <div className="legal-section-top">
            <span className="legal-num">03</span>
            <h2 className="legal-h2">Cookies &amp; Local Storage</h2>
          </div>
          <p>
            Paris Beans uses minimal cookies and local storage — for example,
            to remember your preferred theme or whether you accepted our
            messages. Most of this can be cleared at any time through your
            browser settings without affecting your visit.
          </p>
        </section>

        <section className="legal-section">
          <div className="legal-section-top">
            <span className="legal-num">04</span>
            <h2 className="legal-h2">Sharing Your Information</h2>
          </div>
          <p>
            We only share information with service providers we trust (such as
            hosting and analytics partners) who agree to protect it, or where
            we are required to do so by law. Outside of that, your details stay
            between you and Paris Beans.
          </p>
        </section>

        <section className="legal-section">
          <div className="legal-section-top">
            <span className="legal-num">05</span>
            <h2 className="legal-h2">Data Security</h2>
          </div>
          <p>
            We take reasonable and appropriate measures to protect your data
            from loss, misuse and unauthorised access. While no method is
            perfectly secure, we work hard to keep our practices up to date and
            your information safe.
          </p>
        </section>

        <section className="legal-section">
          <div className="legal-section-top">
            <span className="legal-num">06</span>
            <h2 className="legal-h2">Your Rights</h2>
          </div>
          <p>
            You may request access to the information we hold about you, ask us
            to correct it, or ask us to delete it. To exercise any of these
            rights, simply get in touch through the contact details below.
          </p>
        </section>

        <div className="legal-contact">
          <h3>Questions? We&apos;re here.</h3>
          <p>
            Contact the Paris Beans team at{' '}
            <strong>somebody@gmail.com</strong> or by phone at{' '}
            <strong>+91 98765 43210</strong>. We&apos;ll be happy to help.
          </p>
        </div>
      </div>
    </main>
  )
}