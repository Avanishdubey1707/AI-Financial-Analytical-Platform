import {
    Plus,
    RefreshCw,
    Settings2,
} from "lucide-react";

const PortfolioHeader = ({
    activePortfolio,
    onRefresh,
    onAddPortfolio,
    onRenamePortfolio,
    loading,
}) => {
    return (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-slate-900">
                        {activePortfolio?.name || "Portfolio"}
                    </h1>

                    {activePortfolio && (
                        <button
                            onClick={onRenamePortfolio}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            title="Rename portfolio"
                        >
                            <Settings2 size={17} />
                        </button>
                    )}
                </div>

                <p className="mt-1 text-sm text-slate-500">
                    Track your investments, performance and portfolio growth.
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    onClick={onRefresh}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <RefreshCw
                        size={17}
                        className={loading ? "animate-spin" : ""}
                    />
                    Refresh
                </button>

                <button
                    onClick={onAddPortfolio}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                >
                    <Plus size={17} />
                    New Portfolio
                </button>
            </div>
        </div>
    );
};

export default PortfolioHeader;