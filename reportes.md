# 📋 EJEMPLOS DE REQUESTS - MÓDULO DE REPORTES

## 🔐 **AUTENTICACIÓN PREVIA**

Antes de usar cualquier endpoint, necesitas obtener un token:

```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "correo_institucional": "admin@uteq.edu.mx",
  "password": "tu_password"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": { ... }
  }
}
```

---

## 🏥 **1. VERIFICACIÓN DEL SISTEMA**

### Health Check
```http
GET http://localhost:3000/reportes/health
Authorization: Bearer tu_token_aqui
```

**Respuesta esperada:**
```json
{
  "success": true,
  "status": "healthy",
  "data": {
    "database_connection": "ok",
    "total_solicitudes": 150,
    "total_compras": 75,
    "endpoints_disponibles": {
      "compras": 4,
      "solicitudes": 3,
      "dashboard": 2,
      "exportacion": 2,
      "filtros": 1,
      "total": 12
    },
    "version": "1.0.0",
    "timestamp": "2025-07-31T10:30:00.000Z"
  }
}
```

### Filtros Configurables
```http
GET http://localhost:3000/reportes/filtros/configurables
Authorization: Bearer tu_token_aqui
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "departamentos": [
      {
        "id": 1,
        "nombre": "Tecnología",
        "codigo": "TEC"
      },
      {
        "id": 2,
        "nombre": "Administración",
        "codigo": "ADM"
      }
    ],
    "proveedores": [
      {
        "id": 1,
        "nombre": "Proveedor Ejemplo SA",
        "rfc": "PRO123456789"
      }
    ],
    "opciones_estatus": {
      "solicitudes": ["pendiente", "en_revision", "aprobada", "denegada", "en_proceso", "completada"],
      "compras": ["ordenada", "en_transito", "entregada", "cancelada"]
    },
    "opciones_urgencia": ["baja", "media", "alta", "critica"],
    "opciones_tipo_requisicion": ["productos", "servicios", "mantenimiento"],
    "opciones_periodo": ["diario", "semanal", "mensual", "anual"],
    "opciones_criterio_ranking": ["volumen", "frecuencia", "calificacion"],
    "formatos_exportacion": ["pdf", "xlsx", "csv"]
  }
}
```

---

## 🛒 **2. REPORTES DE COMPRAS**

### 2.1 Compras por Período - Básico (Último Cuatrimestre)
```http
GET http://localhost:3000/reportes/compras/periodo?fecha_inicio=2025-05-01&fecha_fin=2025-07-30
Authorization: Bearer tu_token_aqui
```

### 2.2 Compras por Período - Con Filtros
```http
GET http://localhost:3000/reportes/compras/periodo?fecha_inicio=2025-05-01&fecha_fin=2025-07-30&departamento_id=1&periodo=mensual&estatus=entregada&proveedor_id=2
Authorization: Bearer tu_token_aqui
```

### 2.3 Compras por Período - Solo Últimos 2 Meses
```http
GET http://localhost:3000/reportes/compras/periodo?fecha_inicio=2025-06-01&fecha_fin=2025-07-30&periodo=mensual
Authorization: Bearer tu_token_aqui
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "compras": [
      {
        "id_compra": 1,
        "numero_orden": "ORD-2025-045",
        "proveedor": "Proveedor Ejemplo SA",
        "departamento": "Tecnología",
        "solicitante": "Juan Pérez",
        "fecha_compra": "2025-07-15T00:00:00.000Z",
        "monto_total": 15000.00,
        "estatus": "entregada"
      }
    ],
    "tendencia_periodo": [
      {
        "periodo": "2025-05",
        "cantidad_compras": 8,
        "monto_total": 52000.00,
        "promedio_compra": 6500.00
      },
      {
        "periodo": "2025-06",
        "cantidad_compras": 12,
        "monto_total": 78000.00,
        "promedio_compra": 6500.00
      },
      {
        "periodo": "2025-07",
        "cantidad_compras": 15,
        "monto_total": 95000.00,
        "promedio_compra": 6333.33
      }
    ],
    "resumen": {
      "total_compras": 225000.00,
      "cantidad_compras": 35,
      "promedio_compra": 6428.57
    }
  }
}
```

### 2.4 Compras por Departamentos (Último Cuatrimestre)
```http
GET http://localhost:3000/reportes/compras/departamentos?fecha_inicio=2025-05-01&fecha_fin=2025-07-30
Authorization: Bearer tu_token_aqui
```

### 2.5 Compras por Departamentos - Específicos
```http
GET http://localhost:3000/reportes/compras/departamentos?fecha_inicio=2025-05-01&fecha_fin=2025-07-30&departamento_ids=[1,2,3]
Authorization: Bearer tu_token_aqui
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "compras_por_departamento": [
      {
        "departamento": "Tecnología",
        "codigo": "TEC",
        "cantidad_compras": 20,
        "monto_total": 135000.00,
        "promedio_compra": 6750.00
      },
      {
        "departamento": "Administración",
        "codigo": "ADM",
        "cantidad_compras": 15,
        "monto_total": 90000.00,
        "promedio_compra": 6000.00
      }
    ],
    "total_departamentos": 2,
    "resumen_general": {
      "monto_total_global": 225000.00,
      "cantidad_total_compras": 35
    }
  }
}
```

### 2.6 Compras - Endpoint de Compatibilidad
```http
GET http://localhost:3000/reportes/compras?fecha_inicio=2025-05-01&fecha_fin=2025-07-30
Authorization: Bearer tu_token_aqui
```

---

## 🏪 **3. REPORTES DE PROVEEDORES**

### 3.1 Ranking por Volumen (Último Cuatrimestre)
```http
GET http://localhost:3000/reportes/proveedores/ranking?fecha_inicio=2025-05-01&fecha_fin=2025-07-30&criterio=volumen&limite=10
Authorization: Bearer tu_token_aqui
```

### 3.2 Ranking por Frecuencia
```http
GET http://localhost:3000/reportes/proveedores/ranking?fecha_inicio=2025-05-01&fecha_fin=2025-07-30&criterio=frecuencia&limite=5
Authorization: Bearer tu_token_aqui
```

### 3.3 Ranking por Calificación
```http
GET http://localhost:3000/reportes/proveedores/ranking?fecha_inicio=2025-05-01&fecha_fin=2025-07-30&criterio=calificacion&limite=15
Authorization: Bearer tu_token_aqui
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "ranking": [
      {
        "proveedor": "Proveedor Top SA",
        "rfc": "TOP123456789",
        "frecuencia_uso": 18,
        "volumen_compras": 95000.00,
        "promedio_orden": 5277.78,
        "calificacion_promedio": 4.8
      },
      {
        "proveedor": "Segundo Proveedor SC",
        "rfc": "SEG987654321",
        "frecuencia_uso": 12,
        "volumen_compras": 72000.00,
        "promedio_orden": 6000.00,
        "calificacion_promedio": 4.5
      }
    ],
    "criterio_ordenamiento": "volumen",
    "total_proveedores": 8,
    "resumen": {
      "volumen_total": 225000.00,
      "ordenes_totales": 35
    }
  }
}
```

### 3.4 Cumplimiento de Entregas - General (Último Cuatrimestre)
```http
GET http://localhost:3000/reportes/entregas/cumplimiento?fecha_inicio=2025-05-01&fecha_fin=2025-07-30
Authorization: Bearer tu_token_aqui
```

### 3.5 Cumplimiento de Entregas - Proveedor Específico
```http
GET http://localhost:3000/reportes/entregas/cumplimiento?fecha_inicio=2025-05-01&fecha_fin=2025-07-30&proveedor_id=1
Authorization: Bearer tu_token_aqui
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "analisis_detallado": [
      {
        "numero_orden": "ORD-2025-035",
        "proveedor": "Proveedor Ejemplo SA",
        "fecha_estimada": "2025-07-20T00:00:00.000Z",
        "fecha_real": "2025-07-18T00:00:00.000Z",
        "dias_diferencia": -2,
        "entrega_a_tiempo": true,
        "estatus": "entregada"
      }
    ],
    "ranking_cumplimiento": [
      {
        "proveedor": "Proveedor Puntual SA",
        "porcentaje_cumplimiento": "93.33",
        "promedio_dias_retraso": "0.8",
        "total_entregas": 15,
        "entregas_completadas": 14
      }
    ],
    "resumen_general": {
      "total_ordenes": 35,
      "entregas_a_tiempo": 30,
      "porcentaje_cumplimiento_global": "85.71"
    }
  }
}
```

---

## 📝 **4. REPORTES DE SOLICITUDES**

### 4.1 Solicitudes por Estatus - Básico (Último Cuatrimestre)
```http
GET http://localhost:3000/reportes/solicitudes/estatus?fecha_inicio=2025-05-01&fecha_fin=2025-07-30
Authorization: Bearer tu_token_aqui
```

### 4.2 Solicitudes por Estatus - Con Tiempos
```http
GET http://localhost:3000/reportes/solicitudes/estatus?fecha_inicio=2025-05-01&fecha_fin=2025-07-30&incluir_tiempos=true
Authorization: Bearer tu_token_aqui
```

### 4.3 Solicitudes por Estatus - Filtrado
```http
GET http://localhost:3000/reportes/solicitudes/estatus?fecha_inicio=2025-05-01&fecha_fin=2025-07-30&estatus=pendiente&departamento_id=1&urgencia=alta
Authorization: Bearer tu_token_aqui
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "solicitudes": [
      {
        "folio_solicitud": "SOL-2025-078",
        "solicitante": "María García",
        "departamento": "Administración",
        "fecha_creacion": "2025-07-01T00:00:00.000Z",
        "estatus": "aprobada",
        "tipo_requisicion": "productos",
        "urgencia": "media",
        "tiempo_aprobacion_dias": 3,
        "numero_aprobaciones": 2
      }
    ],
    "distribucion_estatus": [
      {
        "estatus": "pendiente",
        "cantidad": 8
      },
      {
        "estatus": "aprobada",
        "cantidad": 25
      },
      {
        "estatus": "completada",
        "cantidad": 20
      },
      {
        "estatus": "en_proceso",
        "cantidad": 12
      }
    ],
    "estadisticas_tiempo": {
      "promedio_dias_aprobacion": 3.8,
      "solicitudes_con_aprobacion": 45,
      "tiempo_minimo": 1,
      "tiempo_maximo": 12
    }
  }
}
```

### 4.4 Solicitudes - Endpoint de Compatibilidad
```http
GET http://localhost:3000/reportes/solicitudes?fecha_inicio=2025-05-01&fecha_fin=2025-07-30
Authorization: Bearer tu_token_aqui
```

### 4.5 Cuellos de Botella - Resumen (Último Cuatrimestre)
```http
GET http://localhost:3000/reportes/solicitudes/cuellos-botella?fecha_inicio=2025-05-01&fecha_fin=2025-07-30&nivel_detalle=resumen
Authorization: Bearer tu_token_aqui
```

### 4.6 Cuellos de Botella - Detallado
```http
GET http://localhost:3000/reportes/solicitudes/cuellos-botella?fecha_inicio=2025-05-01&fecha_fin=2025-07-30&nivel_detalle=detallado
Authorization: Bearer tu_token_aqui
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "cuellos_botella": [
      {
        "aprobador": "Carlos Rodríguez",
        "departamento": "Administración",
        "total_aprobaciones": 18,
        "promedio_dias_respuesta": 6.2
      },
      {
        "aprobador": "Ana López",
        "departamento": "Tecnología",
        "total_aprobaciones": 12,
        "promedio_dias_respuesta": 2.8
      }
    ],
    "solicitudes_estancadas": [
      {
        "folio_solicitud": "SOL-2025-089",
        "solicitante": "Pedro Martínez",
        "departamento": "Finanzas",
        "fecha_creacion": "2025-07-10T00:00:00.000Z",
        "dias_estancada": 21,
        "estatus": "pendiente"
      }
    ],
    "analisis_etapas": [
      {
        "etapa": "pendiente",
        "cantidad_solicitudes": 8,
        "promedio_dias_etapa": 4.2
      },
      {
        "etapa": "en_revision",
        "cantidad_solicitudes": 6,
        "promedio_dias_etapa": 1.8
      }
    ],
    "recomendaciones": [
      "Revisar carga de trabajo de Carlos Rodríguez",
      "2 solicitudes requieren atención inmediata"
    ]
  }
}
```

---

## 📊 **5. DASHBOARD EJECUTIVO**

### 5.1 Dashboard Mensual (Julio 2025)
```http
GET http://localhost:3000/reportes/dashboard/ejecutivo?periodo=mes
Authorization: Bearer tu_token_aqui
```

### 5.2 Dashboard Semanal (Última Semana)
```http
GET http://localhost:3000/reportes/dashboard/ejecutivo?periodo=semana
Authorization: Bearer tu_token_aqui
```

### 5.3 Dashboard Diario (Hoy)
```http
GET http://localhost:3000/reportes/dashboard/ejecutivo?periodo=hoy
Authorization: Bearer tu_token_aqui
```

### 5.4 Dashboard Trimestral (Mayo-Julio 2025)
```http
GET http://localhost:3000/reportes/dashboard/ejecutivo?periodo=trimestre
Authorization: Bearer tu_token_aqui
```

### 5.5 Dashboard - Alias
```http
GET http://localhost:3000/reportes/dashboard?periodo=mes
Authorization: Bearer tu_token_aqui
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "total_solicitudes": {
        "valor": 65,
        "cambio_porcentual": "18.2"
      },
      "solicitudes_pendientes": {
        "valor": 8,
        "porcentaje_del_total": "12.3"
      },
      "total_compras": {
        "valor": 35,
        "cambio_porcentual": "12.9"
      },
      "monto_total_compras": {
        "valor": 225000.00,
        "cambio_porcentual": "22.1"
      }
    },
    "top_departamentos": [
      {
        "departamento": "Tecnología",
        "total_gasto": 135000.00,
        "cantidad_compras": 20
      },
      {
        "departamento": "Administración",
        "total_gasto": 90000.00,
        "cantidad_compras": 15
      }
    ],
    "alertas": [
      {
        "tipo": "warning",
        "mensaje": "8 solicitudes pendientes requieren atención"
      },
      {
        "tipo": "info",
        "mensaje": "Incremento del 22% en gastos vs trimestre anterior"
      }
    ],
    "periodo_analizado": "mes",
    "fecha_inicio": "2025-07-01T00:00:00.000Z",
    "fecha_fin": "2025-07-31T10:30:00.000Z"
  }
}
```

---

## 📤 **6. EXPORTACIÓN DE REPORTES**

### 6.1 Exportar PDF - Compras (Último Cuatrimestre)
```http
POST http://localhost:3000/reportes/exportar
Authorization: Bearer tu_token_aqui
Content-Type: application/json

{
  "tipo_reporte": "compras_periodo",
  "formato": "pdf",
  "parametros": {
    "fecha_inicio": "2025-05-01",
    "fecha_fin": "2025-07-30",
    "departamento_id": 1
  },
  "incluir_graficos": true
}
```

### 6.2 Exportar Excel - Solicitudes
```http
POST http://localhost:3000/reportes/exportar
Authorization: Bearer tu_token_aqui
Content-Type: application/json

{
  "tipo_reporte": "solicitudes_estatus",
  "formato": "xlsx",
  "parametros": {
    "fecha_inicio": "2025-05-01",
    "fecha_fin": "2025-07-30",
    "incluir_tiempos": true
  }
}
```

### 6.3 Exportar CSV - Ranking Proveedores
```http
POST http://localhost:3000/reportes/exportar
Authorization: Bearer tu_token_aqui
Content-Type: application/json

{
  "tipo_reporte": "ranking_proveedores",
  "formato": "csv",
  "parametros": {
    "fecha_inicio": "2025-05-01",
    "fecha_fin": "2025-07-30",
    "criterio": "volumen",
    "limite": 20
  }
}
```

### 6.4 Exportar PDF - Dashboard
```http
POST http://localhost:3000/reportes/exportar
Authorization: Bearer tu_token_aqui
Content-Type: application/json

{
  "tipo_reporte": "dashboard_ejecutivo",
  "formato": "pdf",
  "parametros": {
    "periodo": "trimestre"
  },
  "incluir_graficos": true
}
```

### 6.5 Exportación Básica (Compatibilidad)
```http
POST http://localhost:3000/reportes/exportar/basico
Authorization: Bearer tu_token_aqui
Content-Type: application/json

{
  "tipoReporte": "compras",
  "formato": "xlsx",
  "data": { /* datos del reporte */ },
  "filtros": {
    "fechaInicio": "2025-05-01",
    "fechaFin": "2025-07-30"
  }
}
```

**Respuesta para exportación:**
- **Éxito:** Descarga directa del archivo
- **Error:** JSON con detalles del error

---

## ❌ **7. PRUEBAS DE VALIDACIÓN (ERRORES ESPERADOS)**

### 7.1 Error - Fechas Inválidas
```http
GET http://localhost:3000/reportes/compras/periodo?fecha_inicio=fecha-invalida&fecha_fin=2025-07-30
Authorization: Bearer tu_token_aqui
```

**Respuesta esperada (400):**
```json
{
  "success": false,
  "error": "Errores de validación",
  "details": [
    {
      "field": "fecha_inicio",
      "message": "La fecha de inicio debe tener formato válido (YYYY-MM-DD)",
      "value": "fecha-invalida"
    }
  ]
}
```

### 7.2 Error - Sin Autenticación
```http
GET http://localhost:3000/reportes/compras/periodo?fecha_inicio=2025-05-01&fecha_fin=2025-07-30
```

**Respuesta esperada (401):**
```json
{
  "success": false,
  "error": "Token de acceso requerido"
}
```

### 7.3 Error - Rango de Fechas Inválido
```http
GET http://localhost:3000/reportes/compras/periodo?fecha_inicio=2025-07-30&fecha_fin=2025-05-01
Authorization: Bearer tu_token_aqui
```

**Respuesta esperada (400):**
```json
{
  "success": false,
  "error": "Errores de validación",
  "details": [
    {
      "field": "fecha_fin",
      "message": "La fecha de fin debe ser posterior a la fecha de inicio",
      "value": "2025-05-01"
    }
  ]
}
```

### 7.4 Error - Parámetros Inválidos
```http
GET http://localhost:3000/reportes/proveedores/ranking?fecha_inicio=2025-05-01&fecha_fin=2025-07-30&criterio=invalid&limite=100
Authorization: Bearer tu_token_aqui
```

**Respuesta esperada (400):**
```json
{
  "success": false,
  "error": "Errores de validación",
  "details": [
    {
      "field": "criterio",
      "message": "El criterio debe ser: volumen, frecuencia o calificacion",
      "value": "invalid"
    },
    {
      "field": "limite",
      "message": "El límite debe ser un número entre 1 y 50",
      "value": "100"
    }
  ]
}
```

### 7.5 Error - Rate Limiting
Hacer 11 requests rápidos a cualquier endpoint pesado.

**Respuesta esperada (429):**
```json
{
  "success": false,
  "error": "Demasiadas solicitudes de reportes",
  "message": "Máximo 10 reportes por minuto. Intenta nuevamente en unos segundos.",
  "retry_after": 45
}
```

### 7.6 Error - ID No Encontrado
```http
GET http://localhost:3000/reportes/compras/periodo?fecha_inicio=2025-05-01&fecha_fin=2025-07-30&departamento_id=999
Authorization: Bearer tu_token_aqui
```

**Respuesta esperada (400):**
```json
{
  "success": false,
  "error": "Departamento no encontrado",
  "message": "No existe un departamento con ID 999"
}
```

### 7.7 Error - Endpoint No Encontrado
```http
GET http://localhost:3000/reportes/endpoint-inexistente
Authorization: Bearer tu_token_aqui
```

**Respuesta esperada (404):**
```json
{
  "success": false,
  "error": "Endpoint de reportes no encontrado",
  "message": "La ruta /reportes/endpoint-inexistente no existe en el módulo de reportes",
  "endpoints_disponibles": [
    "GET /reportes/compras/periodo",
    "GET /reportes/compras/departamentos",
    "GET /reportes/proveedores/ranking",
    "GET /reportes/entregas/cumplimiento",
    "GET /reportes/solicitudes/estatus",
    "GET /reportes/solicitudes/cuellos-botella",
    "GET /reportes/dashboard/ejecutivo",
    "POST /reportes/exportar",
    "GET /reportes/filtros/configurables",
    "GET /reportes/health"
  ]
}
```

---

## 🔮 **8. ENDPOINTS FUTUROS (NO IMPLEMENTADOS)**

### 8.1 Variación de Precios (Último Cuatrimestre)
```http
GET http://localhost:3000/reportes/precios/variacion?fecha_inicio=2025-05-01&fecha_fin=2025-07-30
Authorization: Bearer tu_token_aqui
```

### 8.2 Solicitudes por Departamentos
```http
GET http://localhost:3000/reportes/solicitudes/departamentos?fecha_inicio=2025-05-01&fecha_fin=2025-07-30
Authorization: Bearer tu_token_aqui
```

### 8.3 Solicitudes Denegadas
```http
GET http://localhost:3000/reportes/solicitudes/denegadas?fecha_inicio=2025-05-01&fecha_fin=2025-07-30
Authorization: Bearer tu_token_aqui
```

### 8.4 Seasonalidad
```http
GET http://localhost:3000/reportes/solicitudes/seasonalidad?año=2025&tipo_analisis=mensual
Authorization: Bearer tu_token_aqui
```

### 8.5 Filtros Guardados
```http
POST http://localhost:3000/reportes/filtros/guardar
Authorization: Bearer tu_token_aqui
Content-Type: application/json

{
  "nombre_filtro": "Reporte Cuatrimestre TI",
  "configuracion": {
    "departamento_id": 1,
    "periodo": "mensual",
    "fecha_inicio": "2025-05-01",
    "fecha_fin": "2025-07-30"
  }
}
```

### 8.6 Reportes Automáticos
```http
POST http://localhost:3000/reportes/automaticos/configurar
Authorization: Bearer tu_token_aqui
Content-Type: application/json

{
  "nombre_reporte": "Reporte Semanal Ejecutivo",
  "tipo_reporte": "dashboard_ejecutivo",
  "parametros": {
    "periodo": "semana"
  },
  "frecuencia": "semanal",
  "destinatarios": ["director@uteq.edu.mx"],
  "formato": "pdf"
}
```

**Respuesta para endpoints futuros (501):**
```json
{
  "success": false,
  "error": "Funcionalidad en desarrollo",
  "message": "Esta funcionalidad estará disponible próximamente"
}
```

---

## 📝 **NOTAS IMPORTANTES**

1. **Todos los endpoints requieren autenticación** con JWT token
2. **Las fechas deben estar en formato ISO:** `YYYY-MM-DD`
3. **Período de prueba:** 01/05/2025 al 30/07/2025 (último cuatrimestre)
4. **Los rangos de fecha tienen límites:** máximo 2 años, mínimo no mayor a 5 años atrás
5. **Rate limiting:** máximo 10 requests por minuto por usuario
6. **Los IDs deben existir en la base de datos** o dará error 400
7. **Los archivos exportados se descargan directamente**
8. **Algunos endpoints requieren rol administrativo específico**

## 🗓️ **FECHAS DE REFERENCIA ACTUALIZADAS**

- **Inicio del cuatrimestre:** 01/05/2025
- **Fin del período:** 30/07/2025
- **Fecha actual de referencia:** 31/07/2025
- **Últimos 3 meses:** Mayo, Junio, Julio 2025
- **Período de análisis:** 3 meses (90 días aproximadamente)

¡Con estos ejemplos actualizados puedes probar completamente el módulo de reportes con fechas del cuatrimestre actual! 🚀