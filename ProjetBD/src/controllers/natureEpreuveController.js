const asyncHandler = require('../utils/asyncHandler');
const natureEpreuveModel = require('../models/natureEpreuveModel');

const getAll = asyncHandler(async (req, res) => {
  const natures = await natureEpreuveModel.findAll();
  return res.status(200).json({ total: natures.length, data: natures });
});

module.exports = { getAll };
