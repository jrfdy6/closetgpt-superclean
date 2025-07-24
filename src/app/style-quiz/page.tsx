export default function StyleQuiz() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950 dark:to-pink-900">
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Style Quiz
          </h1>
          <p className="text-lg mb-8 text-gray-600">
            Let's discover your perfect style! Answer a few questions to get personalized recommendations.
          </p>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-4">What's your preferred style?</h3>
                <div className="grid grid-cols-2 gap-4">
                  {['Casual', 'Business', 'Athletic', 'Bohemian', 'Minimalist', 'Vintage', 'Streetwear', 'Classic'].map((style) => (
                    <button
                      key={style}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="pt-6">
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                  Continue Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
