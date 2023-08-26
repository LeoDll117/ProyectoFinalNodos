const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const geolib = require("geolib");
const dotenv = require("dotenv");
const crypto = require("crypto");
const Dijkstra = require("node-dijkstra");
const conexion = require("./database/db");
const crud = require("./controllers/crud");
const crudRegistro = require("./controllers/crudRegistro");
const validacionLogin = require("./controllers/controllerLogin");
dotenv.config();

router.get("/forgot-password", (req, res) => {
  const errorMessage = req.query.error;
  const successMessage = req.query.success;
  res.render("forgot-password", {
    error: errorMessage,
    successMessage: successMessage,
  });
});

// Ruta para el formulario de restablecimiento de contraseña
router.get(
  "/reset-password/:reset_code",
  validacionLogin.mostrarFormularioReset
);

router.get("/administrador", (req, res) => {
  res.render("das");
});

router.get("/", (req, res) => {
  const errorMessage = req.query.error;
  const successMessage = req.query.success;
  res.render("login", { error: errorMessage, success: successMessage });
});

router.get("/registrocancelar", (req, res) => {
  res.render("login");
});
router.get("/grafo", (req, res) => {
  res.render("grafo");
});
//cargar los usuarios en la venta users
router.get("/users", (req, res) => {
  conexion.query("SELECT * FROM usuario", (error, result) => {
    if (error) {
      throw error;
    } else {
      res.render("users", { result: result });
    }
  });
});
//carga los nodos en la tabla de la ventana index
router.get("/index", (req, res) => {
  conexion.query("SELECT * FROM nodo", (error, result) => {
    if (error) {
      throw error;
    } else {
      res.render("index", { result: result });
    }
  });
});
//carga los nodos en la tabla de la ventana cliente
router.get("/client", (req, res) => {
  conexion.query("SELECT * FROM nodo", (error, result) => {
    if (error) {
      throw error;
    } else {
      res.render("client", { result: result });
    }
  });
});
router.get("/registro", (req, res) => {
  const errorMessage = req.query.error;
  const successMessage = req.query.success;
  res.render("registro", {
    error: errorMessage,
    successMessage: successMessage,
  });
});

router.get("/calcular-camino", (req, res) => {
  const origen = req.query.origen;
  const destino = req.query.destino;

  construirGrafo((grafo) => {
    const camino = calcularCamino(origen, destino, grafo);
    res.send(camino);
  });
});

router.get("/nombrenodo", (req, res) => {
  const query = "SELECT id_nodo, nombre_nodo FROM nodo"; // Agregar id_nodo
  conexion.query(query, (error, result) => {
    if (error) {
      console.error("Error al ejecutar la consulta:", error);
      return res
        .status(500)
        .json({ error: "Error al obtener los nombres de los nodos" });
    }
    res.status(200).json(result); // Enviar todos los datos
  });
});
//Ruta para calcular el camino mas corto
router.get("/camino", (req, res) => {
  const query = "SELECT nombre_nodo, latitud, longitud FROM nodo";
  conexion.query(query, (error, result) => {
    if (error) {
      console.error("Error al ejecutar la consulta:", error);
      return res
        .status(500)
        .json({ error: "Error al obtener los datos de los nodos" });
    } else {
      const nodos = {};

      result.forEach((row) => {
        const nombre = row.nombre_nodo;
        const latitud = row.latitud;
        const longitud = row.longitud;
        nodos[nombre] = { latitud: latitud, longitud: longitud };
      });
      return res.json(nodos);
    }
  });
});
router.get("/nodo", (req, res) => {
  conexion.query("SELECT * FROM nodo", (error, result) => {
    if (error) {
      throw error;
    } else {
      res.json(result);
    }
  });
});

//ruta para crear nodos
router.get("/create", (req, res) => {
  res.render("create");
});

//ruta para agregar nodo
router.post("/guardar", (req, res) => {
  const { id_nodo, nombre_nodo, latitud, longitud } = req.body;

  // Insertar el nodo en la base de datos
  const query =
    "INSERT INTO nodo (nombre_nodo, descripcion, latitud, longitud) VALUES (?, ?, ?, ?)";
  conexion.query(
    query,
    [nombre_nodo, descripcion, latitud, longitud],
    (err, result) => {
      if (err) {
        throw err;
      }
      console.log("Nodo insertado:", results.insertId);
      res.render("/");
    }
  );
});
router.get("/editusuario/:id", (req, res) => {
  const id = req.params.id;
  conexion.query(
    "SELECT * FROM usuario WHERE id_usuario=?",
    [id],
    (error, result) => {
      if (error) {
        throw error;
      } else {
        res.render("editusers", { usuario: result[0] });
      }
    }
  );
});
//ruta para eliminar usuarios
router.get("/deleteuser/:id", (req, res) => {
  const id = req.params.id;
  conexion.query(
    "DELETE FROM usuario WHERE id_usuario = ?",
    [id],
    (error, result) => {
      if (error) {
        throw error;
      } else {
        res.redirect("/administrador");
      }
    }
  );
});
//ruta para editar nodos
router.get("/edit/:id", (req, res) => {
  const id = req.params.id;
  conexion.query(
    "SELECT * FROM nodo WHERE id_nodo=?",
    [id],
    (error, result) => {
      if (error) {
        throw error;
      } else {
        res.render("edit", { user: result[0] });
      }
    }
  );
});
//ruta para eliminar nodos
router.get("/delete/:id", (req, res) => {
  const id = req.params.id;
  conexion.query(
    "DELETE FROM nodo WHERE id_nodo = ?",
    [id],
    (error, result) => {
      if (error) {
        throw error;
      } else {
        res.redirect("/administrador");
      }
    }
  );
});
router.get("/conexion", (req, res) => {
  // Obtener la lista de nodos desde la base de datos
  conexion.query("SELECT id_nodo, nombre_nodo FROM nodo", (err, nodos) => {
    if (err) {
      console.error("Error al obtener la lista de nodos:", err);
      res.send("Error al obtener la lista de nodos");
      return;
    }
    res.render("conexiones", { nodos });
  });
});
router.post("/conexion", (req, res) => {
  const { nodo_origen_id, nodo_destino_id } = req.body;
  const verificaAristaSql =
    "SELECT * FROM aristas WHERE nodo_origen = ? AND nodo_destino = ?";
  conexion.query(
    verificaAristaSql,
    [nodo_origen_id, nodo_destino_id],
    (verificaErr, verificaResult) => {
      if (verificaErr) {
        console.error(
          "Error al verificar la existencia de la arista:",
          verificaErr
        );
        res.send("Error al verificar la existencia de la arista");
        return;
      }

      // Si la consulta devuelve resultados, significa que la arista ya existe
      if (verificaResult.length > 0) {
        res.send("La arista ya ha sido conectada previamente");
        return;
      }
      const sql = "SELECT latitud, longitud FROM nodo WHERE id_nodo IN (?, ?)";
      conexion.query(sql, [nodo_origen_id, nodo_destino_id], (err, rows) => {
        if (err) {
          console.error("Error al obtener las coordenadas de los nodos:", err);
          res.send("Error al obtener las coordenadas de los nodos");
          return;
        }
        if (rows.length !== 2) {
          res.send(
            "No se encontraron coordenadas para los nodos especificados"
          );
          return;
        }
        // Extraer las coordenadas de los nodos de origen y destino
        const coordenadasOrigen = {
          latitude: rows[0].latitud,
          longitude: rows[0].longitud,
        };
        const coordenadasDestino = {
          latitude: rows[1].latitud,
          longitude: rows[1].longitud,
        };
        // Calcular la distancia entre los nodos utilizando la fórmula de Haversine
        const distancia = geolib.getDistance(
          coordenadasOrigen,
          coordenadasDestino
        );
        const sql =
          "INSERT INTO aristas (nodo_origen, nodo_destino, distancia) VALUES (?, ?, ?)";
        conexion.query(
          sql,
          [nodo_origen_id, nodo_destino_id, distancia],
          (err, result) => {
            if (err) {
              console.error(
                "Error al insertar la conexión en la base de datos:",
                err
              );
              res.send("Error al insertar la conexión en la base de datos");
              return;
            }
            console.log("Conexión insertada en la base de datos");
          }
        );
      });
    }
  );
});

router.post("/reset-password-confirm", validacionLogin.resetPassword);
router.post("/reset-password", validacionLogin.resetpassword);
router.post("/login", validacionLogin.validate);
router.post("/saveregistro", crudRegistro.save);
router.post("/updateuser", crudRegistro.update);
router.post("/save", crud.save);
router.post("/update", crud.update);
router.post("/camino");
router.post("/CaminoMasCorto", crud.armarGrafoConexiones);

module.exports = router;
