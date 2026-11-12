
import { useRef } from "react";
import { Link } from "react-router-dom";
import type { Campaign } from "../types/campaign";

function Campaigns({ campaigns }: { campaigns: Campaign[] }) {
  const campaignListRef = useRef<HTMLDivElement>(null);

  function scrollCampaigns(direction: "left" | "right") {
    const container = campaignListRef.current;

    if (!container) return;

    const firstCard = container.querySelector<HTMLElement>(".campaign-card");

    if (!firstCard) return;

    const cardWidth = firstCard.offsetWidth;
    const styles = window.getComputedStyle(container);
    const gap = parseFloat(styles.columnGap) || 0;

    container.scrollBy({
      left: direction === "right" ? cardWidth + gap : -(cardWidth + gap),
      behavior: "smooth",
    });
  }

  return (
    <section className="campaigns-section" id="campaigns">
      <div className="section-heading">
        <p className="section-label">MAKE A DIFFERENCE</p>
        <h2>Explore Campaigns</h2>
        <p>
          Discover meaningful causes and support the people working to make a
          difference.
        </p>
      </div>

      {campaigns.length > 0 ? (
        <>
          <div className="campaign-carousel-controls">
            <span className="campaign-count">
              {campaigns.length} campaigns
            </span>

            <div className="campaign-arrow-buttons">
              <button
                type="button"
                className="campaign-arrow"
                aria-label="Scroll campaigns left"
                onClick={() => scrollCampaigns("left")}
              >
                &#8592;
              </button>

              <button
                type="button"
                className="campaign-arrow"
                aria-label="Scroll campaigns right"
                onClick={() => scrollCampaigns("right")}
              >
                &#8594;
              </button>
            </div>
          </div>

          <div className="campaign-list" ref={campaignListRef}>
            {campaigns.map((campaign) => (
              <div className="campaign-card" key={campaign.id}>
                <img
                  src={campaign.image || "/campaign-placeholder.svg"}
                  alt={campaign.title}
                  className="campaign-image"
                  onError={(event) => {
                    event.currentTarget.src = "/campaign-placeholder.svg";
                  }}
                />

                <div className="campaign-info">
                  <span className="campaign-category">
                    {campaign.category}
                  </span>

                  <h3>{campaign.title}</h3>

                  <p>{campaign.description}</p>

                  <div className="campaign-amount">
                    <strong>
                      ₹{campaign.amountRaised.toLocaleString("en-IN")} raised
                    </strong>
                    <span>
                      ₹{campaign.goal.toLocaleString("en-IN")} goal
                    </span>
                  </div>

                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${
                          campaign.goal > 0
                            ? Math.min(
                                (campaign.amountRaised / campaign.goal) * 100,
                                100,
                              )
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>

                  <Link
                    to={`/campaign/${campaign.id}`}
                    className="view-campaign-button"
                  >
                    View Campaign
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="no-campaigns-message">
          No campaigns are available right now. Please check back soon!
        </p>
      )}
    </section>
  );
}

export default Campaigns;
