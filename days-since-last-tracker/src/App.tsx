import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import DaysSinceIncident from './components/days-since-last'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <section id="center">
        <DaysSinceIncident />
      </section>
      <section id="spacer"></section>
    </>
  )
}

export default App
