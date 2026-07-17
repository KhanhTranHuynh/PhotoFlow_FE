import logger from "@/helpers/logger";
import http from "@/api/http";

export async function dashboardGetTotalOrder(data) {
  try {
    logger.info("[DashboardGetTotalOrder] Request:", data);
    const response = await http.post("/dashboard/get-total-order", data);
    logger.info("[DashboardGetTotalOrder] Response:", response.data);
    return response.data;
  } catch (err) {
    logger.error("[DashboardGetTotalOrder] Error:", err?.response?.data || err);
    throw err;
  }
}

export async function dashboardGetRevenueMonthly(data) {
  try {
    logger.info("[DashboardGetRevenueMonthly] Request:", data);
    const response = await http.post("/dashboard/get-revenue-monthly", data);
    logger.info("[DashboardGetRevenueMonthly] Response:", response.data);
    return response.data;
  } catch (err) {
    logger.error(
      "[DashboardGetRevenueMonthly] Error:",
      err?.response?.data || err,
    );
    throw err;
  }
}

export async function dashboardGetLatestOrders(data) {
  try {
    logger.info("[DashboardGetLatestOrders] Request:", data);
    const response = await http.post("/dashboard/get-latest-orders", data);
    logger.info("[DashboardGetLatestOrders] Response:", response.data);
    return response.data;
  } catch (err) {
    logger.error(
      "[DashboardGetLatestOrders] Error:",
      err?.response?.data || err,
    );
    throw err;
  }
}

export async function dashboardGetTopCustomers(data) {
  try {
    logger.info("[DashboardGetTopCustomers] Request:", data);
    const response = await http.post("/dashboard/get-top-customers", data);
    logger.info("[DashboardGetTopCustomers] Response:", response.data);
    return response.data;
  } catch (err) {
    logger.error(
      "[DashboardGetTopCustomers] Error:",
      err?.response?.data || err,
    );
    throw err;
  }
}

export async function dashboardGetOrderStatusLogs(data) {
  try {
    logger.info("[DashboardGetOrderStatusLogs] Request:", data);
    const response = await http.post("/dashboard/get-order-status-logs", data);
    logger.info("[DashboardGetOrderStatusLogs] Response:", response.data);
    return response.data;
  } catch (err) {
    logger.error(
      "[DashboardGetOrderStatusLogs] Error:",
      err?.response?.data || err,
    );
    throw err;
  }
}

export async function dashboardGetOrderSummary(data) {
  try {
    logger.info("[DashboardGetOrderSummary] Request:", data);
    const response = await http.post(
      "/dashboard/get-order-summary",
      data,
    );
    logger.info("[DashboardGetOrderSummary] Response:", response.data);
    return response.data;
  } catch (err) {
    logger.error(
      "[DashboardGetOrderSummary] Error:",
      err?.response?.data || err,
    );
    throw err;
  }
}


