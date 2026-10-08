import { useEffect, useState } from "react";
import { X } from "lucide-react";

const HoldingModal = ({
    open,
    mode = "create",
    holding,
    onClose,
    onSubmit,
    loading,
}) => {
    const [stockSymbol, setStockSymbol] = useState("");
    const [quantity, setQuantity] = useState("");
    const [avgPrice, setAvgPrice] = useState("");

    useEffect(() => {
        if (open) {
            setStockSymbol(holding?.stockSymbol || "");
            setQuantity(
                holding?.quantity !== undefined
                    ? String(holding.quantity)
                    : ""
            );
            setAvgPrice(
                holding?.avgPrice !== undefined
                    ? String(holding.avgPrice)
                    : ""
            );
        }
    }, [open, holding]);

    if (!open) {
        return null;
    }

    const isEdit = mode === "edit";

    const handleSubmit = async (e) => {
        e.preventDefault();

        const parsedQuantity = Number(quantity);
        const parsedAvgPrice = Number(avgPrice);

        if (
            !parsedQuantity ||
            parsedQuantity <= 0 ||
            !parsedAvgPrice ||
            parsedAvgPrice <= 0
        ) {
            return;
        }

        if (!isEdit && !stockSymbol.trim()) {
            return;
        }

        const payload = {
            quantity: parsedQuantity,
            avgPrice: parsedAvgPrice,
        };

        if (!isEdit) {
            payload.stockSymbol = stockSymbol
                .trim()
                .toUpperCase();
        }

        await onSubmit(payload);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                        <h2 className="font-semibold text-slate-900">
                            {isEdit ? "Edit Holding" : "Add Holding"}
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            {isEdit
                                ? "Update your holding details."
                                : "Add a stock to your portfolio."}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 p-5">
                        {!isEdit && (
                            <div>
                                <label className="text-sm font-medium text-slate-700">
                                    Stock Symbol
                                </label>

                                <input
                                    autoFocus
                                    type="text"
                                    value={stockSymbol}
                                    onChange={(e) =>
                                        setStockSymbol(e.target.value)
                                    }
                                    placeholder="e.g. RELIANCE"
                                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm uppercase text-slate-900 outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                />
                            </div>
                        )}

                        {isEdit && (
                            <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <p className="text-xs text-slate-400">
                                    Stock
                                </p>

                                <p className="mt-1 font-semibold text-slate-900">
                                    {holding?.stockSymbol}
                                </p>
                            </div>
                        )}

                        <div>
                            <label className="text-sm font-medium text-slate-700">
                                Quantity
                            </label>

                            <input
                                type="number"
                                min="0"
                                step="any"
                                value={quantity}
                                onChange={(e) =>
                                    setQuantity(e.target.value)
                                }
                                placeholder="e.g. 10"
                                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700">
                                Average Price
                            </label>

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={avgPrice}
                                onChange={(e) =>
                                    setAvgPrice(e.target.value)
                                }
                                placeholder="e.g. 2450.50"
                                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                loading ||
                                !quantity ||
                                !avgPrice ||
                                (!isEdit && !stockSymbol.trim())
                            }
                            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading
                                ? "Saving..."
                                : isEdit
                                    ? "Save Changes"
                                    : "Add Holding"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default HoldingModal;