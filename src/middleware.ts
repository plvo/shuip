import { type MiddlewareConfig, type NextRequest, NextResponse } from 'next/server';

const setResponse = (req: NextRequest, path: string, isRedirect = false) => {
  const res = isRedirect ? NextResponse.redirect(new URL(path, req.url)) : NextResponse.next();
  res.headers.set('x-current-path', path);
  return res;
};

export async function middleware(req: NextRequest) {
  const pathname = new URL(req.url).pathname;

  try {
    return setResponse(req, pathname);
  } catch (error) {
    console.error('[MIDDLEWARE] Error fetching session:', error);
    return setResponse(req, pathname, false);
  }
}
export const config = {
  matcher:
    '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webp).*)',
} satisfies MiddlewareConfig;
