export function disableScroll() {
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;
    document.body.dataset.scrollPosition = scrollPosition;
    document.body.classList.toggle("body-scroll-block");
    document.body.style.top = `-${scrollPosition}px`;
}