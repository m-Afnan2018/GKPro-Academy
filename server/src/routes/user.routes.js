const express = require("express");
const router = express.Router();
const { getUsers, getUser, createUser, updateUser, deleteUser } = require("../controllers/user.controller");
const { protect } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");

router.use(protect);

router.get("/",     requireRole("admin"), getUsers);
router.post("/",    requireRole("admin"), createUser);
router.get("/:id",  getUser);
router.patch("/:id", updateUser);
router.delete("/:id", requireRole("admin"), deleteUser);

module.exports = router;
