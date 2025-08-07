// middleware/uploadMiddleware.js
const multer = require('multer')
const path = require('path')

// Tu configuración actual (storage, fileFilter, etc.) está bien...
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/solicitudes/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

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
    fileSize: 10 * 1024 * 1024,
    files: 5
  }
})

// AQUÍ ESTÁ EL CAMBIO - Exporta métodos específicos:
module.exports = {
  single: (fieldName) => upload.single(fieldName),
  multiple: (fieldName, maxCount) => upload.array(fieldName, maxCount),
  fields: (fields) => upload.fields(fields),
  any: () => upload.any() // Para cualquier campo (menos seguro)
}