export function renderBottomConditionally() {
    const shouldRender = window.innerWidth < 992;
    const component = document.querySelector('.bottom-container');
    console.log(shouldRender);
    console.log(component)
    if(shouldRender) {
        component.style.display = 'flex';
    } else {
        component.style.display = 'none';
    }
}

export function renderFixedPriceConditionally() {
    const shouldRender = window.innerWidth < 992;
    const component = document.querySelector('.fixedprice-container');
    console.log(component)
    if(shouldRender) {
        component.style.display = 'flex';
    } else {
        component.style.display = 'none';
    }
}

export function renderPriceConditionally() {
    const shouldRender = window.innerWidth >=992;
    const component = document.querySelector(".price-container");
    if(shouldRender) {
        component.style.display = 'block';
    } else {
        component.style.display = 'none';
    }
}

export function renderCartPriceConditionally() {
    const shouldRender = window.innerWidth < 992;
    const component = document.querySelector(".cartPrice-container");
    if(shouldRender) {
        component.style.display = 'block';
    } else {
        component.style.display = 'none';
    }
}