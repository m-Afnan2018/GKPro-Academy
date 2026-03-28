const ROLES = {
  STUDENT: "student",
  MANAGER: "manager",
  ADMIN: "admin",
};

const APPROVAL_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

const PAYMENT_STATUS = {
  PENDING: "pending",
  CAPTURED: "captured",
  FAILED: "failed",
  REFUNDED: "refunded",
};

module.exports = { ROLES, APPROVAL_STATUS, PAYMENT_STATUS };
