import { NextRequest, NextResponse } from "next/server";

// Use environment variables for sensitive information
const BASIC_AUTH_USER = process.env.BASIC_AUTH_USER || "testuser";
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD || "testpassword";

export const config = {
  matcher: [
    "/api/chat/",
    "/api/chat/lang",
    "/api/visio",
    "/api/seed",
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

export function middleware(req: NextRequest) {
  // Skip authentication for public routes if needed
//   if (req.nextUrl.pathname.startsWith("/public")) {
//     return NextResponse.next();
//   }

  const basicAuth = req.headers.get("authorization");

  if (basicAuth) {
    const authValue = basicAuth.split(" ")[1];
    const [user, pwd] = atob(authValue).split(":");

    if (user === BASIC_AUTH_USER && pwd === BASIC_AUTH_PASSWORD) {
      return NextResponse.next();
    }
  }

  // If not authenticated, force authentication prompt
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure Area"',
    },
  });
}
