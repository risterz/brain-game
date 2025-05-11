import { supabase } from './lib/supabaseClient';

/**
 * Utility to clean duplicate Pattern Recognition game entries that may be causing
 * incorrect score calculations in the Dashboard.
 * 
 * The issue was discovered where multiple game entries were being created for a single
 * game session, leading to inflated score counts and incorrect progress tracking.
 */
export const cleanDuplicateGames = async () => {
  console.log('Starting duplicate game cleanup operation...');
  
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;
    
    if (!session) {
      console.error('No authenticated user session found');
      return { success: false, message: 'Authentication required' };
    }
    
    const userId = session.user.id;
    
    // Get all the user's games, with a focus on pattern recognition games
    // which are the main source of duplicates
    const { data: gameData, error: gameError } = await supabase
      .from('score_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('created_at', { ascending: false });
    
    if (gameError) {
      console.error('Error fetching games:', gameError);
      return { success: false, message: gameError.message };
    }
    
    if (!gameData || gameData.length === 0) {
      console.log('No games found to check for duplicates');
      return { success: true, totalChecked: 0, totalRemoved: 0 };
    }
    
    console.log(`Found ${gameData.length} total games to check`);
    
    // Group games by date and game_id to find duplicates
    const gamesByDateAndType = {};
    
    gameData.forEach(game => {
      // Create a date string without time for grouping by day
      const dateStr = new Date(game.created_at).toISOString().split('T')[0];
      const key = `${dateStr}_${game.game_id}`;
      
      if (!gamesByDateAndType[key]) {
        gamesByDateAndType[key] = [];
      }
      
      gamesByDateAndType[key].push(game);
    });
    
    // Identify duplicates (any game with more than one entry per day)
    const duplicateGroups = Object.values(gamesByDateAndType)
      .filter(group => group.length > 1);
    
    if (duplicateGroups.length === 0) {
      console.log('No duplicate game entries found');
      return { success: true, totalChecked: gameData.length, totalRemoved: 0 };
    }
    
    console.log(`Found ${duplicateGroups.length} game types with duplicates`);
    
    // For each group of duplicates, keep the one with highest score and delete others
    let totalRemoved = 0;
    
    for (const group of duplicateGroups) {
      if (group.length <= 1) continue;
      
      // Sort by score (highest first)
      group.sort((a, b) => (b.score || 0) - (a.score || 0));
      
      // Keep the first entry (highest score) and delete the rest
      const entriesToRemove = group.slice(1);
      
      for (const entry of entriesToRemove) {
        const { error: deleteError } = await supabase
          .from('score_logs')
          .delete()
          .eq('id', entry.id);
        
        if (deleteError) {
          console.error(`Error deleting duplicate entry ${entry.id}:`, deleteError);
        } else {
          totalRemoved++;
          console.log(`Removed duplicate entry ${entry.id} for ${entry.game_id}`);
        }
      }
    }
    
    console.log(`Cleanup complete. Removed ${totalRemoved} duplicate entries`);
    
    // Recalculate user stats after cleanup
    await recalculateUserStats(userId);
    
    return {
      success: true,
      totalChecked: gameData.length,
      totalRemoved: totalRemoved
    };
    
  } catch (error) {
    console.error('Error during duplicate cleanup:', error);
    return {
      success: false,
      message: error.message || 'Unknown error during cleanup'
    };
  }
};

/**
 * Recalculates and updates user statistics after duplicate removal
 * to ensure dashboard displays accurate information
 */
export const recalculateUserStats = async (userId) => {
  try {
    if (!userId) {
      console.error('User ID required for recalculation');
      return false;
    }
    
    // Get updated game data after cleanup
    const { data: gameData, error: gameError } = await supabase
      .from('score_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true);
    
    if (gameError) {
      console.error('Error fetching games for recalculation:', gameError);
      return false;
    }
    
    if (!gameData || gameData.length === 0) {
      console.log('No games found for recalculation');
      return true;
    }
    
    // Calculate updated statistics
    const totalGames = gameData.length;
    const totalScore = gameData.reduce((sum, game) => sum + (game.score || 0), 0);
    const totalTimeSeconds = gameData.reduce((sum, game) => sum + (game.time_seconds || 0), 0);
    
    // Get or create user_stats record
    const { data: statsData, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (statsError && statsError.code !== 'PGRST116') { // Not found error code
      console.error('Error fetching user stats:', statsError);
      return false;
    }
    
    const statsExists = statsData !== null;
    
    // Update or insert user stats
    const statsUpdate = {
      user_id: userId,
      games_played: totalGames,
      total_score: totalScore,
      total_time_seconds: totalTimeSeconds,
      last_updated: new Date().toISOString()
    };
    
    if (statsExists) {
      const { error: updateError } = await supabase
        .from('user_stats')
        .update(statsUpdate)
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('Error updating user stats:', updateError);
        return false;
      }
    } else {
      const { error: insertError } = await supabase
        .from('user_stats')
        .insert([statsUpdate]);
      
      if (insertError) {
        console.error('Error inserting user stats:', insertError);
        return false;
      }
    }
    
    console.log(`Successfully recalculated stats for user ${userId}`);
    return true;
    
  } catch (error) {
    console.error('Error during stats recalculation:', error);
    return false;
  }
};