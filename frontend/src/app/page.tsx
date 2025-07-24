export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">ClosetGPT</h1>
        <p className="text-lg mb-8">Your AI-powered personal stylist</p>
        <div className="space-y-4">
          <a href="/debug" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block">
            Debug Page
          </a>
        </div>
      </div>
    </div>
  );
}
