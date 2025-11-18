# Chatbot Setup Guide

## Overview
The application now includes an AI-powered chatbot that can answer questions about your sales data, campaigns, activities, and performance metrics.

## Features
- 🤖 AI-powered assistant using GPT-4o-mini via custom endpoint
- 📊 Answers questions about campaigns, activities, and revenue
- 🔒 Role-based data access (Sales, GM, Admin)
- 💬 Modern chat interface with floating button
- 🌙 Supports dark/light mode
- 🔗 Uses custom API endpoint: `https://ai.sumopod.com/v1`

## Setup Instructions

### 1. Get API Key
1. Get your API key from your provider
2. The application uses custom endpoint: `https://ai.sumopod.com/v1`
3. Copy the API key (you'll need it in the next step)

### 2. Configure Environment Variable

Create a `.env.local` file in the root directory (if it doesn't exist) and add:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

**Important:** 
- Replace `your_openai_api_key_here` with your actual OpenAI API key
- Never commit `.env.local` to version control (it's already in `.gitignore`)
- Restart your development server after adding the API key

### 3. Restart Development Server

After adding the API key, restart your Next.js development server:

```bash
npm run dev
```

## Usage

### Accessing the Chatbot
1. Log in to the dashboard
2. Look for the floating orange button with a bot icon in the bottom-right corner
3. Click the button to open the chat interface

### What You Can Ask

The chatbot can answer questions about:

- **Campaigns**: "What campaigns do I have?", "Tell me about campaign X"
- **Activities**: "What activities happened this month?", "Show me recent closing activities"
- **Revenue**: "What's my total achievement revenue?", "How much potential revenue do I have?"
- **Performance**: "What's my progress?", "Compare my targets vs achievements"
- **Sales Data**: "Who are my team members?" (for GM/Admin)

### Example Questions

- "What are my campaigns?"
- "How much revenue have I achieved?"
- "What activities happened in January?"
- "Tell me about my latest closing activities"
- "What's my target revenue?"
- "Show me my team's performance" (GM/Admin)

## How It Works

1. **Data Context**: When you ask a question, the system:
   - Fetches relevant data from your database based on your role
   - Includes campaign information, activities, and metrics
   - Provides this context to the AI

2. **AI Processing**: The AI:
   - Analyzes your question
   - Uses the provided data context
   - Generates a helpful response

3. **Role-Based Access**: 
   - **Sales**: Sees only their own data
   - **GM**: Sees data from their team members
   - **Admin**: Sees all data in the system

## Troubleshooting

### Chatbot doesn't respond
- Check if `OPENAI_API_KEY` is set in `.env.local`
- Verify the API key is valid
- Check browser console for errors
- Restart the development server

### "OpenAI API key is not configured" error
- Make sure `.env.local` file exists in the root directory
- Verify the variable name is exactly `OPENAI_API_KEY`
- Restart the development server after adding the key

### Chatbot shows error messages
- Check your API account has available credits
- Verify your API key has proper permissions
- Check network connectivity
- Verify the endpoint `https://ai.sumopod.com/v1` is accessible

### Data not showing correctly
- Ensure you're logged in with the correct role
- Verify you have data in your database
- Check that campaigns and activities exist

## Cost Considerations

- The chatbot uses GPT-4o-mini model via custom endpoint
- Each conversation uses tokens (input + output)
- Monitor your API usage with your provider
- Consider setting usage limits in your account

## Security Notes

- API key is stored server-side only (never exposed to client)
- Data access is controlled by user roles (RLS policies)
- Chat history is not stored (each conversation is independent)
- API calls are made server-side for security

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify environment variables are set correctly
3. Ensure OpenAI API key is valid and has credits
4. Check that you're logged in with proper permissions

