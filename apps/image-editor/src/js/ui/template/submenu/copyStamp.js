/**
 * @param {Object} submenuInfo - submenu info for make template
 *   @param {Locale} locale - Translate text
 * @returns {string}
 */
export default ({ locale }) => `
    <ul class="tui-image-editor-submenu-item">
        <li class="tui-image-editor-partition only-left-right">
            <div></div>
        </li>
        <li class="tui-image-editor-newline tui-image-editor-range-wrap">
            <label class="range">${locale.localize('Range')}</label>
            <div class="tie-copy-stamp-range"></div>
            <input class="tie-copy-stamp-range-value tui-image-editor-range-value" value="0" />
        </li>
    </ul>
`;
