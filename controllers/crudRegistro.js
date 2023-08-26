const conexion = require("../database/db");

exports.save = (req, res) => {
  const nombre = req.body.nombre;
  const apellido = req.body.apellido;
  const correo = req.body.correo;
  const telefono = req.body.telefono;
  const direccion = req.body.direccion;
  const contrasena = req.body.contrasena;
  const id_rol = 2;

  const correoValido = /\b[A-Za-z0-9._%+-]+@gmail\.com\b/.test(correo);
  const correoUnl = /\b[A-Za-z0-9._%+-]+@unl\.edu\.ec\b/.test(correo);
  if (correoUnl || correoValido) {
    console.log("valido");
  } else {
    const errorMessage = encodeURIComponent(
      "Correo no válido (Use gmail.com o unl.edu.ec)"
    );
    res.redirect("/registro?error=" + errorMessage);
    return;
  }

  conexion.query(
    "SELECT * FROM usuario WHERE Correo=?",
    [correo],
    (error, results) => {
      if (error) {
        console.log(error);
        return;
      }
      if (results.length > 0) {
        res.redirect("/registro?error=Correo%20ya%20ha%20sido%20registrado!");
      } else {
        conexion.query(
          "INSERT INTO usuario SET ?",
          {
            Nombre: nombre,
            Apellido: apellido,
            Correo: correo,
            Telefono: telefono,
            Direccion: direccion,
            Contrasena: contrasena,
            id_rol: id_rol,
          },
          (error, results) => {
            if (error) {
              console.log(error);
            } else {
              const successMessage =
                "El usuario ha sido registrado correctamente.";
              res.redirect(
                "/registro?success=" + encodeURIComponent(successMessage)
              );
            }
          }
        );
      }
    }
  );
};
exports.update = (req, res) => {
  const id = req.body.id;
  const nombre = req.body.nombre;
  const apellido = req.body.apellido;
  const telefono = req.body.telefono;
  const direccion = req.body.direccion;
  const id_rol = req.body.id_rol === "Administrador" ? 1 : 2;
  console.log(req.body);
  conexion.query(
    "UPDATE usuario SET ? WHERE id_usuario = ?",
    [
      {
        Nombre: nombre,
        Apellido: apellido,
        Telefono: telefono,
        Direccion: direccion,
        id_rol: id_rol,
      },
      id,
    ],
    (error, result) => {
      if (error) {
        console.log(error);
      } else {
      }
    }
  );
};
