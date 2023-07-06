const express = require('express')
const PDFParser = require('pdf-parse');
const request = require('request');
const app = express();
const bodyParser = require('body-parser');
const client = require("./Database.js")

const cors = require('cors');
const crypto = require('crypto');
const multer = require('multer');
const upload = multer();

const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const { setTimeout } = require('timers');
app.use(express.json());
app.use(cors());

const port = 4000;



app.post('/report2', (req, res) => {

  const d = req.body;
  console.log("D",d);

  const date1 = new Date(req.body.fromDate);
  const date2 = new Date(req.body.toDate);
  const name = req.body.name;

 


let Name = name;

  if (name === 'BillingWorksheet') {
    Name += '4';
  }

  const email = req.body.email;



  console.log('Date 1:', date1);
  console.log('Date 2:', date2);
  console.log("Name", Name);
  console.log('Date 1:', email);

  client.query('SELECT COUNT(*) FROM billingworksheet WHERE "Ddate" BETWEEN $1 AND $2', [date1, date2], (err, result) => {
    if (err) {
      console.error(err);
    } else {
      console.log(`The row count between ${date1} and ${date2} is ${result.rows[0].count}`);
      const RowCount = result.rows[0].count
      console.log("RowCount", RowCount);

      const url = `http://localhost:8080/pentaho/api/repos/%3Apublic%3AMango%3A${Name}.prpt/report`;



      const params = {
        "CompanyID": "1",
        "FromDate": date1,
        "ToDate": date2,

      };

      console.log("Param",params);

      if (RowCount < 1000) {


        request.get({
          url: url,
          qs: params,
          encoding: null,
          headers: {
            'Authorization': 'Basic ' + Buffer.from('admin:password').toString('base64'),
            'Content-Type': 'application/pdf'
          },
        }, (error, response, body) => {
          if (error) {
            console.error(error);
            res.status(500).send('Error getting report');
          }
          else {

            console.log("Data", response.headers);
            console.log("Body", body);


            res.set('Content-Type', 'application/pdf');

            res.send(body);

            console.log("body");



          }


        });

      }
      else {

        res.status(200).send({ message: 'Report generation is in progress. Please wait for an email with the generated report.' });

        console.log("else is running");
        

      }

    }

    // disconnect from the database
    //client.end();

  });
})





app.post("/submit2", (req, res) => {

  console.log("Res", req.body);

  const Message = req.body.choice;
  const date1 = new Date(req.body.fromDate);
  const date2 = new Date(req.body.toDate);
  const name = req.body.name;

  const email = req.body.email;

  let Name = name;

  if (name === 'BillingWorksheet') {
    Name += '4';
  }

  console.log("Message", Message);

  const url = `http://localhost:8080/pentaho/api/repos/%3Apublic%3AMango%3A${Name}.prpt/report`;



  const params = {
    "CompanyID": "1",
    "FromDate": date1,
    "ToDate": date2,

  };

  console.log("Param",params);

  if (Message === "yes") {
    // Execute code for "yes" choice
    console.log("User selected Yes");

    console.log("N", Name);

    if (Name === "BillingWorksheet4") {

      request.get({
        url: url,
        qs: params,
        encoding: null,
        headers: {
          'Authorization': 'Basic ' + Buffer.from('admin:password').toString('base64'),
          'Content-Type': 'application/pdf'
        },
        timeout: 120000,   //2 minutes
      }, (error, response, body) => {
        console.log("Error", error);
        console.log("Body", body);
        if (error) {
          console.error(error);
          if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT' || error.code === 'ESOCKET') {
            // Handle timeout error
            console.error('API call timed out');
            res.status(500).json({ error: 'API call timed out' });

          } else {
            // Handle other errors
            res.status(500).send('Error getting report');
          }


        }
        else {
          // console.log("Timeout");
          const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com', // replace with SMTP server hostname
            port: 587, // replace with SMTP server port
            secure: false, // true for 465, false for other ports
            auth: {
              user: 'vijayaraj.m@prowesstics.com',
              pass: 'ujmalbntgdoychxw' // replace with your password
            }
          });

          const mailOptions = {
            from: 'vijayaraj.m@prowesstics.com',
            to: email,
            subject: 'Pentaho Report PDF',
            attachments: [
              {
                filename: Name,
                content: body,
                contentType: 'application/pdf'
              }
            ]
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log(error);
              //res.status(400).send({ error: 'Email send error'});
            } else {
              console.log('Email sent: ' + info.response);
              console.log("Email sent successfully");
              // res.send({ message: 'Email send successfully' });

              res.status(200).json({ message: 'Email sent successfully' });
            }
          });



          //   }


          // });


        }
      })

    }
    else {
      console.log("Another report run");
      request.get({
        url: url,
        qs: params,
        encoding: null,
        headers: {
          'Authorization': 'Basic ' + Buffer.from('admin:password').toString('base64'),
          'Content-Type': 'application/pdf'
        },
        timeout: 60000,
      }, (error, response, body) => {
        console.log("Error", error);
        console.log("Body", body);
        if (error) {
          console.error(error);
          if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
            // Handle timeout error
            console.error('API call timed out');
            res.status(500).json({ error: 'API call timed out' });

          } else {
            // Handle other errors
            res.status(500).send('Error getting report');
          }


        }
        else {

          const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com', // replace with SMTP server hostname
            port: 587, // replace with SMTP server port
            secure: false, // true for 465, false for other ports
            auth: {
              user: 'vijayaraj.m@prowesstics.com', // replace with your email
              pass: 'ujmalbntgdoychxw' // replace with your password
            }
          });

          const mailOptions = {
            from: 'vijayaraj.m@prowesstics.com',
            to: email,
            subject: 'Pentaho Report PDF',
            attachments: [
              {
                filename: Name,
                content: body,
                contentType: 'application/pdf'
              }
            ]
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log(error);
              //res.status(400).send({ error: 'Email send error'});
            } else {
              console.log('Email sent: ' + info.response);
              console.log("Email send successfully");
              // res.send({ message: 'Email send successfully' });

              res.status(200).json({ message: 'Email send successfully' });
            }
          });



          //   }


          // });


        }
      })
    }


  } else {
    // Execute code for "no" choice
    console.log("User selected No");
  }

})


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

client.connect();