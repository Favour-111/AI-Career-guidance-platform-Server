const User = require("../models/User");
const Profile = require("../models/Profile");
const ActivityLog = require("../models/ActivityLog");
const MarketData = require("../models/MarketData");

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = async (req, res, next) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search)
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    if (role) query.role = role;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await User.countDocuments(query);

    res.json({
      users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user (activate/deactivate/change role)
// @route   PATCH /api/admin/users/:id
// @access  Admin
const updateUser = async (req, res, next) => {
  try {
    const { isActive, role } = req.body;

    if (req.params.id === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot modify your own account here" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { ...(isActive !== undefined && { isActive }), ...(role && { role }) },
      { new: true },
    );

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User updated", user });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account" });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await Profile.findOneAndDelete({ user: req.params.id });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get platform statistics
// @route   GET /api/admin/stats
// @access  Admin
const getStats = async (req, res, next) => {
  try {
    const [totalUsers, activeUsers, totalProfiles, recentActivity] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        Profile.countDocuments(),
        ActivityLog.find({})
          .sort({ createdAt: -1 })
          .limit(20)
          .populate("user", "name email avatar"),
      ]);

    const usersByMonth = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]);

    res.json({
      totalUsers,
      activeUsers,
      totalProfiles,
      recentActivity,
      usersByMonth,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upsert market data
// @route   POST /api/admin/market-data
// @access  Admin
const upsertMarketData = async (req, res, next) => {
  try {
    const { careerId } = req.body;
    const data = await MarketData.findOneAndUpdate(
      { careerId },
      { $set: req.body },
      { new: true, upsert: true, runValidators: true },
    );
    res.json({ message: "Market data saved", data });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk seed market data
// @route   POST /api/admin/market-data/bulk
// @access  Admin
const bulkSeedMarketData = async (req, res, next) => {
  try {
    const { careers } = req.body;
    if (!Array.isArray(careers)) {
      return res.status(400).json({ message: "careers must be an array" });
    }

    const ops = careers.map((c) => ({
      updateOne: {
        filter: { careerId: c.careerId },
        update: { $set: c },
        upsert: true,
      },
    }));

    const result = await MarketData.bulkWrite(ops);
    res.json({ message: "Market data bulk updated", result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  updateUser,
  deleteUser,
  getStats,
  upsertMarketData,
  bulkSeedMarketData,
};
