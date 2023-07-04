const { Publicacion, Sala, Mensaje, Usuario, Comentario } = require("../models");

const usuarioConectado = async (uid = "") => {
  if (!uid) return null;

  const usuario = await Usuario.findById(uid);
  if (!usuario) return null;

  usuario.online = true;
  await usuario.save();
  return usuario;
};

const usuarioDesconectado = async (uid = "") => {
  if (!uid) return null;

  const usuario = await Usuario.findById(uid);
  if (!usuario) return null; 
  usuario.online = false;
  await usuario.save();
  return usuario;
};

const grabarMensaje = async (payload) => {
  // payload: {
  //     de: '',
  //     para: '',
  //     texto: ''
  // }

  try {
    console.log(payload);
    const mensaje = new Mensaje(payload);
    await mensaje.save();

    return true;
  } catch (error) {
    return false;
  }
};

const grabarMensajeSala = async (payload) => {
  try {
    console.log(payload);
    const { mensaje, de, para } = payload;
    const sala = await Sala.findById(para);

    const newMessage = new Mensaje({ mensaje, usuario: de });
    await newMessage.save();

    sala.mensajes.push(newMessage._id);
    await sala.save();

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

//grabarComentarioPublicacion
// const grabarComentarioPublicacion = async (payload) => {
//   try {
//     const { mensaje, usuario, publicacion } = payload;

//     // Crear el comentario
//     const comentario = new Comentario({
//       mensaje,
//       usuario,
//       publicacion,
//       estado: "publicado",
//     });

//     // Guardar el comentario en la base de datos
//     await comentario.save();

//     // Agregar el comentario a la publicación
//     const publicacionActualizada = await Publicacion.findByIdAndUpdate(
//       publicacion,
//       { $push: { comentarios: comentario._id } },
//       { new: true }
//     );

//     return true;
//   } catch (error) {
//     console.log(error);
//     return false;
//   }
// };


const grabarComentarioPublicacion = async (payload) => {

  const usuarioId = payload.de;
try {
  const { mensaje, para } = payload;
console.log(payload);
  // Verificar si la publicación existe
  const publicacion = await Publicacion.findById(para);
  if (!publicacion) {
    return res.status(404).json({ error: "Publicación no encontrada" });
  }

  // Crear el nuevo comentario
  const comentario = new Comentario({
    contenido: mensaje,
    usuario: usuarioId,
    publicacion: para,
    estado: "publicado",
  });

  console.log(comentario);

  await comentario.save();

  // Agregar el comentario a la lista de comentarios de la publicación
  publicacion.comentarios.push(comentario._id);
  await publicacion.save();

  return true;
} catch (error) {
  console.error(error);
  return false;
}
};
module.exports = {
  usuarioConectado,
  usuarioDesconectado,
  grabarMensaje,
  grabarMensajeSala,
  grabarComentarioPublicacion,
};
