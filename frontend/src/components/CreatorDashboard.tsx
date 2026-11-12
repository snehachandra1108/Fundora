import { useEffect, useState } from "react";
import type { Campaign } from "../types/campaign";

function CreatorDashboard() {
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyCampaigns() {
      try {
        const response = await fetch("http://localhost:5000/api/campaigns/my", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch your campaigns.");
        }

        const data = await response.json();

        const formattedCampaigns: Campaign[] = data.campaigns.map(
          (campaign: any) => ({
            id: campaign.id,
            title: campaign.title,
            description: campaign.description,
            category: campaign.category,
            goal: Number(campaign.goal),
            amountRaised: Number(campaign.amount_raised),
            deadline: campaign.deadline,
            image: campaign.image ?? "",
            creatorName: "You",
            creatorId: Number(campaign.creator_id),
            status: campaign.status,
          }),
        );

        setMyCampaigns(formattedCampaigns);
      } catch (error) {
        console.error("Error fetching your campaigns:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMyCampaigns();
  }, []);

  const totalRaised = myCampaigns.reduce(
    (total, campaign) => total + campaign.amountRaised,
    0,
  );

  async function handleDeleteCampaign(campaignId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this campaign?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/campaigns/${campaignId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete campaign.");
      }

      setMyCampaigns((previousCampaigns) =>
        previousCampaigns.filter((campaign) => campaign.id !== campaignId),
      );

      alert("Campaign deleted successfully!");
    } catch (error) {
      console.error("Campaign deletion error:", error);

      alert(error instanceof Error ? error.message : "Something went wrong.");
    }
  }
  return (
    <section className="dashboard-section">
      <div className="dashboard-heading">
        <h1>Creator Dashboard</h1>
        <p>Track and manage your fundraising campaigns.</p>
      </div>

      {/* Dashboard statistics */}
      <div className="dashboard-stats">
        <div className="dashboard-stat-card">
          <h3>Total Campaigns</h3>
          <p>{myCampaigns.length}</p>
        </div>

        <div className="dashboard-stat-card">
          <h3>Total Raised</h3>
          <p>₹{totalRaised.toLocaleString("en-IN")}</p>
        </div>

        <div className="dashboard-stat-card">
          <h3>Total Supporters</h3>
          <p>Coming soon</p>
        </div>
      </div>

      {/* Campaign list */}
      <div className="dashboard-campaigns">
        <div className="dashboard-campaigns-heading">
          <h2>My Campaigns</h2>
        </div>

        {loading ? (
          <p>Loading your campaigns...</p>
        ) : myCampaigns.length === 0 ? (
          <p>You haven't created any campaigns yet.</p>
        ) : (
          myCampaigns.map((campaign) => (
            <div className="dashboard-campaign-item" key={campaign.id}>
              <div>
                <h3>{campaign.title}</h3>

                <p>
                  ₹{campaign.amountRaised.toLocaleString("en-IN")} raised of ₹
                  {campaign.goal.toLocaleString("en-IN")}
                </p>

                <p>Category: {campaign.category}</p>
              </div>

              <span className={`campaign-status ${campaign.status}-status`}>
                {campaign.status
                  ? campaign.status.charAt(0).toUpperCase() +
                    campaign.status.slice(1)
                  : "Unknown"}
              </span>

              <button
                className="delete-button"
                onClick={() => handleDeleteCampaign(campaign.id)}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default CreatorDashboard;
