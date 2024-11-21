export function enableScroll() {
    const scrollPosition = parseInt(document.body.dataset.scrollPosition || '0', 10);
    document.body.classList.toggle("body-scroll-block");
    document.body.style.top = '';
    window.scrollTo(0, scrollPosition);
    delete document.body.dataset.scrollPosition;
}