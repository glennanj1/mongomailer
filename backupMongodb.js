require("dotenv").config();
const cron = require("node-cron");
const mongodb = require("mongodb").MongoClient;
const fastcsv = require("fast-csv");
const fs = require("fs");
const ws = fs.createWriteStream("nameyourwritestreamhere.csv");
const nodemailer = require("nodemailer");

// every 12 hours
cron.schedule("* 12 * * *", function () {
  console.log("running a task every 12 hours");

  // let url = "mongodb://username:password@localhost:27017/";

  let url = process.env.MONGO_URI;

  mongodb
    .connect(
      url,
      { useNewUrlParser: true, useUnifiedTopology: true },
      (err, client) => {
        if (err) throw err;
        client
          .db(process.env.db)
          .collection(process.db.collection)
          // find all records
          .find({})
          .toArray((err, data) => {
            // err handling
            if (err) throw err;
            // fast csv boiler plate
            fastcsv.write(data, { headers: true }).on("finish", function () {
              console.log("Wrote successfully!");

              // async..await is not allowed in global scope, must use a wrapper
              async function main() {
                // Generate test SMTP service account from ethereal.email
                // Only needed if you don't have a real mail account for testing
                //let testAccount = await nodemailer.createTestAccount();

                // create reusable transporter object using the default SMTP transport

                let transporter = nodemailer.createTransport({
                  host: process.env.host,
                  port: 587,
                  secure: false, // true for 465, false for other ports
                  auth: {
                    user: process.env.user, // generated ethereal user
                    pass: process.env.pass, // generated ethereal password
                  },
                });

                // send mail with defined transport object
                let info = await transporter.sendMail({
                  from: '"John G 🚀" <john@glennan-cloud.com>', // sender address
                  to: "emails@here, seperated@bycommas", // list of receivers
                  subject: "Wedding Details", // Subject line
                  text: "Ever want some automation in your life?", // plain text body
                  html: "<b>Your message in bold goes here</b>", // html body
                  amp: `<!doctype html>
                                      <html ⚡4email>
                                        <head>
                                          <meta charset="utf-8">
                                          <style amp4email-boilerplate>body{visibility:hidden}</style>
                                          <script async src="https://cdn.ampproject.org/v0.js"></script>
                                          <script async custom-element="amp-anim" src="https://cdn.ampproject.org/v0/amp-anim-0.1.js"></script>
                                        </head>
                                        <body>
                                          <p>Image: <amp-img src="https://cldup.com/P0b1bUmEet.png" width="16" height="16"/></p>
                                            <amp-anim src="https://cldup.com/D72zpdwI-i.gif" width="500" height="350"/></p>
                                        </body>
                                      </html>`,
                  attachments: [
                    {
                      // file on disk as an attachment
                      // stream as an attachment
                      filename: "yourwritefilenamehere.csv",
                      content: fs.createReadStream("./path"),
                    },
                  ],
                });

                console.log("Message sent: %s", info.messageId);

                console.log(
                  "Preview URL: %s",
                  nodemailer.getTestMessageUrl(info)
                );
              }
              main().catch(console.error);
            });
          });
      }
    )
    .pipe(ws);
  client.close();
});
