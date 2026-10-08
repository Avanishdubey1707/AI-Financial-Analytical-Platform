import FraudAlertCard from "./FraudAlertCard";

const FraudAlertList = ({
    alerts,
    onView,
}) => {
    if (!alerts.length) {
        return null;
    }

    return (
        <div className="space-y-4">
            {alerts.map((alert) => (
                <FraudAlertCard
                    key={alert._id}
                    alert={alert}
                    onView={onView}
                />
            ))}
        </div>
    );
};

export default FraudAlertList;