const express = require("express");
const router = express.Router();

const { runCode, getLanguages, getStats } = require("../controllers/compilerController");

router.get("/languages", getLanguages);
router.get("/stats", getStats);
router.post("/run", runCode);

module.exports = router;