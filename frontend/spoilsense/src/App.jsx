import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AnalyticsPage from "./pages/Analytics";
import SettingsPage from "./pages/Settings";

function App() {
  return (
    <Routes>
      <Route path="/"          element={<Dashboard />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/settings"  element={<SettingsPage />} />
    </Routes>
  );
}

export default App;