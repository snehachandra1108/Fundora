
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type NotificationType = "success" | "error" | "warning";

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  showNotification: (
    message: string,
    type?: NotificationType,
  ) => void;
}

const NotificationContext =
  createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback(
    (message: string, type: NotificationType = "success") => {
      const id = Date.now() + Math.random();

      setNotifications((previous) => [
        ...previous,
        { id, message, type },
      ]);

      window.setTimeout(() => {
        setNotifications((previous) =>
          previous.filter((notification) => notification.id !== id),
        );
      }, 3500);
    },
    [],
  );

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}

      <div className="notification-container" aria-live="polite">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`app-notification ${notification.type}`}
            role={notification.type === "error" ? "alert" : "status"}
          >
            <span className="notification-icon">
              {notification.type === "success"
                ? "✓"
                : notification.type === "error"
                  ? "✕"
                  : "!"}
            </span>

            <p>{notification.message}</p>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotification must be used inside NotificationProvider.",
    );
  }

  return context;
}
