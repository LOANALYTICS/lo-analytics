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

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
      <h2 style="color: #4CAF50;">📬 New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #1a73e8;">${email}</a></p>
      <p><strong>Query:</strong></p>
      <div style="background-color: #f9f9f9; border-left: 4px solid #4CAF50; padding: 10px; border-radius: 5px;">
        ${query.replace(/\n/g, "<br>")}
      </div>
      <hr style="margin-top: 20px;">
      <p style="font-size: 12px; color: #888;">This message was sent from your website contact form.</p>
    </div>
  `;

  const mailOptions = {
    from: process.env.NODE_EMAIL,
    to: process.env.NODE_EMAIL,
    subject: `Contact Form Submission from ${name}`,
    html: htmlTemplate,
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
