const nodemailer = require("nodemailer");
const Swal = require("sweetalert2");
const dotenv = require("dotenv");
const crypto = require("crypto");
dotenv.config();
const conexion = require("../database/db");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "correorutasunl@gmail.com",
    pass: "ngwtqorzxqzddcmz",
  },
  tls: {
    rejectUnauthorized: false,
  },
});
exports.validate = (req, res) => {
  const { email, password } = req.body;
  conexion.query(
    "SELECT * FROM usuario WHERE Correo = ? AND Contrasena = ?",
    [email, password],
    (error, result) => {
      if (error) throw error;
      if (result.length > 0) {
        const rol = result[0].id_rol;

        if (rol === 1) {
          res.redirect("/administrador");
        } else if (rol === 2) {
          res.redirect("/client");
        }
      } else {
        // Pasar el valor de 'error' a la vista ejs
        res.redirect("/?error=Credenciales%20incorrectas!");
      }
    }
  );
};

exports.resetpassword = (req, res) => {
  const email = req.body.email;
  conexion.query(
    "SELECT * FROM usuario WHERE Correo = ?",
    [email],
    (err, result) => {
      if (err) {
        throw err;
      }
      if (result.length === 0) {
        return res.redirect(
          "/forgot-password?error=Correo%20no%20registrado! " + email
        );
      }
      // Generar un código de restablecimiento único
      const resetCode = crypto.randomBytes(20).toString("hex");
      // Guardar el código de restablecimiento en la tabla de clientes
      const sql = "UPDATE usuario SET codigo_reset = ? WHERE Correo = ?";
      conexion.query(sql, [resetCode, email], (err, result) => {
        if (err) {
          throw err;
        }
        console.log(
          "Código de restablecimiento actualizado en la base de datos"
        );
        // Enviar el correo electrónico con el enlace de restablecimiento
        const mailOptions = {
          from: "correorutasunl@gmail.com",
          to: email,
          subject: "Restablecimiento de contraseña",
          text:
            "Haz clic en este enlace para restablecer tu contraseña: http://localhost:3000/reset-password/" +
            resetCode,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
          } else {
            console.log("Correo electrónico enviado: " + info.response);
            const successMessage = "Se ha enviado un correo, revise.";
            res.redirect(
              "/forgot-password?success=" + encodeURIComponent(successMessage)
            );
          }
        });
      });
    }
  );
};
exports.mostrarFormularioReset = (req, res) => {
  const resetCode = req.params.reset_code;
  // Verificar que el código de restablecimiento exista en la tabla de clientes
  console.log(resetCode);
  const sqlCheckResetCode = "SELECT * FROM usuario WHERE codigo_reset = ?";
  conexion.query(sqlCheckResetCode, [resetCode], (err, result) => {
    if (err) {
      throw err;
    }

    if (result.length === 0) {
      return res.send("Código de restablecimiento no válido o expirado.");
    }
    const resetCodeValue = result[0].codigo_reset; // Extraer el valor del código de restablecimiento
    res.render("reset-password-confirm", { resetCode: resetCodeValue });
  });
};

// Función para restablecer la contraseña
exports.resetPassword = (req, res) => {
  const resetCode = req.body.reset_code;
  const newPassword = req.body.password;

  // Aquí realizamos la consulta SQL para verificar si el código de restablecimiento es válido y si no ha expirado
  // El código de restablecimiento es válido y no ha expirado, por lo que actualizamos la contraseña en la base de datos
  const sqlUpdatePassword =
    "UPDATE usuario SET Contrasena = ? WHERE codigo_reset = ?";
  conexion.query(sqlUpdatePassword, [newPassword, resetCode], (err, result) => {
    if (err) {
      throw err;
    }
    if (result.affectedRows === 0) {
      return res.send("Código de restablecimiento no válido o expirado.");
    }
    console.log("Contraseña restablecida exitosamente");
    res.send(`
            <script src="https://unpkg.com/sweetalert/dist/sweetalert.min.js"></script>
            <body>
              <script type="text/javascript">
                swal({
                  title: "Éxito",
                  text: "Su contraseña se ha actualizado con éxito",
                  icon: "success",
                }).then(function() {
                  window.location = "/"; // 
                });
              </script>
            </body>
            `);
  });
};
