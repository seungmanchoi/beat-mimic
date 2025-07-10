'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Phaser from 'phaser'
import { INSTRUMENTS } from '@/constants/instruments'

const LEVEL_CONFIG = [
  { max: 3, instruments: ['1'], bpm: [60, 80] },
  { max: 6, instruments: ['1', '2'], bpm: [80, 100] },
  { max: 9, instruments: ['1', '2', '3'], bpm: [100, 120] },
  { max: 12, instruments: ['1', '2', '3', '4'], bpm: [120, 140] },
  { max: 15, instruments: ['1', '2', '3', '4', '5'], bpm: [140, 160] },
  { max: 18, instruments: ['1', '2', '3', '4', '5', '6'], bpm: [160, 180] },
]

function getLevelConfig(level: number) {
  return LEVEL_CONFIG.find((c) => level <= c.max) ?? LEVEL_CONFIG[0]
}

/**
 * Evaluate hit timing and correctness.
 */
function judgeHit(
  expectedKey: string,
  actualKey: string,
  expectedTime: number,
  actualTime: number,
) {
  const diff = Math.abs(expectedTime - actualTime)
  if (expectedKey !== actualKey) {
    return { result: 'MISS', score: 0 }
  }
  if (diff <= 50) {
    return { result: 'PERFECT', score: 100 }
  }
  if (diff <= 100) {
    return { result: 'GREAT', score: 80 }
  }
  if (diff <= 150) {
    return { result: 'GOOD', score: 60 }
  }
  return { result: 'MISS', score: 0 }
}

class GameScene extends Phaser.Scene {
  private pattern: string[] = []
  private index = 0
  private startTime = 0
  private score = 0
  private beatDelay = 600
  private readonly levelConfig

  constructor(levelConfig: { instruments: string[]; bpm: [number, number] }) {
    super('GameScene')
    this.levelConfig = levelConfig
  }

  create() {
    this.cameras.main.setBackgroundColor('#000')
    const bpm = Phaser.Math.Between(this.levelConfig.bpm[0], this.levelConfig.bpm[1])
    this.beatDelay = 60000 / bpm
    this.input.keyboard.on('keydown', (event: KeyboardEvent) => this.handleKey(event.key))
    this.generatePattern()
    this.playDemonstration()
  }

  private generatePattern() {
    const keys = this.levelConfig.instruments
    for (let i = 0; i < 8; i += 1) {
      const randomKey = keys[Math.floor(Math.random() * keys.length)]
      this.pattern.push(randomKey)
    }
  }

  private async playDemonstration() {
    for (const key of this.pattern) {
      this.playInstrument(key)
      await this.wait(this.beatDelay)
    }
    this.index = 0
    this.startTime = this.time.now
  }

  private handleKey(key: string) {
    if (!INSTRUMENTS[key]) {
      return
    }
    const expectedKey = this.pattern[this.index]
    const expectedTime = this.startTime + this.index * this.beatDelay
    const result = judgeHit(expectedKey, key, expectedTime, this.time.now)
    if (result.score > 0) {
      this.score += result.score
    }
    this.add.text(10, 10, `Score: ${this.score}`, { color: '#ffffff' }).setDepth(1)
    this.playInstrument(key)
    this.index += 1
    if (this.index === this.pattern.length) {
      this.add.text(10, 40, `Final Score: ${this.score}`, { color: '#ffffff' }).setDepth(1)
    }
  }

  private playInstrument(key: string) {
    const instrument = INSTRUMENTS[key]
    const context = this.sound.context
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = instrument.frequency
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    gain.gain.setValueAtTime(0.5, context.currentTime)
    oscillator.stop(context.currentTime + 0.2)
  }

  private wait(ms: number) {
    return new Promise<void>((resolve) => {
      this.time.delayedCall(ms, () => resolve())
    })
  }
}

export default function GamePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const player = localStorage.getItem('rhythmEcho_player')
    if (!player) {
      router.push('/login')
      return
    }
    const level = Number(searchParams.get('level') || '1')
    const levelConfig = getLevelConfig(level)
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: 'game-container',
      scene: new GameScene(levelConfig),
      audio: { disableWebAudio: false },
    }
    const game = new Phaser.Game(config)
    return () => game.destroy(true)
  }, [router, searchParams])

  return <div id="game-container" className="w-full h-screen" />
}

