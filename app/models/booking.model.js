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
        numberOfRooms: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        adult:{
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 1,
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
        doubleExtraBed:{
            type: Sequelize.BOOLEAN,
            allowNull: true, 
            defaultValue: null,
        },
        extraBed:{
            type: Sequelize.BOOLEAN,
            allowNull: true, 
            defaultValue: null,
        },
        // bookingStatus: {
        //     type: Sequelize.ENUM('Pending', 'Paid', 'Failed', 'Overdue', 'Cancelled'),
        //     defaultValue: 'Pending',
        //     allowNull: false
        // },
        paymentMethod: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        paymentDate: {
            type: Sequelize.DATE,
            allowNull: true,
        },
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
        // due_Date: {
        //     type: Sequelize.DATE,
        //     allowNull: true,
        // },
        
    });

    
    return Booking;
};
