export class Intersect {
    constructor(element, options = {}) {
        this.element = element;
        this.options = options;
        this.observer = null;
        this.notifier$ = document.createElement('div');
        this.handleIntersect = this.handleIntersect.bind(this);
        this.initObserver();
    }

    initObserver() {
        this.observer = new IntersectionObserver(this.handleIntersect, this.options);

        if(this.element) {
            this.observer.observe(this.element);
        }
    }
    handleIntersect(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.notifier$.dispatchEvent(new CustomEvent('intersected', {detail:true}));
            } else {
                this.notifier$.dispatchEvent(new CustomEvent('intersected', {detail:false}));
            }
        });
    }

}