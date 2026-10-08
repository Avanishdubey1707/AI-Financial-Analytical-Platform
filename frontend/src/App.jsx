import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

import DashboardPage from "./pages/dashboard/DashboardPage";
import PortfolioPage from "./pages/portfolio/PortfolioPage";
import TransactionsPage from "./pages/transaction/TransactionsPage";
import ExpenseForecastPage from "./pages/expenseForecast/ExpenseForecastPage";
import FraudAlertsPage from "./pages/fraudAlerts/FraudAlertsPage";
import RecommendationsPage from "./pages/recommendation/RecommendationsPage";
import ProfilePage from "./pages/profile/Profile";
import SettingsPage from "./pages/setting/Setting";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ==========================================
                    PUBLIC
                ========================================== */}

        <Route path="/login" element={<LoginPage />} />

        <Route path="/register" element={<RegisterPage />} />

        {/* ==========================================
                    PROTECTED
                ========================================== */}

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route
              path="/expense-forecasts"
              element={<ExpenseForecastPage />}
            />
            <Route path="/fraud-alerts" element={<FraudAlertsPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            // App.jsx / router
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/:id" element={<ReportDetailPage />} />
          </Route>
        </Route>

        {/* ==========================================
                    FALLBACK
                ========================================== */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
