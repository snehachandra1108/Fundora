
import { useNotification } from "../context/NotificationContext";
import API_URL from "../config/api";
import { useEffect, useState } from "react";

interface PendingCampaign {
  id: number;
  title: string;
  description: string;
  category: string;
  goal: string;
  deadline: string;
  creator_name: string;
  creator_email: string;
  status: "pending";
}

interface AdminStats {
  total_users: number;
  total_campaigns: number;
  total_funds_raised: string | number;
}

interface RecentUser {
  id: number;
  name: string;
  email: string;
  role: "supporter" | "creator" | "admin";
  created_at: string;
}

interface AdminContribution {
  id: number;
  amount: string | number;
  utr_reference: string | null;
  status: string;
  created_at: string;
  supporter_name: string;
  supporter_email: string;
  campaign_title: string;
}

function AdminDashboard() {
  const [pendingCampaigns, setPendingCampaigns] = useState<PendingCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const [contributions, setContributions] = useState<AdminContribution[]>([]);
  const [contributionsLoading, setContributionsLoading] = useState(true);
  const [contributionsError, setContributionsError] = useState("");

  const { showNotification } = useNotification();

  useEffect(() => {
    async function fetchPendingCampaigns() {
      try {
        const response = await fetch(`${API_URL}/api/campaigns/pending`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch pending campaigns.");
        }

        const data = await response.json();
        setPendingCampaigns(data.campaigns || []);
      } catch (error) {
        console.error("Error fetching pending campaigns:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPendingCampaigns();
  }, []);

  useEffect(() => {
    async function fetchAdminStats() {
      try {
        const response = await fetch(`${API_URL}/api/admin/stats`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch platform statistics.");
        }

        const data = await response.json();

        if (!data.stats) {
          throw new Error("Statistics were not returned by the server.");
        }

        setStats(data.stats);
        setStatsError("");
      } catch (error) {
        console.error("Error fetching admin statistics:", error);
        setStatsError("Unable to load platform statistics.");
      } finally {
        setStatsLoading(false);
      }
    }

    fetchAdminStats();
  }, []);

  useEffect(() => {
    async function fetchRecentUsers() {
      try {
        const response = await fetch(`${API_URL}/api/admin/users`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch recent users.");
        }

        const data = await response.json();
        setRecentUsers(data.users || []);
      } catch (error) {
        console.error("Error fetching recent users:", error);
      } finally {
        setUsersLoading(false);
      }
    }

    fetchRecentUsers();
  }, []);

  useEffect(() => {
    async function fetchContributions() {
      try {
        const response = await fetch(`${API_URL}/api/admin/contributions`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch contributions.");
        }

        const data = await response.json();
        setContributions(data.contributions || []);
        setContributionsError("");
      } catch (error) {
        console.error("Error fetching contributions:", error);
        setContributionsError("Unable to load contribution information.");
      } finally {
        setContributionsLoading(false);
      }
    }

    fetchContributions();
  }, []);

  async function handleCampaignReview(
    campaignId: number,
    status: "approved" | "rejected",
  ) {
    try {
      const response = await fetch(
        `${API_URL}/api/campaigns/${campaignId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ status }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update campaign status.");
      }

      setPendingCampaigns((previousCampaigns) =>
        previousCampaigns.filter((campaign) => campaign.id !== campaignId),
      );

      showNotification(
        status === "approved"
          ? "Campaign approved successfully!"
          : "Campaign rejected successfully!",
        "success",
      );
    } catch (error) {
      console.error("Campaign review error:", error);

      showNotification(
        error instanceof Error ? error.message : "Something went wrong.",
        "error",
      );
    }
  }

  return (
    <section className="dashboard-section">
      <div className="dashboard-heading">
        <h1>Admin Dashboard</h1>
        <p>Manage Fundora and monitor platform activity.</p>
      </div>

      {/* Platform statistics */}
      <div className="dashboard-stats">
        <div className="dashboard-stat-card">
          <h3>Total Users</h3>
          <p>
            {statsLoading
              ? "Loading..."
              : statsError
                ? "Unavailable"
                : (stats?.total_users ?? 0).toLocaleString("en-IN")}
          </p>
        </div>

        <div className="dashboard-stat-card">
          <h3>Total Campaigns</h3>
          <p>
            {statsLoading
              ? "Loading..."
              : statsError
                ? "Unavailable"
                : (stats?.total_campaigns ?? 0).toLocaleString("en-IN")}
          </p>
        </div>

        <div className="dashboard-stat-card">
          <h3>Total Funds Raised</h3>
          <p>
            {statsLoading
              ? "Loading..."
              : statsError
                ? "Unavailable"
                : `₹${Number(stats?.total_funds_raised ?? 0).toLocaleString("en-IN")}`}
          </p>
        </div>
      </div>

      {statsError && <p>{statsError}</p>}

      {/* Campaign moderation */}
      <div className="dashboard-campaigns">
        <div className="dashboard-campaigns-heading">
          <h2>Campaigns Pending Review</h2>
        </div>

        {loading ? (
          <p>Loading pending campaigns...</p>
        ) : pendingCampaigns.length === 0 ? (
          <p>No campaigns are waiting for approval.</p>
        ) : (
          pendingCampaigns.map((campaign) => (
            <div className="dashboard-campaign-item" key={campaign.id}>
              <div>
                <h3>{campaign.title}</h3>
                <p>Category: {campaign.category}</p>
                <p>Created by: {campaign.creator_name}</p>
                <p>Goal: ₹{Number(campaign.goal).toLocaleString("en-IN")}</p>
              </div>

              <div className="campaign-review-actions">
                <span className="campaign-status pending-status">Pending</span>

                <button
                  className="approve-button"
                  onClick={() => handleCampaignReview(campaign.id, "approved")}
                >
                  Approve
                </button>

                <button
                  className="reject-button"
                  onClick={() => handleCampaignReview(campaign.id, "rejected")}
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* All contributions */}
      <div className="dashboard-campaigns admin-contributions">
        <div className="dashboard-campaigns-heading">
          <h2>All Contributions</h2>
        </div>

        {contributionsLoading ? (
          <p>Loading contributions...</p>
        ) : contributionsError ? (
          <p>{contributionsError}</p>
        ) : contributions.length === 0 ? (
          <p>No contributions have been made yet.</p>
        ) : (
          contributions.map((contribution) => (
            <div className="dashboard-campaign-item" key={contribution.id}>
              <div>
                <h3>{contribution.campaign_title}</h3>
                <p>
                  Contributor: {contribution.supporter_name}
                </p>
                <p>Email: {contribution.supporter_email}</p>
                <p>
                  Amount: ₹
                  {Number(contribution.amount).toLocaleString("en-IN")}
                </p>
                <p>
                  UTR Reference: {contribution.utr_reference || "Not submitted"}
                </p>
                <p>
                  Date:{" "}
                  {new Date(contribution.created_at).toLocaleString("en-IN")}
                </p>
              </div>

              <span
                className={`campaign-status ${contribution.status}-status`}
              >
                {contribution.status.charAt(0).toUpperCase() +
                  contribution.status.slice(1)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Recent users */}
      <div className="dashboard-campaigns admin-users">
        <div className="dashboard-campaigns-heading">
          <h2>Recent Users</h2>
        </div>

        {usersLoading ? (
          <p>Loading recent users...</p>
        ) : recentUsers.length === 0 ? (
          <p>No users registered yet.</p>
        ) : (
          recentUsers.map((user) => (
            <div className="dashboard-campaign-item" key={user.id}>
              <div>
                <h3>{user.name}</h3>
                <p>{user.email}</p>
              </div>

              <span className="campaign-status">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default AdminDashboard;
