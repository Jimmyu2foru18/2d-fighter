# 2D Fighting Game

A browser-based 2D fighting game built with HTML5 Canvas and JavaScript, featuring smooth animations, special moves, and combat mechanics inspired by classic fighting games.

## Features

- Smooth character animations with state transitions
- Special moves and combo system
- Particle effects and visual feedback
- Sound effects and background music
- Multiple game states (Menu, Character Select, Fighting, Pause)
- Configurable difficulty levels
- Adjustable game speed
- Performance monitoring and optimization

## Getting Started

### Prerequisites

- Modern web browser with HTML5 support
- Local web server (recommended for asset loading)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Jimmyu2foru18/2d-fighter.git
```

2. Set up the project structure:
```
2d-fighter/
├── index.html
├── 2D Fighter.js
├── 2D Fighter.css
├── assets/
│   ├── sprites/
│   │   ├── fighter1/
│   │   └── fighter2/
│   ├── sounds/
│   ├── music/
│   └── backgrounds/
└── README.md
```

3. Start a local web server in the project directory

### Controls

Player 1:
- Arrow keys for movement
- A: Attack
- D: Block
- Special moves: Combination of arrow keys + attack

Player 2:
- WASD for movement
- K: Attack
- L: Block
- Special moves: Combination of movement keys + attack

## Game Mechanics

### Combat System
- Basic attacks and blocks
- Special moves with energy consumption
- Combo system with damage scaling
- Hit effects and particle systems

### Character States
- Idle
- Walking
- Jumping
- Attacking
- Blocking
- Hit stun
- Special moves

### Game Modes
- VS Mode (Player vs Player)
- Single Player (vs AI)
- Practice Mode (coming soon)

## Technical Details

### Core Systems
- Game state management
- Animation system with smooth transitions
- Physics system for movement and collisions
- Input handling with buffer for special moves
- Asset loading and resource management
- Performance monitoring and optimization

### Performance Features
- Object pooling for particles
- Efficient collision detection
- Frame rate independent physics
- Optimized sprite rendering
- Memory management

## Configuration

The game includes several configurable aspects:

```javascript
// Game speed settings
const SPEED_CONFIG = {
    slow: { timeScale: 0.5 },
    normal: { timeScale: 1.0 },
    fast: { timeScale: 1.5 }
};

// Difficulty settings
const DIFFICULTY_CONFIG = {
    easy: { aiReactionTime: 500, aiAccuracy: 0.6 },
    normal: { aiReactionTime: 300, aiAccuracy: 0.8 },
    hard: { aiReactionTime: 150, aiAccuracy: 0.9 }
};
```

## Development

### Building New Features

1. Create new character:
   - Add sprite sheets to assets/sprites/
   - Configure character data in characters.json
   - Implement special moves

2. Add new special moves:
   - Create move class extending SpecialMove
   - Add sprites and effects
   - Configure input sequence

### Code Style

- Use JSDoc comments for documentation
- Follow ES6+ conventions
- Implement error handling
- Use TypeScript-style type definitions

## Acknowledgments

- Inspired by classic fighting games
- Built with vanilla JavaScript for learning purposes
- Special thanks to the gaming community

## Future Improvements

- [ ] Online multiplayer support
- [ ] Additional characters
- [ ] More special moves
- [ ] Training mode
- [ ] Replay system
- [ ] Character customization
- [ ] Tournament mode
