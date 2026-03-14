'use client'
import EmotionalTerrain from '@/components/EmotionalTerrain'

export default function Dashboard() {

  const handleClick = async () => {
    

  }
  

  return (
    <main style={{ width: '100vw', height: '100vh' }}>
      <EmotionalTerrain />
      <button onClick={handleClick}>Call</button>
    </main>
  )
}