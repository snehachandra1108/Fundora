
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";
import API_URL from "../config/api";
import type { Campaign } from "../types/campaign";

function CreateCampaign({
  onCreate,
  onUpdate,
}: {
  campaigns: Campaign[];
  onCreate: (
    campaign: Omit<
      Campaign,
      "id" | "amountRaised" | "creatorName" | "creatorId"
    >,
  ) => Promise<void>;
  onUpdate: (campaign: Campaign) => Promise<void>;
}) {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { id } = useParams();

  const [existingCampaign, setExistingCampaign] =
    useState<Campaign | null>(null);

  const [isLoadingCampaign, setIsLoadingCampaign] = useState(Boolean(id));
  const [campaignLoadError, setCampaignLoadError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    goal: "",
    deadline: "",
    image: "",
  });

  // Fetch the latest campaign details from the backend when editing.
  useEffect(() => {
    if (!id) {
      setIsLoadingCampaign(false);
      return;
    }

    let isActive = true;

    async function fetchCampaign() {
      try {
        setIsLoadingCampaign(true);
        setCampaignLoadError("");

        const response = await fetch(`${API_URL}/api/campaigns/my`, {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch campaign details.",
          );
        }

        const campaigns: Campaign[] = (
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

        const campaign = campaigns.find(
          (item) => item.id === Number(id),
        );

        if (!campaign) {
          throw new Error(
            "Campaign not found or you do not have permission to edit it.",
          );
        }

        if (isActive) {
          setExistingCampaign(campaign);

          setFormData({
            title: campaign.title,
            description: campaign.description,
            category: campaign.category,
            goal: campaign.goal.toString(),
            deadline: campaign.deadline.split("T")[0],
            image: campaign.image ?? "",
          });
        }
      } catch (error) {
        if (isActive) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load campaign details.";

          setCampaignLoadError(message);
          console.error("Error loading campaign:", error);
        }
      } finally {
        if (isActive) {
          setIsLoadingCampaign(false);
        }
      }
    }

    fetchCampaign();

    return () => {
      isActive = false;
    };
  }, [id]);

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { id, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [id]: value,
    }));
  }

  function isDeadlineValid(deadline: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(`${deadline}T00:00:00`);

    return selectedDate > today;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (id && !existingCampaign) {
      showNotification(
        "Campaign details have not loaded. Please try again.",
        "error",
      );
      return;
    }

    if (!isDeadlineValid(formData.deadline)) {
      showNotification(
        "Campaign deadline must be a future date.",
        "warning",
      );
      return;
    }

    try {
      setIsSubmitting(true);

      if (existingCampaign) {
        const updatedCampaign: Campaign = {
          ...existingCampaign,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          goal: Number(formData.goal),
          deadline: formData.deadline,
          image: formData.image,
        };

        await onUpdate(updatedCampaign);

        showNotification("Campaign updated successfully!", "success");
      } else {
        await onCreate({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          goal: Number(formData.goal),
          deadline: formData.deadline,
          image: formData.image,
        });

        showNotification("Campaign created successfully!", "success");
      }

      navigate("/");
    } catch (error) {
      showNotification(
        error instanceof Error
          ? error.message
          : existingCampaign
            ? "Failed to update campaign."
            : "Failed to create campaign.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingCampaign) {
    return (
      <section className="auth-section">
        <div className="auth-container">
          <p>Loading campaign details...</p>
        </div>
      </section>
    );
  }

  if (id && (!existingCampaign || campaignLoadError)) {
    return (
      <section className="auth-section">
        <div className="auth-container">
          <h1>Unable to Load Campaign</h1>
          <p>
            {campaignLoadError || "Campaign details could not be found."}
          </p>
          <button
            type="button"
            className="auth-button"
            onClick={() => navigate("/")}
          >
            Go Back
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-section">
      <div className="auth-container">
        <h1>{id ? "Edit Campaign" : "Create a Campaign"}</h1>

        <p>
          {id
            ? "Update your campaign details."
            : "Share your cause and start raising funds."}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Campaign Title</label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter campaign title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Campaign Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell people about your campaign"
              rows={5}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="" disabled>
                Select a category
              </option>
              <option value="Education">Education</option>
              <option value="Medical">Medical</option>
              <option value="Environment">Environment</option>
              <option value="Technology">Technology</option>
              <option value="Community">Community</option>
              <option value="Arts & Culture">Arts & Culture</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="goal">Fundraising Goal (₹)</label>
            <input
              type="number"
              id="goal"
              value={formData.goal}
              onChange={handleChange}
              placeholder="Enter fundraising goal"
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="deadline">Campaign Deadline</label>
            <input
              type="date"
              id="deadline"
              value={formData.deadline}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">Campaign Image URL</label>
            <input
              type="url"
              id="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="Enter image URL"
              required
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isSubmitting}
          >
            {isSubmitting && <span className="loading-spinner"></span>}
            {isSubmitting
              ? existingCampaign
                ? "Updating Campaign..."
                : "Creating Campaign..."
              : existingCampaign
                ? "Update Campaign"
                : "Create Campaign"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default CreateCampaign;
