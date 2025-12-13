/**
 * Twilio Type Declaration Stub
 * This allows TypeScript to compile without actual twilio package
 */
declare module 'twilio' {
    const twilio: (accountSid: string, authToken: string) => {
        messages: {
            create: (options: { body: string; from: string; to: string }) => Promise<{ sid: string }>;
        };
    };
    export default twilio;
}
