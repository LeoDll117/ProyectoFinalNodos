const mysql = require("mysql");

const conection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "proyecto_final",
});

conection.connect((error) => {
  if (error) {
    console.error("El error de conexion es:" + error);
    return;
  }
  console.log("Conectado a la BD MySQL");
});
module.exports = conection;
