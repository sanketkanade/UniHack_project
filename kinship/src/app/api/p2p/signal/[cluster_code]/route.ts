import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { cluster_code: string } }
) {
  try {
    const body = await request.json();
    
    // In a real app, this would use Redis, WebSockets, or a DB to pass WebRTC offers/answers
    // For this hackathon simulation, we just return a success mock
    
    return NextResponse.json({
      success: true,
      message: "Signal received by simulated STUN/TURN server",
      cluster: params.cluster_code,
      data: body,
      peers_available: Math.floor(Math.random() * 5) + 1
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process signal" },
      { status: 500 }
    );
  }
}
