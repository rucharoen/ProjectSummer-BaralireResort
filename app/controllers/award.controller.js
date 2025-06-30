const db = require("../models");
const Award = db.award;

exports.getAll = async (req, res) => {
    try {
        const award = await Award.findAll();
        res.status(200).json(award);
    } catch (error) {
        res.status(500).json({ message: "Error fetching Activities"});
    }
}