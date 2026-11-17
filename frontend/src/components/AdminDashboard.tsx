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
  total_funds_raised: string;
}

interface RecentUser {
  id: number;
  name: string;
  email: string;
  role: "supporter" | "creator" | "admin";
  created_at: string;
}

function AdminDashboard() {
  const [pendingCampaigns, setPendingCampaigns] = useState<PendingCampaign[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

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

        setPendingCampaigns(data.campaigns);
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

        const responseBody = await response.text();

        if (!response.ok) {
          alert(
            "HTTP Status: " + response.status + "\nResponse: " + responseBody,
          );
          throw new Error("Failed to fetch platform statistics.");
        }

        const data = JSON.parse(responseBody);
        alert(
          "Status: " + response.status + "\nResponse: " + JSON.stringify(data),
        );

        setStats(data.stats);
      } catch (error) {
        console.error("Error fetching admin statistics:", error);
        alert("Admin stats error: " + String(error));
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

        setRecentUsers(data.users);
      } catch (error) {
        console.error("Error fetching recent users:", error);
      } finally {
        setUsersLoading(false);
      }
    }

    fetchRecentUsers();
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

      // Remove the reviewed campaign from the pending list
      setPendingCampaigns((previousCampaigns) =>
        previousCampaigns.filter((campaign) => campaign.id !== campaignId),
      );

      alert(
        status === "approved"
          ? "Campaign approved successfully!"
          : "Campaign rejected successfully!",
      );
    } catch (error) {
      console.error("Campaign review error:", error);

      alert(error instanceof Error ? error.message : "Something went wrong.");
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
            {stats ? stats.total_users.toLocaleString("en-IN") : "Loading..."}
          </p>
        </div>

        <div className="dashboard-stat-card">
          <h3>Total Campaigns</h3>
          <p>
            {stats
              ? stats.total_campaigns.toLocaleString("en-IN")
              : "Loading..."}
          </p>
        </div>

        <div className="dashboard-stat-card">
          <h3>Total Funds Raised</h3>
          <p>
            {stats
              ? `₹${Number(stats.total_funds_raised).toLocaleString("en-IN")}`
              : "Loading..."}
          </p>
        </div>
      </div>

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

      {/* User management */}

      {/* User management */}
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
