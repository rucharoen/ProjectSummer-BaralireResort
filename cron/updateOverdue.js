const db = require("../app/models");
const Sequelize = require("sequelize");
const { Op, where } = require("sequelize");
const Booking = db.booking;
 
const updateOverdue = async () => {
    const now = new Date();
 
    await Booking.update(
        {bookingStatus: "Overdue"},
        {
            where: {
                bookingStatus: "Pending",
                due_Date: {
                    [Op.lt]: now
                }}});
 
                console.log("Overdue bookings updated")
}
 
module.exports = updateOverdue