import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import {
    dismissRecommendation,
    generateRecommendations,
    getRecommendationById,
    getRecommendations,
} from "../../api/recommendationApi";

import RecommendationHeader from "../../components/recommendations/RecommendationHeader";
import RecommendationFilters from "../../components/recommendations/RecommendationFilters";
import RecommendationStats from "../../components/recommendations/RecommendationStats";
import RecommendationList from "../../components/recommendations/RecommendationList";
import RecommendationEmptyState from "../../components/recommendations/RecommendationEmptyState";
import RecommendationDetailsModal from "../../components/recommendations/RecommendationDetailsModal";
import GenerateRecommendationModal from "../../components/recommendations/GenerateRecommendationModal";

const RecommendationsPage = () => {
    const [recommendations, setRecommendations] = useState([]);

    const [riskProfile, setRiskProfile] = useState("moderate");

    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [dismissing, setDismissing] = useState(false);

    const [error, setError] = useState("");

    const [selectedRecommendation, setSelectedRecommendation] =
        useState(null);

    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [generateModalOpen, setGenerateModalOpen] = useState(false);

    const [hasHistory, setHasHistory] = useState(false);

    const loadRecommendations = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getRecommendations({
                page: 1,
                limit: 100,
            });

            /*
             * ApiResponse:
             * {
             *   statusCode,
             *   message,
             *   data: {
             *     recommendations,
             *     pagination
             *   }
             * }
             */

            const data = response?.data || {};

            const items = data.recommendations || [];

            setRecommendations(items);
            setHasHistory(items.length > 0);
        } catch (err) {
            console.error("Failed to load recommendations:", err);

            setError(
                err?.response?.data?.message ||
                "Unable to load recommendations."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRecommendations();
    }, [loadRecommendations]);

    const handleGenerate = async () => {
        try {
            setGenerating(true);
            setError("");

            const response = await generateRecommendations({
                riskProfile,
            });

            const generated =
                response?.data?.recommendations || [];

            /*
             * The backend can return 200 when:
             * - no fresh predictions
             * - no BUY/SELL/REDUCE suggestions
             */

            if (generated.length > 0) {
                setRecommendations((previous) => [
                    ...generated,
                    ...previous,
                ]);
            }

            setGenerateModalOpen(false);

            await loadRecommendations();
        } catch (err) {
            console.error(
                "Failed to generate recommendations:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Unable to generate recommendations."
            );
        } finally {
            setGenerating(false);
        }
    };

    const handleView = async (id) => {
        try {
            setDetailsLoading(true);
            setError("");

            const response = await getRecommendationById(id);

            const recommendation =
                response?.data?.recommendation;

            if (!recommendation) {
                throw new Error(
                    "Recommendation details were not returned."
                );
            }

            setSelectedRecommendation(recommendation);
            setDetailsModalOpen(true);
        } catch (err) {
            console.error(
                "Failed to fetch recommendation:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Unable to load recommendation details."
            );
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleDismiss = async (recommendation) => {
        const confirmed = window.confirm(
            `Dismiss the ${recommendation.stockSymbol} recommendation?`
        );

        if (!confirmed) return;

        try {
            setDismissing(true);
            setError("");

            await dismissRecommendation(recommendation._id);

            setRecommendations((previous) =>
                previous.filter(
                    (item) => item._id !== recommendation._id
                )
            );

            if (
                selectedRecommendation?._id === recommendation._id
            ) {
                setSelectedRecommendation(null);
                setDetailsModalOpen(false);
            }
        } catch (err) {
            console.error(
                "Failed to dismiss recommendation:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Unable to dismiss recommendation."
            );
        } finally {
            setDismissing(false);
        }
    };

    return (
        <div className="min-h-full bg-[#f7f8fa] p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
                <RecommendationHeader
                    onGenerate={() => setGenerateModalOpen(true)}
                    onRefresh={loadRecommendations}
                    loading={loading}
                    generating={generating}
                />

                {error && (
                    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                        <div>
                            <p className="text-sm font-semibold text-red-800">
                                Something went wrong
                            </p>

                            <p className="mt-1 text-sm text-red-700">
                                {error}
                            </p>
                        </div>
                    </div>
                )}

                <RecommendationFilters
                    riskProfile={riskProfile}
                    setRiskProfile={setRiskProfile}
                />

                {loading ? (
                    <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />

                            <p className="text-sm text-gray-500">
                                Loading AI recommendations...
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <RecommendationStats
                            recommendations={recommendations}
                        />

                        {recommendations.length > 0 ? (
                            <RecommendationList
                                recommendations={recommendations}
                                onView={handleView}
                                onDismiss={handleDismiss}
                            />
                        ) : (
                            <RecommendationEmptyState
                                onGenerate={() => setGenerateModalOpen(true)}
                                generating={generating}
                                hasHistory={hasHistory}
                            />
                        )}
                    </>
                )}

                <GenerateRecommendationModal
                    open={generateModalOpen}
                    riskProfile={riskProfile}
                    setRiskProfile={setRiskProfile}
                    onClose={() => {
                        if (!generating) {
                            setGenerateModalOpen(false);
                        }
                    }}
                    onGenerate={handleGenerate}
                    generating={generating}
                />

                <RecommendationDetailsModal
                    recommendation={selectedRecommendation}
                    open={detailsModalOpen}
                    onClose={() => setDetailsModalOpen(false)}
                />

                {detailsLoading && (
                    <div className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading details...
                    </div>
                )}

                {dismissing && (
                    <div className="fixed bottom-5 right-5 z-[60] rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
                        Dismissing recommendation...
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecommendationsPage;