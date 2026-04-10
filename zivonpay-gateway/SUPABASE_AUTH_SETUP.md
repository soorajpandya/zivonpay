# Supabase Authentication Setup

This document explains how to configure and use Supabase authentication in the ZivonPay Gateway application.

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up or log in
2. Create a new project
3. Wait for the project to be fully set up

### 2. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **Anon/Public Key** (the `anon` `public` key)

### 3. Configure Environment Variables

1. Open the `.env` file in the project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

⚠️ **Important**: Never commit the `.env` file to version control. It's already included in `.gitignore`.

### 4. Set Up Authentication in Supabase

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider (it's usually enabled by default)
3. Configure email templates as needed in **Authentication** → **Email Templates**
4. Optional: Set up additional providers (Google, GitHub, etc.) if needed

### 5. Create Your First User

You have two options:

**Option A: Sign up through the application**
- The app will create a new user in Supabase automatically

**Option B: Create user manually in Supabase**
1. Go to **Authentication** → **Users** in Supabase dashboard
2. Click "Add user" → "Create new user"
3. Enter email and password
4. Click "Create user"

## Usage

### Sign In

Users can sign in at `/login` route using their email and password.

### Using Auth in Components

The authentication state is available throughout the app via the `useAuth` hook:

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, signOut } = useAuth();

  return (
    <div>
      {user ? (
        <>
          <p>Logged in as: {user.email}</p>
          <button onClick={signOut}>Sign Out</button>
        </>
      ) : (
        <p>Not logged in</p>
      )}
    </div>
  );
}
```

### Available Auth Methods

- `signIn(email, password)` - Sign in with email and password
- `signUp(email, password)` - Create a new user account
- `signOut()` - Sign out the current user
- `resetPassword(email)` - Send password reset email
- `user` - Current user object (null if not authenticated)
- `session` - Current session object
- `loading` - Boolean indicating if auth state is being loaded

## Protected Routes

To protect routes, you can create a protected route component:

```tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}
```

Then use it in your routes:

```tsx
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  } 
/>
```

## Troubleshooting

### "Missing Supabase environment variables" Error

- Make sure your `.env` file exists and contains the correct values
- Restart the development server after adding environment variables

### Users Can't Sign In

- Check that the email provider is enabled in Supabase
- Verify the user exists in **Authentication** → **Users**
- Check the browser console for specific error messages

### Email Confirmation Issues

By default, Supabase requires email confirmation. To disable this for development:
1. Go to **Authentication** → **Providers** → **Email**
2. Disable "Confirm email"

## Security Notes

- Never expose your Supabase service role key in client-side code
- Only use the `anon` key in your frontend application
- Always use Row Level Security (RLS) policies in Supabase to protect your data
- The `anon` key is safe to use in the frontend as it only has limited permissions

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/auth-signin)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
