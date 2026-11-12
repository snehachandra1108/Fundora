
import { useNavigate } from "react-router-dom";
import type { User } from "../types/user";

function Hero({ currentUser }: { currentUser: User | null }) {
  const navigate = useNavigate();

  function handleExploreCampaigns() {
    document.getElementById("campaigns")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function handleStartCampaign() {
    if (currentUser) {
      navigate("/create-campaign");
    } else {
      navigate("/login");
    }
  }

  return (
    <section id="home" className="hero-section">
      <div className="hero-content">
        <div className="hero-intro">
          <span className="hero-intro-dot"></span>
          A COMMUNITY THAT BELIEVES IN YOUR IDEAS
        </div>

        <h1>
          Big Dreams Begin
          <br />
          With <span>Small Steps.</span>
        </h1>

        <p className="hero-description">
          Every meaningful change starts with someone who believes.
          Fundora brings people together to turn inspiring ideas,
          personal dreams and important causes into reality.
        </p>

        <div className="hero-buttons">
          <button
            className="primary-button"
            onClick={handleExploreCampaigns}
          >
            Explore Campaigns
          </button>

          <button
            className="secondary-button"
            onClick={handleStartCampaign}
          >
            Start a Campaign
          </button>
        </div>

        <div className="hero-highlights">
          <div className="hero-highlight">
            <div className="hero-highlight-icon">✦</div>
            <div>
              <h3>Launch an Idea</h3>
              <p>Give your vision a starting point.</p>
            </div>
          </div>

          <div className="hero-highlight">
            <div className="hero-highlight-icon">♡</div>
            <div>
              <h3>Support a Cause</h3>
              <p>Help ideas you believe in.</p>
            </div>
          </div>

          <div className="hero-highlight">
            <div className="hero-highlight-icon">↗</div>
            <div>
              <h3>Make an Impact</h3>
              <p>Every contribution matters.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
