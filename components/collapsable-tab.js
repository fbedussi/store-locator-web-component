import { extendComponent } from '../wc-utils.js';

class CollapsableTab extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({mode: 'open'});
        this.render();
    }
    
    render() {
        this.transitionDuration = this.getAttribute('transition-duration') || '400';
        this.displayStyle = this.getAttribute('display-style') || 'block';
    
        this.shadow.innerHTML = /*html*/`
            <style>
                .collapsableTabOuter {
                    overflow: hidden;
                    transition: height ${this.transitionDuration}ms;
                    will-change: height;
                }
            </style>
            <div class="collapsableTabOuter">
                <div class="collapsableTabInner">
                    <slot></slot>
                </div>
            </div>`;        
    
        this.outer = this.shadow.querySelector('.collapsableTabOuter');
        this.inner = this.shadow.querySelector('.collapsableTabInner');
    }

    propertyChangedCallback(name, oldValue, newValue) {
        if (name !== 'open') {
            return;
        }

        if (newValue === true) {
            this.executeOpen();
        } 
        
        if (newValue === false) {
            this.executeClose();
        }
    }

    executeOpen() {
        this.inner.style.display = this.displayStyle;
        
        setTimeout(() => {
            this.outer.style.height = `${this.inner.scrollHeight}px`;
        }, 0);
    }

    executeClose() {    
        setTimeout(() => {
            this.outer.style.height = 0;
        }, 0);
        
        setTimeout(() => {
            this.inner.style.display = 'none';
        }, this.transitionDuration)
    }

    setContent(content) {
        this.inner.innerHTML = content;
    }
}

window.customElements.define('collapsable-tab', extendComponent(CollapsableTab, ['open']));