export default ({icon, label, clickHandler}) => 
/*html*/`<button class="iconButton" onclick="${clickHandler}">
    <span class="icon">${icon}</span>
    <span class="visuallyHidden">${label}</span>
</button>`;