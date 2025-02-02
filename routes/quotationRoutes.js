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
