import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

interface Contribution {
  id: number;
  amount: number;
  status: "pending" | "successful" | "failed";
  created_at: string;
  campaign_id: number;
  campaign_title: string;
  image: string | null;
}

function SupporterDashboard() {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedContributionId, setSelectedContributionId] = useState<
    number | null
  >(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchContributions() {
      try {
        const response = await fetch(
          "http://localhost:5000/api/contributions/my",
          {
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch contributions");
        }

        const data = await response.json();
        setContributions(data.contributions);
      } catch (error) {
        console.error(error);
        setError("Unable to load your contributions.");
      } finally {
        setLoading(false);
      }
    }

    fetchContributions();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [contributions]);

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

  const contributionsPerPage = 5;

  const sortedContributions = [...contributions].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const totalPages = Math.ceil(
    sortedContributions.length / contributionsPerPage,
  );

  const startIndex = (currentPage - 1) * contributionsPerPage;

  const currentContributions = sortedContributions.slice(
    startIndex,
    startIndex + contributionsPerPage,
  );

  if (loading) {
    return <p>Loading your contributions...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <section className="dashboard-section">
      <div className="dashboard-heading">
        <h1>Supporter Dashboard</h1>
        <p>Track your contributions and the causes you support.</p>
      </div>

      {/* Supporter statistics */}
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

      {/* Contribution history */}
      <div className="dashboard-campaigns">
        <div className="dashboard-campaigns-heading">
          <h2>Recent Contributions</h2>
        </div>

        {contributions.length === 0 ? (
          <p>You haven't made any contributions yet.</p>
        ) : (
          currentContributions.map((contribution) => (
            <div className="dashboard-campaign-item" key={contribution.id}>
              <div>
                <h3>
                  <Link to={`/campaign/${contribution.campaign_id}`}>
                    {contribution.campaign_title}
                  </Link>
                </h3>
                <p>
                  ₹{Number(contribution.amount).toLocaleString("en-IN")}
                  {" · "}
                  {new Date(contribution.created_at).toLocaleDateString(
                    "en-IN",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                </p>
              </div>

              {selectedContributionId === contribution.id && (
                <div className="contribution-details">
                  <p>
                    <strong>Contribution ID:</strong> {contribution.id}
                  </p>

                  <p>
                    <strong>Campaign:</strong> {contribution.campaign_title}
                  </p>

                  <p>
                    <strong>Amount:</strong> ₹
                    {Number(contribution.amount).toLocaleString("en-IN")}
                  </p>

                  <p>
                    <strong>Payment Status:</strong>{" "}
                    {contribution.status.charAt(0).toUpperCase() +
                      contribution.status.slice(1)}
                  </p>

                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(contribution.created_at).toLocaleString("en-IN")}
                  </p>
                </div>
              )}

              <span className={`campaign-status ${contribution.status}`}>
                {contribution.status.charAt(0).toUpperCase() +
                  contribution.status.slice(1)}
              </span>

              <button
                onClick={() =>
                  setSelectedContributionId(
                    selectedContributionId === contribution.id
                      ? null
                      : contribution.id,
                  )
                }
              >
                {selectedContributionId === contribution.id
                  ? "Hide Details"
                  : "View Details"}
              </button>
            </div>
          ))
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            <span>
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default SupporterDashboard;
