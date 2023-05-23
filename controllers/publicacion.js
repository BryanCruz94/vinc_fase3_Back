const { calcularDistancia } = require("../helpers/calcular-distancia");
const { subirArchivo } = require("../helpers/subir-archivo");
const Publicacion = require("../models/publicacion");
const Usuario = require("../models/usuario");

const obtenerPublicacionesUsuario = async (req, res) => {
  const usuarioId = req.uid; // ID del usuario obtenido del token de autenticación

  try {
    const publicaciones = await Publicacion.find({ usuario: usuarioId });

    res.json({
      ok: true,
      publicaciones,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      msg: "Por favor hable con el administrador",
    });
  }
};

const guardarPublicacion = async (req, res) => {
  const usuarioId = req.uid;
  const nombres = [];
  const {
    titulo,
    contenido,
    color,
    ciudad,
    barrio,
    isPublic,
    imagenes,
    imgAlerta,
    latitud,
    longitud,
  } = req.body;

  try {
    const publicacion = new Publicacion({
      titulo,
      contenido,
      color,
      ciudad,
      barrio,
      isPublic,
      usuario: usuarioId,
      imagenes,
      imgAlerta,
      latitud,
      longitud,
    });

    const archivo = req.files?.archivo;

    if (archivo !== undefined && archivo !== null) {
      if (Array.isArray(archivo)) {
        for (const file of archivo) {
          const nombre = await subirArchivo(
            file,
            undefined,
            "publicaciones/" + titulo.replace(/\s/g, "")
          );
          publicacion.imagenes.push(nombre);
          nombres.push(nombre);
        }
      } else {
        const nombre = await subirArchivo(
          archivo,
          undefined,
          "publicaciones/" + titulo.replace(/\s/g, "")
        );
        publicacion.imagenes.push(nombre);
        nombres.push(nombre);
      }
    }

    await publicacion.save();

    res.json({
      ok: true,
      publicacion,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      msg: "Por favor hable con el administrador",
    });
  }
};

const guardarListArchivo = async (req, res) => {
  const nombres = [];
  const { titulo, uid } = req.params;
  // console.log(req.params);
  const archivo = req.files?.archivo;

  try {
    const publicacion = await Publicacion.findById(uid);

    if (!publicacion) {
      return res.status(404).json({ mensaje: "Publicación no encontrada" });
    }
    if (archivo !== undefined && archivo !== null) {
      if (Array.isArray(archivo)) {
        for (const file of archivo) {
          const nombre = await subirArchivo(
            file,
            undefined,
            "publicaciones/" + titulo.replace(/\s/g, "")
          );
          if (!publicacion.imagenes) {
            publicacion.imagenes = []; // Inicializar como un array vacío si es nulo
          }
          publicacion.imagenes.push(nombre);
          nombres.push(nombre);
        }
      } else {
        const nombre = await subirArchivo(
          archivo,
          undefined,
          "publicaciones/" + titulo.replace(/\s/g, "")
        );
        if (!publicacion.imagenes) {
          publicacion.imagenes = []; // Inicializar como un array vacío si es nulo
        }
        publicacion.imagenes.push(nombre);
        nombres.push(nombre);
      }
    }

    await publicacion.save();

    res.json({
      ok: true,
      publicacion,
      nombres,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      msg: "Por favor hable con el administrador",
    });
  }
};

const likePublicacion = async (req, res) => {
  try {
    const publicacionId = req.params.id;

    // Verificar si la publicación existe
    const publicacion = await Publicacion.findById(publicacionId);
    if (!publicacion) {
      return res.status(404).json({ error: "Publicación no encontrada" });
    }

    // Incrementar el contador de likes
    publicacion.likes += 1;
    await publicacion.save();

    res.status(200).json({ likes: publicacion.likes });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Error al incrementar el contador de likes" });
  }
};

const dislikePublicacion = async (req, res) => {
  try {
    const publicacionId = req.params.id;

    // Verificar si la publicación existe
    const publicacion = await Publicacion.findById(publicacionId);
    if (!publicacion) {
      return res.status(404).json({ error: "Publicación no encontrada" });
    }

    // Verificar si el contador de likes es mayor a cero antes de decrementar
    if (publicacion.likes > 0) {
      publicacion.likes -= 1;
      await publicacion.save();
    }

    res.status(200).json({ likes: publicacion.likes });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Error al decrementar el contador de likes" });
  }
};
const getPublicacionesEnRadio = async (req, res) => {
  const radio = 1.8603572982599163; // Radio en kilómetros

  try {
    const usuario = await Usuario.findById(req.uid);

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    let publicacionesEnRadio;

    if (
      usuario.direcciones.length > 0 &&
      usuario.direcciones[0].latitud &&
      usuario.direcciones[0].longitud
    ) {
      // Si el usuario tiene latitud y longitud en al menos una dirección, filtrar las publicaciones dentro del radio
      publicacionesEnRadio = await Publicacion.find({
        latitud: { $exists: true },
        longitud: { $exists: true },
      }).exec();

      publicacionesEnRadio = publicacionesEnRadio.filter((publicacion) => {
        return usuario.direcciones.some((direccion) => {
          const distancia = calcularDistancia(
            publicacion.latitud,
            publicacion.longitud,
            direccion.latitud,
            direccion.longitud
          );

          return distancia <= radio;
        });
      });
    } else {
      // Si el usuario no tiene latitud y longitud en ninguna dirección, obtener todas las publicaciones
      publicacionesEnRadio = await Publicacion.find().exec();
    }

    res.json({
      ok: true,
      publicaciones: publicacionesEnRadio,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener las publicaciones." });
  }
};

module.exports = {
  obtenerPublicacionesUsuario,
  guardarPublicacion,
  getPublicacionesEnRadio,
  likePublicacion,
  dislikePublicacion,
  guardarListArchivo,
};
