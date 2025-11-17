#!/bin/bash

# NOCTE Development Startup Script
# Este script inicia tanto el backend como el frontend

echo ""
echo "🚀 Iniciando NOCTE en modo desarrollo..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar que estemos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Debes ejecutar este script desde la carpeta raíz de NOCTE"
    exit 1
fi

# Verificar que el backend exista
if [ ! -d "nocte-backend" ]; then
    echo "❌ Error: No se encuentra la carpeta nocte-backend"
    exit 1
fi

# Verificar que node_modules existan
if [ ! -d "node_modules" ]; then
    echo "⚠️  Instalando dependencias del frontend..."
    npm install
fi

if [ ! -d "nocte-backend/node_modules" ]; then
    echo "⚠️  Instalando dependencias del backend..."
    cd nocte-backend && npm install && cd ..
fi

echo "✅ Dependencias verificadas"
echo ""

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servidores..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ Servidores detenidos"
    exit 0
}

# Capturar Ctrl+C para hacer cleanup
trap cleanup INT TERM

# Iniciar backend en background
echo "1️⃣  Iniciando backend en http://localhost:3000..."
cd nocte-backend
npm start &
BACKEND_PID=$!
cd ..

# Esperar a que el backend inicie
sleep 3

# Verificar que el backend esté corriendo
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "   ✅ Backend iniciado correctamente"
else
    echo "   ⚠️  Backend puede tardar unos segundos más..."
fi

echo ""

# Iniciar frontend
echo "2️⃣  Iniciando frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Servidores iniciados"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Frontend: http://localhost:8080 (o el puerto que asigne Vite)"
echo "🔧 Backend:  http://localhost:3000"
echo "💊 Health:   http://localhost:3000/api/health"
echo ""
echo "💡 Presiona Ctrl+C para detener ambos servidores"
echo ""

# Esperar indefinidamente
wait
