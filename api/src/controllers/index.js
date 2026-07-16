import { Router } from 'express';
import movieController from './movie.controller.js';
import ratingController from './rating.controller.js';
import userController from "./user.controller.js";


const router = Router();

// Movies CRUD
router.get('/movies', movieController.list);
router.get('/movies/:id', movieController.detail);
router.post('/movies', movieController.create);
router.patch('/movies/:id', movieController.update);
router.delete('/movies/:id', movieController.delete);

// Ratings CRUD
router.get('/ratings', ratingController.list);
router.get('/ratings/:id', ratingController.detail);
router.post('/ratings', ratingController.create);
router.patch('/ratings/:id', ratingController.update);
router.delete('/ratings/:id', ratingController.delete);

// TODO Iteración 4: añadir rutas de usuarios aquí
// router.get('/api/users', userController.list);
// ...

router.get("/api/users", userController.list);
router.get("/api/users/:id", userController.detail);
router.post("/api/users", userController.create);
router.patch("/api/users/:id", userController.update);
router.delete("/api/users/:id", userController.delete);


export default router;
