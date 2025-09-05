import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("tokenauth")?.value;
  console.log('Middleware: Checking token for path:', request.nextUrl.pathname);
  console.log('Middleware: Token exists:', !!token);

  // Allow access to login page
  if (request.nextUrl.pathname.startsWith('/user/login') || 
      request.nextUrl.pathname.startsWith('/super-admin/login')) {
    return NextResponse.next();
  }

  // Check for protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/orders') ||
      request.nextUrl.pathname.startsWith('/products') ||
      request.nextUrl.pathname.startsWith('/userTable') ||
      request.nextUrl.pathname.startsWith('/chat')) {
    
    if (!token) {
      console.log('Middleware: No token found, redirecting to login');
      return NextResponse.redirect(new URL("/user/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/orders/:path*",
    "/products/:path*",
    "/userTable/:path*",
    "/chat/:path*",
  ],
};
