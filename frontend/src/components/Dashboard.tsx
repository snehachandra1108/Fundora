import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Campaign } from "../types/campaign";

interface Contribution {
  id: number;
  amount: number;
  status: "pending" | "successful" | "failed";
  created_at: string;
  campaign_id: number;
  campaign_title: string;
  campaign_image: string | null;
  utr_reference?: string | null;
}

interface ReceivedContribution {
  id: number;
  amount: number;
  status: "pending" | "successful" | "failed";
  created_at: string;
  campaign_id: number;
  campaign_title: string;
  supporter_name: string;
  utr_reference: string | null;
}

type DashboardTab = "supported" | "created";
type CreatedTab = "received" | "campaigns";

type ConfirmationAction =
  | { type: "review"; contributionId: number; decision: "confirm" | "reject" }
  | { type: "deleteCampaign"; campaignId: number };

const ITEMS_PER_PAGE = 5;

function Dashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("supported");
  const [createdTab, setCreatedTab] = useState<CreatedTab>("received");

  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [receivedContributions, setReceivedContributions] = useState<ReceivedContribution[]>([]);
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([]);

  const [contributionsLoading, setContributionsLoading] = useState(true);
  const [receivedLoading, setReceivedLoading] = useState(true);
  const [campaignsLoading, setCampaignsLoading] = useState(true);

  const [contributionError, setContributionError] = useState("");
  const [receivedError, setReceivedError] = useState("");
  const [campaignError, setCampaignError] = useState("");

  const [selectedContributionId, setSelectedContributionId] = useState<number | null>(null);
  const [reviewingContributionId, setReviewingContributionId] = useState<number | null>(null);
  const [deletingCampaignId, setDeletingCampaignId] = useState<number | null>(null);
  const [confirmationAction, setConfirmationAction] = useState<ConfirmationAction | null>(null);
  const [confirmationError, setConfirmationError] = useState("");

  const [reviewError, setReviewError] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [campaignActionMessage, setCampaignActionMessage] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [receivedCurrentPage, setReceivedCurrentPage] = useState(1);
  const [campaignCurrentPage, setCampaignCurrentPage] = useState(1);

  async function fetchContributions() {
    try {
      const response = await fetch("http://localhost:5000/api/contributions/my", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch contributions.");

      setContributions(Array.isArray(data.contributions) ? data.contributions : []);
      setContributionError("");
    } catch (error) {
      console.error("Contribution fetching error:", error);
      setContributionError("Unable to load your contributions.");
    } finally {
      setContributionsLoading(false);
    }
  }

  async function fetchReceivedContributions() {
    try {
      const response = await fetch("http://localhost:5000/api/contributions/received", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch received contributions.");

      setReceivedContributions(Array.isArray(data.contributions) ? data.contributions : []);
      setReceivedError("");
    } catch (error) {
      console.error("Received contributions fetching error:", error);
      setReceivedError(error instanceof Error ? error.message : "Unable to load received contributions.");
    } finally {
      setReceivedLoading(false);
    }
  }

  async function fetchMyCampaigns() {
    try {
      const response = await fetch("http://localhost:5000/api/campaigns/my", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch your campaigns.");

      const formattedCampaigns: Campaign[] = (
        Array.isArray(data.campaigns) ? data.campaigns : []
      ).map((campaign: any) => ({
        id: Number(campaign.id),
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
      }));

      setMyCampaigns(formattedCampaigns);
      setCampaignError("");
    } catch (error) {
      console.error("Campaign fetching error:", error);
      setCampaignError("Unable to load your campaigns.");
    } finally {
      setCampaignsLoading(false);
    }
  }

  useEffect(() => {
    function refreshDashboard() {
      if (document.visibilityState !== "visible") return;

      fetchContributions();
      fetchReceivedContributions();
      fetchMyCampaigns();
    }

    refreshDashboard();

    const refreshInterval = window.setInterval(refreshDashboard, 5000);
    document.addEventListener("visibilitychange", refreshDashboard);

    return () => {
      window.clearInterval(refreshInterval);
      document.removeEventListener("visibilitychange", refreshDashboard);
    };
  }, []);

  const successfulContributions = contributions.filter(
    (contribution) => contribution.status === "successful",
  );

  const totalAmount = successfulContributions.reduce(
    (total, contribution) => total + Number(contribution.amount),
    0,
  );

  const campaignsSupported = new Set(
    successfulContributions.map((contribution) => contribution.campaign_id),
  ).size;

  const sortedContributions = [...contributions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const totalPages = Math.ceil(sortedContributions.length / ITEMS_PER_PAGE);

  const currentContributions = sortedContributions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const sortedReceivedContributions = [...receivedContributions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const receivedTotalPages = Math.ceil(sortedReceivedContributions.length / ITEMS_PER_PAGE);

  const currentReceivedContributions = sortedReceivedContributions.slice(
    (receivedCurrentPage - 1) * ITEMS_PER_PAGE,
    receivedCurrentPage * ITEMS_PER_PAGE,
  );

  const pendingReceivedContributions = receivedContributions.filter(
    (contribution) => contribution.status === "pending",
  );

  const sortedMyCampaigns = [...myCampaigns].sort((a, b) => b.id - a.id);

  const campaignTotalPages = Math.ceil(sortedMyCampaigns.length / ITEMS_PER_PAGE);

  const currentMyCampaigns = sortedMyCampaigns.slice(
    (campaignCurrentPage - 1) * ITEMS_PER_PAGE,
    campaignCurrentPage * ITEMS_PER_PAGE,
  );

  const totalRaised = myCampaigns.reduce(
    (total, campaign) => total + campaign.amountRaised,
    0,
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, Math.max(totalPages, 1)));
  }, [totalPages]);

  useEffect(() => {
    setReceivedCurrentPage((page) => Math.min(page, Math.max(receivedTotalPages, 1)));
  }, [receivedTotalPages]);

  useEffect(() => {
    setCampaignCurrentPage((page) => Math.min(page, Math.max(campaignTotalPages, 1)));
  }, [campaignTotalPages]);

  async function handleReviewContribution(
    contributionId: number,
    decision: "confirm" | "reject",
  ) {
    setReviewingContributionId(contributionId);
    setConfirmationError("");
    setReviewError("");
    setReviewMessage("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/contributions/${contributionId}/review`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ decision }),
        },
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to review contribution.");

      setReviewMessage(
        decision === "confirm"
          ? "Contribution confirmed successfully."
          : "Contribution rejected successfully.",
      );
      setConfirmationAction(null);

      await Promise.all([
        fetchContributions(),
        fetchReceivedContributions(),
        fetchMyCampaigns(),
      ]);
    } catch (error) {
      console.error("Contribution review error:", error);
      const message = error instanceof Error
        ? error.message
        : "Something went wrong while reviewing the contribution.";
      setReviewError(message);
      setConfirmationError(message);
    } finally {
      setReviewingContributionId(null);
    }
  }

  async function handleDeleteCampaign(campaignId: number) {
    setDeletingCampaignId(campaignId);
    setConfirmationError("");
    setCampaignActionMessage("");

    try {
      const response = await fetch(`http://localhost:5000/api/campaigns/${campaignId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete campaign.");

      setMyCampaigns((previous) =>
        previous.filter((campaign) => campaign.id !== campaignId),
      );
      setCampaignActionMessage("Campaign deleted successfully.");
      setConfirmationAction(null);
    } catch (error) {
      console.error("Campaign deletion error:", error);
      const message = error instanceof Error ? error.message : "Something went wrong.";
      setConfirmationError(message);
    } finally {
      setDeletingCampaignId(null);
    }
  }

  function openConfirmation(action: ConfirmationAction) {
    setConfirmationError("");
    setReviewError("");
    setReviewMessage("");
    setCampaignActionMessage("");
    setConfirmationAction(action);
  }

  function handleConfirmAction() {
    if (!confirmationAction) return;

    if (confirmationAction.type === "review") {
      void handleReviewContribution(
        confirmationAction.contributionId,
        confirmationAction.decision,
      );
    } else {
      void handleDeleteCampaign(confirmationAction.campaignId);
    }
  }

  return (
    <section className="dashboard-section">
      <div className="dashboard-heading">
        <h1>My Dashboard</h1>
        <p>Manage your campaigns and track the causes you support.</p>
      </div>

      <div className="dashboard-tabs">
        <button
          type="button"
          className={activeTab === "supported" ? "active" : ""}
          onClick={() => setActiveTab("supported")}
        >
          Supported Campaigns
        </button>

        <button
          type="button"
          className={activeTab === "created" ? "active" : ""}
          onClick={() => setActiveTab("created")}
        >
          Created Campaigns
        </button>
      </div>

      {activeTab === "supported" && (
        <>
          <div className="dashboard-stats">
            <div className="dashboard-stat-card">
              <h3>Total Contributions</h3>
              <p>₹{totalAmount.toLocaleString("en-IN")}</p>
            </div>

            <div className="dashboard-stat-card">
              <h3>Campaigns Supported</h3>
              <p>{campaignsSupported}</p>
            </div>

            <div className="dashboard-stat-card">
              <h3>Total Contributions Made</h3>
              <p>{contributions.length}</p>
            </div>
          </div>

          <div className="dashboard-campaigns">
            <div className="dashboard-campaigns-heading">
              <h2>Recent Contributions</h2>
            </div>

            {contributionsLoading ? (
              <p>Loading your contributions...</p>
            ) : contributionError ? (
              <p>{contributionError}</p>
            ) : contributions.length === 0 ? (
              <p>You haven't made any contributions yet.</p>
            ) : (
              currentContributions.map((contribution) => (
                <div className="dashboard-campaign-item supported-contribution-item" key={contribution.id}>
                  <div className="supported-contribution-info">
                    <h3>
                      <Link to={`/campaign/${contribution.campaign_id}`}>
                        {contribution.campaign_title}
                      </Link>
                    </h3>

                    <p>
                      ₹{Number(contribution.amount).toLocaleString("en-IN")}
                      {" · "}
                      {new Date(contribution.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  {selectedContributionId === contribution.id && (
                    <div className="contribution-details">
                      <p><strong>Contribution ID:</strong> {contribution.id}</p>
                      <p><strong>Campaign:</strong> {contribution.campaign_title}</p>
                      <p>
                        <strong>Amount:</strong> ₹
                        {Number(contribution.amount).toLocaleString("en-IN")}
                      </p>
                      <p>
                        <strong>Payment Status:</strong>{" "}
                        {contribution.status.charAt(0).toUpperCase() + contribution.status.slice(1)}
                      </p>
                      <p><strong>UTR Reference:</strong> {contribution.utr_reference || "Not submitted"}</p>
                      <p>
                        <strong>Date:</strong>{" "}
                        {new Date(contribution.created_at).toLocaleString("en-IN")}
                      </p>
                    </div>
                  )}

                  <span className={`campaign-status ${contribution.status}`}>
                    {contribution.status.charAt(0).toUpperCase() + contribution.status.slice(1)}
                  </span>

                  <button
                    type="button"
                    className="view-details-button"
                    onClick={() =>
                      setSelectedContributionId(
                        selectedContributionId === contribution.id ? null : contribution.id,
                      )
                    }
                  >
                    {selectedContributionId === contribution.id ? "Hide Details" : "View Details"}
                  </button>
                </div>
              ))
            )}

            {!contributionsLoading && !contributionError && totalPages > 1 && (
              <div className="pagination">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "created" && (
        <>
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
              <h3>Pending Contributions</h3>
              <p>{pendingReceivedContributions.length}</p>
            </div>
          </div>

          <div className="dashboard-tabs dashboard-subtabs">
            <button
              type="button"
              className={createdTab === "received" ? "active" : ""}
              onClick={() => setCreatedTab("received")}
            >
              Contributions Received
            </button>

            <button
              type="button"
              className={createdTab === "campaigns" ? "active" : ""}
              onClick={() => setCreatedTab("campaigns")}
            >
              My Campaigns
            </button>
          </div>

          {createdTab === "received" && (
            <div className="dashboard-campaigns">
              <div className="dashboard-campaigns-heading">
                <h2>Contributions Received</h2>
              </div>

              {reviewMessage && <p className="success-message">{reviewMessage}</p>}
              {reviewError && <p className="error-message">{reviewError}</p>}

              {receivedLoading ? (
                <p>Loading received contributions...</p>
              ) : receivedError ? (
                <p>{receivedError}</p>
              ) : receivedContributions.length === 0 ? (
                <p>You haven't received any contributions yet.</p>
              ) : (
                currentReceivedContributions.map((contribution) => (
                  <div className="dashboard-campaign-item" key={contribution.id}>
                    <div>
                      <h3>
                        <Link to={`/campaign/${contribution.campaign_id}`}>
                          {contribution.campaign_title}
                        </Link>
                      </h3>
                      <p>Supporter: {contribution.supporter_name}</p>
                      <p>Amount: ₹{Number(contribution.amount).toLocaleString("en-IN")}</p>
                      <p>UTR Reference: {contribution.utr_reference || "Not submitted"}</p>
                      <p>
                        Date:{" "}
                        {new Date(contribution.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <span className={`campaign-status ${contribution.status}`}>
                      {contribution.status.charAt(0).toUpperCase() + contribution.status.slice(1)}
                    </span>

                    {contribution.status === "pending" && (
                      <div className="contribution-review-actions">
                        <button
                          type="button"
                          className="confirm-payment-button"
                          disabled={reviewingContributionId !== null || !contribution.utr_reference}
                          onClick={() => openConfirmation({
                            type: "review",
                            contributionId: contribution.id,
                            decision: "confirm",
                          })}
                        >
                          {reviewingContributionId === contribution.id ? "Processing..." : "Confirm Payment"}
                        </button>

                        <button
                          type="button"
                          className="delete-button"
                          disabled={reviewingContributionId !== null || !contribution.utr_reference}
                          onClick={() => openConfirmation({
                            type: "review",
                            contributionId: contribution.id,
                            decision: "reject",
                          })}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}

              {!receivedLoading && !receivedError && receivedTotalPages > 1 && (
                <div className="pagination">
                  <button
                    type="button"
                    onClick={() => setReceivedCurrentPage((page) => Math.max(page - 1, 1))}
                    disabled={receivedCurrentPage === 1}
                  >
                    Previous
                  </button>
                  <span>Page {receivedCurrentPage} of {receivedTotalPages}</span>
                  <button
                    type="button"
                    onClick={() => setReceivedCurrentPage((page) => Math.min(page + 1, receivedTotalPages))}
                    disabled={receivedCurrentPage === receivedTotalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {createdTab === "campaigns" && (
            <div className="dashboard-campaigns">
              {campaignActionMessage && <p className="success-message">{campaignActionMessage}</p>}
              <div className="dashboard-campaigns-heading my-campaigns-heading">
                <h2>My Campaigns</h2>
                <Link to="/create-campaign" className="create-campaign-button">
                  + Create New Campaign
                </Link>
              </div>

              {campaignsLoading ? (
                <p>Loading your campaigns...</p>
              ) : campaignError ? (
                <p>{campaignError}</p>
              ) : myCampaigns.length === 0 ? (
                <p>You haven't created any campaigns yet.</p>
              ) : (
                currentMyCampaigns.map((campaign) => (
                  <div className="dashboard-campaign-item my-campaign-item" key={campaign.id}>
                    <div className="my-campaign-info">
                      <h3>
                        <Link to={`/campaign/${campaign.id}`}>{campaign.title}</Link>
                      </h3>
                      <p>
                        ₹{campaign.amountRaised.toLocaleString("en-IN")} raised of ₹
                        {campaign.goal.toLocaleString("en-IN")}
                      </p>
                      <p>Category: {campaign.category}</p>
                    </div>

                    <span className={`campaign-status ${campaign.status || "unknown"}-status`}>
                      {campaign.status
                        ? campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)
                        : "Unknown"}
                    </span>

                    {campaign.status === "pending" && (
                      <Link to={`/edit-campaign/${campaign.id}`} className="edit-campaign-button">
                        Edit
                      </Link>
                    )}

                    {campaign.status !== "approved" && (
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => openConfirmation({
                          type: "deleteCampaign",
                          campaignId: campaign.id,
                        })}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))
              )}

              {!campaignsLoading && !campaignError && campaignTotalPages > 1 && (
                <div className="pagination">
                  <button
                    type="button"
                    onClick={() => setCampaignCurrentPage((page) => Math.max(page - 1, 1))}
                    disabled={campaignCurrentPage === 1}
                  >
                    Previous
                  </button>
                  <span>Page {campaignCurrentPage} of {campaignTotalPages}</span>
                  <button
                    type="button"
                    onClick={() => setCampaignCurrentPage((page) => Math.min(page + 1, campaignTotalPages))}
                    disabled={campaignCurrentPage === campaignTotalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {confirmationAction && (
        <div
          className="confirmation-modal-backdrop"
          onClick={() => {
            if (reviewingContributionId === null && deletingCampaignId === null) {
              setConfirmationAction(null);
              setConfirmationError("");
            }
          }}
        >
          <div
            className="confirmation-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="confirmation-modal-header">
              <div className={`confirmation-modal-icon ${confirmationAction.type === "review" && confirmationAction.decision === "confirm" ? "success" : "warning"}`}>
                {confirmationAction.type === "deleteCampaign" || confirmationAction.type === "review" && confirmationAction.decision === "reject" ? "!" : "✓"}
              </div>
              <button
                type="button"
                className="confirmation-modal-close"
                aria-label="Close confirmation dialog"
                disabled={reviewingContributionId !== null || deletingCampaignId !== null}
                onClick={() => {
                  setConfirmationAction(null);
                  setConfirmationError("");
                }}
              >
                ×
              </button>
            </div>

            <h2 id="confirmation-modal-title">
              {confirmationAction.type === "deleteCampaign"
                ? "Delete campaign?"
                : confirmationAction.decision === "confirm"
                  ? "Confirm payment?"
                  : "Reject contribution?"}
            </h2>

            {confirmationAction.type === "review" ? (
              <>
                <p className="confirmation-modal-amount">
                  ₹{Number(receivedContributions.find((item) => item.id === confirmationAction.contributionId)?.amount ?? 0).toLocaleString("en-IN")}
                </p>
                <p>
                  {confirmationAction.decision === "confirm"
                    ? "Have you verified that this payment was received in your UPI or bank account? Once confirmed, this amount will be added to the campaign total."
                    : "Are you sure you want to reject this contribution? The contribution will be marked as rejected."}
                </p>
              </>
            ) : (
              <p>
                This will permanently delete “{myCampaigns.find((item) => item.id === confirmationAction.campaignId)?.title ?? "this campaign"}”. This action cannot be undone.
              </p>
            )}

            {confirmationError && <p className="confirmation-modal-error">{confirmationError}</p>}

            <div className="confirmation-modal-actions">
              <button
                type="button"
                className="confirmation-cancel-button"
                disabled={reviewingContributionId !== null || deletingCampaignId !== null}
                onClick={() => {
                  setConfirmationAction(null);
                  setConfirmationError("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`confirmation-submit-button ${confirmationAction.type === "review" && confirmationAction.decision === "confirm" ? "primary" : "danger"}`}
                disabled={reviewingContributionId !== null || deletingCampaignId !== null}
                onClick={handleConfirmAction}
              >
                {reviewingContributionId !== null || deletingCampaignId !== null
                  ? "Processing..."
                  : confirmationAction.type === "deleteCampaign"
                    ? "Delete Campaign"
                    : confirmationAction.decision === "confirm"
                      ? "Confirm Payment"
                      : "Reject Contribution"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Dashboard;
