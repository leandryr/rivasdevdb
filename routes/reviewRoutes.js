const express = require("express");
const Review = require("../models/Review");

const router = express.Router();

// Obtener todas las reseñas
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las reseñas", error });
  }
});

// Crear una nueva reseña
router.post("/", async (req, res) => {
  const { name, email, review, rating } = req.body;

  if (!name || !email || !review || !rating) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  try {
    const newReview = new Review({ name, email, review, rating });
    await newReview.save();
    res.status(201).json({ message: "Reseña guardada con éxito", review: newReview });
  } catch (error) {
    res.status(500).json({ message: "Error al guardar la reseña", error });
  }
});

module.exports = router;
