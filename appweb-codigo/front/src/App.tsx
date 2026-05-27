import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import './App.css'

const socket = io('http://localhost:3000')

function App() {
  const [golesAzul, setGolesAzul] = useState(0)
  const [golesNaranja, setGolesNaranja] = useState(0)
  const [partidoActivo, setPartidoActivo] = useState(false)

  useEffect(() => {
    socket.on('nuevo_gol', (equipo) => {
      if (equipo === 'gol_azul') {
        setGolesAzul((prev) => prev + 1)
      } else if (equipo === 'gol_naranja') {
        setGolesNaranja((prev) => prev + 1)
      }
    })

    return () => {
      socket.off('nuevo_gol')
    }
  }, [])

  const iniciarPartido = async () => {
    try {
      await fetch('http://localhost:3000/iniciar', { method: 'POST' });
      setPartidoActivo(true);
      setGolesAzul(0);
      setGolesNaranja(0);
    } catch (error) {
      console.error("Error al iniciar la petición HTTP:", error);
    }
  }

  const detenerPartido = async () => {
    try {
      await fetch('http://localhost:3000/detener', { method: 'POST' });
      setPartidoActivo(false);
    } catch (error) {
      console.error("Error al detener la petición HTTP:", error);
    }
  }

  return (
    <div style={{ textAlign: 'center', fontFamily: 'sans-serif', marginTop: '50px' }}>
      <h1>Adrian Kong League</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <button 
          onClick={iniciarPartido} 
          disabled={partidoActivo}
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px', 
            marginRight: '15px', 
            backgroundColor: partidoActivo ? '#555' : '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: partidoActivo ? 'not-allowed' : 'pointer' 
          }}
        >
          Iniciar Partido
        </button>
        
        <button 
          onClick={detenerPartido} 
          disabled={!partidoActivo}
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px', 
            backgroundColor: !partidoActivo ? '#555' : '#f44336', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: !partidoActivo ? 'not-allowed' : 'pointer' 
          }}
        >
          Detener Partido
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '50px', marginTop: '40px' }}>
        <div style={{ backgroundColor: '#1E3A8A', color: 'white', padding: '40px', borderRadius: '15px', minWidth: '200px' }}>
          <h2>Equipo Azul</h2>
          <p style={{ fontSize: '72px', margin: '0', fontWeight: 'bold' }}>{golesAzul}</p>
        </div>

        <div style={{ backgroundColor: '#EA580C', color: 'white', padding: '40px', borderRadius: '15px', minWidth: '200px' }}>
          <h2>Equipo Naranja</h2>
          <p style={{ fontSize: '72px', margin: '0', fontWeight: 'bold' }}>{golesNaranja}</p>
        </div>
      </div>
    </div>
  )
}

export default App