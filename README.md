# Harvard Connect Four

## Contributors
- **Name:** 
- **GitHub Username:** 
- **Harvard Email:** 
- **Google Drive Link:** 

## Project Links
- **GitHub Repository:** 
- **Netlify Deployment:** 

## Project Description
This is a web-based Connect Four game with AI opponents of varying difficulty levels. The game features a Harvard-themed design with crimson and gold colors, persistent score tracking using browser localStorage, and three AI difficulty levels implementing different algorithms.

### Features
- **3 AI Difficulty Levels:**
  - Easy: Random valid moves
  - Medium: Defensive play with center column preference
  - Hard: Minimax algorithm with alpha-beta pruning (5-move lookahead)
- **Score Persistence:** Win/loss/draw statistics saved in browser localStorage
- **Harvard Theme:** Crimson and gold color scheme with elegant typography
- **Responsive Design:** Works on desktop and mobile devices
- **Smooth Animations:** Piece dropping and winning sequence animations

## Technical Implementation
The AI uses progressively complex algorithms:
- **Easy Mode:** Selects random valid columns
- **Medium Mode:** Checks for immediate wins/blocks, prefers center columns
- **Hard Mode:** Implements minimax with alpha-beta pruning for optimal play

## Development Process
- Used Claude Code Max (Sonnet 4). Took mostly 15min of prompting, and 30m of waiting, testing, deploying, etc. Had to be very specific with prompts otherwise Claude would go off the rails.
