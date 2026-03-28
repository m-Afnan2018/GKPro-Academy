const ContentApproval = require("../models/ContentApproval");

const submitForApproval = async (entityType, entityId, userId) => {
  return ContentApproval.create({
    entityType,
    entityId,
    submittedBy: userId,
    status: "pending",
    submittedAt: new Date(),
  });
};

module.exports = { submitForApproval };
