// ===== ARCHIVO: src/utils/banner.js =====
const chalk = require('chalk') // Opcional: para colores en consola

function showBanner() {
  const banner = `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    🏢 SISTEMA DE GESTIÓN DE COMPRAS Y REQUISICIONES          ║
║                                                              ║
║    📋 API REST v1.0.0                                        ║
║    🔧 Node.js + Express + Sequelize + PostgreSQL            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `
  console.log(banner)
}

function showServerInfo(PORT, environment) {
  const baseUrl = `http://localhost:${PORT}`
  
  console.log('🚀 SERVIDOR INICIADO CORRECTAMENTE\n')
  
  console.log('📊 INFORMACIÓN DEL SERVIDOR:')
  console.log(`   🌍 Ambiente:    ${environment || 'development'}`)
  console.log(`   📡 Puerto:      ${PORT}`)
  console.log(`   🔗 URL Base:    ${baseUrl}`)
  console.log(`   🕐 Hora inicio: ${new Date().toLocaleString()}\n`)
  
  console.log('📚 ENDPOINTS PRINCIPALES:')
  console.log(`   📖 Documentación:  ${baseUrl}`)
  console.log(`   ❤️  Health Check:   ${baseUrl}/health`)
  console.log(`   🔐 Autenticación:  ${baseUrl}/api/auth/login`)
  console.log(`   📝 Solicitudes:    ${baseUrl}/api/solicitudes`)
  console.log(`   👥 Usuarios:       ${baseUrl}/api/usuarios`)
  console.log(`   🏭 Proveedores:    ${baseUrl}/api/proveedores`)
  console.log(`   📊 Reportes:       ${baseUrl}/api/reportes\n`)
  
  console.log('🧪 PRUEBAS RÁPIDAS:')
  console.log(`   curl ${baseUrl}`)
  console.log(`   curl ${baseUrl}/health\n`)
  
  console.log('👤 USUARIO ADMINISTRADOR:')
  console.log('   📧 Email: admin@empresa.com')
  console.log('   🔑 Pass:  admin123\n')
  
  console.log('💡 COMANDOS ÚTILES:')
  console.log('   🔄 Reiniciar:     npm run dev')
  console.log('   🧪 Pruebas:      npm test')
  console.log('   🛑 Detener:      Ctrl + C\n')
  
  console.log('=' * 65)
  console.log('🎉 ¡Listo para usar! Abre tu navegador en:', baseUrl)
  console.log('=' * 65 + '\n')
}

// Versión con colores (si instalas chalk)
function showColoredServerInfo(PORT, environment) {
  const baseUrl = `http://localhost:${PORT}`
  
  console.log(chalk.green.bold('🚀 SERVIDOR INICIADO CORRECTAMENTE\n'))
  
  console.log(chalk.cyan('📊 INFORMACIÓN DEL SERVIDOR:'))
  console.log(`   🌍 Ambiente:    ${chalk.yellow(environment || 'development')}`)
  console.log(`   📡 Puerto:      ${chalk.yellow(PORT)}`)
  console.log(`   🔗 URL Base:    ${chalk.blue.underline(baseUrl)}`)
  console.log(`   🕐 Hora inicio: ${chalk.gray(new Date().toLocaleString())}\n`)
  
  console.log(chalk.cyan('📚 ENDPOINTS PRINCIPALES:'))
  console.log(`   📖 Documentación:  ${chalk.blue.underline(baseUrl)}`)
  console.log(`   ❤️  Health Check:   ${chalk.blue.underline(baseUrl + '/health')}`)
  console.log(`   🔐 Autenticación:  ${chalk.blue.underline(baseUrl + '/api/auth/login')}`)
  console.log(`   📝 Solicitudes:    ${chalk.blue.underline(baseUrl + '/api/solicitudes')}\n`)
  
  console.log(chalk.cyan('👤 USUARIO ADMINISTRADOR:'))
  console.log(`   📧 Email: ${chalk.green('admin@empresa.com')}`)
  console.log(`   🔑 Pass:  ${chalk.green('admin123')}\n`)
  
  console.log(chalk.red('💡 Para detener el servidor: Ctrl + C\n'))
  console.log(chalk.green.bold('🎉 ¡Listo para usar!'))
}

module.exports = {
  showBanner,
  showServerInfo,
  showColoredServerInfo
}

// ===== VERSIÓN SIMPLE SIN DEPENDENCIAS EXTRA =====
// Si no quieres instalar chalk, usa esta versión en server.js:

function simpleServerInfo(PORT, environment) {
  const baseUrl = `http://localhost:${PORT}`
  
  console.log('\n' + '='.repeat(65))
  console.log('🚀 SISTEMA DE GESTIÓN DE COMPRAS - API REST')
  console.log('='.repeat(65))
  console.log(`🌍 Ambiente: ${environment || 'development'}`)
  console.log(`📡 Puerto: ${PORT}`)
  console.log(`🔗 URL: ${baseUrl}`)
  console.log(`🕐 Iniciado: ${new Date().toLocaleString()}`)
  console.log('\n📚 ENDPOINTS:')
  console.log(`   📖 Documentación: ${baseUrl}`)
  console.log(`   ❤️  Health Check: ${baseUrl}/health`)
  console.log(`   🔐 Login: ${baseUrl}/api/auth/login`)
  console.log('\n👤 ADMIN:')
  console.log('   📧 admin@empresa.com')
  console.log('   🔑 admin123')
  console.log('\n💡 Abre tu navegador en: ' + baseUrl)
  console.log('🛑 Para detener: Ctrl + C')
  console.log('='.repeat(65) + '\n')
}

// Exportar la función simple también
module.exports.simpleServerInfo = simpleServerInfo