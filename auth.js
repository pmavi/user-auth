"use strict";

var url = require("url");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
var fetchUrl = require("fetch").fetchUrl;
const fs = require("fs");
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
                    message: "Missing parameter either name or password",
                });
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
            // if (user?.email_verified_at) {
                // Create token
                const token = jwt.sign(
                    {
                        user_id: user.id,
                    },
                    process.env.JWT_SECRET_TOKEN
                );

                // Set Auth Cookies
                res.cookie("user", user);
                res.cookie("token", token);

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
                    res.cookie("store_id", store_detail?.id);
                    req.session.store_id = store_detail?.id;

                    return res.json({
                        status: true,
                        message: "Logged in Successfully",
                        redirect_url: `${process.env.APP_URL}/${store_detail?.id}/dashboard`,
                    });
                } else {
                    return res.json({
                        status: true,
                        message: "Logged in Successfully",
                        redirect_url: `${process.env.APP_URL}/store-connect`,
                    });
                }
            // } else {
            //     return res.json({
            //         status: false,
            //         message: "Please verify your Email first!",
            //     });
            // }
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
                    message: "Password and Confirm Password does not match",
                });
            }
            if (request_body.password.length < 6) {
                return res.json({
                    status: false,
                    message: "Password value should be greater than 6",
                });
            }
            if (request_body.confirm_password.length < 6) {
                return res.json({
                    status: false,
                    message: "Confirm Password value should be greater than 6",
                });
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

            // /*** System Email start ***/
            let email_parametars = {
                Verification_URL: `${process.env.APP_URL}/verify-account/${Buffer.from(String(user.id)).toString("base64")}`,
                REGISTERED_NAME: `${request_body?.first_name} ${request_body?.last_name}`,
                HOME_URL: `${process.env.APP_URL}`,
            };
            let email_template = await fs.readFileSync(`${appRoot}/views/email-templates/AccountVerificationTemplate.html`, "utf8");
            email_template = email_template.replace(/Verification_URL|HOME_URL|REGISTERED_NAME/gi, function (matched) {
                return email_parametars[matched];
            });

            let mail_options = {
                html: email_template,
                subject: "Welcome to APP!",
                to: request_body?.email,
                from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`,
            };
            await SendEmail(mail_options)
                .then((info) => {
                    console.log("Nodemailer Email sent -------------------- ", info.response);
                })
                .catch((error) => {
                    console.log("Nodemailer error ---------- ", error);
                });
            /*** System Email End ***/
            return res.json({
                status: true,
                message: "Successfully Registered",
                redirect_url: `${process.env.APP_URL}/account-verify/${user.id}`,
            });
        } catch (error) {
            console.error("Register error -----------------", error);
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

module.exports.AccountVerification = async (req, res, next) => {
    if (req.method == "POST") {
        try {
            const request_body = req.body;
            let email_parametars = {
                Verification_URL: `${process.env.APP_URL}/verify-account/${Buffer.from(String(request_body.id)).toString("base64")}`,
                REGISTERED_NAME: `${request_body?.first_name} ${request_body?.last_name}`,
                HOME_URL: `${process.env.APP_URL}`,
            };
            let email_template = await fs.readFileSync(`${appRoot}/views/email-templates/AccountVerificationTemplate.html`, "utf8");
            email_template = email_template.replace(/Verification_URL|HOME_URL|REGISTERED_NAME/gi, function (matched) {
                return email_parametars[matched];
            });

            let mail_options = {
                html: email_template,
                subject: "Welcome to APP!",
                to: request_body?.email,
                from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`,
            };
            await SendEmail(mail_options)
                .then((info) => {
                    console.log("Nodemailer Email sent -------------------- ", info.response);
                })
                .catch((error) => {
                    console.log("Nodemailer error ---------- ", error);
                });
            /*** System Email End ***/
            return res.json({
                status: true,
                message: "Resent Successfully",
                redirect_url: `${process.env.APP_URL}/account-verify/${request_body.id}`,
            });
        } catch (error) {
            console.error(" error -----------------", error);
            return res.json({
                error: error,
                status: false,
                message: "Something went wrong. Please try again.",
            });
        }
    }
    let user = await Users.findOne({
        where: {
            id: req.params.user_id,
        },
    }).then((response) => {
        return response;
    });

    res.render("frontend/auth/AccountVerification", {
        title: "Verify your account",
        user: user,
    });
};

module.exports.AccountVerificationSuccess = async (req, res, next) => {
    try {
        let current_date = new Date();
        let user_id = Buffer.from(req.params.user_id, "base64").toString();

        let user = await Users.findOne({
            where: {
                id: user_id,
            },
        });

        if (!user?.email_verified_at) {
            user.email_verified_at = current_date;
            user.save();

            let email_parametars = {
                HOME_URL: `${process.env.APP_URL}`,
            };
            let email_template = await fs.readFileSync(`${appRoot}/views/email-templates/AccountVerificationSuccessTemplate.html`, "utf8");
            email_template = email_template.replace(/HOME_URL/gi, function (matched) {
                return email_parametars[matched];
            });

            let mail_options = {
                html: email_template,
                subject: "Custom Checkout",
                to: user?.email,
                from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`,
            };

            await SendEmail(mail_options)
                .then(async (info) => {
                    console.log("Nodemailer Email sent -------------------- ", info.response);
                })
                .catch((error) => {
                    console.log("Nodemailer error ---------- ", error);
                });

            //store connect email
            let store_email_parametars = {
                STORE_URL: `${process.env.APP_URL}/store-connect`,
                HOME_URL: `${process.env.APP_URL}`,
            };
            let store_email_template = await fs.readFileSync(`${appRoot}/views/email-templates/ConnectStoreEmailTemplate.html`, "utf8");
            store_email_template = store_email_template.replace(/STORE_URL|HOME_URL/gi, function (matched) {
                return store_email_parametars[matched];
            });

            let store_mail_options = {
                html: store_email_template,
                subject: "Custom Checkout",
                to: user?.email,
                from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`,
            };

            await SendEmail(store_mail_options)
                .then(async (info) => {
                    console.log("Nodemailer Email sent -------------------- ", info.response);
                })
                .catch((error) => {
                    console.log("Nodemailer error ---------- ", error);
                });
        }

        res.render("frontend/auth/AccountVerificationSuccess");
    } catch (error) {
        console.error("AccountVerificationSuccess error -----------------", error);
        res.redirect(`${process.env.APP_URL}/login`);
    }
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
                let expiryTime = new Date();
                expiryTime.setMinutes(expiryTime.getMinutes() + 30);
                let token = Buffer.from(String(user.id)).toString("base64");
                await Users.update(
                    {
                        token: token,
                        reset_password_expires: expiryTime,
                    },
                    {
                        where: {
                            email: request_body.email,
                        },
                    }
                );
                let email_parametars = {
                    RESET_PWD_URL: `${process.env.APP_URL}/resetPassword/${token}`,
                    USERNAME: `${request_body?.email}`,
                    HOME_URL: `${process.env.APP_URL}`,
                };
                let email_template = await fs.readFileSync(`${appRoot}/views/email-templates/EmailForgotPasswordTemplate.html`, "utf8");
                email_template = email_template.replace(/RESET_PWD_URL|HOME_URL|USERNAME/gi, function (matched) {
                    return email_parametars[matched];
                });

                /*** System Email start ***/
                let mail_options = {
                    html: email_template,
                    subject: "Custom Checkout",
                    to: request_body?.email,
                    from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`,
                };
                let resp_mail = await SendEmail(mail_options);
                if (resp_mail) {
                    return res.json({
                        status: true,
                        email: user.email,
                        message: "Sent Email",
                        redirect_url: `${process.env.APP_URL}/forgot-password/${user.id}`,
                    });
                } else {
                    return res.json({
                        status: false,
                        message: "Unable to send send reset link at mail",
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

module.exports.ForgotPasswordMessage = async (req, res, next) => {
    try {
        let user = await Users.findOne({
            where: {
                id: req.params.id,
            },
        }).then((response) => {
            return response;
        });
        res.render("frontend/auth/ForgotPasswordMessage", {
            user: user,
        });
    } catch (error) {
        console.log("error------------", error);
        return res.json({
            status: false,
            message: "Something went wrong!Please try again.",
        });
    }
};

module.exports.ResetPassword = async (req, res, next) => {
    try {
        let user_id = Buffer.from(req.params.user_id, "base64").toString();

        if (req.method === "POST") {
            let request_body = req.body;
            let current_date = new Date();

            if (!request_body.password || !request_body.confirm_password) {
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
                    message: "Password value should be greater than 6",
                });
            }
            if (request_body.confirm_password.length < 6) {
                return res.json({
                    status: false,
                    message: "Confirm Password value should be greater than 6",
                });
            }

            const user = await Users.findOne({
                where: {
                    id: user_id,
                    token: req.params.user_id,
                },
            });
            if (user) {
                if (current_date > user.reset_password_expires) {
                    return res.json({
                        status: false,
                        message: "Reset Link Expired!",
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
                                email: user.email,
                            },
                        }
                    );
                    if (verifyUser) {
                        return res.json({
                            status: true,
                            message: "Your password has been changed, now you can log in. ",
                        });
                    } else {
                        return res.json({
                            status: false,
                            message: "Unable to reset the password",
                        });
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
        console.error("ResetPassword error -----------------", error);
        return res.json({
            error: error,
            status: false,
            message: "Something went wrong. Please check your details.",
        });
    }

    res.render("frontend/auth/resetPassword", {
        title: "Reset Password",
    });
};

module.exports.logout = async (req, res, next) => {
    try {
        res.clearCookie("auth_user", { path: "/" });
        res.clearCookie("auth_store", { path: "/" });
        res.clearCookie("store_id", { path: "/" });
        res.clearCookie("auth_token", { path: "/" });

        req.session.destroy();
        return res.redirect("/");
        // req.session.destroy((err) => {
        // res.redirect('/') // will always fire after session is destroyed
        // })
    } catch (error) {
        console.error("logout error -----------------", error);
        return res.json({
            error: error,
            status: false,
            message: "Something went wrong. Please try again.",
        });
    }
};
