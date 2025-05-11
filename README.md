# Brain Game

A fully functional, interactive, and engaging brain game website designed to challenge and enhance users' cognitive abilities across various mental domains.

![Brain Game Preview](https://github.com/risterz/brain-game/raw/index/Screenshot%202025-05-07%20021549.png)

## 🎮 Features

- **Multiple Brain Games**: Challenge yourself with various cognitive exercises
- **Adjustable Difficulty Levels**: Customize your experience based on skill level
- **User Accounts & Progress Tracking**: Track your improvement over time
- **Responsive Design**: Play on any device seamlessly
- **Leaderboards**: Compare your scores with other players
- **Dark Mode Support**: Easy on the eyes for extended play sessions

## 🚀 Live Demo

[Coming Soon]

## 🛠️ Tech Stack

- **Frontend**: 
  - React.js
  - Tailwind CSS
  - React Router
  
- **Backend & Authentication**:
  - Supabase (PostgreSQL)
  - Supabase Auth

- **Deployment**:
  - Netlify

## 📋 Prerequisites

- Node.js (v14+)
- npm or yarn
- Supabase account (for database features)

## 🚀 Getting Started

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/brain-game.git
   cd brain-game
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

## 📊 Database Structure

The application uses Supabase (PostgreSQL) with the following main tables:

- **users**: User profiles and settings
- **score_logs**: Game scores and progress tracking
- **games**: Available games and metadata

## 🧩 Game Types

1. **Memory Games**
   - Memory Match: Find matching pairs of cards
   - Sequence Recall: Remember and reproduce sequences

2. **Logic Games**
   - Pattern Recognition: Identify and complete patterns
   - Sudoku: Classic number puzzle

3. **Math Games**
   - Quick Math: Solve arithmetic problems against time
   - Number Puzzles: Mathematical challenges

4. **Reaction Games**
   - Reaction Test: Test your reflexes
   - Snake Game: Classic snake game with speed challenges

## 🔧 Development Notes

### Known Issues

- Dashboard may sometimes not display game progress correctly due to errors when accessing the Supabase database
- Empty error objects when querying scores
- The dashboard has been modified to include:
  - Direct database querying instead of using helper functions
  - Better error handling with detailed logging
  - Fallback mechanisms for simpler queries when main queries fail
  - Display of available score data even when errors occur

### Utility Functions

- `cleanDuplicateGames()`: Removes duplicate game entries to ensure accurate progress tracking
- `recalculateUserStats()`: Updates user statistics based on the latest data

## 📜 License

[MIT](LICENSE)

## 📧 Contact

For any questions or support, please open an issue on GitHub.

---

Made with ❤️ for cognitive enhancement