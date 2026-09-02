import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import { SessionProvider, useSession } from "./lib/session";
import { Shell } from "./components/shell";
import { Loading } from "./components/ui";
import { LoginPage } from "./pages/login";
import { OverviewPage } from "./pages/overview";
import { AppsPage } from "./pages/apps";
import { AppDetailPage } from "./pages/app-detail";

import { UsersPage } from "./pages/users";
import { UserDetailPage } from "./pages/user-detail";
import { PaymentsPage } from "./pages/payments";
import { OnboardingPage } from "./pages/onboarding";
import { NotificationsPage } from "./pages/notifications";
import { SupportPage, TicketPage } from "./pages/support";
import { KeysPage } from "./pages/keys";
import { DatabasesPage } from "./pages/databases";
import { AnalyticsPage } from "./pages/analytics";
import { StaffPage } from "./pages/staff";
import { AuditPage } from "./pages/audit";

/**
 * Everything behind one sign-in.
 *
 * The route table is flat on purpose: a screen that a role can't reach isn't a
 * separate branch of the app, it's a permission the server refuses. The sidebar
 * hides what you can't use; the API is what actually stops you.
 */
function Routed() {
  const { staff, loading } = useSession();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading label="Opening Zina" />
      </div>
    );
  }

  if (!staff) return <LoginPage />;

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/apps" element={<AppsPage />} />
        <Route path="/apps/:id" element={<AppDetailPage />} />
        
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/:id" element={<UserDetailPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/support/:id" element={<TicketPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/keys" element={<KeysPage />} />
        <Route path="/databases" element={<DatabasesPage />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/audit" element={<AuditPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Routed />
      </SessionProvider>
    </BrowserRouter>
  );
}
