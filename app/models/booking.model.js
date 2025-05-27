module.exports = (sequelize, Sequelize) => {
    const Booking = sequelize.define("bookings", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        adult:{
            type: Sequelize.INTEGER,
            allowNull: false,
             defaultValue: 0,
        },
        child:{
            type: Sequelize.INTEGER,
            allowNull: false,
             defaultValue: 0,
        },
        accommodationId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        totalNights: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        checkInDate: {
            type: Sequelize.DATE,
            allowNull: false,
        },
        checkOutDate: {
            type: Sequelize.DATE,
            allowNull: false,
        },
        totalPrice: {
            type: Sequelize.FLOAT,
            allowNull: false,
        },
        paymentStatus: {
            type: Sequelize.BOOLEAN,
            allowNull: true, // true = paid  , flase = failed, null = pending
            defaultValue: null, // null =pading
        },
        paymentMethod: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        paymentDate: {
            type: Sequelize.DATE,
            allowNull: true,
        },
        // guestName: {
        //     type: Sequelize.STRING,
        //     allowNull: false,
        // },
        // guestEmail: {
        //     type: Sequelize.STRING,
        //     allowNull: false,
        // },
        // guestPhone: {
        //     type: Sequelize.STRING,
        //     allowNull: false,
        //},
        specialRequests: {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        checkedIn: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        checkedOut: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        isCancelled: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        checkInNotes: {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        checkOutNotes: {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        checkOutRating: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        checkInTimestamp: {
            type: Sequelize.DATE,
            allowNull: true,
        },
        checkOutTimestamp: {
            type: Sequelize.DATE,
            allowNull: true,
        },
    });
    return Booking;
}