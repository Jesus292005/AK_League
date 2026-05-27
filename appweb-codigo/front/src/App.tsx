import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import './App.css'

const socket = io('http://localhost:3000')

const TIEMPO_INICIAL_SEG = 10; 

function App() {
  const [golesAzul, setGolesAzul] = useState(0)
  const [golesNaranja, setGolesNaranja] = useState(0)
  const [estadoPartido, setEstadoPartido] = useState<'detenido' | 'jugando' | 'pausado'>('detenido')
  
  const [tiempoRestante, setTiempoRestante] = useState(TIEMPO_INICIAL_SEG)
  const [isOvertime, setIsOvertime] = useState(false)
  const [tiempoExtra, setTiempoExtra] = useState(0)
  
  const [historialGoles, setHistorialGoles] = useState<{equipo: string, tiempo: string}[]>([])
  const [ultimoGol, setUltimoGol] = useState<string | null>(null)
  
  const [ganador, setGanador] = useState<string | null>(null)
  const [mostrarModal, setMostrarModal] = useState(false)

  // Control del Cronómetro
  useEffect(() => {
    let intervalo: number | undefined;

    if (estadoPartido === 'jugando') {
      intervalo = setInterval(() => {
        if (isOvertime) {
          setTiempoExtra((prev) => prev + 1);
        } else {
          setTiempoRestante((prev) => prev - 1);
        }
      }, 1000);
    }

    return () => clearInterval(intervalo);
  }, [estadoPartido, isOvertime]);

  // Verificación de fin de tiempo regular
  useEffect(() => {
    if (tiempoRestante === 0 && !isOvertime && estadoPartido === 'jugando') {
      if (golesAzul === golesNaranja) {
        setIsOvertime(true);
      } else {
        declararGanador(golesAzul > golesNaranja ? 'Azul' : 'Naranja');
      }
    }
  }, [tiempoRestante, estadoPartido, golesAzul, golesNaranja, isOvertime]);

  // Procesamiento del flujo de goles
  useEffect(() => {
    if (ultimoGol) {
      const nomEquipo = ultimoGol === 'gol_azul' ? 'Azul' : 'Naranja';
      const tiempoAnotacion = isOvertime ? `+${formatearTiempo(tiempoExtra)}` : formatearTiempo(tiempoRestante);
      
      // Agregar al inicio de la lista
      setHistorialGoles(prev => [{ equipo: nomEquipo, tiempo: tiempoAnotacion }, ...prev]);
      
      if (ultimoGol === 'gol_azul') setGolesAzul(prev => prev + 1);
      else setGolesNaranja(prev => prev + 1);

      if (isOvertime) {
        declararGanador(nomEquipo);
      } else {
        setEstadoPartido('pausado');
      }
      
      setUltimoGol(null);
    }
  }, [ultimoGol, isOvertime, tiempoExtra, tiempoRestante]);

  useEffect(() => {
    socket.on('nuevo_gol', (equipo) => {
      setUltimoGol(equipo);
    })
    return () => { socket.off('nuevo_gol') }
  }, [])

  const declararGanador = async (equipoGanador: string) => {
    await fetch('http://localhost:3000/finalizar', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // <-- Línea crítica
      body: JSON.stringify({ ganador: equipoGanador })
    });
    setEstadoPartido('detenido');
    setGanador(equipoGanador);
    setMostrarModal(true);
  }

  const iniciarPartido = async () => {
    await fetch('http://localhost:3000/iniciar', { method: 'POST' });
    setEstadoPartido('jugando');
    setGolesAzul(0);
    setGolesNaranja(0);
    setTiempoRestante(TIEMPO_INICIAL_SEG);
    setIsOvertime(false);
    setTiempoExtra(0);
    setHistorialGoles([]);
    setGanador(null);
    setMostrarModal(false);
  }

  const pausarPartido = async () => {
    await fetch('http://localhost:3000/pausar', { method: 'POST' });
    setEstadoPartido('pausado');
  }

  const reanudarPartido = async () => {
    await fetch('http://localhost:3000/reanudar', { method: 'POST' });
    setEstadoPartido('jugando');
  }

  const finalizarPartido = async () => {
    const lider = golesAzul > golesNaranja ? 'Azul' : golesAzul < golesNaranja ? 'Naranja' : 'Empate';
    declararGanador(lider);
  }

  const formatearTiempo = (segundosTotales: number) => {
    const minutos = Math.floor(segundosTotales / 60).toString().padStart(2, '0');
    const segundos = (segundosTotales % 60).toString().padStart(2, '0');
    return `${minutos}:${segundos}`;
  }

  return (
    <div style={{ textAlign: 'center', fontFamily: 'sans-serif', marginTop: '50px', position: 'relative' }}>
      
      {/* Modal de Ganador */}
      {mostrarModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', 
          alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '50px', borderRadius: '15px', textAlign: 'center'
          }}>
            <h1 style={{ fontSize: '48px', margin: '0 0 20px 0' }}>Partido Finalizado</h1>
            <h2 style={{ fontSize: '36px', color: ganador === 'Azul' ? '#1E3A8A' : ganador === 'Naranja' ? '#EA580C' : '#333' }}>
              {ganador === 'Empate' ? 'El partido terminó en empate' : `Ganador: Equipo ${ganador}`}
            </h2>
            <button onClick={() => setMostrarModal(false)} style={{
              marginTop: '30px', padding: '15px 30px', fontSize: '18px', cursor: 'pointer',
              backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px'
            }}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      <h1>Adrian Kong League</h1>
      
      {/* Indicador de Estado del Partido */}
      {estadoPartido === 'detenido' && ganador && (
        <h2 style={{ color: '#d32f2f' }}>Partido Finalizado - Ganador: Equipo {ganador}</h2>
      )}
      
      {isOvertime && (
        <h3 style={{ color: '#d32f2f', textTransform: 'uppercase', letterSpacing: '2px' }}>Tiempo Extra</h3>
      )}

      <div style={{ 
        fontSize: '80px', 
        fontWeight: 'bold', 
        fontFamily: 'monospace',
        color: isOvertime || tiempoRestante <= 60 ? '#d32f2f' : '#333', 
        margin: '10px 0' 
      }}>
        {isOvertime ? `+${formatearTiempo(tiempoExtra)}` : formatearTiempo(tiempoRestante)}
      </div>
      
      {/* Controles HTTP */}
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
        {estadoPartido === 'detenido' && (
          <button onClick={iniciarPartido} style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Iniciar Partido
          </button>
        )}
        {estadoPartido === 'jugando' && (
          <button onClick={pausarPartido} style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Pausar Partido
          </button>
        )}
        {estadoPartido === 'pausado' && (
          <button onClick={reanudarPartido} style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Reanudar Partido
          </button>
        )}
        {(estadoPartido === 'jugando' || estadoPartido === 'pausado') && (
          <button onClick={finalizarPartido} style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Finalizar Partido
          </button>
        )}
      </div>

      {/* Marcador Principal */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '50px', marginTop: '20px' }}>
        <div style={{ backgroundColor: '#1E3A8A', color: 'white', padding: '40px', borderRadius: '15px', minWidth: '200px' }}>
          <h2>Equipo Azul</h2>
          <p style={{ fontSize: '72px', margin: '0', fontWeight: 'bold' }}>{golesAzul}</p>
        </div>
        <div style={{ backgroundColor: '#EA580C', color: 'white', padding: '40px', borderRadius: '15px', minWidth: '200px' }}>
          <h2>Equipo Naranja</h2>
          <p style={{ fontSize: '72px', margin: '0', fontWeight: 'bold' }}>{golesNaranja}</p>
        </div>
      </div>

      {/* Tarjeta de Historial de Goles */}
      {historialGoles.length > 0 && (
        <div style={{ 
          marginTop: '40px', 
          width: '500px', 
          marginLeft: 'auto', 
          marginRight: 'auto', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '15px', 
          padding: '20px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ borderBottom: '2px solid #ddd', paddingBottom: '10px', color: '#555' }}>Historial de Anotaciones</h3>
          
          <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '10px' }}>
            {historialGoles.map((gol, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                justifyContent: gol.equipo === 'Azul' ? 'flex-start' : 'flex-end',
                marginBottom: '15px'
              }}>
                <div style={{ 
                  backgroundColor: gol.equipo === 'Azul' ? '#1E3A8A' : '#EA580C',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '20px',
                  fontWeight: 'bold',
                  fontSize: '18px'
                }}>
                  {gol.tiempo}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

export default App