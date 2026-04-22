const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getAllUsers,
  updateUser,
  deleteUser,
  getStats,
  upsertMarketData,
  bulkSeedMarketData,
} = require("../controllers/adminController");

router.use(protect, adminOnly);

router.get("/users", getAllUsers);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.get("/stats", getStats);
router.post("/market-data", upsertMarketData);
router.post("/market-data/bulk", bulkSeedMarketData);

module.exports = router;
