import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { to, body } = await req.json();

        if (!to || !body) {
            return NextResponse.json({ error: 'Recipient phone number and message body are required' }, { status: 400 });
        }

        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_SENDER_NUMBER;

        if (!accountSid || !authToken || !fromNumber) {
            return NextResponse.json({ 
                error: 'Twilio credentials are not fully configured in environment variables.',
                code: 'KEYS_MISSING'
            }, { status: 400 });
        }

        // Normalize the recipient's phone number
        let formattedTo = to.trim().replace(/\s+/g, ''); // remove spaces
        
        // Ensure starting with '+' (add default +91 for India if only 10 digits provided, etc., but let's be flexible)
        if (/^\d{10}$/.test(formattedTo)) {
            // Assume Indian number if 10 digits
            formattedTo = '+91' + formattedTo;
        } else if (!formattedTo.startsWith('+') && !formattedTo.startsWith('whatsapp:+')) {
            formattedTo = '+' + formattedTo;
        }

        if (!formattedTo.startsWith('whatsapp:')) {
            formattedTo = 'whatsapp:' + formattedTo;
        }

        // Normalize the sender's phone number
        let formattedFrom = fromNumber.trim().replace(/\s+/g, '');
        if (!formattedFrom.startsWith('whatsapp:')) {
            formattedFrom = 'whatsapp:' + formattedFrom;
        }

        // Twilio API URL for sending messages
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

        // Prepare urlencoded form data
        const formData = new URLSearchParams();
        formData.append('To', formattedTo);
        formData.append('From', formattedFrom);
        formData.append('Body', body);

        // Standard Twilio auth header
        const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

        const response = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': authHeader,
            },
            body: formData.toString(),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Twilio Error Response:', data);
            return NextResponse.json({ 
                error: data.message || 'Failed to send WhatsApp message via Twilio.',
                code: 'TWILIO_API_ERROR'
            }, { status: response.status });
        }

        return NextResponse.json({ 
            success: true, 
            messageId: data.sid,
            status: data.status 
        });

    } catch (error: any) {
        console.error('WhatsApp routing error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
