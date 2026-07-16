# LAB | Express Movies — Register & encrypt password

## Introducción

Tienes una API REST de películas construida con **Express 5** y **Mongoose**. La API ya tiene un CRUD completo de películas, un sistema de valoraciones (ratings) y un sistema de manejo de errores.

Tu misión es **añadir un sistema de usuarios con autenticación básica**, aprendiendo a usar **validaciones avanzadas**, **middleware pre-save** y **cifrado de contraseñas** con bcrypt.

## Requisitos

- Tener [Node.js](https://nodejs.org/) instalado (v22 o superior).
- Tener [MongoDB](https://www.mongodb.com/) corriendo en local.

## Configuración inicial

```bash
cd api
cp .env.template .env
npm install
```

Para lanzar el servidor en modo desarrollo:

```bash
npm run dev
```

Para ejecutar los tests:

```bash
npm test
```

## Punto de partida

El proyecto ya tiene un CRUD funcional de películas y valoraciones con la siguiente estructura:

```
api/
  .env.template                         ← Variables de entorno (copia a .env)
  .gitignore
  package.json
  app.test.js                           ← Tests (tu guía para saber si vas bien)
  src/
    app.js                              ← Servidor Express
    controllers/
      index.js                          ← Definición de rutas
      movie.controller.js               ← Controlador de películas
      rating.controller.js              ← Controlador de valoraciones
    lib/
      config.js                         ← Configuración (puerto, URI de MongoDB)
      db.js                             ← Conexión a MongoDB
      logger.js                         ← Logger (pino)
      models/
        movie.model.js                  ← Modelo de película
        rating.model.js                 ← Modelo de valoración
    middlewares/
      errors.mid.js                     ← Middleware centralizado de errores
      index.js                          ← Barrel de middlewares
```

### Endpoints existentes

| Método   | Ruta           | Descripción                     |
| -------- | -------------- | ------------------------------- |
| `GET`    | `/movies`      | Listar todas las películas      |
| `GET`    | `/movies/:id`  | Obtener una película por ID     |
| `POST`   | `/movies`      | Crear una nueva película        |
| `PATCH`  | `/movies/:id`  | Actualizar una película         |
| `DELETE` | `/movies/:id`  | Eliminar una película           |
| `GET`    | `/ratings`     | Listar todas las valoraciones   |
| `GET`    | `/ratings/:id` | Obtener una valoración por ID   |
| `POST`   | `/ratings`     | Crear una nueva valoración      |
| `PATCH`  | `/ratings/:id` | Actualizar una valoración       |
| `DELETE` | `/ratings/:id` | Eliminar una valoración         |

## Instrucciones

### Iteración 1: Crear el modelo `User`

Crea el archivo `src/lib/models/user.model.js` con el siguiente esquema:

| Campo       | Tipo     | Validaciones                                                              |
| ----------- | -------- | ------------------------------------------------------------------------- |
| `email`     | `String` | Obligatorio. Único. Con `trim`. Regex: `/^\S+@\S+\.\S+$/`               |
| `password`  | `String` | Obligatorio. Mínimo 5 caracteres.                                        |
| `fullName`  | `String` | Obligatorio. Con `trim`.                                                 |
| `bio`       | `String` | Opcional. Con `trim`.                                                    |
| `birthDate` | `Date`   | Obligatorio. Validador custom: el usuario debe tener al menos 18 años.   |

**Puntos clave:**

1. Configura el esquema con `timestamps: true`.
2. Configura `toJSON` con `virtuals: true` y una función `transform` que elimine `password` y `_id` de las respuestas JSON.
3. El validador de `birthDate` debe calcular la edad del usuario comparando su fecha de nacimiento con la fecha actual.

**Pista:**

```js
import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/,
    },
    // ... define password, fullName, bio y birthDate con sus validaciones
    birthDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          // Calcula la edad y devuelve true si es >= 18
        },
        message: 'User must be at least 18 years old',
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password;
        delete ret._id;
        return ret;
      },
    },
  },
);

const User = model('User', userSchema);

export default User;
```

---

### Iteración 2: Cifrado de contraseña con bcrypt

Antes de guardar un usuario en la base de datos, necesitamos **cifrar su contraseña**. Nunca debemos almacenar contraseñas en texto plano.

Primero, instala la dependencia:

```bash
npm install bcrypt
```

#### Middleware `pre("save")`

Mongoose permite definir **middlewares** que se ejecutan antes o después de ciertas operaciones. El middleware `pre("save")` se ejecuta **antes de guardar** un documento en la base de datos.

Añade el siguiente middleware a tu esquema de usuario, **antes** de crear el modelo:

```js
import bcrypt from 'bcrypt';

userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});
```

#### ¿Por qué `this.isModified("password")`?

El middleware `pre("save")` se ejecuta **cada vez** que se llama a `.save()`. Si un usuario actualiza su bio, no queremos re-cifrar la contraseña (que ya está cifrada). `isModified("password")` devuelve `true` solo si el campo `password` ha sido modificado.

#### Implicación importante para el update

No puedes usar `findByIdAndUpdate()` para actualizar usuarios, porque este método **no dispara** el middleware `pre("save")`. En su lugar:

1. Busca el usuario con `findById()`
2. Asigna los nuevos valores con `Object.assign()`
3. Guarda con `.save()`

---

### Iteración 3: Crear el controlador CRUD de Users

Crea el archivo `src/controllers/user.controller.js` con las siguientes funciones:

- **`list(req, res)`** — Devuelve todos los usuarios.
- **`detail(req, res)`** — Devuelve un usuario por ID. Si no existe, lanza un error 404.
- **`create(req, res)`** — Crea un nuevo usuario. Devuelve 201.
- **`update(req, res)`** — Actualiza un usuario por ID. Usa `findById` + `Object.assign` + `.save()`. Si no existe, lanza un error 404.
- **`delete(req, res)`** — Elimina un usuario por ID. Si no existe, lanza un error 404. Devuelve 204.

**Pista — La función `update` debe seguir este patrón:**

```js
async function update(req, res) {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw createError(404, 'User not found');
  }

  Object.assign(user, req.body);
  await user.save();

  res.json(user);
}
```

---

### Iteración 4: Añadir las rutas

Abre `src/controllers/index.js` y añade las rutas para el CRUD de usuarios:

| Método   | Ruta              | Controlador             |
| -------- | ----------------- | ----------------------- |
| `GET`    | `/api/users`      | `userController.list`   |
| `GET`    | `/api/users/:id`  | `userController.detail` |
| `POST`   | `/api/users`      | `userController.create` |
| `PATCH`  | `/api/users/:id`  | `userController.update` |
| `DELETE` | `/api/users/:id`  | `userController.delete` |

---

### Iteración 5: Ejecutar los tests

```bash
npm test
```

Si algún test falla, revisa:

- ¿El modelo `User` tiene todas las validaciones (`required`, `unique`, `match`, `minlength`)?
- ¿Has configurado `toJSON` con `transform` para ocultar `password` y `_id`?
- ¿Has añadido el middleware `pre("save")` con `bcrypt`?
- ¿El controlador `update` usa `findById` + `Object.assign` + `.save()`?
- ¿Has registrado las rutas en `src/controllers/index.js`?
- ¿El validador de `birthDate` calcula correctamente si el usuario tiene al menos 18 años?

---

## Resultado esperado

**Users CRUD:**

- `POST /api/users` con body válido → 201 con el usuario creado (sin password en la respuesta).
- `POST /api/users` con datos inválidos → 400.
- `POST /api/users` con email duplicado → 409.
- `GET /api/users` → 200 con array de usuarios (sin password).
- `GET /api/users/:id` → 200 con el usuario (sin password).
- `PATCH /api/users/:id` → 200 con el usuario actualizado (sin password).
- `PATCH /api/users/:id` con nueva password → La contraseña se re-cifra en la BD.
- `DELETE /api/users/:id` → 204.

**Ejemplo de respuesta `POST /api/users`:**

```json
{
  "id": "abc123",
  "email": "ana@example.com",
  "fullName": "Ana García",
  "bio": "Desarrolladora full-stack",
  "birthDate": "1995-03-15T00:00:00.000Z",
  "createdAt": "2026-02-21T10:30:00.000Z",
  "updatedAt": "2026-02-21T10:30:00.000Z"
}
```

Happy coding! 💙
