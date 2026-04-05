import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AnalyticsPage from "./pages/Analytics";

function App() {
  return (
    <Routes>
      <Route path="/"          element={<Dashboard />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
    </Routes>
  );
}

export default App;