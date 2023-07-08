// app.js
const auth = require('./auth');
const emailResponder = require('./emailResponder');

async function runApplication() {
  try {
    // authenticate the user
    const authClient = await auth.authenticate();
    
    // email checking and replying process
    await emailResponder.start(authClient);

    console.log('Email responder app started successfully!');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

runApplication();
