import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import './App.css'

// Nos conectamos al servidor de NestJS (ajusta la IP si tu back corre en otra dirección)
const socket = io('http://localhost:3000')

function App() {
  const [golesAzul, setGolesAzul] = useState(0)
  const [golesNaranja, setGolesNaranja] = useState(0)

  useEffect(() => {
    // Escuchamos el evento exacto que manda nuestro AppGateway en NestJS
    socket.on('nuevo_gol', (equipo) => {
      console.log("Notificación de gol recibida:", equipo);
      
      if (equipo === 'gol_azul') {
        setGolesAzul((prev) => prev + 1)
      } else if (equipo === 'gol_naranja') {
        setGolesNaranja((prev) => prev + 1)
      }
    })

    // Limpiamos la conexión si el componente se desmonta
    return () => {
      socket.off('nuevo_gol')
    }
  }, [])

  return (
    <div style={{ textAlign: 'center', fontFamily: 'sans-serif', marginTop: '50px' }}>
      <h1>🏎️ Adrian Kong League ⚽</h1>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '50px', marginTop: '40px' }}>
        
        {/* Tarjeta Equipo Azul */}
        <div style={{ 
          backgroundColor: '#1E3A8A', 
          color: 'white', 
          padding: '40px', 
          borderRadius: '15px',
          minWidth: '200px'
        }}>
          <h2>Equipo Azul</h2>
          <p style={{ fontSize: '72px', margin: '0', fontWeight: 'bold' }}>{golesAzul}</p>
        </div>

        {/* Tarjeta Equipo Naranja */}
        <div style={{ 
          backgroundColor: '#EA580C', 
          color: 'white', 
          padding: '40px', 
          borderRadius: '15px',
          minWidth: '200px'
        }}>
          <h2>Equipo Naranja</h2>
          <p style={{ fontSize: '72px', margin: '0', fontWeight: 'bold' }}>{golesNaranja}</p>
        </div>

      </div>
    </div>
  )
}

export default App