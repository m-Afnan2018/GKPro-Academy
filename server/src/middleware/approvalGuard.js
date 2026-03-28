const approvalGuard = (req, res, next) => {
  if (req.user && req.user.role === "manager") {
    req.isDraft = true;
  } else {
    req.isDraft = false;
  }
  next();
};

module.exports = { approvalGuard };
