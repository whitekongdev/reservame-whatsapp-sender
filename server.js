const { create, ev } = require('@open-wa/wa-automate');
const amqp = require('amqplib/callback_api');

let clientLogged;

let channelMail;

let queueMail;

// Captura el cliente que ha hecho login
function start(client) {
  clientLogged = client;
}

// Envía mensajes
async function sendMessage(msg) {
  try {
    const { body, to } = JSON.parse(msg.content);

    await clientLogged.sendText(`${to}@c.us`, body);
  } catch (error) {
    console.log(error)
  }
}

//Se conecta a la cola de rabbitMQ para capturar los mensajes que tiene que enviar
function connect() {
  amqp.connect(process.env.AMQP_URL, (error0, connection) => {
    if (error0)
      throw error0;

    connection.createChannel((error1, channel) => {
      if (error1)
        throw error1;

      const queue = process.env.AMQP_QUEUE_WHAT;

      channel.assertQueue(queue, { durable: false });

      channel.consume(queue, (msg) => sendMessage(msg), { noAck: true });
    });

    connection.createChannel((error1, channel) => {
      if (error1)
        throw error1;

      queueMail = process.env.AMQP_QUEUE_MAIL;

      channel.assertQueue(queueMail, { durable: false });

      channelMail = channel;
    });

  });
}

setTimeout(() => {
  connect();
  create({
    licenseKey: process.env.WA_API_LEY
  }).then(start);
}, 20000);

// Envía el QR por correo
ev.on('qr.**', async qrcode => {
  let messageParams = {
    from: process.env.MAIL_ORIGIN,
    to: [process.env.MAIL_QR],
    subject: "Inicia sesión con este QR",
    text: "El mensaje se refresca cada 30 segundos mientras no inicies sesión " + qrcode
  }

  const qrFile = {
    filename: 'qr_code.png',
    data: qrcode
  }

  messageParams.attachment = qrFile;

  const msg = JSON.stringify(messageParams);
  channelMail.sendToQueue(queueMail, Buffer.from(msg));
});