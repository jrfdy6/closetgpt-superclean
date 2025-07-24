export default function DebugPage() {
  return (
    <div>
      <h1>Debug Page</h1>
      <p>This is a very simple page to test if Next.js is working.</p>
      <p>Environment: {process.env.NODE_ENV}</p>
      <p>API URL: {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</p>
    </div>
  );
}
