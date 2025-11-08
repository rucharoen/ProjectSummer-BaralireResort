import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import ActivityService from "../../services/api/activity/activity.service";
import ActivityCard from "./ActivityCard";
import "./ActivityGrid.css";

const Activity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const res = await ActivityService.getAll();
        setActivities(res?.data || []);
      } catch (e) {
        console.error("Error fetching activities:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  return (
    <div className="container my-5">
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <div className="activity-grid">
          {activities.map((activity) => (
            <div key={activity.id} className="activity-item">
              <ActivityCard activity={activity} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Activity;
