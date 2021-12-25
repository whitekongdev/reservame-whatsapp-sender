const amqp = require('amqplib');

let rabbitConnection;
let channelMail;
let queueMail;

async function connectRabbit(url, _queueMail) {
  rabbitConnection = await amqp.connect(url);

  channelMail = await rabbitConnection.createChannel();
  channelMail.assertQueue(_queueMail, {
    durable: false,
  });

  queueMail = _queueMail;
}

function disconnectRabbit() {
  rabbitConnection.close();
}


function sendEmailToRabbit(toSend) {
  const msg = JSON.stringify(toSend);
  channelMail.sendToQueue(queueMail, Buffer.from(msg));
}

module.exports = { connectRabbit, disconnectRabbit, sendEmailToRabbit };