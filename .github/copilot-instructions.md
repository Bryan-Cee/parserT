# Copilot Instructions for parserT (SMS Parser App)

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a React Native Android app that listens to incoming SMS messages from specific senders and automatically uploads them to a remote server.

## Project Structure

- React Native 0.80.2 with TypeScript
- Android-specific implementation (no iOS support needed)
- Native Android code for SMS listening using BroadcastReceiver
- REST API integration for uploading messages

## Key Features

- SMS permissions handling (RECEIVE_SMS, READ_SMS, INTERNET)
- BroadcastReceiver for incoming SMS detection
- Whitelist filtering for specific senders (M-PESA, Safaricom, IM BANK, etc.)
- Automatic upload to remote server endpoint
- Clean UI with message list display
- Error handling and retry mechanisms

## Architecture Patterns

- Use React Native with TypeScript
- Native Android modules for SMS handling
- State management with React hooks
- Clean separation between UI and business logic

## Code Style

- TypeScript strict mode
- Functional components with hooks
- Proper error handling and logging
- Follow React Native and Android best practices
