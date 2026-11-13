/**
 * hotkeys.js
 * KC3改 shared hotkey handling.
 *
 * Loaded in both game contexts: the DMM game page and the game frame.
 * Swallows bound keys, and forwards all key events to the devtools panel.
 * See Manifest File [manifest.json] under "content_scripts"
 */
(() => {
  "use strict";

  /** Hotkey bindings, kept in sync with the extension config */
  let hotkeyBindings = {};

  /**
   * Get the physical key code of a keyboard event.
   * jQuery 2.2.4 does not copy the native `code` property onto its wrapper.
   * @param {KeyboardEvent|jQuery.Event} ev - keyboard event
   * @returns {string} key code, or an empty string
   */
  const eventCode = (ev) => {
    const code = ev.code || (ev.originalEvent && ev.originalEvent.code) || "";
    return code;
  };

  const isHotkeyBound = (ev) => {
    const code = eventCode(ev);
    const keys = Object.keys(hotkeyBindings);
    const bound = keys.some((key) => {
      const binding = hotkeyBindings[key];
      const match = !!binding
        && !!binding.code
        && binding.code === code
        && Boolean(binding.mod) === Boolean(ev.ctrlKey || ev.metaKey)
        && Boolean(binding.alt) === Boolean(ev.altKey)
        && Boolean(binding.shift) === Boolean(ev.shiftKey);
      return match;
    });
    return bound;
  };

  const updateHotkeyBindings = (config) => {
    if (!config) {
      return;
    }
    const bindings = Object.keys(config).reduce((result, key) => {
      if (key.indexOf("hotkey_") === 0) {
        result[key] = config[key];
      }
      return result;
    }, {});
    hotkeyBindings = bindings;
  };

  const forward = (ev) => {
    const message = new RMsg("devtools", "hotkey", {
      code: eventCode(ev),
      ctrlKey: ev.ctrlKey,
      altKey: ev.altKey,
      shiftKey: ev.shiftKey,
      metaKey: ev.metaKey,
    });
    message.execute();
  };

  /**
   * Start listening for key events.
   * @param {?function(KeyboardEvent|jQuery.Event): boolean} handleLocal -
   *   optional handler for keys this context acts on. Returning true
   *   swallows the key and stops the forward to the devtools panel.
   */
  const init = (handleLocal) => {
    // A content script cannot read extension storage
    const configRequest = new RMsg("service", "getConfig", {}, (response) => {
      updateHotkeyBindings(response && response.value);
    });
    configRequest.execute();

    RMsg.addListener((request) => {
      const isConfigChanged = request.identifier === "kc3_gamescreen"
        && request.action === "configManagerChanged";
      if (isConfigChanged) {
        updateHotkeyBindings(request.config || {});
      }
      return true;
    });

    $(document).on("keydown", (ev) => {
      const handled = !!handleLocal && handleLocal(ev);
      const bound = isHotkeyBound(ev);
      const shouldSwallow = handled || bound;
      if (shouldSwallow) {
        ev.stopPropagation();
        ev.preventDefault();
      }
      if (!handled) {
        forward(ev);
      }
    });
  };

  window.KC3Hotkeys = {
    init,
  };

})();
