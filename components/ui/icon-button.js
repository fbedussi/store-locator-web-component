export default ({icon, label, clickHandler, cssClass}) => 
/*html*/`<button class="${`iconButton${cssClass? ' ' + cssClass : ''}`}" onclick="${clickHandler}">
    <span class="icon">${icon}</span>
    <span class="visuallyHidden">${label}</span>
</button>`;