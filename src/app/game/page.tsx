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

const PROGRESS_OFFSET = 100

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
    return { result: 'EXCELLENT', score: 100 }
  }
  if (diff <= 100) {
    return { result: 'GREAT', score: 70 }
  }
  if (diff <= 150) {
    return { result: 'GOOD', score: 40 }
  }
  if (diff <= 200) {
    return { result: 'BAD', score: 20 }
  }
  return { result: 'MISS', score: 0 }
}

class GameScene extends Phaser.Scene {
  private pattern: string[] = []
  private index = 0
  private startTime = 0
  private score = 0
  private isGameOver = false
  private beatDelay = 600
  private readonly levelConfig
  private noteSprites: Phaser.GameObjects.Arc[] = []
  private scoreText!: Phaser.GameObjects.Text
  private progressLine!: Phaser.GameObjects.Line
  private progressStartX = 100
  private gameOverText?: Phaser.GameObjects.Text
  private hitText?: Phaser.GameObjects.Text

  constructor(levelConfig: { instruments: string[]; bpm: [number, number] }) {
    super('GameScene')
    this.levelConfig = levelConfig
  }

  init() {
    this.pattern = []
    this.index = 0
    this.startTime = 0
    this.score = 0
    this.isGameOver = false
    this.noteSprites = []
    if (this.hitText) {
      this.hitText.destroy()
      this.hitText = undefined
    }
    if (this.gameOverText) {
      this.gameOverText.destroy()
      this.gameOverText = undefined
    }
  }

  create() {
    this.cameras.main.setBackgroundColor('#000')
    const bpm = Phaser.Math.Between(this.levelConfig.bpm[0], this.levelConfig.bpm[1])
    this.beatDelay = 60000 / bpm
    this.input.keyboard.on('keydown', (event: KeyboardEvent) => this.handleKey(event.key))
    this.generatePattern()
    this.createNoteVisuals()
    this.playDemonstration()
  }

  private generatePattern() {
    const keys = this.levelConfig.instruments
    for (let i = 0; i < 8; i += 1) {
      const randomKey = keys[Math.floor(Math.random() * keys.length)]
      this.pattern.push(randomKey)
    }
  }

  private createNoteVisuals() {
    const width = this.cameras.main.width
    const startX = 100
    const endX = width - 100
    const step = (endX - startX) / this.pattern.length
    const y = this.cameras.main.centerY
    this.scoreText = this.add.text(10, 10, 'Score: 0', { color: '#ffffff' }).setDepth(1)
    this.pattern.forEach((key, i) => {
      const instrument = INSTRUMENTS[key]
      const x = startX + i * step
      const color = parseInt(instrument.color.replace('#', ''), 16)
      const circle = this.add.circle(x, y, 20, color).setStrokeStyle(2, 0xffffff)
      this.add
        .text(x, y + 30, key, { color: '#ffffff' })
        .setOrigin(0.5, 0.5)
      this.noteSprites.push(circle)
    })
    this.progressStartX = startX - PROGRESS_OFFSET
    this.progressLine = this.add
      .line(this.progressStartX, y - 40, 0, 0, 0, 80, 0xffffff)
      .setOrigin(0, 0.5)
  }

  private async playDemonstration() {
    for (let i = 0; i < this.pattern.length; i += 1) {
      const note = this.noteSprites[i]
      this.playInstrument(this.pattern[i])
      this.tweens.add({ targets: note, scale: 1.3, yoyo: true, duration: this.beatDelay / 2 })
      await this.wait(this.beatDelay)
    }
    this.index = 0
    this.startTime = this.time.now
    this.startUserPlay()
  }

  private handleKey(key: string) {
    if (!INSTRUMENTS[key]) {
      return
    }
    const expectedKey = this.pattern[this.index]
    const expectedTime = this.startTime + this.index * this.beatDelay
    const result = judgeHit(expectedKey, key, expectedTime, this.time.now)
    this.showHitResult(result.result)
    if (result.score > 0) {
      this.score += result.score
    }
    this.scoreText.setText(`Score: ${this.score}`)
    this.playInstrument(key)
    this.index += 1
    if (result.result === 'MISS') {
      this.gameOver()
      return
    }
    if (this.index === this.pattern.length) {
      this.gameOver(true)
    }
  }

  private startUserPlay() {
    const width = this.cameras.main.width
    const endX = width - 100
    this.progressLine.x = this.progressStartX
    this.tweens.add({
      targets: this.progressLine,
      x: endX,
      duration: this.pattern.length * this.beatDelay + PROGRESS_OFFSET,
      ease: 'Linear',
    })
    this.time.addEvent({
      delay: this.beatDelay,
      callback: () => {
        if (this.index < this.noteSprites.length) {
          const note = this.noteSprites[this.index]
          this.tweens.add({ targets: note, scale: 1.3, yoyo: true, duration: this.beatDelay / 2 })
        }
      },
      loop: true,
    })
  }

  private showHitResult(result: string) {
    if (this.hitText) {
      this.hitText.destroy()
    }
    const color = '#ffffff'
    this.hitText = this.add
      .text(this.cameras.main.centerX, this.cameras.main.centerY - 100, result, {
        color,
        fontSize: '32px',
      })
      .setOrigin(0.5)
    this.tweens.add({
      targets: this.hitText,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.hitText?.destroy()
        this.hitText = undefined
      },
    })
  }

  private gameOver(completed = false) {
    if (this.isGameOver) {
      return
    }
    this.isGameOver = true
    this.tweens.killAll()
    const width = this.cameras.main.centerX
    const height = this.cameras.main.centerY
    const text = completed ? 'Stage Clear!' : 'Game Over'
    this.gameOverText = this.add
      .text(width, height, `${text}\nScore: ${this.score}\nClick to Restart`, {
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(1)
    this.input.keyboard.removeAllListeners()
    this.input.once('pointerdown', () => this.scene.restart())
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

