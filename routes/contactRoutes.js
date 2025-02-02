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
      subject: "Gracias por contactarnos",
      text: `Hola ${name},\n\nHemos recibido tu mensaje y te responderemos lo antes posible.\n\nTu mensaje:\n"${message}"\n\nGracias por comunicarte con RivasDev.\n\nSaludos,\nEl equipo de RivasDev`,
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
