<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Contact Us</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; color: #222; line-height: 1.5;">
    <h2 style="margin: 0 0 16px;">New Contact Us message</h2>
    <p><strong>Name:</strong> {{ $payload['first_name'] }}</p>
    <p><strong>Email:</strong> {{ $payload['email'] }}</p>
    <p><strong>Message:</strong></p>
    <p style="white-space: pre-wrap; background: #f6f6f6; padding: 12px; border-radius: 8px;">{{ $payload['message'] }}</p>
</body>
</html>
