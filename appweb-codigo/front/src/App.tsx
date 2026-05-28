import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import './App.css'

const socket = io('http://localhost:3000')
const TIEMPO_INICIAL_SEG = 10; 

function App() {
  const [golesAzul, setGolesAzul] = useState(0)
  const [golesRed, setGolesRed] = useState(0)
  const [estadoPartido, setEstadoPartido] = useState<'detenido' | 'jugando' | 'pausado'>('detenido')
  
  const [tiempoRestante, setTiempoRestante] = useState(TIEMPO_INICIAL_SEG)
  const [isOvertime, setIsOvertime] = useState(false)
  const [tiempoExtra, setTiempoExtra] = useState(0)
  
  const [historialGoles, setHistorialGoles] = useState<{equipo: string, tiempo: string}[]>([])
  const [ultimoGol, setUltimoGol] = useState<string | null>(null)
  
  const [ganador, setGanador] = useState<string | null>(null)
  const [mostrarModal, setMostrarModal] = useState(false)

  const [animateAzul, setAnimateAzul] = useState(false)
  const [animateRed, setAnimateRed] = useState(false)

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

  useEffect(() => {
    if (tiempoRestante === 0 && !isOvertime && estadoPartido === 'jugando') {
      if (golesAzul === golesRed) {
        setIsOvertime(true);
      } else {
        declararGanador(golesAzul > golesRed ? 'Azul' : 'Rojo');
      }
    }
  }, [tiempoRestante, estadoPartido, golesAzul, golesRed, isOvertime]);

  useEffect(() => {
    if (ultimoGol) {
      const nomEquipo = ultimoGol === 'gol_azul' ? 'Azul' : 'Rojo';
      const tiempoAnotacion = isOvertime ? `+${formatearTiempo(tiempoExtra)}` : formatearTiempo(tiempoRestante);
      
      setHistorialGoles(prev => [{ equipo: nomEquipo, tiempo: tiempoAnotacion }, ...prev]);
      
      if (ultimoGol === 'gol_azul') {
        setGolesAzul(prev => prev + 1);
        setAnimateAzul(true);
        setTimeout(() => setAnimateAzul(false), 600); 
      } else {
        setGolesRed(prev => prev + 1);
        setAnimateRed(true);
        setTimeout(() => setAnimateRed(false), 600);
      }

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
      headers: { 'Content-Type': 'application/json' },
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
    setGolesRed(0);
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
    const lider = golesAzul > golesRed ? 'Azul' : golesAzul < golesRed ? 'Rojo' : 'Empate';
    declararGanador(lider);
  }

  const formatearTiempo = (segundosTotales: number) => {
    const minutos = Math.floor(segundosTotales / 60).toString().padStart(2, '0');
    const segundos = (segundosTotales % 60).toString().padStart(2, '0');
    return `${minutos}:${segundos}`;
  }

  return (
    <div className="dashboard-container">
      
      {mostrarModal && (
        <div className="winner-overlay">
          <div className={`winner-modal ${ganador?.toLowerCase() === 'rojo' ? 'red' : ganador?.toLowerCase()}`}>
            <h1 className="modal-title">Partido Finalizado</h1>
            <h2 className="winner-team-announcement">
              {ganador === 'Empate' ? '¡Empate!' : `Victoria ${ganador}`}
            </h2>
            <button className="btn-close-modal" onClick={() => setMostrarModal(false)}>
              Continuar
            </button>
          </div>
        </div>
      )}

      <h1 className="main-title">Adrian Kong League</h1>
      
      {isOvertime ? (
        <h3 className="overtime-badge">Tiempo Extra / Gol de Oro</h3>
      ) : (
        <div className="status-badge">
          {estadoPartido === 'detenido' && 'Esperando Inicio'}
          {estadoPartido === 'jugando' && 'En juego'}
          {estadoPartido === 'pausado' && 'Partido Pausado'}
        </div>
      )}

      <div className="scoreboard-hud">
        <div className="team-panel blue">
          <h2 className="team-name">Azul</h2>
          <p className={`score-number ${animateAzul ? 'animate-score' : ''}`}>
            {golesAzul}
          </p>
        </div>

        <div className="timer-panel">
          <div className={`timer-display ${isOvertime || tiempoRestante <= 60 ? 'critical' : ''}`}>
            {isOvertime ? `+${formatearTiempo(tiempoExtra)}` : formatearTiempo(tiempoRestante)}
          </div>
        </div>

        <div className="team-panel red">
          <h2 className="team-name">Rojo</h2>
          <p className={`score-number ${animateRed ? 'animate-score' : ''}`}>
            {golesRed}
          </p>
        </div>
      </div>
      
      <div className="controls-panel">
        {estadoPartido === 'detenido' && (
          <button onClick={iniciarPartido} className="btn btn-start">Iniciar Partido</button>
        )}
        {estadoPartido === 'jugando' && (
          <button onClick={pausarPartido} className="btn btn-pause">Pausar</button>
        )}
        {estadoPartido === 'pausado' && (
          <button onClick={reanudarPartido} className="btn btn-resume">Reanudar</button>
        )}
        {(estadoPartido === 'jugando' || estadoPartido === 'pausado') && (
          <button onClick={finalizarPartido} className="btn btn-end">Terminar</button>
        )}
      </div>

      {historialGoles.length > 0 && (
        <div className="history-card">
          <h3 className="history-title">Historial del Partido</h3>
          <div className="history-list">
            {historialGoles.map((gol, index) => (
              <div key={index} className={`goal-feed-item ${gol.equipo.toLowerCase() === 'rojo' ? 'red' : gol.equipo.toLowerCase()}`}>
                {gol.equipo === 'Azul' && <span className="feed-time">{gol.tiempo}</span>}
                <span>¡Gol del Equipo {gol.equipo}!</span>
                {gol.equipo === 'Rojo' && <span className="feed-time">{gol.tiempo}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

export default App