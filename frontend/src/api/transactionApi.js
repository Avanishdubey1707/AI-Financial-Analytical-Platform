import apiClient from "./apiClient";

// ============================================================
// GET ALL TRANSACTIONS
// GET /api/v1/transactions
// ============================================================

export const getTransactions = async (params = {}) => {
    const response = await apiClient.get(
        "/transactions",
        {
            params,
        }
    );

    return response.data;
};


// ============================================================
// ADD TRANSACTION
// POST /api/v1/transactions
// ============================================================

export const addTransaction = async (data) => {
    const response = await apiClient.post(
        "/transactions",
        data
    );

    return response.data;
};


// ============================================================
// GET SINGLE TRANSACTION
// GET /api/v1/transactions/:id
// ============================================================

export const getTransactionById = async (id) => {
    const response = await apiClient.get(
        `/transactions/${id}`
    );

    return response.data;
};


// ============================================================
// UPDATE TRANSACTION
// PUT /api/v1/transactions/:id
// ============================================================

export const updateTransaction = async (
    id,
    data
) => {
    const response = await apiClient.put(
        `/transactions/${id}`,
        data
    );

    return response.data;
};


// ============================================================
// DELETE TRANSACTION
// DELETE /api/v1/transactions/:id
// ============================================================

export const deleteTransaction = async (id) => {
    const response = await apiClient.delete(
        `/transactions/${id}`
    );

    return response.data;
};


// ============================================================
// TRANSACTION SUMMARY
// GET /api/v1/transactions/summary
// ============================================================

export const getTransactionSummary = async (
    params = {}
) => {
    const response = await apiClient.get(
        "/transactions/summary",
        {
            params,
        }
    );

    return response.data;
};


// ============================================================
// CHECK FRAUD
// GET /api/v1/transactions/:id/check-fraud
// ============================================================

export const checkTransactionFraud = async (id) => {
    const response = await apiClient.get(
        `/transactions/${id}/check-fraud`
    );

    return response.data;
};