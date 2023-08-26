const conexion = require("../database/db");

exports.save = (req, res) => {
  const nombre = req.body.nombre;
  const descripcion = req.body.descripcion;
  const latitud = req.body.latitud;
  const longitud = req.body.longitud;

  console.log("Nombre del nodo:", nombre);
  console.log("Descripción:", descripcion);
  console.log("Latitud:", latitud);
  console.log("Longitud:", longitud);

  conexion.query(
    "INSERT INTO nodo SET ?",
    {
      nombre_nodo: nombre,
      descripcion: descripcion,
      latitud: latitud,
      longitud: longitud,
    },
    (error, results) => {
      if (error) {
        console.log(error);
        res.status(500).json({ message: "Error al guardar el bloque" });
      } else {
      }
    }
  );
};

exports.update = (req, res) => {
  const id = req.body.id;
  const nombre = req.body.nombre;
  const descripcion = req.body.descripcion;
  const latitud = req.body.latitud;
  const longitud = req.body.longitud;
  conexion.query(
    "UPDATE nodo SET ? WHERE id_nodo = ?",
    [
      {
        nombre_nodo: nombre,
        descripcion: descripcion,
        latitud: latitud,
        longitud: longitud,
      },
      id,
    ],
    (error, result) => {
      if (error) {
        console.log(error);
        res.status(500).json({ message: "Error al actulizar el bloque" });
      } else {
      }
    }
  );
};
exports.armarGrafoConexiones = (req, res) => {
  const queryNodos = "SELECT * FROM nodo";
  conexion.query(queryNodos, (err, nodosResultados) => {
    if (err) {
      console.error("Error al obtener los nodos:", err);
      return;
    }
    const queryConexiones =
      "SELECT id_arista, nodo_origen, nodo_destino, distancia FROM aristas";
    conexion.query(queryConexiones, (err, conexionesResultados) => {
      if (err) {
        console.error("Error al obtener las conexiones:", err);
        return;
      }
      // Construye el grafo a partir de los resultados de las consultas
      const grafo = {};
      // Agrega nodos al grafo
      nodosResultados.forEach((nodo) => {
        const nodoId = nodo.id_nodo;
        grafo[nodoId] = {
          nombre: nodo.nombre_nodo,
          latitud: nodo.latitud,
          longitud: nodo.longitud,
          conexiones: [],
        };
      });
      // Agrega conexiones al grafo
      conexionesResultados.forEach((conexion) => {
        grafo[conexion.nodo_origen].conexiones.push({
          destino: conexion.nodo_destino,
          distancia: conexion.distancia,
        });
      });
      // Ejecutar el algoritmo de Dijkstra
      const nodoOrigen = req.body.origenId;
      const nodoDestino = req.body.destinoId;
      const rutaMasCorta = ejecutarDijkstra(grafo, nodoOrigen, nodoDestino);
      res.status(200).json({ ruta: rutaMasCorta });
      console.log("Ruta más corta:", rutaMasCorta);
    });
  });
};
function ejecutarDijkstra(grafo, nodoOrigen, nodoDestino) {
  // Crear un conjunto para almacenar los nodos visitados
  const visitados = {};

  // Crear un objeto para almacenar las distancias desde el nodo de origen
  const distancias = {};
  for (const nodo in grafo) {
    distancias[nodo] = Infinity;
  }
  distancias[nodoOrigen] = 0;

  // Crear un objeto para almacenar las rutas
  const rutas = {};

  // Función auxiliar para encontrar el nodo con la distancia más corta no visitado
  function encontrarNodoMinimo(distancias, visitados) {
    let nodoMinimo = null;
    for (const nodo in distancias) {
      if (
        !visitados[nodo] &&
        (nodoMinimo === null || distancias[nodo] < distancias[nodoMinimo])
      ) {
        nodoMinimo = nodo;
      }
    }
    return nodoMinimo;
  }

  // Comenzar el algoritmo de Dijkstra
  while (true) {
    const nodoActual = encontrarNodoMinimo(distancias, visitados);
    if (nodoActual === null) {
      console.log("Todos los nodos han sido visitados");
      break; // Todos los nodos han sido visitados
    }
    console.log("Visitando nodo:", nodoActual);
    visitados[nodoActual] = true;

    for (const conexion of grafo[nodoActual].conexiones) {
      const distanciaHastaVecino = distancias[nodoActual] + conexion.distancia;
      if (distanciaHastaVecino < distancias[conexion.destino]) {
        distancias[conexion.destino] = distanciaHastaVecino;
        rutas[conexion.destino] = nodoActual;
      }
    }
  }

  const ruta = [];
  let nodoActual = nodoDestino;
  while (nodoActual !== nodoOrigen) {
    const nodoInfo = grafo[nodoActual];
    ruta.unshift({
      nombre: nodoInfo.nombre,
      latitud: nodoInfo.latitud,
      longitud: nodoInfo.longitud,
    });
    nodoActual = rutas[nodoActual];
  }
  const nodoOrigenInfo = grafo[nodoOrigen];
  ruta.unshift({
    nombre: nodoOrigenInfo.nombre,
    latitud: nodoOrigenInfo.latitud,
    longitud: nodoOrigenInfo.longitud,
  });

  return ruta;
}
