// middleware/uploadMiddleware.js
const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const cloudinary = require('cloudinary').v2

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Configuración de almacenamiento en Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    let folder = 'requisiciones/general'
    if (req.originalUrl.includes('solicitud')) {
      folder = 'requisiciones/solicitudes'
    } else if (req.originalUrl.includes('compra')) {
      folder = 'requisiciones/compras'
    }

    console.log(`📁 Subiendo archivo: ${file.originalname}`)
    console.log(`📝 Tipo MIME: ${file.mimetype}`)
    console.log(`📂 Carpeta: ${folder}`)

    const timestamp = Date.now()
    const randomNum = Math.round(Math.random() * 1e9)
    const publicId = `${timestamp}-${randomNum}`

    const isPdf = file.mimetype === 'application/pdf'

    return {
      folder,
      resource_type: isPdf ? 'raw' : 'auto', // PDFs como raw
      public_id: publicId,
      format: isPdf ? 'pdf' : undefined, // asegura extensión
      use_filename: false,
      unique_filename: false,
      access_mode: 'public'
      // 🚫 NO ponemos flags: 'attachment' para que no se descargue automáticamente
    }
  }
})

// Filtro para solo PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    console.log(`✅ PDF permitido: ${file.originalname}`)
    cb(null, true)
  } else {
    console.log(`❌ Archivo rechazado: ${file.originalname} (${file.mimetype})`)
    cb(new Error(`Solo se permiten archivos PDF. Recibido: ${file.mimetype}`), false)
  }
}

// Configuración de multer con Cloudinary
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5
  }
})

// Función para generar la URL correcta
const generateCorrectUrl = (cloudinaryResult) => {
  console.log('🔗 Resultado de Cloudinary:', cloudinaryResult)

  if (cloudinaryResult.resource_type === 'raw' && cloudinaryResult.format === 'pdf') {
    const { public_id, version, format } = cloudinaryResult
    const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload`
    return `${baseUrl}/v${version}/${public_id}.${format}`
  }
  return cloudinaryResult.secure_url
}

// Eliminar archivo de Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = 'raw') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    })
    console.log('Archivo eliminado de Cloudinary:', result)
    return result
  } catch (error) {
    console.error('Error eliminando archivo de Cloudinary:', error)
    throw error
  }
}

// Manejo de errores de multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. Tamaño máximo: 10MB'
      })
    }
    return res.status(400).json({
      success: false,
      message: `Error de upload: ${error.message}`
    })
  }

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    })
  }

  next()
}

// Procesar resultado después del upload
const processUploadResult = (req, res, next) => {
  if (req.files && req.files.length > 0) {
    req.files.forEach((file, index) => {
      console.log(`📄 Archivo ${index + 1} procesado:`)
      console.log('- Nombre original:', file.originalname)
      console.log('- Public ID:', file.filename || file.public_id)
      console.log('- URL original:', file.path)

      // Generar URL correcta
      const correctUrl = generateCorrectUrl(file)
      console.log('- URL corregida:', correctUrl)

      file.path = correctUrl
      file.url = correctUrl
    })
  }
  next()
}

// Exportaciones
module.exports = upload
module.exports.deleteFromCloudinary = deleteFromCloudinary
module.exports.cloudinary = cloudinary
module.exports.generateCorrectUrl = generateCorrectUrl
module.exports.handleUploadError = handleUploadError
module.exports.processUploadResult = processUploadResult
