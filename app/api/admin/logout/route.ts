import { NextResponse } from 'next/server';

export async function POST() {
  console.log('[LogoutAPI] Logout request received');

  const response = NextResponse.json({ success: true });

  // Log prima di cancellare
  console.log('[LogoutAPI] Deleting cookies: admin_access_token, admin_refresh_token');

  // Elimina i cookie
  response.cookies.delete('admin_access_token');
  response.cookies.delete('admin_refresh_token');

  console.log('[LogoutAPI] Cookies deleted successfully');

  return response;
}
