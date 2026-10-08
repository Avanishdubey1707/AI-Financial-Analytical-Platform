import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/dashboard/DashboardPage";

import AppLayout from "./components/layout/AppLayout";

const PlaceholderPage = ({ title }) => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <p className="text-sm text-gray-400">
          FinSight
        </p>

        <h1 className="mt-2 text-2xl font-bold">
          {title}
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          This module is coming next.
        </p>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========================= */}
        {/* AUTH */}
        {/* ========================= */}

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />

        {/* ========================= */}
        {/* APPLICATION */}
        {/* ========================= */}

        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={<DashboardPage />}
          />

          <Route
            path="/portfolio"
            element={
              <PlaceholderPage title="Portfolio" />
            }
          />

          <Route
            path="/transactions"
            element={
              <PlaceholderPage title="Transactions" />
            }
          />

          <Route
            path="/market"
            element={
              <PlaceholderPage title="Market Intelligence" />
            }
          />

          <Route
            path="/predictions"
            element={
              <PlaceholderPage title="AI Predictions" />
            }
          />

          <Route
            path="/recommendations"
            element={
              <PlaceholderPage title="AI Recommendations" />
            }
          />

          <Route
            path="/fraud-alerts"
            element={
              <PlaceholderPage title="Fraud Alerts" />
            }
          />

          <Route
            path="/reports"
            element={
              <PlaceholderPage title="Reports" />
            }
          />

          <Route
            path="/settings"
            element={
              <PlaceholderPage title="Settings" />
            }
          />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;