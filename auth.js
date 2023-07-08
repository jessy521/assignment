const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');

const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
const TOKEN_PATH = 'token.json';

function getOAuthClient() {
  const credentials = require('./credentials.json');
  const { client_secret, client_id, redirect_uris } = credentials;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  return oAuth2Client;
}

// main function to check the token 
// if the token is valid will pass otherwise will create a new token
async function authenticate() {
  const oAuth2Client = getOAuthClient();

  try {
    const token = await fs.promises.readFile(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (error) {
    console.log('on error block');
    return getNewAccessToken(oAuth2Client);
  }
}


// function for get new access token
// this function will work if we get unable to use the token stores in token.json
async function getNewAccessToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this URL:', authUrl);

  // make a readline interface in terminal
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });


  // returning promises as this task needs some time
  return new Promise((resolve, reject) => {
    rl.question('Enter the authorization code: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          reject('Error while trying to retrieve access token', err);
        }
        oAuth2Client.setCredentials(token);
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (error) => {
          if (error) {
            reject('Error while saving access token', error);
          }
          console.log('Access token saved successfully!');
          resolve(oAuth2Client);
        });
      });
    });
  });
}

module.exports = {
  authenticate,
};
