import { useEffect } from "react";
import { getStatus } from "../services/spoilageService";

const Dashboard = () => {

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getStatus();
        console.log("STATUS:", data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">Dashboard</h1>
    </div>
  );
};

export default Dashboard;