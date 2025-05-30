module.exports = (sequelize, Sequelize) => {
    const Payment = sequelize.define("payments",{ 
        
        id: {   
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id :{
            type: Sequelize.INTEGER,
            allowNull: true
        },
        paymentStatus: {
            type: Sequelize.ENUM('Pending', 'Paid', 'Failed', 'Overdue', 'Cancelled'),
            defaultValue: 'Pending',
            allowNull: false
        },
        due_Date: {
            type: Sequelize.DATE,
            allowNull: true,
        },
        

        }
        );


    return Payment;
};
