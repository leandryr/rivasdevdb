const express = require("express");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const router = express.Router();
require("dotenv").config(); // Cargar variables de entorno

// Definir el esquema y modelo de mensajes en MongoDB
const messageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);
const Message = mongoose.model("Message", messageSchema);

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verificar si la conexión SMTP funciona
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Error en el transporte SMTP:", error);
  } else {
    console.log("✅ Transporte SMTP funcionando correctamente");
  }
});

// Endpoint para manejar el formulario de contacto
router.post("/", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  try {
    // **1️⃣ Guardar el mensaje en la base de datos**
    const newMessage = new Message({ name, email, message });
    await newMessage.save();
    console.log("📂 Mensaje guardado en la base de datos");

    // **2️⃣ Configurar el correo para el administrador**
    const adminMailOptions = {
      from: `"Formulario de Contacto" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL, // Correo donde recibes los mensajes
      subject: "Nuevo mensaje del formulario de contacto",
      text: `Has recibido un nuevo mensaje:\n\nNombre: ${name}\nCorreo: ${email}\nMensaje: ${message}`,
    };

    // **3️⃣ Configurar el correo de confirmación al usuario**
    const userMailOptions = {
      from: `"RivasDev" <${process.env.EMAIL_USER}>`,
      to: email, // Enviar al usuario que completó el formulario
      subject: "Gracias por contactarte con RivasDev",
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f7; padding: 30px; color: #333;">
          <table style="width: 100%; max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <!-- Encabezado -->
            <thead>
              <tr>
                <th style="background-color: #1e40af; padding: 20px; text-align: center; color: #ffffff;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: bold;">RivasDev</h1>
                  <p style="margin: 0; font-size: 16px;">Transformando ideas en soluciones digitales</p>
                </th>
              </tr>
            </thead>
    
            <!-- Cuerpo del mensaje -->
            <tbody>
              <tr>
                <td style="padding: 20px; text-align: left;">
                  <h2 style="color: #1e40af;">Hola, ${name} 👋</h2>
                  <p style="font-size: 16px; line-height: 1.6;">
                    Gracias por contactarte con <strong>RivasDev</strong>. Hemos recibido tu mensaje y uno de nuestros especialistas se pondrá en contacto contigo a la brevedad.
                  </p>
                  <p style="font-size: 16px; line-height: 1.6; background-color: #f4f4f7; padding: 15px; border-radius: 6px; border-left: 4px solid #1e40af;">
                    <strong>Tu mensaje:</strong> "${details}"
                  </p>
                  <p style="font-size: 16px; line-height: 1.6;">
                    Mientras tanto, te invitamos a explorar más sobre nuestros servicios y proyectos en nuestro sitio web.
                  </p>
                  <div style="text-align: center; margin: 20px 0;">
                    <a href="https://www.rivasdev.com" 
                       style="display: inline-block; padding: 12px 25px; font-size: 16px; color: #ffffff; background-color: #1e40af; text-decoration: none; border-radius: 6px;">
                      Visitar nuestro sitio
                    </a>
                  </div>
                </td>
              </tr>
            </tbody>
    
            <!-- Pie de página -->
            <tfoot>
              <tr>
                <td style="background-color: #f4f4f7; padding: 20px; text-align: center; font-size: 14px; color: #555;">
                  <p style="margin: 0;">
                    <strong>RivasDev</strong> - Innovación y tecnología para tu éxito.
                  </p>
                  <p style="margin: 5px 0;">
                    <a href="https://www.rivasdev.com" style="color: #1e40af; text-decoration: none;">www.rivasdev.com</a>
                  </p>
                  <p style="margin: 0;">
                    <a href="mailto:info@rivasdev.com" style="color: #1e40af; text-decoration: none;">info@rivasdev.com</a>
                  </p>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      `,
    };
    
    // **4️⃣ Enviar ambos correos (al administrador y al usuario)**
    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(userMailOptions);
    console.log("📩 Correos enviados correctamente");

    res.status(200).json({ message: "Mensaje enviado con éxito" });
  } catch (error) {
    console.error("❌ Error al enviar el correo o guardar el mensaje:", error);
    res.status(500).json({ message: "Hubo un error al enviar el mensaje", error: error.message });
  }
});
// Obtener todos los mensajes almacenados en la base de datos
router.get("/", async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los mensajes", error });
  }
});

module.exports = router;
