import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  const { name, email, query } = await request.json();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.NODE_EMAIL, 
      pass: process.env.NODE_PASS,
    },
  });

  const mailOptions = {
    from: process.env.NODE_EMAIL,
    to: process.env.NODE_EMAIL,   
    subject: `Contact Form Submission from ${name}`,
    text: `New Contact Form Submission\n\n` +
          `Name: ${name}\n` +
          `Email: ${email}\n` +
          `Query:\n${query}`, 
    replyTo: email,
  };

  try {
    await transporter.sendMail(mailOptions);
    return new Response('Email sent successfully', { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response('Error sending email', { status: 500 });
  }
}
