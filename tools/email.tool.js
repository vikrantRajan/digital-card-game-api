
const nodeMailer = require('nodemailer');
const config = require('../config');

exports.SendEmail = function(email_to, subject, text, callback){

    console.log("Sending email to: " + email_to);

    let transporter = nodeMailer.createTransport({
        host: config.smtp_server,
        port: config.smtp_port,
        secure: true,
        auth: {
            user: config.smtp_user,
            pass: config.smtp_password,
        }
    });

    let mailOptions = {
        from: '"' + config.smtp_name + '" <' + config.smtp_email + '>', // sender address
        to: email_to, // list of receivers
        subject: subject, // Subject line
        //text: text, // plain text body
        html: text, // html body
    };

    transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                if(callback)
                    callback(false);
                return console.log(error);
            }
            //console.log('Message %s sent: %s', info.messageId, info.response);
            if(callback)
                callback(true);
        });

};