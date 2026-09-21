const requireAdmin = (
  req,
  res,
  next
) => {
  if (
    req.user?.accountType !==
    "admin"
  ) {
    return res
      .status(403)
      .json({
        success: false,
        message:
          "Admin access required.",
      });
  }

  next();
};

export default requireAdmin;