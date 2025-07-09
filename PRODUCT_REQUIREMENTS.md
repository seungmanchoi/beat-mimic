# PRD: 패턴 인식 음악 게임 "Rhythm Echo"

## 1. 제품 개요

### 1.1 게임 컨셉
- **게임명**: Rhythm Echo
- **장르**: 리듬 액션, 패턴 인식 게임
- **플랫폼**: 웹 브라우저 (Phaser.js 기반)
- **타겟**: 음악을 좋아하는 모든 연령층, 리듬 게임 입문자부터 고수까지

### 1.2 핵심 가치 제안
- **학습 기반 게임플레이**: 시범 연주를 보고 따라 하는 직관적인 학습 시스템
- **점진적 난이도**: 악기 하나부터 시작해서 복합 연주까지 자연스러운 난이도 상승
- **실제 악기 시뮬레이션**: 각 숫자키가 다른 악기를 대표하는 몰입감

## 2. 핵심 기능 명세서

### 2.1 사용자 인증 시스템
```javascript
// 로그인 플로우
{
  "loginSystem": {
    "playerNameInput": {
      "validation": "2-12자 한글/영문/숫자",
      "storage": "localStorage",
      "keyFormat": "rhythmEcho_player_{timestamp}"
    },
    "guestMode": true,
    "dataSync": "localStorage 기반"
  }
}
```

### 2.2 게임 난이도 시스템
| 레벨 | 난이도명 | 사용 악기 | 키 매핑 | 패턴 복잡도 | BPM 범위 |
|------|----------|-----------|---------|-------------|----------|
| 1-3 | 초급 | 드럼 | 1번키 | 4/4박자, 단순 | 60-80 |
| 4-6 | 초중급 | 드럼 + 베이스 | 1,2번키 | 8비트, 중간 | 80-100 |
| 7-9 | 중급 | 드럼 + 베이스 + 기타 | 1,2,3번키 | 16비트, 복합 | 100-120 |
| 10-12 | 중고급 | 4개 악기 | 1,2,3,4번키 | 싱코페이션 | 120-140 |
| 13-15 | 고급 | 5개 악기 | 1,2,3,4,5번키 | 폴리리듬 | 140-160 |
| 16-18 | 최고급 | 6개 악기 | 1,2,3,4,5,6번키 | 복잡한 변박 | 160-180 |

### 2.3 악기 시스템
```javascript
const instruments = {
  1: { name: "킥드럼", sound: "kick.wav", color: "#FF4444" },
  2: { name: "스네어드럼", sound: "snare.wav", color: "#44FF44" },
  3: { name: "베이스기타", sound: "bass.wav", color: "#4444FF" },
  4: { name: "일렉기타", sound: "guitar.wav", color: "#FFFF44" },
  5: { name: "피아노", sound: "piano.wav", color: "#FF44FF" },
  6: { name: "신디사이저", sound: "synth.wav", color: "#44FFFF" },
  7: { name: "바이올린", sound: "violin.wav", color: "#FFA844" },
  8: { name: "트럼펫", sound: "trumpet.wav", color: "#A844FF" },
  9: { name: "첼로", sound: "cello.wav", color: "#44FFA8" },
  0: { name: "심벌", sound: "cymbal.wav", color: "#FFB444" }
};
```

## 3. 게임플레이 플로우

### 3.1 메인 게임 루프### 3.2 상세 게임플레이 메커니즘

#### 3.2.1 시범 연주 시스템
```javascript
class DemonstrationSystem {
  constructor(level, instruments) {
    this.level = level;
    this.instruments = instruments;
    this.pattern = this.generatePattern();
    this.playbackSpeed = this.getPlaybackSpeed();
  }
  
  generatePattern() {
    // 난이도별 패턴 생성
    const complexity = Math.floor(this.level / 3) + 1;
    const measures = 4; // 4마디
    const beatsPerMeasure = 16; // 16비트
    
    return PatternGenerator.create({
      complexity: complexity,
      instruments: this.instruments,
      measures: measures,
      beatsPerMeasure: beatsPerMeasure
    });
  }
  
  async playDemonstration() {
    // 시각적 + 청각적 시범
    for (let beat of this.pattern) {
      await this.highlightInstrument(beat.instrument, beat.timing);
      await this.playSound(beat.instrument, beat.timing);
      await this.wait(beat.duration);
    }
  }
}
```

#### 3.2.2 정확도 판정 시스템
```javascript
class AccuracyJudge {
  static timingWindows = {
    PERFECT: 50,   // ±50ms
    GREAT: 100,    // ±100ms
    GOOD: 150,     // ±150ms
    MISS: 200      // ±200ms
  };
  
  static scoreMultipliers = {
    PERFECT: 1.0,
    GREAT: 0.8,
    GOOD: 0.6,
    MISS: 0.0
  };
  
  judgeHit(expectedTime, actualTime) {
    const timeDiff = Math.abs(expectedTime - actualTime);
    
    if (timeDiff <= this.timingWindows.PERFECT) return 'PERFECT';
    if (timeDiff <= this.timingWindows.GREAT) return 'GREAT';
    if (timeDiff <= this.timingWindows.GOOD) return 'GOOD';
    return 'MISS';
  }
}
```

## 4. 점수 및 랭킹 시스템

### 4.1 점수 계산 공식
```javascript
class ScoreCalculator {
  calculateScore(hits, level, combo) {
    const baseScore = hits.reduce((total, hit) => {
      const accuracy = AccuracyJudge.scoreMultipliers[hit.judgment];
      const levelMultiplier = 1 + (level * 0.1);
      const comboMultiplier = Math.min(combo * 0.01, 2.0);
      
      return total + (100 * accuracy * levelMultiplier * comboMultiplier);
    }, 0);
    
    // 완주 보너스
    const completionBonus = this.isLevelCompleted ? level * 1000 : 0;
    
    return Math.floor(baseScore + completionBonus);
  }
}
```

### 4.2 랭킹 시스템
```javascript
class RankingSystem {
  structure = {
    playerName: String,
    totalScore: Number,
    highestLevel: Number,
    playTime: Number, // 초 단위
    perfectHits: Number,
    playDate: Date,
    rank: Number
  };
  
  updateRanking(playerData) {
    let rankings = this.loadRankings();
    rankings.push(playerData);
    rankings.sort((a, b) => b.totalScore - a.totalScore);
    rankings = rankings.slice(0, 100); // 상위 100명만 저장
    
    // 순위 업데이트
    rankings.forEach((player, index) => {
      player.rank = index + 1;
    });
    
    this.saveRankings(rankings);
    return rankings;
  }
}
```

## 5. UI/UX 설계

### 5.1 화면 구성

#### 5.1.1 로그인 화면
```javascript
const loginScreen = {
  layout: "중앙 정렬",
  elements: {
    title: "Rhythm Echo",
    subtitle: "패턴을 듣고, 따라 치고, 마스터하세요!",
    nameInput: {
      placeholder: "플레이어 이름 (2-12자)",
      validation: "실시간",
      enterKey: "게임 시작"
    },
    guestButton: "게스트로 플레이",
    rankingButton: "랭킹 보기"
  }
};
```

#### 5.1.2 게임 화면
```javascript
const gameScreen = {
  layout: {
    header: {
      playerName: "좌상단",
      currentScore: "중상단",
      level: "우상단",
      combo: "우상단 하위"
    },
    main: {
      instrumentIndicators: "중앙 상단",
      beatLine: "중앙",
      keyMappings: "중앙 하단",
      progressBar: "하단"
    },
    footer: {
      pauseButton: "좌하단",
      volume: "우하단"
    }
  }
};
```

### 5.2 비주얼 피드백 시스템
```javascript
class VisualFeedbackSystem {
  showInstrumentActivation(instrument, intensity) {
    // 악기별 고유 색상으로 빛남
    const color = instruments[instrument].color;
    const glowEffect = new GlowEffect(color, intensity);
    
    // 파티클 효과
    this.createParticles(instrument, color);
    
    // 화면 펄스 효과
    this.screenPulse(color, intensity * 0.3);
  }
  
  showAccuracyFeedback(judgment) {
    const effects = {
      PERFECT: { text: "PERFECT!", color: "#FFD700", size: 48 },
      GREAT: { text: "GREAT!", color: "#00FF00", size: 36 },
      GOOD: { text: "GOOD", color: "#FFFF00", size: 28 },
      MISS: { text: "MISS", color: "#FF0000", size: 24 }
    };
    
    this.showFloatingText(effects[judgment]);
  }
}
```

## 6. 기술 스펙

### 6.1 프론트엔드 아키텍처
```javascript
// 주요 클래스 구조
class RhythmEchoGame {
  constructor() {
    this.scenes = {
      login: LoginScene,
      menu: MenuScene,
      game: GameScene,
      ranking: RankingScene
    };
    
    this.systems = {
      audio: AudioManager,
      input: InputManager,
      score: ScoreManager,
      pattern: PatternGenerator,
      storage: LocalStorageManager
    };
  }
}

// Phaser 설정
const gameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  backgroundColor: '#1a1a2e',
  scene: [LoginScene, MenuScene, GameScene, RankingScene],
  audio: {
    disableWebAudio: false,
    context: false
  }
};
```

### 6.2 오디오 시스템
```javascript
class AudioManager {
  constructor() {
    this.instruments = new Map();
    this.metronome = null;
    this.masterVolume = 0.7;
    this.instrumentVolumes = new Map();
  }
  
  loadInstruments() {
    Object.entries(instruments).forEach(([key, instrument]) => {
      this.scene.load.audio(instrument.name, instrument.sound);
    });
  }
  
  playInstrument(instrumentKey, timing = 0) {
    const instrument = this.instruments.get(instrumentKey);
    if (instrument) {
      this.scene.sound.play(instrument.name, {
        volume: this.getInstrumentVolume(instrumentKey),
        delay: timing
      });
    }
  }
  
  playMetronome(bpm) {
    const interval = 60000 / bpm; // ms per beat
    this.metronome = this.scene.time.addEvent({
      delay: interval,
      callback: () => this.playClick(),
      loop: true
    });
  }
}
```

### 6.3 데이터 저장 구조
```javascript
// localStorage 데이터 구조
const playerData = {
  playerInfo: {
    name: "플레이어명",
    playerKey: "rhythmEcho_player_1642123456789",
    createdAt: "2024-01-15T10:30:00Z",
    lastPlayed: "2024-01-15T10:30:00Z"
  },
  gameProgress: {
    highestLevel: 12,
    totalScore: 156789,
    totalPlayTime: 7200, // 초
    gamesPlayed: 45,
    averageAccuracy: 0.847
  },
  statistics: {
    perfectHits: 2341,
    greatHits: 1876,
    goodHits: 543,
    missedHits: 234,
    longestCombo: 127,
    favoriteInstrument: "드럼"
  },
  settings: {
    masterVolume: 0.7,
    effectsVolume: 0.8,
    keyBindings: {1: "킥드럼", 2: "스네어드럼", /*...*/}
  }
};
```

## 7. 개발 일정

### Phase 1: 핵심 기능 개발 (2주)
- [x] 프로젝트 셋업 및 Phaser.js 환경 구성
- [ ] 로그인 시스템 및 localStorage 연동
- [ ] 기본 게임 화면 레이아웃
- [ ] 오디오 시스템 구현
- [ ] 1단계 난이도 (드럼 1개) 구현

### Phase 2: 게임플레이 확장 (2주)
- [ ] 시범 연주 시스템 구현
- [ ] 정확도 판정 시스템
- [ ] 2-6단계 난이도 구현
- [ ] 점수 계산 시스템
- [ ] 비주얼 피드백 시스템

### Phase 3: 고급 기능 (1주)
- [ ] 7-18단계 고난이도 구현
- [ ] 랭킹 시스템 완성
- [ ] 사운드 및 그래픽 최적화
- [ ] 반응형 디자인 적용

### Phase 4: 테스트 및 배포 (1주)
- [ ] 베타 테스트 및 버그 수정
- [ ] 성능 최적화
- [ ] 배포 환경 설정
- [ ] 문서화 완성

## 8. 성공 지표 (KPI)

### 8.1 사용자 참여도
- **일일 활성 사용자**: 목표 100명
- **평균 세션 시간**: 목표 15분
- **재방문율**: 목표 60%
- **레벨 완주율**: 목표 70%

### 8.2 게임 밸런스
- **난이도별 완주율**: 각 단계별 40-80% 유지
- **평균 정확도**: 75-85% 범위
- **최고 레벨 도달자**: 전체 유저의 5-10%

### 8.3 기술적 지표
- **페이지 로딩 시간**: 3초 이하
- **오디오 지연**: 50ms 이하
- **프레임률**: 60fps 유지
- **크로스 브라우저 호환성**: 95% 이상

이 PRD를 기반으로 체계적인 개발을 진행하시면 완성도 높은 리듬 게임을 만들 수 있을 것입니다!