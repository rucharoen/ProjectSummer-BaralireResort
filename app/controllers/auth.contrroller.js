const db = require("../models");
const User = db.user;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv/config");

// exports.signup = (req, res) => {
//     res.send("signUp");
// }

exports.signin = (req, res) => {
    // const genPass = bcrypt.hashSync(req.body.password, 8);
    // res.send(genPass);
    console.log("signin")
    const {email, password} = req.body;
    console.log(email, password);
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = regex.test(email);
    if(!isValid){
        res.status(500).json({ message: "Invalid email address" });
    }



    User.findOne({
        where: {
            email: req.body.email
        }
    }).then(user => {
        if (!user) {
            return res.status(404).json({
                message: "Email not found."
            });
        }

        let passwordIsValid = bcrypt.compareSync(
            req.body.password,  // ส่งมาจาก frontend 
            user.password  // ฟีลด์ password ที่อยู่ตาราง users
        );

        if (!passwordIsValid) {
            return res.status(401).json({
                message: "Invalid Password."
            });
        }

        const token = jwt.sign(
            { id: user.id , aa: '3434'},
            process.env.SECRET_KEY,
            {
                algorithm: 'HS256',
                
                expiresIn: '1d'
            }
        );

        // console.log(token);

        let authorities = [];
        user.getRoles()
            .then(roles => {
                for (let i = 0; i < roles.length; i++) {
                    authorities.push("ROLE_" + roles[i].name.toUpperCase());
                }
                // res.send(authorities);
                res.status(200).json({
                    id: user.id,
                    name: user.name,
                    lastname: user.lastname,
                    email: user.email,
                    roles: authorities,
                    accessToken: token
                });
            });
    }).catch(err => {
        res.status(500).json({ message: err.message });
    });
};