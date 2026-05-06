const asyncHandler = require('../utils/asyncHandler');

const getAllNotifications = asyncHandler(async (req, res) => {
  res.status(200).json({ data: [] });
});

const getMyNotifications = asyncHandler(async (req, res) => {
  res.status(200).json({ data: [] });
});

module.exports = { getAllNotifications, getMyNotifications };
