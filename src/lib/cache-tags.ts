export const CACHE_TAGS = {
  dashboard: "dashboard-page-data",
  transactions: "transactions-page-data",
  production: "production-page-data",
  deliveryProjects: "delivery-projects-data",
  deliveryHistory: "delivery-history-data",
} as const;

export function transactionDetailTag(transactionId: number) {
  return `transaction-detail-${transactionId}`;
}

export function deliveryReadyItemsTag(projectId: number) {
  return `delivery-ready-items-${projectId}`;
}