import hbs from 'hbs';
import { __dirname } from '../../index.js';

export const configureHbs = () => {
    hbs.registerPartials(__dirname + '/src/views/partials');
    hbs.registerHelper("json", function(value) {
        return JSON.stringify(value);
    })
    hbs.registerHelper("purl", function(value) {
        return "http://localhost:3005/public/images/product/" + value;
    })
    hbs.registerHelper("curl", function(value) {
        return "http://localhost:3005/public/images/logos/" + value;
    })
    hbs.registerHelper("surl", function(value) {
        return "http://localhost:3005/public/images/categories/" + value;
    })
    hbs.registerHelper("aurl", function(value) {
        return "http://localhost:3005/public/images/assets/" + value;
    })
    hbs.registerHelper("isCurrentPage", function(page, currentPage) {
        return page === currentPage;  
    })
    hbs.registerHelper("")
    
    hbs.registerHelper('compare', function (v1, operator, v2, options) {
   
        function compareHelper(v1, operator, v2) {
            switch (operator) {
                case '==':
                    return (v1 == v2);
                case '===':
                    return (v1 === v2);
                case '!=':
                    return (v1 != v2);
                case '!==':
                    return (v1 !== v2);
                case '<':
                    return (v1 < v2);
                case '<=':
                    return (v1 <= v2);
                case '>':
                    return (v1 > v2);
                case '>=':
                    return (v1 >= v2);
                case '&&':
                    return (v1 && v2);
                case '||':
                    return (v1 || v2);
                default:
                    return false;
            }
        }
    
        if (compareHelper(v1, operator, v2)) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });
    hbs.registerHelper("priceHelper", function(product) {
        const newPrice = product.price - (product.price * (product.discount/100)); 
        return {newPrice:newPrice, oldPrice:product.price, discountPrice: product.price - newPrice};
    });

    hbs.registerHelper("pagesToShow", function(pages, page) {
        const pageCount = 5;
        const halfPageCount = Math.floor(pageCount / 2);
        let startPage;
        if(page < 5) {
          startPage = 1;
        } else if (page + 2 > pages.length){
          startPage = pages.length - 4;
        } else {
          startPage = Math.max(1, page - halfPageCount);
        }
        const endPage = Math.min(pages.length, startPage + pageCount - 1);
        return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  })

  hbs.registerHelper("detectMode", function(mode) {
    if(mode === 'dark') {
        return 'dark';
    } else {
        return 'light';
    }
  })

  hbs.registerHelper("isChecked", function(mode) {
    if(mode === 'dark') {
        return 'checked';
    } else {
        return ''    
    }
  })

  hbs.registerHelper("pagination", function(pages) {
    if(pages.length > 0) {
        return 'block';
    } else {
        return 'none';
    }
  })

  hbs.registerHelper("activeLng", function(type, lng) {
    if(type === lng) {
        return 'active';
    } else {
        return '';
    }
  })
  hbs.registerHelper("isEnglish", function(lng) {
    return lng === 'en';
  })

  hbs.registerHelper("ifMobile", function (width, options) {
    if(width < 992) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
  })

  hbs.registerHelper("ifDesktop", function(width, options) {
    if(width >= 992) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
  })
  hbs.registerHelper("notEmpty", function(products, options) {
    if(products.length > 0) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
  })

  hbs.registerHelper("getClass", function(index) {
    if(index === 0) {
        return 'middle-left';
    } else if(index === 1) {
        return 'slider3d-active';
    } else {
        return 'middle-right';
    }
  })
  hbs.registerHelper("isVisible", function(index) {
    if(index === 0 || index === 1 || index === 2) {
        return 'block';
    } else {
        return 'none';
    }
  })
  hbs.registerHelper("showIcon", function(star, rate) {
    console.log(star);
    console.log(rate);
    if(rate>=star) {
        return 'star';
    } else {
        return 'star_border'
    }
  })
  hbs.registerHelper("contentWidth", function(size) {
    console.log(size);
    if(size >= 992) {
        return 'account-desk';
    } else {
        return 'account-mob';
    }
  })

  
}

