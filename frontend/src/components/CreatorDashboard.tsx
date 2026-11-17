
import { useEffect, useState } from "react";
import type { Campaign } from "../types/campaign";
import API_URL from "../config/api";
import { useNotification } from "../context/NotificationContext";

function CreatorDashboard() {
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignToDelete, setCampaignToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showNotification } = useNotification();

  useEffect(() => {
    async function fetchMyCampaigns() {
      try {
        const response = await fetch(`${API_URL}/api/campaigns/my`, {
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

  async function handleDeleteCampaign() {
    if (campaignToDelete === null) {
      return;
    }

    try {
      setIsDeleting(true);

      const response = await fetch(
        `${API_URL}/api/campaigns/${campaignToDelete}`,
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
        previousCampaigns.filter(
          (campaign) => campaign.id !== campaignToDelete,
        ),
      );

      setCampaignToDelete(null);
      showNotification("Campaign deleted successfully!", "success");
    } catch (error) {
      console.error("Campaign deletion error:", error);

      showNotification(
        error instanceof Error ? error.message : "Something went wrong.",
        "error",
      );
    } finally {
      setIsDeleting(false);
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
                onClick={() => setCampaignToDelete(campaign.id)}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      {/* Delete confirmation dialog */}
      {campaignToDelete !== null && (
        <div className="confirmation-overlay">
          <div
            className="confirmation-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
          >
            <h2 id="delete-dialog-title">Delete Campaign?</h2>

            <p id="delete-dialog-description">
              Are you sure you want to delete this campaign? This action cannot
              be undone.
            </p>

            <div className="confirmation-actions">
              <button
                type="button"
                className="confirmation-cancel"
                onClick={() => setCampaignToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirmation-delete"
                onClick={handleDeleteCampaign}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Campaign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default CreatorDashboard;
