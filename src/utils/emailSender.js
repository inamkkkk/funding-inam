const nodemailer = require('nodemailer');
const appConfig = require('../config/appConfig');

const transporter = nodemailer.createTransport({
    host: appConfig.email.host,
    port: appConfig.email.port,
    secure: appConfig.email.secure,
    auth: {
        user: appConfig.email.auth.user,
        pass: appConfig.email.auth.pass,
    },
});

async function sendEmail(to, subject, html) {
    const mailOptions = {
        from: appConfig.email.from,
        to,
        subject,
        html,
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error };
    }
}

module.exports = { sendEmail };