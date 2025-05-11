import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Featured games that will be displayed on the home page
const featuredGames = [
  {
    id: 'memory-match',
    name: 'Memory Match',
    description: 'Test and improve your memory by matching pairs of cards',
    icon: '🧠',
    category: 'Memory',
    difficulty: 'Easy to Hard',
    background: 'bg-blue-100'
  },
  {
    id: 'quick-math',
    name: 'Quick Math',
    description: 'Solve arithmetic problems against time to boost your calculation speed',
    icon: '🔢',
    category: 'Math',
    difficulty: 'Adaptive',
    background: 'bg-green-100'
  },
  {
    id: 'pattern-recognition',
    name: 'Pattern Recognition',
    description: 'Identify patterns and sequences to enhance logical thinking',
    icon: '📊',
    category: 'Logic',
    difficulty: 'Medium',
    background: 'bg-purple-100'
  },
  {
    id: 'reaction-test',
    name: 'Reaction Test',
    description: 'Measure and improve your reaction time',
    icon: '⚡',
    category: 'Reaction',
    difficulty: 'Easy',
    background: 'bg-yellow-100'
  }
];

// Benefits of brain training
const benefits = [
  {
    title: 'Memory Enhancement',
    description: 'Regular brain training helps strengthen both short-term and long-term memory functions.',
    icon: '🧠'
  },
  {
    title: 'Cognitive Flexibility',
    description: 'Engaging with diverse mental challenges increases your ability to switch between different concepts.',
    icon: '🔄'
  },
  {
    title: 'Problem-Solving Skills',
    description: 'Brain games improve your analytical thinking and approach to complex problems.',
    icon: '💡'
  },
  {
    title: 'Focus & Concentration',
    description: 'Regular mental exercise enhances your ability to maintain attention for longer periods.',
    icon: '🎯'
  },
  {
    title: 'Processing Speed',
    description: 'Quick-thinking games help accelerate your mental processing abilities.',
    icon: '⚡'
  },
  {
    title: 'Mood Improvement',
    description: 'The satisfaction of mental challenges and achievements boosts overall mood and confidence.',
    icon: '😊'
  }
];

const Home = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Simulate content loading
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className={`transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Hero Section */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Train Your Brain, <span className="text-purple-600 dark:text-purple-400">Enhance Your Mind</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              Engage in fun, science-backed games designed to challenge and improve your cognitive abilities.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/games"
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-300 text-lg font-medium"
              >
                Start Playing
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300 text-lg font-medium"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured Games Section */}
      <section className="py-12 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Featured Games</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Explore our collection of carefully designed brain games to enhance different cognitive functions.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredGames.map((game) => (
              <div 
                key={game.id}
                className={`rounded-lg p-6 border border-gray-200 dark:border-gray-700 ${game.background} dark:bg-gray-700 hover:shadow-lg transition-shadow duration-300 game-card`}
              >
                <div className="text-4xl mb-4">{game.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{game.name}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{game.description}</p>
                <div className="flex justify-between text-sm">
                  <span className="px-2 py-1 bg-white dark:bg-gray-600 rounded-full text-gray-700 dark:text-gray-300">
                    {game.category}
                  </span>
                  <span className="px-2 py-1 bg-white dark:bg-gray-600 rounded-full text-gray-700 dark:text-gray-300">
                    {game.difficulty}
                  </span>
                </div>
                <Link
                  to={`/games/${game.id}`}
                  className="mt-4 inline-block w-full text-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-300"
                >
                  Play Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Benefits of Brain Training</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Regular cognitive exercise provides numerous advantages for your brain health and daily performance.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow duration-300"
              >
                <div className="text-3xl mb-4 float-animation">{benefit.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{benefit.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-12 px-4 bg-purple-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Ready to Challenge Your Brain?</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of users who are already improving their cognitive abilities with our brain games.
          </p>
          <Link
            to="/games"
            className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-300 text-lg font-medium inline-block"
          >
            Start Training Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;