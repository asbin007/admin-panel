import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

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
      request.nextUrl.pathname.startsWith('/userTable')) {
    
    if (!token) {
      console.log('Middleware: No token found, redirecting to login');
      return NextResponse.redirect(new URL("/user/login", request.url));
    }

    // Verify token and check role
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRETE_KEY || 'fallback-secret') as { role?: string };
      
      // Check if user has admin role
      if (decoded.role !== 'admin') {
        console.log('Middleware: User is not admin, redirecting to customer frontend');
        return NextResponse.redirect(new URL("https://nike-frontend.vercel.app", request.url));
      }
    } catch {
      console.log('Middleware: Invalid token, redirecting to login');
      return NextResponse.redirect(new URL("/user/login", request.url));
    }
  }

  // Check for chat route - only require token, no role restriction
  if (request.nextUrl.pathname.startsWith('/chat')) {
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
