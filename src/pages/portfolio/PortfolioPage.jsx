import { useCallback, useEffect, useState } from "react";

import {
  addHolding,
  createPortfolio,
  deleteHolding,
  deletePortfolio,
  getPortfolioHoldings,
  getPortfolioPerformance,
  getPortfolioValue,
  getPortfolios,
  updateHolding,
  updatePortfolio,
} from "../../api/portfolioApi";

import PortfolioHeader from "../../components/portfolio/PortfolioHeader";
import PortfolioSelector from "../../components/portfolio/PortfolioSelector";
import PortfolioStats from "../../components/portfolio/PortfolioStats";
import PortfolioPerformance from "../../components/portfolio/PortfolioPerformance";
import PortfolioAIAnalysis from "../../components/portfolio/PortfolioAIAnalysis";
import HoldingsTable from "../../components/portfolio/HoldingsTable";
import PortfolioModal from "../../components/portfolio/PortfolioModal";
import HoldingModal from "../../components/portfolio/HoldingModal";
import DeleteConfirmModal from "../../components/portfolio/DeleteConfirmModal";

const PortfolioPage = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [activePortfolioId, setActivePortfolioId] =
    useState(null);

  const [portfolioValue, setPortfolioValue] =
    useState(null);

  const [holdings, setHoldings] = useState([]);
  const [performance, setPerformance] = useState([]);

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] =
    useState(false);

  const [error, setError] = useState("");

  // Portfolio modal
  const [portfolioModal, setPortfolioModal] =
    useState({
      open: false,
      mode: "create",
      portfolio: null,
    });

  // Holding modal
  const [holdingModal, setHoldingModal] =
    useState({
      open: false,
      mode: "create",
      holding: null,
    });

  // Delete modal
  const [deleteModal, setDeleteModal] =
    useState({
      open: false,
      type: null,
      item: null,
    });

  const [actionLoading, setActionLoading] =
    useState(false);

  const activePortfolio = portfolios.find(
    (portfolio) =>
      portfolio._id === activePortfolioId
  );

  // --------------------------------------------------
  // Load portfolios
  // --------------------------------------------------

  const loadPortfolios = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getPortfolios();

      const nextPortfolios =
        response?.data?.portfolios ||
        response?.portfolios ||
        [];

      setPortfolios(nextPortfolios);

      if (nextPortfolios.length === 0) {
        setActivePortfolioId(null);
        return;
      }

      setActivePortfolioId((currentId) => {
        const exists = nextPortfolios.some(
          (portfolio) => portfolio._id === currentId
        );

        return exists
          ? currentId
          : nextPortfolios[0]._id;
      });
    } catch (err) {
      console.error(
        "Failed to load portfolios:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to load portfolios."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // --------------------------------------------------
  // Load active portfolio details
  // --------------------------------------------------

  const loadPortfolioDetails = useCallback(
    async (portfolioId) => {
      if (!portfolioId) {
        setPortfolioValue(null);
        setHoldings([]);
        setPerformance([]);
        return;
      }

      try {
        setDetailsLoading(true);
        setError("");

        const [
          valueResponse,
          holdingsResponse,
          performanceResponse,
        ] = await Promise.all([
          getPortfolioValue(portfolioId),
          getPortfolioHoldings(portfolioId),
          getPortfolioPerformance(portfolioId),
        ]);

        const valueData =
          valueResponse?.data ||
          valueResponse ||
          {};

        const holdingsData =
          holdingsResponse?.data ||
          holdingsResponse ||
          {};

        const performanceData =
          performanceResponse?.data ||
          performanceResponse ||
          {};

        setPortfolioValue(valueData);

        setHoldings(
          valueData?.holdingsWithValue ||
            holdingsData?.holdings ||
            []
        );

        setPerformance(
          performanceData?.performance ||
            performanceData?.data ||
            performanceData ||
            []
        );
      } catch (err) {
        console.error(
          "Failed to load portfolio details:",
          err
        );

        setError(
          err?.response?.data?.message ||
            "Failed to load portfolio details."
        );
      } finally {
        setDetailsLoading(false);
      }
    },
    []
  );

  // --------------------------------------------------
  // Initial load
  // --------------------------------------------------

  useEffect(() => {
    loadPortfolios();
  }, [loadPortfolios]);

  // --------------------------------------------------
  // Load selected portfolio
  // --------------------------------------------------

  useEffect(() => {
    loadPortfolioDetails(activePortfolioId);
  }, [
    activePortfolioId,
    loadPortfolioDetails,
  ]);

  // --------------------------------------------------
  // Refresh
  // --------------------------------------------------

  const handleRefresh = async () => {
    await loadPortfolios();

    if (activePortfolioId) {
      await loadPortfolioDetails(
        activePortfolioId
      );
    }
  };

  // --------------------------------------------------
  // Create portfolio
  // --------------------------------------------------

  const handleCreatePortfolio = async (data) => {
    try {
      setActionLoading(true);

      const response = await createPortfolio(data);

      const createdPortfolio =
        response?.data?.portfolio ||
        response?.portfolio;

      await loadPortfolios();

      if (createdPortfolio?._id) {
        setActivePortfolioId(
          createdPortfolio._id
        );
      }

      setPortfolioModal({
        open: false,
        mode: "create",
        portfolio: null,
      });
    } catch (err) {
      console.error(
        "Failed to create portfolio:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to create portfolio."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------
  // Rename portfolio
  // --------------------------------------------------

  const handleUpdatePortfolio = async (data) => {
    if (!activePortfolio) {
      return;
    }

    try {
      setActionLoading(true);

      await updatePortfolio(
        activePortfolio._id,
        data
      );

      await loadPortfolios();

      setPortfolioModal({
        open: false,
        mode: "create",
        portfolio: null,
      });
    } catch (err) {
      console.error(
        "Failed to update portfolio:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to update portfolio."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------
  // Delete portfolio
  // --------------------------------------------------

  const handleDeletePortfolio = async () => {
    if (!deleteModal.item?._id) {
      return;
    }

    try {
      setActionLoading(true);

      await deletePortfolio(
        deleteModal.item._id
      );

      setDeleteModal({
        open: false,
        type: null,
        item: null,
      });

      await loadPortfolios();
    } catch (err) {
      console.error(
        "Failed to delete portfolio:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to delete portfolio."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------
  // Add holding
  // --------------------------------------------------

  const handleAddHolding = async (data) => {
    if (!activePortfolioId) {
      return;
    }

    try {
      setActionLoading(true);

      await addHolding(
        activePortfolioId,
        data
      );

      setHoldingModal({
        open: false,
        mode: "create",
        holding: null,
      });

      await loadPortfolioDetails(
        activePortfolioId
      );
    } catch (err) {
      console.error(
        "Failed to add holding:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to add holding."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------
  // Edit holding
  // --------------------------------------------------

  const handleUpdateHolding = async (data) => {
    if (
      !activePortfolioId ||
      !holdingModal.holding?._id
    ) {
      return;
    }

    try {
      setActionLoading(true);

      await updateHolding(
        activePortfolioId,
        holdingModal.holding._id,
        data
      );

      setHoldingModal({
        open: false,
        mode: "create",
        holding: null,
      });

      await loadPortfolioDetails(
        activePortfolioId
      );
    } catch (err) {
      console.error(
        "Failed to update holding:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to update holding."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------
  // Delete holding
  // --------------------------------------------------

  const handleDeleteHolding = async () => {
    if (
      !activePortfolioId ||
      !deleteModal.item?._id
    ) {
      return;
    }

    try {
      setActionLoading(true);

      await deleteHolding(
        activePortfolioId,
        deleteModal.item._id
      );

      setDeleteModal({
        open: false,
        type: null,
        item: null,
      });

      await loadPortfolioDetails(
        activePortfolioId
      );
    } catch (err) {
      console.error(
        "Failed to delete holding:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to delete holding."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------
  // Empty portfolio state
  // --------------------------------------------------

  if (!loading && portfolios.length === 0) {
    return (
      <>
        <div className="space-y-6">
          <PortfolioHeader
            activePortfolio={null}
            onRefresh={handleRefresh}
            onAddPortfolio={() =>
              setPortfolioModal({
                open: true,
                mode: "create",
                portfolio: null,
              })
            }
            loading={loading}
          />

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex min-h-[500px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
            <div className="max-w-md px-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <span className="text-2xl">
                  📊
                </span>
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-900">
                Create your first portfolio
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Start tracking your investments,
                portfolio performance and AI-powered
                financial insights.
              </p>

              <button
                onClick={() =>
                  setPortfolioModal({
                    open: true,
                    mode: "create",
                    portfolio: null,
                  })
                }
                className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Create Portfolio
              </button>
            </div>
          </div>
        </div>

        <PortfolioModal
          open={portfolioModal.open}
          mode={portfolioModal.mode}
          portfolio={portfolioModal.portfolio}
          onClose={() =>
            setPortfolioModal({
              open: false,
              mode: "create",
              portfolio: null,
            })
          }
          onSubmit={handleCreatePortfolio}
          loading={actionLoading}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <PortfolioHeader
          activePortfolio={activePortfolio}
          onRefresh={handleRefresh}
          onAddPortfolio={() =>
            setPortfolioModal({
              open: true,
              mode: "create",
              portfolio: null,
            })
          }
          onRenamePortfolio={() =>
            setPortfolioModal({
              open: true,
              mode: "edit",
              portfolio: activePortfolio,
            })
          }
          loading={loading || detailsLoading}
        />

        {/* Error */}
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              onClick={() => setError("")}
              className="font-medium hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Portfolio selector */}
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <PortfolioSelector
            portfolios={portfolios}
            activePortfolio={activePortfolio}
            onSelect={setActivePortfolioId}
          />
        </div>

        {/* Loading */}
        {detailsLoading && !portfolioValue ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-32 animate-pulse rounded-2xl bg-slate-200"
                />
              ))}
            </div>

            <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />

            <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <PortfolioStats
              portfolioValue={portfolioValue}
            />

            {/* Performance + AI */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <PortfolioPerformance
                  performance={performance}
                />
              </div>

              <PortfolioAIAnalysis
                portfolioValue={portfolioValue}
              />
            </div>

            {/* Holdings */}
            <HoldingsTable
              holdings={holdings}
              onAddHolding={() =>
                setHoldingModal({
                  open: true,
                  mode: "create",
                  holding: null,
                })
              }
              onEditHolding={(holding) =>
                setHoldingModal({
                  open: true,
                  mode: "edit",
                  holding,
                })
              }
              onDeleteHolding={(holding) =>
                setDeleteModal({
                  open: true,
                  type: "holding",
                  item: holding,
                })
              }
            />

            {/* Delete portfolio */}
            <div className="flex justify-end">
              <button
                onClick={() =>
                  setDeleteModal({
                    open: true,
                    type: "portfolio",
                    item: activePortfolio,
                  })
                }
                className="text-xs font-medium text-red-500 hover:text-red-600 hover:underline"
              >
                Delete this portfolio
              </button>
            </div>
          </>
        )}
      </div>

      {/* Portfolio modal */}
      <PortfolioModal
        open={portfolioModal.open}
        mode={portfolioModal.mode}
        portfolio={portfolioModal.portfolio}
        onClose={() =>
          setPortfolioModal({
            open: false,
            mode: "create",
            portfolio: null,
          })
        }
        onSubmit={
          portfolioModal.mode === "edit"
            ? handleUpdatePortfolio
            : handleCreatePortfolio
        }
        loading={actionLoading}
      />

      {/* Holding modal */}
      <HoldingModal
        open={holdingModal.open}
        mode={holdingModal.mode}
        holding={holdingModal.holding}
        onClose={() =>
          setHoldingModal({
            open: false,
            mode: "create",
            holding: null,
          })
        }
        onSubmit={
          holdingModal.mode === "edit"
            ? handleUpdateHolding
            : handleAddHolding
        }
        loading={actionLoading}
      />

      {/* Delete modal */}
      <DeleteConfirmModal
        open={deleteModal.open}
        title={
          deleteModal.type === "portfolio"
            ? "Delete Portfolio"
            : "Delete Holding"
        }
        message={
          deleteModal.type === "portfolio"
            ? `Are you sure you want to delete "${deleteModal.item?.name}"? All holdings inside this portfolio will also be deleted.`
            : `Are you sure you want to delete "${deleteModal.item?.stockSymbol}" from this portfolio?`
        }
        onClose={() =>
          setDeleteModal({
            open: false,
            type: null,
            item: null,
          })
        }
        onConfirm={
          deleteModal.type === "portfolio"
            ? handleDeletePortfolio
            : handleDeleteHolding
        }
        loading={actionLoading}
      />
    </>
  );
};

export default PortfolioPage;