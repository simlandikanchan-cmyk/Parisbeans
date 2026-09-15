import './Legal.css'

export default function TermsConditions() {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <header className="legal-hero">
          <span className="legal-eyebrow">Terms &amp; Conditions</span>
          <h1 className="legal-title">
            The Fine Print, <em>Made Friendly.</em>
          </h1>
          <p className="legal-lede">
            These terms outline the simple ground rules for enjoying Paris Beans
            — online and in person, inside Hair Rap by Yoyo. By visiting or
            ordering from us, you agree to them.
          </p>
          <p className="legal-meta">
            Last updated <span>January 2026</span>
          </p>
        </header>

        <section className="legal-section">
          <div className="legal-section-top">
            <span className="legal-num">01</span>
            <h2 className="legal-h2">Acceptance of Terms</h2>
          </div>
          <p>
            By accessing the Paris Beans website or visiting our café corner at
            Hair Rap by Yoyo, you agree to be bound by these Terms &amp;
            Conditions. If you do not agree with any part of them, please do
            not use our services.
          </p>
        </section>

        <section className="legal-section">
          <div className="legal-section-top">
            <span className="legal-num">02</span>
            <h2 className="legal-h2">Our Services</h2>
          </div>
          <p>
            Paris Beans offers a curated café experience — specialty coffees,
            light bites and refreshments — designed to complement your salon
            visit. We may change, pause or withdraw services from time to time
            as our offer evolves.
          </p>
        </section>

        <section className="legal-section">
          <div className="legal-section-top">
            <span className="legal-num">03</span>
            <h2 className="legal-h2">Ordering &amp; Payment</h2>
          </div>
          <p>
            All prices are listed in Indian Rupees (₹) and include applicable
            taxes. Payment is expected at the time of ordering. We reserve the
            right to decline or refund an order in the rare case of a pricing
            error.
          </p>
        </section>

        <section className="legal-section">
          <div className="legal-section-top">
            <span className="legal-num">04</span>
            <h2 className="legal-h2">Allergies &amp; Dietary Needs</h2>
          </div>
          <p>
            Please tell our team about any allergies or dietary requirements
            before ordering. While we take care to prepare items correctly, we
            cannot guarantee that any menu item is free from allergens.
          </p>
        </section>

        <section className="legal-section">
          <div className="legal-section-top">
            <span className="legal-num">05</span>
            <h2 className="legal-h2">Café &amp; Salon Etiquette</h2>
          </div>
          <p>
            We want every visit to feel calming and special — for everyone.
            Kindly respect the space, its guests and the team:
          </p>
          <ul className="legal-list">
            <li>Please be mindful of other guests&apos; space and conversations.</li>
            <li>Children are welcome, with supervision.</li>
            <li>Photography is encouraged — just be considerate during busy moments.</li>
            <li>Please dispose of your coffee cups and wrappers thoughtfully.</li>
          </ul>
        </section>

        <section className="legal-section">
          <div className="legal-section-top">
            <span className="legal-num">06</span>
            <h2 className="legal-h2">Gift Cards &amp; Promotions</h2>
          </div>
          <p>
            Gift cards and promotional offers are valid for the period stated
            on the card or offer. They are non-refundable, cannot be exchanged
            for cash, and remain the sole responsibility of the holder.
          </p>
        </section>

        <section className="legal-section">
          <div className="legal-section-top">
            <span className="legal-num">07</span>
            <h2 className="legal-h2">Liability</h2>
          </div>
          <p>
            To the fullest extent permitted by law, Paris Beans and Hair Rap by
            Yoyo shall not be held liable for any indirect, incidental or
            consequential loss arising from use of our website or services.
            Consuming beverages served hot is at your own risk — please take
            care.
          </p>
        </section>

        <section className="legal-section">
          <div className="legal-section-top">
            <span className="legal-num">08</span>
            <h2 className="legal-h2">Intellectual Property</h2>
          </div>
          <p>
            All content on this site — including the Paris Beans name, logo,
            images and copy — belongs to Paris Beans. You may not reproduce,
            distribute or use it commercially without our written permission.
          </p>
        </section>

        <section className="legal-section">
          <div className="legal-section-top">
            <span className="legal-num">09</span>
            <h2 className="legal-h2">Changes to These Terms</h2>
          </div>
          <p>
            We may update these Terms &amp; Conditions from time to time. Any
            changes will be posted on this page with an updated date, and your
            continued use of our services means you accept the revised terms.
          </p>
        </section>

        <div className="legal-contact">
          <h3>Still curious?</h3>
          <p>
            Reach out to the Paris Beans team at{' '}
            <strong>somebody@gmail.com</strong> or by phone at{' '}
            <strong>+91 98765 43210</strong>. We&apos;ll be happy to answer.
          </p>
        </div>
      </div>
    </main>
  )
}