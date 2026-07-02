import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { to, subject, body } = await req.json();

        if (!to || !subject || !body) {
            return NextResponse.json({ error: 'Recipient, subject, and email body are required' }, { status: 400 });
        }

        const resendApiKey = process.env.RESEND_API_KEY;

        if (!resendApiKey) {
            return NextResponse.json({ 
                error: 'Resend API key is not configured in environment variables.',
                code: 'KEYS_MISSING'
            }, { status: 400 });
        }

        // Format the message body into beautiful HTML paragraphs
        const formattedHtmlBody = body
            .split('\n\n')
            .map((para: string) => `<p style="margin-bottom: 16px; line-height: 1.6; color: #334155;">${para.replace(/\n/g, '<br />')}</p>`)
            .join('');

        // Construct a highly premium HTML template for the email
        const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
            <style>
                body {
                    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
                    background-color: #f8fafc;
                    margin: 0;
                    padding: 0;
                    -webkit-font-smoothing: antialiased;
                }
                .container {
                    max-width: 600px;
                    margin: 40px auto;
                    background-color: #ffffff;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
                    border: 1px solid #e2e8f0;
                }
                .header {
                    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                    padding: 32px 24px;
                    text-align: center;
                }
                .header-logo {
                    font-size: 24px;
                    font-weight: 800;
                    color: #ffffff;
                    letter-spacing: -0.5px;
                    margin: 0;
                }
                .header-subtitle {
                    font-size: 11px;
                    color: #ffedd5;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    margin: 4px 0 0 0;
                    font-weight: 600;
                }
                .content {
                    padding: 40px 32px;
                }
                .pitch-card {
                    background-color: #f8fafc;
                    border-left: 4px solid #f97316;
                    padding: 24px;
                    border-radius: 0 12px 12px 0;
                    margin-bottom: 32px;
                }
                .cta-button {
                    display: inline-block;
                    background-color: #10b981;
                    color: #ffffff;
                    text-decoration: none;
                    padding: 12px 28px;
                    font-size: 14px;
                    font-weight: 700;
                    border-radius: 8px;
                    text-align: center;
                    transition: background-color 0.2s;
                }
                .footer {
                    background-color: #f1f5f9;
                    padding: 24px 32px;
                    text-align: center;
                    border-top: 1px solid #e2e8f0;
                }
                .footer-text {
                    font-size: 11px;
                    color: #64748b;
                    line-height: 1.5;
                    margin: 0;
                }
                .footer-links {
                    margin-top: 12px;
                }
                .footer-links a {
                    color: #f97316;
                    text-decoration: none;
                    font-size: 11px;
                    margin: 0 8px;
                    font-weight: 600;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 class="header-logo">NayePankh Foundation</h1>
                    <p class="header-subtitle">Outreach & Crowdfunding Initiative</p>
                </div>
                <div class="content">
                    <div class="pitch-card">
                        ${formattedHtmlBody}
                    </div>
                    <div style="text-align: center; margin-top: 8px;">
                        <a href="https://nayepankh.org" class="cta-button">Visit NayePankh Foundation</a>
                    </div>
                </div>
                <div class="footer">
                    <p class="footer-text">
                        This email was sent on behalf of NayePankh Foundation. NayePankh Foundation is a certified, non-profit non-governmental organization (NGO) registered in India. Donations are eligible for tax exemption benefits under Sections 80G and 12A of the Income Tax Act.
                    </p>
                    <div class="footer-links">
                        <a href="https://nayepankh.org">Our Website</a>
                        <a href="https://nayepankh.org/contact">Contact Us</a>
                        <a href="https://nayepankh.org/transparency">Financial Transparency</a>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        // Call Resend REST API
        const resendUrl = 'https://api.resend.com/emails';
        const response = await fetch(resendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
                from: 'NayePankh Foundation <onboarding@resend.dev>', // Free Resend accounts can only send from onboarding@resend.dev to verified emails.
                to: to.trim(),
                subject: subject.trim(),
                html: emailHtml,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Resend Error Response:', data);
            return NextResponse.json({ 
                error: data.message || 'Failed to send email via Resend.',
                code: 'RESEND_API_ERROR'
            }, { status: response.status });
        }

        return NextResponse.json({ 
            success: true, 
            messageId: data.id 
        });

    } catch (error: any) {
        console.error('Email routing error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
