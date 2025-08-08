// middleware/uploadMiddleware.js
const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Función para crear directorios si no existen
const ensureDirExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

// Configuración de almacenamiento con detección automática
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Detectar si es solicitud o compra basado en la URL
    let uploadPath
    
    if (req.originalUrl.includes('solicitud')) {
      uploadPath = 'uploads/solicitudes/'
    } else if (req.originalUrl.includes('compra')) {
      uploadPath = 'uploads/compras/'
    } else {
      // Fallback para otros casos
      uploadPath = 'uploads/general/'
    }
    
    // Crear el directorio si no existe
    ensureDirExists(uploadPath)
    
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

// Filtros de archivo (mismo que tenías)
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Tipo de archivo no permitido'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // máximo 5 archivos
  }
})

// Crear directorios necesarios al inicializar
ensureDirExists('uploads/solicitudes')
ensureDirExists('uploads/compras')
ensureDirExists('uploads/general')

module.exports = upload