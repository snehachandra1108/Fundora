
import { useEffect, useRef, useState } from "react";

interface PaymentSettingsData {
  upi_id: string;
  upi_qr_image: string | null;
}

function PaymentSettings() {
  const [upiId, setUpiId] = useState("");
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const qrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchPaymentSettings() {
      try {
        const response = await fetch(
          "http://localhost:5000/api/payment-settings",
          {
            credentials: "include",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load payment settings.");
        }

        const settings: PaymentSettingsData = data.paymentSettings;

        setUpiId(settings.upi_id ?? "");
        setQrImage(settings.upi_qr_image ?? null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load payment settings.",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchPaymentSettings();
  }, []);

  async function handleQrUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setMessage("");

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a PNG, JPEG or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("The QR image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setQrImage(reader.result);
      }
    };

    reader.onerror = () => {
      setError("Could not read the selected image.");
      event.target.value = "";
    };

    reader.readAsDataURL(file);
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/payment-settings",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            upi_id: upiId,
            upi_qr_image: qrImage,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save payment settings.");
      }

      setMessage("Your payment details have been saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save payment settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleRemoveQr() {
    setQrImage(null);

    if (qrInputRef.current) {
      qrInputRef.current.value = "";
    }

    setMessage("");
    setError("");
  }

  if (loading) {
    return (
      <div className="payment-settings-page">Loading payment settings...</div>
    );
  }

  return (
    <main className="payment-settings-page">
      <section className="payment-settings-container">
        <h1>Payment Settings</h1>

        <p>
          Add your UPI details so supporters can pay you directly when
          contributing to your campaigns.
        </p>

        <form onSubmit={handleSave}>
          <div className="payment-settings-field">
            <label htmlFor="upi-id">UPI ID</label>

            <input
              id="upi-id"
              type="text"
              value={upiId}
              onChange={(event) => setUpiId(event.target.value)}
              placeholder="example@upi"
              required
            />
          </div>

          <div className="payment-settings-field">
            <label htmlFor="upi-qr">UPI QR Code</label>

            <p>
              Upload your UPI QR code. PNG, JPEG and WebP images up to 5 MB are
              supported.
            </p>

            <input
              ref={qrInputRef}
              id="upi-qr"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleQrUpload}
            />

            {qrImage && (
              <div className="payment-qr-preview">
                <img src={qrImage} alt="Your UPI QR code" />

                <button type="button" onClick={handleRemoveQr}>
                  Remove QR code
                </button>
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="payment-error">
              {error}
            </p>
          )}

          {message && (
            <p role="status" className="payment-success">
              {message}
            </p>
          )}

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Payment Details"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default PaymentSettings;
