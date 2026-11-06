/* auth-config.js — sign-in settings for لَمّة | Lamma.  THIS IS THE ONLY FILE YOU EDIT FOR LOGIN.
   ─────────────────────────────────────────────────────────────────────────────────────────────
   Paste each app's *Client ID* between the quotes. A Client ID is public (it is meant to sit in a web page);
   NEVER paste a Client SECRET here — this is a static site and anyone can read this file.

   Every login method sends people back to:   https://YOUR-SITE/account/auth.html
     e.g. https://lamma-site-seven.vercel.app/account/auth.html
   Add exactly that address as the Redirect URL in each developer console (Twitch, Discord, Google).

   A method whose ID is empty (or still a PASTE_… placeholder) shows as a greyed-out button with a small
   note; nothing breaks. "Guest" (just a name) needs no ID and always works.                                  */
window.LAMMA_AUTH_CONFIG = {

  /* Twitch — https://dev.twitch.tv/console/apps → your app → Client ID (keeps the current value) */
  TWITCH_CLIENT_ID: 'fc2d5cxz6n3ogheyqx6sqpbzney4vv',

  /* Discord — https://discord.com/developers/applications → your app → OAuth2 → Client ID (a long number) */
  DISCORD_CLIENT_ID: '',

  /* Google — https://console.cloud.google.com/apis/credentials → OAuth client ID (Web) → Client ID
     (looks like 1234567890-abc123.apps.googleusercontent.com) */
  GOOGLE_CLIENT_ID: '',

  /* Guest = type a display name, saved only in this browser. false hides the button. */
  GUEST: true,

  /* optional: Twitch logins (lower case) allowed to run another channel's panel, e.g. {'iitzmedoo':['some_mod']} */
  TWITCH_MODS: {},

  /* Levels + «لوحة الصدارة» online (optional). Empty = levels still work, saved on each device only.
     Supabase → your project → Project Settings → API (Data API):
       SUPABASE_URL      = "Project URL"            e.g. https://abcdefghijkl.supabase.co
       SUPABASE_ANON_KEY = "anon" "public" key      (the long key marked public; NEVER the service_role / secret key)
     Run supabase/schema.sql once in the SQL editor first. Steps in SETUP_SUPABASE_AR.txt. */
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: ''
};
