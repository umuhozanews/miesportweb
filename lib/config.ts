/**
 * Global configuration options for the Miesport Web application.
 */

// If FREE_MODE is active:
// - Outbound HLS proxying through serverless functions is disabled to prevent bandwidth bills.
// - All HLS streams will be accessed directly by the viewer's browser.
// - Embed streams (iframes) are prioritized at the top of the stream list to ensure 0-bandwidth operations.
export const FREE_MODE = process.env.NEXT_PUBLIC_FREE_MODE !== "false";
