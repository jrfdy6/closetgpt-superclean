import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-6">
            ClosetGPT
          </h1>
          <p className="max-w-[600px] mx-auto text-lg text-muted-foreground sm:text-xl mb-8">
            Your AI-powered personal stylist. Get your first month free.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row justify-center mb-8">
            <Link 
              href="/style-quiz"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              Take Your Style Quiz
            </Link>
            <Link 
              href="/signin"
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              Sign In
            </Link>
          </div>
          <div className="space-y-4">
            <Link 
              href="/dashboard"
              className="text-blue-600 hover:text-blue-700 underline block"
            >
              View Dashboard (Demo)
            </Link>
            <Link 
              href="/hello"
              className="text-blue-600 hover:text-blue-700 underline block"
            >
              Test Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
