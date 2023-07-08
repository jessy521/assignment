const { google } = require('googleapis');
const nodemailer = require('nodemailer');

// variables for the email functions
const LABEL_NAME = 'Vacation Replies';
const INTERVAL_MIN = 45;
const INTERVAL_MAX = 120;

// func to add label to the gmail
// create a new label and return it
async function createLabel(gmail) {
  try {
    const response = await gmail.users.labels.create({
      userId: 'me',  
      requestBody: {
        name: LABEL_NAME,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
      },
    });
    console.log('Label created successfully:', response.data);
  } catch (error) {
    console.error('An error occurred while creating the label:', error);
  }
}

// function to get email from the thread 
// returns an email object
async function getEmailFromThread(gmail, threadId) {
  try {
    const response = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
    });

    const thread = response.data;
    const email = {
      id: threadId,
      from: thread.messages[0].payload.headers.find(
        (header) => header.name.toLowerCase() === 'from'
      ).value,
      replies: thread.messages.some(
        (message) => message.payload.headers.some(
          (header) =>
            header.name.toLowerCase() === 'from' &&
            header.value.toLowerCase() === 'jessykumarsarkar@gmail.com'
        )
      ),
    };

    return email;
  } catch (error) {
    console.error('An error occurred while retrieving the email from the thread:', error);
  }
}

// function to get the label id from the labels in user emails
// return label id
async function getLabelId(gmail) {
  try {
    const response = await gmail.users.labels.list({
      userId: 'me',
    });

    const labels = response.data.labels || [];
    const label = labels.find((label) => label.name === LABEL_NAME);

    if (label) {
      return label.id;
    } else {
      throw new Error('Label not found');
    }
  } catch (error) {
    console.error('An error occurred while getting the label ID:', error);
  }
}

// function to add label to the email after replying
// return emailId
async function addLabelToEmail(gmail, emailId) {
  try {
    await gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      requestBody: {
        addLabelIds: [await getLabelId(gmail)],
        removeLabelIds: [],
      },
    });

    console.log('Label added to the email:', emailId);
  } catch (error) {
    console.error('An error occurred while adding the label to the email:', error);
  }
}

// func to email checking and replying in intervals
// it doesn't return anything ,it  calls itself in an interval
async function checkAndReplyEmails(gmail, transporter) {
  try {
    const response = await gmail.users.threads.list({
      userId: 'me',
      q: `in:inbox -label:${LABEL_NAME}`,
    });

    const threads = response.data.threads || [];
    for (const thread of threads) {
      const email = await getEmailFromThread(gmail, thread.id);

      // if there are no reply from my side 
      // send a reply
      if (!email.replies) {
        const mailOptions = {
          from: 'jessykumarsarkar@gmail.com',
          to: email.from,
          subject: 'Automation reply',
          text: 'This is an automation reply , the owner will reach you shortly.Thank you',
        };

        await transporter.sendMail(mailOptions);

        // after sending the reply add a label to the email
        await addLabelToEmail(gmail, email.id);

        console.log('Replied to email:', email);
      }
    }

    // waiting for a random interval before repeating the process
    const interval = getRandomInterval();
    console.log(`Waiting for ${interval} seconds...`);
    setTimeout(() => checkAndReplyEmails(gmail, transporter), interval * 1000);
  } catch (error) {
    console.error('An error occurred while checking and replying to emails:', error);
  }
}

// main func of the page
// authenticated user is passes from auth 
// email filtering,label adding, replying is done repeatedly 
async function start(authClient) {
  try {
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    // Create the transporter for sending emails
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        type: 'OAuth2',
        user: 'jessykumarsarkar@gmail.com',
        clientId: '833482043294-nai8vg87nbdro420fs5jdfua7sslc3k8.apps.googleusercontent.com',
        clientSecret: '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',
        refreshToken: '1//04egSYrA7uhm6CgYIARAAGAQSNwF-L9IrwgwMy9uEcWdqaXjI5NQyt3Tb4d6HYNE4JPizwW6es-onPDaHEKC6G88JpVDpegD7iv8',
        accessToken: 'ya29.a0AbVbY6PaG-kBAFt1Acvn7KaMz5qupbM65WT-WEu1gbBvVxnGrw76vMQ1qiM5Mh-ewp1RBTnTyb2L5G_Go0SNR_TubKLnPd91n4VnwWW3V7c_hMprtsm7tCApSG3-vGfKeo8AKK21w5D4LYNdn8CdM2UCqc5QaCgYKAaUSARMSFQFWKvPlZ9luJmvQIQpIWiycX8x6vQ0163',
      },
    });

    // Create a label in Gmail
    await createLabel(gmail);

    // Perform email checking and replying in intervals
    await checkAndReplyEmails(gmail, transporter);
  } catch (error) {
    console.error('An error occurred while checking and replying to emails:', error);
  }
}

// function to get a random value between INTERVAL_MAX & INTERVAL_MIN
function getRandomInterval() {
  return Math.floor(Math.random() * (INTERVAL_MAX - INTERVAL_MIN + 1)) + INTERVAL_MIN;
}

// exporting module
module.exports = {
  start,
};
