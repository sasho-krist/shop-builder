/** The decrypted XSRF token Laravel expects in the X-XSRF-TOKEN header. */
export function xsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}
