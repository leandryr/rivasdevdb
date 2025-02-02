const express = require("express");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const router = express.Router();
require("dotenv").config();

// Verificar que las variables de entorno se cargaron correctamente
console.log("📧 Email configurado para enviar desde:", process.env.EMAIL_USER);
console.log("📧 Email del receptor:", process.env.RECEIVER_EMAIL);

// Esquema y modelo para guardar las cotizaciones en MongoDB
const quotationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    details: { type: String, required: true },
  },
  { timestamps: true }
);
const Quotation = mongoose.model("Quotation", quotationSchema);

// Configurar Nodemailer para enviar las cotizaciones por email
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465, // Se cambió de 587 a 465 y secure en true
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Ruta para manejar solicitudes de cotización
router.post("/", async (req, res) => {
  console.log("📥 Datos recibidos en el backend:", req.body); // Verifica los datos recibidos

  const { name, email, phone, details } = req.body;

  if (!name || !email || !phone || !details) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  try {
    // **1️⃣ Guardar la cotización en la base de datos**
    const newQuotation = new Quotation({ name, email, phone, details });
    await newQuotation.save();
    console.log("📂 Cotización guardada en la base de datos");

    // **2️⃣ Configurar el correo para el administrador**
    const adminMailOptions = {
      from: `"Formulario de Cotización" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      subject: "Nueva solicitud de cotización",
      text: `Has recibido una nueva solicitud de cotización:\n\nNombre: ${name}\nCorreo: ${email}\nTeléfono: ${phone}\nDetalles:\n${details}`,
    };

    console.log("📩 Enviando correo al administrador...");

    // **3️⃣ Configurar el correo de confirmación al usuario**
    const userMailOptions = {
      from: `"RivasDev" <${process.env.EMAIL_USER}>`,
      to: email, // Enviar al usuario que completó el formulario
      subject: "Gracias por contactarnos",
      text: `Hola ${name},\n\nHemos recibido tu mensaje y te responderemos lo antes posible.\n\nTu mensaje:\n"${details}"\n\nGracias por comunicarte con RivasDev.\n\nSaludos,\nEl equipo de RivasDev`,
    };

    console.log("📩 Enviando correo de confirmación al usuario...");

    // **4️⃣ Enviar ambos correos**
    await transporter.sendMail(adminMailOptions);
    console.log("✅ Correo de cotización enviado al administrador");

    await transporter.sendMail(userMailOptions);
    console.log("✅ Correo de confirmación enviado al usuario");

    res.status(200).json({ message: "Cotización enviada con éxito y confirmación enviada al usuario" });
  } catch (error) {
    console.error("❌ Error al guardar la cotización o enviar el correo:", error);
    res.status(500).json({ message: "Hubo un error al procesar la cotización", error: error.message });
  }
});

module.exports = router;
