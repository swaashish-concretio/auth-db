const API_URL = '/api/auth';

// Track if we're already refreshing to avoid multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise = null;

// Helper function to handle API calls with automatic token refresh
const fetchWithRefresh = async (url, options = {}) => {
  // Don't apply refresh logic to the refresh endpoint itself
  if (url.includes('/refresh')) {
    return fetch(url, {
      ...options,
      credentials: 'include',
    });
  }

  let response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  // If unauthorized, try to refresh token and retry
  if (response.status === 401 || response.status === 403) {
    // If already refreshing, wait for that to complete
    if (isRefreshing && refreshPromise) {
      try {
        await refreshPromise;
        // Try the original request again after refresh completes
        response = await fetch(url, {
          ...options,
          credentials: 'include',
        });
        return response;
      } catch (error) {
        throw new Error('Session expired. Please login again.');
      }
    }

    // Start refresh process
    isRefreshing = true;
    refreshPromise = (async () => {
      try {
        const refreshResponse = await fetch(`${API_URL}/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          // Token refreshed successfully
          isRefreshing = false;
          return true;
        } else {
          // Refresh failed
          isRefreshing = false;
          throw new Error('Session expired. Please login again.');
        }
      } catch (error) {
        isRefreshing = false;
        throw error;
      }
    })();

    try {
      await refreshPromise;
      // Retry original request with new token
      response = await fetch(url, {
        ...options,
        credentials: 'include',
      });
    } catch (error) {
      // Let the component handle the error and redirect
      throw new Error('Session expired. Please login again.');
    }
  }

  return response;
};

export const signup = async (email, password, name) => {
  const response = await fetch(`${API_URL}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email, password, name }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Signup failed');
  }

  return data;
};

export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Login failed');
  }

  return data;
};

export const getProfile = async () => {
  const response = await fetchWithRefresh(`${API_URL}/profile`, {
    method: 'GET',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch profile');
  }

  return data;
};

export const logout = async () => {
  const response = await fetch(`${API_URL}/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Logout failed');
  }

  return data;
};

// Manual refresh token function (for periodic refresh strategy)
export const refreshToken = async () => {
  const response = await fetch(`${API_URL}/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Token refresh failed');
  }

  return data;
};
