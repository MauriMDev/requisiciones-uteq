// ===== SCRIPT PARA GENERAR HASH CORRECTO =====
const bcrypt = require('bcryptjs')

const generateCorrectHash = async () => {
  console.log('🔐 GENERANDO HASH CORRECTO PARA admin123...\n')
  
  const password = 'admin123'
  
  try {
    // Generar nuevo hash
    const newHash = await bcrypt.hash(password, 12)
    
    console.log('✅ HASH GENERADO CORRECTAMENTE:')
    console.log('Password:', password)
    console.log('Nuevo Hash:', newHash)
    
    // Verificar que funciona
    const verification = await bcrypt.compare(password, newHash)
    console.log('Verificación:', verification ? '✅ CORRECTO' : '❌ ERROR')
    
    console.log('\n📝 SQL PARA ACTUALIZAR LA BASE DE DATOS:')
    console.log(`UPDATE usuarios SET password_hash = '${newHash}' WHERE correo_institucional = 'admin@empresa.com';`)
    
    console.log('\n🔄 TAMBIÉN PUEDES COPIAR ESTE HASH DIRECTAMENTE:')
    console.log(newHash)
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Ejecutar
generateCorrectHash()

// También probar con el hash incorrecto actual
const testCurrentHash = async () => {
  console.log('\n🔍 PROBANDO HASH ACTUAL (INCORRECTO):')
  
  const wrongHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqyqX0fhGCK.PksOJZGfFMW'
  const password = 'admin123'
  
  const result = await bcrypt.compare(password, wrongHash)
  console.log('Password "admin123" vs hash actual:', result ? '✅ CORRECTO' : '❌ INCORRECTO')
  
  // Probar otras contraseñas comunes
  const commonPasswords = ['admin', 'password', '123456', 'Admin123', 'ADMIN123']
  
  console.log('\n🔍 PROBANDO OTRAS CONTRASEÑAS COMUNES:')
  for (const testPass of commonPasswords) {
    const testResult = await bcrypt.compare(testPass, wrongHash)
    console.log(`"${testPass}":`, testResult ? '✅ CORRECTA' : '❌ incorrecta')
  }
}

testCurrentHash()