import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { getUserBestScores } from '../lib/supabase'
import { cleanDuplicateGames, recalculateUserStats } from '../cleanDuplicates'

// Default empty user stats for new users
const defaultUserStats = {
  gamesPlayed: 0,
  totalScore: 0,
  averageAccuracy: 0,
  timeSpent: 0, // minutes
  level: 1,
  expPoints: 0,
  nextLevelAt: 1000
}

// Mock achievements data (this would typically come from a database)
const mockAchievements = [
  { id: 1, name: 'Quick Learner', description: 'Complete 10 games', completed: false, icon: '🏆' },
  { id: 2, name: 'Math Wizard', description: 'Score 1000+ in Quick Math', completed: false, icon: '🧮' },
  { id: 3, name: 'Memory Master', description: 'Complete Memory Match on Hard difficulty', completed: false, icon: '🧠' },
  { id: 4, name: 'Lightning Reflexes', description: 'Average reaction time under 300ms', completed: false, icon: '⚡' },
  { id: 5, name: 'Pattern Pro', description: 'Solve 20 pattern puzzles without mistakes', completed: false, icon: '📊' },
  { id: 6, name: 'Daily Dedication', description: 'Play games on 7 consecutive days', completed: false, icon: '📅' }
]

// Default progress data for new users
const defaultProgressData = [
  { name: 'Memory', value: 0 },
  { name: 'Logic', value: 0 },
  { name: 'Math', value: 0 },
  { name: 'Reaction', value: 0 },
]

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [userStats, setUserStats] = useState(defaultUserStats)
  const [recentGames, setRecentGames] = useState([])
  const [achievements, setAchievements] = useState(mockAchievements)
  const [progressData, setProgressData] = useState(defaultProgressData)
  const [isLoading, setIsLoading] = useState(true)
  
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  
  // Clean duplicate games function
  const handleCleanDuplicateGames = async () => {
    if (!confirm('This will remove duplicate Pattern Recognition games and fix score calculations. Continue?')) {
      return;
    }
    
    setIsLoading(true);
    console.log('Cleaning duplicate game entries...');
    
    try {
      // Use the external utility function to clean duplicates
      const result = await cleanDuplicateGames();
      
      if (result.success) {
        if (result.totalRemoved > 0) {
          alert(`Successfully removed ${result.totalRemoved} duplicate games out of ${result.totalChecked} checked.`);
        } else {
          alert('No duplicate games were found to remove.');
        }
        // Refresh dashboard with corrected data
        await refreshDashboard();
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (err) {
      console.error('Error during cleanup:', err);
      alert('Error cleaning duplicate games');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Dashboard refresh function
  const refreshDashboard = async () => {
    setIsLoading(true);
    console.log('Refreshing dashboard data...');
    
    try {
      // Get current auth session
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      const userId = session?.user?.id;
      
      if (!userId) {
        console.log('No authenticated user found');
        setIsLoading(false);
        return;
      }
      
      // IMPORTANT: Get ONLY completed games to avoid intermediate scores
      const { data: scoreData, error } = await supabase
        .from('score_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', true);
      
      if (error) {
        console.error('Error fetching score data:', error);
        setIsLoading(false);
        return;
      }
      
      if (scoreData && scoreData.length > 0) {
        // Create a map to store only the highest score for each game type per day
        // This ensures we don't count duplicate games
        const gameMap = new Map();
        
        // Sort games by date (newest first) and score (highest first)
        const sortedGames = [...scoreData].sort((a, b) => {
          // First by score (highest first)
          const scoreCompare = (b.score || 0) - (a.score || 0);
          if (scoreCompare !== 0) return scoreCompare;
          
          // Then by date (newest first)
          return new Date(b.created_at) - new Date(a.created_at);
        });
        
        // For each game, create a unique key based on game type and date
        sortedGames.forEach(game => {
          const gameDate = new Date(game.created_at).toDateString();
          const gameKey = `${game.game_id}_${gameDate}`;
          
          // Only keep the highest score for each game type per day
          if (!gameMap.has(gameKey)) {
            gameMap.set(gameKey, game);
          }
        });
        
        // Convert map values to array for our unique games
        const uniqueGames = Array.from(gameMap.values());
        console.log(`Found ${scoreData.length} total games, reduced to ${uniqueGames.length} unique games`);
        
        // Calculate user stats based on unique games only
        const gamesPlayed = uniqueGames.length;
        const totalScore = uniqueGames.reduce((sum, game) => sum + (game.score || 0), 0);
        
        // Time calculation
        const totalSeconds = uniqueGames.reduce((sum, game) => sum + (game.time_seconds || 0), 0);
        const minutes = Math.floor(totalSeconds / 60);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        // Level and XP calculation
        const level = Math.max(1, Math.floor(totalScore / 1000) + 1);
        const expPoints = totalScore % 1000;
        const levelProgress = Math.floor((expPoints / 1000) * 100);
        
        // Update user stats with corrected values
        setUserStats({
          gamesPlayed,
          totalScore,
          averageAccuracy: 0, // Calculate if needed
          timeSpent: minutes,
          timeSpentFormatted: `${hours}h ${remainingMinutes}m`,
          level,
          expPoints,
          levelProgress,
          nextLevelAt: 1000
        });
        
        // Create recent games list (sorting by most recent)
        const recentGamesData = uniqueGames
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
          .map(game => ({
            id: game.id,
            game: game.game_id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            date: new Date(game.created_at).toISOString().split('T')[0],
            score: game.score || 0,
            level: game.level ? game.level.charAt(0).toUpperCase() + game.level.slice(1) : 'Easy'
          }));
        
        setRecentGames(recentGamesData);
        
        // Update progress data for cognitive skills (using unique games only)
        // Group games by type
        const memoryGames = uniqueGames.filter(game => 
          game.game_id.includes('memory') || game.game_id.includes('match')
        );
        
        const logicGames = uniqueGames.filter(game => 
          game.game_id.includes('pattern') || game.game_id.includes('sudoku') || game.game_id.includes('2048')
        );
        
        const mathGames = uniqueGames.filter(game => 
          game.game_id.includes('math') || game.game_id.includes('quick-math')
        );
        
        const reactionGames = uniqueGames.filter(game => 
          game.game_id.includes('reaction') || game.game_id.includes('snake')
        );
        
        // Calculate cognitive skill values
        const getSkillValue = (games) => {
          const score = games.reduce((sum, game) => sum + (game.score || 0), 0);
          return Math.min(100, 5 + Math.floor(score / 30));
        };
        
        setProgressData([
          { name: 'Memory', value: getSkillValue(memoryGames) },
          { name: 'Logic', value: getSkillValue(logicGames) },
          { name: 'Math', value: getSkillValue(mathGames) },
          { name: 'Reaction', value: getSkillValue(reactionGames) }
        ]);
        
      } else {
        // No games found - set defaults
        setUserStats(defaultUserStats);
        setRecentGames([]);
        setProgressData(defaultProgressData);
      }
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch data on component mount
  useEffect(() => {
    refreshDashboard();
  }, [currentUser]);
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading dashboard data...</div>
        </div>
      ) : (
        <div>
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard
              <p className="text-sm font-normal text-gray-600">Welcome back, {currentUser?.user_metadata?.display_name || 'Player'}!</p>
            </h1>
            <div className="flex space-x-3">
              <button
                onClick={handleCleanDuplicateGames}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 flex items-center"
                disabled={isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Fix Score Data
              </button>
              <button
                onClick={() => navigate('/games')}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Play Games
              </button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="mb-8 border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-1 py-4 text-sm font-medium ${
                  activeTab === 'overview'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`px-1 py-4 text-sm font-medium ${
                  activeTab === 'progress'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Progress
              </button>
              <button
                onClick={() => setActiveTab('achievements')}
                className={`px-1 py-4 text-sm font-medium ${
                  activeTab === 'achievements'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Achievements
              </button>
            </nav>
          </div>
          
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-4xl font-bold text-purple-600 mb-1">
                    {userStats.gamesPlayed}
                  </div>
                  <div className="text-sm text-gray-600">
                    Games Played
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-4xl font-bold text-purple-600 mb-1">
                    {userStats.totalScore.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    Total Score
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-4xl font-bold text-purple-600 mb-1">
                    {userStats.averageAccuracy}%
                  </div>
                  <div className="text-sm text-gray-600">
                    Average Accuracy
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-4xl font-bold text-purple-600 mb-1">
                    {userStats.timeSpentFormatted || '0h 0m'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Time Spent Training
                  </div>
                </div>
              </div>
              
              {/* Level Progress */}
              <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">Level Progress</h3>
                  <span className="text-purple-600 font-semibold">Level {userStats.level}</span>
                </div>
                
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{userStats.expPoints} / 1000 XP</span>
                  <span>{userStats.levelProgress || 0}%</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-purple-600 h-2.5 rounded-full" 
                    style={{ width: `${userStats.levelProgress || 0}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Recent Games */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Recent Games</h2>
                
                <div className="bg-white overflow-hidden shadow-sm rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Game
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Level
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentGames.length > 0 ? (
                        recentGames.map((game) => (
                          <tr key={game.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {game.game}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {game.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="text-purple-600 font-semibold">{game.score}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {game.level}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                            You haven't played any games yet. <Link to="/games" className="text-purple-600 hover:text-purple-700">Start playing!</Link>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {/* Progress Tab */}
          {activeTab === 'progress' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Cognitive Skills Progress</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {progressData.map((skill) => (
                  <div key={skill.name} className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold">{skill.name}</h3>
                      <span className="text-purple-600 font-semibold">{skill.value}%</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                      <div 
                        className="bg-purple-600 h-2.5 rounded-full" 
                        style={{ width: `${skill.value}%` }}
                      ></div>
                    </div>
                    
                    <p className="text-sm text-gray-600">
                      {skill.value < 20 && `You're just getting started with ${skill.name.toLowerCase()} exercises.`}
                      {skill.value >= 20 && skill.value < 50 && `You're making good progress in ${skill.name.toLowerCase()} skills.`}
                      {skill.value >= 50 && skill.value < 80 && `You're becoming quite proficient in ${skill.name.toLowerCase()} tasks!`}
                      {skill.value >= 80 && `You've mastered ${skill.name.toLowerCase()} exercises! Keep it up!`}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Training Recommendations</h3>
                
                <ul className="space-y-3">
                  {progressData.sort((a, b) => a.value - b.value).slice(0, 2).map((skill) => (
                    <li key={`rec-${skill.name}`} className="flex items-start">
                      <span className="text-purple-600 mr-2">•</span>
                      <p className="text-gray-700">
                        <span className="font-medium">Focus on {skill.name} games</span> - Your {skill.name.toLowerCase()} skills have the most room for improvement.
                      </p>
                    </li>
                  ))}
                  
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">•</span>
                    <p className="text-gray-700">
                      <span className="font-medium">Play daily</span> - Regular practice leads to better cognitive improvement.
                    </p>
                  </li>
                  
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">•</span>
                    <p className="text-gray-700">
                      <span className="font-medium">Increase difficulty</span> - Challenge yourself with harder levels as you improve.
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          )}
          
          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Your Achievements</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div 
                    key={achievement.id} 
                    className={`flex items-center p-4 rounded-lg ${
                      achievement.completed 
                        ? 'bg-purple-50 border border-purple-200' 
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <div className={`flex items-center justify-center h-12 w-12 rounded-full mr-4 ${
                      achievement.completed ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <span className="text-2xl">{achievement.icon}</span>
                    </div>
                    
                    <div>
                      <h3 className={`font-semibold ${achievement.completed ? 'text-purple-700' : 'text-gray-700'}`}>
                        {achievement.name}
                      </h3>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                    </div>
                    
                    {achievement.completed && (
                      <div className="ml-auto">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          Unlocked
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Dashboard