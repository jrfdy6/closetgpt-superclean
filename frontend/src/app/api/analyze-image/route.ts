import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Accept both { image } and { imageUrl }
    const body = await request.json();
    const image = body.image || body.imageUrl;

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Accept both URLs and base64 images
    const isUrl = image.startsWith("http://") || image.startsWith("https://");
    const isBase64 = image.startsWith("data:image/");

    if (!isUrl && !isBase64) {
      return NextResponse.json(
        { error: "Invalid image format. Must be a URL or base64 image." },
        { status: 400 }
      );
    }

    // Forward the request to the backend server
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://closetgpt-clean-production.up.railway.app'}/api/analyze-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Backend error:", errorData);
      return NextResponse.json(
        { 
          error: "Failed to analyze image",
          details: errorData.detail || errorData.message || 'Unknown error'
        },
        { status: response.status }
      );
    }

    const analysis = await response.json();
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Error analyzing image:", error);
    return NextResponse.json(
      { 
        error: "Failed to analyze image", 
        details: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : undefined : undefined
      },
      { status: 500 }
    );
  }
}