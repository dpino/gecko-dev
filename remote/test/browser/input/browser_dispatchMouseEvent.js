/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

add_task(async function testDispatchMouseEvent(client) {
  await loadURL(toDataURL("<div>foo</div>"));

  const { Input } = client;

  await SpecialPowers.spawn(gBrowser.selectedBrowser, [], function() {
    const div = content.document.querySelector("div");
    this.mouseDownPromise = new Promise(resolve => {
      div.addEventListener("mousedown", resolve, { once: true });
    });
    this.mouseUpPromise = new Promise(resolve => {
      div.addEventListener("mouseup", resolve, { once: true });
    });
    this.clickPromise = new Promise(resolve => {
      div.addEventListener("click", resolve, { once: true });
    });
  });

  const { x, y } = await SpecialPowers.spawn(
    gBrowser.selectedBrowser,
    [],
    () => {
      return content.document.querySelector("div").getBoundingClientRect();
    }
  );

  await Input.dispatchMouseEvent({
    type: "mousePressed",
    x,
    y,
  });

  info("Waiting for DOM mousedown event on the div");
  await SpecialPowers.spawn(gBrowser.selectedBrowser, [], function() {
    return this.mouseDownPromise;
  });

  await Input.dispatchMouseEvent({
    type: "mouseReleased",
    x,
    y,
  });

  info("Waiting for DOM mouseup event on the div");
  await SpecialPowers.spawn(gBrowser.selectedBrowser, [], function() {
    return this.mouseUpPromise;
  });

  info("Waiting for DOM click event on the div");
  await SpecialPowers.spawn(gBrowser.selectedBrowser, [], function() {
    return this.clickPromise;
  });

  ok(true, "All events detected");
});
