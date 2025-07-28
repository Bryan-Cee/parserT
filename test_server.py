#!/usr/bin/env python3
"""
Simple test server for parserT (SMS Parser App)
Run this on your local machine to test SMS uploads

Usage: python3 test_server.py
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import datetime
import os

class SMSHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/upload-sms':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)

            try:
                data = json.loads(post_data.decode('utf-8'))

                # Log the received SMS
                timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                log_entry = f"[{timestamp}] SMS from {data.get('sender', 'Unknown')}: {data.get('body', '')[:50]}...\n"

                # Save to log file
                with open('sms_log.txt', 'a') as f:
                    f.write(log_entry)

                print(log_entry.strip())

                # Send success response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {'status': 'success', 'message': 'SMS received'}
                self.wfile.write(json.dumps(response).encode())

            except json.JSONDecodeError:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {'status': 'error', 'message': 'Invalid JSON'}
                self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()

            # Read log file
            log_content = ""
            if os.path.exists('sms_log.txt'):
                with open('sms_log.txt', 'r') as f:
                    log_content = f.read()

            html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>parserT Server</title>
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 40px; }}
                    .log {{ background: #f5f5f5; padding: 20px; border-radius: 8px; white-space: pre-wrap; }}
                    h1 {{ color: #333; }}
                </style>
            </head>
            <body>
                <h1>parserT Test Server</h1>
                <p>Server is running and ready to receive SMS uploads.</p>
                <h2>Recent SMS Messages:</h2>
                <div class="log">{log_content or "No messages received yet."}</div>
            </body>
            </html>
            """
            self.wfile.write(html.encode())
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, SMSHandler)
    print("parserT Test Server running on http://localhost:8000")
    print("Configure your app to use: http://YOUR_IP:8000")
    print("Press Ctrl+C to stop")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped")
