
import { defineConfig } from 'vite';

// This configuration is essential for using environment variables in a Vite project
// that are not prefixed with VITE_. It bridges the gap between the requirement
// of using process.env.API_KEY in the application code and Vite's security model
// of only exposing VITE_* prefixed variables to the client.
// Vercel (or any other build environment) will set VITE_API_KEY, which is then
// made available to this config file via process.env.
// The define property performs a direct text replacement in the code during build.
// JSON.stringify is used to ensure the API key string is correctly quoted.
export default defineConfig({
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.VITE_API_KEY),
  },
});
