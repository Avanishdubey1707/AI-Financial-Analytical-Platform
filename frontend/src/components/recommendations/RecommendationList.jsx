import RecommendationCard from "./RecommendationCard";

const RecommendationList = ({
    recommendations = [],
    onView,
    onDismiss,
}) => {
    return (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {recommendations.map((recommendation) => (
                <RecommendationCard
                    key={recommendation._id}
                    recommendation={recommendation}
                    onView={onView}
                    onDismiss={onDismiss}
                />
            ))}
        </div>
    );
};

export default RecommendationList;