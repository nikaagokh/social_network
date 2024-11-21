export class BehaviorSubject {

    constructor(initialvalue) {
        this.value = initialvalue;
        this.listeners = [];
    }

    next(newValue) {
        this.value = newValue;
        this.listeners.forEach(listener => listener(newValue));
    }

    subscribe(listener) {
        this.listeners.push(listener);
        
        listener(this.value);

        return () => {
            this.listeners = this.listeners.filter(l => l!== listener);
        }
    }
}