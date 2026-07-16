import { Schema, model } from 'mongoose';
import bcrypt from "bcrypt";

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
    password: {
        type: String,
        required: true,
        minlegnth: 5,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    // Calcula la edad y devuelve true si es >= 18
        bio: {
            type: String,
            trim: true,
        },
        birthDate: {
            type: Date,
            required: true,

            validate: {
                validator: function (value) {
                    const today = new Date();

                    let age = today.getFullYear() - value.getFullYear();

                    const month = today.getMonth() - value.getMonth();

                    if(
                        month < 0 ||
                        (month === 0 && today.getDate() < value.getDate())
                    ) {
                        age--;
                    }
                    return age >= 18;
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
        ret.id = ret._id;

        delete ret.password;
        delete ret._id;
        delete ret.__v;

        return ret;
      },
    },
  },
);

userSchema.pre("save", async function () {
    if(this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
});

const User = model('User', userSchema);

export default User;