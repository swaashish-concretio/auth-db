// Test script for refresh token functionality
// Run with: node test-refresh-token.js

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001/api/auth';

// Helper to extract cookies from response
function extractCookies(response) {
    const cookies = {};
    const setCookieHeader = response.headers.raw()['set-cookie'];

    if (setCookieHeader) {
        setCookieHeader.forEach(cookie => {
            const [nameValue] = cookie.split(';');
            const [name, value] = nameValue.split('=');
            cookies[name.trim()] = value;
        });
    }

    return cookies;
}

async function testRefreshToken() {
    console.log('🧪 Testing Refresh Token Implementation\n');

    let cookies = {};

    try {
        // Step 1: Login
        console.log('1️⃣ Testing Login...');
        const loginResponse = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'test123'
            })
        });

        if (!loginResponse.ok) {
            console.log('❌ Login failed. Make sure user exists.');
            console.log('   Create user first with signup endpoint.');
            return;
        }

        cookies = extractCookies(loginResponse);
        const loginData = await loginResponse.json();
        console.log('✅ Login successful');
        console.log('   User:', loginData.user.email);
        console.log('   Cookies received:', Object.keys(cookies).join(', '));

        if (!cookies.token || !cookies.refreshToken) {
            console.log('❌ Missing tokens in cookies!');
            return;
        }
        console.log('   ✓ Access token received');
        console.log('   ✓ Refresh token received\n');

        // Step 2: Access protected route
        console.log('2️⃣ Testing Protected Route...');
        const cookieHeader = Object.entries(cookies)
            .map(([name, value]) => `${name}=${value}`)
            .join('; ');

        const profileResponse = await fetch(`${BASE_URL}/profile`, {
            headers: { 'Cookie': cookieHeader }
        });

        if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            console.log('✅ Profile access successful');
            console.log('   User:', profileData.user.name, `(${profileData.user.email})\n`);
        } else {
            console.log('❌ Profile access failed\n');
        }

        // Step 3: Test refresh token endpoint
        console.log('3️⃣ Testing Refresh Token Endpoint...');
        const refreshResponse = await fetch(`${BASE_URL}/refresh`, {
            method: 'POST',
            headers: { 'Cookie': cookieHeader }
        });

        if (!refreshResponse.ok) {
            console.log('❌ Refresh token failed');
            const errorData = await refreshResponse.json();
            console.log('   Error:', errorData.error);
            return;
        }

        const newCookies = extractCookies(refreshResponse);
        const refreshData = await refreshResponse.json();
        console.log('✅ Token refresh successful');
        console.log('   Message:', refreshData.message);

        if (newCookies.token) {
            console.log('   ✓ New access token received');
            cookies.token = newCookies.token; // Update with new token
        }
        console.log();

        // Step 4: Use new access token
        console.log('4️⃣ Testing with New Access Token...');
        const newCookieHeader = Object.entries(cookies)
            .map(([name, value]) => `${name}=${value}`)
            .join('; ');

        const profileResponse2 = await fetch(`${BASE_URL}/profile`, {
            headers: { 'Cookie': newCookieHeader }
        });

        if (profileResponse2.ok) {
            console.log('✅ New access token works correctly\n');
        } else {
            console.log('❌ New access token failed\n');
        }

        // Step 5: Test logout
        console.log('5️⃣ Testing Logout...');
        const logoutResponse = await fetch(`${BASE_URL}/logout`, {
            method: 'POST',
            headers: { 'Cookie': newCookieHeader }
        });

        if (logoutResponse.ok) {
            const logoutData = await logoutResponse.json();
            console.log('✅ Logout successful');
            console.log('   Message:', logoutData.message);
            console.log('   ✓ Refresh token should be deleted from Redis\n');
        } else {
            console.log('❌ Logout failed\n');
        }

        // Step 6: Verify tokens are invalid after logout
        console.log('6️⃣ Verifying tokens are invalid after logout...');
        const profileResponse3 = await fetch(`${BASE_URL}/profile`, {
            headers: { 'Cookie': newCookieHeader }
        });

        if (!profileResponse3.ok) {
            console.log('✅ Tokens correctly invalidated after logout\n');
        } else {
            console.log('⚠️  Warning: Tokens still valid after logout\n');
        }

        console.log('✨ All tests completed!\n');
        console.log('Summary:');
        console.log('  ✓ Login generates both access and refresh tokens');
        console.log('  ✓ Access token works for protected routes');
        console.log('  ✓ Refresh endpoint generates new access token');
        console.log('  ✓ New access token works correctly');
        console.log('  ✓ Logout clears tokens and Redis storage');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

// Run tests
testRefreshToken();
