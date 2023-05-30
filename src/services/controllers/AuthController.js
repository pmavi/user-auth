"use strict";

var url = require('url');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
var fetchUrl = require("fetch").fetchUrl;

const { SendEmail } = require("../../libs/Helper");

const { Users, Stores, UserSubscriptions } = require("../models");
const pug = require("pug");
const path = require("path");

module.exports.login = async (req, res, next) => {
    if (req.method === "POST") {
        try {
            let request_body = req.body;
            if (!request_body.email || !request_body.password) {
                return res.json({
                    status: false,
                    message: 'Missing parameter either name or password'
                })
            }
            //////////////////////////// Check User Exist
            const user = await Users.scope("withPassword").findOne({
                where: {
                    email: request_body.email,
                },
            });

            //////////////////////////// Check User Password
            if (!user || !(await bcrypt.compare(request_body.password, user.password))) {
                return res.json({
                    status: false,
                    message: "Email or password is incorrect",
                });
            }

            // Create token
            const token = jwt.sign(
                {
                    user_id: user.id,
                },
                process.env.JWT_SECRET_TOKEN
            );

            // Set Auth Cookies
            res.cookie('auth_user', user);
            res.cookie('auth_token', token);

            // Set Auth Session
            req.session.user = user;
            req.session.token = token;
            req.session.save();

            // Get All Stores
            let store_details = await Stores.findAll({
                where: {
                    user_id: user?.id,
                },
            });
            if (store_details) {
                req.session.store_details = store_details;
            }

            // Check Store Exist or Not
            let store_detail = await Stores.findOne({
                where: {
                    user_id: user?.id,
                },
            });

            if (store_detail) {
                res.cookie('store_id', store_detail?.id);
                req.session.store_id = store_detail?.id;

                return res.json({
                    status: true,
                    message: "Logged in successfully",
                    redirect_url: `${process.env.APP_URL}/${store_detail?.id}/dashboard`,
                });
            } else {
                return res.json({
                    status: true,
                    message: "Logged in successfully",
                    redirect_url: `${process.env.APP_URL}/store-connect`,
                });
            }

        } catch (error) {
            console.error("login error -----------------", error);
            return res.json({
                error: error,
                status: false,
                message: "Something went wrong. Please try again.",
            });
        }
    }

    res.render("frontend/auth/login");
};

module.exports.Register = async (req, res, next) => {
    if (req.method === "POST") {
        try {
            let request_body = req.body;

            if (request_body.password != request_body.confirm_password) {
                return res.json({
                    status: false,
                    message: 'Password and Confirm Password does not match'
                })
            }
            if (request_body.password.length < 6) {
                return res.json({
                    status: false,
                    message: 'Password value should be greater than 6'
                })
            }
            if (request_body.confirm_password.length < 6) {
                return res.json({
                    status: false,
                    message: 'Confirm Password value should be greater than 6'
                })
            }
            if (
                await Users.findOne({
                    where: {
                        email: request_body.email,
                    },
                })
            ) {
                return res.send({
                    status: false,
                    message: "Email already exists. Please try a different email.",
                });
            }
            if (request_body.password) {
                request_body.password = await bcrypt.hash(request_body.password, 10);
            }

            // Create new user
            let user = await Users.create(request_body);

            /*** System Email start ***/
            // let mail_options = {
            //     html: `<b>Hello world?</b>`,
            //     subject: "Welcome to APP!",
            //     to: request_body?.email,
            //     from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`,
            // };
            // await SendEmail(mail_options)
            //     .then((info) => {
            //         console.log("Nodemailer Email sent -------------------- ", info.response);
            //     })
            //     .catch((error) => {
            //         console.log("Nodemailer error ---------- ", error);
            //     });
            /*** System Email End ***/

            // Create token
            let token = jwt.sign(
                {
                    user_id: user.id,
                },
                process.env.JWT_SECRET_TOKEN
            );

            // Set Auth Cookies
            res.cookie('auth_user', user);
            res.cookie('auth_token', token);

            // Set Auth Session
            req.session.user = user;
            req.session.token = token;
            req.session.save();

            return res.json({
                status: true,
                message: "Successfully Registered",
                redirect_url: `${process.env.APP_URL}/store-connect`,
            });
        } catch (error) {
            console.log("Register error -----------------", error);
            return res.json({
                error: error,
                status: false,
                message: "Something went wrong. Please try again.",
            });
        }
    }

    res.render("frontend/auth/register", {
        title: "Register to your account",
    });
};

module.exports.ForgotPassword = async (req, res, next) => {
    try {
        if (req.method === "POST") {
            let request_body = req.body;

            const user = await Users.findOne({
                where: {
                    email: request_body.email,
                },
            });
            if (!user) {
                return res.json({
                    status: false,
                    message: "Email is incorrect",
                });
            } else {
                let otp = Math.random();
                otp = otp * 10000;
                otp = parseInt(otp);
                let expiryTime = new Date();
                expiryTime.setMinutes(expiryTime.getMinutes() + 30);
                await Users.update(
                    {
                        otp: otp,
                        reset_password_expires: expiryTime,
                    },
                    {
                        where: {
                            email: request_body.email,
                        },
                    }
                );

                // const template = pug.renderFile(`${__dirname}/backend/emailOtpTemplate.pug`, {
                //     otp: otp,
                // });

                /*** System Email start ***/
                let mail_options = {
                    html: `<b>${otp}</b>`,
                    //html: path.join(__dirname, "/backend/emailOtpTemplate.pug"),
                    subject: "Custom Checkout",
                    to: request_body?.email,
                    from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`,
                };
                let resp_mail = await SendEmail(mail_options);
                if (resp_mail) {
                    return res.json({
                        status: true,
                        message: "Otp sent at email!Please check your mail",
                    });
                }
                else {
                    return res.json({
                        status: false,
                        message: "Unable to send otp at mail",
                    });
                }

            }
        }
    } catch (error) {
        console.log("ForgotPassword error -----------------", error);
        return res.json({
            error: error,
            status: false,
            message: "Something went wrong. Please try again.",
        });
    }

    res.render("frontend/auth/forgotPassword", {
        title: "Forgot Password",
    });
};

module.exports.ResetPassword = async (req, res, next) => {
    try {
        if (req.method === "POST") {
            let request_body = req.body;
            let current_date = new Date();

            if (!request_body.otp || !request_body.password || !request_body.confirm_password) {
                return res.json({
                    status: false,
                    message: "Missing Parameters.",
                });
            }
            if (request_body.password !== request_body.confirm_password) {
                return res.json({
                    status: false,
                    message: "Password and Confirm Password does not match",
                });
            }
            if (request_body.password.length < 6) {
                return res.json({
                    status: false,
                    message: 'Password value should be greater than 6'
                })
            }
            if (request_body.confirm_password.length < 6) {
                return res.json({
                    status: false,
                    message: 'Confirm Password value should be greater than 6'
                })
            }
            if (!req.query.email) {
                return res.json({
                    status: false,
                    message: "Missing email query parameter!",
                });
            }
            const user = await Users.findOne({
                where: {
                    email: req.query.email,
                    otp: request_body.otp,
                },
            });
            if (user) {
                if (current_date > user.reset_password_expires) {
                    return res.json({
                        status: false,
                        message: "Otp Expired!",
                    });
                } else {
                    if (request_body.password) {
                        request_body.password = await bcrypt.hash(request_body.password, 10);
                    }

                    const verifyUser = await Users.update(
                        {
                            password: request_body.password,
                        },
                        {
                            where: {
                                email: req.query.email,
                            },
                        }
                    );
                    if (verifyUser) {
                        // const template = pug.renderFile(`${__dirname}/backend/emailConfirmation.pug`, {
                        //     otp: otp,
                        // });

                        let mail_options = {
                            html: `<b>You have succesfully changed your password</b>`,
                            subject: "Password Reset Sucess",
                            to: req.query.email,
                            from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`,
                        };
                        let resp_mail = await SendEmail(mail_options);
                        if (resp_mail) {
                            return res.json({
                                status: true,
                                message: "Your password has been reset Succesfully!",
                            });
                        }
                        else {
                            return res.json({
                                status: false,
                                message: "Unable to send the mail",
                            });
                        }


                    }
                }
            } else {
                return res.json({
                    status: false,
                    message: "User not found!",
                });
            }
        }
    } catch (error) {
        console.log("ResetPassword error -----------------", error);
        return res.json({
            error: error,
            status: false,
            message: "Something went wrong. Please try again.",
        });
    }

    res.render("frontend/auth/resetPassword", {
        title: "Reset Password",
    });
};

module.exports.logout = async (req, res, next) => {
    try {
        // res.cookie('auth_user', '', { expires: new Date(1), path: '/' });

        res.clearCookie('auth_user', { path: '/' });
        res.clearCookie('auth_store', { path: '/' });
        res.clearCookie('store_id', { path: '/' });
        res.clearCookie('auth_token', { path: '/' });

        req.session.destroy();
        return res.redirect("/");
    } catch (error) {
        console.log("logout error -----------------", error);
        return res.json({
            error: error,
            status: false,
            message: "Something went wrong. Please try again.",
        });
    }
};