# Location Capture Page (Vercel)

This project captures geolocation when the image is clicked and stores it in cloud storage.

## Files

- `index.html`: UI + geolocation capture
- `api/save-location.js`: stores location entries in Upstash Redis
- `api/locations.js`: reads latest location entries

## Deploy and Configure

1. Push this folder to GitHub and import it into Vercel.
2. Create an Upstash Redis database.
3. In Vercel project settings, add these environment variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Redeploy.

## Test

- Open the deployed page and click the image.
- Allow location permission.
- Check saved entries at:
  - `/api/locations`
  - `/api/locations?count=50`

## Notes

- Vercel provides HTTPS by default, required for geolocation.
- If env variables are missing, the API returns an error.
