import API_URL from "./config/api";
import ProtectedRoute from "./components/ProtectedRoute";
import type { User } from "./types/user";
import { useCallback, useEffect, useState } from "react";
import type { Campaign } from "./types/campaign";
import { campaigns as initialCampaigns } from "./data/campaigns";
import AdminDashboard from "./components/AdminDashboard";
import Dashboard from "./components/Dashboard";
import CreateCampaign from "./components/CreateCampaign";
import PaymentSettings from "./components/PaymentSettings";
import Login from "./components/Login";
import Signup from "./components/Signup";
import { Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Campaigns from "./components/Campaigns";
import Categories from "./components/Categories";
import HowItWorks from "./components/HowItWorks";
import CallToAction from "./components/CallToAction";
import Footer from "./components/Footer";
import CampaignDetails from "./components/CampaignDetails";

import "./App.css";

const normalUserRoles: User["role"][] = ["user", "supporter", "creator"];

// Scroll to the top whenever the route changes.
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname]);

  return null;
}

function HomePage({
  campaigns,
  currentUser,
}: {
  campaigns: Campaign[];
  currentUser: User | null;
}) {
  return (
    <>
      <Hero currentUser={currentUser} />
      <Campaigns campaigns={campaigns} />
      <Categories />
      <HowItWorks />
      <CallToAction />
    </>
  );
}
function App() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const savedCampaigns = localStorage.getItem("fundora_campaigns");

    if (savedCampaigns) {
      return JSON.parse(savedCampaigns) as Campaign[];
    }

    return initialCampaigns;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [publicCampaigns, setPublicCampaigns] = useState<Campaign[]>([]);

  // Restore the user's session.
  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("${API_URL}/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          setCurrentUser(null);
          return;
        }

        const data = await response.json();
        setCurrentUser(data.user);
      } catch (error) {
        console.error("Session verification failed:", error);
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    checkSession();
  }, []);

  // Fetch approved public campaigns.
  const fetchPublicCampaigns = useCallback(async () => {
    try {
      const response = await fetch("${API_URL}/api/campaigns");

      if (!response.ok) {
        throw new Error("Failed to fetch campaigns.");
      }

      const data = await response.json();

      const formattedCampaigns: Campaign[] = (
        Array.isArray(data.campaigns) ? data.campaigns : []
      ).map((campaign: any) => ({
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        category: campaign.category,
        goal: Number(campaign.goal),
        amountRaised: Number(campaign.amount_raised),
        deadline: campaign.deadline,
        image: campaign.image ?? "",
        creatorName: "Fundora Creator",
        creatorId: Number(campaign.creator_id),
        status: campaign.status,
      }));

      setPublicCampaigns(formattedCampaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  }, []);

  // Automatically refresh public campaigns every 5 seconds.
  useEffect(() => {
    fetchPublicCampaigns();

    const refreshInterval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchPublicCampaigns();
      }
    }, 5000);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        fetchPublicCampaigns();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(refreshInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchPublicCampaigns]);

  // Keep local campaign storage updated.
  useEffect(() => {
    localStorage.setItem("fundora_campaigns", JSON.stringify(campaigns));
  }, [campaigns]);

  function handleSignup(user: User) {
    setCurrentUser(user);
  }

  async function handleCreateCampaign(
    newCampaign: Omit<
      Campaign,
      "id" | "amountRaised" | "creatorName" | "creatorId"
    >,
  ) {
    try {
      const response = await fetch("${API_URL}/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newCampaign),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create campaign.");
      }

      const backendCampaign = data.campaign;

      const campaign: Campaign = {
        id: backendCampaign.id,
        title: backendCampaign.title,
        description: backendCampaign.description,
        category: backendCampaign.category,
        goal: Number(backendCampaign.goal),
        amountRaised: Number(backendCampaign.amount_raised),
        deadline: backendCampaign.deadline,
        image: backendCampaign.image ?? "",
        creatorName: currentUser?.name ?? "You",
        creatorId: Number(backendCampaign.creator_id),
        status: backendCampaign.status,
      };

      setCampaigns((previousCampaigns) => [...previousCampaigns, campaign]);

      await fetchPublicCampaigns();
    } catch (error) {
      console.error("Error creating campaign:", error);
      throw error;
    }
  }

  async function handleUpdateCampaign(updatedCampaign: Campaign) {
    try {
      const response = await fetch(
        `${API_URL}/api/campaigns/${updatedCampaign.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            title: updatedCampaign.title,
            description: updatedCampaign.description,
            category: updatedCampaign.category,
            goal: updatedCampaign.goal,
            deadline: updatedCampaign.deadline,
            image: updatedCampaign.image,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update campaign.");
      }

      setCampaigns((previousCampaigns) =>
        previousCampaigns.map((campaign) =>
          campaign.id === updatedCampaign.id
            ? {
                ...updatedCampaign,
                creatorId: campaign.creatorId,
                creatorName: campaign.creatorName,
              }
            : campaign,
        ),
      );

      await fetchPublicCampaigns();
    } catch (error) {
      console.error("Campaign update error:", error);
      throw error;
    }
  }

  async function handleDeleteCampaign(campaignId: number) {
    const response = await fetch(
      `${API_URL}/api/campaigns/${campaignId}`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete campaign.");
    }

    setCampaigns((previousCampaigns) =>
      previousCampaigns.filter((campaign) => campaign.id !== campaignId),
    );

    await fetchPublicCampaigns();
  }

  async function handleLogout() {
    try {
      const response = await fetch("${API_URL}/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout failed.");
      }

      setCurrentUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  return (
    <>
      <ScrollToTop />

      <Navbar currentUser={currentUser} onLogout={handleLogout} />

      <Routes>
        <Route
          path="/"
          element={
            <HomePage campaigns={publicCampaigns} currentUser={currentUser} />
          }
        />

        <Route
          path="/campaign/:id"
          element={
            <CampaignDetails
              currentUser={currentUser}
              onDelete={handleDeleteCampaign}
            />
          }
        />

        <Route path="/signup" element={<Signup onSignup={handleSignup} />} />

        <Route path="/login" element={<Login onLogin={handleSignup} />} />

        <Route
          path="/create-campaign"
          element={
            <ProtectedRoute
              currentUser={currentUser}
              authLoading={authLoading}
              allowedRoles={normalUserRoles}
            >
              <CreateCampaign
                campaigns={campaigns}
                onCreate={handleCreateCampaign}
                onUpdate={handleUpdateCampaign}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-campaign/:id"
          element={
            <ProtectedRoute
              currentUser={currentUser}
              authLoading={authLoading}
              allowedRoles={normalUserRoles}
            >
              <CreateCampaign
                campaigns={campaigns}
                onCreate={handleCreateCampaign}
                onUpdate={handleUpdateCampaign}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              currentUser={currentUser}
              authLoading={authLoading}
              allowedRoles={normalUserRoles}
            >
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment-settings"
          element={
            <ProtectedRoute
              currentUser={currentUser}
              authLoading={authLoading}
              allowedRoles={normalUserRoles}
            >
              <PaymentSettings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute
              currentUser={currentUser}
              authLoading={authLoading}
              allowedRoles={["admin"]}
            >
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>

      <Footer />
    </>
  );
}

export default App;
