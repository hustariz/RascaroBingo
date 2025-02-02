# RascaroBingo
Bingo style, help trading application

## API Testing

When testing API endpoints:
1. Use the example files in `backend/requests/examples/` as templates
2. Create your own `.rest` files in `backend/requests/` (they will be ignored by git)
3. Never commit real credentials or sensitive data
4. Use environment variables for sensitive data:
   - Copy `backend/requests/.env.example` to `backend/requests/.env`
   - Add your test values to `.env`
   - The `.env` file is gitignored and won't be committed
