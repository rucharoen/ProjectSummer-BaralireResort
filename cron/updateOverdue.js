const db = require("../app/models");
const Sequelize = require("sequelize");
const { Op } = require("sequelize");
const Payment = db.payment;

const updateOverdue = async () => {
  const now = new Date();

  await Payment.update(
    { paymentStatus: "Overdue" },
    {
      where: {
        paymentStatus: "Pending",
        due_Date: {
          [Op.lt]: now
        }
      }
    }
  );

  console.log("Overdue payments updated");
};

module.exports = updateOverdue;
