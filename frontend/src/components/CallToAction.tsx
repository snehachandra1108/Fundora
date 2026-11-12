
import { Link } from 'react-router-dom'
function CallToAction() {
  return (
    <section className="cta-section">

      <h2>Have an Idea Worth Supporting?</h2>

      <p>
        Your idea deserves a chance. Start your fundraising journey
        today and connect with people who believe in your vision.
      </p>

      <Link to="/create-campaign" className="signup-button">
      Start Your Campaign
      </Link>

    </section>
  )
}

export default CallToAction
