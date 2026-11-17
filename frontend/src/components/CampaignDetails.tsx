
import type { User } from "../types/user";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Campaign } from "../types/campaign";
import API_URL from "../config/api";

interface CampaignPaymentDetails {
  upiId: string | null;
  qrImage: string | null;
}

interface MyContribution {
  id: number;
  campaign_id: number;
  amount: number | string;
  status: "pending" | "successful" | "failed";
  utr_reference: string | null;
}

function CampaignDetails({
  currentUser,
  onDelete,
}: {
  currentUser: User | null;
  onDelete: (campaignId: number) => Promise<void>;
}) {
  const navigate = useNavigate();
  const { id } = useParams();

  const [campaign, setCampaign] = useState<Campaign | null>(null);

  const [paymentDetails, setPaymentDetails] =
    useState<CampaignPaymentDetails>({
      upiId: null,
      qrImage: null,
    });

  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [utrReference, setUtrReference] = useState("");

  const [contributing, setContributing] = useState(false);
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [deletingCampaign, setDeletingCampaign] = useState(false);

  const [contributionError, setContributionError] = useState("");
  const [contributionId, setContributionId] = useState<number | null>(null);

  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [utrSubmitted, setUtrSubmitted] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const [savedAmount, setSavedAmount] = useState<number | null>(null);
  const [savingAmount, setSavingAmount] = useState(false);
  const [amountSaveError, setAmountSaveError] = useState("");

  const [contributionStatus, setContributionStatus] = useState<
    "pending" | "successful" | "failed" | null
  >(null);

  // A separate retry key for each user and campaign.
  function getRetryKey() {
    if (!currentUser || !id) return null;

    return `fundora_retry_${currentUser.id}_${id}`;
  }

  // Reset the contribution interface without deleting database records.
  function resetContributionState() {
    setAmount("");
    setUtrReference("");
    setContributionId(null);
    setSavedAmount(null);
    setContributionStatus(null);
    setShowPaymentOptions(false);
    setUtrSubmitted(false);
    setPaymentMessage("");
    setContributionError("");
    setAmountSaveError("");
    setCopyMessage("");
  }

  // Start a fresh contribution and remember this choice across refreshes.
  function resetContributionFlow() {
    const retryKey = getRetryKey();

    if (retryKey) {
      localStorage.setItem(retryKey, "true");
    }

    resetContributionState();
  }

  // Fetch campaign information automatically every 5 seconds.
  useEffect(() => {
    if (!id) return;

    let isInitialLoad = true;

    async function fetchCampaign() {
      try {
        const response = await fetch(
          `${API_URL}/api/campaigns/${id}`,
          {
            credentials: "include",
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch campaign.");
        }

        const data = await response.json();
        const backendCampaign = data.campaign;

        const formattedCampaign: Campaign = {
          id: backendCampaign.id,
          title: backendCampaign.title,
          description: backendCampaign.description,
          category: backendCampaign.category,
          goal: Number(backendCampaign.goal),
          amountRaised: Number(backendCampaign.amount_raised),
          deadline: backendCampaign.deadline,
          image: backendCampaign.image ?? "",
          creatorName: backendCampaign.creator_name ?? "Fundora Creator",
          creatorId: Number(backendCampaign.creator_id),
        };

        setCampaign(formattedCampaign);

        setPaymentDetails({
          upiId: backendCampaign.creator_upi_id ?? null,
          qrImage: backendCampaign.creator_upi_qr_image ?? null,
        });
      } catch (error) {
        console.error("Error fetching campaign:", error);

        if (isInitialLoad) {
          setCampaign(null);
        }
      } finally {
        if (isInitialLoad) {
          setLoading(false);
          isInitialLoad = false;
        }
      }
    }

    function refreshCampaign() {
      if (document.visibilityState === "visible") {
        void fetchCampaign();
      }
    }

    refreshCampaign();

    const refreshInterval = window.setInterval(refreshCampaign, 5000);

    document.addEventListener("visibilitychange", refreshCampaign);

    return () => {
      window.clearInterval(refreshInterval);
      document.removeEventListener("visibilitychange", refreshCampaign);
    };
  }, [id]);

  // Fetch and automatically refresh the user's latest contribution.
  useEffect(() => {
    if (!currentUser || !id) return;

    async function fetchMyContribution() {
      try {
        // Do not overwrite a fresh contribution form after Try Again.
        const retryKey = getRetryKey();

        if (retryKey && localStorage.getItem(retryKey) === "true") {
          return;
        }

        const response = await fetch(
          `${API_URL}/api/contributions/my`,
          {
            credentials: "include",
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch contribution history.");
        }

        const data = await response.json();
        const contributions: MyContribution[] = data.contributions ?? [];

        const campaignContributions = contributions
          .filter((item) => Number(item.campaign_id) === Number(id))
          .sort((a, b) => Number(b.id) - Number(a.id));

        const latestContribution = campaignContributions[0];

        if (!latestContribution) return;

        setContributionId(Number(latestContribution.id));
        setAmount(String(latestContribution.amount));
        setSavedAmount(Number(latestContribution.amount));
        setContributionStatus(latestContribution.status);

        if (latestContribution.status === "pending") {
          if (latestContribution.utr_reference) {
            setUtrSubmitted(true);
            setShowPaymentOptions(false);
            setPaymentMessage(
              "Your reference has been submitted successfully. The creator will verify your payment.",
            );
          } else {
            setUtrSubmitted(false);
            setShowPaymentOptions(true);
          }
        }

        if (
          latestContribution.status === "successful" ||
          latestContribution.status === "failed"
        ) {
          setShowPaymentOptions(false);
          setUtrSubmitted(false);
          setPaymentMessage("");
        }
      } catch (error) {
        console.error("Error fetching contribution:", error);
      }
    }

    function refreshContribution() {
      if (document.visibilityState === "visible") {
        void fetchMyContribution();
      }
    }

    refreshContribution();

    const refreshInterval = window.setInterval(
      refreshContribution,
      5000,
    );

    document.addEventListener("visibilitychange", refreshContribution);

    return () => {
      window.clearInterval(refreshInterval);
      document.removeEventListener("visibilitychange", refreshContribution);
    };
  }, [currentUser, id]);

  const isCampaignOwner = campaign?.creatorId === currentUser?.id;

  async function handleContribute() {
    setContributionError("");
    setPaymentMessage("");

    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (contributionId !== null) {
      setContributionError(
        "You already have a pending contribution. Please complete its payment.",
      );
      return;
    }

    if (!paymentDetails.upiId) {
      setContributionError(
        "The creator has not added their UPI payment details yet.",
      );
      return;
    }

    const contributionAmount = Number(amount);

    if (!Number.isFinite(contributionAmount) || contributionAmount <= 0) {
      setContributionError("Please enter a valid contribution amount.");
      return;
    }

    if (Math.round(contributionAmount * 100) !== contributionAmount * 100) {
      setContributionError(
        "Please enter an amount with at most 2 decimal places.",
      );
      return;
    }

    setContributing(true);

    try {
      const response = await fetch(`${API_URL}/api/contributions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          campaignId: campaign?.id,
          amount: contributionAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create contribution.");
      }

      const retryKey = getRetryKey();

      if (retryKey) {
        localStorage.removeItem(retryKey);
      }

      setContributionId(Number(data.contribution.id));
      setSavedAmount(contributionAmount);
      setContributionStatus("pending");
      setShowPaymentOptions(true);
    } catch (error) {
      setContributionError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setContributing(false);
    }
  }

  async function handleCopyUpiId() {
    if (!paymentDetails.upiId) return;

    try {
      await navigator.clipboard.writeText(paymentDetails.upiId);
      setCopyMessage("UPI ID copied successfully!");
    } catch {
      setCopyMessage("Unable to copy. Please copy the UPI ID manually.");
    }
  }

  async function handleAmountUpdate(): Promise<boolean> {
    if (contributionId === null || utrSubmitted) return false;

    const newAmount = Number(amount);

    if (
      !Number.isFinite(newAmount) ||
      newAmount <= 0 ||
      Math.round(newAmount * 100) !== newAmount * 100
    ) {
      setAmountSaveError("Enter a valid amount with at most 2 decimal places.");
      return false;
    }

    if (newAmount === savedAmount) {
      setAmountSaveError("");
      return true;
    }

    setSavingAmount(true);
    setAmountSaveError("");

    try {
      const response = await fetch(
        `${API_URL}/api/contributions/${contributionId}/amount`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ amount: newAmount }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update contribution amount.",
        );
      }

      setSavedAmount(Number(data.contribution.amount));
      return true;
    } catch (error) {
      setAmountSaveError(
        error instanceof Error ? error.message : "Unable to update amount.",
      );
      return false;
    } finally {
      setSavingAmount(false);
    }
  }

  async function handleSubmitUtr() {
    setContributionError("");
    setPaymentMessage("");

    if (contributionId === null) {
      setContributionError("Please create a contribution first.");
      return;
    }

    const cleanReference = utrReference.trim();

    if (!/^[a-zA-Z0-9-]{6,100}$/.test(cleanReference)) {
      setContributionError(
        "Enter a valid UTR/reference number (6–100 letters, numbers or hyphens).",
      );
      return;
    }

    const amountUpdated = await handleAmountUpdate();

    if (!amountUpdated) return;

    setSubmittingUtr(true);

    try {
      const response = await fetch(
        `${API_URL}/api/contributions/${contributionId}/utr`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            utrReference: cleanReference,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to submit transaction reference.",
        );
      }

      setUtrSubmitted(true);
      setContributionStatus("pending");
      setShowPaymentOptions(false);

      setPaymentMessage(
        "Your reference has been submitted successfully. The creator will verify your payment.",
      );
    } catch (error) {
      setContributionError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setSubmittingUtr(false);
    }
  }

  if (loading) {
    return (
      <section className="campaign-details">
        <div className="campaign-details-container">
          <p className="campaign-loading">Loading campaign...</p>
        </div>
      </section>
    );
  }

  if (!campaign) {
    return (
      <section className="campaign-details">
        <div className="campaign-details-container">
          <div className="campaign-not-found">
            <h1>Campaign not found</h1>
            <p>The campaign you're looking for does not exist.</p>
            <Link to="/" className="edit-campaign-button">
              Explore campaigns
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const progress = Math.min((campaign.amountRaised / campaign.goal) * 100, 100);

  return (
    <section className="campaign-details">
      <div className="campaign-details-container">
        <div className="campaign-details-image">
          <img
            src={campaign.image || "/campaign-placeholder.svg"}
            alt={campaign.title}
            onError={(event) => {
              event.currentTarget.src = "/campaign-placeholder.svg";
            }}
          />
        </div>

        <div className="campaign-details-info">
          <span className="campaign-category">{campaign.category}</span>

          <h1>{campaign.title}</h1>

          <p className="campaign-description">{campaign.description}</p>

          <p className="campaign-creator">
            Created by <strong>{campaign.creatorName}</strong>
          </p>

          <div className="campaign-details-amount">
            <h2>₹{campaign.amountRaised.toLocaleString("en-IN")}</h2>
            <span>raised of ₹{campaign.goal.toLocaleString("en-IN")} goal</span>
          </div>

          <div
            className="progress-bar"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <p className="campaign-progress-text">
            {Math.round(progress)}% of the fundraising goal reached
          </p>

          {currentUser && currentUser.role !== "admin" && !isCampaignOwner && (
            <div className="contribution-section">
              <div className="contribution-form">
                <span className="payment-section-label">MAKE A DIFFERENCE</span>

                <h3>Support this campaign</h3>

                <p>
                  Every contribution brings this campaign one step closer to its
                  goal.
                </p>

                {contributionStatus !== "successful" &&
                  contributionStatus !== "failed" && (
                    <>
                      <label htmlFor="contribution-amount">
                        Contribution amount
                      </label>

                      <div className="contribution-amount-input">
                        <span>₹</span>
                        <input
                          id="contribution-amount"
                          type="number"
                          min="1"
                          step="0.01"
                          placeholder="Enter amount"
                          value={amount}
                          onChange={(event) => setAmount(event.target.value)}
                          disabled={
                            contributing || utrSubmitted || savingAmount
                          }
                          onBlur={() => {
                            if (contributionId !== null) {
                              void handleAmountUpdate();
                            }
                          }}
                        />
                      </div>

                      {savingAmount && (
                        <p className="payment-save-message">
                          Updating contribution amount...
                        </p>
                      )}

                      {amountSaveError && (
                        <p className="error-message" role="alert">
                          {amountSaveError}
                        </p>
                      )}

                      {contributionError && (
                        <p className="error-message" role="alert">
                          {contributionError}
                        </p>
                      )}
                    </>
                  )}

                {!contributionId &&
                  contributionStatus !== "successful" &&
                  contributionStatus !== "failed" && (
                    <button
                      className="contribute-button"
                      onClick={handleContribute}
                      disabled={contributing}
                    >
                      {contributing
                        ? "Creating contribution..."
                        : "Continue to Payment"}
                    </button>
                  )}

                {contributionStatus === "successful" && (
                  <div className="payment-success-card" role="status">
                    <strong>Thank you for your contribution!</strong>
                    <p>
                      Your previous contribution has been confirmed by the
                      campaign creator.
                    </p>
                    <button
                      type="button"
                      className="contribute-button"
                      onClick={resetContributionFlow}
                    >
                      Contribute Again
                    </button>
                  </div>
                )}

                {contributionStatus === "failed" && (
                  <div className="payment-rejected-card" role="status">
                    <strong>Contribution was not approved</strong>
                    <p>
                      Your previous contribution was rejected by the campaign
                      creator. You can start a new contribution.
                    </p>
                    <button
                      type="button"
                      className="contribute-button"
                      onClick={resetContributionFlow}
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>

              {showPaymentOptions && (
                <div className="upi-payment-card">
                  <div className="upi-payment-heading">
                    <span className="payment-section-label">
                      SECURE PAYMENT INSTRUCTIONS
                    </span>
                    <h3>Complete your contribution</h3>
                    <p>
                      Pay directly to the campaign creator using any UPI app.
                    </p>
                  </div>

                  <div className="payment-amount-summary">
                    <span>Your contribution</span>
                    <strong>
                      ₹
                      {Number(amount).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </strong>
                  </div>

                  {paymentDetails.qrImage && (
                    <div className="upi-qr-card">
                      <h4>Scan QR code to pay</h4>
                      <p>Open your UPI app and scan this code.</p>
                      <div className="upi-qr-image-wrapper">
                        <img
                          src={paymentDetails.qrImage}
                          alt="Creator's UPI QR code"
                          className="upi-qr-image"
                        />
                      </div>
                      <span className="upi-qr-caption">
                        Scan using Google Pay, PhonePe, Paytm or another UPI
                        app.
                      </span>
                    </div>
                  )}

                  {paymentDetails.upiId && (
                    <div className="upi-id-card">
                      <div>
                        <span className="upi-detail-label">
                          CREATOR'S UPI ID
                        </span>
                        <strong>{paymentDetails.upiId}</strong>
                      </div>

                      <button
                        type="button"
                        className="copy-upi-button"
                        onClick={handleCopyUpiId}
                      >
                        {copyMessage ? "Copied" : "Copy UPI ID"}
                      </button>
                    </div>
                  )}

                  {copyMessage && (
                    <p className="copy-upi-message" role="status">
                      {copyMessage}
                    </p>
                  )}

                  <div className="payment-instructions">
                    <h4>What to do next</h4>
                    <ol>
                      <li>Scan the QR code or copy the UPI ID.</li>
                      <li>Pay the exact contribution amount.</li>
                      <li>Find the UTR/reference number in your UPI app.</li>
                      <li>Enter it below to submit your payment.</li>
                    </ol>
                  </div>

                  <div className="utr-submission-card">
                    <label htmlFor="utr-reference">
                      UTR / Transaction reference number
                    </label>

                    <input
                      id="utr-reference"
                      type="text"
                      value={utrReference}
                      onChange={(event) => setUtrReference(event.target.value)}
                      placeholder="Enter your UTR/reference number"
                      maxLength={100}
                      disabled={submittingUtr}
                    />

                    <p>Submit this only after completing your UPI payment.</p>

                    {contributionError && (
                      <p className="error-message" role="alert">
                        {contributionError}
                      </p>
                    )}

                    <button
                      type="button"
                      className="contribute-button"
                      onClick={handleSubmitUtr}
                      disabled={
                        submittingUtr ||
                        savingAmount ||
                        !utrReference.trim()
                      }
                    >
                      {submittingUtr
                        ? "Submitting reference..."
                        : "Submit Payment Reference"}
                    </button>
                  </div>

                  <p className="payment-disclaimer">
                    Your contribution will remain pending until the campaign
                    creator verifies the transaction.
                  </p>
                </div>
              )}

              {utrSubmitted && paymentMessage && (
                <div className="payment-success-card" role="status">
                  <strong>Reference submitted successfully</strong>
                  <p>{paymentMessage}</p>
                  <span>Contribution status: Pending verification</span>
                </div>
              )}
            </div>
          )}

          {currentUser &&
            currentUser.role !== "admin" &&
            !isCampaignOwner &&
            !paymentDetails.upiId && (
              <p className="payment-unavailable-message">
                The creator has not configured their UPI payment details yet.
              </p>
            )}

          {isCampaignOwner && (
            <div className="campaign-owner-actions">
              <Link
                to={`/edit-campaign/${campaign.id}`}
                className="edit-campaign-button"
              >
                Edit Campaign
              </Link>

              <button
                className="delete-campaign-button"
                disabled={deletingCampaign}
                onClick={async () => {
                  const confirmed = window.confirm(
                    "Are you sure you want to delete this campaign? This action cannot be undone.",
                  );

                  if (!confirmed) return;

                  try {
                    setDeletingCampaign(true);
                    await onDelete(campaign.id);
                    navigate("/");
                  } catch (error) {
                    alert(
                      error instanceof Error
                        ? error.message
                        : "Failed to delete campaign.",
                    );
                  } finally {
                    setDeletingCampaign(false);
                  }
                }}
              >
                {deletingCampaign && <span className="loading-spinner" />}
                {deletingCampaign ? "Deleting..." : "Delete Campaign"}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default CampaignDetails;
