export interface Instrument {
  name: string;
  sound: string;
  color: string;
  frequency: number;
}

export const INSTRUMENTS: Record<string, Instrument> = {
  '1': { name: '킥드럼', sound: 'kick.wav', color: '#FF4444', frequency: 150 },
  '2': { name: '스네어드럼', sound: 'snare.wav', color: '#44FF44', frequency: 220 },
  '3': { name: '베이스기타', sound: 'bass.wav', color: '#4444FF', frequency: 180 },
  '4': { name: '일렉기타', sound: 'guitar.wav', color: '#FFFF44', frequency: 300 },
  '5': { name: '피아노', sound: 'piano.wav', color: '#FF44FF', frequency: 260 },
  '6': { name: '신디사이저', sound: 'synth.wav', color: '#44FFFF', frequency: 320 },
  '7': { name: '바이올린', sound: 'violin.wav', color: '#FFA844', frequency: 340 },
  '8': { name: '트럼펫', sound: 'trumpet.wav', color: '#A844FF', frequency: 360 },
  '9': { name: '첼로', sound: 'cello.wav', color: '#44FFA8', frequency: 200 },
  '0': { name: '심벌', sound: 'cymbal.wav', color: '#FFB444', frequency: 400 },
};
