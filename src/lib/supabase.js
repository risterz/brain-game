import { supabase } from './supabaseClient';

/**
 * Get a user's best scores for each game type
 * This function has been updated with better error handling to help with the dashboard
 * issues related to empty error objects when querying scores.
 */
export const getUserBestScores = async (userId) => {
  if (!userId) {
    console.error('getUserBestScores: No user ID provided');
    return { data: [], error: { message: 'No user ID provided' } };
  }
  
  try {
    // First attempt - get all completed games with this more complex query
    let { data, error } = await supabase
      .from('score_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('score', { ascending: false });
    
    // If this fails for any reason, try a simpler query
    if (error) {
      console.error('Error in getUserBestScores complex query:', error);
      
      // Fallback to a simpler query
      const fallbackResult = await supabase
        .from('score_logs')
        .select('id, game_id, score, level, created_at')
        .eq('user_id', userId);
        
      data = fallbackResult.data;
      error = fallbackResult.error;
      
      if (error) {
        console.error('Error in getUserBestScores fallback query:', error);
        return { data: [], error };
      }
    }
    
    if (!data || data.length === 0) {
      return { data: [], error: null };
    }
    
    // Group by game type and keep only the highest score for each
    const bestScores = {};
    
    data.forEach(score => {
      const gameId = score.game_id;
      
      if (!bestScores[gameId] || score.score > bestScores[gameId].score) {
        bestScores[gameId] = score;
      }
    });
    
    return { 
      data: Object.values(bestScores),
      error: null 
    };
    
  } catch (err) {
    console.error('Unexpected error in getUserBestScores:', err);
    return { 
      data: [], 
      error: { message: err.message || 'An unexpected error occurred' } 
    };
  }
};

/**
 * Save a game score to the database
 */
export const saveGameScore = async (gameData) => {
  if (!gameData || !gameData.userId || !gameData.gameId) {
    console.error('saveGameScore: Missing required game data');
    return { success: false, error: { message: 'Missing required game data' } };
  }
  
  try {
    // Validate that the user exists
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', gameData.userId)
      .single();
      
    if (userError || !userData) {
      console.error('User validation error:', userError);
      return { success: false, error: userError || { message: 'User not found' } };
    }
    
    // Prepare score data
    const scoreData = {
      user_id: gameData.userId,
      game_id: gameData.gameId,
      score: gameData.score || 0,
      level: gameData.level || 'easy',
      accuracy: gameData.accuracy || 0,
      time_seconds: gameData.timeSeconds || 0,
      completed: gameData.completed || true,
      metadata: gameData.metadata || {}
    };
    
    // Insert score
    const { data, error } = await supabase
      .from('score_logs')
      .insert([scoreData]);
      
    if (error) {
      console.error('Error saving game score:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
    
  } catch (err) {
    console.error('Unexpected error in saveGameScore:', err);
    return { 
      success: false, 
      error: { message: err.message || 'An unexpected error occurred' } 
    };
  }
};

/**
 * Get leaderboard for a specific game
 */
export const getGameLeaderboard = async (gameId, limit = 10) => {
  if (!gameId) {
    console.error('getGameLeaderboard: No game ID provided');
    return { data: [], error: { message: 'No game ID provided' } };
  }
  
  try {
    // Join with profiles to get usernames
    const { data, error } = await supabase
      .from('score_logs')
      .select(`
        id,
        score,
        level,
        created_at,
        profiles:user_id (
          username,
          display_name
        )
      `)
      .eq('game_id', gameId)
      .eq('completed', true)
      .order('score', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error('Error fetching game leaderboard:', error);
      return { data: [], error };
    }
    
    // Format leaderboard data
    const formattedData = data.map(entry => ({
      id: entry.id,
      score: entry.score,
      level: entry.level,
      date: new Date(entry.created_at).toISOString().split('T')[0],
      player: entry.profiles?.display_name || entry.profiles?.username || 'Anonymous'
    }));
    
    return { data: formattedData, error: null };
    
  } catch (err) {
    console.error('Unexpected error in getGameLeaderboard:', err);
    return { 
      data: [], 
      error: { message: err.message || 'An unexpected error occurred' } 
    };
  }
};