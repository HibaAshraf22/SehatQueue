
import {
  Stethoscope,
  Users,
  BarChart3,
  Building2,
  Clock
} from "lucide-react";

const plannedFeatures = [
  {
    title: "Doctor Management & Registration",
    description:
      "Add new doctors and manage their profiles, specializations and availability.",
    icon: Stethoscope
  },
  {
    title: "Staff Management",
    description:
      "Manage hospital staff information and their assigned responsibilities.",
    icon: Users
  },
  {
    title: "Advanced Hospital Analytics",
    description:
      "View detailed reports and insights about appointments and hospital activity.",
    icon: BarChart3
  },
  {
    title: "Improved Hospital Resource Management",
    description:
      "Improve the management of hospital resources and operational information.",
    icon: Building2
  }
];

function FutureEnhancements() {
  return (
    <div className="future-page">
      <div className="future-heading">
        <span>SEHATQUEUE ADMIN</span>
        <h1>Future Enhancements</h1>
        <p>
          Explore planned improvements for future versions of SehatQueue.
        </p>
      </div>

      <div className="future-notice">
        <Clock size={20} />
        <div>
          <h3>Coming Soon</h3>
          <p>
            These features are planned for future updates and are not
            currently available.
          </p>
        </div>
      </div>

      <div className="future-grid">
        {plannedFeatures.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <div className="future-feature-card" key={index}>
              <div className="future-feature-icon">
                <Icon size={24} />
              </div>

              <span className="future-status">Coming Soon</span>

              <h3>{feature.title}</h3>

              <p>{feature.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FutureEnhancements;
