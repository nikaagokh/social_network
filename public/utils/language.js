
export default function lng() {
    const url = window.location.pathname;
    return url.split('/')[1];
}