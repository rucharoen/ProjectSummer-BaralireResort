const db = require("../models");
const Type = db.type;

exports.getAll = async (req, res) => {
    try {
        const type = await Type.findAll({
            order: [['id', 'ASC']],
        });
        res.status(200).json(type);
    } catch (error) {
        res.status(500).json({ message: "Error fetching accommodation types" });
    }
}